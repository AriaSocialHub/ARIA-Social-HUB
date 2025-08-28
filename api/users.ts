
import { getUsers, setUsers } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const users = await getUsers();
      return res.status(200).json(users || {});
    }

    if (req.method === 'POST') {
      const users = await getUsers();
      const userData = req.body as Partial<User> & { name: string };

      if (!userData || !userData.name) {
          return res.status(400).json({ message: 'Invalid user data provided.' });
      }

      const userKey = userData.name.toLowerCase();
      const existingUser = users[userKey];
      
      if (existingUser) {
        users[userKey] = { ...existingUser, ...userData };
      } else {
        const { name, avatar, accessLevel, password, forcePasswordChange } = userData;
        if (typeof avatar !== 'string' || typeof accessLevel !== 'string' || !['admin', 'view'].includes(accessLevel)) {
          return res.status(400).json({ message: 'To create a new user, `name`, `avatar`, and a valid `accessLevel` are required.' });
        }
        const newUser: User = { name, avatar, accessLevel, password, forcePasswordChange };
        users[userKey] = newUser;
      }
      
      await setUsers(users);
      return res.status(200).json(users);
    }

    if (req.method === 'DELETE') {
        const users = await getUsers();
        const { username } = req.query;
        if (typeof username !== 'string') {
            return res.status(400).json({ message: 'Username query parameter is required.' });
        }
        const userKey = username.toLowerCase();
        if (users[userKey]) {
            delete users[userKey];
            await setUsers(users);
            return res.status(200).json(users);
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