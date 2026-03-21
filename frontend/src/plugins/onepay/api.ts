/**
 * onepay/api.ts
 * Mirror logic từ OnePayPaymentService.php::makePayment() + createPayment()
 *
 * Flow:
 *   1. Frontend gọi initPayment() → POST /payment/onepay/init
 *   2. Backend build vpc_* params + HMAC-SHA256(secureSecret) → trả checkoutUrl
 *   3. Frontend redirect window.location.href = checkoutUrl
 *   4. OnePay callback → GET /payment/onepay/status → afterMakePayment()
 */

import { apiRequest } from '../shared/request';
import { OnePayInitRequest, OnePayInitResponse, OnePayCardType } from './types';

export interface OnePayInitResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
}

/**
 * Khởi tạo thanh toán OnePay.
 * Backend sẽ:
 *   - Chọn merchant/accessCode/secureSecret theo vpc_CardList
 *     (TG dùng merchant_tg, còn lại dùng merchant thường)
 *   - Build vpc_* params, ksort, HMAC-SHA256
 *   - Trả về checkoutUrl = host + "?" + params + "&vpc_SecureHash=..."
 */
export async function initOnePayPayment(payload: {
  orderId: string;
  amount: number;
  cardType: OnePayCardType;
  returnUrl: string;
}): Promise<OnePayInitResult> {
  const body: OnePayInitRequest = {
    order_id: payload.orderId,
    amount: payload.amount,
    vpc_CardList: payload.cardType,
    callback_url: payload.returnUrl,
  };

  const res = await apiRequest<OnePayInitResponse>('/payment/onepay/init', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (res.success && res.data?.checkout_url) {
    return { success: true, checkoutUrl: res.data.checkout_url };
  }
  return { success: false, error: res.error ?? 'Không thể khởi tạo thanh toán OnePay' };
}

/**
 * Xử lý sau khi OnePay callback về frontend (nếu dùng SPA redirect).
 * Thông thường backend xử lý toàn bộ tại GET /payment/onepay/status.
 * Hàm này chỉ dùng để parse query params và hiển thị kết quả.
 */
export function parseOnePayCallback(search: string): {
  success: boolean;
  txnRef: string;
  amount: number;
  responseCode: string;
} {
  const params = new URLSearchParams(search);
  const responseCode = params.get('vpc_TxnResponseCode') ?? '';
  const txnRef = params.get('vpc_MerchTxnRef') ?? '';
  const amount = parseInt(params.get('vpc_Amount') ?? '0') / 100; // chia 100 vì OnePay nhân 100

  return {
    success: responseCode === '0',
    txnRef,
    amount,
    responseCode,
  };
}
