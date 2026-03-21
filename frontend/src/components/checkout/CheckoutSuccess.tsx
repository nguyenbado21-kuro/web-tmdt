/**
 * CheckoutSuccess.tsx — trang cảm ơn sau khi đặt hàng thành công
 * Tương ứng với getCheckoutSuccess() — fire event, hiển thị kết quả
 */

import { useEffect, useState } from 'react';

interface Props {
  orderId: string;
  onViewOrders: () => void;
}

export default function CheckoutSuccess({ orderId, onViewOrders }: Props) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); onViewOrders(); }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #bbf7d0 100%)' }}
    >
      <div className="text-center px-6 max-w-lg w-full">
        {/* Checkmark */}
        <div className="relative mx-auto mb-8" style={{ width: 120, height: 120 }}>
          <div className="absolute inset-0 rounded-full bg-green-500 opacity-20 animate-ping" />
          <div className="relative w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-2xl">
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="text-4xl mb-4 flex justify-center gap-3">
          <span>🎉</span><span>🎊</span><span>🎉</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">Đặt hàng thành công</h1>
        <p className="text-gray-500 mb-2 text-sm">Mã đơn hàng: <span className="font-mono font-semibold text-gray-700">#{orderId}</span></p>
        <p className="text-gray-500 mb-8 text-sm">
          Chúng tôi sẽ liên hệ xác nhận và giao hàng sớm nhất có thể.
        </p>

        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-green-500 text-white font-bold text-xl flex items-center justify-center shadow-lg">
            {countdown}
          </div>
          <span className="text-gray-600 text-sm">giây nữa chuyển đến trang đơn hàng</span>
        </div>

        <button
          onClick={onViewOrders}
          className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold px-8 py-3 rounded-full shadow-lg transition-colors"
        >
          Xem đơn hàng ngay
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
