import { Product, Category, Order, User, Subscriber } from '../types';

const BASE = '/api';

async function req<T>(url: string, opts?: RequestInit): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  const res = await fetch(`${BASE}${url}`, { headers: { 'Content-Type': 'application/json' }, ...opts });
  return res.json();
}

export const adminApi = {
  products: {
    getAll: () => req<Product[]>('/products'),
    create: (d: Partial<Product>) => req<Product>('/products', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Product>) => req<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: string) => req<void>(`/products/${id}`, { method: 'DELETE' }),
  },
  categories: {
    getAll: () => req<Category[]>('/categories'),
    create: (d: Partial<Category>) => req<Category>('/categories', { method: 'POST', body: JSON.stringify(d) }),
    update: (id: string, d: Partial<Category>) => req<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: string) => req<void>(`/categories/${id}`, { method: 'DELETE' }),
  },
  orders: {
    getAll: () => req<Order[]>('/orders'),
    update: (id: string, d: Partial<Order>) => req<Order>(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    delete: (id: string) => req<void>(`/orders/${id}`, { method: 'DELETE' }),
  },
  users: {
    getAll: () => req<User[]>('/users'),
    delete: (id: string) => req<void>(`/users/${id}`, { method: 'DELETE' }),
  },
  subscribers: {
    getAll: () => req<Subscriber[]>('/subscribers'),
    delete: (id: string) => req<void>(`/subscribers/${id}`, { method: 'DELETE' }),
  },
};
