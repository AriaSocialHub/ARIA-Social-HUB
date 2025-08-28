import { getNotifications, setNotifications } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;
        const notifications = await getNotifications();

        switch (action) {
            case 'markRead':
                const { notificationId, username } = payload;
                const notification = notifications.find(n => n.id === notificationId);
                if (notification && !notification.readBy.includes(username)) {
                    notification.readBy.push(username);
                }
                break;

            case 'markAllRead':
                const { username: userToMarkAll } = payload;
                notifications.forEach(n => {
                    if (!n.readBy.includes(userToMarkAll)) {
                        n.readBy.push(userToMarkAll);
                    }
                });
                break;

            default:
                return res.status(400).json({ message: `Unknown action: ${action}` });
        }

        await setNotifications(notifications);
        return res.status(200).json(notifications);

    } catch (error) {
        console.error('Notifications API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
    }
}