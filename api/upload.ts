import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Vercel's config to allow streaming body
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const filename = req.query.filename as string;
  if (!filename) {
      return res.status(400).json({ message: '`filename` query parameter is required.' });
  }
  
  const contentType = req.headers['content-type'] || 'application/octet-stream';

  try {
    // Upload the file to Supabase Storage in the 'uploads' bucket
    // The request body is a stream and can be passed directly
    const { data, error } = await supabaseAdmin.storage
      .from('uploads')
      .upload(filename, req, {
        contentType,
        upsert: false, // Do not overwrite existing files
      });

    if (error) {
      console.error('Supabase Upload Error:', error);
      return res.status(500).json({ message: `Supabase error: ${error.message}` });
    }

    // Get the public URL for the uploaded file
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from('uploads')
      .getPublicUrl(data.path);
    
    return res.status(200).json({ url: publicUrl });
  } catch (error) {
    console.error('Upload Handler Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}