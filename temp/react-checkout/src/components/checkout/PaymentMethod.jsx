// components/checkout/PaymentMethod.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setPaymentMethod } from '../../store/checkoutSlice';

// Các phương thức thanh toán — map với PaymentMethodEnum trong Laravel
const PAYMENT_METHODS = [
  {
    value: 'cod',
    label: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán bằng tiền mặt khi nhận hàng.',
    icon: '💵',
  },
  {
    value: 'bank_transfer',
    label: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản trực tiếp vào tài khoản ngân hàng của chúng tôi.',
    icon: '🏦',
  },
  {
    value: 'vnpay',
    label: 'VNPay',
    description: 'Thanh toán qua cổng VNPay (ATM, Visa, QR Code).',
    icon: '💳',
  },
  {
    value: 'stripe',
    label: 'Thẻ tín dụng / Stripe',
    description: 'Thanh toán an toàn qua Stripe.',
    icon: '💳',
  },
];

const PaymentMethod = () => {
  const dispatch = useDispatch();
  const paymentMethod = useSelector((s) => s.checkout.paymentMethod);

  return (
    <div className="payment-method">
      <h4>Phương thức thanh toán</h4>
      <div className="payment-list">
        {PAYMENT_METHODS.map((method) => {
          const isSelected = paymentMethod === method.value;
          return (
            <label
              key={method.value}
              className={`payment-item ${isSelected ? 'selected' : ''}`}
            >
              <input
                type="radio"
                name="payment_method"
                value={method.value}
                checked={isSelected}
                onChange={() => dispatch(setPaymentMethod(method.value))}
              />
              <span className="payment-icon">{method.icon}</span>
              <div className="payment-info">
                <span className="payment-label">{method.label}</span>
                {isSelected && (
                  <p className="payment-description">{method.description}</p>
                )}
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export default PaymentMethod;
