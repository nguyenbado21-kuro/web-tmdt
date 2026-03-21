// components/checkout/CouponBox.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCouponCode } from '../../store/checkoutSlice';
import { useCheckout } from '../../hooks/useCheckout';

const CouponBox = () => {
  const dispatch = useDispatch();
  const { couponCode, appliedCoupon, handleApplyCoupon, handleRemoveCoupon } = useCheckout();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleApply = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setMessage(null);
    const result = await handleApplyCoupon(couponCode);
    if (result?.error) {
      setMessage({ type: 'error', text: result.payload?.message || 'Mã không hợp lệ' });
    } else {
      setMessage({ type: 'success', text: 'Áp dụng mã giảm giá thành công!' });
    }
    setLoading(false);
  };

  const handleRemove = async () => {
    await handleRemoveCoupon();
    setMessage(null);
  };

  if (appliedCoupon) {
    return (
      <div className="coupon-box applied">
        <span className="coupon-tag">
          🏷️ {appliedCoupon.title || appliedCoupon.code}
        </span>
        <button className="btn-remove-coupon" onClick={handleRemove}>
          Xóa
        </button>
      </div>
    );
  }

  return (
    <div className="coupon-box">
      <div className="coupon-input-row">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => dispatch(setCouponCode(e.target.value.toUpperCase()))}
          placeholder="Nhập mã giảm giá"
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <button
          className="btn-apply-coupon"
          onClick={handleApply}
          disabled={loading || !couponCode.trim()}
        >
          {loading ? '...' : 'Áp dụng'}
        </button>
      </div>
      {message && (
        <p className={`coupon-message ${message.type}`}>{message.text}</p>
      )}
    </div>
  );
};

export default CouponBox;
