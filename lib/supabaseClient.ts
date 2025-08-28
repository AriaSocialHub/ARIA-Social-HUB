import { createClient } from '@supabase/supabase-js';

// These variables are available in Vercel's serverless function environment
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase environment variables SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.");
}

// This client has admin privileges and should ONLY be used on the server (in API routes)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        // In server-side code, we don't need to persist sessions.
        persistSession: false
    }
});
