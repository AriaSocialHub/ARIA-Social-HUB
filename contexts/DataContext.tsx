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
        api.bootstrapApp().then(data => {
            setAppData(data);
        }).catch(err => {
            console.error("Failed to load initial data", err);
        }).finally(() => {
            setIsLoading(false);
        });
    }, []);

    const optimisticUpdate = useCallback(async (updateFn: (currentData: AppData) => AppData, apiCall: () => Promise<any>) => {
        const originalData = appData;
        const newData = updateFn(createDeepCopy(originalData));
        setAppData(newData);
        try {
            await apiCall();
        } catch (error) {
            console.error("API call failed, rolling back optimistic update:", error);
            setAppData(originalData); // Rollback
            throw error;
        }
    }, [appData]);

    const createNotification = (d: AppData, serviceId: string, author: string, message: string, categoryName?: string, itemId?: string) => {
        const newNotification: NotificationItem = {
            id: `notif-local-${Date.now()}`,
            message,
            timestamp: new Date().toISOString(),
            serviceId,
            categoryName,
            itemId,
            readBy: [author],
            author,
        };
        d.notifications.unshift(newNotification);
        if (d.notifications.length > 100) d.notifications.pop();
        return d;
    };

    const uploadAndReplaceData = useCallback(async (serviceId: string, parsedData: Record<string, any[]>, fileName: string, author: string) => {
        const updateFn = (d: AppData) => {
            const oldMetadata = d.services_data[serviceId]?.metadata || {};
            const newMetadata: Record<string, any> = {};
            for (const categoryName in parsedData) {
                newMetadata[categoryName] = oldMetadata[categoryName] || { icon: 'Folder', color: getNextColor(), type: 'text', createdAt: new Date().toISOString() };
            }
            d.services_data[serviceId] = { data: parsedData, metadata: newMetadata, fileName };
            return createNotification(d, serviceId, author, `${author} ha aggiornato i dati per ${serviceMap[serviceId]?.name} dal file "${fileName}".`);
        };
        const apiCall = () => api.updateService(serviceId, 'UPLOAD_AND_REPLACE', {
            items: parsedData,
            fileName,
            categoriesMetadata: (updateFn(createDeepCopy(appData)).services_data[serviceId] as any).metadata,
            author,
            title: `dati da ${fileName}`,
            notificationAction: 'update',
        });
        await optimisticUpdate(updateFn, apiCall);
    }, [appData, optimisticUpdate]);

    const saveServiceData = useCallback(async (serviceId: string, newData: any, author: string, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => {
        const updateFn = (d: AppData) => {
            if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: null, fileName: null };
            d.services_data[serviceId].data = newData;
            d.services_data[serviceId].fileName = d.services_data[serviceId].fileName || 'Dati inseriti manualmente';
            if (action && title) {
                const verb = action === 'add' ? 'aggiunto' : action === 'update' ? 'aggiornato' : 'rimosso';
                return createNotification(d, serviceId, author, `${author} ha ${verb} "${title}"`, undefined, itemId);
            }
            return d;
        };
        
        let apiAction: string;
        let payload: any = { author, title, notificationAction: action, itemId };

        if (serviceId.startsWith('shifts-')) {
            apiAction = 'SAVE_SHIFTS';
            payload.shifts = newData;
            payload.level = serviceId.includes('primo') ? 'primo' : 'secondo';
        } else {
            apiAction = 'SAVE_SERVICE_DATA';
            payload.newData = newData;
        }

        await optimisticUpdate(updateFn, () => api.updateService(serviceId, apiAction, payload));
    }, [appData, optimisticUpdate]);

    const onAddCategory = useCallback(async (serviceId: string, categoryName: string, author: string, type: 'text' | 'file' = 'text') => {
        const metaUpdate = { icon: 'Folder', color: getNextColor(), type, createdAt: new Date().toISOString() };
        await optimisticUpdate(
            d => {
                if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: {}, metadata: {}, fileName: 'Dati inseriti manualmente' };
                if (!d.services_data[serviceId].data) d.services_data[serviceId].data = {};
                d.services_data[serviceId].data[categoryName] = [];
                if (!d.services_data[serviceId].metadata) d.services_data[serviceId].metadata = {};
                d.services_data[serviceId].metadata![categoryName] = metaUpdate;
                return createNotification(d, serviceId, author, `${author} ha aggiunto la sezione "${categoryName}"`);
            },
            () => api.updateService(serviceId, 'ADD_CATEGORY', { categoryName, metaUpdate, author, title: `sezione: ${categoryName}`, notificationAction: 'add' })
        );
    }, [optimisticUpdate]);
    
    const onRenameCategory = useCallback(async (serviceId: string, oldName: string, newName: string, author: string) => {
         await optimisticUpdate(
            d => {
                const service = d.services_data[serviceId];
                if (service?.data?.[oldName]) {
                    service.data[newName] = service.data[oldName];
                    delete service.data[oldName];
                    if(service.metadata?.[oldName]) {
                        service.metadata[newName] = service.metadata[oldName];
                        delete service.metadata[oldName];
                    }
                }
                return createNotification(d, serviceId, author, `${author} ha rinominato la sezione "${oldName}" in "${newName}"`);
            },
            () => api.updateService(serviceId, 'RENAME_CATEGORY', { oldName, newName, author, title: `sezione: ${oldName} in ${newName}`, notificationAction: 'update' })
        );
    }, [optimisticUpdate]);

    const onUpdateCategoryMetadata = useCallback(async (serviceId: string, categoryName: string, metaUpdate: Partial<{ icon: string; color: string; }>) => {
         await optimisticUpdate(
            d => {
                const meta = d.services_data[serviceId]?.metadata?.[categoryName];
                if(meta) d.services_data[serviceId].metadata![categoryName] = {...meta, ...metaUpdate};
                return d;
            },
            () => api.updateService(serviceId, 'UPDATE_CATEGORY_METADATA', { categoryName, metaUpdate })
        );
    }, [optimisticUpdate]);

    const onDeleteCategory = useCallback(async (serviceId: string, categoryName: string, author: string) => {
         await optimisticUpdate(
            d => {
                if(d.services_data[serviceId]?.data) delete d.services_data[serviceId].data[categoryName];
                if(d.services_data[serviceId]?.metadata) delete d.services_data[serviceId].metadata![categoryName];
                return createNotification(d, serviceId, author, `${author} ha eliminato la sezione "${categoryName}"`);
            },
            () => api.updateService(serviceId, 'DELETE_CATEGORY', { categoryName, author, title: `sezione: ${categoryName}`, notificationAction: 'delete' })
        );
    }, [optimisticUpdate]);
    
     const onDeleteMultipleCategories = useCallback(async (serviceId: string, categoryNames: string[], author: string) => {
         await optimisticUpdate(
            d => {
                const service = d.services_data[serviceId];
                if(service?.data) {
                    categoryNames.forEach(name => {
                        delete service.data[name];
                        if(service.metadata) delete service.metadata[name];
                    });
                }
                return createNotification(d, serviceId, author, `${author} ha eliminato ${categoryNames.length} sezioni`);
            },
            () => api.updateService(serviceId, 'DELETE_MULTIPLE_CATEGORIES', { categoryNames, author, title: `${categoryNames.length} sezioni`, notificationAction: 'delete' })
        );
    }, [optimisticUpdate]);

    const onAddItem = useCallback(async (serviceId: string, categoryName: string, item: any, author: string) => {
        const title = item.casistica || item.richiesta || 'Nuovo elemento';
        await optimisticUpdate(
            d => {
                const items = d.services_data[serviceId]?.data?.[categoryName];
                if(Array.isArray(items)) items.unshift(item);
                return createNotification(d, serviceId, author, `${author} ha aggiunto "${title}"`, categoryName, item.id);
            },
            () => api.updateService(serviceId, 'ADD_ITEM', { categoryName, item, author, title, notificationAction: 'add', itemId: item.id })
        );
    }, [optimisticUpdate]);

    const onUpdateItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, updatedItem: any, author: string) => {
        let title = '';
        await optimisticUpdate(
            d => {
                const items = d.services_data[serviceId]?.data?.[categoryName];
                const itemIndex = Array.isArray(items) ? items.findIndex((i: any) => i.id === itemId) : -1;
                if(items && itemIndex > -1) {
                    items[itemIndex] = { ...items[itemIndex], ...updatedItem };
                    title = items[itemIndex].casistica || items[itemIndex].richiesta || items[itemIndex].title || 'Elemento';
                    return createNotification(d, serviceId, author, `${author} ha aggiornato "${title}"`, categoryName, itemId);
                }
                return d;
            },
            () => api.updateService(serviceId, 'UPDATE_ITEM', { categoryName, itemId, updatedItem, author, title, notificationAction: 'update' })
        );
    }, [optimisticUpdate]);

    const onDeleteItem = useCallback(async (serviceId: string, categoryName: string, itemId: string, author: string) => {
        let title = '';
        await optimisticUpdate(
            d => {
                const items = d.services_data[serviceId]?.data?.[categoryName];
                const itemToDelete = Array.isArray(items) ? items.find((i: any) => i.id === itemId) : undefined;
                if (items && itemToDelete) {
                    title = itemToDelete.casistica || itemToDelete.richiesta || itemToDelete.title || 'Elemento';
                    d.services_data[serviceId].data[categoryName] = items.filter((i: any) => i.id !== itemId);
                    return createNotification(d, serviceId, author, `${author} ha eliminato "${title}"`, categoryName, itemId);
                }
                return d;
            },
            () => api.updateService(serviceId, 'DELETE_ITEM', { categoryName, itemId, author, title, notificationAction: 'delete' })
        );
    }, [optimisticUpdate]);
    
    const onAddFile = useCallback(async (serviceId: string, categoryName: string, fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File, author: string) => {
        const url = await api.uploadFile(file, file.name); // Upload first
        const newFile: StoredFile = { ...fileData, id: `repo-file-${Date.now()}`, author, createdAt: new Date().toISOString(), url };
        
        await optimisticUpdate(
            d => {
                if (!d.services_data[serviceId]) d.services_data[serviceId] = { data: [], fileName: 'Dati inseriti manualmente' };
                if (!Array.isArray(d.services_data[serviceId].data)) d.services_data[serviceId].data = [];
                d.services_data[serviceId].data.unshift(newFile);
                return createNotification(d, serviceId, author, `${author} ha caricato il file "${newFile.name}"`, categoryName, newFile.id);
            },
            () => api.updateService(serviceId, 'ADD_FILE', { fileData: newFile, author, title: `file "${newFile.name}"`, notificationAction: 'add', itemId: newFile.id })
        );
    }, [optimisticUpdate]);

    const onDeleteFile = useCallback(async (serviceId: string, categoryName: string, fileId: string, author: string) => {
        let title = '';
        await optimisticUpdate(
            d => {
                const files = d.services_data[serviceId]?.data as StoredFile[];
                const fileToDelete = Array.isArray(files) ? files.find(f => f.id === fileId) : undefined;
                if (fileToDelete) {
                    title = fileToDelete.name;
                    d.services_data[serviceId].data = files.filter(f => f.id !== fileId);
                    return createNotification(d, serviceId, author, `${author} ha eliminato il file "${title}"`, categoryName, fileId);
                }
                return d;
            },
            () => api.updateService(serviceId, 'DELETE_FILE', { itemId: fileId, author, title: `file "${title}"`, notificationAction: 'delete' })
        );
    }, [optimisticUpdate]);

    const markNotificationRead = useCallback(async (notificationId: string, username: string) => {
        await optimisticUpdate(
            d => {
                const notif = d.notifications.find(n => n.id === notificationId);
                if (notif && !notif.readBy.includes(username)) notif.readBy.push(username);
                return d;
            },
            () => api.markNotificationRead(notificationId, username)
        );
    }, [optimisticUpdate]);

    const markAllNotificationsRead = useCallback(async (username: string) => {
        await optimisticUpdate(
            d => {
                d.notifications.forEach(n => { if (!n.readBy.includes(username)) n.readBy.push(username); });
                return d;
            },
            () => api.markAllNotificationsRead(username)
        );
    }, [optimisticUpdate]);

    const updateUser = useCallback(async (user: User) => {
        await optimisticUpdate(
            d => {
                d.users[user.name.toLowerCase()] = { ...d.users[user.name.toLowerCase()], ...user };
                return d;
            },
            () => api.updateUser(user)
        );
    }, [optimisticUpdate]);

    const deleteUser = useCallback(async (username: string) => {
        await optimisticUpdate(
            d => {
                delete d.users[username.toLowerCase()];
                return d;
            },
            () => api.deleteUser(username)
        );
    }, [optimisticUpdate]);

    const value: DataContextType = {
        appData, servicesData: appData.services_data, notifications: appData.notifications, isLoading,
        uploadAndReplaceData, saveServiceData, onAddCategory, onDeleteCategory, onDeleteMultipleCategories,
        onRenameCategory, onUpdateCategoryMetadata, onAddItem, onUpdateItem, onDeleteItem,
        onAddFile, onDeleteFile, markNotificationRead, markAllNotificationsRead, updateUser, deleteUser,
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
    if (context === undefined) throw new Error('useData must be used within a DataProvider');
    return context;
};
