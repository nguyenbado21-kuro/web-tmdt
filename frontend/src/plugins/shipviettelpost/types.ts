/**
 * shipviettelpost/types.ts
 * Types mirror từ ViettelPost.php + ShipViettelPost.php
 */

// Mapping từ plugin:
//   ship_ghtk  → LCOD (Tiết Kiệm)
//   ship_ghn   → NCOD (Nhanh)
//   ship_ghht  → VHT  (Hỏa Tốc)
export type ViettelPostServiceCode = 'LCOD' | 'NCOD' | 'VHT';
export type ViettelPostShipCode = 'ship_ghtk' | 'ship_ghn' | 'ship_ghht';

export interface ViettelPostFeeRequest {
  SENDER_PROVINCE: string;   // tên tỉnh gửi
  SENDER_DISTRICT: string;   // tên huyện gửi
  RECEIVER_PROVINCE: string; // tên tỉnh nhận
  RECEIVER_DISTRICT: string; // tên huyện nhận
  PRODUCT_TYPE: 'HH';        // HH = Hàng hóa
  PRODUCT_WEIGHT: number;    // gram
  PRODUCT_PRICE: number;     // giá trị hàng
  MONEY_COLLECTION: number;  // tiền thu hộ (COD)
  ORDER_SERVICE: ViettelPostServiceCode;
  ORDER_SERVICE_ADD: '';
  NATIONAL_TYPE: 1;          // 1 = trong nước
}

export interface ViettelPostFeeResponse {
  error: boolean;
  data: {
    MONEY_TOTAL: number;     // tổng phí ship
    MONEY_TOTAL_FEE: number;
    MONEY_FEE: number;
    MONEY_COLLECTION_FEE: number;
    MONEY_OTHER_FEE: number;
    MONEY_VAS: number;
    KPI_HT: string;
  };
}

// Rate item trả về từ getPriceAsyncByServiceCode
export interface ViettelPostRateItem {
  id: string;
  price: number;
  name: string;
  company_name: 'SHIP_VIETTEL_POST';
  shipment_id: string;
  type: ViettelPostShipCode;
  ship_ghtk?: number;
  ship_ghn?: number;
  ship_ghht?: number;
}

// Danh sách dịch vụ ViettelPost (từ getPriceAll)
export const VIETTELPOST_SERVICES = [
  { codeShip: 'ship_ghht' as const, codeService: 'VHT'  as ViettelPostServiceCode, textShip: 'Giao Hàng Hỏa Tốc', estimatedDays: 'Trong ngày' },
  { codeShip: 'ship_ghtk' as const, codeService: 'LCOD' as ViettelPostServiceCode, textShip: 'Giao Hàng Tiết Kiệm', estimatedDays: '3-5 ngày' },
  { codeShip: 'ship_ghn'  as const, codeService: 'NCOD' as ViettelPostServiceCode, textShip: 'Giao Hàng Nhanh',    estimatedDays: '1-2 ngày' },
] as const;

// Mapping ship code → ViettelPost service code (dùng khi tạo shipment)
export const SHIP_CODE_TO_VTP_SERVICE: Record<ViettelPostShipCode, ViettelPostServiceCode> = {
  ship_ghtk: 'LCOD',
  ship_ghn:  'NCOD',
  ship_ghht: 'VHT',
};
