/**
 * ShippingMethod.tsx
 * Hiển thị các dịch vụ ship từ GHTK + ViettelPost.
 * Mapping: ship_ghtk=Tiết Kiệm, ship_ghn=Nhanh, ship_ghht=Hỏa Tốc
 */

import { useCheckoutContext } from '../../store/checkoutContext';
import { formatPrice } from '../../types';

// Icon theo provider
const PROVIDER_ICON: Record<string, string> = {
  SHIP_GHTK: '🟢',
  SHIP_VIETTEL_POST: '🔴',
};

const PROVIDER_LABEL: Record<string, string> = {
  SHIP_GHTK: 'GHTK',
  SHIP_VIETTEL_POST: 'ViettelPost',
};

export default function ShippingMethod() {
  const { state, dispatch } = useCheckoutContext();
  const { shippingOptions, selectedShipping, shippingLoading, isFreeShipping } = state;

  if (!state.address?.province) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Phương thức vận chuyển</h2>

      {shippingLoading ? (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <div className="w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          Đang tính phí vận chuyển...
        </div>
      ) : shippingOptions.length === 0 ? (
        <p className="text-sm text-gray-500">Không có dịch vụ vận chuyển khả dụng.</p>
      ) : (
        <div className="space-y-3">
          {shippingOptions.map(option => {
            const isSelected = selectedShipping?.id === option.id;
            const fee = isFreeShipping ? 0 : option.fee;

            return (
              <label
                key={option.id}
                className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <input
                  type="radio"
                  name="shipping"
                  checked={isSelected}
                  onChange={() => dispatch({ type: 'SET_SELECTED_SHIPPING', option })}
                  className="text-brand-500"
                />
                <span className="text-base">{PROVIDER_ICON[option.provider] ?? '📦'}</span>
                <div className="flex-1">
                  <div className="font-medium text-sm">{option.name}</div>
                  <div className="text-xs text-gray-500">
                    {PROVIDER_LABEL[option.provider] ?? option.provider} · {option.estimatedDays}
                  </div>
                </div>
                <span className={`text-sm font-medium ${fee === 0 ? 'text-green-600' : 'text-gray-900'}`}>
                  {fee === 0 ? 'Miễn phí' : `${formatPrice(fee)}₫`}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {isFreeShipping && (
        <p className="mt-3 text-xs text-green-600">✓ Voucher đã áp dụng miễn phí vận chuyển</p>
      )}
    </div>
  );
}
