import { AppData } from '../types';

/**
 * Fetches the entire application database from the backend.
 */
async function fetchAllServicesData(): Promise<AppData> {
  const response = await fetch('/api/data');
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to fetch data:', errorText);
    throw new Error('Impossibile caricare i dati dal server.');
  }
  return response.json();
}

/**
 * Saves the entire application database to the backend.
 * @param dbState The complete state of the application data.
 */
async function saveData(dbState: AppData): Promise<AppData> {
  const response = await fetch('/api/data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dbState),
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Failed to save data:', errorText);
    throw new Error('Salvataggio dei dati fallito.');
  }
  return response.json();
}

/**
 * Uploads a file to the backend blob storage.
 * @param file The File or Blob object to upload.
 * @param filename The desired name for the file.
 * @returns The public URL of the uploaded file.
 */
async function uploadFile(file: File | Blob, filename: string): Promise<string> {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        body: file,
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload failed:', errorText);
        throw new Error("Caricamento del file fallito.");
    }
    const newBlob = await response.json();
    return newBlob.url;
}


const api = {
  fetchAllServicesData,
  saveData,
  uploadFile,
};

export default api;
