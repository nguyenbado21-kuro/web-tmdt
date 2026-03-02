import { v4 as uuidv4 } from 'uuid';
import { Order } from '../models/types';
import { readData, findById, createItem, updateItem, deleteItem } from '../utils/db';

const FILE = 'orders.json';

export const orderService = {
  getAll(userId?: string): Order[] {
    let orders = readData<Order>(FILE);
    if (userId) orders = orders.filter((o) => o.userId === userId);
    return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getById(id: string): Order | undefined {
    return findById<Order>(FILE, id);
  },

  create(data: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
    const now = new Date().toISOString();
    const order: Order = {
      ...data,
      id: `ord-${uuidv4().slice(0, 8)}`,
      createdAt: now,
      updatedAt: now,
    };
    return createItem<Order>(FILE, order);
  },

  update(id: string, data: Partial<Omit<Order, 'id'>>): Order | null {
    return updateItem<Order>(FILE, id, { ...data, updatedAt: new Date().toISOString() });
  },

  delete(id: string): boolean {
    return deleteItem<Order>(FILE, id);
  },
};
