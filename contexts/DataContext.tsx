

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AppData, NotificationItem, StoredFile, User } from '../types';
import { serviceMap } from '../services/registry';

const createDeepCopy = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

interface DataContextType {
    appData: AppData;
    servicesData: AppData['services_data'];
    notifications: AppData['notifications'];
    isLoading: boolean;
    uploadAndReplaceData: (serviceId: string, parsedData: Record<string, any[]>, fileName: string, author: string) => Promise<void>;
    saveServiceData: (serviceId: string, newData: any, author: string, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => Promise<void>;
    onAddCategory: (serviceId: string, categoryName: string, author: string, type?: 'text' | 'file') => Promise<void>;
    onDeleteCategory: (serviceId: string, categoryName: string, author: string) => Promise<void>;
    onDeleteMultipleCategories: (serviceId: string, categoryNames: string[], author: string) => Promise<void>;
    onRenameCategory: (serviceId: string, oldName: string, newName: string, author: string) => Promise<void>;
    onUpdateCategoryMetadata: (serviceId: string, categoryName: string, metaUpdate: Partial<{ icon: string; color: string; }>) => Promise<void>;
    onAddItem: (serviceId: string, categoryName: string, item: any, author: string) => Promise<void>;
    onUpdateItem: (serviceId: string, categoryName: string, itemId: string, updatedItem: any, author: string) => Promise<void>;
    onDeleteItem: (serviceId: string, categoryName: string, itemId: string, author: string) => Promise<void>;
    onAddFile: (serviceId: string, categoryName: string, fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File, author: string) => Promise<void>;
    onDeleteFile: (serviceId: string, categoryName: string, fileId: string, author: string) => Promise<void>;
    markNotificationRead: (notificationId: string, username: string) => Promise<void>;
    markAllNotificationsRead: (username: string) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (username: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to upload a file to the backend blob storage.
async function uploadFile(file: File | Blob, filename: string): Promise<string> {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
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

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData>({ services_data: {}, notifications: [], users: {} });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/data').then(res => res.json()).then(data => {
            setAppData(data);
        }).catch(err => {
            console.error("Failed to load initial data", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const performOptimisticUpdate = useCallback(async (
        updateLogic: (currentData: AppData) => AppData,
        apiCall: () => Promise<Response>
    ) => {
        const originalData = appData;
        const newData = updateLogic(createDeepCopy(originalData));
        setAppData(newData); // Optimistic update

        try {
            const response = await apiCall();
            if (!response.ok) {
                throw new Error(`API call failed: ${response.statusText}`);
            }
            const updatedData = await response.json();
            
            // The API response contains the updated slice of data.
            // We need to merge it back into our main state.
            setAppData(prev => ({
                ...prev,
                ...updatedData, // This assumes the API returns an object with keys like 'services_data', 'notifications', 'users' to be merged.
            }));

        } catch (error) {
            console.error("Failed to save data, rolling back:", error);
            setAppData(originalData); // Rollback on error
            throw error; // Re-throw to inform caller
        }
    }, [appData]);
    
    // Generic handler for service data updates
    const updateServiceData = useCallback(async (serviceId: string, action: string, payload: any, author: string) => {
        const originalData = appData;
        const draft = createDeepCopy(originalData);

        // --- Start Optimistic Update Logic ---
        // This logic mirrors the backend logic for a responsive UI.
        const serviceData = draft.services_data[serviceId];
        const title = payload.title || payload.item?.casistica || payload.item?.richiesta || `elemento`;
        const serviceName = serviceMap[serviceId]?.name || serviceId;
        
        // A simplified version of notification creation for optimistic update
        const createNotification = (act: 'add'|'update'|'delete', msgTitle: string, catName?: string, iId?: string) => {
             let actionText = '';
             switch(act) { case 'add': actionText = 'aggiunto'; break; case 'update': actionText = 'aggiornato'; break; case 'delete': actionText = 'rimosso'; break; }
             const message = `${author} ha ${actionText} "${msgTitle}" nella sezione ${serviceName}${catName ? ` > ${catName}`: ''}.`;
             const newNotification: NotificationItem = {
                message, timestamp: new Date().toISOString(), serviceId, categoryName: catName, itemId: iId, readBy: [author], author, id: `notif-optimistic-${Date.now()}`,
            };
            draft.notifications.unshift(newNotification);
            if (draft.notifications.length > 100) draft.notifications.pop();
        };

        switch (action) {
            case 'uploadAndReplaceData':
                draft.services_data[serviceId] = { data: payload.parsedData, fileName: `Dati caricati da: ${payload.fileName}`, metadata: serviceData?.metadata || {} };
                createNotification('update', `dati da ${payload.fileName}`);
                break;
            case 'saveServiceData':
                draft.services_data[serviceId] = { ...serviceData, data: payload.newData, fileName: serviceData?.fileName || 'Dati inseriti manualmente' };
                if (payload.action && payload.title) createNotification(payload.action, payload.title, undefined, payload.itemId);
                break;
            case 'addCategory':
                if (!serviceData) draft.services_data[serviceId] = { data: {}, metadata: {}, fileName: 'Dati inseriti manualmente' };
                draft.services_data[serviceId].data[payload.categoryName] = [];
                if(!draft.services_data[serviceId].metadata) draft.services_data[serviceId].metadata = {};
                draft.services_data[serviceId].metadata![payload.categoryName] = { icon: 'Folder', color: '#4299E1', type: payload.type, createdAt: new Date().toISOString() };
                createNotification('add', `sezione: ${payload.categoryName}`);
                break;
            case 'deleteCategory':
                if(serviceData?.data) delete serviceData.data[payload.categoryName];
                if(serviceData?.metadata) delete serviceData.metadata[payload.categoryName];
                createNotification('delete', `sezione: ${payload.categoryName}`);
                break;
            // ... other optimistic updates would go here for addItem, updateItem, etc.
        }
        setAppData(draft);
        // --- End Optimistic Update Logic ---
        
        try {
            const response = await fetch('/api/servicedata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ serviceId, action, payload, author }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const { updatedServiceData, updatedNotifications } = await response.json();
            setAppData(prev => ({
                ...prev,
                services_data: { ...prev.services_data, [serviceId]: updatedServiceData },
                notifications: updatedNotifications,
            }));
        } catch (error) {
             console.error(`Failed to ${action} for ${serviceId}, rolling back:`, error);
             setAppData(originalData);
             throw error;
        }

    }, [appData]);
    
    const uploadAndReplaceData = useCallback((serviceId, parsedData, fileName, author) => updateServiceData(serviceId, 'uploadAndReplaceData', { parsedData, fileName }, author), [updateServiceData]);
    const saveServiceData = useCallback((serviceId, newData, author, action, title, itemId) => updateServiceData(serviceId, 'saveServiceData', { newData, action, title, itemId }, author), [updateServiceData]);
    const onAddCategory = useCallback((serviceId, categoryName, author, type) => updateServiceData(serviceId, 'addCategory', { categoryName, type }, author), [updateServiceData]);
    const onDeleteCategory = useCallback((serviceId, categoryName, author) => updateServiceData(serviceId, 'deleteCategory', { categoryName }, author), [updateServiceData]);
    const onDeleteMultipleCategories = useCallback((serviceId, categoryNames, author) => updateServiceData(serviceId, 'deleteMultipleCategories', { categoryNames }, author), [updateServiceData]);
    const onRenameCategory = useCallback((serviceId, oldName, newName, author) => updateServiceData(serviceId, 'renameCategory', { oldName, newName }, author), [updateServiceData]);
    const onUpdateCategoryMetadata = useCallback((serviceId, categoryName, metaUpdate) => updateServiceData(serviceId, 'updateCategoryMetadata', { categoryName, metaUpdate }, 'system'), [updateServiceData]);
    const onAddItem = useCallback((serviceId, categoryName, item, author) => updateServiceData(serviceId, 'addItem', { categoryName, item }, author), [updateServiceData]);
    const onUpdateItem = useCallback((serviceId, categoryName, itemId, updatedItem, author) => updateServiceData(serviceId, 'updateItem', { categoryName, itemId, updatedItem }, author), [updateServiceData]);
    const onDeleteItem = useCallback((serviceId, categoryName, itemId, author) => updateServiceData(serviceId, 'deleteItem', { categoryName, itemId }, author), [updateServiceData]);
    const onDeleteFile = useCallback((serviceId, categoryName, fileId, author) => updateServiceData(serviceId, 'deleteFile', { categoryName, fileId }, author), [updateServiceData]);
    
    const onAddFile = useCallback(async (serviceId: string, categoryName: string, fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File, author: string) => {
        const url = await uploadFile(file, file.name);
        const newFile: Omit<StoredFile, 'id'> = {
            ...fileData,
            author,
            createdAt: new Date().toISOString(),
            url,
        };
        await updateServiceData(serviceId, 'addFile', { categoryName, file: newFile }, author);
    }, [updateServiceData]);
    
    const updateNotifications = async (action: string, payload: any) => {
        const originalData = appData;
        // No optimistic update for simple read marking, just call API
        try {
             const response = await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, payload }),
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            const updatedNotifications = await response.json();
            setAppData(prev => ({ ...prev, notifications: updatedNotifications }));
        } catch(error) {
             console.error(`Failed to ${action} for notifications, rolling back:`, error);
             setAppData(originalData); // Rollback on error
             throw error;
        }
    };

    const markNotificationRead = useCallback((notificationId: string, username: string) => updateNotifications('markRead', { notificationId, username }), []);
    const markAllNotificationsRead = useCallback((username: string) => updateNotifications('markAllRead', { username }), []);

    const updateUser = useCallback(async (user: User) => {
        const originalUsers = appData.users;
        const userKey = user.name.toLowerCase();
        setAppData(prev => ({ ...prev, users: { ...prev.users, [userKey]: { ...prev.users[userKey], ...user } } }));
        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });
            if (!response.ok) throw new Error('Failed to update user');
            const updatedUsers = await response.json();
            setAppData(prev => ({ ...prev, users: updatedUsers }));
        } catch (error) {
            console.error('Failed to update user, rolling back', error);
            setAppData(prev => ({ ...prev, users: originalUsers }));
            throw error;
        }
    }, [appData.users]);
    
    const deleteUser = useCallback(async (username: string) => {
        const originalUsers = appData.users;
        const userKey = username.toLowerCase();
        const newUsers = { ...originalUsers };
        delete newUsers[userKey];
        setAppData(prev => ({ ...prev, users: newUsers }));

        try {
            const response = await fetch(`/api/users?username=${encodeURIComponent(username)}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Failed to delete user');
            const updatedUsers = await response.json();
             setAppData(prev => ({ ...prev, users: updatedUsers }));
        } catch (error) {
            console.error('Failed to delete user, rolling back', error);
            setAppData(prev => ({ ...prev, users: originalUsers }));
            throw error;
        }
    }, [appData.users]);


    const value: DataContextType = {
        appData,
        servicesData: appData.services_data,
        notifications: appData.notifications,
        isLoading,
        uploadAndReplaceData,
        saveServiceData,
        onAddCategory,
        onDeleteCategory,
        onDeleteMultipleCategories,
        onRenameCategory,
        onUpdateCategoryMetadata,
        onAddItem,
        onUpdateItem,
        onDeleteItem,
        onAddFile,
        onDeleteFile,
        markNotificationRead,
        markAllNotificationsRead,
        updateUser,
        deleteUser,
    };

    if (isLoading && !Object.keys(appData.users).length) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-xl font-semibold text-gray-700">Caricamento Portale...</div>
            </div>
        );
    }

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};