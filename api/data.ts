import { getDb, setDb } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'GET') {
      const db = await getDb();
      return res.status(200).json(db);
    }
    if (req.method === 'POST') {
      // Basic validation to ensure body is an object
      if (typeof req.body !== 'object' || req.body === null) {
        return res.status(400).json({ message: 'Invalid request body. Expected a JSON object.' });
      }
      await setDb(req.body);
      const updatedDb = await getDb();
      return res.status(200).json(updatedDb);
    }
    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}
