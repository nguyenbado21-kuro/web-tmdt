import { useState } from 'react';
import Button from './Button';
import AddressForm from './AddressForm';
import { Address } from '../types';

interface AddressSelectorProps {
  addresses: Address[];
  selectedAddressId?: string;
  onSelectAddress: (address: Address) => void;
  onAddAddress: (address: Omit<Address, 'id'>) => void;
  onUpdateAddress: (address: Address) => void;
  onDeleteAddress: (addressId: string) => void;
  onClose: () => void;
}

export default function AddressSelector({
  addresses,
  selectedAddressId,
  onSelectAddress,
  onAddAddress,
  onUpdateAddress,
  onDeleteAddress,
  onClose
}: AddressSelectorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSaveAddress = async (addressData: Omit<Address, 'id'> | Address) => {
    setIsLoading(true);
    try {
      if ('id' in addressData && addressData.id) {
        // Update existing address
        onUpdateAddress(addressData as Address);
        setEditingAddress(null);
      } else {
        // Add new address
        onAddAddress(addressData as Omit<Address, 'id'>);
        setShowAddForm(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatAddress = (address: Address) => {
    return `${address.detailAddress}, ${address.ward}, ${address.district}, ${address.province}`;
  };

  if (showAddForm) {
    return (
      <AddressForm
        onSave={handleSaveAddress}
        onCancel={() => setShowAddForm(false)}
        isLoading={isLoading}
      />
    );
  }

  if (editingAddress) {
    return (
      <AddressForm
        address={editingAddress}
        onSave={handleSaveAddress}
        onCancel={() => setEditingAddress(null)}
        isLoading={isLoading}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900">Địa chỉ của tôi</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Address List */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            {addresses.length === 0 ? (
              <div className="text-center py-6 sm:py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm">Bạn chưa có địa chỉ giao hàng nào</p>
              </div>
            ) : (
              addresses.map((address) => (
                <div
                  key={address.id}
                  className={`border rounded-lg p-3 sm:p-4 cursor-pointer transition-colors ${
                    selectedAddressId === address.id
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onSelectAddress(address)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                        <span className="font-medium text-sm sm:text-base truncate">{address.name}</span>
                        <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">{address.phone}</span>
                        {address.isDefault && (
                          <span className="bg-red-100 text-red-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                            Mặc định
                          </span>
                        )}
                        <span className="bg-gray-100 text-gray-600 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded whitespace-nowrap">
                          {address.type === 'home' ? 'Nhà Riêng' : 'Văn Phòng'}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{formatAddress(address)}</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 sm:ml-4 self-start">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingAddress(address);
                        }}
                        className="text-brand-500 hover:text-brand-600 text-xs sm:text-sm whitespace-nowrap"
                      >
                        Cập nhật
                      </button>
                      {!address.isDefault && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteAddress(address.id);
                          }}
                          className="text-red-500 hover:text-red-600 text-xs sm:text-sm whitespace-nowrap"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Add New Address Button */}
          <Button
            variant="outline"
            onClick={() => setShowAddForm(true)}
            className="w-full mb-3 sm:mb-4 text-sm sm:text-base py-2 sm:py-3"
          >
            + Thêm địa chỉ mới
          </Button>

          {/* Action Buttons */}
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 text-sm sm:text-base py-2 sm:py-3"
            >
              Hủy
            </Button>
            <Button
              onClick={onClose}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm sm:text-base py-2 sm:py-3"
              disabled={!selectedAddressId && addresses.length === 0}
            >
              {selectedAddressId ? 'Xác nhận' : 'Chọn địa chỉ'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}