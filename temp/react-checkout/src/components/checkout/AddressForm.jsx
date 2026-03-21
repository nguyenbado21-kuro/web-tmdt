// components/checkout/AddressForm.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setAddress } from '../../store/checkoutSlice';
import { getProvinces, getDistricts, getWards } from '../../api/checkoutApi';

const Field = ({ label, error, children }) => (
  <div className="form-group">
    <label>{label}</label>
    {children}
    {error && <span className="error-text">{error}</span>}
  </div>
);

const AddressForm = ({ onSubmit, loading }) => {
  const dispatch = useDispatch();
  const address = useSelector((s) => s.checkout.address);

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [errors, setErrors] = useState({});

  // Load tỉnh/thành khi mount
  useEffect(() => {
    getProvinces().then((data) => setProvinces(data || []));
  }, []);

  // Load quận/huyện khi chọn tỉnh
  useEffect(() => {
    if (!address.state) { setDistricts([]); setWards([]); return; }
    getDistricts(address.state).then((data) => {
      setDistricts(data || []);
      setWards([]);
      dispatch(setAddress({ city: '', ward: '' }));
    });
  }, [address.state]);

  // Load phường/xã khi chọn quận
  useEffect(() => {
    if (!address.city) { setWards([]); return; }
    getWards(address.city).then((data) => {
      setWards(data || []);
      dispatch(setAddress({ ward: '' }));
    });
  }, [address.city]);

  const handleChange = (field) => (e) => {
    dispatch(setAddress({ [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!address.name?.trim()) errs.name = 'Vui lòng nhập họ tên';
    if (!address.phone?.trim()) errs.phone = 'Vui lòng nhập số điện thoại';
    if (!address.email?.trim()) errs.email = 'Vui lòng nhập email';
    if (!address.address?.trim()) errs.address = 'Vui lòng nhập địa chỉ';
    if (!address.state) errs.state = 'Vui lòng chọn tỉnh/thành';
    if (!address.city) errs.city = 'Vui lòng chọn quận/huyện';
    if (!address.ward) errs.ward = 'Vui lòng chọn phường/xã';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) onSubmit(address);
  };

  return (
    <form onSubmit={handleSubmit} className="address-form">
      <h3>Thông tin giao hàng</h3>

      <Field label="Họ và tên *" error={errors.name}>
        <input
          type="text"
          value={address.name}
          onChange={handleChange('name')}
          placeholder="Nguyễn Văn A"
          className={errors.name ? 'input-error' : ''}
        />
      </Field>

      <div className="form-row">
        <Field label="Số điện thoại *" error={errors.phone}>
          <input
            type="tel"
            value={address.phone}
            onChange={handleChange('phone')}
            placeholder="0901234567"
            className={errors.phone ? 'input-error' : ''}
          />
        </Field>
        <Field label="Email *" error={errors.email}>
          <input
            type="email"
            value={address.email}
            onChange={handleChange('email')}
            placeholder="email@example.com"
            className={errors.email ? 'input-error' : ''}
          />
        </Field>
      </div>

      <Field label="Địa chỉ *" error={errors.address}>
        <input
          type="text"
          value={address.address}
          onChange={handleChange('address')}
          placeholder="Số nhà, tên đường..."
          className={errors.address ? 'input-error' : ''}
        />
      </Field>

      <div className="form-row">
        <Field label="Tỉnh/Thành phố *" error={errors.state}>
          <select
            value={address.state}
            onChange={handleChange('state')}
            className={errors.state ? 'input-error' : ''}
          >
            <option value="">-- Chọn tỉnh/thành --</option>
            {provinces.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Quận/Huyện *" error={errors.city}>
          <select
            value={address.city}
            onChange={handleChange('city')}
            disabled={!address.state}
            className={errors.city ? 'input-error' : ''}
          >
            <option value="">-- Chọn quận/huyện --</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Phường/Xã *" error={errors.ward}>
          <select
            value={address.ward}
            onChange={handleChange('ward')}
            disabled={!address.city}
            className={errors.ward ? 'input-error' : ''}
          >
            <option value="">-- Chọn phường/xã --</option>
            {wards.map((w) => (
              <option key={w.id} value={w.id}>{w.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <button type="submit" className="btn-primary" disabled={loading}>
        {loading ? 'Đang xử lý...' : 'Tiếp tục'}
      </button>
    </form>
  );
};

export default AddressForm;
