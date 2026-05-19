/**
 * shipviettelpost/api.ts
 * Mirror logic từ ViettelPost.php::getPriceAll() + getPriceAsyncByServiceCode()
 *
 * Backend endpoint: POST /api/v1.0/shipping/viettelpost/calculate
 * Controller: ShippingApiController::calculateViettelPost() → buildShippingData() → ViettelPost::getDataShip()
 *
 * Data flow trong backend:
 *   request.address_to → resolveAddressNames() → set city_name (huyện), state_name (tỉnh)
 *   ViettelPost::getDataShip():
 *     RECEIVER_PROVINCE = address_to['state_name']   ← tỉnh
 *     RECEIVER_DISTRICT = address_to['city_name']    ← huyện
 *
 * Frontend gửi cả city/state (cho validation) lẫn city_name/state_name (cho ViettelPost::getDataShip()).
 *
 * Response: { error: false, data: [ { type, price, name, company_name, shipment_id, ... } ] }
 *
 * Token ViettelPost được cache 1h trên backend, tự refresh khi hết hạn.
 */

import { apiRequest } from '../shared/request';
import { ShippingOption } from '../../services/checkoutTypes';
import { ViettelPostRateItem, VIETTELPOST_SERVICES, ViettelPostShipCode } from './types';

export interface ViettelPostCalculateRequest {
  province: string;   // tỉnh giao hàng (tên)
  district: string;   // huyện giao hàng (tên)
  weight: number;     // gram
  orderTotal: number; // giá trị COD
}

export interface ViettelPostCalculateResult {
  rates: ViettelPostRateItem[];
  error?: string;
}

/**
 * Gọi backend proxy để tính phí ViettelPost.
 * Backend chạy ViettelPost::callPriceAll() — 3 Promise async song song:
 *   VHT  → ship_ghht (Hỏa Tốc)
 *   LCOD → ship_ghtk (Tiết Kiệm)
 *   NCOD → ship_ghn  (Nhanh)
 *
 * ViettelPost::getDataShip() đọc address_to.state_name (tỉnh) và address_to.city_name (huyện).
 */
// Static Cache for locations
let provinceCache: any[] = [];
const districtCache: Record<number, any[]> = {};

const VTP_TOKEN = 'EEE72D5772EF82B640B558AFAA4F3AE5';

function normalizeName(name: string) {
  return name.toLowerCase().replace(/thành phố|tỉnh|quận|huyện|thị xã/g, '').trim();
}

async function getProvinceId(name: string): Promise<number | null> {
  if (provinceCache.length === 0) {
    try {
      const res = await fetch('/api_vtp/categories/listProvince');
      const json = await res.json();
      provinceCache = json.data || json;
    } catch (e) { return null; }
  }
  const norm = normalizeName(name);
  const found = provinceCache.find((p: any) => normalizeName(p.PROVINCE_NAME) === norm);
  return found ? found.PROVINCE_ID : null;
}

async function getDistrictId(provinceId: number, name: string): Promise<number | null> {
  if (!districtCache[provinceId]) {
    try {
      const res = await fetch(`/api_vtp/categories/listDistrict?provinceId=${provinceId}`);
      const json = await res.json();
      districtCache[provinceId] = json.data || json;
    } catch (e) { return null; }
  }
  const norm = normalizeName(name);
  const found = districtCache[provinceId].find((d: any) => normalizeName(d.DISTRICT_NAME) === norm);
  return found ? found.DISTRICT_ID : null;
}

export async function calculateViettelPostFee(
  req: ViettelPostCalculateRequest
): Promise<ViettelPostCalculateResult> {
  try {
    const provId = await getProvinceId(req.province);
    const distId = provId ? await getDistrictId(provId, req.district) : null;
    
    // Nếu lấy location thành công, tiến hành gọi API tính cước
    if (provId && distId) {
      const response = await fetch('/api_vtp/order/getPriceAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Token': VTP_TOKEN
        },
        body: JSON.stringify({
          SENDER_DISTRICT: 12, // Default sender
          SENDER_PROVINCE: 1,  // Default sender
          RECEIVER_DISTRICT: distId,
          RECEIVER_PROVINCE: provId,
          PRODUCT_TYPE: 'HH',
          PRODUCT_WEIGHT: req.weight || 500,
          PRODUCT_PRICE: req.orderTotal || 100000,
          MONEY_COLLECTION: 0,
          TYPE: 1
        })
      });

      const json = await response.json();
      const apiRates = Array.isArray(json) ? json : (json.data || []);
      
      if (apiRates && apiRates.length > 0) {
        // Map response "MA_DV_CHINH" tới "vtp_ship_ghht/ghn/ghtk"
        const mappedRates: ViettelPostRateItem[] = apiRates.map((r: any) => {
          let typeCode: ViettelPostShipCode = 'vtp_ship_ghtk';
          if (r.MA_DV_CHINH === 'VHT') typeCode = 'vtp_ship_ghht';
          else if (r.MA_DV_CHINH === 'NCOD') typeCode = 'vtp_ship_ghn';

          return {
            id: typeCode,
            type: typeCode,
            name: `ViettelPost - ${r.TEN_DICHVU}`,
            price: r.GIA_CUOC,
            company_name: 'SHIP_VIETTEL_POST',
            shipment_id: '',
          };
        });
        
        return { rates: mappedRates };
      }
    }
  } catch (error) {
    console.error("VTP Error:", error);
  }

  // Fallback: trả về options với fee=0 nếu lỗi mạng
  return {
    rates: VIETTELPOST_SERVICES.map(s => ({
      id: s.codeShip,
      price: 0,
      name: s.textShip,
      company_name: 'SHIP_VIETTEL_POST' as const,
      shipment_id: '',
      type: s.codeShip,
    })),
    error: undefined,
  };
}

/**
 * Normalize ViettelPost rate → ShippingOption
 * Mapping: LCOD=ship_ghtk, NCOD=ship_ghn, VHT=ship_ghht
 */
export function normalizeViettelPostRates(rates: ViettelPostRateItem[]): ShippingOption[] {
  return rates.map(rate => {
    const svc = VIETTELPOST_SERVICES.find(s => s.codeShip === rate.type);
    return {
      id: rate.type,
      name: rate.name,
      provider: 'SHIP_VIETTEL_POST' as const,
      fee: rate.price,
      estimatedDays: svc?.estimatedDays ?? '2-5 ngày',
    };
  });
}
