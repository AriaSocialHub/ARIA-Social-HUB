import { supabaseAdmin } from './supabaseClient';
import { AppData, User } from '../types';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';

const DB_TABLE_NAME = 'app_data_store';
const DB_ROW_KEY = 'main_db';

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
  const { data, error } = await supabaseAdmin
    .from(DB_TABLE_NAME)
    .select('value')
    .eq('key', DB_ROW_KEY)
    .single();

  let db: AppData;

  if (error || !data) {
    if (error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        console.error('Error fetching DB from Supabase:', error.message);
    }
    console.log('Database not found in Supabase, creating initial data.');
    const initialData = getInitialData();
    await setDb(initialData);
    return initialData;
  }
  
  db = data.value as AppData;
  let dbNeedsUpdate = false;

  // --- Start of Migration/Hydration Logic ---
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
      db.users[userKey] = {
        name: definedUser.name,
        avatar: '',
        accessLevel: definedUser.accessLevel,
        password: defaultPassword,
        forcePasswordChange: true,
      };
      dbNeedsUpdate = true;
    } else if (!existingUser.password) {
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
  const { error } = await supabaseAdmin
    .from(DB_TABLE_NAME)
    .upsert({ key: DB_ROW_KEY, value: data });

  if (error) {
    console.error('Error setting DB in Supabase:', error);
    throw error;
  }
}

// --- Legacy / Compatibility Exports to fix build errors in api/servicedata.ts and api/notifications.ts ---

export async function getServiceData(serviceId: string) {
    const db = await getDb();
    return db.services_data?.[serviceId] || null;
}

export async function setServiceData(serviceId: string, serviceData: any) {
    const db = await getDb();
    if (!db.services_data) db.services_data = {};
    
    // Upsert the service data
    db.services_data[serviceId] = serviceData;
    
    await setDb(db);
    return db;
}

// Updated to handle both new (1 arg) and legacy (6 args) calls
export async function addNotification(...args: any[]) {
    const db = await getDb();
    if (!db.notifications) db.notifications = [];
    
    let notificationItem: any = null;

    // Check signature type
    if (args.length === 1 && typeof args[0] === 'object') {
        // New signature: addNotification(notificationObject)
        notificationItem = args[0];
    } else if (args.length >= 3) {
        // Legacy signature: addNotification(serviceId, newData, author, action, title, itemId)
        // Based on context from typical legacy structures
        const [serviceId, , author, action, title, itemId] = args;

        let actionText = '';
        switch(action) {
            case 'add': actionText = 'aggiunto'; break;
            case 'update': actionText = 'aggiornato'; break;
            case 'delete': actionText = 'rimosso'; break;
            default: actionText = 'modificato';
        }
        
        notificationItem = {
            id: `notif-legacy-${Date.now()}-${Math.random()}`,
            message: `${author} ha ${actionText} "${title || 'elemento'}" in ${serviceId}.`,
            timestamp: new Date().toISOString(),
            serviceId: serviceId,
            categoryName: '', 
            itemId: itemId,
            readBy: [author], 
            clearedBy: [],
            author: author || 'Sistema'
        };
    }
    
    if (notificationItem) {
        db.notifications.unshift(notificationItem);
        // Trim to keep size manageable
        if (db.notifications.length > 100) {
            db.notifications = db.notifications.slice(0, 100);
        }
        await setDb(db);
    }
    
    return db;
}

export async function getNotifications() {
    const db = await getDb();
    return db.notifications || [];
}

export async function setNotifications(notifications: any[]) {
    const db = await getDb();
    db.notifications = notifications;
    await setDb(db);
    return db;
}