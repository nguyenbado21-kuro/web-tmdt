import { Voucher } from '../types';

interface VoucherCardProps {
  voucher: Voucher;
  onCopy?: (code: string) => void;
}

export default function VoucherCard({ voucher, onCopy }: VoucherCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDiscount = (discount: string) => {
    const value = parseFloat(discount);
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  const formatMinOrder = (value: string) => {
    const num = parseFloat(value);
    return num > 0 ? `${num.toLocaleString('vi-VN')}đ` : 'Không giới hạn';
  };

  const isExpired = new Date(voucher.end_date) < new Date();
  const isActive = voucher.status === '1' && !isExpired;

  const handleCopy = () => {
    navigator.clipboard.writeText(voucher.code);
    if (onCopy) {
      onCopy(voucher.code);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-2 transition-all hover:shadow-lg ${
      isActive ? 'border-red-500' : 'border-gray-300 opacity-60'
    }`}>
      <div className="flex">
        {/* Left side - Discount badge */}
        <div className={`w-32 flex items-center justify-center ${
          isActive ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-400'
        } text-white p-4`}>
          <div className="text-center">
            <div className="text-xl font-bold leading-tight">{formatDiscount(voucher.discount)}</div>
            <div className="text-xs mt-1">GIẢM GIÁ</div>
          </div>
        </div>

        {/* Right side - Voucher details */}
        <div className="flex-1 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-bold text-lg text-gray-800">{voucher.code}</h3>
              <p className="text-sm text-gray-600">
                Giảm giá trực tiếp
              </p>
            </div>
            {isActive && (
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                Đang hoạt động
              </span>
            )}
            {isExpired && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                Hết hạn
              </span>
            )}
          </div>

          <div className="space-y-1 text-sm text-gray-600 mb-3">
            <p>• Đơn tối thiểu: {formatMinOrder(voucher.min_order_value)}</p>
            <p>• Số lượng: {voucher.quantity}</p>
            <p>• Hạn sử dụng: {formatDate(voucher.start_date)} - {formatDate(voucher.end_date)}</p>
          </div>

          <button
            onClick={handleCopy}
            disabled={!isActive}
            className={`w-full py-2 px-4 rounded font-medium transition-colors ${
              isActive
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isActive ? 'Sao chép mã' : 'Không khả dụng'}
          </button>
        </div>
      </div>
    </div>
  );
}
