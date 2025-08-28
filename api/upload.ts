// FIX: Add reference to node types to resolve Buffer and stream errors.
/// <reference types="node" />

import { supabaseAdmin } from '../lib/supabaseClient';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Helper function to read a readable stream into a buffer.
// This is necessary because Vercel provides the request body as a stream.
async function streamToBuffer(readableStream: NodeJS.ReadableStream): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on('data', (chunk) => {
      chunks.push(chunk as Buffer);
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
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const filename = req.query.filename as string;
  if (!filename) {
      return res.status(400).json({ message: '`filename` query parameter is required.' });
  }
  
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