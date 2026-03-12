import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface GHNProvince {
  ProvinceID: number;
  ProvinceName: string;
  Code?: string;
}

interface GHNDistrict {
  DistrictID: number;
  DistrictName: string;
  ProvinceID: number;
}

interface GHNWard {
  WardCode: string;
  WardName: string;
  DistrictID: number;
}

interface GHNAddressSelectorProps {
  onAddressChange: (address: {
    province: { name: string; id: number } | null;
    district: { name: string; id: number } | null;
    ward: { name: string; code: string } | null;
  }) => void;
  className?: string;
}

export default function GHNAddressSelector({ 
  onAddressChange, 
  className = '' 
}: GHNAddressSelectorProps) {
  const [provinces, setProvinces] = useState<GHNProvince[]>([]);
  const [districts, setDistricts] = useState<GHNDistrict[]>([]);
  const [wards, setWards] = useState<GHNWard[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<GHNProvince | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<GHNDistrict | null>(null);
  const [selectedWard, setSelectedWard] = useState<GHNWard | null>(null);
  
  const [loading, setLoading] = useState({
    provinces: false,
    districts: false,
    wards: false,
  });

  // Load provinces on mount
  useEffect(() => {
    const loadProvinces = async () => {
      setLoading(prev => ({ ...prev, provinces: true }));
      const result = await api.shipping.getProvinces();
      if (result.success && result.data) {
        setProvinces(result.data);
      }
      setLoading(prev => ({ ...prev, provinces: false }));
    };
    loadProvinces();
  }, []);

  // Load districts when province changes
  useEffect(() => {
    if (!selectedProvince) {
      setDistricts([]);
      setSelectedDistrict(null);
      setWards([]);
      setSelectedWard(null);
      return;
    }

    const loadDistricts = async () => {
      setLoading(prev => ({ ...prev, districts: true }));
      const result = await api.shipping.getDistricts(selectedProvince.ProvinceID);
      if (result.success && result.data) {
        setDistricts(result.data);
      }
      setLoading(prev => ({ ...prev, districts: false }));
    };
    loadDistricts();
  }, [selectedProvince]);

  // Load wards when district changes
  useEffect(() => {
    if (!selectedDistrict) {
      setWards([]);
      setSelectedWard(null);
      return;
    }

    const loadWards = async () => {
      setLoading(prev => ({ ...prev, wards: true }));
      const result = await api.shipping.getWards(selectedDistrict.DistrictID);
      if (result.success && result.data) {
        setWards(result.data);
      }
      setLoading(prev => ({ ...prev, wards: false }));
    };
    loadWards();
  }, [selectedDistrict]);

  // Notify parent when address changes
  useEffect(() => {
    onAddressChange({
      province: selectedProvince ? { 
        name: selectedProvince.ProvinceName, 
        id: selectedProvince.ProvinceID 
      } : null,
      district: selectedDistrict ? { 
        name: selectedDistrict.DistrictName, 
        id: selectedDistrict.DistrictID 
      } : null,
      ward: selectedWard ? { 
        name: selectedWard.WardName, 
        code: selectedWard.WardCode 
      } : null,
    });
  }, [selectedProvince, selectedDistrict, selectedWard, onAddressChange]);

  return (
    <div className={`space-y-3 sm:space-y-4 ${className}`}>
      {/* Province */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tỉnh/Thành phố <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedProvince?.ProvinceID || ''}
          onChange={(e) => {
            const province = provinces.find(p => p.ProvinceID === Number(e.target.value));
            setSelectedProvince(province || null);
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm sm:text-base"
          required
          disabled={loading.provinces}
        >
          <option value="">
            {loading.provinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
          </option>
          {provinces.map((province) => (
            <option key={province.ProvinceID} value={province.ProvinceID}>
              {province.ProvinceName}
            </option>
          ))}
        </select>
      </div>

      {/* District */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quận/Huyện <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedDistrict?.DistrictID || ''}
          onChange={(e) => {
            const district = districts.find(d => d.DistrictID === Number(e.target.value));
            setSelectedDistrict(district || null);
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm sm:text-base"
          required
          disabled={!selectedProvince || loading.districts}
        >
          <option value="">
            {loading.districts ? 'Đang tải...' : 'Chọn quận/huyện'}
          </option>
          {districts.map((district) => (
            <option key={district.DistrictID} value={district.DistrictID}>
              {district.DistrictName}
            </option>
          ))}
        </select>
      </div>

      {/* Ward */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phường/Xã <span className="text-red-500">*</span>
        </label>
        <select
          value={selectedWard?.WardCode || ''}
          onChange={(e) => {
            const ward = wards.find(w => w.WardCode === e.target.value);
            setSelectedWard(ward || null);
          }}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent text-sm sm:text-base"
          required
          disabled={!selectedDistrict || loading.wards}
        >
          <option value="">
            {loading.wards ? 'Đang tải...' : 'Chọn phường/xã'}
          </option>
          {wards.map((ward) => (
            <option key={ward.WardCode} value={ward.WardCode}>
              {ward.WardName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
