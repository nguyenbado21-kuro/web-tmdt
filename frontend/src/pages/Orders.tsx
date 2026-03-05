import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFetch } from '../hooks/useFetch';
import { api } from '../services/api';
import { Order, formatPrice } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';
import FloatingHotline from '../components/FloatingHotline';


// Mock authentication - Replace with real auth later
const isAuthenticated = () => {
  return localStorage.getItem('isLoggedIn') === 'true';
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ xác nhận',
  processing: 'Đang xử lý',
  shipped: 'Đang giao',
  delivered: 'Đã giao',
  cancelled: 'Đã hủy',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function Orders() {
  const navigate = useNavigate();
  const { data: orders, loading, error, refetch } = useFetch(() => api.orders.getAll(), []);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate('/login?redirect=/orders');
    }
  }, [navigate]);

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
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
        
        {orders && orders.length === 0 && (
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
            {orders.map((order: Order) => (
              <div key={order.id} className="card p-6 hover:shadow-lg transition-shadow">
                {/* Order Header */}
                <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Đơn hàng #{order.id}
                      </h3>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full border ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Đặt ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN', {
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
                      {formatPrice(order.totalPrice)}đ
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {item.productName}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Số lượng: {item.quantity} × {formatPrice(item.price)}đ
                        </p>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {formatPrice(item.quantity * item.price)}đ
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery Address */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400 mt-0.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</div>
                      <div className="text-sm text-gray-600">{order.address}</div>
                      {order.customerName && (
                        <div className="text-sm text-gray-600 mt-1">
                          Người nhận: {order.customerName}
                        </div>
                      )}
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
