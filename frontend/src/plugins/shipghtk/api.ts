/**
 * shipghtk/api.ts
 * Mirror logic từ Ghtk.php::getPriceAll() + getPriceAsyncByServiceCode()
 *
 * Backend endpoint: POST /api/v1.0/shipping/ghtk/calculate
 * Controller: ShippingApiController::calculateGhtk() → buildShippingData() → Ghtk::getDataShip()
 *
 * Data flow trong backend:
 *   request.address_to.city  → resolveAddressNames() → address_to.city_name  → Ghtk "district"
 *   request.address_to.state → resolveAddressNames() → address_to.state_name → Ghtk "province"
 *
 * resolveAddressNames() chỉ resolve khi có ward ID.
 * Nếu frontend gửi tên trực tiếp → phải gửi city_name/state_name để Ghtk::getDataShip() đọc đúng.
 *
 * Request body:
 *   {
 *     address_to: { city, state, ward, city_name, state_name },
 *     weight, order_total
 *   }
 *
 * Response: { error: false, data: [ { type, price, name, company_name, shipment_id, ... } ] }
 */

import { apiRequest } from '../shared/request';
import { ShippingOption } from '../../services/checkoutTypes';
import { GhtkRateItem, GHTK_SERVICES } from './types';

export interface GhtkCalculateRequest {
  province: string;   // tỉnh giao hàng (tên)
  district: string;   // huyện giao hàng (tên)
  ward?: string;
  weight: number;     // gram
  orderTotal: number; // giá trị COD
}

export interface GhtkCalculateResult {
  rates: GhtkRateItem[];
  error?: string;
}

/**
 * Gọi backend proxy để tính phí GHTK.
 * Backend chạy Ghtk::callPriceAll() — 2 Promise async song song:
 *   road → ship_ghtk (Tiết Kiệm)
 *   fly  → ship_ghn  (Nhanh)
 *
 * Ghtk::getDataShip() đọc address_to.state_name (tỉnh) và address_to.city_name (huyện).
 * Frontend gửi cả city/state (cho validation) lẫn city_name/state_name (cho Ghtk).
 */
export async function calculateGhtkFee(req: GhtkCalculateRequest): Promise<GhtkCalculateResult> {
  const res = await apiRequest<GhtkRateItem[]>('/shipping/ghtk/calculate', {
    method: 'POST',
    body: JSON.stringify({
      address_to: {
        city:       req.province,   // dùng cho validation (address_to.city required)
        state:      req.district,   // dùng cho validation (address_to.state required)
        ward:       req.ward ?? '',
        state_name: req.province,   // Ghtk::getDataShip() → GHTK param "province" (tỉnh)
        city_name:  req.district,   // Ghtk::getDataShip() → GHTK param "district" (huyện)
      },
      weight:      req.weight,
      order_total: req.orderTotal,
    }),
  });

  if (res.success && Array.isArray(res.data) && res.data.length > 0) {
    return { rates: res.data };
  }

  // Fallback: trả về options với fee=0 để UI vẫn hiển thị
  return {
    rates: GHTK_SERVICES.map(s => ({
      id: `ghtk_${s.codeShip}_${Date.now()}`,
      price: 0,
      name: s.textShip,
      company_name: 'SHIP_GHTK' as const,
      shipment_id: '',
      type: s.codeShip,
    })),
    error: res.error,
  };
}

/**
 * Normalize GHTK rate → ShippingOption (dùng trong checkoutContext)
 * Mapping: ship_ghtk=road=Tiết Kiệm, ship_ghn=fly=Nhanh
 */
export function normalizeGhtkRates(rates: GhtkRateItem[]): ShippingOption[] {
  return rates.map(rate => {
    const svc = GHTK_SERVICES.find(s => s.codeShip === rate.type);
    return {
      id: rate.type,
      name: rate.name,
      provider: 'SHIP_GHTK' as const,
      fee: rate.price,
      estimatedDays: svc?.estimatedDays ?? '2-5 ngày',
    };
  });
}
