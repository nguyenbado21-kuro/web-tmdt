import { Product, Category, Order, ApiResponse } from '../types';

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

// Products
export const api = {
  products: {
    getAll: (params?: { categoryId?: string; search?: string; featured?: boolean }) => {
      const qs = new URLSearchParams();
      if (params?.categoryId) qs.set('categoryId', params.categoryId);
      if (params?.search) qs.set('search', params.search);
      if (params?.featured !== undefined) qs.set('featured', String(params.featured));
      return request<Product[]>(`/products${qs.toString() ? '?' + qs : ''}`);
    },
    getById: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/products/${id}`, { method: 'DELETE' }),
  },

  categories: {
    getAll: () => request<Category[]>('/categories'),
    getById: (id: string) => request<Category>(`/categories/${id}`),
    create: (data: Partial<Category>) =>
      request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/categories/${id}`, { method: 'DELETE' }),
  },

  orders: {
    getAll: () => request<Order[]>('/orders'),
    create: (data: Partial<Order>) =>
      request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  },

  subscribers: {
    subscribe: (email: string) =>
      request('/subscribers', { method: 'POST', body: JSON.stringify({ email }) }),
  },
};
