import { Product, Category, Order, RetailOrder, Voucher, ApiResponse, normalizeApiResponse } from '../types';

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

    // Không gửi token cho login/register
    const isAuthRoute =
      url.includes('/user/login') || url.includes('/user/register');

    if (token && !isAuthRoute) {
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
      return {
        success: false,
        error: `Server returned ${res.status}: ${res.statusText}`,
      };
    }

    const apiResponse: ApiResponse<T> = await res.json();
    const normalized = normalizeApiResponse(apiResponse);

    return normalized;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// API
export const api = {
  products: {
    getAll: (params?: { categoryId?: string; search?: string; featured?: boolean }) => {
      const qs = new URLSearchParams();

      if (params?.categoryId) qs.set('category_id', params.categoryId);
      if (params?.search) qs.set('search', params.search);
      if (params?.featured !== undefined) qs.set('featured', String(params.featured));

      const queryString = qs.toString();

      return request<Product[]>(`/product/listProduct${queryString ? '?' + queryString : ''}`);
    },

    getAllFromCategories: async () => {
      const categoriesResponse = await request<Category[]>('/product/listCate');

      if (!categoriesResponse.success || !categoriesResponse.data) {
        return { success: false, error: categoriesResponse.error };
      }

      const allProducts: Product[] = [];

      categoriesResponse.data.forEach((category) => {
        if (category.products && Array.isArray(category.products)) {
          const productsWithCategoryId = category.products.map((product) => ({
            ...product,
            category_id: category.id,
          }));

          allProducts.push(...productsWithCategoryId);
        }
      });

      return { success: true, data: allProducts };
    },

    getById: (id: string) => request<Product>(`/product/${id}`),

    create: (data: Partial<Product>) =>
      request<Product>('/product', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/product/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/product/${id}`, {
        method: 'DELETE',
      }),
  },

  categories: {
    getAll: () => request<Category[]>('/product/listCate'),

    getById: (id: string) => request<Category>(`/category/${id}`),

    create: (data: Partial<Category>) =>
      request<Category>('/category', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/category/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/category/${id}`, {
        method: 'DELETE',
      }),
  },

  orders: {
    getAll: (phone?: string) => {
      const url = phone ? `/retailOrder?phone=${phone}` : '/retailOrder';
      return request<RetailOrder[]>(url, { method: 'GET' });
    },

    create: (data: any) =>
      request<any>('/retailOrder/createRetailOrder', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  subscribers: {
    subscribe: (email: string) =>
      request('/subscriber', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
  },

  vouchers: {
    getAll: () => request<Voucher[]>('/retailOrderCart/listVoucherAll'),
  },

  auth: {
    login: (phone: string, password: string) =>
      request<{ token: string; user: any }>('/user/login', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          pass: password,
        }),
      }),

    register: (data: { phone: string; pass: string; email?: string; name?: string }) =>
      request<{ token: string; user: any }>('/user/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  user: {
    getAll: () => request<any[]>('/user'),

    getById: (id: string) => request<any>(`/user/${id}`),

    getCurrent: () =>
      request<any>('/user/me', {
        method: 'POST',
      }),

    update: (id: string, data: any) =>
      request<any>(`/user/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),

    delete: (id: string) =>
      request<void>(`/user/${id}`, {
        method: 'DELETE',
      }),
  },
};