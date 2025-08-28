import { AppData, User, StoredFile } from '../types';

async function apiRequest(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', endpoint: string, body?: any) {
    const options: RequestInit = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(endpoint, options);
    if (!response.ok) {
        const errorText = await response.text();
        console.error(`API request failed for ${method} ${endpoint}:`, errorText);
        throw new Error(`Request failed: ${errorText}`);
    }
    // Handle cases where there's no JSON body in the response (e.g., 204 No Content)
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    }
    return null; 
}


const api = {
    bootstrapApp: (): Promise<AppData> => {
        return apiRequest('GET', '/api/data?resource=bootstrap');
    },

    updateService: (serviceId: string, action: string, payload: any): Promise<any> => {
        return apiRequest('PATCH', `/api/data?serviceId=${serviceId}`, { action, payload });
    },
    
    uploadFile: async (file: File | Blob, filename: string): Promise<string> => {
        const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
            method: 'POST',
            headers: { 'Content-Type': file.type },
            body: file,
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`File upload failed: ${errorText}`);
        }
        const result = await response.json();
        return result.url;
    },

    // User Management
    fetchAllUsers: (): Promise<Record<string, User>> => {
        return apiRequest('GET', '/api/users');
    },
    updateUser: (user: User): Promise<User> => {
        return apiRequest('POST', '/api/users', user);
    },
    deleteUser: (username: string): Promise<any> => {
        return apiRequest('DELETE', `/api/users?username=${encodeURIComponent(username)}`);
    },

    // Notifications
    markNotificationRead: (id: string, username: string): Promise<any> => {
        return apiRequest('PATCH', '/api/data?resource=notifications', { action: 'mark_read', id, username });
    },
    markAllNotificationsRead: (username: string): Promise<any> => {
        return apiRequest('PATCH', '/api/data?resource=notifications', { action: 'mark_all_read', username });
    }
};

export default api;
