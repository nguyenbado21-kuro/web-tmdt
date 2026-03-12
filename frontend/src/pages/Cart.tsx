import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useAuth } from '../store/authContext';
import Button from '../components/Button';
import VoucherSelector from '../components/VoucherSelector';
import { api } from '../services/api';
import { formatPrice, getProductImages, Voucher } from '../types';
import cartIcon from '../assets/cart.png';
import FloatingButtons from '../components/FloatingButtons';

export default function Cart() {
  const { items, totalPrice, totalItems, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);

  // Handle scroll to show/hide floating button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    
    const discountValue = parseFloat(selectedVoucher.discount);
    
    // All vouchers are fixed amount (not percentage)
    return discountValue;
  };

  const discount = calculateDiscount();
  const finalTotal = totalPrice - discount;

  const handleCheckout = () => {
    // Check if user is logged in before proceeding
    if (!isLoggedIn) {
      // Redirect to login page with return URL
      navigate('/login?returnUrl=/checkout');
      return;
    }

    // Pass voucher to checkout page via state
    navigate('/checkout', { state: { selectedVoucher } });
  };

  const handleSelectVoucher = (voucher: Voucher | null) => {
    setSelectedVoucher(voucher);
  };

  if (checkoutStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-6">🎉</div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Đặt hàng thành công!</h1>
          <p className="text-gray-500 mb-8">Cảm ơn bạn đã mua hàng. Bạn sẽ nhận được email xác nhận sớm.</p>
          <Link to="/" className="btn-primary">Tiếp tục mua sắm</Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-7xl mb-6 flex justify-center">
            <img src={cartIcon} alt="Cart" className="w-24 h-24 object-contain" />
          </div>
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-3">Giỏ hàng trống</h1>
          <p className="text-gray-500 mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link to="/shop"><Button size="lg">Bắt đầu mua sắm</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        Giỏ hàng <span className="text-gray-400 text-lg sm:text-xl font-normal">({totalItems} sản phẩm)</span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
        {/* Items */}
        <div className="lg:col-span-2 flex flex-col gap-3 sm:gap-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 bg-white border border-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm">
              <div className="w-full sm:w-20 sm:h-20 md:w-24 md:h-24 h-48 rounded-xl overflow-hidden bg-gray-50 shrink-0">
                <img 
                  src={getProductImages(product)[0]} 
                  alt={product.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <Link to={`/product/${product.id}`}
                  className="font-semibold text-gray-900 hover:text-brand-500 transition-colors line-clamp-2 text-sm sm:text-base">
                  {product.name}
                </Link>
                <p className="text-brand-500 font-bold mt-1 text-lg sm:text-base">{formatPrice(product.price)}₫</p>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
                  <div className="flex items-center border border-gray-200 rounded-full text-sm w-fit">
                    <button onClick={() => quantity > 1 ? updateQuantity(product.id.toString(), quantity - 1) : removeFromCart(product.id.toString())}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full font-bold">−</button>
                    <span className="w-8 text-center font-semibold">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id.toString(), quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded-full font-bold">+</button>
                  </div>
                  <button onClick={() => removeFromCart(product.id.toString())}
                    className="text-xs text-red-400 hover:text-red-600 transition-colors w-fit">Remove</button>
                </div>
              </div>
              <div className="text-left sm:text-right shrink-0 mt-2 sm:mt-0">
                <span className="font-bold text-gray-900 text-lg sm:text-base">{formatPrice(product.price * quantity)}₫</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-4 sm:p-6 lg:sticky lg:top-24">
            <h2 className="font-semibold text-gray-900 text-lg mb-4 sm:mb-6">Tóm tắt đơn hàng</h2>
            
            {/* Voucher Section */}
            <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎫</span>
                  <span className="text-sm font-medium text-gray-700">Voucher</span>
                </div>
                <button
                  onClick={() => setShowVoucherSelector(true)}
                  className="text-brand-500 text-sm hover:underline font-medium"
                >
                  {selectedVoucher ? 'Thay đổi' : 'Chọn voucher'}
                </button>
              </div>
              {selectedVoucher && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{selectedVoucher.code}</span>
                    <span className="text-sm font-medium text-green-600">
                      -{formatPrice(discount)}₫
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 text-sm mb-4 sm:mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính</span><span>{formatPrice(totalPrice)}₫</span>
              </div>
              {selectedVoucher && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá</span><span>-{formatPrice(discount)}₫</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span><span className="text-green-600">Miễn phí</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900 text-base">
                <span>Tổng cộng</span><span className="text-red-500">{formatPrice(finalTotal)}₫</span>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={handleCheckout}>
              {isLoggedIn ? 'Thanh toán' : 'Đăng nhập để thanh toán'}
            </Button>
            {!isLoggedIn && (
              <p className="text-xs text-gray-500 text-center mt-2">
                Bạn cần đăng nhập để thực hiện thanh toán
              </p>
            )}           
            <Link to="/shop" className="block text-center mt-4 text-sm text-brand-500 hover:underline">
              Tiếp tục mua sắm
            </Link>
          </div>
        </div>
      </div>

      {/* Floating scroll to top button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-24 right-8 z-50 w-12 h-12 bg-brand-500 hover:bg-brand-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
          aria-label="Scroll to top"
        >
          <svg 
            className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* Floating buttons */}
      <FloatingButtons phoneNumber="0123456789" />

      {/* Voucher Selector Modal */}
      {showVoucherSelector && (
        <VoucherSelector
          onSelectVoucher={handleSelectVoucher}
          onClose={() => setShowVoucherSelector(false)}
          selectedVoucher={selectedVoucher}
          orderTotal={totalPrice}
        />
      )}
    </main>
  );
}
