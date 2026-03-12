import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { formatPrice, RetailOrder, OrderDetail } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import FloatingHotline from '../components/FloatingHotline';

// Get user data from localStorage
const getUserData = () => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// Mock authentication - Replace with real auth later
const isAuthenticated = () => {
  return localStorage.getItem('auth_token') && localStorage.getItem('userData');
};

const STATUS_LABELS: Record<string, string> = {
  '0': 'Chờ xác nhận',
  '1': 'Đã xác nhận',
  '2': 'Đang chuẩn bị',
  '3': 'Đang đóng gói',
  '4': 'Đang giao hàng',
  '5': 'Đã giao hàng',
  '-1': 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  '0': 'bg-gray-50 text-gray-700 border-gray-200',
  '1': 'bg-blue-50 text-blue-700 border-blue-200',
  '2': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  '3': 'bg-orange-50 text-orange-700 border-orange-200',
  '4': 'bg-purple-50 text-purple-700 border-purple-200',
  '5': 'bg-green-50 text-green-700 border-green-200',
  '-1': 'bg-red-50 text-red-700 border-red-200',
};

export default function Orders() {
  const navigate = useNavigate();
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [orders, setOrders] = useState<RetailOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get phone from userData
  useEffect(() => {
    const userData = getUserData();
    
    let phone = null;
    if (userData) {
      phone = userData.phone || userData.user?.phone || userData.user?.phone_number;
    }
    
    if (phone) {
      setUserPhone(phone);
    }
  }, []);

  // Fetch orders when userPhone is available
  useEffect(() => {
    if (!userPhone) {
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.orders.getAll(userPhone);

        if (response.success && response.data) {
          setOrders(response.data);
        } else {
          setError(response.error || 'Failed to load orders');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userPhone]);

  const refetch = () => {
    if (userPhone) {
      setUserPhone(userPhone);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/orders');
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  // Show loading while getting user phone
  if (!userPhone && loading) {
    return (
      <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
        <div className="w-full max-w-screen-xl mx-auto">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  const calculateTotal = (orderdetails: OrderDetail[]) => {
    return orderdetails.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  };

  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
      <div className="w-full max-w-screen-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
            Đơn hàng của tôi
          </h1>
          <p className="text-gray-600">
            Theo dõi và quản lý các đơn hàng của bạn
          </p>
        </div>

        {/* Content */}
        {loading && <LoadingSpinner />}
        {error && <ErrorState message={error} onRetry={refetch} />}
        
        {!loading && !error && orders && orders.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Chưa có đơn hàng nào
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn chưa có đơn hàng nào. Hãy khám phá sản phẩm của chúng tôi!
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="btn-primary"
            >
              Mua sắm ngay
            </button>
          </div>
        )}

        {orders && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order: RetailOrder) => (
              <div key={order.id} className="card p-6 hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Đơn hàng #{order.code}
                      </h3>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS['0']}`}>
                        {STATUS_LABELS[order.status] || 'Không xác định'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Đặt ngày: {new Date(order.order_date).toLocaleDateString('vi-VN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500 mb-1">Tổng tiền</div>
                    <div className="text-xl font-bold text-brand-500">
                      {formatPrice(calculateTotal(order.orderdetails))}đ
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.orderdetails.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        {item.product.product_images?.[0] ? (
                          <img
                            src={`https://nanoshop.longerpay.com/api${item.product.product_images[0].link}`}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.product.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity} × {formatPrice(parseFloat(item.unit_price))}đ
                        </p>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatPrice(parseFloat(item.amount))}đ
                      </div>
                    </div>
                  ))}
                </div>

                {/* Notes */}
                {order.notes && (
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-500 mt-0.5 shrink-0">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-blue-900 mb-1">Ghi chú</div>
                        <div className="text-sm text-blue-700 whitespace-pre-wrap">{order.notes}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5 shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">Thông tin giao hàng</div>
                      <div className="text-sm text-gray-600">
                        <div className="mb-1">
                          <span className="font-medium">Người nhận:</span> {order.order_user_name}
                        </div>
                        <div className="mb-1">
                          <span className="font-medium">Số điện thoại:</span> {order.order_user_phone}
                        </div>
                        <div>
                          <span className="font-medium">Địa chỉ:</span> {order.order_user_address}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <FloatingHotline phoneNumber="0123456789" />
    </main>
  );
}
