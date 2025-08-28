import { bootstrapDb, handleServiceUpdate, addNotification, markNotificationRead, markAllNotificationsRead } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { resource, serviceId } = req.query;

    if (req.method === 'GET') {
      if (resource === 'bootstrap') {
        const db = await bootstrapDb();
        return res.status(200).json(db);
      }
      // Can add other GET endpoints here if needed
      return res.status(404).json({ message: 'Resource not found' });
    }

    if (req.method === 'PATCH') {
      if (resource === 'notifications') {
        const { action, id, username } = req.body;
        if (action === 'mark_read') await markNotificationRead(id, username);
        if (action === 'mark_all_read') await markAllNotificationsRead(username);
        return res.status(200).json({ success: true });
      }

      if (serviceId) {
        const { action, payload } = req.body;
        await handleServiceUpdate(serviceId as string, action, payload);
        
        // Add notification if it's a content-changing action
        const { author, title, categoryName, itemId } = payload;
        if (author && title && ['add', 'update', 'delete'].includes(payload.notificationAction)) {
           await addNotification({
             author,
             serviceId: serviceId as string,
             message: `${author} ha ${payload.notificationAction === 'add' ? 'aggiunto' : payload.notificationAction === 'update' ? 'aggiornato' : 'rimosso'} "${title}"`,
             categoryName,
             itemId
           });
        }
        return res.status(200).json({ success: true });
      }
    }

    res.setHeader('Allow', ['GET', 'PATCH']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error in /api/data:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}
