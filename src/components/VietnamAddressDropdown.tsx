import React, { useState, useEffect } from 'react';

// Types for API responses
interface Province {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  phone_code: number;
  districts: District[];
}

interface District {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  province_code: number;
  wards: Ward[];
}

interface Ward {
  name: string;
  code: number;
  division_type: string;
  codename: string;
  district_code: number;
}

// Component props
interface VietnamAddressDropdownProps {
  onAddressChange?: (address: {
    province: Province | null;
    district: District | null;
    ward: Ward | null;
  }) => void;
  className?: string;
}

const VietnamAddressDropdown: React.FC<VietnamAddressDropdownProps> = ({
  onAddressChange,
  className = ''
}) => {
  // State management
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  
  // Loading states
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  
  // Error states
  const [error, setError] = useState<string | null>(null);

  // API base URL
  const API_BASE = 'https://provinces.open-api.vn/api/v1';

  // Fetch provinces on component mount
  useEffect(() => {
    fetchProvinces();
  }, []);

  // Fetch districts when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetchDistricts(selectedProvince.code);
      // Reset district and ward when province changes
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
    } else {
      setDistricts([]);
      setSelectedDistrict(null);
      setSelectedWard(null);
      setWards([]);
    }
  }, [selectedProvince]);

  // Fetch wards when district changes
  useEffect(() => {
    if (selectedDistrict) {
      fetchWards(selectedDistrict.code);
      // Reset ward when district changes
      setSelectedWard(null);
    } else {
      setWards([]);
      setSelectedWard(null);
    }
  }, [selectedDistrict]);

  // Notify parent component when address changes
  useEffect(() => {
    if (onAddressChange) {
      onAddressChange({
        province: selectedProvince,
        district: selectedDistrict,
        ward: selectedWard
      });
    }
  }, [selectedProvince, selectedDistrict, selectedWard]); // Remove onAddressChange from dependencies

  // API functions
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Province[] = await response.json();
      setProvinces(data);
    } catch (err) {
      setError('Không thể tải danh sách tỉnh thành');
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceCode: number) => {
    setLoadingDistricts(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/d`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allDistricts: District[] = await response.json();
      // Filter districts by province code
      const provinceDistricts = allDistricts.filter(
        district => district.province_code === provinceCode
      );
      setDistricts(provinceDistricts);
    } catch (err) {
      setError('Không thể tải danh sách quận huyện');
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchWards = async (districtCode: number) => {
    setLoadingWards(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/w`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const allWards: Ward[] = await response.json();
      // Filter wards by district code
      const districtWards = allWards.filter(
        ward => ward.district_code === districtCode
      );
      setWards(districtWards);
    } catch (err) {
      setError('Không thể tải danh sách phường xã');
    } finally {
      setLoadingWards(false);
    }
  };

  // Event handlers
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const provinceCode = parseInt(e.target.value);
    if (provinceCode) {
      const province = provinces.find(p => p.code === provinceCode);
      setSelectedProvince(province || null);
    } else {
      setSelectedProvince(null);
    }
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const districtCode = parseInt(e.target.value);
    if (districtCode) {
      const district = districts.find(d => d.code === districtCode);
      setSelectedDistrict(district || null);
    } else {
      setSelectedDistrict(null);
    }
  };

  const handleWardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const wardCode = parseInt(e.target.value);
    if (wardCode) {
      const ward = wards.find(w => w.code === wardCode);
      setSelectedWard(ward || null);
    } else {
      setSelectedWard(null);
    }
  };

  // Reset function
  const resetSelection = () => {
    setSelectedProvince(null);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);
  };

  return (
    <div className={`vietnam-address-dropdown ${className}`}>
      {error && (
        <div className="error-message mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Province Dropdown */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tỉnh/Thành phố *
          </label>
          <div className="relative">
            <select
              value={selectedProvince?.code || ''}
              onChange={handleProvinceChange}
              disabled={loadingProvinces}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {loadingProvinces ? 'Đang tải...' : 'Chọn tỉnh/thành phố'}
              </option>
              {provinces.map((province) => (
                <option key={province.code} value={province.code}>
                  {province.name}
                </option>
              ))}
            </select>
            {loadingProvinces && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* District Dropdown */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quận/Huyện *
          </label>
          <div className="relative">
            <select
              value={selectedDistrict?.code || ''}
              onChange={handleDistrictChange}
              disabled={!selectedProvince || loadingDistricts}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedProvince 
                  ? 'Chọn tỉnh/thành phố trước'
                  : loadingDistricts 
                  ? 'Đang tải...' 
                  : 'Chọn quận/huyện'
                }
              </option>
              {districts.map((district) => (
                <option key={district.code} value={district.code}>
                  {district.name}
                </option>
              ))}
            </select>
            {loadingDistricts && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>

        {/* Ward Dropdown */}
        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phường/Xã *
          </label>
          <div className="relative">
            <select
              value={selectedWard?.code || ''}
              onChange={handleWardChange}
              disabled={!selectedDistrict || loadingWards}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {!selectedDistrict 
                  ? 'Chọn quận/huyện trước'
                  : loadingWards 
                  ? 'Đang tải...' 
                  : 'Chọn phường/xã'
                }
              </option>
              {wards.map((ward) => (
                <option key={ward.code} value={ward.code}>
                  {ward.name}
                </option>
              ))}
            </select>
            {loadingWards && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset Button */}
      {(selectedProvince || selectedDistrict || selectedWard) && (
        <div className="mt-4">
          <button
            onClick={resetSelection}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Đặt lại
          </button>
        </div>
      )}

      {/* Selected Address Display */}
      {(selectedProvince || selectedDistrict || selectedWard) && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Địa chỉ đã chọn:</h4>
          <div className="text-sm text-gray-600">
            {selectedWard && <span>{selectedWard.name}</span>}
            {selectedDistrict && (
              <span>
                {selectedWard ? ', ' : ''}{selectedDistrict.name}
              </span>
            )}
            {selectedProvince && (
              <span>
                {(selectedDistrict || selectedWard) ? ', ' : ''}{selectedProvince.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default VietnamAddressDropdown;