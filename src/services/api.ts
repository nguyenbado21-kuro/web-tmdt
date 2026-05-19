import { Product, Category, Order, RetailOrder, Voucher, ApiResponse, normalizeApiResponse } from '../types';

const BASE_API = `${import.meta.env.VITE_URL_BACKEND}/api/v1.0`;

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const fullUrl = `${BASE_API}${url}`;
    const token = localStorage.getItem('auth_token');

    const headers: Record<string, string> = {
      'Accept-Charset': 'utf-8',
    };

    // Only add Content-Type if body is not FormData
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json; charset=utf-8';
    }

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

    // Get response as text first to handle encoding properly
    const responseText = await res.text();
    
    // Parse JSON from the properly decoded text
    const apiResponse: ApiResponse<T> = JSON.parse(responseText);
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

      const uniqueProductsMap = new Map<string | number, Product>();

      categoriesResponse.data.forEach((category) => {
        if (category.products && Array.isArray(category.products)) {
          category.products.forEach((product) => {
            // Loại bỏ trùng lặp nếu 1 sản phẩm thuộc nhiều danh mục
            if (product.id && !uniqueProductsMap.has(product.id)) {
              uniqueProductsMap.set(product.id, {
                ...product,
                category_id: category.id || (category as any).cate_id,
              });
            }
          });
        }
      });

      const allProducts = Array.from(uniqueProductsMap.values());

      return { success: true, data: allProducts };
    },

    getById: (id: string, noCache?: boolean) => 
      request<Product>(`/product/${id}${noCache ? `?t=${Date.now()}` : ''}`),

    getByCategory: (id: string | number) => request<Category>(`/product/listCatebyID/${id}`),

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

    review: (data: { 
      product_id: number; 
      rating: number; 
      comment: string; 
      reviewer_name?: string; 
      reviewer_phone?: string;
      images?: File[];
      videos?: File[];
    }) => {
      const formData = new FormData();
      
      // Add basic fields
      formData.append('product_id', data.product_id.toString());
      formData.append('rating', data.rating.toString());
      formData.append('comment', data.comment);
      
      if (data.reviewer_name) {
        formData.append('reviewer_name', data.reviewer_name);
      }
      
      if (data.reviewer_phone) {
        formData.append('reviewer_phone', data.reviewer_phone);
      }
      
      // Add images to FormData
      if (data.images && data.images.length > 0) {
        data.images.forEach((image) => {
          formData.append('images[]', image);
        });
        console.log(`Added ${data.images.length} images to FormData`);
      }
      
      // Add videos to FormData
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach((video) => {
          formData.append('videos[]', video);
        });
        console.log(`Added ${data.videos.length} videos to FormData`);
      }
      
      // Log FormData contents
      console.log('FormData contents:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      return request<any>('/product/review', {
        method: 'POST',
        body: formData,
      });
    },
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

    getById: (id: string) => request<RetailOrder>(`/retailOrder/${id}`),

    assignTechnician: (orderId: string, technicianId: number) =>
      request<any>(`/retailOrder/${orderId}/assignTechnician`, {
        method: 'POST',
        body: JSON.stringify({ technician_id: technicianId }),
      }),

    create: (data: any) =>
      request<any>('/retailOrder/createRetailOrder', {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
      }),

    updateImage: (orderId: string, image: File) => {
      const formData = new FormData();
      formData.append('images[]', image);

      return request<any>(`/retailOrder/${orderId}/updateRetailOrderImageBill`, {
        method: 'PUT',
        body: formData,
      });
    },
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

  technicians: {
    getAll: () => request<any[]>('/technician'),
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

    register: (data: { phone: string; pass: string; email?: string; gmail?: string; name?: string }) =>
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

    update: (id: string, data: any) => {
      const formData = new FormData();
      formData.append('id', id);

      // Add other fields from data (name, email, addresses, etc.)
      Object.keys(data).forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          formData.append(key, data[key]);
        }
      });

      return request<any>(`/user/updateUser`, {
        method: 'POST',
        body: formData,
      });
    },

    delete: (id: string) =>
      request<void>(`/user/${id}`, {
        method: 'DELETE',
      }),
  },
};
