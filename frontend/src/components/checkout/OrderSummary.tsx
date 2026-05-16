/**
 * OrderSummary.tsx — tóm tắt đơn hàng + tính tổng + nút đặt hàng
 */

import { useCart } from '../../store/cartContext';
import { useCheckoutContext, selectShippingFee } from '../../store/checkoutContext';
import { formatPrice, getProductImages } from '../../types';
import Button from '../Button';
import CouponBox from './CouponBox';

export const baseUrl = import.meta.env.VITE_URL_BACKEND;


interface Props {
  onPlaceOrder: () => void;
}

export default function OrderSummary({ onPlaceOrder }: Props) {
  const { items, totalPrice } = useCart();
  const { state } = useCheckoutContext();
  const shippingFee = selectShippingFee(state);
  const finalTotal = totalPrice - state.discount + shippingFee;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 lg:sticky lg:top-24 shadow-md">
      <h2 className="font-semibold text-gray-900 mb-4">Đơn hàng ({items.length} sản phẩm)</h2>

      {/* Product list */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {items.map(({ product, quantity }) => (
          <div key={product.id} className="flex gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-50 shrink-0">
              <img src={getProductImages(product)[0]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900 line-clamp-1">{product.name}</p>
              <p className="text-xs text-gray-500">x{quantity}</p>
            </div>
            <span className="text-sm font-medium shrink-0">{formatPrice(product.price * quantity)}₫</span>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <CouponBox />

      {/* Totals */}
      <div className="space-y-2 text-sm mt-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between text-gray-600">
          <span>Tổng tiền hàng</span>
          <span>{formatPrice(totalPrice)}₫</span>
        </div>
        {state.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá voucher</span>
            <span>-{formatPrice(state.discount)}₫</span>
          </div>
        )}
        <div className="flex justify-between text-gray-600">
          <span>Phí vận chuyển</span>
          <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
            {shippingFee === 0 ? 'Miễn phí' : `${formatPrice(shippingFee)}₫`}
          </span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between font-bold text-gray-900">
          <span>Tổng thanh toán</span>
          <span className="text-red-500">{formatPrice(finalTotal)}₫</span>
        </div>
      </div>

      <p className="text-xs text-gray-500 mt-4 mb-3">
        Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{' '}
        <button className="text-brand-500 hover:underline">Điều khoản Nanogeyser</button>
      </p>

      <Button
        size="lg"
        className="w-full bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
        loading={state.submitting}
        onClick={onPlaceOrder}
        disabled={!state.address || state.submitting}
      >
        {state.address ? 'Đặt hàng' : 'Vui lòng chọn địa chỉ giao hàng'}
      </Button>
    </div>
  );
}
