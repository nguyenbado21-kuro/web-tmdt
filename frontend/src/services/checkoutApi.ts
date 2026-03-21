/**
 * checkoutApi.ts — orchestrator cho checkout flow
 * Re-export types từ plugins, chứa createOrder + validateVoucher
 */

export { apiRequest } from '../plugins/shared/request';
export { aggregateShippingFees } from '../plugins/shared/shippingAggregator';

// Re-export shipping types
export type { ShippingOption, ShippingOptionId, ShippingProvider } from './checkoutTypes';
export { initOnePayPayment, parseOnePayCallback } from '../plugins/onepay/api';
export type { OnePayCardType, OnePayInitResponse } from '../plugins/onepay/types';

import { apiRequest } from '../plugins/shared/request';

// ─── Shipping types (dùng chung) ──────────────────────────────────────────────
// Defined in checkoutTypes.ts để tránh circular import

// ─── Voucher ──────────────────────────────────────────────────────────────────

export interface VoucherValidateResult {
  valid: boolean;
  discount: number;
  isFreeShipping: boolean;
  error?: string;
}

/**
 * Validate voucher phía server.
 * Backend kiểm tra: min_order_value, quantity, end_date, is_free_shipping.
 * Fallback client-side nếu endpoint chưa có.
 */
export async function validateVoucher(
  code: string,
  orderTotal: number
): Promise<VoucherValidateResult> {
  const res = await apiRequest<{ discount: number; is_free_shipping: boolean }>(
    '/retailOrderCart/validateVoucher',
    { method: 'POST', body: JSON.stringify({ code, order_total: orderTotal }) }
  );

  if (res.success && res.data) {
    return { valid: true, discount: res.data.discount, isFreeShipping: res.data.is_free_shipping };
  }
  return { valid: false, discount: 0, isFreeShipping: false, error: res.error };
}

// ─── Create Order ─────────────────────────────────────────────────────────────

export interface CreateOrderPayload {
  userId: string;
  address: { name: string; phone: string; full: string };
  products: { product_id: number; quantity: number; price: number }[];
  shippingMethod: string;   // SHIP_GHTK | SHIP_VIETTEL_POST
  shippingOption: string;   // ship_ghtk | ship_ghn | ship_ghht
  shippingFee: number;
  paymentMethod: 'cod' | 'bank_transfer' | 'onepay';
  discount: number;
  voucherCode?: string;
  note?: string;
  transferImage?: File;
}

export async function createOrder(
  payload: CreateOrderPayload
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const formData = new FormData();
  const now = new Date();
  const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const subtotal = payload.products.reduce((s, p) => s + p.price * p.quantity, 0);
  const total = subtotal - payload.discount + payload.shippingFee;

  formData.append('user_id', payload.userId);
  formData.append('customer_id', payload.userId);
  formData.append('sale_id', payload.userId);
  formData.append('status', '0');
  formData.append('order_user_name', payload.address.name);
  formData.append('order_user_phone', payload.address.phone);
  formData.append('order_user_address', payload.address.full);
  formData.append('shipping_method', payload.shippingMethod);   // SHIP_GHTK / SHIP_VIETTEL_POST
  formData.append('shipping_option', payload.shippingOption);   // ship_ghtk / ship_ghn / ship_ghht
  formData.append('shipping_fee', String(payload.shippingFee));
  formData.append('payment_method', payload.paymentMethod);
  formData.append('payment_amount', String(total));
  formData.append('order_date', orderDate);
  formData.append('products_json', JSON.stringify(payload.products));
  if (payload.discount > 0) formData.append('discount', String(payload.discount));
  if (payload.voucherCode) formData.append('type_discount', payload.voucherCode);
  if (payload.note) formData.append('order_user_note', payload.note);
  if (payload.transferImage) formData.append('images[]', payload.transferImage);

  const res = await apiRequest<{ id: string }>('/retailOrder/createRetailOrder', {
    method: 'POST',
    body: formData,
  });

  return { success: res.success, orderId: res.data?.id, error: res.error };
}
