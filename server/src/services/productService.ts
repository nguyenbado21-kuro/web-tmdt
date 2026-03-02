import { v4 as uuidv4 } from 'uuid';
import { Product } from '../models/types';
import { readData, findById, createItem, updateItem, deleteItem } from '../utils/db';

const FILE = 'products.json';

export const productService = {
  getAll(categoryId?: string, search?: string, featured?: boolean): Product[] {
    let products = readData<Product>(FILE);

    if (categoryId) {
      products = products.filter((p) => p.categoryId === categoryId);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      );
    }
    if (featured !== undefined) {
      products = products.filter((p) => p.featured === featured);
    }
    return products;
  },

  getById(id: string): Product | undefined {
    return findById<Product>(FILE, id);
  },

  create(data: Omit<Product, 'id' | 'createdAt'>): Product {
    const product: Product = {
      ...data,
      id: `prod-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    return createItem<Product>(FILE, product);
  },

  update(id: string, data: Partial<Omit<Product, 'id'>>): Product | null {
    return updateItem<Product>(FILE, id, data);
  },

  delete(id: string): boolean {
    return deleteItem<Product>(FILE, id);
  },
};
