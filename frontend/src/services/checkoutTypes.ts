/**
 * checkoutTypes.ts — shared types dùng chung giữa plugins và checkout
 */

export type ShippingOptionId = 'ship_ghtk' | 'ship_ghn' | 'ship_ghht';
export type ShippingProvider = 'SHIP_GHTK' | 'SHIP_VIETTEL_POST';

export interface ShippingOption {
  id: ShippingOptionId;
  name: string;
  provider: ShippingProvider;
  fee: number;
  estimatedDays: string;
}
