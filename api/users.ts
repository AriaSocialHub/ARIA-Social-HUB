
import { getDb, setDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const db = await getDb();

    if (req.method === 'GET') {
      return res.status(200).json(db.users || {});
    }

    if (req.method === 'POST') {
      const userData = req.body as Partial<User> & { name: string };

      if (!userData || !userData.name) {
          return res.status(400).json({ message: 'Invalid user data provided.' });
      }

      const userKey = userData.name.toLowerCase();
      const existingUser = db.users[userKey];
      
      // FIX: The original one-liner for upsert was not type-safe for creating new users.
      // This has been split into explicit update and create paths to ensure type correctness.
      if (existingUser) {
        // Update existing user: merge properties.
        db.users[userKey] = { ...existingUser, ...userData };
      } else {
        // Create new user: all required fields must be present in `userData`.
        const { name, avatar, accessLevel, password, forcePasswordChange } = userData;
        if (typeof avatar !== 'string' || typeof accessLevel !== 'string' || !['admin', 'view'].includes(accessLevel)) {
          return res.status(400).json({ message: 'To create a new user, `name`, `avatar`, and a valid `accessLevel` are required.' });
        }
        const newUser: User = {
          name,
          avatar,
          accessLevel,
          password,
          forcePasswordChange,
        };
        db.users[userKey] = newUser;
      }
      
      await setDb(db);
      return res.status(200).json(db.users);
    }

    if (req.method === 'DELETE') {
        const { username } = req.query;
        if (typeof username !== 'string') {
            return res.status(400).json({ message: 'Username query parameter is required.' });
        }
        const userKey = username.toLowerCase();
        if (db.users[userKey]) {
            delete db.users[userKey];
            await setDb(db);
            return res.status(200).json(db.users);
        } else {
            return res.status(404).json({ message: 'User not found.' });
        }
    }
    
    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ message: 'Method Not Allowed' });

  } catch (error) {
    console.error('Users API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}
