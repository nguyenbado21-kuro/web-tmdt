import { v4 as uuidv4 } from 'uuid';
import { Subscriber } from '../models/types';
import { readData, createItem, deleteItem } from '../utils/db';

const FILE = 'subscribers.json';

export const subscriberService = {
  getAll(): Subscriber[] {
    return readData<Subscriber>(FILE);
  },

  subscribe(email: string): Subscriber | null {
    const existing = readData<Subscriber>(FILE).find((s) => s.email === email);
    if (existing) return null;
    const sub: Subscriber = {
      id: `sub-${uuidv4().slice(0, 8)}`,
      email,
      subscribedAt: new Date().toISOString(),
    };
    return createItem<Subscriber>(FILE, sub);
  },

  delete(id: string): boolean {
    return deleteItem<Subscriber>(FILE, id);
  },
};
