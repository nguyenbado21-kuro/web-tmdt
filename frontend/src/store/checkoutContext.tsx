/**
 * checkoutContext.tsx — state management cho toàn bộ checkout flow
 * Hỗ trợ: GHTK, ViettelPost (shipping), OnePay (payment), bank_transfer, COD
 */

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Address, Voucher } from '../types';
import { ShippingOption, ShippingOptionId, ShippingProvider } from '../services/checkoutTypes';

// ─── State ────────────────────────────────────────────────────────────────────

export interface CheckoutState {
  step: 'information' | 'payment' | 'success';
  address: Address | null;
  shippingOptions: ShippingOption[];
  selectedShipping: ShippingOption | null;
  shippingLoading: boolean;
  paymentMethod: 'cod' | 'bank_transfer';
  transferImage: File | null;
  voucher: Voucher | null;
  discount: number;
  isFreeShipping: boolean;
  note: string;
  submitting: boolean;
  error: string | null;
  orderId: string | null;
}

const initialState: CheckoutState = {
  step: 'information',
  address: null,
  shippingOptions: [],
  selectedShipping: null,
  shippingLoading: false,
  paymentMethod: 'bank_transfer',
  transferImage: null,
  voucher: null,
  discount: 0,
  isFreeShipping: false,
  note: '',
  submitting: false,
  error: null,
  orderId: null,
};

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_STEP'; step: CheckoutState['step'] }
  | { type: 'SET_ADDRESS'; address: Address }
  | { type: 'SET_SHIPPING_OPTIONS'; options: ShippingOption[] }
  | { type: 'SET_SELECTED_SHIPPING'; option: ShippingOption }
  | { type: 'SET_SHIPPING_LOADING'; loading: boolean }
  | { type: 'SET_PAYMENT_METHOD'; method: CheckoutState['paymentMethod'] }
  | { type: 'SET_TRANSFER_IMAGE'; image: File | null }
  | { type: 'SET_VOUCHER'; voucher: Voucher | null; discount: number; isFreeShipping: boolean }
  | { type: 'SET_NOTE'; note: string }
  | { type: 'SET_SUBMITTING'; submitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_ORDER_ID'; orderId: string }
  | { type: 'RESET' };

function reducer(state: CheckoutState, action: Action): CheckoutState {
  switch (action.type) {
    case 'SET_STEP':              return { ...state, step: action.step };
    case 'SET_ADDRESS':           return { ...state, address: action.address };
    case 'SET_SHIPPING_OPTIONS':  return { ...state, shippingOptions: action.options, selectedShipping: action.options[0] ?? null };
    case 'SET_SELECTED_SHIPPING': return { ...state, selectedShipping: action.option };
    case 'SET_SHIPPING_LOADING':  return { ...state, shippingLoading: action.loading };
    case 'SET_PAYMENT_METHOD':    return { ...state, paymentMethod: action.method };
    case 'SET_TRANSFER_IMAGE':    return { ...state, transferImage: action.image };
    case 'SET_VOUCHER':           return { ...state, voucher: action.voucher, discount: action.discount, isFreeShipping: action.isFreeShipping };
    case 'SET_NOTE':              return { ...state, note: action.note };
    case 'SET_SUBMITTING':        return { ...state, submitting: action.submitting };
    case 'SET_ERROR':             return { ...state, error: action.error };
    case 'SET_ORDER_ID':          return { ...state, orderId: action.orderId, step: 'success' };
    case 'RESET':                 return initialState;
    default:                      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface CheckoutContextType {
  state: CheckoutState;
  dispatch: React.Dispatch<Action>;
}

const CheckoutContext = createContext<CheckoutContextType | null>(null);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <CheckoutContext.Provider value={{ state, dispatch }}>{children}</CheckoutContext.Provider>;
}

export function useCheckoutContext() {
  const ctx = useContext(CheckoutContext);
  if (!ctx) throw new Error('useCheckoutContext must be inside CheckoutProvider');
  return ctx;
}

// ─── Selectors ────────────────────────────────────────────────────────────────

export function selectShippingFee(state: CheckoutState): number {
  if (state.isFreeShipping) return 0;
  return state.selectedShipping?.fee ?? 0;
}

export function selectShippingProvider(state: CheckoutState): ShippingProvider {
  return state.selectedShipping?.provider ?? 'SHIP_GHTK';
}

export function selectShippingOption(state: CheckoutState): ShippingOptionId {
  return state.selectedShipping?.id ?? 'ship_ghtk';
}
