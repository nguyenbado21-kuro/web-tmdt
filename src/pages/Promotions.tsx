import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Voucher } from '../types';
import VoucherCard from '../components/VoucherCard';
import LoadingSpinner from '../components/LoadingSpinner';
import SectionTitle from '../components/SectionTitle';

export default function Promotions() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.vouchers.getAll();
      if (response.success && response.data) {
        setVouchers(response.data);
      } else {
        setError(response.error || 'Không thể tải danh sách voucher');
      }
    } catch (err) {
      setError('Đã xảy ra lỗi khi tải voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (code: string) => {
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const filteredVouchers = vouchers.filter(voucher => {
    const isExpired = new Date(voucher.end_date) < new Date();
    const isActive = voucher.status === '1' && !isExpired;

    if (filter === 'active') return isActive;
    if (filter === 'expired') return isExpired || voucher.status !== '1';
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <SectionTitle title="Khuyến Mại" subtitle="Các mã giảm giá đặc biệt dành cho bạn" />

        {/* Filter tabs */}
        <div className="flex gap-4 mb-6 justify-center">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'all'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Tất cả ({vouchers.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'active'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Đang hoạt động
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`px-6 py-2 rounded-full font-medium transition-colors ${
              filter === 'expired'
                ? 'bg-red-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Hết hạn
          </button>
        </div>

        {/* Success message */}
        {copiedCode && (
          <div className="fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
            Đã sao chép mã: {copiedCode}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Vouchers grid */}
        {filteredVouchers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Không có voucher nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVouchers.map(voucher => (
              <VoucherCard
                key={voucher.id}
                voucher={voucher}
                onCopy={handleCopyCode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
