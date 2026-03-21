// utils/format.js

/**
 * Format giá tiền VND — tương đương format_price() trong Laravel
 */
export const formatPrice = (amount, currency = 'VND') => {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};
