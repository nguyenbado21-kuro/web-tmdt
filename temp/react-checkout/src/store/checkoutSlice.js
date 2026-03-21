// store/checkoutSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  getCheckoutSession,
  saveCheckoutInformation,
  processCheckout,
  getShippingRates,
  applyCoupon,
  removeCoupon,
} from '../api/checkoutApi';

// ─── THUNKS ──────────────────────────────────────────────────────────────────

export const fetchCheckoutSession = createAsyncThunk(
  'checkout/fetchSession',
  async (token, { rejectWithValue }) => {
    try { return await getCheckoutSession(token); }
    catch (e) { return rejectWithValue(e); }
  }
);

export const saveInformation = createAsyncThunk(
  'checkout/saveInformation',
  async ({ token, payload }, { rejectWithValue }) => {
    try { return await saveCheckoutInformation(token, payload); }
    catch (e) { return rejectWithValue(e); }
  }
);

export const submitCheckout = createAsyncThunk(
  'checkout/submit',
  async ({ token, payload }, { rejectWithValue }) => {
    try { return await processCheckout(token, payload); }
    catch (e) { return rejectWithValue(e); }
  }
);

export const fetchShippingRates = createAsyncThunk(
  'checkout/fetchShippingRates',
  async (payload, { rejectWithValue }) => {
    try { return await getShippingRates(payload); }
    catch (e) { return rejectWithValue(e); }
  }
);

export const applyDiscountCoupon = createAsyncThunk(
  'checkout/applyCoupon',
  async ({ couponCode, token }, { rejectWithValue }) => {
    try { return await applyCoupon(couponCode, token); }
    catch (e) { return rejectWithValue(e); }
  }
);

export const removeDiscountCoupon = createAsyncThunk(
  'checkout/removeCoupon',
  async (token, { rejectWithValue }) => {
    try { return await removeCoupon(token); }
    catch (e) { return rejectWithValue(e); }
  }
);

// ─── SLICE ───────────────────────────────────────────────────────────────────

const initialState = {
  token: null,
  step: 'information', // information | payment | success

  // Address
  address: {
    name: '', phone: '', email: '',
    address: '', country: '', state: '',
    city: '', ward: '', zip_code: '',
    address_id: null,
  },

  // Shipping
  shippingRates: [],          // [{ type, name, price, company_name }]
  selectedShipping: null,     // { method: 'SHIP_VIETTEL_POST-ship_ghtk', option: 'ship_ghtk', price }
  shippingLoading: false,

  // Payment
  paymentMethod: 'cod',       // cod | bank_transfer | vnpay | stripe

  // Discounts
  couponCode: '',
  appliedCoupon: null,
  promotionDiscount: 0,
  couponDiscount: 0,
  pointDiscount: 0,

  // Order summary
  products: [],
  subTotal: 0,
  taxAmount: 0,
  orderTotal: 0,

  // State
  loading: false,
  error: null,
  checkoutUrl: null,          // redirect URL từ payment gateway
};

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    setToken: (state, { payload }) => { state.token = payload; },
    setStep: (state, { payload }) => { state.step = payload; },
    setAddress: (state, { payload }) => { state.address = { ...state.address, ...payload }; },
    setPaymentMethod: (state, { payload }) => { state.paymentMethod = payload; },
    setSelectedShipping: (state, { payload }) => { state.selectedShipping = payload; },
    setCouponCode: (state, { payload }) => { state.couponCode = payload; },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // fetchCheckoutSession
    builder
      .addCase(fetchCheckoutSession.pending, (state) => { state.loading = true; })
      .addCase(fetchCheckoutSession.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.products = payload.products || [];
        state.subTotal = payload.sub_total || 0;
        state.taxAmount = payload.tax_amount || 0;
        state.promotionDiscount = payload.promotion_discount_amount || 0;
        state.couponDiscount = payload.coupon_discount_amount || 0;
        state.pointDiscount = payload.point_discount_amount || 0;
        if (payload.address) state.address = { ...state.address, ...payload.address };
        if (payload.shipping_option) {
          state.selectedShipping = {
            option: payload.shipping_option,
            method: payload.shipping_method,
            price: payload.shipping_amount || 0,
          };
        }
      })
      .addCase(fetchCheckoutSession.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || 'Không thể tải thông tin checkout';
      });

    // fetchShippingRates
    builder
      .addCase(fetchShippingRates.pending, (state) => { state.shippingLoading = true; })
      .addCase(fetchShippingRates.fulfilled, (state, { payload }) => {
        state.shippingLoading = false;
        // payload: { ship_ghtk: { price, name, company_name }, ship_ghn: {...}, ... }
        state.shippingRates = Object.entries(payload).map(([type, data]) => ({
          type,
          ...data,
        }));
        // Auto-select ship_ghtk nếu chưa chọn
        if (!state.selectedShipping && state.shippingRates.length > 0) {
          const defaultRate = state.shippingRates.find(r => r.type === 'ship_ghtk')
            || state.shippingRates[0];
          state.selectedShipping = {
            option: defaultRate.type,
            method: `${defaultRate.company_name}-${defaultRate.type}`,
            price: defaultRate.price,
          };
        }
      })
      .addCase(fetchShippingRates.rejected, (state) => {
        state.shippingLoading = false;
        state.shippingRates = [];
      });

    // saveInformation
    builder
      .addCase(saveInformation.pending, (state) => { state.loading = true; })
      .addCase(saveInformation.fulfilled, (state, { payload }) => {
        state.loading = false;
        state.step = 'payment';
        if (payload.shipping_rates) {
          state.shippingRates = Object.entries(payload.shipping_rates).map(([type, data]) => ({
            type, ...data,
          }));
        }
      })
      .addCase(saveInformation.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || 'Lưu thông tin thất bại';
      });

    // submitCheckout
    builder
      .addCase(submitCheckout.pending, (state) => { state.loading = true; })
      .addCase(submitCheckout.fulfilled, (state, { payload }) => {
        state.loading = false;
        if (payload.checkoutUrl) {
          state.checkoutUrl = payload.checkoutUrl;
        } else {
          state.step = 'success';
        }
      })
      .addCase(submitCheckout.rejected, (state, { payload }) => {
        state.loading = false;
        state.error = payload?.message || 'Đặt hàng thất bại';
      });

    // applyCoupon
    builder
      .addCase(applyDiscountCoupon.fulfilled, (state, { payload }) => {
        state.appliedCoupon = payload.data?.discount || null;
        state.couponDiscount = payload.data?.discount_amount || 0;
        if (payload.data?.is_free_shipping) {
          if (state.selectedShipping) state.selectedShipping.price = 0;
        }
      })
      .addCase(applyDiscountCoupon.rejected, (state, { payload }) => {
        state.error = payload?.message || 'Mã giảm giá không hợp lệ';
      });

    // removeCoupon
    builder
      .addCase(removeDiscountCoupon.fulfilled, (state) => {
        state.appliedCoupon = null;
        state.couponDiscount = 0;
        state.couponCode = '';
      });
  },
});

export const {
  setToken, setStep, setAddress, setPaymentMethod,
  setSelectedShipping, setCouponCode, clearError,
} = checkoutSlice.actions;

// ─── SELECTORS ───────────────────────────────────────────────────────────────

export const selectOrderTotal = (state) => {
  const { subTotal, taxAmount, promotionDiscount, couponDiscount, pointDiscount } = state.checkout;
  const shippingPrice = state.checkout.selectedShipping?.price || 0;
  return Math.max(
    subTotal + taxAmount + shippingPrice - promotionDiscount - couponDiscount - pointDiscount,
    0
  );
};

export default checkoutSlice.reducer;
