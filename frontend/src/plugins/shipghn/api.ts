/**
 * shipghn/api.ts
 *
 * Real GHN API Integration.
 * Calls GHN's fee API directly using the configured Token.
 */

import { ShippingOption } from '../../services/checkoutTypes';
import { getGhnProvinceId, getGhnDistrictId, getGhnWardCode } from './address-mapper';

export interface GhnCalculateRequest {
  province: string;
  district: string;
  ward?: string;
  weight: number;
}

const GHN_TOKEN = import.meta.env.VITE_GHN_TOKEN || '128a50ac-1cee-11f1-a637-fea8c486ab31';

let cachedShopId: number | null = null;

async function getGhnShopId(): Promise<number | null> {
  if (cachedShopId) return cachedShopId;
  const envShopId = import.meta.env.VITE_GHN_SHOP_ID;
  if (envShopId) return parseInt(envShopId, 10);
  
  try {
    const res = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shop/all', {
      headers: { Token: GHN_TOKEN, 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    const shops = data.data?.shops;
    if (data.code === 200 && Array.isArray(shops) && shops.length > 0) {
      cachedShopId = shops[0]._id;
      return cachedShopId;
    }
  } catch (err) {
    console.error('GHN getShopId error:', err);
  }
  return null;
}

export async function calculateGhnFee(req: GhnCalculateRequest): Promise<ShippingOption[]> {
  const options: ShippingOption[] = [];
  try {
    // 1. Resolve address strings -> GHN IDs
    const provId = await getGhnProvinceId(req.province);
    if (!provId) return [];

    const distId = await getGhnDistrictId(provId, req.district);
    if (!distId) return [];

    const wardCode = req.ward ? await getGhnWardCode(distId, req.ward) : null;

    // 2. Fetch Shop ID logic
    const shopId = await getGhnShopId();

    const headers: Record<string, string> = { 
      Token: GHN_TOKEN,
      'Content-Type': 'application/json' 
    };
    if (shopId) headers['ShopId'] = shopId.toString();

    // 3. Call GHN Calculate Fee (service_type_id: 2 -> Chuẩn)
    // Theo tài liệu GHN (id=95), Hàng nhẹ (service_type_id=2) BẮT BUỘC có length, width, height, weight
    const body: Record<string, any> = {
      service_type_id: 2, 
      to_district_id: distId,
      to_ward_code: wardCode || "",
      weight: req.weight,
      length: 10, // Kích thước mặc định (cm)
      width: 10,
      height: 10,
      insurance_value: 0 // Giá trị bảo hiểm mặc định
    };

    // Note: If shop relies on purely token and doesn't have an address set,
    // GHN might require from_district_id. We'll default to 1442 (Quận 1, TPHCM) if no shopId is found
    // just in case, but usually Token/ShopId dictates from_district.
    if (!shopId) body.from_district_id = 1442; 

    const res = await fetch('https://online-gateway.ghn.vn/shiip/public-api/v2/shipping-order/fee', {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const data = await res.json();
    if (data.code === 200 && data.data) {
      options.push({
        id: 'ship_ghn',
        name: 'Giao Hàng Nhanh (GHN)',
        provider: 'SHIP_GHN',
        fee: data.data.total,
        estimatedDays: '1-3 ngày',
      });
    } else {
      console.warn('GHN fee error response:', data);
    }
  } catch (err) {
    console.error('GHN calculate error:', err);
  }
  return options;
}
