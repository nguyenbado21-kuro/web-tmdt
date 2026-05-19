/**
 * AddressForm.tsx — form địa chỉ + cascade tỉnh/huyện/xã
 */

import { useState } from 'react';
import Button from '../Button';
import VietnamAddressDropdown from '../VietnamAddressDropdown';
import { Address } from '../../types';
import { useCheckoutContext } from '../../store/checkoutContext';
import { useUserAddresses } from '../../hooks/useUserAddresses';
import AddressSelector from '../AddressSelector';

export default function CheckoutAddressForm() {
  const { state, dispatch } = useCheckoutContext();
  const { addresses, addAddress, updateAddress, deleteAddress } = useUserAddresses();
  const [showSelector, setShowSelector] = useState(!state.address);

  const handleSelectAddress = (address: Address) => {
    dispatch({ type: 'SET_ADDRESS', address });
    setShowSelector(false);
  };

  const handleAddAddress = async (data: Omit<Address, 'id'>) => {
    try {
      const newAddr = addAddress(data);
      dispatch({ type: 'SET_ADDRESS', address: newAddr });
      setShowSelector(false);
      return { success: true };
    } catch { return { success: false, error: 'Không thể thêm địa chỉ' }; }
  };

  const handleUpdateAddress = async (updated: Address) => {
    try {
      updateAddress(updated);
      if (state.address?.id === updated.id) dispatch({ type: 'SET_ADDRESS', address: updated });
      setShowSelector(false);
      return { success: true };
    } catch { return { success: false, error: 'Không thể cập nhật địa chỉ' }; }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      deleteAddress(id);
      if (state.address?.id === id) {
        const remaining = addresses.filter(a => a.id !== id);
        if (remaining.length > 0) dispatch({ type: 'SET_ADDRESS', address: remaining[0] });
      }
      return { success: true };
    } catch { return { success: false, error: 'Không thể xóa địa chỉ' }; }
  };

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Địa Chỉ Nhận Hàng</h2>
          <button onClick={() => setShowSelector(true)} className="text-brand-500 text-sm hover:underline">
            {state.address ? 'Thay đổi' : 'Thêm địa chỉ'}
          </button>
        </div>

        {state.address ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">{state.address.name}</span>
              <span className="text-gray-500">{state.address.phone}</span>
              {state.address.isDefault && (
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">Mặc định</span>
              )}
            </div>
            <p className="text-gray-600 text-sm">
              {state.address.detailAddress}, {state.address.ward}, {state.address.district}, {state.address.province}
            </p>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 text-sm mb-4">Bạn chưa có địa chỉ giao hàng</p>
            <button onClick={() => setShowSelector(true)} className="text-brand-500 hover:text-brand-600 font-medium">
              + Thêm địa chỉ giao hàng
            </button>
          </div>
        )}
      </div>

      {showSelector && (
        <AddressSelector
          addresses={addresses}
          selectedAddressId={state.address?.id}
          onSelectAddress={handleSelectAddress}
          onAddAddress={handleAddAddress}
          onUpdateAddress={handleUpdateAddress}
          onDeleteAddress={handleDeleteAddress}
          onClose={() => setShowSelector(false)}
        />
      )}
    </>
  );
}
