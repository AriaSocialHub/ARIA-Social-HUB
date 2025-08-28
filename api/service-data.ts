import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotificationItem } from '../types';


export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { action, payload } = req.body;
    const { serviceId, categoryName, itemId, updatedItem, item, oldName, newName, metaUpdate, newData, categoryNames, notificationId, username } = payload;
    const tableName = serviceId ? `service_${serviceId.replace(/-/g, '_')}` : '';

    let result;

    switch (action) {
        // --- Simple Data (flat array) ---
        case 'saveSimpleData':
            // This is a destructive operation: clear table and insert new data
            await supabaseAdmin.from(tableName).delete().neq('id', 'placeholder-to-delete-all');
            if (newData && newData.length > 0) {
                const itemsToInsert = newData.map((d: any) => ({ id: d.id, item_data: d }));
                result = await supabaseAdmin.from(tableName).insert(itemsToInsert);
            }
            break;

        // --- Category Operations ---
        case 'addCategory':
            result = await supabaseAdmin.from('service_categories_metadata').insert({
                service_id: serviceId,
                category_name: categoryName,
                ...metaUpdate,
            });
            break;
        case 'renameCategory':
            result = await supabaseAdmin.rpc('rename_category', {
                p_service_id: serviceId,
                p_old_name: oldName,
                p_new_name: newName
            });
            break;
        case 'deleteCategory':
            await supabaseAdmin.from(tableName).delete().eq('category_name', categoryName);
            result = await supabaseAdmin.from('service_categories_metadata').delete().match({ service_id: serviceId, category_name: categoryName });
            break;
        case 'deleteMultipleCategories':
            await supabaseAdmin.from(tableName).delete().in('category_name', categoryNames);
            result = await supabaseAdmin.from('service_categories_metadata').delete().eq('service_id', serviceId).in('category_name', categoryNames);
            break;
        case 'updateCategoryMetadata':
            result = await supabaseAdmin.from('service_categories_metadata').update(metaUpdate).match({ service_id: serviceId, category_name: categoryName });
            break;

        // --- Item Operations ---
        case 'addItem':
            const insertPayload: any = {
                id: item.id,
                item_data: item,
            };
            if(categoryName) insertPayload.category_name = categoryName;

            result = await supabaseAdmin.from(tableName).insert(insertPayload);
            break;
        case 'updateItem':
            const { data: currentItemData } = await supabaseAdmin.from(tableName).select('item_data').eq('id', itemId).single();
            if(!currentItemData) throw new Error("Item not found");
            const newItemData = { ...currentItemData.item_data, ...updatedItem };
            result = await supabaseAdmin.from(tableName).update({ item_data: newItemData }).eq('id', itemId);
            break;
        case 'deleteItem':
            result = await supabaseAdmin.from(tableName).delete().eq('id', itemId);
            break;
        
        // --- Notification Operations ---
        case 'markNotificationRead':
            result = await supabaseAdmin.rpc('append_to_read_by', {
                p_notification_id: notificationId,
                p_username: username
            });
            break;
        case 'markAllNotificationsRead':
            result = await supabaseAdmin.rpc('mark_all_as_read', { p_username: username });
            break;
            
        default:
            return res.status(400).json({ message: 'Invalid action specified.' });
    }

    if (result && result.error) {
        throw result.error;
    }

    return res.status(200).json({ success: true });

  } catch (error: any) {
    console.error('Service Data API Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message || error}` });
  }
}
