import { supabaseAdmin } from './supabaseClient';
import { AppData, NotificationItem, StoredFile, User } from '../types';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';
import { services } from '../services/registry';

const SERVICE_TABLE_PREFIX = 'service_data_';
const USERS_TABLE = 'users';
const NOTIFICATIONS_TABLE = 'notifications';

// Extract service IDs that need their own tables.
const SERVICE_IDS = services
  .filter(s => s.category === 'document' || s.category === 'utility')
  .map(s => s.id);

// --- Individual Table Access Functions ---

export async function getServiceData(serviceId: string): Promise<any> {
    const tableName = `${SERVICE_TABLE_PREFIX}${serviceId}`;
    const { data, error } = await supabaseAdmin.from(tableName).select('value').eq('key', 'data').single();
    if (error && error.code !== 'PGRST116') console.error(`Error fetching ${tableName}:`, error);
    return data?.value || { data: null, metadata: {}, fileName: null };
}

export async function setServiceData(serviceId: string, value: any) {
    const tableName = `${SERVICE_TABLE_PREFIX}${serviceId}`;
    const { error } = await supabaseAdmin.from(tableName).upsert({ key: 'data', value });
    if (error) console.error(`Error setting ${tableName}:`, error);
}

export async function getUsers(): Promise<Record<string, User>> {
    const { data, error } = await supabaseAdmin.from(USERS_TABLE).select('value').eq('key', 'all_users').single();
    if (error && error.code !== 'PGRST116') console.error(`Error fetching users:`, error);
    return data?.value || {};
}

export async function setUsers(users: Record<string, User>) {
    const { error } = await supabaseAdmin.from(USERS_TABLE).upsert({ key: 'all_users', value: users });
    if (error) console.error(`Error setting users:`, error);
}

export async function getNotifications(): Promise<NotificationItem[]> {
    const { data, error } = await supabaseAdmin.from(NOTIFICATIONS_TABLE).select('value').eq('key', 'all_notifications').single();
    if (error && error.code !== 'PGRST116') console.error(`Error fetching notifications:`, error);
    return data?.value || [];
}

export async function setNotifications(notifications: NotificationItem[]) {
    const { error } = await supabaseAdmin.from(NOTIFICATIONS_TABLE).upsert({ key: 'all_notifications', value: notifications });
    if (error) console.error(`Error setting notifications:`, error);
}


// --- Utility and Aggregate Functions ---

export async function addNotification(
    author: string, serviceId: string, action: 'add' | 'update' | 'delete',
    title: string, categoryName?: string, itemId?: string
) {
    const serviceName = services.find(s => s.id === serviceId)?.name || serviceId;
    let actionText = '';
    switch(action) { case 'add': actionText = 'aggiunto'; break; case 'update': actionText = 'aggiornato'; break; case 'delete': actionText = 'rimosso'; break; }
    const message = `${author} ha ${actionText} "${title}" nella sezione ${serviceName}${categoryName ? ` > ${categoryName}`: ''}.`;
    
    const newNotification: NotificationItem = {
        message, timestamp: new Date().toISOString(), serviceId, categoryName, itemId,
        readBy: [author], author, id: `notif-${Date.now()}-${Math.random()}`,
    };
    
    const notifications = await getNotifications();
    notifications.unshift(newNotification);
    if (notifications.length > 100) {
        notifications.pop();
    }
    await setNotifications(notifications);
}

export const getInitialData = (): AppData => {
  const users: Record<string, User> = {};
  const defaultPassword = 'password123';

  ADMIN_USERS.forEach(name => {
    users[name.toLowerCase()] = { name, avatar: '', accessLevel: 'admin', password: defaultPassword, forcePasswordChange: true };
  });
  MODERATOR_USERS.forEach(name => {
    users[name.toLowerCase()] = { name, avatar: '', accessLevel: 'view', password: defaultPassword, forcePasswordChange: true };
  });
  
  return { services_data: {}, notifications: [], users };
};

export async function getDb(): Promise<AppData> {
    console.log("Aggregating data from all tables for initial load...");

    const users = await getUsers();
    let dbNeedsUpdate = false;
    
    // Hydrate users if table is empty or schema is old
    if (Object.keys(users).length === 0) {
        console.log('Users table is empty, creating initial user set.');
        const initialUsers = getInitialData().users;
        await setUsers(initialUsers);
        Object.assign(users, initialUsers);
    } else {
        // Migration logic for existing deployments
        const allDefinedUsers = [...ADMIN_USERS.map(name => ({ name, accessLevel: 'admin' as const })), ...MODERATOR_USERS.map(name => ({ name, accessLevel: 'view' as const }))];
        for (const definedUser of allDefinedUsers) {
            const userKey = definedUser.name.toLowerCase();
            if (!users[userKey]) {
                users[userKey] = { name: definedUser.name, avatar: '', accessLevel: definedUser.accessLevel, password: 'password123', forcePasswordChange: true };
                dbNeedsUpdate = true;
            } else if (!users[userKey].password) {
                users[userKey].password = 'password123';
                users[userKey].forcePasswordChange = true;
                dbNeedsUpdate = true;
            }
        }
        if (dbNeedsUpdate) {
            console.log('User schema updated. Saving changes.');
            await setUsers(users);
        }
    }

    const notifications = await getNotifications();
    
    const servicesDataPromises = SERVICE_IDS.map(id => getServiceData(id).then(data => ({ id, data })));
    const servicesDataResults = await Promise.all(servicesDataPromises);
    const services_data: AppData['services_data'] = {};
    servicesDataResults.forEach(result => {
        services_data[result.id] = result.data;
    });

    return { users, notifications, services_data };
}