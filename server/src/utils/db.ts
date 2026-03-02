import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(__dirname, '../data');

export function readData<T>(filename: string): T[] {
  const filePath = path.join(DATA_DIR, filename);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw) as T[];
  } catch {
    return [];
  }
}

export function writeData<T>(filename: string, data: T[]): void {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function findById<T extends { id: string }>(filename: string, id: string): T | undefined {
  const items = readData<T>(filename);
  return items.find((item) => item.id === id);
}

export function createItem<T extends { id: string }>(filename: string, item: T): T {
  const items = readData<T>(filename);
  items.push(item);
  writeData(filename, items);
  return item;
}

export function updateItem<T extends { id: string }>(
  filename: string,
  id: string,
  updates: Partial<T>
): T | null {
  const items = readData<T>(filename);
  const idx = items.findIndex((item) => item.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates };
  writeData(filename, items);
  return items[idx];
}

export function deleteItem<T extends { id: string }>(filename: string, id: string): boolean {
  const items = readData<T>(filename);
  const filtered = items.filter((item) => item.id !== id);
  if (filtered.length === items.length) return false;
  writeData(filename, filtered);
  return true;
}
