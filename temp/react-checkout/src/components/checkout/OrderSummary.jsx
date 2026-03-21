// components/checkout/OrderSummary.jsx
import React from 'react';
import { useSelector } from 'react-redux';
import { selectOrderTotal } from '../../store/checkoutSlice';
import { formatPrice } from '../../utils/format';
import CouponBox from './CouponBox';

const SummaryRow = ({ label, value, highlight, strikethrough }) => (
  <div className={`summary-row ${highlight ? 'highlight' : ''}`}>
    <span>{label}</span>
    <span className={strikethrough ? 'strikethrough' : ''}>{value}</span>
  </div>
);

const OrderSummary = () => {
  const {
    products,
    subTotal,
    taxAmount,
    promotionDiscount,
    couponDiscount,
    pointDiscount,
    selectedShipping,
  } = useSelector((s) => s.checkout);
  const orderTotal = useSelector(selectOrderTotal);

  const shippingPrice = selectedShipping?.price ?? null;
  const totalDiscount = promotionDiscount + couponDiscount + pointDiscount;

  return (
    <div className="order-summary">
      <h3>Đơn hàng của bạn</h3>

      {/* Danh sách sản phẩm */}
      <div className="product-list">
        {products.map((product) => (
          <div key={product.id} className="product-item">
            <div className="product-image-wrap">
              <img src={product.image} alt={product.name} />
              <span className="product-qty">{product.qty}</span>
            </div>
            <div className="product-details">
              <span className="product-name">{product.name}</span>
              {product.options && (
                <span className="product-options">{product.options}</span>
              )}
            </div>
            <span className="product-price">
              {formatPrice(product.price * product.qty)}
            </span>
          </div>
        ))}
      </div>

      <div className="summary-divider" />

      {/* Mã giảm giá */}
      <CouponBox />

      <div className="summary-divider" />

      {/* Tổng tiền */}
      <div className="summary-totals">
        <SummaryRow label="Tạm tính" value={formatPrice(subTotal)} />

        {taxAmount > 0 && (
          <SummaryRow label="Thuế" value={formatPrice(taxAmount)} />
        )}

        <SummaryRow
          label="Phí vận chuyển"
          value={
            shippingPrice === null
              ? 'Chưa tính'
              : shippingPrice === 0
              ? 'Miễn phí'
              : formatPrice(shippingPrice)
          }
        />

        {promotionDiscount > 0 && (
          <SummaryRow
            label="Giảm giá khuyến mãi"
            value={`-${formatPrice(promotionDiscount)}`}
          />
        )}

        {couponDiscount > 0 && (
          <SummaryRow
            label="Mã giảm giá"
            value={`-${formatPrice(couponDiscount)}`}
          />
        )}

        {pointDiscount > 0 && (
          <SummaryRow
            label="Điểm thưởng"
            value={`-${formatPrice(pointDiscount)}`}
          />
        )}

        {totalDiscount > 0 && (
          <SummaryRow
            label="Tổng giảm giá"
            value={`-${formatPrice(totalDiscount)}`}
          />
        )}

        <div className="summary-divider" />

        <SummaryRow
          label="Tổng cộng"
          value={formatPrice(orderTotal)}
          highlight
        />
      </div>
    </div>
  );
};

export default OrderSummary;
