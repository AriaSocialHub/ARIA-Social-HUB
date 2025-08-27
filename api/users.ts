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
      const newUser = req.body as User;

      if (!newUser || !newUser.name || !newUser.avatar || !newUser.accessLevel) {
          return res.status(400).json({ message: 'Invalid user data provided.' });
      }

      // Use a consistent key for the user, e.g., lowercase name
      const userKey = newUser.name.toLowerCase();
      
      db.users[userKey] = newUser;
      
      await setDb(db);
      return res.status(201).json(db.users);
    }
    
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });

  } catch (error) {
    console.error('Users API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}