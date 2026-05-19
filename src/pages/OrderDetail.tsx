import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatPrice, RetailOrder } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';

const BASE_DOMAIN = 'https://nanoshop.iongeyser.com';


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

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<RetailOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      navigate('/orders');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Lấy phone từ localStorage
        const userData = localStorage.getItem('userData');
        let phone: string | null = null;
        if (userData) {
          try {
            const parsed = JSON.parse(userData);
            phone = parsed.phone || parsed.user?.phone || parsed.user?.phone_number || null;
          } catch { }
        }

        if (!phone) {
          setError('Không tìm thấy thông tin người dùng');
          return;
        }

        const response = await api.orders.getAll(phone);
        if (response.success && response.data) {
          const found = response.data.find((o) => String(o.id) === String(id));
          if (found) {
            setOrder(found);
          } else {
            setError('Không tìm thấy đơn hàng');
          }
        } else {
          setError(response.error || 'Không thể tải đơn hàng');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const calculateTotal = (order: RetailOrder) => {
    return order.orderdetails.reduce((sum, item) => sum + parseFloat(item.amount || '0'), 0);
  };

  if (loading) {
    return (
      <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
        <div className="w-full max-w-screen-xl mx-auto">
          <LoadingSpinner />
        </div>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
        <div className="w-full max-w-screen-xl mx-auto">
          <ErrorState
            message={error || 'Không tìm thấy đơn hàng'}
            onRetry={() => window.location.reload()}
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[calc(100vh-400px)] py-12 px-4 w-full">
      <div className="w-full max-w-screen-xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          <span>Quay lại danh sách đơn hàng</span>
        </button>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">
                Chi tiết đơn hàng #{order.code}
              </h1>
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
            <span className={`text-sm font-medium px-4 py-2 rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS['0']}`}>
              {STATUS_LABELS[order.status] || 'Không xác định'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-4">Thông tin đơn hàng</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng</span>
                  <span className="font-medium text-gray-900">#{order.code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Số sản phẩm</span>
                  <span className="font-medium text-gray-900">{order.orderdetails.length}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="font-semibold text-gray-900">Tổng tiền</span>
                  <span className="font-bold text-lg text-brand-500">
                    {formatPrice(calculateTotal(order))}đ
                  </span>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-4">Thông tin giao hàng</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Người nhận</div>
                  <div className="font-medium text-gray-900">{order.order_user_name}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Số điện thoại</div>
                  <div className="font-medium text-gray-900">{order.order_user_phone}</div>
                </div>
                <div>
                  <div className="text-gray-500 mb-1">Địa chỉ</div>
                  <div className="font-medium text-gray-900">{order.order_user_address}</div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="card p-6">
                <h2 className="font-semibold text-lg text-gray-900 mb-3">Ghi chú</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Right Column - Products */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-semibold text-xl text-gray-900 mb-6">Sản phẩm đã đặt</h2>
              <div className="space-y-4">
                {order.orderdetails.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      {item.product.product_images?.[0] ? (
                        <img
                          src={(() => {
                            const link = item.product.product_images[0].link;
                            return link.startsWith('http') ? link : `${BASE_DOMAIN}${link}`;
                          })()}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">No image</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{item.product.name}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {item.quantity} × {formatPrice(parseFloat(item.unit_price))}đ
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="font-semibold text-gray-900">
                        {formatPrice(parseFloat(item.amount))}đ
                      </div>
                      {order.status === '5' && (
                        <button
                          onClick={() => navigate(`/product/${item.product.slug || item.product.id || item.product_id}#reviews`)}
                          className="text-xs text-brand-500 border border-brand-500 px-3 py-1 rounded-full hover:bg-brand-50 transition-colors"
                        >
                          Đánh giá
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-semibold text-gray-900">Tổng cộng</span>
                <span className="text-xl font-bold text-brand-500">{formatPrice(calculateTotal(order))}đ</span>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => window.open('https://thayloiloc.com/#/hotline', '_blank')}
                  className="btn-primary"
                >
                  Chọn thợ
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
