import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // This endpoint exposes the PUBLIC Supabase keys to the frontend client.
  // It is safe to expose the anonymous key.
  const config = {
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
  };

  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    console.error("Server-side Supabase environment variables are not set.");
    return res.status(500).json({ error: "Supabase configuration is missing on the server." });
  }

  return res.status(200).json(config);
}
