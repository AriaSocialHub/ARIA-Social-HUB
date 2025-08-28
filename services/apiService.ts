import { AppData, User, OnlineUser, UserProfile, NotificationItem } from '../types';

async function fetchAllData(): Promise<AppData> {
  const response = await fetch('/api/data');
  if (!response.ok) throw new Error('Impossibile caricare i dati dal server.');
  return response.json();
}

async function uploadFile(file: File | Blob, filename: string): Promise<string> {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!response.ok) throw new Error("Caricamento del file fallito.");
    const result = await response.json();
    return result.url;
}

// --- Granular API Calls ---

async function postToServiceApi(body: object): Promise<void> {
    const response = await fetch('/api/service-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Operazione sui dati fallita.');
    }
}

// --- User Management ---
async function updateUser(user: User): Promise<User> {
    const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
    });
    if (!response.ok) throw new Error("Failed to update user.");
    return response.json();
}

async function deleteUser(username: string): Promise<void> {
    const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error("Failed to delete user.");
}

const api = {
  fetchAllData,
  uploadFile,
  updateUser,
  deleteUser,

  // Simple data save (for flat data structures like campaigns, news)
  saveServiceData: (serviceId: string, newData: any) => postToServiceApi({
    action: 'saveSimpleData',
    payload: { serviceId, newData }
  }),
  
  // Category operations
  addCategory: (serviceId: string, categoryName: string, metadata: any) => postToServiceApi({
      action: 'addCategory',
      payload: { serviceId, categoryName, metaUpdate: metadata }
  }),
  renameCategory: (serviceId: string, oldName: string, newName: string) => postToServiceApi({
      action: 'renameCategory',
      payload: { serviceId, oldName, newName }
  }),
  deleteCategory: (serviceId: string, categoryName: string) => postToServiceApi({
      action: 'deleteCategory',
      payload: { serviceId, categoryName }
  }),
  deleteMultipleCategories: (serviceId: string, categoryNames: string[]) => postToServiceApi({
      action: 'deleteMultipleCategories',
      payload: { serviceId, categoryNames }
  }),
  updateCategoryMetadata: (serviceId: string, categoryName: string, metaUpdate: any) => postToServiceApi({
      action: 'updateCategoryMetadata',
      payload: { serviceId, categoryName, metaUpdate }
  }),
  
  // Item operations
  addItem: (serviceId: string, categoryName: string, item: any) => postToServiceApi({
      action: 'addItem',
      payload: { serviceId, categoryName, item }
  }),
  updateItem: (serviceId: string, categoryName: string, itemId: string, updatedItem: any) => postToServiceApi({
      action: 'updateItem',
      payload: { serviceId, categoryName, itemId, updatedItem }
  }),
  deleteItem: (serviceId: string, categoryName: string, itemId: string) => postToServiceApi({
      action: 'deleteItem',
      payload: { serviceId, categoryName, itemId }
  }),
  
  // Notification operations
  markNotificationRead: (notificationId: string, username: string) => postToServiceApi({
      action: 'markNotificationRead',
      payload: { notificationId, username }
  }),
  markAllNotificationsRead: (username: string) => postToServiceApi({
      action: 'markAllNotificationsRead',
      payload: { username }
  }),
};

export default api;
