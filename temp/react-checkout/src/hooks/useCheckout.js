// hooks/useCheckout.js
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  saveInformation,
  submitCheckout,
  applyDiscountCoupon,
  removeDiscountCoupon,
  setStep,
  clearError,
  selectOrderTotal,
} from '../store/checkoutSlice';

export const useCheckout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const state = useSelector((s) => s.checkout);
  const orderTotal = useSelector(selectOrderTotal);

  // Bước 1: Lưu thông tin địa chỉ → chuyển sang bước payment
  const handleSaveInformation = useCallback(
    async (addressData) => {
      const result = await dispatch(
        saveInformation({
          token: state.token,
          payload: {
            address: addressData,
            items: state.products.map((p) => ({ id: p.id, qty: p.qty })),
          },
        })
      );
      return !result.error;
    },
    [dispatch, state.token, state.products]
  );

  // Bước 2: Đặt hàng + thanh toán
  const handleSubmitCheckout = useCallback(
    async () => {
      if (!state.selectedShipping) {
        return { error: true, message: 'Vui lòng chọn phương thức vận chuyển' };
      }
      if (!state.paymentMethod) {
        return { error: true, message: 'Vui lòng chọn phương thức thanh toán' };
      }

      const result = await dispatch(
        submitCheckout({
          token: state.token,
          payload: {
            payment_method: state.paymentMethod,
            shipping_method: state.selectedShipping.method,
            shipping_option: state.selectedShipping.option,
            address: state.address,
            coupon_code: state.appliedCoupon?.code || null,
          },
        })
      );

      if (result.payload?.checkoutUrl) {
        // Redirect sang payment gateway (VNPay, Stripe...)
        window.location.href = result.payload.checkoutUrl;
        return { error: false };
      }

      if (!result.error) {
        navigate(`/checkout/${state.token}/success`);
        return { error: false };
      }

      return { error: true, message: result.payload?.message };
    },
    [dispatch, navigate, state]
  );

  const handleApplyCoupon = useCallback(
    (code) => dispatch(applyDiscountCoupon({ couponCode: code, token: state.token })),
    [dispatch, state.token]
  );

  const handleRemoveCoupon = useCallback(
    () => dispatch(removeDiscountCoupon(state.token)),
    [dispatch, state.token]
  );

  const goToStep = useCallback(
    (step) => dispatch(setStep(step)),
    [dispatch]
  );

  return {
    ...state,
    orderTotal,
    handleSaveInformation,
    handleSubmitCheckout,
    handleApplyCoupon,
    handleRemoveCoupon,
    goToStep,
    clearError: () => dispatch(clearError()),
  };
};
