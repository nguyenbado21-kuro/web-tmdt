/**
 * PaymentMethod.tsx
 * Hỗ trợ: COD, bank_transfer (VietQR), OnePay (INTERNATIONAL/DOMESTIC/QR/TG)
 * OnePay plugin: vpc_CardList xác định loại thẻ, backend build HMAC-SHA256 + redirect
 */

import { useState } from 'react';
import { useCheckoutContext } from '../../store/checkoutContext';
import VietQRPayment from '../VietQRPayment';

interface PaymentMethodOption {
  id: 'cod' | 'bank_transfer';
  name: string;
  icon: string;
  description: string;
}

const PAYMENT_METHODS: PaymentMethodOption[] = [
  { id: 'cod',           name: 'Thanh toán khi nhận hàng (COD)', icon: '💵', description: 'Trả tiền mặt khi nhận hàng' },
  { id: 'bank_transfer', name: 'Chuyển khoản ngân hàng',         icon: '🏦', description: 'VietQR — quét mã QR chuyển khoản' },
];

interface Props {
  finalTotal: number;
  onConfirmTransfer: (image: File) => void;
}

export default function PaymentMethod({ finalTotal, onConfirmTransfer }: Props) {
  const { state, dispatch } = useCheckoutContext();
  const [showQR, setShowQR] = useState(false);
  const orderId = `DH${Date.now()}`;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>

        <div className="space-y-3">
          {PAYMENT_METHODS.map(method => (
            <label
              key={method.id}
              className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <input
                type="radio"
                name="payment"
                value={method.id}
                checked={state.paymentMethod === method.id}
                onChange={() => {
                  dispatch({ type: 'SET_PAYMENT_METHOD', method: method.id });
                  if (method.id === 'bank_transfer') setShowQR(true);
                }}
                className="text-brand-500"
              />
              <span className="text-lg">{method.icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{method.name}</div>
                <div className="text-xs text-gray-500">{method.description}</div>
              </div>
            </label>
          ))}
        </div>

        {/* bank_transfer — nút mở QR */}
        {state.paymentMethod === 'bank_transfer' && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {state.transferImage ? (
              <div className="flex items-center gap-2 text-green-600 text-sm">
                <span>✅</span>
                <span>Đã tải ảnh xác nhận chuyển khoản</span>
                <button
                  onClick={() => setShowQR(true)}
                  className="ml-auto text-brand-500 hover:underline text-xs"
                >
                  Xem lại
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowQR(true)}
                className="w-full py-2 border border-brand-500 text-brand-500 rounded-lg text-sm hover:bg-brand-50 transition-colors"
              >
                📱 Mở mã QR chuyển khoản
              </button>
            )}
          </div>
        )}

        {/* Ghi chú đơn hàng */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="block mb-2 text-sm font-medium text-gray-700">Ghi chú đơn hàng</label>
          <textarea
            placeholder="Nhập ghi chú cho đơn hàng..."
            value={state.note}
            onChange={e => dispatch({ type: 'SET_NOTE', note: e.target.value })}
            rows={3}
            maxLength={500}
            className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 placeholder-gray-400 resize-none"
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs text-gray-500">💡 Ghi chú sẽ được gửi đến người bán</span>
            <span className="text-xs text-gray-400">{state.note.length}/500</span>
          </div>
        </div>
      </div>

      {/* VietQR modal — chỉ hiện khi bank_transfer */}
      {showQR && (
        <VietQRPayment
          amount={finalTotal}
          orderInfo={orderId}
          onClose={() => setShowQR(false)}
          onSuccess={image => {
            setShowQR(false);
            if (image) {
              dispatch({ type: 'SET_TRANSFER_IMAGE', image });
              onConfirmTransfer(image);
            }
          }}
        />
      )}
    </>
  );
}
