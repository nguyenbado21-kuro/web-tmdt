import { Product, ApiResponse, normalizeApiResponse } from '../types';

const BASE_API = 'https://nanoshop.iongeyser.com/api/v1.0';

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const fullUrl = `${BASE_API}${url}`;
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        success: false,
        error: `HTTP ${res.status}: ${text}`,
      };
    }

    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return { success: true, data: undefined };
    }

    const apiResponse: ApiResponse<T> = await res.json();
    return normalizeApiResponse(apiResponse);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// API definition for Cart
export const cartApi = {
  getCart: (userId: string | number) => 
    request<any>(`/retailOrderCart/carts/${userId}`, { method: 'GET' }),

  addToCart: (userId: string | number, productId: number | string, quantity: number) =>
    request<any>(`/retailOrderCart/addToCart/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  changeQuantity: (userId: string | number, productId: number | string, quantity: number) =>
    request<any>(`/retailOrderCart/changeQuantity/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    }),

  /**
   * For removing single items, we try passing product_id in body with DELETE.
   * If the API drops the whole cart, it behaves as clearCart.
   */
  deleteCart: (userId: string | number, productId?: number | string) => {
    const body = productId ? JSON.stringify({ product_id: productId }) : undefined;
    return request<any>(`/retailOrderCart/deleteCart/${userId}`, {
      method: 'DELETE',
      body
    });
  }
};
