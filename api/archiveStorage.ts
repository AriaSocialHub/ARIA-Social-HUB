
import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle Signed URL generation for download (GET)
  if (req.method === 'GET') {
      const filename = req.query.filename as string;
      if (!filename) {
          return res.status(400).json({ message: 'Filename is required' });
      }
      
      try {
          const { data, error } = await supabaseAdmin.storage
              .from('archives')
              .createSignedUrl(filename, 60 * 60); // 1 hour validity

          if (error) throw error;
          return res.status(200).json({ signedUrl: data.signedUrl });
      } catch (error: any) {
          console.error('Error generating signed URL:', error);
          return res.status(500).json({ message: `Error: ${error.message}` });
      }
  }

  // Handle Signed Upload URL generation (POST)
  // Instead of uploading the file here (which hits Vercel 4.5MB limit),
  // we generate a secure URL so the client can upload directly to Supabase.
  if (req.method === 'POST') {
      const filename = req.query.filename as string;
      if (!filename) {
          return res.status(400).json({ message: 'Filename is required' });
      }

      try {
        // Generate a signed upload URL valid for 1 hour.
        // This allows the client to PUT the file directly to Supabase.
        const { data, error } = await supabaseAdmin.storage
          .from('archives')
          .createSignedUploadUrl(filename);

        if (error) throw error;

        // Return the signed URL and the token required for the upload headers
        return res.status(200).json({ 
            signedUrl: data.signedUrl, 
            token: data.token,
            path: data.path 
        });

      } catch (error: any) {
        console.error('Archive Upload Setup Error:', error);
        return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
      }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}
