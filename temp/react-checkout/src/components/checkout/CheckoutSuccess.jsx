// components/checkout/CheckoutSuccess.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { formatPrice } from '../../utils/format';
import { selectOrderTotal } from '../../store/checkoutSlice';

const SHIPPING_LABELS = {
  ship_ghtk: 'Giao Hàng Tiết Kiệm',
  ship_ghn: 'Giao Hàng Nhanh',
  ship_ghht: 'Giao Hàng Hỏa Tốc',
};

const PAYMENT_LABELS = {
  cod: 'Thanh toán khi nhận hàng',
  bank_transfer: 'Chuyển khoản ngân hàng',
  vnpay: 'VNPay',
  stripe: 'Thẻ tín dụng',
};

const CheckoutSuccess = () => {
  const { address, selectedShipping, paymentMethod, products } = useSelector((s) => s.checkout);
  const orderTotal = useSelector(selectOrderTotal);

  return (
    <div className="checkout-success">
      <div className="success-icon">✅</div>
      <h2>Đặt hàng thành công!</h2>
      <p>Cảm ơn bạn đã mua hàng. Chúng tôi sẽ liên hệ xác nhận đơn hàng sớm nhất.</p>

      <div className="success-details">
        {/* Địa chỉ giao hàng */}
        <div className="success-section">
          <h4>Địa chỉ giao hàng</h4>
          <p>{address.name} — {address.phone}</p>
          <p>{address.address}</p>
          <p>{address.email}</p>
        </div>

        {/* Phương thức vận chuyển */}
        {selectedShipping && (
          <div className="success-section">
            <h4>Vận chuyển</h4>
            <p>{SHIPPING_LABELS[selectedShipping.option] || selectedShipping.option}</p>
            <p>Phí ship: {selectedShipping.price === 0 ? 'Miễn phí' : formatPrice(selectedShipping.price)}</p>
          </div>
        )}

        {/* Phương thức thanh toán */}
        <div className="success-section">
          <h4>Thanh toán</h4>
          <p>{PAYMENT_LABELS[paymentMethod] || paymentMethod}</p>
        </div>

        {/* Sản phẩm */}
        <div className="success-section">
          <h4>Sản phẩm ({products.length})</h4>
          {products.map((p) => (
            <div key={p.id} className="success-product">
              <span>{p.name} x{p.qty}</span>
              <span>{formatPrice(p.price * p.qty)}</span>
            </div>
          ))}
          <div className="success-total">
            <strong>Tổng cộng: {formatPrice(orderTotal)}</strong>
          </div>
        </div>
      </div>

      <div className="success-actions">
        <Link to="/" className="btn-primary">Tiếp tục mua sắm</Link>
        <Link to="/orders" className="btn-secondary">Xem đơn hàng</Link>
      </div>
    </div>
  );
};

export default CheckoutSuccess;
