
import { AppData, User, OnlineUser, UserProfile } from '../types';

/**
 * Fetches the entire application database from the backend.
 */
async function fetchAllData(): Promise<AppData> {
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
        headers: {
            'Content-Type': file.type
        },
        body: file,
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload failed:', errorText);
        throw new Error("Caricamento del file fallito.");
    }
    const result = await response.json();
    return result.url;
}

/**
 * Deletes a file from the backend blob storage.
 * @param filename The name of the file to delete (must match the filename used during upload).
 */
async function deleteFileBlob(filename: string): Promise<void> {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('File deletion failed:', errorText);
        // We log the error but don't throw, so the UI update can still proceed if the file was already gone
    }
}

// --- User Management ---
async function fetchAllUsers(): Promise<Record<string, User>> {
    const response = await fetch('/api/users');
    if (!response.ok) throw new Error("Failed to fetch users.");
    return response.json();
}

async function updateUser(user: User): Promise<Record<string, User>> {
    const response = await fetch('/api/users', {
        method: 'POST', // Using POST as an upsert
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error("Failed to update user.");
    return response.json();
}

async function deleteUser(username: string): Promise<Record<string, User>> {
    const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error("Failed to delete user.");
    return response.json();
}

const api = {
  fetchAllData,
  saveData,
  uploadFile,
  deleteFileBlob,
  fetchAllUsers,
  updateUser,
  deleteUser,
};

export default api;
