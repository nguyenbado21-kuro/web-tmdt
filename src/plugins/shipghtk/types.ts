/**
 * shipghtk/types.ts
 * Types mirror từ Ghtk.php + ShipGhtk.php
 */

// Mapping từ plugin: ship_ghtk=road, ship_ghn=fly
export type GhtkTransport = 'road' | 'fly';

export interface GhtkFeeRequest {
  pick_province: string;   // tỉnh lấy hàng
  pick_district: string;   // huyện lấy hàng
  province: string;        // tỉnh giao hàng
  district: string;        // huyện giao hàng
  ward?: string;           // xã giao hàng
  weight: number;          // gram → GHTK nhận kg (chia 1000)
  value: number;           // giá trị đơn hàng (COD)
  deliver_option: 'none';
  tags: number[];          // [1]
}

export interface GhtkFeeResponse {
  success: boolean;
  fee?: {
    name: string;
    fee: number;           // phí ship (VND)
    insurance_fee: number;
    include_vat: string;
    cost_id: string;
    delivery_type: string;
    a: number;
    dt: string;
    extFees: any[];
    promotion_key: string;
    delivery: boolean;
    ship_fee_only: number;
  };
  message?: string;
}

// Rate item trả về từ getPriceAsyncByServiceCode
export interface GhtkRateItem {
  id: string;
  price: number;
  name: string;
  company_name: 'SHIP_GHTK';
  shipment_id: string;
  type: 'ship_ghtk' | 'ship_ghn';
  ship_ghtk?: number;
  ship_ghn?: number;
}

// Danh sách dịch vụ GHTK (từ getPriceAll)
export const GHTK_SERVICES = [
  { codeShip: 'ship_ghtk' as const, codeService: 'road' as GhtkTransport, textShip: 'Giao Hàng Tiết Kiệm', estimatedDays: '3-5 ngày' },
  { codeShip: 'ship_ghn'  as const, codeService: 'fly'  as GhtkTransport, textShip: 'Giao Hàng Nhanh',     estimatedDays: '1-2 ngày' },
] as const;
