import { AppData, User, OnlineUser, UserProfile } from '../types';

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

// --- User Management ---
async function fetchAllUsers(): Promise<Record<string, User>> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error("Failed to fetch users.");
    return response.json();
}

async function addUser(user: User): Promise<Record<string, User>> {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error("Failed to add user.");
    return response.json();
}

// --- Presence Management ---
async function updatePresence(profile: UserProfile, accessLevel: 'admin' | 'view', sessionId: string): Promise<OnlineUser[]> {
    const response = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, accessLevel, sessionId }),
    });
    if (!response.ok) {
        console.error("Failed to update presence");
        return [];
    }
    return response.json();
}


const api = {
  fetchAllServicesData,
  saveData,
  uploadFile,
  fetchAllUsers,
  addUser,
  updatePresence
};

export default api;