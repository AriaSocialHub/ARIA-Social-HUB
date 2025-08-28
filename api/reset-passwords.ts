import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // 1. Fetch all users just to get their names
    const { data: users, error: fetchError } = await supabaseAdmin
      .from('users')
      .select('name');

    if (fetchError) {
      throw new Error(`Failed to fetch users: ${fetchError.message}`);
    }

    if (!users || users.length === 0) {
      return res.status(200).send('Nessun utente trovato da resettare.');
    }

    // 2. Prepare the update payload for all users
    const updates = users.map(user => ({
      name: user.name, // The primary key for the upsert
      password: 'password123',
      force_password_change: true,
    }));

    // 3. Perform the bulk update using upsert
    const { error: updateError } = await supabaseAdmin
      .from('users')
      .upsert(updates, { onConflict: 'name' });

    if (updateError) {
      throw new Error(`Failed to update passwords: ${updateError.message}`);
    }

    // 4. Send success response
    return res.status(200).send(`Reset delle password completato per ${users.length} utenti. Ora possono accedere con la password "password123" e saranno obbligati a cambiarla.`);

  } catch (error: any) {
    console.error('Password Reset API Error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
  }
}