import { v4 as uuidv4 } from 'uuid';
import { Category } from '../models/types';
import { readData, findById, createItem, updateItem, deleteItem } from '../utils/db';

const FILE = 'categories.json';

export const categoryService = {
  getAll(): Category[] {
    return readData<Category>(FILE);
  },

  getById(id: string): Category | undefined {
    return findById<Category>(FILE, id);
  },

  create(data: Omit<Category, 'id'>): Category {
    const category: Category = {
      ...data,
      id: `cat-${uuidv4().slice(0, 8)}`,
    };
    return createItem<Category>(FILE, category);
  },

  update(id: string, data: Partial<Omit<Category, 'id'>>): Category | null {
    return updateItem<Category>(FILE, id, data);
  },

  delete(id: string): boolean {
    return deleteItem<Category>(FILE, id);
  },
};
