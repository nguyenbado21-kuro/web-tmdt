import { v4 as uuidv4 } from 'uuid';
import { User } from '../models/types';
import { readData, findById, createItem, updateItem, deleteItem } from '../utils/db';

const FILE = 'users.json';

export const userService = {
  getAll(): Omit<User, 'password'>[] {
    return readData<User>(FILE).map(({ password: _, ...u }) => u);
  },

  getById(id: string): User | undefined {
    return findById<User>(FILE, id);
  },

  findByEmail(email: string): User | undefined {
    return readData<User>(FILE).find((u) => u.email === email);
  },

  create(data: Omit<User, 'id' | 'createdAt'>): Omit<User, 'password'> {
    const user: User = {
      ...data,
      id: `usr-${uuidv4().slice(0, 8)}`,
      createdAt: new Date().toISOString(),
    };
    createItem<User>(FILE, user);
    const { password: _, ...safeUser } = user;
    return safeUser;
  },

  update(id: string, data: Partial<Omit<User, 'id'>>): Omit<User, 'password'> | null {
    const updated = updateItem<User>(FILE, id, data);
    if (!updated) return null;
    const { password: _, ...safeUser } = updated;
    return safeUser;
  },

  delete(id: string): boolean {
    return deleteItem<User>(FILE, id);
  },
};
