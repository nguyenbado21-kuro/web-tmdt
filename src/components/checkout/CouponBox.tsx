/**
 * CouponBox.tsx — chọn và áp dụng mã giảm giá
 */

import { useState } from 'react';
import { useCheckoutContext } from '../../store/checkoutContext';
import { useCheckout } from '../../hooks/useCheckout';
import VoucherSelector from '../VoucherSelector';
import { formatPrice } from '../../types';

export default function CouponBox() {
  const { state } = useCheckoutContext();
  const { applyVoucher, totalPrice } = useCheckout();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <>
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎫</span>
            <span className="text-sm text-gray-600">Voucher của Shop</span>
          </div>
          <button
            onClick={() => setShowSelector(true)}
            className="text-brand-500 text-sm hover:underline font-medium"
          >
            {state.voucher ? 'Thay đổi' : 'Chọn Voucher'}
          </button>
        </div>

        {state.voucher && (
          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">{state.voucher.code}</span>
              <p className="text-xs text-gray-500">
                Giảm {parseFloat(state.voucher.discount).toLocaleString('vi-VN')}đ
                {state.isFreeShipping && ' + Miễn phí ship'}
              </p>
            </div>
            <span className="text-sm font-medium text-green-600">-{formatPrice(state.discount)}₫</span>
          </div>
        )}
      </div>

      {showSelector && (
        <VoucherSelector
          onSelectVoucher={v => { applyVoucher(v); setShowSelector(false); }}
          onClose={() => setShowSelector(false)}
          selectedVoucher={state.voucher}
          orderTotal={totalPrice}
        />
      )}
    </>
  );
}
