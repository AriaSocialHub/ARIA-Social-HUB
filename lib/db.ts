import { supabaseAdmin } from './supabaseClient';
import { AppData, User, Service, NotificationItem } from '../types';
import { services as serviceRegistry } from '../services/registry';

// List of services that use the categorized data model
const categorizedServices = serviceRegistry.filter(s => s.category === 'document' || s.id === 'repository' || s.id.startsWith('shifts') || s.id.startsWith('teamBreaks'));
const simpleServices = serviceRegistry.filter(s => !categorizedServices.some(cs => cs.id === s.id) && s.id !== 'dashboard' && s.id !== 'userManagement');

// --- READ OPERATIONS ---

async function fetchUsers(): Promise<Record<string, User>> {
    const { data, error } = await supabaseAdmin.from('users').select('*');
    if (error) {
        console.error('Error fetching users:', error);
        return {};
    }
    const usersMap: Record<string, User> = {};
    data.forEach((u: any) => {
        usersMap[u.name.toLowerCase()] = {
            name: u.name,
            avatar: u.avatar,
            accessLevel: u.access_level,
            password: u.password,
            forcePasswordChange: u.force_password_change,
        };
    });
    return usersMap;
}

async function fetchNotifications(): Promise<NotificationItem[]> {
    const { data, error } = await supabaseAdmin
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);
    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data.map((n: any) => ({
        id: n.id,
        message: n.message,
        timestamp: n.timestamp,
        serviceId: n.service_id,
        categoryName: n.category_name,
        itemId: n.item_id,
        readBy: n.read_by,
        author: n.author,
    }));
}

async function fetchServiceData(service: Service<any>): Promise<[string, any]> {
    const tableName = `service_${service.id.replace(/-/g, '_')}`;
    const isCategorized = categorizedServices.some(cs => cs.id === service.id);

    try {
        if (isCategorized) {
            const [dataRes, metaRes] = await Promise.all([
                supabaseAdmin.from(tableName).select('category_name, item_data'),
                supabaseAdmin.from('service_categories_metadata').select('*').eq('service_id', service.id)
            ]);

            if (dataRes.error) throw dataRes.error;
            if (metaRes.error) throw metaRes.error;

            const groupedData = dataRes.data.reduce((acc, row) => {
                const category = row.category_name || '_default';
                if (!acc[category]) {
                    acc[category] = [];
                }
                acc[category].push(row.item_data);
                return acc;
            }, {} as Record<string, any[]>);

            const metadata = metaRes.data.reduce((acc, row) => {
                acc[row.category_name] = {
                    icon: row.icon,
                    color: row.color,
                    type: row.type,
                    createdAt: row.created_at,
                };
                return acc;
            }, {} as Record<string, any>);
            
            return [service.id, { data: groupedData, metadata, fileName: null }];

        } else { // Simple services (flat array data)
            const { data, error } = await supabaseAdmin.from(tableName).select('item_data');
            if (error) throw error;
            const flatData = data.map(row => row.item_data);
            return [service.id, { data: flatData, metadata: {}, fileName: null }];
        }
    } catch (error: any) {
        if (error.code === '42P01') {
             console.log(`Table for service ${service.id} not found, returning empty data.`);
             const emptyData = isCategorized ? { data: {}, metadata: {} } : { data: [] };
             return [service.id, { ...emptyData, fileName: null }];
        }
        console.error(`Error fetching data for service ${service.id}:`, error);
        const emptyData = isCategorized ? { data: {}, metadata: {} } : { data: [] };
        return [service.id, { ...emptyData, fileName: null }];
    }
}


export async function getDb(): Promise<AppData> {
  const [users, notifications, ...servicesDataArray] = await Promise.all([
    fetchUsers(),
    fetchNotifications(),
    ...serviceRegistry
        .filter(s => s.id !== 'dashboard' && s.id !== 'userManagement')
        .map(fetchServiceData),
  ]);

  const services_data: AppData['services_data'] = Object.fromEntries(servicesDataArray);

  return {
    users,
    notifications,
    services_data,
  };
}
