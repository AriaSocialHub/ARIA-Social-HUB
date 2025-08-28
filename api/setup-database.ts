import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';
import { User, AppData } from '../types';

const MIGRATION_KEY = 'v1_migration_complete';

async function migrateData() {
    // 1. Check if migration has already been done
    const { data: migrationStatus, error: checkError } = await supabaseAdmin
        .from('app_setup_status')
        .select('*')
        .eq('setup_key', MIGRATION_KEY)
        .maybeSingle();

    if (checkError) throw new Error(`Error checking migration status: ${checkError.message}`);
    if (migrationStatus) return 'Migration already completed. No action taken.';

    // 2. Fetch old data from the monolithic table
    const { data: oldData, error: fetchError } = await supabaseAdmin
        .from('app_data_store')
        .select('value')
        .eq('key', 'main_db')
        .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // Ignore "not found" error
        throw new Error(`Failed to fetch old data: ${fetchError.message}`);
    }

    const oldDb = oldData?.value as AppData | null;
    let usersToMigrate: User[] = [];
    
    if (oldDb && oldDb.users && Object.keys(oldDb.users).length > 0) {
        console.log('Found existing users in app_data_store. Migrating them.');
        usersToMigrate = Object.values(oldDb.users);
    } else {
        console.log('No existing users found. Creating users from default lists.');
        const defaultPassword = 'password123';
        ADMIN_USERS.forEach(name => usersToMigrate.push({
            name, avatar: '', accessLevel: 'admin', password: defaultPassword, forcePasswordChange: true
        }));
        MODERATOR_USERS.forEach(name => usersToMigrate.push({
            name, avatar: '', accessLevel: 'view', password: defaultPassword, forcePasswordChange: true
        }));
    }

    // 3. Insert users into the new `users` table
    if (usersToMigrate.length > 0) {
        const usersForDb = usersToMigrate.map(u => ({
            name: u.name,
            avatar: u.avatar,
            access_level: u.accessLevel,
            password: u.password,
            force_password_change: u.forcePasswordChange
        }));

        const { error: userInsertError } = await supabaseAdmin.from('users').upsert(usersForDb, { onConflict: 'name' });
        if (userInsertError) throw new Error(`Failed to migrate users: ${userInsertError.message}`);
        console.log(`Successfully migrated/created ${usersToMigrate.length} users.`);
    }

    // 4. Migrate notifications if they exist
    if (oldDb?.notifications && oldDb.notifications.length > 0) {
        const notificationsForDb = oldDb.notifications.map(n => ({
            id: n.id,
            message: n.message,
            timestamp: n.timestamp,
            service_id: n.serviceId,
            category_name: n.categoryName,
            item_id: n.itemId,
            read_by: n.readBy,
            author: n.author,
        }));
        const { error: notificationInsertError } = await supabaseAdmin.from('notifications').upsert(notificationsForDb);
        if (notificationInsertError) throw new Error(`Failed to migrate notifications: ${notificationInsertError.message}`);
        console.log(`Successfully migrated ${oldDb.notifications.length} notifications.`);
    }

    // 5. Mark migration as complete
    const { error: completeError } = await supabaseAdmin
        .from('app_setup_status')
        .insert({ setup_key: MIGRATION_KEY, completed_at: new Date().toISOString() });
    if (completeError) throw new Error(`Failed to mark migration as complete: ${completeError.message}`);
    
    return 'Database setup and migration complete!';
}


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const message = await migrateData();
    return res.status(200).send(message);
  } catch (error: any) {
    console.error('Setup/Migration Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
}
