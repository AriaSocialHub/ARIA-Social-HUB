import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { AppData, NotificationItem, StoredFile, User } from '../types';
import api from '../services/apiService';
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
    updateUser: (user: User) => Promise<User>;
    deleteUser: (username: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const NOTIFICATION_EXCLUSIONS = new Set([
    'commentAnalysis',
    'shifts-primo-livello',
    'shifts-secondo-livello',
    'manualTickets',
    'teamBreaks-primo-livello',
]);

const PALETTE = ['#4299E1', '#48BB78', '#ECC94B', '#9F7AEA', '#ED64A6', '#667EEA'];
let colorIndex = 0;

const getNextColor = () => {
    const color = PALETTE[colorIndex];
    colorIndex = (colorIndex + 1) % PALETTE.length;
    return color;
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appData, setAppData] = useState<AppData>({ services_data: {}, notifications: [], users: {} });
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const data = await api.fetchAllData();
            setAppData(data);
        } catch (err) {
            console.error("Failed to load initial data", err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const addNotification = useCallback((
        author: string, serviceId: string, action: 'add' | 'update' | 'delete', title: string,
        categoryName?: string, itemId?: string
    ) => {
        if (NOTIFICATION_EXCLUSIONS.has(serviceId) || !author) return;

        const serviceName = serviceMap[serviceId]?.name || serviceId;
        let actionText = '';
        switch(action) {
            case 'add': actionText = 'aggiunto'; break;
            case 'update': actionText = 'aggiornato'; break;
            case 'delete': actionText = 'rimosso'; break;
        }
        const message = `${author} ha ${actionText} "${title}" nella sezione ${serviceName}${categoryName ? ` > ${categoryName}`: ''}.`;
        
        const newNotification: NotificationItem = {
            message, timestamp: new Date().toISOString(), serviceId, categoryName, itemId,
            readBy: [author], author, id: `notif-${Date.now()}-${Math.random()}`,
        };
        
        setAppData(currentData => {
            const newNotifications = [newNotification, ...currentData.notifications].slice(0, 100);
            return { ...currentData, notifications: newNotifications };
        });
    }, []);

    const performGranularUpdate = async (updateLogic: (currentData: AppData) => AppData, apiCall: () => Promise<any>) => {
        const originalData = appData;
        setAppData(updateLogic(createDeepCopy(originalData))); // Optimistic update
        try {
            const result = await apiCall();
            return result;
        } catch (error) {
            console.error("Failed to save data, rolling back:", error);
            setAppData(originalData); // Rollback
            throw error;
        }
    };
    
    // --- USER MANAGEMENT ---
    const updateUser = useCallback(async (user: User): Promise<User> => {
        return await performGranularUpdate(
            d => {
                d.users[user.name.toLowerCase()] = user;
                return d;
            },
            () => api.updateUser(user)
        );
    }, [appData]);

    const deleteUser = useCallback(async (username: string) => {
        await performGranularUpdate(
            d => {
                delete d.users[username.toLowerCase()];
                return d;
            },
            () => api.deleteUser(username)
        );
    }, [appData]);

    // --- GENERIC SERVICE DATA (for apps without complex structures) ---
    const saveServiceData = useCallback(async (serviceId: string, newData: any, author: string, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => {
        await performGranularUpdate(
            d => {
                if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: null, fileName: null, metadata: {} };
                d.services_data[serviceId].data = newData;
                return d;
            },
            () => api.saveServiceData(serviceId, newData)
        );
        if (action && title) addNotification(author, serviceId, action, title, undefined, itemId);
    }, [appData, addNotification]);

    // --- CATEGORY MANAGEMENT ---
    const onAddCategory = useCallback(async (serviceId: string, categoryName: string, author: string, type: 'text' | 'file' = 'text') => {
        const newCategoryMeta = { icon: 'Folder', color: getNextColor(), type, createdAt: new Date().toISOString() };
        await performGranularUpdate(
            d => {
                if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: {}, metadata: {}, fileName: 'Dati inseriti manualmente' };
                if(!d.services_data[serviceId].data) d.services_data[serviceId].data = {};
                d.services_data[serviceId].data[categoryName] = [];
                if(!d.services_data[serviceId].metadata) d.services_data[serviceId].metadata = {};
                d.services_data[serviceId].metadata![categoryName] = newCategoryMeta;
                return d;
            },
            () => api.addCategory(serviceId, categoryName, newCategoryMeta)
        );
        addNotification(author, serviceId, 'add', `sezione: ${categoryName}`);
    }, [appData, addNotification]);

    const onRenameCategory = useCallback(async (serviceId: string, oldName: string, newName: string, author: string) => {
        await performGranularUpdate(
            d => {
                const service = d.services_data[serviceId];
                if (service?.data?.[oldName] !== undefined) {
                    service.data[newName] = service.data[oldName];
                    delete service.data[oldName];
                    if (service.metadata?.[oldName]) {
                        service.metadata[newName] = service.metadata[oldName];
                        delete service.metadata[oldName];
                    }
                }
                return d;
            },
            () => api.renameCategory(serviceId, oldName, newName)
        );
        addNotification(author, serviceId, 'update', `sezione: ${oldName} in ${newName}`);
    }, [appData, addNotification]);

    const onDeleteCategory = useCallback(async (serviceId: string, categoryName: string, author: string) => {
        await performGranularUpdate(
            d => {
                const service = d.services_data[serviceId];
                if (service?.data) delete service.data[categoryName];
                if (service?.metadata) delete service.metadata[categoryName];
                return d;
            },
            () => api.deleteCategory(serviceId, categoryName)
        );
        addNotification(author, serviceId, 'delete', `sezione: ${categoryName}`);
    }, [appData, addNotification]);
    
    const onDeleteMultipleCategories = useCallback(async (serviceId: string, categoryNames: string[], author: string) => {
         await performGranularUpdate(
            d => {
                const service = d.services_data[serviceId];
                if (service?.data) categoryNames.forEach(name => {
                    delete service.data[name];
                    if (service.metadata) delete service.metadata[name];
                });
                return d;
            },
            () => api.deleteMultipleCategories(serviceId, categoryNames)
        );
        addNotification(author, serviceId, 'delete', `${categoryNames.length} sezioni`);
    }, [appData, addNotification]);

    const onUpdateCategoryMetadata = useCallback(async (serviceId: string, categoryName: string, metaUpdate: Partial<{ icon: string; color: string; }>) => {
        await performGranularUpdate(
            d => {
                const meta = d.services_data[serviceId]?.metadata?.[categoryName];
                if (meta) d.services_data[serviceId].metadata![categoryName] = { ...meta, ...metaUpdate };
                return d;
            },
            () => api.updateCategoryMetadata(serviceId, categoryName, metaUpdate)
        );
    }, [appData]);
    
    // --- ITEM MANAGEMENT ---
    const onAddItem = useCallback(async (serviceId: string, categoryName: string, item: any, author: string) => {
        await performGranularUpdate(
            d => {
                d.services_data[serviceId].data[categoryName].unshift(item);
                return d;
            },
            () => api.addItem(serviceId, categoryName, item)
        );
        addNotification(author, serviceId, 'add', item.casistica || item.richiesta || item.title || 'Nuovo elemento', categoryName, item.id);
    }, [appData, addNotification]);

    const onUpdateItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, updatedItem: any, author: string) => {
        let title = 'Elemento';
        await performGranularUpdate(
            d => {
                const items = d.services_data[serviceId].data[categoryName];
                const index = items.findIndex((i: any) => i.id === itemId);
                if (index > -1) {
                    items[index] = { ...items[index], ...updatedItem };
                    const updatedFullItem = items[index];
                    title = updatedFullItem.casistica || updatedFullItem.richiesta || updatedFullItem.title || 'Elemento';
                }
                return d;
            },
            () => api.updateItem(serviceId, categoryName, itemId, updatedItem)
        );
        addNotification(author, serviceId, 'update', title, categoryName, itemId);
    }, [appData, addNotification]);

    const onDeleteItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, author: string) => {
        let deletedItemTitle = 'Elemento';
        await performGranularUpdate(
            d => {
                const items = d.services_data[serviceId].data[categoryName];
                const itemToDelete = items.find((i: any) => i.id === itemId);
                if (itemToDelete) deletedItemTitle = itemToDelete.casistica || itemToDelete.richiesta || itemToDelete.title || 'Elemento';
                d.services_data[serviceId].data[categoryName] = items.filter((i: any) => i.id !== itemId);
                return d;
            },
            () => api.deleteItem(serviceId, categoryName, itemId)
        );
        addNotification(author, serviceId, 'delete', deletedItemTitle, categoryName, itemId);
    }, [appData, addNotification]);

    // --- NOTIFICATIONS ---
    const markNotificationRead = useCallback(async (notificationId: string, username: string) => {
        await performGranularUpdate(
            d => {
                const notification = d.notifications.find(n => n.id === notificationId);
                if (notification && !notification.readBy.includes(username)) {
                    notification.readBy.push(username);
                }
                return d;
            },
            () => api.markNotificationRead(notificationId, username)
        );
    }, [appData]);

    const markAllNotificationsRead = useCallback(async (username: string) => {
        await performGranularUpdate(
            d => {
                d.notifications.forEach(n => {
                    if (!n.readBy.includes(username)) n.readBy.push(username);
                });
                return d;
            },
            () => api.markAllNotificationsRead(username)
        );
    }, [appData]);

    // --- FILE MANAGEMENT ---
    const onAddFile = async (serviceId: string, categoryName: string, fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File, author: string) => {
        // This is a complex operation: upload file, then add metadata.
        // It's not a simple optimistic update.
        try {
            const url = await api.uploadFile(file, file.name);
            const newFile: StoredFile = {
                ...fileData,
                id: `file-${Date.now()}`,
                author,
                createdAt: new Date().toISOString(),
                url,
            };
            await performGranularUpdate(
                d => {
                     if (Array.isArray(d.services_data[serviceId].data)) {
                        d.services_data[serviceId].data.unshift(newFile);
                    }
                    return d;
                },
                () => api.addItem(serviceId, categoryName, newFile) 
            );
            addNotification(author, serviceId, 'add', newFile.name, categoryName, newFile.id);
        } catch(error) {
             console.error("Failed to add file:", error);
             alert("Caricamento file fallito.");
             // No rollback needed as API call failed before state change
        }
    };
    
    const onDeleteFile = async (serviceId: string, categoryName: string, fileId: string, author: string) => {
        let deletedFileName = 'File';
        await performGranularUpdate(
            d => {
                const service = d.services_data[serviceId];
                if (Array.isArray(service.data)) {
                    const fileToDelete = service.data.find((f: StoredFile) => f.id === fileId);
                    if (fileToDelete) deletedFileName = fileToDelete.name;
                    service.data = service.data.filter((f: StoredFile) => f.id !== fileId);
                }
                return d;
            },
            () => api.deleteItem(serviceId, categoryName, fileId)
        );
        addNotification(author, serviceId, 'delete', deletedFileName, categoryName, fileId);
    };

    const uploadAndReplaceData = async (serviceId: string, parsedData: Record<string, any[]>, fileName: string, author: string) => {
        // This function is complex and doesn't fit the granular model.
        // It should be refactored into a specific API endpoint that handles bulk replacement.
        // For now, it will be a no-op to avoid breaking the UI.
        console.warn("uploadAndReplaceData is deprecated and should not be used in the new architecture.");
    };

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

    if (isLoading) {
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
