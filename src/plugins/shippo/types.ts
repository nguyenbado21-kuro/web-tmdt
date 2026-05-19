/**
 * shippo/types.ts
 * Types mirror từ Shippo pattern (ShipGhtk.php + ShipViettelPost.php)
 *
 * Shippo là wrapper phức tạp hơn (Luồng B):
 *   getRates() → getPrepareParams() → getCacheOrNewRates()
 *   → getRatesParams() → createShipment(isCreate=false) → getOptionsShip()
 * Dùng cURL, có cache, validate địa chỉ, dành cho postCheckout flow.
 */

export interface ShippoParcel {
  weight: number;    // kg
  length: number;    // cm
  width: number;     // cm
  height: number;    // cm
  distance_unit: string;
  mass_unit: string;
}

export interface ShippoAddress {
  name: string;
  phone: string;
  address: string;
  city: string;       // tên huyện
  state: string;      // tên tỉnh
  ward?: string;      // tên xã
  city_id?: string;   // mã huyện (ViettelPost dùng)
  state_id?: string;  // mã tỉnh (ViettelPost dùng)
  country: string;    // 'VN'
}

export interface ShippoRateItem {
  id: string;
  price: number;
  name: string;
  company_name: 'SHIP_GHTK' | 'SHIP_VIETTEL_POST';
  shipment_id: string;
  type: 'ship_ghtk' | 'ship_ghn' | 'ship_ghht';
  disabled?: boolean;
  error_message?: string;
}

export interface ShippoRatesRequest {
  isCreate: boolean;       // false = chỉ lấy giá, true = tạo đơn luôn
  order_id: string;
  order_total: number;
  address_from: ShippoAddress;
  address_to: ShippoAddress;
  parcels: ShippoParcel[];
  items: ShippoItem[];
  extra?: {
    COD?: { amount: number; currency: string };
    is_return?: boolean;
  };
}

export interface ShippoItem {
  name: string;
  sku: string;
  qty: number;
  weight: number;  // gram
  price: number;
  length: number;
  wide: number;
  height: number;
}

export interface ShippoRatesResponse {
  shipment: {
    rates: Record<string, ShippoRateItem>;
  };
}
