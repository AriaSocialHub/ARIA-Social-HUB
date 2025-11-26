
import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // DELETE method: Removes a file from storage
  if (req.method === 'DELETE') {
    const filename = req.query.filename as string;
    if (!filename) {
        return res.status(400).json({ message: '`filename` query parameter is required.' });
    }

    try {
        const { error } = await supabaseAdmin.storage
            .from('uploads')
            .remove([filename]);

        if (error) {
            console.error('Supabase Delete Error:', error);
            return res.status(500).json({ message: `Supabase error: ${error.message}` });
        }
        return res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
        console.error('Delete Handler Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during deletion';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
    }
  }

  // POST method: Generates a Signed Upload URL
  if (req.method === 'POST') {
      try {
        const { filename, contentType } = req.body;

        if (!filename) {
            return res.status(400).json({ message: 'filename is required in body' });
        }

        // 1. Create a Signed Upload URL. 
        // This allows the client to upload directly to Supabase via a PUT request.
        const { data, error } = await supabaseAdmin.storage
          .from('uploads')
          .createSignedUploadUrl(filename);

        if (error) {
          console.error('Supabase Signed URL Error:', error);
          return res.status(500).json({ message: `Supabase error: ${error.message}` });
        }

        // 2. Generate the Public URL where the file will be accessible after upload.
        const { data: publicUrlData } = supabaseAdmin.storage
          .from('uploads')
          .getPublicUrl(data.path);
        
        // 3. Return the signed URL (for uploading) and public URL (for storing in DB).
        return res.status(200).json({ 
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            publicUrl: publicUrlData.publicUrl
        });

      } catch (error) {
        console.error('Upload Setup Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
      }
  }
  
  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}
