/**
 * useShipping.ts
 * Auto fetch phí ship khi địa chỉ thay đổi (debounce 600ms).
 * Dùng aggregateShippingFees() — mirror HandleShippingFeeService Luồng A.
 */

import { useEffect, useRef } from 'react';
import { useCheckoutContext } from '../store/checkoutContext';
import { aggregateShippingFees } from '../plugins/shared/shippingAggregator';

/** Ước tính weight từ số lượng sản phẩm (300g/item, tối thiểu 500g) */
function estimateWeight(totalItems: number): number {
  return Math.max(500, totalItems * 300);
}

export function useShipping(totalItems: number) {
  const { state, dispatch } = useCheckoutContext();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const addr = state.address;
    if (!addr?.province || !addr?.district) return;

    // Debounce 600ms — tránh gọi API liên tục khi user đang chọn địa chỉ
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      dispatch({ type: 'SET_SHIPPING_LOADING', loading: true });
      try {
        const options = await aggregateShippingFees({
          province: addr.province,
          district: addr.district,
          ward: addr.ward,
          weight: estimateWeight(totalItems),
          orderTotal: 0, // orderTotal không cần thiết cho tính phí
        });
        dispatch({ type: 'SET_SHIPPING_OPTIONS', options });
      } finally {
        dispatch({ type: 'SET_SHIPPING_LOADING', loading: false });
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [state.address, totalItems]);
}
