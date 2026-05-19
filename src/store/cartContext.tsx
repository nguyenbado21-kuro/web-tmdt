import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';
import { cartApi } from '../services/cartApi';
import Toast from '../components/Toast';

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: 'ADD'; product: Product; quantity?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'UPDATE'; productId: string; quantity: number }
  | { type: 'CLEAR' }
  | { type: 'LOAD'; items: CartItem[] };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const existing = state.items.find((i) => i.product.id.toString() === action.product.id.toString());
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id.toString() === action.product.id.toString()
              ? { ...i, quantity: i.quantity + (action.quantity ?? 1) }
              : i
          ),
        };
      }
      return { items: [...state.items, { product: action.product, quantity: action.quantity ?? 1 }] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => i.product.id.toString() !== action.productId) };
    case 'UPDATE':
      return {
        items: state.items.map((i) =>
          i.product.id.toString() === action.productId ? { ...i, quantity: action.quantity } : i
        ),
      };
    case 'CLEAR':
      return { items: [] };
    case 'LOAD':
      return { items: action.items };
    default:
      return state;
  }
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

// Helper functions for cart persistence
function getCartUserId(): string {
  const userPhone = localStorage.getItem('userPhone');
  const userData = localStorage.getItem('userData');
  
  let userId = 'guest';
  if (userData) {
    try {
      const user = JSON.parse(userData);
      userId = user.id || user.phone || userPhone || 'guest';
    } catch {
      userId = userPhone || 'guest';
    }
  } else if (userPhone) {
    userId = userPhone;
  }
  
  return userId.toString();
}

function getCartStorageKey(): string {
  return `cart_${getCartUserId()}`;
}

function saveCartToStorage(items: CartItem[]) {
  try {
    const storageKey = getCartStorageKey();
    const data = JSON.stringify(items);
    localStorage.setItem(storageKey, data);
  } catch (error) {
    // Silent error handling
  }
}

function loadCartFromStorage(): CartItem[] {
  try {
    const storageKey = getCartStorageKey();
    const saved = localStorage.getItem(storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    return [];
  }
}

function mapApiCartToCartItems(apiCart: any): CartItem[] {
  if (!apiCart) return [];
  // Sometimes API returns data inside `items` property
  const itemsArray = Array.isArray(apiCart) ? apiCart : (Array.isArray(apiCart.items) ? apiCart.items : []);
  
  return itemsArray.map((item: any) => {
    // Safely map API fields to our Product type structure
    const product = item.product || {};
    return {
      product: {
        ...product,
        id: Number(product.id || item.product_id),
        name: product.name || 'Sản phẩm',
        price: Number(product.price || item.unit_price || 0),
      },
      quantity: Number(item.quantity || 1),
    };
  });
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const loadCart = async () => {
    const userId = getCartUserId();
    const savedItems = loadCartFromStorage();
    
    // First load from storage for snappy UI
    if (savedItems.length > 0) {
      dispatch({ type: 'LOAD', items: savedItems });
    }

    if (userId !== 'guest') {
      try {
        const response = await cartApi.getCart(userId);
        if (response.success && response.data) {
          const apiItems = mapApiCartToCartItems(response.data);
          // Only overwrite if API returned valid array, else trust local storage
          if (apiItems.length > 0 || (Array.isArray(response.data) && response.data.length === 0)) {
            dispatch({ type: 'LOAD', items: apiItems });
          }
        }
      } catch (e) {
        console.error("Failed to fetch cart from API", e);
      }
    }
    setIsLoaded(true);
  };

  // Load cart from storage/API on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Listen for user login/logout events
  useEffect(() => {
    const handleStorageChange = () => {
      loadCart();
    };

    // Listen for storage events (login/logout)
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('userChanged', handleStorageChange);
    window.addEventListener('authChanged', handleStorageChange); // From authContext
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
      window.removeEventListener('authChanged', handleStorageChange);
    };
  }, []);

  // Save cart to storage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(state.items);
    }
  }, [state.items, isLoaded]);

  // Wrapped actions with optimistic UI updates and API syncing
  const addToCartFn = async (product: Product, quantity?: number) => {
    dispatch({ type: 'ADD', product, quantity });
    setToast({ message: 'Đã thêm vào giỏ hàng thành công', type: 'success' });
    const userId = getCartUserId();
    if (userId !== 'guest') {
      try {
        await cartApi.addToCart(userId, product.id, quantity ?? 1);
      } catch (e) {
        console.error("Failed to add to cart API", e);
      }
    }
  };

  const removeFromCartFn = async (productId: string) => {
    dispatch({ type: 'REMOVE', productId });
    const userId = getCartUserId();
    if (userId !== 'guest') {
      try {
        await cartApi.deleteCart(userId, productId);
      } catch (e) {
        console.error("Failed to remove from cart API", e);
      }
    }
  };

  const updateQuantityFn = async (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE', productId, quantity });
    const userId = getCartUserId();
    if (userId !== 'guest') {
      try {
        await cartApi.changeQuantity(userId, productId, quantity);
      } catch (e) {
        console.error("Failed to update cart API", e);
      }
    }
  };

  const clearCartFn = async () => {
    dispatch({ type: 'CLEAR' });
    const userId = getCartUserId();
    if (userId !== 'guest') {
      try {
        await cartApi.deleteCart(userId);
      } catch (e) {
        console.error("Failed to clear cart API", e);
      }
    }
  };

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        addToCart: addToCartFn,
        removeFromCart: removeFromCartFn,
        updateQuantity: updateQuantityFn,
        clearCart: clearCartFn,
      }}
    >
      {children}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
