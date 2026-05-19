/**
 * shippo/api.ts
 * Mirror Luồng B (Shippo-style getRates):
 *   ShipGhtk::getRates() + ShipViettelPost::getRates()
 *   → getCacheOrNewRates() → createShipment(isCreate=false) → getOptionsShip()
 *
 * Luồng B được dùng trong postCheckout() để validate lại phí ship chính xác.
 * Frontend gọi: POST /shipping/rates (backend delegate sang ShipGhtk/ShipViettelPost)
 */

import { apiRequest } from '../shared/request';
import { ShippoRatesRequest, ShippoRatesResponse, ShippoRateItem } from './types';

export interface GetRatesResult {
  rates: ShippoRateItem[];
  error?: string;
}

/**
 * Lấy rates theo Shippo-style (Luồng B).
 * Backend sẽ:
 *   1. apply_filters('handle_shipping_fee', [], $data)
 *   2. ShipGhtk::getRates() + ShipViettelPost::getRates() song song
 *   3. Lấy giá thấp nhất nếu cùng type
 *   4. Cache kết quả
 *
 * isCreate=false → chỉ lấy giá, không tạo đơn vận chuyển thực tế
 */
export async function getShippoRates(req: ShippoRatesRequest): Promise<GetRatesResult> {
  const res = await apiRequest<ShippoRatesResponse>('/shipping/rates', {
    method: 'POST',
    body: JSON.stringify(req),
  });

  if (res.success && res.data?.shipment?.rates) {
    return { rates: Object.values(res.data.shipment.rates) };
  }

  return { rates: [], error: res.error };
}

/**
 * Normalize Shippo rates → ShippingOption format
 * Lọc bỏ disabled rates (không khả dụng với COD)
 */
export function normalizeShippoRates(rates: ShippoRateItem[]) {
  return rates
    .filter(r => !r.disabled)
    .map(r => ({
      id: r.type,
      name: r.name,
      provider: r.company_name,
      fee: r.price,
      estimatedDays: getEstimatedDays(r.type),
    }));
}

function getEstimatedDays(type: string): string {
  switch (type) {
    case 'ship_ghht': return 'Trong ngày';
    case 'ship_ghn':  return '1-2 ngày';
    case 'ship_ghtk': return '3-5 ngày';
    default:          return '2-5 ngày';
  }
}
