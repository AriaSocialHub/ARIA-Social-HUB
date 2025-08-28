import { getUsers, upsertUser, deleteUserByName } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const users = await getUsers();
      return res.status(200).json(users);
    }

    if (req.method === 'POST') {
      const userData = req.body as User;
      if (!userData || !userData.name || !userData.accessLevel) {
        return res.status(400).json({ message: 'Invalid user data provided.' });
      }
      const updatedUser = await upsertUser(userData);
      return res.status(200).json(updatedUser);
    }

    if (req.method === 'DELETE') {
      const { username } = req.query;
      if (typeof username !== 'string') {
        return res.status(400).json({ message: 'Username query parameter is required.' });
      }
      await deleteUserByName(username);
      return res.status(200).json({ success: true });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    return res.status(405).json({ message: 'Method Not Allowed' });

  } catch (error) {
    console.error('Users API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}
