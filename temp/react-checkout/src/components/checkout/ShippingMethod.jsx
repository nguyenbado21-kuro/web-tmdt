// components/checkout/ShippingMethod.jsx
import React from 'react';
import { useShipping } from '../../hooks/useShipping';
import { formatPrice } from '../../utils/format';

// Map code → label hiển thị (giống Laravel)
const SHIPPING_LABELS = {
  ship_ghtk: 'Giao Hàng Tiết Kiệm',
  ship_ghn: 'Giao Hàng Nhanh',
  ship_ghht: 'Giao Hàng Hỏa Tốc',
};

const COMPANY_LABELS = {
  SHIP_VIETTEL_POST: 'Viettel Post',
  SHIP_GHTK: 'GHTK',
  SHIP_SHIPPO: 'Shippo',
};

const ShippingMethod = () => {
  const { shippingRates, selectedShipping, shippingLoading, selectRate } = useShipping();

  if (shippingLoading) {
    return (
      <div className="shipping-loading">
        <span className="spinner" />
        Đang tính phí vận chuyển...
      </div>
    );
  }

  if (!shippingRates.length) {
    return (
      <div className="shipping-empty">
        Vui lòng nhập địa chỉ để xem phí vận chuyển
      </div>
    );
  }

  return (
    <div className="shipping-method">
      <h4>Phương thức vận chuyển</h4>
      <div className="shipping-list">
        {shippingRates.map((rate) => {
          const isSelected = selectedShipping?.option === rate.type;
          return (
            <label
              key={`${rate.company_name}-${rate.type}`}
              className={`shipping-item ${isSelected ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="shipping_method"
                value={rate.type}
                checked={isSelected}
                onChange={() => selectRate(rate)}
              />
              <div className="shipping-info">
                <span className="shipping-name">
                  {SHIPPING_LABELS[rate.type] || rate.name}
                </span>
                <span className="shipping-company">
                  {COMPANY_LABELS[rate.company_name] || rate.company_name}
                </span>
              </div>
              <span className="shipping-price">
                {rate.price === 0 ? (
                  <span className="free-ship">Miễn phí</span>
                ) : (
                  formatPrice(rate.price)
                )}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default ShippingMethod;
