
import { head, put, BlobNotFoundError } from '@vercel/blob';
import { AppData, User } from '../types';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';

export const DB_BLOB_KEY = 'social-hub-db.json';

export const getInitialData = (): AppData => {
  const users: Record<string, User> = {};
  const defaultPassword = 'password123';

  ADMIN_USERS.forEach(name => {
    users[name.toLowerCase()] = {
      name,
      avatar: '', // To be set on first login
      accessLevel: 'admin',
      password: defaultPassword,
      forcePasswordChange: true,
    };
  });

  MODERATOR_USERS.forEach(name => {
    users[name.toLowerCase()] = {
      name,
      avatar: '', // To be set on first login
      accessLevel: 'view',
      password: defaultPassword,
      forcePasswordChange: true,
    };
  });
  
  return {
    services_data: {},
    notifications: [],
    users,
  };
};

export async function getDb(): Promise<AppData> {
  try {
    const blob = await head(DB_BLOB_KEY);
    const response = await fetch(blob.url);
    if (!response.ok) {
        throw new Error(`Failed to fetch database from blob: ${response.statusText}`);
    }
    const db = await response.json() as AppData;
    // Ensure users object exists for backwards compatibility
    if (!db.users) {
        db.users = {};
    }
    return db;
  } catch (error) {
    if (error instanceof BlobNotFoundError) {
      console.log('Database blob not found, creating initial data.');
      const initialData = getInitialData();
      await setDb(initialData);
      return initialData;
    }
    console.error('Error getting DB from blob:', error);
    throw error;
  }
}

export async function setDb(data: AppData) {
  try {
    const dataString = JSON.stringify(data);
    await put(DB_BLOB_KEY, dataString, {
      access: 'public',
      contentType: 'application/json',
      addRandomSuffix: false, 
    });
  } catch (error) {
    console.error('Error setting DB in blob:', error);
    throw error;
  }
}
