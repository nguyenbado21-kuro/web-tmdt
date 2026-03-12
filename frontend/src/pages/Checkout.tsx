import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../store/cartContext';
import { useAuth } from '../store/authContext';
import { useUserAddresses } from '../hooks/useUserAddresses';
import Button from '../components/Button';
import AddressSelector from '../components/AddressSelector';
import VietQRPayment from '../components/VietQRPayment';
import VoucherSelector from '../components/VoucherSelector';
import { api } from '../services/api';
import { formatPrice, getProductImages, Address, Voucher } from '../types';
import FloatingButtons from '../components/FloatingButtons';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const {
    addresses,
    loading: addressLoading,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress
  } = useUserAddresses();
  const navigate = useNavigate();
  const [checkoutStatus, setCheckoutStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [selectedPayment, setSelectedPayment] = useState<string>('bank-transfer');
  const [showAddressSelector, setShowAddressSelector] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [orderNote, setOrderNote] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showVietQR, setShowVietQR] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(
    location.state?.selectedVoucher || null
  );
  const [transferImage, setTransferImage] = useState<File | null>(null);

  // Fixed shipping fee
  const SHIPPING_FEE = 0; // Free shipping


  const calculateDiscount = () => {
    if (!selectedVoucher) return 0;
    const discountValue = parseFloat(selectedVoucher.discount);
    return discountValue;
  };

  const discount = calculateDiscount();
  const finalTotal = totalPrice - discount + SHIPPING_FEE;

  const handleSelectVoucher = (voucher: Voucher | null) => {
    setSelectedVoucher(voucher);
  };

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'bank-transfer',
      name: 'Chuyển khoản ngân hàng',
      icon: '🏦',
      description: 'Quét mã QR hoặc chuyển khoản thủ công'
    },
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng',
      icon: '💵',
      description: 'Thanh toán bằng tiền mặt khi nhận hàng'
    },
    {
      id: 'momo',
      name: 'Ví điện tử MoMo',
      icon: '🔴',
      description: 'Thanh toán qua ví MoMo'
    },
    {
      id: 'vnpay',
      name: 'VN Pay',
      icon: '🔵'
    }
  ];

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      const defaultAddress = getDefaultAddress();
      if (defaultAddress) {
        setSelectedAddress(defaultAddress);
      } else {
        setSelectedAddress(addresses[0]);
      }
    }
  }, [addresses, selectedAddress, getDefaultAddress]);


  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }
    if (!isLoggedIn) {
      navigate('/login?returnUrl=/checkout');
      return;
    }
    if (!selectedAddress && addresses.length === 0 && !addressLoading) {
      setShowAddressSelector(true);
    }
  }, [items.length, isLoggedIn, navigate, selectedAddress, addresses.length, addressLoading]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setShowAddressSelector(true);
      return;
    }

    if (selectedPayment === 'bank-transfer') {
      const tempOrderId = `DH${Date.now()}`;
      setOrderId(tempOrderId);
      setShowVietQR(true);
      return;
    }

    await createOrder();
  };

  const createOrder = async () => {
    setCheckoutStatus('loading');
    setErrorMessage('');

    try {
      const fullAddress = `${selectedAddress!.detailAddress}, ${selectedAddress!.ward}, ${selectedAddress!.district}, ${selectedAddress!.province}`;

      const userData = localStorage.getItem('userData');
      let userId = '9309';
      let customerId = '9309';

      if (userData) {
        try {
          const parsedData = JSON.parse(userData);
          userId = parsedData.id || parsedData.user?.id || '9309';
          customerId = userId;
        } catch (e) {
          // Silent error handling
        }
      }


      const productsJson = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
        price: +i.product.price,
      }));

      const now = new Date();
      const orderDate =
        now.getFullYear() +
        "-" +
        String(now.getMonth() + 1).padStart(2, "0") +
        "-" +
        String(now.getDate()).padStart(2, "0") +
        "T" +
        String(now.getHours()).padStart(2, "0") +
        ":" +
        String(now.getMinutes()).padStart(2, "0");

      // Always use FormData for multipart/form-data
      const formData = new FormData();
      
      formData.append('user_id', String(userId));
      formData.append('customer_id', String(customerId));
      formData.append('sale_id', String(customerId));
      formData.append('status', '0');
      formData.append('order_user_name', selectedAddress!.name);
      formData.append('order_user_phone', selectedAddress!.phone);
      formData.append('order_user_address', fullAddress);
      
      if (orderNote) {
        formData.append('order_user_note', orderNote);
        formData.append('notes', orderNote);
      }
      
      if (selectedVoucher) {
        formData.append('discount', discount.toString());
        formData.append('type_discount', selectedVoucher.code);
      }
      
      formData.append('payment_amount', finalTotal.toString());
      formData.append('order_date', orderDate);
      formData.append('products_json', JSON.stringify(productsJson));
      
      // Append transfer image if exists (backend expects images[])
      if (transferImage) {
        formData.append('images[]', transferImage);
      }

      console.log('Order data:', {
        userId,
        customerId,
        address: fullAddress,
        amount: finalTotal,
        hasImage: !!transferImage
      });


      const response = await api.orders.create(formData);

      if (response.success) {
        clearCart();
        setCheckoutStatus('success');
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        setCheckoutStatus('error');
        setErrorMessage(response.error || 'Đặt hàng thất bại. Vui lòng thử lại.');
      }
    } catch (error) {
      setCheckoutStatus('error');
      setErrorMessage('Có lỗi xảy ra. Vui lòng thử lại sau.');
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleAddAddress = (addressData: Omit<Address, 'id'>) => {
    const newAddress = addAddress(addressData);
    setSelectedAddress(newAddress);
    setShowAddressSelector(false);
  };

  const handleUpdateAddress = (updatedAddress: Address) => {
    updateAddress(updatedAddress);
    if (selectedAddress?.id === updatedAddress.id) {
      setSelectedAddress(updatedAddress);
    }
    setShowAddressSelector(false);
  };

  const handleDeleteAddress = (addressId: string) => {
    deleteAddress(addressId);
    if (selectedAddress?.id === addressId) {
      const remainingAddresses = addresses.filter(addr => addr.id !== addressId);
      setSelectedAddress(remainingAddresses.length > 0 ? remainingAddresses[0] : null);
    }
  };

  if (items.length === 0 || !isLoggedIn) {
    return null;
  }

  return (
    <main className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link to="/cart" className="hover:text-brand-500">Giỏ hàng</Link>
          <span>›</span>
          <span className="text-gray-900">Thanh toán</span>
        </div>

        <h1 className="font-display text-2xl font-bold text-gray-900">Thanh toán</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                Địa Chỉ Nhận Hàng
              </h2>
              <button
                onClick={() => setShowAddressSelector(true)}
                className="text-brand-500 text-sm hover:underline"
              >
                {selectedAddress ? 'Thay đổi' : 'Thêm địa chỉ'}
              </button>
            </div>

            {selectedAddress ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedAddress.name}</span>
                  <span className="text-gray-500">{selectedAddress.phone}</span>
                  {selectedAddress.isDefault && (
                    <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Mặc định</span>
                  )}
                </div>
                <p className="text-gray-600 text-sm">
                  {selectedAddress.detailAddress}, {selectedAddress.ward}, {selectedAddress.district}, {selectedAddress.province}
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm mb-4">Bạn chưa có địa chỉ giao hàng</p>
                <button
                  onClick={() => setShowAddressSelector(true)}
                  className="text-brand-500 hover:text-brand-600 font-medium"
                >
                  + Thêm địa chỉ giao hàng
                </button>
              </div>
            )}
          </div>


          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Sản phẩm</h2>
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    <img
                      src={getProductImages(product)[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 text-sm">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-gray-500 text-sm">Phân loại: Tặng</span>
                      <span className="text-sm">x{quantity}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-gray-900">{formatPrice(product.price * quantity)}₫</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎫</span>
                  <span className="text-sm text-gray-600">Voucher của Shop</span>
                </div>
                <button
                  onClick={() => setShowVoucherSelector(true)}
                  className="text-brand-500 text-sm hover:underline font-medium"
                >
                  {selectedVoucher ? 'Thay đổi' : 'Chọn Voucher'}
                </button>
              </div>
              {selectedVoucher && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-gray-900">{selectedVoucher.code}</span>
                      <p className="text-xs text-gray-500">
                        Giảm {parseFloat(selectedVoucher.discount).toLocaleString('vi-VN')}đ
                      </p>
                    </div>

                    <span className="text-sm font-medium text-green-600">
                      -{formatPrice(discount)}₫
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Phương thức vận chuyển:</span>
                  <span className="text-sm font-medium">Miễn phí vận chuyển</span>
                </div>
                <span className="text-green-600 font-medium">
                  {formatPrice(SHIPPING_FEE)}₫
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Lời nhắn:</span>
                <input
                  type="text"
                  placeholder="Lưu ý cho Người bán..."
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="flex-1 text-sm border-none outline-none placeholder-gray-400"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <label key={method.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="payment"
                    value={method.id}
                    checked={selectedPayment === method.id}
                    onChange={(e) => setSelectedPayment(e.target.value)}
                    className="text-brand-500"
                  />
                  <span className="text-lg">{method.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{method.name}</div>

                    {method.description && (
                      <div className="text-xs text-gray-500">{method.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Đơn hàng</h2>

            <div className="space-y-3 text-sm mb-6">
              <div className="flex justify-between text-gray-600">
                <span>Tổng tiền hàng</span>
                <span>{formatPrice(totalPrice)}₫</span>
              </div>
              {selectedVoucher && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá voucher</span>
                  <span>-{formatPrice(discount)}₫</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-medium">Miễn phí</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-gray-900">
                <span>Tổng thanh toán</span>
                <span className="text-red-500">{formatPrice(finalTotal)}₫</span>
              </div>
            </div>

            <div className="text-xs text-gray-500 mb-4">
              Nhấn "Đặt hàng" đồng nghĩa với việc bạn đồng ý tuân theo{' '}
              <button className="text-brand-500 hover:underline">Điều khoản Nanogeyser</button>
            </div>

            <Button
              size="lg"
              className="w-full bg-red-500 hover:bg-red-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
              loading={checkoutStatus === 'loading'}
              onClick={handlePlaceOrder}
              disabled={!selectedAddress || checkoutStatus === 'loading'}
            >
              {selectedAddress ? 'Đặt hàng' : 'Vui lòng chọn địa chỉ giao hàng'}
            </Button>
          </div>
        </div>
      </div>


      {checkoutStatus === 'success' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center animate-fade-in">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thành công!</h3>
            <p className="text-gray-600 mb-4">
              Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.
            </p>
            <p className="text-sm text-gray-500">
              Đang chuyển đến trang đơn hàng...
            </p>
          </div>
        </div>
      )}

      {checkoutStatus === 'error' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-8 max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Đặt hàng thất bại</h3>
            <p className="text-gray-600 mb-6">
              {errorMessage}
            </p>
            <Button
              onClick={() => setCheckoutStatus('idle')}
              className="w-full"
            >
              Thử lại
            </Button>
          </div>
        </div>
      )}

      <FloatingButtons phoneNumber="0123456789" />


      {showVietQR && (
        <VietQRPayment
          amount={finalTotal}
          orderInfo={orderId}
          onClose={() => setShowVietQR(false)}
          onSuccess={async (image?: File) => {
            setShowVietQR(false);
            if (image) {
              setTransferImage(image);
            }
            await createOrder();
          }}
        />
      )}

      {showVoucherSelector && (
        <VoucherSelector
          onSelectVoucher={handleSelectVoucher}
          onClose={() => setShowVoucherSelector(false)}
          selectedVoucher={selectedVoucher}
          orderTotal={totalPrice}
        />
      )}

      {showAddressSelector && (
        <AddressSelector
          addresses={addresses}
          selectedAddressId={selectedAddress?.id}
          onSelectAddress={handleSelectAddress}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          onClose={() => setShowAddressSelector(false)}
        />
      )}
    </main>
  );
}
