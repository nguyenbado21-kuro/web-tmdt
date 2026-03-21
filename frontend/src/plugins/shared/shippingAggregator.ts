/**
 * shippingAggregator.ts
 * Mirror HandleShippingFeeService::execute() — Luồng A async
 *
 * Backend flow:
 *   apply_filters('handle_shipping_fee_async', [], $data)
 *     ├── Ghtk::callPriceAll()       → yield 2 Promise (road, fly)
 *     └── ViettelPost::callPriceAll() → yield 3 Promise (VHT, LCOD, NCOD)
 *   Promise::settle()->wait()  — chờ tất cả 5 request song song
 *   Lấy giá thấp nhất theo type → cache 24h
 *
 * Frontend gọi 2 backend proxies song song (Promise.allSettled),
 * sau đó merge + lấy giá thấp nhất theo type — đúng logic backend.
 */

import { calculateGhtkFee, normalizeGhtkRates, GhtkCalculateRequest } from '../shipghtk/api';
import { calculateViettelPostFee, normalizeViettelPostRates } from '../shipviettelpost/api';
import { ShippingOption, ShippingOptionId } from '../../services/checkoutTypes';

export interface AggregateShippingRequest {
  province: string;
  district: string;
  ward?: string;
  weight: number;     // gram
  orderTotal: number;
}

/**
 * Gọi GHTK + ViettelPost song song (Promise.allSettled),
 * merge kết quả, lấy giá thấp nhất theo type.
 * Đây là mirror của HandleShippingFeeService Luồng A.
 */
export async function aggregateShippingFees(
  req: AggregateShippingRequest
): Promise<ShippingOption[]> {
  const ghtkReq: GhtkCalculateRequest = {
    province: req.province,
    district: req.district,
    ward: req.ward,
    weight: req.weight,
    orderTotal: req.orderTotal,
  };

  // Gọi song song — mirror Promise::settle()->wait()
  const [ghtkResult, vtpResult] = await Promise.allSettled([
    calculateGhtkFee(ghtkReq),
    calculateViettelPostFee({ province: req.province, district: req.district, weight: req.weight, orderTotal: req.orderTotal }),
  ]);

  // Collect tất cả options
  const allOptions: ShippingOption[] = [];

  if (ghtkResult.status === 'fulfilled' && ghtkResult.value.rates.length) {
    allOptions.push(...normalizeGhtkRates(ghtkResult.value.rates));
  }
  if (vtpResult.status === 'fulfilled' && vtpResult.value.rates.length) {
    allOptions.push(...normalizeViettelPostRates(vtpResult.value.rates));
  }

  // Lấy giá thấp nhất theo type — mirror logic HookServiceProvider::handleShippingFeeAsync
  const lowestByType = new Map<ShippingOptionId, ShippingOption>();
  for (const opt of allOptions) {
    const existing = lowestByType.get(opt.id);
    if (!existing || (opt.fee > 0 && opt.fee < existing.fee)) {
      lowestByType.set(opt.id, opt);
    }
  }

  // Sắp xếp: Tiết Kiệm → Nhanh → Hỏa Tốc
  const ORDER: ShippingOptionId[] = ['ship_ghtk', 'ship_ghn', 'ship_ghht'];
  const result = ORDER
    .map(id => lowestByType.get(id))
    .filter((o): o is ShippingOption => !!o);

  // Fallback nếu cả 2 API đều fail
  if (result.length === 0) {
    return [
      { id: 'ship_ghtk', name: 'Tiết Kiệm',  provider: 'SHIP_GHTK',         fee: 0, estimatedDays: '3-5 ngày' },
      { id: 'ship_ghn',  name: 'Nhanh',       provider: 'SHIP_GHTK',         fee: 0, estimatedDays: '1-2 ngày' },
      { id: 'ship_ghht', name: 'Hỏa Tốc',     provider: 'SHIP_VIETTEL_POST', fee: 0, estimatedDays: 'Trong ngày' },
    ];
  }

  return result;
}
