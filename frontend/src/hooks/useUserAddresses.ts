import { useState, useEffect } from 'react';
import { Address } from '../types';

interface UserAddressData {
  [userId: string]: Address[];
}

// Get user data from localStorage
const getUserData = () => {
  const userData = localStorage.getItem('userData');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const useUserAddresses = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);

  const STORAGE_KEY = 'user_addresses';

  // Get user ID (use email or a unique identifier)
  const getUserId = () => {
    const user = getUserData();
    return user?.email || user?.id || 'guest';
  };

  // Check if user is logged in
  const isLoggedIn = () => {
    return !!localStorage.getItem('auth_token') && !!localStorage.getItem('userData');
  };

  // Load addresses from localStorage
  const loadAddresses = () => {
    if (!isLoggedIn()) {
      setAddresses([]);
      return;
    }

    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      if (storedData) {
        const allUserAddresses: UserAddressData = JSON.parse(storedData);
        const userId = getUserId();
        const userAddresses = allUserAddresses[userId] || [];
        setAddresses(userAddresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      setAddresses([]);
    }
  };

  // Save addresses to localStorage
  const saveAddresses = (newAddresses: Address[]) => {
    if (!isLoggedIn()) return;

    try {
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allUserAddresses: UserAddressData = storedData ? JSON.parse(storedData) : {};
      const userId = getUserId();
      
      allUserAddresses[userId] = newAddresses;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allUserAddresses));
      setAddresses(newAddresses);
    } catch (error) {
      // Silent error handling
    }
  };

  // Add new address
  const addAddress = (addressData: Omit<Address, 'id'>) => {
    setLoading(true);
    
    const newAddress: Address = {
      ...addressData,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    };

    // If this is set as default, remove default from others
    let updatedAddresses = [...addresses];
    if (newAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => ({ ...addr, isDefault: false }));
    }

    updatedAddresses.push(newAddress);
    saveAddresses(updatedAddresses);
    setLoading(false);
    
    return newAddress;
  };

  // Update existing address
  const updateAddress = (updatedAddress: Address) => {
    setLoading(true);
    
    let updatedAddresses = addresses.map(addr => 
      addr.id === updatedAddress.id ? updatedAddress : addr
    );

    // If this is set as default, remove default from others
    if (updatedAddress.isDefault) {
      updatedAddresses = updatedAddresses.map(addr => 
        addr.id === updatedAddress.id ? updatedAddress : { ...addr, isDefault: false }
      );
    }

    saveAddresses(updatedAddresses);
    setLoading(false);
  };

  // Delete address
  const deleteAddress = (addressId: string) => {
    setLoading(true);
    
    const updatedAddresses = addresses.filter(addr => addr.id !== addressId);
    saveAddresses(updatedAddresses);
    setLoading(false);
  };

  // Get default address
  const getDefaultAddress = (): Address | null => {
    return addresses.find(addr => addr.isDefault) || null;
  };

  // Set address as default
  const setDefaultAddress = (addressId: string) => {
    setLoading(true);
    
    const updatedAddresses = addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === addressId
    }));
    
    saveAddresses(updatedAddresses);
    setLoading(false);
  };

  // Load addresses when component mounts or auth changes
  useEffect(() => {
    loadAddresses();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      loadAddresses();
    };
    
    window.addEventListener('authChanged', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);
    
    return () => {
      window.removeEventListener('authChanged', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  return {
    addresses,
    loading,
    addAddress,
    updateAddress,
    deleteAddress,
    getDefaultAddress,
    setDefaultAddress,
    refreshAddresses: loadAddresses
  };
};