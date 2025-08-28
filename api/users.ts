import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { User } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      const userData = req.body as User;

      if (!userData || !userData.name) {
          return res.status(400).json({ message: 'Invalid user data provided.' });
      }
      
      const userForDb = {
          name: userData.name,
          avatar: userData.avatar,
          access_level: userData.accessLevel,
          password: userData.password,
          force_password_change: userData.forcePasswordChange,
      };

      const { data, error } = await supabaseAdmin.from('users').upsert(userForDb, { onConflict: 'name' }).select().single();

      if (error) throw error;
      
      const responseUser: User = {
          name: data.name,
          avatar: data.avatar,
          accessLevel: data.access_level,
          password: data.password,
          forcePasswordChange: data.force_password_change
      };

      return res.status(200).json(responseUser);
    }

    if (req.method === 'DELETE') {
        const { username } = req.query;
        if (typeof username !== 'string') {
            return res.status(400).json({ message: 'Username query parameter is required.' });
        }
        
        const { error } = await supabaseAdmin.from('users').delete().eq('name', username);

        if (error) throw error;
        return res.status(204).send(null); // No content
    }
    
    res.setHeader('Allow', ['POST', 'DELETE']);
    return res.status(405).json({ message: 'Method Not Allowed' });

  } catch (error: any) {
    console.error('Users API Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
}
