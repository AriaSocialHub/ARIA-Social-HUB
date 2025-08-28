import { supabaseAdmin } from './supabaseClient';
import { AppData, User, NotificationItem } from '../types';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';

// Define service types for categorization
const CATEGORIZED_SERVICES = new Set(['tickets', 'procedures', 'guidelines', 'sanita', 'documentArchive', 'vademecum', 'belvedere']);
const FLAT_SERVICES = new Set(['newsArchive', 'campaigns', 'teamBreaks-primo-livello', 'commentAnalysis', 'manualTickets', 'repository']);

// --- USER MANAGEMENT ---
export async function getUsers(): Promise<Record<string, User>> {
    const { data, error } = await supabaseAdmin.from('users').select('*');
    if (error) throw error;

    if (data.length === 0) {
        // First run: populate users and return them
        return await populateInitialUsers();
    }

    const users: Record<string, User> = {};
    for (const user of data) {
        users[user.name.toLowerCase()] = {
            name: user.name,
            avatar: user.avatar,
            accessLevel: user.access_level,
            password: user.password,
            forcePasswordChange: user.force_password_change
        };
    }
    return users;
}

export async function upsertUser(user: User): Promise<User> {
    const { data, error } = await supabaseAdmin.from('users').upsert({
        name: user.name,
        avatar: user.avatar,
        access_level: user.accessLevel,
        password: user.password,
        force_password_change: user.forcePasswordChange
    }).select().single();
    if (error) throw error;
    return {
        name: data.name,
        avatar: data.avatar,
        accessLevel: data.access_level,
        password: data.password,
        forcePasswordChange: data.force_password_change
    };
}

export async function deleteUserByName(name: string) {
    const { error } = await supabaseAdmin.from('users').delete().eq('name', name);
    if (error) throw error;
}

async function populateInitialUsers(): Promise<Record<string, User>> {
    const defaultPassword = 'password123';
    const usersToInsert = [
        ...ADMIN_USERS.map(name => ({ name, access_level: 'admin', password: defaultPassword, force_password_change: true })),
        ...MODERATOR_USERS.map(name => ({ name, access_level: 'view', password: defaultPassword, force_password_change: true }))
    ];

    const { error } = await supabaseAdmin.from('users').insert(usersToInsert);
    if (error) {
        console.error("Error populating initial users:", error);
        throw error;
    }
    
    const users: Record<string, User> = {};
    usersToInsert.forEach(u => {
      users[u.name.toLowerCase()] = { name: u.name, avatar: '', accessLevel: u.access_level as 'admin' | 'view', password: u.password, forcePasswordChange: u.force_password_change };
    });
    return users;
}

// --- NOTIFICATIONS ---
export async function getNotifications(): Promise<NotificationItem[]> {
    const { data, error } = await supabaseAdmin.from('notifications').select('*').order('timestamp', { ascending: false }).limit(100);
    if (error) throw error;
    return data as NotificationItem[];
}

export async function addNotification(notification: Omit<NotificationItem, 'id'|'timestamp'|'readBy'>) {
    const { error } = await supabaseAdmin.from('notifications').insert(notification);
    if (error) throw error;
}

export async function markNotificationRead(id: string, username: string) {
     const { error } = await supabaseAdmin.rpc('append_to_read_by', { notification_id: id, username_to_add: username });
     if (error) throw error;
}

export async function markAllNotificationsRead(username: string) {
    const { error } = await supabaseAdmin.rpc('mark_all_as_read_by_user', { username_to_add: username });
    if (error) throw error;
}

// --- GENERIC SERVICE DATA HANDLING ---
async function getServiceData() {
    const services_data: AppData['services_data'] = {};

    // Fetch metadata
    const { data: metaData, error: metaError } = await supabaseAdmin.from('service_metadata').select('*');
    if (metaError) throw metaError;
    for (const meta of metaData) {
        services_data[meta.service_id] = {
            ...services_data[meta.service_id],
            fileName: meta.file_name,
            metadata: meta.categories
        };
    }
    
    // Fetch categorized data
    const { data: categorizedData, error: categorizedError } = await supabaseAdmin.from('categorized_service_data').select('*');
    if (categorizedError) throw categorizedError;
    for (const item of categorizedData) {
        if (!services_data[item.service_id]) services_data[item.service_id] = { data: {}, fileName: null };
        if (!services_data[item.service_id].data) services_data[item.service_id].data = {};
        if (!services_data[item.service_id].data[item.category_name]) services_data[item.service_id].data[item.category_name] = [];
        services_data[item.service_id].data[item.category_name].push({ id: item.id, ...item.data });
    }

    // Fetch flat data
    const { data: flatData, error: flatError } = await supabaseAdmin.from('flat_service_data').select('*');
    if (flatError) throw flatError;
    for (const item of flatData) {
        if (!services_data[item.service_id]) services_data[item.service_id] = { data: [], fileName: null };
        if (!Array.isArray(services_data[item.service_id].data)) services_data[item.service_id].data = [];
        services_data[item.service_id].data.push({ id: item.id, ...item.data });
    }

    // Fetch shifts data
    const { data: shiftsData, error: shiftsError } = await supabaseAdmin.from('shifts').select('*');
    if (shiftsError) throw shiftsError;
    const shiftsPrimo: Record<string, any> = {};
    const shiftsSecondo: Record<string, any> = {};
    for (const shift of shiftsData) {
        if(shift.level === 'primo') shiftsPrimo[shift.date_key] = shift.shifts;
        else shiftsSecondo[shift.date_key] = shift.shifts;
    }
    if(Object.keys(shiftsPrimo).length > 0) services_data['shifts-primo-livello'] = { data: shiftsPrimo, fileName: null };
    if(Object.keys(shiftsSecondo).length > 0) services_data['shifts-secondo-livello'] = { data: shiftsSecondo, fileName: null };

    return services_data;
}

// --- BOOTSTRAP ---
export async function bootstrapDb(): Promise<AppData> {
    const [users, notifications, services_data] = await Promise.all([
        getUsers(),
        getNotifications(),
        getServiceData()
    ]);

    return { users, notifications, services_data };
}

// --- DATA MODIFICATION ---
export async function handleServiceUpdate(serviceId: string, action: string, payload: any) {
    const { id, categoryName, oldName, newName, metaUpdate, item, itemId, updatedItem, fileData, items, fileName, categoriesMetadata, shifts, dateKey, level } = payload;
    
    // Determine service type
    const isCategorized = CATEGORIZED_SERVICES.has(serviceId);
    const isFlat = FLAT_SERVICES.has(serviceId);
    const isShift = serviceId.startsWith('shifts');

    // Handle Metadata updates
    if (['RENAME_CATEGORY', 'UPDATE_CATEGORY_METADATA', 'ADD_CATEGORY', 'DELETE_CATEGORY', 'DELETE_MULTIPLE_CATEGORIES'].includes(action)) {
        const { data: meta, error } = await supabaseAdmin.from('service_metadata').select('categories').eq('service_id', serviceId).single();
        if (error && error.code !== 'PGRST116') throw error;
        const currentCategories = meta?.categories || {};

        if (action === 'ADD_CATEGORY') currentCategories[categoryName] = metaUpdate;
        if (action === 'DELETE_CATEGORY') delete currentCategories[categoryName];
        if (action === 'DELETE_MULTIPLE_CATEGORIES') payload.categoryNames.forEach((name: string) => delete currentCategories[name]);
        if (action === 'RENAME_CATEGORY') {
            currentCategories[newName] = currentCategories[oldName];
            delete currentCategories[oldName];
        }
        if (action === 'UPDATE_CATEGORY_METADATA') {
            currentCategories[categoryName] = { ...currentCategories[categoryName], ...metaUpdate };
        }
        
        const { error: upsertError } = await supabaseAdmin.from('service_metadata').upsert({ service_id: serviceId, categories: currentCategories });
        if (upsertError) throw upsertError;
    }

    if (action === 'UPLOAD_AND_REPLACE') {
         await supabaseAdmin.from('service_metadata').upsert({ service_id: serviceId, file_name: fileName, categories: categoriesMetadata });
        if (isCategorized) {
            await supabaseAdmin.from('categorized_service_data').delete().eq('service_id', serviceId);
            const itemsToInsert = Object.entries(items).flatMap(([catName, catItems]: [string, any[]]) => 
                catItems.map(({ id, ...rest }) => ({ service_id: serviceId, category_name: catName, id, data: rest }))
            );
            if (itemsToInsert.length > 0) {
                const { error } = await supabaseAdmin.from('categorized_service_data').insert(itemsToInsert);
                if (error) throw error;
            }
        } else if (isFlat) {
            await supabaseAdmin.from('flat_service_data').delete().eq('service_id', serviceId);
            const itemsToInsert = items.map(({ id, ...rest }: any) => ({ service_id: serviceId, id, data: rest }));
             if (itemsToInsert.length > 0) {
                const { error } = await supabaseAdmin.from('flat_service_data').insert(itemsToInsert);
                if (error) throw error;
            }
        }
        return;
    }
    
    // Handle Item updates
    if (isCategorized) {
        const table = 'categorized_service_data';
        if (action === 'ADD_ITEM') {
            const { id, ...rest } = item;
            await supabaseAdmin.from(table).insert({ service_id: serviceId, category_name: categoryName, id, data: rest });
        }
        if (action === 'UPDATE_ITEM') {
            const { id, ...rest } = updatedItem;
            await supabaseAdmin.from(table).update({ data: rest }).match({ service_id: serviceId, id: itemId });
        }
        if (action === 'DELETE_ITEM') {
            await supabaseAdmin.from(table).delete().match({ service_id: serviceId, id: itemId });
        }
        if (action === 'RENAME_CATEGORY') {
             await supabaseAdmin.from(table).update({ category_name: newName }).match({ service_id: serviceId, category_name: oldName });
        }
        if (action === 'DELETE_CATEGORY') {
            await supabaseAdmin.from(table).delete().match({ service_id: serviceId, category_name: categoryName });
        }
        if (action === 'DELETE_MULTIPLE_CATEGORIES') {
            await supabaseAdmin.from(table).delete().eq('service_id', serviceId).in('category_name', payload.categoryNames);
        }
    } else if (isFlat) {
        const table = 'flat_service_data';
        if (action === 'SAVE_SERVICE_DATA') { // for flat arrays like campaigns, breaks
             await supabaseAdmin.from(table).delete().eq('service_id', serviceId);
             if(payload.newData.length > 0) {
                const itemsToInsert = payload.newData.map(({ id, ...rest }: any) => ({ service_id: serviceId, id, data: rest }));
                await supabaseAdmin.from(table).insert(itemsToInsert);
             }
        }
        if(action === 'ADD_FILE' || action === 'DELETE_FILE') {
            if(action === 'ADD_FILE') {
                const { id, ...rest } = fileData;
                await supabaseAdmin.from(table).insert({ service_id: serviceId, id, data: rest });
            } else {
                 await supabaseAdmin.from(table).delete().match({ service_id: serviceId, id: itemId });
            }
        }
    } else if (isShift) {
        await supabaseAdmin.from('shifts').delete().eq('level', level);
        const shiftsToInsert = Object.entries(shifts).map(([date, shiftData]) => ({ date_key: date, level, shifts: shiftData }));
        if(shiftsToInsert.length > 0) {
             await supabaseAdmin.from('shifts').insert(shiftsToInsert);
        }
    }
}
