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
    goToOrders,
  };
}
