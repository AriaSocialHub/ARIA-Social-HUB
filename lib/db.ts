
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
  let db: AppData;
  let dbNeedsUpdate = false;

  try {
    const blob = await head(DB_BLOB_KEY);
    const response = await fetch(blob.url);
    if (!response.ok) {
        throw new Error(`Failed to fetch database from blob: ${response.statusText}`);
    }
    db = await response.json() as AppData;
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

  // --- Start of Migration/Hydration Logic ---
  // This ensures that any existing DB is brought up-to-date with the current user schema.
  if (!db.users) {
    db.users = {};
    dbNeedsUpdate = true;
  }

  const defaultPassword = 'password123';

  const allDefinedUsers = [
    ...ADMIN_USERS.map(name => ({ name, accessLevel: 'admin' as const })),
    ...MODERATOR_USERS.map(name => ({ name, accessLevel: 'view' as const })),
  ];

  for (const definedUser of allDefinedUsers) {
    const userKey = definedUser.name.toLowerCase();
    const existingUser = db.users[userKey];

    if (!existingUser) {
      // User is defined in the code but not in the DB, add them.
      db.users[userKey] = {
        name: definedUser.name,
        avatar: '',
        accessLevel: definedUser.accessLevel,
        password: defaultPassword,
        forcePasswordChange: true,
      };
      dbNeedsUpdate = true;
    } else if (!existingUser.password) {
      // User exists in DB but is missing the password field. This fixes the login issue.
      existingUser.password = defaultPassword;
      existingUser.forcePasswordChange = true;
      dbNeedsUpdate = true;
    }
  }
  
  // --- End of Migration/Hydration Logic ---
  
  if (dbNeedsUpdate) {
      console.log('DB schema outdated or incomplete. Hydrating with default user data and re-saving.');
      await setDb(db);
  }

  return db;
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
