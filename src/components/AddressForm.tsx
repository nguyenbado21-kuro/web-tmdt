import { useState, useEffect, useCallback } from 'react';
import Button from './Button';
import VietnamAddressDropdown from './VietnamAddressDropdown';
import { Address } from '../types';

interface AddressFormProps {
  address?: Address;
  onSave: (address: Omit<Address, 'id'> | Address) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ApiAddress {
  province: { name: string; code: number } | null;
  district: { name: string; code: number } | null;
  ward: { name: string; code: number } | null;
}

export default function AddressForm({ address, onSave, onCancel, isLoading }: AddressFormProps) {
  const [formData, setFormData] = useState<Omit<Address, 'id'> & { id?: string }>({
    id: address?.id,
    name: address?.name || '',
    phone: address?.phone || '',
    province: address?.province || '',
    district: address?.district || '',
    ward: address?.ward || '',
    detailAddress: address?.detailAddress || '',
    isDefault: address?.isDefault || false,
    type: address?.type || 'home',
  });

  const [selectedApiAddress, setSelectedApiAddress] = useState<ApiAddress>({
    province: null,
    district: null,
    ward: null
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.address-selector')) {
        // Handle any cleanup if needed
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof (Omit<Address, 'id'> & { id?: string }), value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = useCallback((apiAddress: ApiAddress) => {
    setSelectedApiAddress(apiAddress);
    
    // Update form data with selected address
    setFormData(prev => ({
      ...prev,
      province: apiAddress.province?.name || '',
      district: apiAddress.district?.name || '',
      ward: apiAddress.ward?.name || ''
    }));
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto pb-24 md:pb-0">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {address ? 'Cập nhật địa chỉ' : 'Địa chỉ mới (dùng thông tin trước sẵp nhập)'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name and Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Province/City Selector */}
            <div className="address-selector">
              <VietnamAddressDropdown
                onAddressChange={handleAddressChange}
                className="mb-4"
              />
            </div>

            {/* Detailed Address */}
            <div>
              <textarea
                placeholder="Địa chỉ cụ thể"
                value={formData.detailAddress}
                onChange={(e) => handleChange('detailAddress', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                required
              />
            </div>

            {/* Add Location Button */}
            <button
              type="button"
              className="flex items-center gap-2 text-brand-500 hover:text-brand-600 text-sm"
            >
              <span className="text-lg">+</span>
              Thêm vị trí
            </button>

            {/* Address Type */}
            <div>
              <p className="text-gray-700 font-medium mb-3">Loại địa chỉ:</p>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="home"
                    checked={formData.type === 'home'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="mr-2"
                  />
                  <span className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                    Nhà Riêng
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="office"
                    checked={formData.type === 'office'}
                    onChange={(e) => handleChange('type', e.target.value)}
                    className="mr-2"
                  />
                  <span className="px-4 py-2 border border-gray-300 rounded-lg text-sm">
                    Văn Phòng
                  </span>
                </label>
              </div>
            </div>

            {/* Default Address */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isDefault"
                checked={formData.isDefault}
                onChange={(e) => handleChange('isDefault', e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="isDefault" className="text-gray-700">
                Đặt làm địa chỉ mặc định
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Trở Lại
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                loading={isLoading}
              >
                Hoàn thành
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}