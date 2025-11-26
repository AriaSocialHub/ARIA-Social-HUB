
import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

declare var Buffer: any;

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

export const config = {
  api: {
    bodyParser: false,
  },
};

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

  // Handle Upload (POST)
  if (req.method === 'POST') {
      const filename = req.query.filename as string;
      if (!filename) {
          return res.status(400).json({ message: 'Filename is required' });
      }

      try {
        const fileBuffer = await streamToBuffer(req);
        
        const { error } = await supabaseAdmin.storage
          .from('archives')
          .upload(filename, fileBuffer, {
            contentType: 'application/vnd.sqlite3',
            upsert: true,
          });

        if (error) throw error;

        return res.status(200).json({ message: 'File uploaded successfully' });
      } catch (error: any) {
        console.error('Archive Upload Error:', error);
        return res.status(500).json({ message: `Internal Server Error: ${error.message}` });
      }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ message: 'Method Not Allowed' });
}
