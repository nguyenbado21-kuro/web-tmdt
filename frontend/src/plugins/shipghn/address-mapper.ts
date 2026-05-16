/**
 * shipghn/address-mapper.ts
 *
 * Caches GHN Master Data to map open-api.vn address strings into GHN's
 * specific IDs. This avoids rewriting the entire checkout address selector.
 */

const GHN_TOKEN = import.meta.env.VITE_GHN_TOKEN || '128a50ac-1cee-11f1-a637-fea8c486ab31';
const BASE_URL = 'https://online-gateway.ghn.vn/shiip/public-api/master-data';

interface GhnProvince {
  ProvinceID: number;
  ProvinceName: string;
}

interface GhnDistrict {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
}

interface GhnWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
}

let cachedProvinces: GhnProvince[] | null = null;
const cachedDistricts = new Map<number, GhnDistrict[]>();
const cachedWards = new Map<number, GhnWard[]>();

const getHeaders = () => ({
  Token: GHN_TOKEN,
  'Content-Type': 'application/json',
});

function normalizeStr(s: string) {
  return s.toLowerCase()
    .replace('thành phố', '')
    .replace('tỉnh', '')
    .replace('quận', '')
    .replace('huyện', '')
    .replace('thị xã', '')
    .replace('phường', '')
    .replace('xã', '')
    .trim();
}

/** Fetch & match Province */
export async function getGhnProvinceId(provinceName: string): Promise<number | null> {
  if (!cachedProvinces) {
    try {
      const res = await fetch(`${BASE_URL}/province`, { headers: getHeaders() });
      const data = await res.json();
      if (data.code === 200) cachedProvinces = data.data;
    } catch (err) {
      console.error('GHN getProvince error:', err);
      return null;
    }
  }

  if (!cachedProvinces) return null;

  const target = normalizeStr(provinceName);
  const match = cachedProvinces.find(p => normalizeStr(p.ProvinceName) === target);
  return match?.ProvinceID || null;
}

/** Fetch & match District */
export async function getGhnDistrictId(provinceId: number, districtName: string): Promise<number | null> {
  if (!cachedDistricts.has(provinceId)) {
    try {
      const res = await fetch(`${BASE_URL}/district`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ province_id: provinceId })
      });
      const data = await res.json();
      if (data.code === 200) cachedDistricts.set(provinceId, data.data);
    } catch (err) {
      console.error('GHN getDistrict error:', err);
      return null;
    }
  }

  const list = cachedDistricts.get(provinceId) || [];
  const target = normalizeStr(districtName);
  const match = list.find(d => normalizeStr(d.DistrictName) === target);
  return match?.DistrictID || null;
}

/** Fetch & match Ward */
export async function getGhnWardCode(districtId: number, wardName: string): Promise<string | null> {
  if (!cachedWards.has(districtId)) {
    try {
      const res = await fetch(`${BASE_URL}/ward?district_id=${districtId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.code === 200) cachedWards.set(districtId, data.data);
    } catch (err) {
      console.error('GHN getWard error:', err);
      return null;
    }
  }

  const list = cachedWards.get(districtId) || [];
  const target = normalizeStr(wardName);
  const match = list.find(w => normalizeStr(w.WardName) === target);
  return match?.WardCode || null;
}
