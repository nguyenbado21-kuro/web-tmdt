/**
 * onepay/types.ts
 * Types mirror từ OnePayPaymentAbstract.php + OnePayPaymentService.php
 *
 * OnePay flow:
 *   1. Frontend chọn vpc_CardList (loại thẻ)
 *   2. Backend build vpc_* params + HMAC-SHA256 (secureSecret)
 *   3. Backend trả về checkoutUrl → frontend redirect
 *   4. User thanh toán trên OnePay gateway
 *   5. OnePay redirect về GET /payment/onepay/status (callback_url)
 *   6. Backend: afterMakePayment() → PAYMENT_ACTION_PAYMENT_PROCESSED
 */

// 4 loại thẻ OnePay (vpc_CardList trong createPayment())
// TG dùng merchant_tg/accessCode_tg/secureSecret_tg riêng
export type OnePayCardType = 'INTERNATIONAL' | 'DOMESTIC' | 'QR' | 'TG';

export interface OnePayCardOption {
  id: OnePayCardType;
  name: string;
  icon: string;
  description: string;
}

// Cấu hình 4 loại thẻ từ HookServiceProvider.php::checkoutWithOnePay()
export const ONEPAY_CARD_OPTIONS: OnePayCardOption[] = [
  {
    id: 'QR',
    name: 'QR Code',
    icon: '📱',
    description: 'Quét mã QR qua app ngân hàng',
  },
  {
    id: 'DOMESTIC',
    name: 'Thẻ nội địa (ATM)',
    icon: '🏧',
    description: 'Thẻ ATM / tài khoản ngân hàng nội địa',
  },
  {
    id: 'INTERNATIONAL',
    name: 'Thẻ quốc tế',
    icon: '💳',
    description: 'Visa, Mastercard, JCB, Amex',
  },
  {
    id: 'TG',
    name: 'Trả góp',
    icon: '📅',
    description: 'Trả góp 0% qua thẻ tín dụng',
  },
];

// Params backend build để gửi lên OnePay gateway (từ createPayment())
export interface OnePayVpcParams {
  vpc_Version: number;        // 2
  vpc_Merchant: string;       // merchant code
  vpc_AccessCode: string;     // access code
  vpc_Amount: number;         // amount * 100 (VND không có decimal)
  vpc_Command: 'pay';
  vpc_Currency: 'VND';
  vpc_TicketNo: string;       // IP user
  vpc_Locale: 'vn';
  vpc_OrderInfo: string;      // "Thanh toan GD: {txnRef}"
  vpc_MerchTxnRef: string;    // unique transaction ref
  vpc_ReturnURL: string;      // callback_url + query params
  vpc_CardList: OnePayCardType | '';
  vpc_SecureHash: string;     // HMAC-SHA256
}

// Request từ frontend → backend
export interface OnePayInitRequest {
  order_id: string;
  amount: number;             // VND
  vpc_CardList: OnePayCardType;
  callback_url: string;       // route('payments.onepay.status')
}

// Response từ backend → frontend
export interface OnePayInitResponse {
  checkout_url: string;       // URL redirect đến OnePay gateway
}

// Callback params từ OnePay → backend (GET /payment/onepay/status)
export interface OnePayCallbackParams {
  vpc_Amount: string;         // amount * 100
  vpc_MerchTxnRef: string;    // transaction ref
  vpc_OrderInfo: string;
  vpc_TransactionNo: string;
  vpc_TxnResponseCode: string; // '0' = success
  vpc_SecureHash: string;
  // + các params khác
}
