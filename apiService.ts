// This service simulates an API but uses an in-memory object for storage.
// This ensures that all data is cleared when the page is reloaded,
// as requested by the user to solve persistence issues.
// It ensures immutability by returning new object references to trigger React state updates.

import { NotificationItem, StoredFile } from "../types";

interface DbStructure {
    services_data: Record<string, any>;
    notifications: NotificationItem[];
}

const PALETTE = ['#4299E1', '#48BB78', '#ECC94B', '#9F7AEA', '#ED64A6', '#667EEA']; // blue, green, yellow, purple, pink, indigo
let colorIndex = Math.floor(Math.random() * PALETTE.length); // Start at a random color

const getNextColor = () => {
    const color = PALETTE[colorIndex];
    colorIndex = (colorIndex + 1) % PALETTE.length;
    return color;
};

// --- Helper Function ---
const createDeepCopy = <T>(data: T): T => JSON.parse(JSON.stringify(data));

// The in-memory database. It's reset every time the script is reloaded (e.g., page refresh).
let db: DbStructure = {
    services_data: {},
    notifications: [],
};


const api = {
    fetchAllServicesData: async (): Promise<Record<string, any>> => {
        // Returns the whole db now
        return Promise.resolve(createDeepCopy(db));
    },

    uploadAndReplaceData: async (serviceId: string, parsedData: Record<string, any[]>, fileName: string, fileBased: boolean = false): Promise<DbStructure> => {
        const oldMetadata = db.services_data[serviceId]?.metadata || {};
        const newMetadata: Record<string, { icon: string; color: string; type: 'text' | 'file' }> = {};
        
        // Preserve metadata for categories that still exist, and create for new ones
        for (const categoryName in parsedData) {
            if (oldMetadata[categoryName]) {
                newMetadata[categoryName] = oldMetadata[categoryName];
            } else {
                newMetadata[categoryName] = { icon: 'Folder', color: getNextColor(), type: fileBased ? 'file' : 'text' };
            }
        }

        // This is a complete replacement of the data for the given serviceId
        db.services_data[serviceId] = {
            data: parsedData,
            metadata: newMetadata,
            fileName: `Dati caricati da: ${fileName}`,
        };

        return Promise.resolve(createDeepCopy(db));
    },

    saveServiceData: async (serviceId: string, newData: any[]): Promise<DbStructure> => {
        const currentServiceState = db.services_data[serviceId] || { data: null, fileName: null };
        const newFileName = currentServiceState.fileName || (newData && newData.length > 0 ? 'Dati inseriti manualmente' : null);
        
        db.services_data[serviceId] = {
            ...currentServiceState,
            data: newData,
            fileName: newFileName,
        };

        return Promise.resolve(createDeepCopy(db));
    },

    addCategory: async (serviceId: string, categoryName: string, type: 'text' | 'file' = 'text'): Promise<DbStructure> => {
        const service = db.services_data[serviceId] || { data: {}, metadata: {}, fileName: 'Dati inseriti manually' };
        if (!service.data) service.data = {};
        if (!service.metadata) service.metadata = {};

        if (service.data[categoryName] === undefined) {
             service.data[categoryName] = [];
             service.metadata[categoryName] = { icon: 'Folder', color: getNextColor(), type: type };
             db.services_data[serviceId] = service;
        }
        return Promise.resolve(createDeepCopy(db));
    },
    
    deleteCategory: async (serviceId: string, categoryName: string): Promise<DbStructure> => {
        if (db.services_data[serviceId]?.data) {
            delete db.services_data[serviceId].data[categoryName];
        }
        if (db.services_data[serviceId]?.metadata) {
            delete db.services_data[serviceId].metadata[categoryName];
        }
        return Promise.resolve(createDeepCopy(db));
    },

    renameCategory: async (serviceId: string, oldName: string, newName: string): Promise<DbStructure> => {
        const service = db.services_data[serviceId];
        if (service?.data?.[oldName] !== undefined && oldName !== newName) {
            // rename data
            service.data[newName] = service.data[oldName];
            delete service.data[oldName];
            // rename metadata
            if (service.metadata?.[oldName]) {
                service.metadata[newName] = service.metadata[oldName];
                delete service.metadata[oldName];
            }
        }
        return Promise.resolve(createDeepCopy(db));
    },

    updateCategoryMetadata: async (serviceId: string, categoryName: string, metaUpdate: Partial<{icon: string, color: string}>): Promise<DbStructure> => {
        const categoryMeta = db.services_data[serviceId]?.metadata?.[categoryName];
        if (categoryMeta) {
            db.services_data[serviceId].metadata[categoryName] = { ...categoryMeta, ...metaUpdate };
        }
        return Promise.resolve(createDeepCopy(db));
    },

    addItem: async (serviceId: string, categoryName: string, item: any): Promise<DbStructure> => {
        const categoryItems = db.services_data[serviceId]?.data?.[categoryName];
        if (categoryItems) {
            categoryItems.unshift(item); // Add to the beginning
        }
        return Promise.resolve(createDeepCopy(db));
    },

    updateItem: async (serviceId: string, categoryName: string, itemId: string, updatedItem: any): Promise<DbStructure> => {
        const categoryItems = db.services_data[serviceId]?.data?.[categoryName];
        if (categoryItems) {
            const itemIndex = categoryItems.findIndex((i: any) => i.id === itemId);
            if (itemIndex > -1) {
                categoryItems[itemIndex] = { ...categoryItems[itemIndex], ...updatedItem };
            }
        }
        return Promise.resolve(createDeepCopy(db));
    },

    deleteItem: async (serviceId: string, categoryName: string, itemId: string): Promise<DbStructure> => {
        const categoryItems = db.services_data[serviceId]?.data?.[categoryName];
        if (categoryItems) {
            db.services_data[serviceId].data[categoryName] = categoryItems.filter((i: any) => i.id !== itemId);
        }
        return Promise.resolve(createDeepCopy(db));
    },
    
    addFile: async (serviceId: string, categoryName: string, file: StoredFile): Promise<DbStructure> => {
        const categoryFiles = db.services_data[serviceId]?.data?.[categoryName] as StoredFile[] | undefined;
        if(categoryFiles) {
            categoryFiles.unshift(file);
        }
        return Promise.resolve(createDeepCopy(db));
    },

    deleteFile: async (serviceId: string, categoryName: string, fileId: string): Promise<DbStructure> => {
        const categoryFiles = db.services_data[serviceId]?.data?.[categoryName] as StoredFile[] | undefined;
        if (categoryFiles) {
             db.services_data[serviceId].data[categoryName] = categoryFiles.filter((f) => f.id !== fileId);
        }
        return Promise.resolve(createDeepCopy(db));
    },


    // --- Notification Methods ---
    addNotification: async (notification: Omit<NotificationItem, 'id'>): Promise<DbStructure> => {
        const newNotification: NotificationItem = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random()}`,
        };
        db.notifications.unshift(newNotification); // Add to the top
        // Keep only the last 100 notifications to prevent memory issues
        if (db.notifications.length > 100) {
            db.notifications = db.notifications.slice(0, 100);
        }
        return Promise.resolve(createDeepCopy(db));
    },

    markNotificationRead: async (notificationId: string, username: string): Promise<DbStructure> => {
        const notification = db.notifications.find(n => n.id === notificationId);
        if (notification && !notification.readBy.includes(username)) {
            notification.readBy.push(username);
        }
        return Promise.resolve(createDeepCopy(db));
    },

    markAllNotificationsRead: async (username: string): Promise<DbStructure> => {
        db.notifications.forEach(n => {
            if (!n.readBy.includes(username)) {
                n.readBy.push(username);
            }
        });
        return Promise.resolve(createDeepCopy(db));
    },
};

export default api;