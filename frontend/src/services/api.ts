import { Product, Category, Order, ApiResponse, normalizeApiResponse } from '../types';

const BASE_API = '/api';
const DEFAULT_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL25hbm9zaG9wLmlvbmdleXNlci5jb20vYXBpL3YxLjAvdXNlci9sb2dpbiIsImlhdCI6MTc3MjQyNzM0NiwiZXhwIjoxODAzOTYzMzQ2LCJuYmYiOjE3NzI0MjczNDYsImp0aSI6InVPRnlQajB2U2hsZjFoTGMiLCJzdWIiOjE1MzIsInBydiI6Ijg3ZTBhZjFlZjlmZDE1ODEyZmRlYzk3MTUzYTE0ZTBiMDQ3NTQ2YWEifQ.pPfb1kN40g3zCSDDNDfgVwmdZRwJzWLCXItAfwyIn3k';

async function request<T>(url: string, options?: RequestInit): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const token = localStorage.getItem('auth_token') || DEFAULT_TOKEN;
    const res = await fetch(`${BASE_API}${url}`, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      ...options,
    });
    
    // Check if response is JSON
    const contentType = res.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return {
        success: false,
        error: `Server returned ${res.status}: ${res.statusText}`
      };
    }
    
    const apiResponse: ApiResponse<T> = await res.json();
    return normalizeApiResponse(apiResponse);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

// Products
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
    // Get all products from categories
    getAllFromCategories: async () => {
      const categoriesResponse = await request<Category[]>('/product/listCate');
      if (!categoriesResponse.success || !categoriesResponse.data) {
        return { success: false, error: categoriesResponse.error };
      }
      
      // Extract all products from all categories
      const allProducts: Product[] = [];
      categoriesResponse.data.forEach(category => {
        if (category.products && Array.isArray(category.products)) {
          const productsWithCategoryId = category.products.map(product => ({
            ...product,
            category_id: category.id
          }));
          allProducts.push(...productsWithCategoryId);
        }
      });
      
      return { success: true, data: allProducts };
    },
    getById: (id: string) => request<Product>(`/product/${id}`),
    create: (data: Partial<Product>) =>
      request<Product>('/product', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) =>
      request<Product>(`/product/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/product/${id}`, { method: 'DELETE' }),
  },

  categories: {
    getAll: () => request<Category[]>('/product/listCate'),
    getById: (id: string) => request<Category>(`/category/${id}`),
    create: (data: Partial<Category>) =>
      request<Category>('/category', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Category>) =>
      request<Category>(`/category/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/category/${id}`, { method: 'DELETE' }),
  },

  orders: {
    getAll: () => request<Order[]>('/order'),
    create: (data: Partial<Order>) =>
      request<Order>('/order', { method: 'POST', body: JSON.stringify(data) }),
  },

  subscribers: {
    subscribe: (email: string) =>
      request('/subscriber', { method: 'POST', body: JSON.stringify({ email }) }),
  },

  // Auth endpoints
  auth: {
    login: (phone: string, password: string) =>
      request<{ token: string; user: any }>('/user/login', {
        method: 'POST',
        body: JSON.stringify({ phone, pass: password }),
      }),
    register: (data: { phone: string; pass: string; email?: string; name?: string }) =>
      request<{ token: string; user: any }>('/user/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  // User endpoints
  user: {
    getAll: () => request<any[]>('/user'),
    getById: (id: string) => request<any>(`/user/${id}`),
    getCurrent: () => request<any>('/user/me'),
    update: (id: string, data: any) =>
      request<any>(`/user/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/user/${id}`, { method: 'DELETE' }),
  },
};
