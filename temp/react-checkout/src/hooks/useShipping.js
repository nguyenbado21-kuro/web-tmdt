// hooks/useShipping.js
// Hook quản lý logic tính phí ship, tự động re-fetch khi địa chỉ thay đổi

import { useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchShippingRates, setSelectedShipping } from '../store/checkoutSlice';

export const useShipping = () => {
  const dispatch = useDispatch();
  const { address, products, subTotal, shippingRates, selectedShipping, shippingLoading } =
    useSelector((s) => s.checkout);

  // Debounce ref để tránh gọi API liên tục khi user đang nhập
  const debounceRef = useRef(null);

  const fetchRates = useCallback(() => {
    // Cần đủ city + state mới gọi API (giống checkAddress() trong Laravel)
    if (!address.city || !address.state) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      dispatch(
        fetchShippingRates({
          address_to: {
            city: address.city,
            state: address.state,
            ward: address.ward,
            address: address.address,
          },
          weight: products.reduce((sum, p) => sum + (p.weight || 0) * p.qty, 0),
          order_total: subTotal,
        })
      );
    }, 600);
  }, [address.city, address.state, address.ward, subTotal, dispatch]);

  // Auto re-fetch khi địa chỉ thay đổi
  useEffect(() => {
    fetchRates();
    return () => clearTimeout(debounceRef.current);
  }, [fetchRates]);

  const selectRate = useCallback(
    (rate) => {
      dispatch(
        setSelectedShipping({
          option: rate.type,
          method: `${rate.company_name}-${rate.type}`,
          price: rate.price,
        })
      );
    },
    [dispatch]
  );

  return { shippingRates, selectedShipping, shippingLoading, selectRate, fetchRates };
};
