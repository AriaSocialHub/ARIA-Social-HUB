
import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

declare var Buffer: any;

// Helper function to read a readable stream into a buffer.
// This is necessary because Vercel provides the request body as a stream.
async function streamToBuffer(readableStream: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: any[] = [];
    readableStream.on('data', (chunk: any) => {
      chunks.push(chunk);
    });
    readableStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    readableStream.on('error', reject);
  });
}

// Vercel's config to disable the default body parser and allow stream handling.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const filename = req.query.filename as string;
  if (!filename) {
      return res.status(400).json({ message: '`filename` query parameter is required.' });
  }

  if (req.method === 'DELETE') {
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

  if (req.method === 'POST') {
      const contentType = req.headers['content-type'] || 'application/octet-stream';

      try {
        // 1. Convert the request stream to a Buffer to get the raw file data.
        const fileBuffer = await streamToBuffer(req);

        // 2. Upload the buffered file data to Supabase Storage.
        // Using `upsert: true` to prevent errors if a file with the same name is uploaded again.
        const { data, error } = await supabaseAdmin.storage
          .from('uploads')
          .upload(filename, fileBuffer, {
            contentType,
            upsert: true,
          });

        if (error) {
          console.error('Supabase Upload Error:', error);
          // Provide a more specific error message from Supabase if available.
          return res.status(500).json({ message: `Supabase error: ${error.message}` });
        }

        // 3. Get the public URL for the successfully uploaded file.
        const { data: { publicUrl } } = supabaseAdmin.storage
          .from('uploads')
          .getPublicUrl(data.path);
        
        // 4. Return the URL to the frontend.
        return res.status(200).json({ url: publicUrl });
      } catch (error) {
        console.error('Upload Handler Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
      }
  }
  
  res.setHeader('Allow', ['POST', 'DELETE']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}
