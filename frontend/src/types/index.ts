export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  categoryId?: string;
  category_id?: number; // From API
  product_images?: Array<{
    id: number;
    link: string;
    product_id: number;
    title: string;
  }>;
  images?: string[]; // For backward compatibility
  stock?: number;
  rating?: number;
  reviewCount?: number;
  featured?: boolean;
  createdAt?: string;
  // New fields from API
  app?: string;
  hot?: string;
  link?: string;
  price_sale?: string;
  price_riha?: string;
  price_sale_riha?: string;
  product_code?: string;
  model?: string;
  so_cap_loc?: string;
  leaning_page?: string;
  accessory?: any[];
  slug?: string;
  meta?: string;
  content?: string;
}

export interface Category {
  id: number;
  app: string;
  is_hot: string;
  is_new: string;
  name: string;
  image: string | null;
  slug: string;
  parent_id: string;
  order: string;
  keyword: string | null;
  meta_description: string;
  status: string;
  created_at: string;
  updated_at: string;
  products?: any[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  totalPrice: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  address: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  image: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

// Helper to convert API response to expected format
export function normalizeApiResponse<T>(response: ApiResponse<T>): { success: boolean; data?: T; error?: string } {
  return {
    success: response.code === 1,
    data: response.data,
    error: response.code !== 1 ? response.message : undefined,
  };
}

// Helper to get product images
export function getProductImages(product: Product): string[] {
  // First try to get from product_images array (from API)
  if (product.product_images && product.product_images.length > 0) {
    return product.product_images.map(img => img.link);
  }
  // Fallback to images array for backward compatibility
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  return ['https://via.placeholder.com/400x400?text=Product'];
}

// Helper to format price with Vietnamese thousand separator
export function formatPrice(price: number): string {
  return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
