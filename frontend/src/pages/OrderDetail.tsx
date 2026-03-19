import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../services/api';
import { formatPrice, RetailOrder, Technician } from '../types';
import LoadingSpinner, { ErrorState } from '../components/LoadingSpinner';

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
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [techLoading, setTechLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate('/orders');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch order details
        const orderResponse = await api.orders.getById(id);

        if (orderResponse.success && orderResponse.data) {
          setOrder(orderResponse.data);
        } else {
          setError(orderResponse.error || 'Không thể tải thông tin đơn hàng');
          setLoading(false);
          return;
        }

        // Fetch available technicians
        setTechLoading(true);
        const techResponse = await api.technicians.getAll();

        if (techResponse.success && techResponse.data) {
          setTechnicians(techResponse.data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Lỗi không xác định');
      } finally {
        setLoading(false);
        setTechLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleAssignTechnician = async () => {
    if (!selectedTechnician || !order) return;

    setAssigning(true);
    try {
      const response = await api.orders.assignTechnician(order.id.toString(), selectedTechnician);

      if (response.success) {
        alert('Đã phân công thợ thành công!');
        navigate('/orders');
      } else {
        alert(response.error || 'Không thể phân công thợ');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi không xác định');
    } finally {
      setAssigning(false);
    }
  };

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
                Phân công thợ cho đơn hàng #{order.code}
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
              <h2 className="font-semibold text-lg text-gray-900 mb-4">Thông tin khách hàng</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <div className="text-gray-500 mb-1">Tên khách hàng</div>
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

            {/* Order Items */}
            <div className="card p-6">
              <h2 className="font-semibold text-lg text-gray-900 mb-4">Sản phẩm</h2>
              <div className="space-y-3">
                {order.orderdetails.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 text-sm">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
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
                      <div className="font-medium text-gray-900 truncate text-xs">
                        {item.product.name}
                      </div>
                      <div className="text-gray-500 text-xs">SL: {item.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Technician Selection */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="font-semibold text-xl text-gray-900 mb-6">Chọn thợ phụ trách</h2>

              {techLoading ? (
                <LoadingSpinner />
              ) : technicians.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">👷</div>
                  <p className="text-gray-500">Không có thợ khả dụng</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {technicians.map((tech) => (
                      <div
                        key={tech.id}
                        onClick={() => setSelectedTechnician(tech.id)}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                          selectedTechnician === tech.id
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Avatar */}
                          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
                            {tech.avatar ? (
                              <img src={tech.avatar} alt={tech.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                                👤
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{tech.name}</h3>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                tech.status === 'available' 
                                  ? 'bg-green-100 text-green-700'
                                  : tech.status === 'busy'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {tech.status === 'available' ? 'Sẵn sàng' : tech.status === 'busy' ? 'Bận' : 'Offline'}
                              </span>
                            </div>

                            <div className="text-sm text-gray-600 mb-2">
                              <div>📞 {tech.phone}</div>
                              {tech.email && <div>✉️ {tech.email}</div>}
                            </div>

                            {tech.rating && (
                              <div className="flex items-center gap-2 text-sm mb-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-yellow-500">⭐</span>
                                  <span className="font-medium">{tech.rating.toFixed(1)}</span>
                                </div>
                                {tech.completed_orders && (
                                  <span className="text-gray-500">
                                    • {tech.completed_orders} đơn hoàn thành
                                  </span>
                                )}
                              </div>
                            )}

                            {tech.specialties && tech.specialties.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {tech.specialties.map((specialty, idx) => (
                                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                    {specialty}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Checkmark */}
                          {selectedTechnician === tech.id && (
                            <div className="text-brand-500">
                              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 justify-end">
                    <button
                      onClick={() => navigate('/orders')}
                      className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleAssignTechnician}
                      disabled={!selectedTechnician || assigning}
                      className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigning ? 'Đang xử lý...' : 'Xác nhận phân công'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
