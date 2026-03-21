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
import { ViettelPostRateItem, VIETTELPOST_SERVICES } from './types';

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
export async function calculateViettelPostFee(
  req: ViettelPostCalculateRequest
): Promise<ViettelPostCalculateResult> {
  const res = await apiRequest<ViettelPostRateItem[]>('/shipping/viettelpost/calculate', {
    method: 'POST',
    body: JSON.stringify({
      address_to: {
        city:       req.province,   // dùng cho validation (address_to.city required)
        state:      req.district,   // dùng cho validation (address_to.state required)
        state_name: req.province,   // ViettelPost::getDataShip() → RECEIVER_PROVINCE (tỉnh)
        city_name:  req.district,   // ViettelPost::getDataShip() → RECEIVER_DISTRICT (huyện)
      },
      weight:      req.weight,
      order_total: req.orderTotal,
    }),
  });

  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    return { rates: res.data };
  }

  // Fallback: trả về options với fee=0
  return {
    rates: VIETTELPOST_SERVICES.map(s => ({
      id: `vtp_${s.codeShip}_${Date.now()}`,
      price: 0,
      name: s.textShip,
      company_name: 'SHIP_VIETTEL_POST' as const,
      shipment_id: '',
      type: s.codeShip,
    })),
    error: res.error,
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
