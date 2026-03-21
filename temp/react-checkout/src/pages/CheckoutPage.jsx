// pages/CheckoutPage.jsx
// Trang checkout chính — quản lý 3 bước: information → payment → success

import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setToken } from '../store/checkoutSlice';
import { fetchCheckoutSession } from '../store/checkoutSlice';
import { useCheckout } from '../hooks/useCheckout';

import AddressForm from '../components/checkout/AddressForm';
import ShippingMethod from '../components/checkout/ShippingMethod';
import PaymentMethod from '../components/checkout/PaymentMethod';
import OrderSummary from '../components/checkout/OrderSummary';
import CheckoutSuccess from '../components/checkout/CheckoutSuccess';

// Breadcrumb steps
const STEPS = [
  { key: 'information', label: 'Thông tin' },
  { key: 'payment', label: 'Thanh toán' },
  { key: 'success', label: 'Hoàn tất' },
];

const StepIndicator = ({ currentStep }) => (
  <div className="step-indicator">
    {STEPS.map((step, idx) => {
      const stepIdx = STEPS.findIndex((s) => s.key === currentStep);
      const status = idx < stepIdx ? 'done' : idx === stepIdx ? 'active' : 'pending';
      return (
        <React.Fragment key={step.key}>
          <div className={`step-item ${status}`}>
            <span className="step-number">{idx + 1}</span>
            <span className="step-label">{step.label}</span>
          </div>
          {idx < STEPS.length - 1 && <div className={`step-line ${idx < stepIdx ? 'done' : ''}`} />}
        </React.Fragment>
      );
    })}
  </div>
);

const CheckoutPage = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { step, loading, error, handleSaveInformation, handleSubmitCheckout, clearError } =
    useCheckout();

  // Init token + fetch session
  useEffect(() => {
    if (token) {
      dispatch(setToken(token));
      dispatch(fetchCheckoutSession(token));
    }
  }, [token, dispatch]);

  // Redirect nếu payment gateway trả về URL
  const checkoutUrl = useSelector((s) => s.checkout.checkoutUrl);
  useEffect(() => {
    if (checkoutUrl) window.location.href = checkoutUrl;
  }, [checkoutUrl]);

  if (step === 'success') return <CheckoutSuccess />;

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h2>Thanh toán</h2>
        <StepIndicator currentStep={step} />
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={clearError}>✕</button>
        </div>
      )}

      <div className="checkout-layout">
        {/* LEFT: Form */}
        <div className="checkout-main">
          {step === 'information' && (
            <AddressForm
              onSubmit={handleSaveInformation}
              loading={loading}
            />
          )}

          {step === 'payment' && (
            <div className="payment-step">
              <ShippingMethod />
              <PaymentMethod />

              <div className="checkout-actions">
                <button
                  className="btn-secondary"
                  onClick={() => dispatch({ type: 'checkout/setStep', payload: 'information' })}
                >
                  ← Quay lại
                </button>
                <button
                  className="btn-primary btn-place-order"
                  onClick={handleSubmitCheckout}
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đặt hàng'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT: Order summary */}
        <div className="checkout-sidebar">
          <OrderSummary />
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
