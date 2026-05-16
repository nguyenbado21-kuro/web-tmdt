/**
 * Checkout.tsx — điều phối 3 bước: information → payment → success
 * Tích hợp: GHTK, ViettelPost (shipping), OnePay (payment), bank_transfer, COD
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useAuth } from '../store/authContext';
import { CheckoutProvider, useCheckoutContext } from '../store/checkoutContext';
import { useCheckout } from '../hooks/useCheckout';
import { useShipping } from '../hooks/useShipping';
import { useUserAddresses } from '../hooks/useUserAddresses';

import CheckoutAddressForm from '../components/checkout/AddressForm';
import ShippingMethod from '../components/checkout/ShippingMethod';
import PaymentMethod from '../components/checkout/PaymentMethod';
import OrderSummary from '../components/checkout/OrderSummary';
import CheckoutSuccess from '../components/checkout/CheckoutSuccess';
import VietQRPayment from '../components/VietQRPayment';
import FloatingButtons from '../components/FloatingButtons';

const baseUrl = import.meta.env.VITE_URL_BACKEND;


// ─── Inner component (needs context) ─────────────────────────────────────────

function CheckoutInner() {
  const { items, totalItems } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const { addresses, getDefaultAddress } = useUserAddresses();
  const { state, dispatch, placeOrder, goToOrders, finalTotal } = useCheckout();
  const [showQR, setShowQR] = useState(false);
  const qrOrderId = `DH${Date.now()}`;

  // Auto-select default address
  useEffect(() => {
    if (!state.address && addresses.length > 0) {
      const def = getDefaultAddress() ?? addresses[0];
      dispatch({ type: 'SET_ADDRESS', address: def });
    }
  }, [addresses]);

  // Guards
  useEffect(() => {
    if (items.length === 0) navigate('/cart');
    if (!isLoggedIn) navigate('/login?returnUrl=/checkout');
  }, [items.length, isLoggedIn]);

  // Auto-fetch shipping fee khi địa chỉ thay đổi (debounce 600ms)
  useShipping(totalItems);

  if (items.length === 0 || !isLoggedIn) return null;

  // ── Success ─────────────────────────────────────────────────────────────────
  if (state.step === 'success' && state.orderId) {
    return <CheckoutSuccess orderId={state.orderId} onViewOrders={goToOrders} />;
  }

  // ── Handle place order ───────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!state.address) {
      dispatch({ type: 'SET_ERROR', error: 'Vui lòng chọn địa chỉ giao hàng' });
      return;
    }

    if (state.paymentMethod === 'bank_transfer') {
      // Hiện QR trước, sau khi user upload ảnh mới tạo order
      setShowQR(true);
      return;
    }

    // COD: tạo order trực tiếp
    await placeOrder();
  };

  const handleConfirmTransfer = async (image?: File) => {
    setShowQR(false);
    if (image) dispatch({ type: 'SET_TRANSFER_IMAGE', image });
    await placeOrder();
  };

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/cart" className="hover:text-brand-500">Giỏ hàng</Link>
          <span>›</span>
          <span className="text-gray-900">Thanh toán</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-gray-900">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Left column */}
        <div className="space-y-6">
          {/* Bước 1: Địa chỉ */}
          <CheckoutAddressForm />

          {/* Danh sách sản phẩm */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="space-y-4">
              {items.map(({ product, quantity }) => {
                const images = product.product_images && product.product_images.length > 0 
                  ? product.product_images.map(i => i.link) 
                  : product.images || [];
                const imgPath = images[0] || '';
                const img = imgPath ? (imgPath.startsWith('http') ? imgPath : baseUrl + imgPath) : '';
                return (
                  <div key={product.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                      {img && <img src={img} alt={product.name} className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">{product.name}</h3>
                      <span className="text-gray-500 text-sm">x{quantity}</span>
                    </div>
                    <span className="font-medium text-gray-900 shrink-0 text-sm">
                      {(product.price * quantity).toLocaleString('vi-VN')}₫
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bước 2: Phương thức vận chuyển (GHTK / ViettelPost) */}
          <ShippingMethod />

          {/* Bước 3: Thanh toán (COD / bank_transfer / OnePay) */}
          <PaymentMethod
            finalTotal={finalTotal}
            onConfirmTransfer={handleConfirmTransfer}
          />
        </div>

        {/* Right column — tóm tắt + đặt hàng */}
        <div>
          <OrderSummary onPlaceOrder={handlePlaceOrder} />
        </div>
      </div>

      {/* VietQR modal */}
      {showQR && (
        <VietQRPayment
          amount={finalTotal}
          orderInfo={qrOrderId}
          onClose={() => setShowQR(false)}
          onSuccess={handleConfirmTransfer}
        />
      )}

      {/* Error toast */}
      {state.error && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span>{state.error}</span>
          <button
            onClick={() => dispatch({ type: 'SET_ERROR', error: null })}
            className="text-white/80 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      <FloatingButtons phoneNumber="0123456789" />
    </main>
  );
}

// ─── Exported page ────────────────────────────────────────────────────────────

export default function Checkout() {
  return (
    <CheckoutProvider>
      <CheckoutInner />
    </CheckoutProvider>
  );
}
