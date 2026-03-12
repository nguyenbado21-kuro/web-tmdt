import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { CartItem, Product } from '../types';

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
function getCartStorageKey(): string {
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
  
  return `cart_${userId}`;
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

export function CartProvider({ children }: { children: ReactNode }) {
  // Initialize state with empty items first
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load cart from storage on mount
  useEffect(() => {
    const savedItems = loadCartFromStorage();
    dispatch({ type: 'LOAD', items: savedItems });
    setIsLoaded(true);
  }, []);

  // Listen for user login/logout events
  useEffect(() => {
    const handleStorageChange = () => {
      // When user changes, load their cart
      const savedItems = loadCartFromStorage();
      dispatch({ type: 'LOAD', items: savedItems });
    };

    // Listen for storage events (login/logout)
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events we dispatch
    window.addEventListener('userChanged', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('userChanged', handleStorageChange);
    };
  }, []);

  // Save cart to storage whenever it changes (but only after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveCartToStorage(state.items);
    }
  }, [state.items, isLoaded]);

  const totalItems = state.items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = state.items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items: state.items,
        totalItems,
        totalPrice,
        addToCart: (product, qty) => dispatch({ type: 'ADD', product, quantity: qty }),
        removeFromCart: (id) => dispatch({ type: 'REMOVE', productId: id }),
        updateQuantity: (id, qty) => dispatch({ type: 'UPDATE', productId: id, quantity: qty }),
        clearCart: () => dispatch({ type: 'CLEAR' }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be inside CartProvider');
  return ctx;
}
