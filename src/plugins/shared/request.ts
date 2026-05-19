/**
 * shared/request.ts — HTTP helper dùng chung cho tất cả plugins
 *
 * Backend response format (ShippingApiController + các API khác):
 *   { error: false, data: ... }   → success
 *   { error: true, message: ... } → failure
 *
 * Một số API cũ dùng: { code: 1, data: ... } → cũng handle
 */

const BASE_API = 'https://nanoshop.iongeyser.com/api/v1.0';

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    if (!(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_API}${url}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });

    if (!res.ok) return { success: false, error: `HTTP ${res.status}` };

    const json = await res.json();

    // Format 1: { error: false/true, data, message } — ShippingApiController
    if (typeof json.error === 'boolean') {
      return {
        success: json.error === false,
        data: json.data,
        error: json.error ? (json.message ?? 'Lỗi không xác định') : undefined,
      };
    }

    // Format 2: { code: 1/0, data, message } — các API cũ
    return {
      success: json.code === 1,
      data: json.data,
      error: json.code !== 1 ? json.message : undefined,
    };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Network error' };
  }
}
