import { kv } from '@vercel/kv';
import { AppData } from '../types';

export const DB_KEY = 'social-hub-db';

export const getInitialData = (): AppData => ({
  services_data: {},
  notifications: [],
});

export async function getDb(): Promise<AppData> {
  let db: AppData | null = await kv.get(DB_KEY);
  if (!db) {
    db = getInitialData();
    await kv.set(DB_KEY, db);
  }
  return db;
}

export async function setDb(data: AppData) {
  return kv.set(DB_KEY, data);
}
