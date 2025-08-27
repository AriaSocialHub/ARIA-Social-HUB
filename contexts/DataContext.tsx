

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
    updateUser: (user: User) => Promise<void>;
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

    useEffect(() => {
        api.fetchAllData().then(data => {
            setAppData(data);
        }).catch(err => {
            console.error("Failed to load initial data", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const performOptimisticUpdate = useCallback(async (updateFunction: (currentData: AppData) => AppData) => {
        const originalData = appData;
        const newData = updateFunction(createDeepCopy(originalData));
        setAppData(newData); // Optimistic update
        try {
            const savedData = await api.saveData(newData);
            setAppData(savedData); // Sync with server state
        } catch (error) {
            console.error("Failed to save data, rolling back:", error);
            setAppData(originalData); // Rollback on error
            throw error; // Re-throw to inform caller
        }
    }, [appData]);

    const addNotification = useCallback((
        currentData: AppData,
        author: string,
        serviceId: string,
        action: 'add' | 'update' | 'delete',
        title: string,
        categoryName?: string,
        itemId?: string
    ) => {
        if (NOTIFICATION_EXCLUSIONS.has(serviceId)) return currentData;
        
        const serviceName = serviceMap[serviceId]?.name || serviceId;
        let actionText = '';
        switch(action) {
            case 'add': actionText = 'aggiunto'; break;
            case 'update': actionText = 'aggiornato'; break;
            case 'delete': actionText = 'rimosso'; break;
        }
        const message = `${author} ha ${actionText} "${title}" nella sezione ${serviceName}${categoryName ? ` > ${categoryName}`: ''}.`;
        
        const newNotification: NotificationItem = {
            message,
            timestamp: new Date().toISOString(),
            serviceId,
            categoryName,
            itemId,
            readBy: [author],
            author,
            id: `notif-${Date.now()}-${Math.random()}`,
        };
        currentData.notifications.unshift(newNotification);
        if (currentData.notifications.length > 100) {
            currentData.notifications = currentData.notifications.slice(0, 100);
        }
        return currentData;
    }, []);

    const uploadAndReplaceData = useCallback(async (serviceId: string, parsedData: Record<string, any[]>, fileName: string, author: string) => {
        await performOptimisticUpdate(currentData => {
            const oldMetadata = currentData.services_data[serviceId]?.metadata || {};
            const newMetadata: Record<string, { icon: string; color: string; type?: 'text' | 'file'; createdAt?: string; }> = {};
            
            for (const categoryName in parsedData) {
                if (oldMetadata[categoryName]) {
                    newMetadata[categoryName] = oldMetadata[categoryName];
                } else {
                    newMetadata[categoryName] = { icon: 'Folder', color: getNextColor(), type: 'text', createdAt: new Date().toISOString() };
                }
            }
            
            currentData.services_data[serviceId] = {
                data: parsedData,
                metadata: newMetadata,
                fileName: `Dati caricati da: ${fileName}`,
            };
            
            return addNotification(currentData, author, serviceId, 'update', `dati da ${fileName}`);
        });
    }, [performOptimisticUpdate, addNotification]);

    const saveServiceData = useCallback(async (serviceId: string, newData: any, author: string, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => {
        await performOptimisticUpdate(currentData => {
            const currentServiceState = currentData.services_data[serviceId] || { data: null, fileName: null };
            
            if (serviceId === 'repository') {
                currentData.services_data[serviceId] = {
                    ...currentServiceState,
                    data: newData,
                    fileName: currentServiceState.fileName || 'Dati inseriti manualmente'
                };
            } else {
                 currentData.services_data[serviceId] = {
                    ...currentServiceState,
                    data: newData,
                    fileName: currentServiceState.fileName || (newData && Object.keys(newData).length > 0 ? 'Dati inseriti manualmente' : null),
                };
            }

            if(action && title) {
                return addNotification(currentData, author, serviceId, action, title, undefined, itemId);
            }
            return currentData;
        });
    }, [performOptimisticUpdate, addNotification]);

    const onAddCategory = useCallback(async (serviceId: string, categoryName: string, author: string, type: 'text' | 'file' = 'text') => {
        if (appData.services_data[serviceId]?.data?.[categoryName] !== undefined) {
            alert("Una sezione con questo nome esiste già.");
            return;
        }
        await performOptimisticUpdate(d => {
            if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: {}, metadata: {}, fileName: 'Dati inseriti manualmente' };
            if (!d.services_data[serviceId].data) d.services_data[serviceId].data = {};
            if (!d.services_data[serviceId].metadata) d.services_data[serviceId].metadata = {};

            d.services_data[serviceId].data[categoryName] = [];
            d.services_data[serviceId].metadata![categoryName] = { icon: 'Folder', color: getNextColor(), type: type, createdAt: new Date().toISOString() };
            return addNotification(d, author, serviceId, 'add', `sezione: ${categoryName}`);
        });
    }, [appData, performOptimisticUpdate, addNotification]);

    const onDeleteCategory = useCallback(async (serviceId: string, categoryName: string, author: string) => {
        await performOptimisticUpdate(d => {
            if (d.services_data[serviceId]?.data) delete d.services_data[serviceId].data[categoryName];
            if (d.services_data[serviceId]?.metadata) delete d.services_data[serviceId].metadata![categoryName];
            return addNotification(d, author, serviceId, 'delete', `sezione: ${categoryName}`);
        });
    }, [performOptimisticUpdate, addNotification]);

    const onDeleteMultipleCategories = useCallback(async (serviceId: string, categoryNames: string[], author: string) => {
        await performOptimisticUpdate(d => {
            const service = d.services_data[serviceId];
            if (service?.data) {
                categoryNames.forEach(name => {
                    delete service.data[name];
                    if (service.metadata) delete service.metadata[name];
                });
            }
            const title = `${categoryNames.length} sezion${categoryNames.length > 1 ? 'i' : 'e'}`;
            return addNotification(d, author, serviceId, 'delete', title);
        });
    }, [performOptimisticUpdate, addNotification]);

    const onRenameCategory = useCallback(async (serviceId: string, oldName: string, newName: string, author: string) => {
        if (appData.services_data[serviceId]?.data?.[newName] !== undefined && oldName !== newName) {
            alert("Nuovo nome non valido o già in uso."); return;
        }
        await performOptimisticUpdate(d => {
            const service = d.services_data[serviceId];
            if (service?.data?.[oldName] !== undefined) {
                service.data[newName] = service.data[oldName];
                delete service.data[oldName];
                if (service.metadata?.[oldName]) {
                    service.metadata[newName] = service.metadata[oldName];
                    delete service.metadata[oldName];
                }
            }
            return addNotification(d, author, serviceId, 'update', `sezione: ${oldName} in ${newName}`);
        });
    }, [appData, performOptimisticUpdate, addNotification]);

    const onUpdateCategoryMetadata = useCallback(async (serviceId: string, categoryName: string, metaUpdate: Partial<{ icon: string; color: string; }>) => {
        await performOptimisticUpdate(d => {
            const meta = d.services_data[serviceId]?.metadata?.[categoryName];
            if (meta) d.services_data[serviceId].metadata![categoryName] = { ...meta, ...metaUpdate };
            return d;
        });
    }, [performOptimisticUpdate]);

    const onAddItem = useCallback(async (serviceId: string, categoryName: string, item: any, author: string) => {
        await performOptimisticUpdate(d => {
            const items = d.services_data[serviceId]?.data?.[categoryName];
            if (Array.isArray(items)) items.unshift(item);
            return addNotification(d, author, serviceId, 'add', item.casistica || item.richiesta || 'Nuovo elemento', categoryName, item.id);
        });
    }, [performOptimisticUpdate, addNotification]);

    const onUpdateItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, updatedItem: any, author: string) => {
        await performOptimisticUpdate(d => {
            const items = d.services_data[serviceId]?.data?.[categoryName];
            const itemIndex = Array.isArray(items) ? items.findIndex((i: any) => i.id === itemId) : -1;
            if (items && itemIndex > -1) {
                items[itemIndex] = { ...items[itemIndex], ...updatedItem };
                const title = items[itemIndex].casistica || items[itemIndex].richiesta || items[itemIndex].title || 'Elemento';
                return addNotification(d, author, serviceId, 'update', title, categoryName, itemId);
            }
            return d;
        });
    }, [performOptimisticUpdate, addNotification]);

    const onDeleteItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, author: string) => {
        await performOptimisticUpdate(d => {
            const items = d.services_data[serviceId]?.data?.[categoryName];
            const itemToDelete = Array.isArray(items) ? items.find((i: any) => i.id === itemId) : undefined;
            if (items && itemToDelete) {
                d.services_data[serviceId].data[categoryName] = items.filter((i: any) => i.id !== itemId);
                const title = itemToDelete.casistica || itemToDelete.richiesta || itemToDelete.title || 'Elemento';
                return addNotification(d, author, serviceId, 'delete', title, categoryName, itemId);
            }
            return d;
        });
    }, [performOptimisticUpdate, addNotification]);

    const onAddFile = useCallback(async (serviceId: string, categoryName: string, fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File, author: string) => {
        const url = await api.uploadFile(file, file.name);
        await performOptimisticUpdate(d => {
            if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: [], fileName: 'Dati inseriti manualmente' };

            const newFile: StoredFile = {
                ...fileData,
                id: `repo-file-${Date.now()}`,
                author: author || 'Sconosciuto',
                createdAt: new Date().toISOString(),
                url: url,
            };

            if (serviceId === 'repository') {
                if (!Array.isArray(d.services_data[serviceId].data)) {
                    d.services_data[serviceId].data = [];
                }
                d.services_data[serviceId].data.unshift(newFile);
            } else {
                 // Handle categorized file services if needed in the future
            }
            
            return addNotification(d, author, serviceId, 'add', `file "${newFile.name}"`, categoryName, newFile.id);
        });
    }, [performOptimisticUpdate, addNotification]);

    const onDeleteFile = useCallback(async (serviceId: string, categoryName: string, fileId: string, author: string) => {
        await performOptimisticUpdate(d => {
            const serviceData = d.services_data[serviceId];
            if (!serviceData?.data) return d;
            
            let fileToDelete: StoredFile | undefined;
            if (serviceId === 'repository' && Array.isArray(serviceData.data)) {
                 fileToDelete = serviceData.data.find((f: StoredFile) => f.id === fileId);
                 if (fileToDelete) serviceData.data = serviceData.data.filter((f: StoredFile) => f.id !== fileId);
            }
            
            if (fileToDelete) {
                return addNotification(d, author, serviceId, 'delete', `file "${fileToDelete.name}"`, categoryName, fileId);
            }
            return d;
        });
    }, [performOptimisticUpdate, addNotification]);

    const markNotificationRead = useCallback(async (notificationId: string, username: string) => {
        await performOptimisticUpdate(d => {
            const notification = d.notifications.find(n => n.id === notificationId);
            if (notification && !notification.readBy.includes(username)) {
                notification.readBy.push(username);
            }
            return d;
        });
    }, [performOptimisticUpdate]);

    const markAllNotificationsRead = useCallback(async (username: string) => {
        await performOptimisticUpdate(d => {
            d.notifications.forEach(n => {
                if (!n.readBy.includes(username)) n.readBy.push(username);
            });
            return d;
        });
    }, [performOptimisticUpdate]);

    const updateUser = useCallback(async (user: User) => {
        await performOptimisticUpdate(d => {
            const userKey = user.name.toLowerCase();
            d.users[userKey] = { ...d.users[userKey], ...user };
            return d;
        });
    }, [performOptimisticUpdate]);

    const deleteUser = useCallback(async (username: string) => {
        await performOptimisticUpdate(d => {
            const userKey = username.toLowerCase();
            delete d.users[userKey];
            return d;
        });
    }, [performOptimisticUpdate]);

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
