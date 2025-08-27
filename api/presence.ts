import { set, keys, mget } from '@vercel/kv';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OnlineUser, UserProfile } from '../types';

const PRESENCE_KEY_PREFIX = 'presence:';
const EXPIRATION_SECONDS = 20; // A user is considered offline after 20 seconds of inactivity

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { profile, accessLevel, sessionId } = req.body as { profile: UserProfile, accessLevel: 'admin' | 'view', sessionId: string };

        if (!profile || !accessLevel || !sessionId) {
            return res.status(400).json({ message: 'Missing required presence data.' });
        }

        const now = Date.now();
        const userKey = `${PRESENCE_KEY_PREFIX}${sessionId}`;
        
        const currentUserData: OnlineUser = {
            ...profile,
            accessLevel,
            sessionId,
            lastSeen: now,
        };

        // Set the user's presence with an expiration
        // FIX: Use destructured `set` function from @vercel/kv
        await set(userKey, JSON.stringify(currentUserData), { ex: EXPIRATION_SECONDS });

        // Get all active presence keys
        // FIX: Use destructured `keys` function from @vercel/kv
        const presenceKeys = await keys(`${PRESENCE_KEY_PREFIX}*`);
        
        let onlineUsers: OnlineUser[] = [];
        if (presenceKeys.length > 0) {
            // FIX: Use destructured `mget` function from @vercel/kv
            const userRecords = await mget<OnlineUser[]>(...presenceKeys);
            onlineUsers = userRecords.filter((user): user is OnlineUser => user !== null);
        }

        return res.status(200).json(onlineUsers);

    } catch (error) {
        console.error('Presence API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
    }
}