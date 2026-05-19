import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Voucher } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface VoucherSelectorProps {
  onSelectVoucher: (voucher: Voucher | null) => void;
  onClose: () => void;
  selectedVoucher?: Voucher | null;
  orderTotal: number;
}

export default function VoucherSelector({ 
  onSelectVoucher, 
  onClose, 
  selectedVoucher,
  orderTotal 
}: VoucherSelectorProps) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [voucherCode, setVoucherCode] = useState('');
  const [tempSelected, setTempSelected] = useState<Voucher | null>(selectedVoucher || null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const response = await api.vouchers.getAll();
      if (response.success && response.data) {
        // Filter only active vouchers
        const activeVouchers = response.data.filter(v => {
          const isExpired = new Date(v.end_date) < new Date();
          return v.status === '1' && !isExpired;
        });
        setVouchers(activeVouchers);
      }
    } catch (err) {
      console.error('Failed to load vouchers:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDiscount = (discount: string) => {
    const value = parseFloat(discount);
    return `${value.toLocaleString('vi-VN')}đ`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const canApplyVoucher = (voucher: Voucher) => {
    const minOrderValue = parseFloat(voucher.min_order_value);
    return orderTotal >= minOrderValue;
  };

  const handleApplyCode = () => {
    const voucher = vouchers.find(v => v.code.toLowerCase() === voucherCode.toLowerCase());
    if (voucher && canApplyVoucher(voucher)) {
      setTempSelected(voucher);
      setVoucherCode('');
    } else if (voucher && !canApplyVoucher(voucher)) {
      alert(`Đơn hàng tối thiểu ${parseFloat(voucher.min_order_value).toLocaleString('vi-VN')}đ`);
    } else {
      alert('Mã voucher không hợp lệ');
    }
  };

  const handleConfirm = () => {
    onSelectVoucher(tempSelected);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Chọn Voucher</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Voucher Code Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã voucher"
              value={voucherCode}
              onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button
              onClick={handleApplyCode}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Áp dụng
            </button>
          </div>
        </div>

        {/* Voucher List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Không có voucher khả dụng</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vouchers.map((voucher) => {
                const isApplicable = canApplyVoucher(voucher);
                const isSelected = tempSelected?.id === voucher.id;

                return (
                  <div
                    key={voucher.id}
                    onClick={() => isApplicable && setTempSelected(isSelected ? null : voucher)}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-red-500 bg-red-50'
                        : isApplicable
                        ? 'border-gray-200 hover:border-red-300'
                        : 'border-gray-200 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Discount Badge */}
                      <div className={`w-20 h-20 rounded-lg flex items-center justify-center shrink-0 ${
                        isApplicable ? 'bg-gradient-to-br from-red-500 to-red-600' : 'bg-gray-400'
                      } text-white`}>
                        <div className="text-center">
                          <div className="text-sm font-bold leading-tight">{formatDiscount(voucher.discount)}</div>
                          <div className="text-xs mt-1">OFF</div>
                        </div>
                      </div>

                      {/* Voucher Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{voucher.code}</h3>
                          {isSelected && (
                            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Đơn tối thiểu: {parseFloat(voucher.min_order_value).toLocaleString('vi-VN')}đ
                        </p>
                        <p className="text-xs text-gray-500">
                          HSD: {formatDate(voucher.end_date)}
                        </p>
                        {!isApplicable && (
                          <p className="text-xs text-red-500 mt-1">
                            Chưa đủ điều kiện áp dụng
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={() => {
              setTempSelected(null);
              onSelectVoucher(null);
              onClose();
            }}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Bỏ chọn
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
