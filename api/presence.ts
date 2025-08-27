import { head, put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OnlineUser, UserProfile } from '../types';

const PRESENCE_BLOB_KEY = 'presence-state.json';
const INACTIVE_THRESHOLD_MS = 20 * 1000; // 20 seconds

interface PresenceState {
    users: Record<string, OnlineUser>; // Keyed by sessionId for easy update
}

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
        let presenceState: PresenceState = { users: {} };

        try {
            const blobInfo = await head(PRESENCE_BLOB_KEY);
            const response = await fetch(blobInfo.url);
            if(response.ok) {
               presenceState = await response.json();
            }
        } catch (error: any) {
            if (!error.message.includes('404')) {
                console.warn('Could not fetch presence state, starting fresh:', error.message);
            }
        }

        presenceState.users[sessionId] = {
            ...profile,
            accessLevel,
            sessionId,
            lastSeen: now,
        };

        const activeUsers: Record<string, OnlineUser> = {};
        for (const sid in presenceState.users) {
            if (now - presenceState.users[sid].lastSeen < INACTIVE_THRESHOLD_MS) {
                activeUsers[sid] = presenceState.users[sid];
            }
        }
        presenceState.users = activeUsers;

        await put(PRESENCE_BLOB_KEY, JSON.stringify(presenceState), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: false,
        });

        return res.status(200).json(Object.values(presenceState.users));

    } catch (error) {
        console.error('Presence API Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
    }
}