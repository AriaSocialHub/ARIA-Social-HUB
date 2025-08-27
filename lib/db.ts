import { get, set } from '@vercel/kv';
import { AppData } from '../types';

export const DB_KEY = 'social-hub-db';

export const getInitialData = (): AppData => ({
  services_data: {},
  notifications: [],
  users: {},
});

export async function getDb(): Promise<AppData> {
  // FIX: Use destructured `get` function from @vercel/kv
  let db: AppData | null = await get(DB_KEY);
  if (!db) {
    db = getInitialData();
    // FIX: Use destructured `set` function from @vercel/kv
    await set(DB_KEY, db);
  }
  // Ensure users table exists for older DB structures
  if (!db.users) {
      db.users = {};
  }
  return db;
}

export async function setDb(data: AppData) {
  // FIX: Use destructured `set` function from @vercel/kv
  return set(DB_KEY, data);
}