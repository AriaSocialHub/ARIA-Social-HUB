import { put } from '@vercel/blob';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }
  
  const filename = req.query.filename as string;
  if (!filename) {
      return res.status(400).json({ message: '`filename` query parameter is required.' });
  }

  // The Vercel runtime streams the body directly to the `put` function.
  if (!req.body) {
    return res.status(400).json({ message: 'No file body found' });
  }

  try {
    const blob = await put(filename, req.body, { 
      access: 'public',
      addRandomSuffix: true // Prevents overwriting files with the same name
    });
    
    return res.status(200).json(blob);
  } catch (error) {
    console.error('Upload Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred during upload';
    return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
  }
}
