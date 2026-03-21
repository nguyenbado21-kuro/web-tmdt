// api/checkoutApi.js
// Tất cả API calls cho checkout và shipping

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const request = async (method, url, data = null, token = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (data) config.body = JSON.stringify(data);

  const res = await fetch(`${BASE_URL}${url}`, config);
  const json = await res.json();
  if (!res.ok) throw { status: res.status, ...json };
  return json;
};

// ─── CHECKOUT ────────────────────────────────────────────────────────────────

export const getCheckoutSession = (token) =>
  request('GET', `/checkout/${token}`);

export const saveCheckoutInformation = (token, payload) =>
  request('POST', `/checkout/${token}/information`, payload);

export const processCheckout = (token, payload) =>
  request('POST', `/checkout/${token}/process`, payload);

export const getCheckoutSuccess = (token) =>
  request('GET', `/checkout/${token}/success`);

export const recoverCheckout = (token) =>
  request('GET', `/checkout/${token}/recover`);

// ─── SHIPPING ────────────────────────────────────────────────────────────────

export const getShippingRates = (payload) =>
  request('POST', `/shipping/rates`, payload);

// ─── COUPON ──────────────────────────────────────────────────────────────────

export const applyCoupon = (couponCode, token) =>
  request('POST', `/discount/apply`, { coupon_code: couponCode, token });

export const removeCoupon = (token) =>
  request('POST', `/discount/remove`, { token });

// ─── LOCATION ────────────────────────────────────────────────────────────────

export const getProvinces = () =>
  request('GET', `/location/provinces`);

export const getDistricts = (provinceId) =>
  request('GET', `/location/districts?province_id=${provinceId}`);

export const getWards = (districtId) =>
  request('GET', `/location/wards?district_id=${districtId}`);
