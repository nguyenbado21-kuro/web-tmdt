/**
 * useCheckout.ts — logic đặt hàng, voucher, OnePay redirect
 */

import { useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import {
  useCheckoutContext,
  selectShippingFee,
  selectShippingProvider,
  selectShippingOption,
} from '../store/checkoutContext';
import { createOrder, validateVoucher } from '../services/checkoutApi';
import { initOnePayPayment } from '../plugins/onepay/api';
import { Voucher } from '../types';

function getUserId(): string {
  try {
    const d = localStorage.getItem('userData');
    if (d) {
      const p = JSON.parse(d);
      return String(p.id || p.user?.id || '9309');
    }
  } catch {}
  return '9309';
}

export function useCheckout() {
  const { items, totalPrice, clearCart } = useCart();
  const { state, dispatch } = useCheckoutContext();
  const navigate = useNavigate();

  const shippingFee = selectShippingFee(state);
  const finalTotal = totalPrice - state.discount + shippingFee;

  // ── Áp dụng voucher ───────────────────────────────────────────────────────
  async function applyVoucher(voucher: Voucher | null) {
    if (!voucher) {
      dispatch({ type: 'SET_VOUCHER', voucher: null, discount: 0, isFreeShipping: false });
      return;
    }
    // Validate phía server trước
    const result = await validateVoucher(voucher.code, totalPrice);
    if (result.valid) {
      dispatch({ type: 'SET_VOUCHER', voucher, discount: result.discount, isFreeShipping: result.isFreeShipping });
    } else {
      // Fallback client-side nếu server chưa có endpoint
      dispatch({ type: 'SET_VOUCHER', voucher, discount: parseFloat(voucher.discount), isFreeShipping: false });
    }
  }

  // ── Đặt hàng (COD / bank_transfer) ───────────────────────────────────────
  async function placeOrder() {
    if (!state.address) return;

    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const fullAddress = [
        state.address.detailAddress,
        state.address.ward,
        state.address.district,
        state.address.province,
      ].filter(Boolean).join(', ');

      const result = await createOrder({
        userId: getUserId(),
        address: { name: state.address.name, phone: state.address.phone, full: fullAddress },
        products: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, price: +i.product.price })),
        shippingMethod: selectShippingProvider(state),
        shippingOption: selectShippingOption(state),
        shippingFee,
        paymentMethod: state.paymentMethod,
        discount: state.discount,
        voucherCode: state.voucher?.code,
        note: state.note,
        transferImage: state.transferImage ?? undefined,
      });

      if (result.success && result.orderId) {
        clearCart();
        dispatch({ type: 'SET_ORDER_ID', orderId: result.orderId });
      } else {
        dispatch({ type: 'SET_ERROR', error: result.error ?? 'Đặt hàng thất bại. Vui lòng thử lại.' });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
    }
  }

  /**
   * Thanh toán OnePay:
   * 1. Tạo order trước (status=pending)
   * 2. Gọi initOnePayPayment → nhận checkoutUrl từ backend
   * 3. Redirect user đến OnePay gateway
   * Backend callback: GET /payment/onepay/status → afterMakePayment() → update order status
   */
  async function placeOrderWithOnePay() {
    if (!state.address) return;

    dispatch({ type: 'SET_SUBMITTING', submitting: true });
    dispatch({ type: 'SET_ERROR', error: null });

    try {
      const fullAddress = [
        state.address.detailAddress,
        state.address.ward,
        state.address.district,
        state.address.province,
      ].filter(Boolean).join(', ');

      // Bước 1: tạo order với payment_method = 'onepay'
      const orderResult = await createOrder({
        userId: getUserId(),
        address: { name: state.address.name, phone: state.address.phone, full: fullAddress },
        products: items.map(i => ({ product_id: i.product.id, quantity: i.quantity, price: +i.product.price })),
        shippingMethod: selectShippingProvider(state),
        shippingOption: selectShippingOption(state),
        shippingFee,
        paymentMethod: 'onepay',
        discount: state.discount,
        voucherCode: state.voucher?.code,
        note: state.note,
      });

      if (!orderResult.success || !orderResult.orderId) {
        dispatch({ type: 'SET_ERROR', error: orderResult.error ?? 'Không thể tạo đơn hàng' });
        return;
      }

      // Bước 2: khởi tạo OnePay payment
      // callback_url = backend route: GET /payment/onepay/status
      const callbackUrl = `${window.location.origin}/payment/onepay/status`;
      const payResult = await initOnePayPayment({
        orderId: orderResult.orderId,
        amount: finalTotal,
        cardType: state.onePayCardType,
        returnUrl: callbackUrl,
      });

      if (payResult.success && payResult.checkoutUrl) {
        clearCart();
        // Bước 3: redirect đến OnePay gateway
        window.location.href = payResult.checkoutUrl;
      } else {
        dispatch({ type: 'SET_ERROR', error: payResult.error ?? 'Không thể khởi tạo thanh toán OnePay' });
      }
    } catch {
      dispatch({ type: 'SET_ERROR', error: 'Có lỗi xảy ra. Vui lòng thử lại sau.' });
    } finally {
      dispatch({ type: 'SET_SUBMITTING', submitting: false });
    }
  }

  function goToOrders() {
    dispatch({ type: 'RESET' });
    navigate('/orders');
  }

  return {
    state,
    dispatch,
    items,
    totalPrice,
    shippingFee,
    finalTotal,
    applyVoucher,
    placeOrder,
    placeOrderWithOnePay,
    goToOrders,
  };
}
