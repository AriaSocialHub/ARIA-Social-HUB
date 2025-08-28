import { getServiceData, setServiceData, addNotification } from '../lib/db';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { NotificationItem, StoredFile } from '../types';

const PALETTE = ['#4299E1', '#48BB78', '#ECC94B', '#9F7AEA', '#ED64A6', '#667EEA'];
let colorIndex = 0;
const getNextColor = () => {
    const color = PALETTE[colorIndex];
    colorIndex = (colorIndex + 1) % PALETTE.length;
    return color;
};

const NOTIFICATION_EXCLUSIONS = new Set([
    'commentAnalysis', 'shifts-primo-livello', 'shifts-secondo-livello', 'manualTickets', 'teamBreaks-primo-livello',
]);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { serviceId, action, payload, author } = req.body;

        if (!serviceId || !action || !payload || !author) {
            return res.status(400).json({ message: 'Missing required parameters: serviceId, action, payload, author.' });
        }

        const serviceData = await getServiceData(serviceId);
        let notification_args: { action: 'add' | 'update' | 'delete', title: string, categoryName?: string, itemId?: string } | null = null;
        
        // --- DATA MUTATION LOGIC ---
        switch (action) {
            case 'uploadAndReplaceData':
                const oldMetadata = serviceData.metadata || {};
                const newMetadata: Record<string, any> = {};
                for (const categoryName in payload.parsedData) {
                    newMetadata[categoryName] = oldMetadata[categoryName] || { icon: 'Folder', color: getNextColor(), type: 'text', createdAt: new Date().toISOString() };
                }
                serviceData.data = payload.parsedData;
                serviceData.fileName = `Dati caricati da: ${payload.fileName}`;
                serviceData.metadata = newMetadata;
                notification_args = { action: 'update', title: `dati da ${payload.fileName}` };
                break;

            case 'saveServiceData':
                serviceData.data = payload.newData;
                serviceData.fileName = serviceData.fileName || (payload.newData && Object.keys(payload.newData).length > 0 ? 'Dati inseriti manualmente' : null);
                if (payload.action && payload.title) {
                    notification_args = { action: payload.action, title: payload.title, itemId: payload.itemId };
                }
                break;

            case 'addCategory':
                if (serviceData.data?.[payload.categoryName] === undefined) {
                    serviceData.data[payload.categoryName] = [];
                    serviceData.metadata[payload.categoryName] = { icon: 'Folder', color: getNextColor(), type: payload.type || 'text', createdAt: new Date().toISOString() };
                    notification_args = { action: 'add', title: `sezione: ${payload.categoryName}` };
                }
                break;

            case 'deleteCategory':
                if (serviceData.data?.[payload.categoryName]) {
                    delete serviceData.data[payload.categoryName];
                    if (serviceData.metadata) delete serviceData.metadata[payload.categoryName];
                    notification_args = { action: 'delete', title: `sezione: ${payload.categoryName}` };
                }
                break;
            
            case 'deleteMultipleCategories':
                if (serviceData.data) {
                    payload.categoryNames.forEach((name: string) => {
                        delete serviceData.data[name];
                        if (serviceData.metadata) delete serviceData.metadata[name];
                    });
                    const title = `${payload.categoryNames.length} sezion${payload.categoryNames.length > 1 ? 'i' : 'e'}`;
                    notification_args = { action: 'delete', title };
                }
                break;

            case 'renameCategory':
                if (serviceData.data?.[payload.oldName] !== undefined && payload.oldName !== payload.newName) {
                    serviceData.data[payload.newName] = serviceData.data[payload.oldName];
                    delete serviceData.data[payload.oldName];
                    if (serviceData.metadata?.[payload.oldName]) {
                        serviceData.metadata[payload.newName] = serviceData.metadata[payload.oldName];
                        delete serviceData.metadata[payload.oldName];
                    }
                    notification_args = { action: 'update', title: `sezione: ${payload.oldName} in ${payload.newName}` };
                }
                break;

            case 'updateCategoryMetadata':
                if (serviceData.metadata?.[payload.categoryName]) {
                    serviceData.metadata[payload.categoryName] = { ...serviceData.metadata[payload.categoryName], ...payload.metaUpdate };
                }
                break;

            case 'addItem':
                const items = serviceData.data?.[payload.categoryName];
                if (Array.isArray(items)) {
                    items.unshift(payload.item);
                    notification_args = { action: 'add', title: payload.item.casistica || payload.item.richiesta || 'Nuovo elemento', categoryName: payload.categoryName, itemId: payload.item.id };
                }
                break;
            
            case 'updateItem':
                const itemsToUpdate = serviceData.data?.[payload.categoryName];
                const itemIndex = Array.isArray(itemsToUpdate) ? itemsToUpdate.findIndex((i: any) => i.id === payload.itemId) : -1;
                if (itemsToUpdate && itemIndex > -1) {
                    itemsToUpdate[itemIndex] = { ...itemsToUpdate[itemIndex], ...payload.updatedItem };
                    const title = itemsToUpdate[itemIndex].casistica || itemsToUpdate[itemIndex].richiesta || itemsToUpdate[itemIndex].title || 'Elemento';
                    notification_args = { action: 'update', title, categoryName: payload.categoryName, itemId: payload.itemId };
                }
                break;

            case 'deleteItem':
                const itemsToDeleteFrom = serviceData.data?.[payload.categoryName];
                const itemToDelete = Array.isArray(itemsToDeleteFrom) ? itemsToDeleteFrom.find((i: any) => i.id === payload.itemId) : undefined;
                if (itemsToDeleteFrom && itemToDelete) {
                    serviceData.data[payload.categoryName] = itemsToDeleteFrom.filter((i: any) => i.id !== payload.itemId);
                    const title = itemToDelete.casistica || itemToDelete.richiesta || itemToDelete.title || 'Elemento';
                    notification_args = { action: 'delete', title, categoryName: payload.categoryName, itemId: payload.itemId };
                }
                break;

            case 'addFile':
                const fileToAdd = { ...payload.file, id: `repo-file-${Date.now()}` };
                if (serviceId === 'repository') {
                    if(!Array.isArray(serviceData.data)) serviceData.data = [];
                    serviceData.data.unshift(fileToAdd);
                }
                notification_args = { action: 'add', title: `file "${fileToAdd.name}"`, categoryName: payload.categoryName, itemId: fileToAdd.id };
                break;
            
            case 'deleteFile':
                let fileToDeleteFromFileList: StoredFile | undefined;
                if (serviceId === 'repository' && Array.isArray(serviceData.data)) {
                    fileToDeleteFromFileList = serviceData.data.find((f: StoredFile) => f.id === payload.fileId);
                    if (fileToDeleteFromFileList) serviceData.data = serviceData.data.filter((f: StoredFile) => f.id !== payload.fileId);
                }
                if(fileToDeleteFromFileList) {
                    notification_args = { action: 'delete', title: `file "${fileToDeleteFromFileList.name}"`, categoryName: payload.categoryName, itemId: payload.fileId };
                }
                break;

            default:
                return res.status(400).json({ message: `Unknown action: ${action}` });
        }
        
        // --- Save data and create notification ---
        await setServiceData(serviceId, serviceData);
        
        if (notification_args && !NOTIFICATION_EXCLUSIONS.has(serviceId)) {
            await addNotification(author, serviceId, notification_args.action, notification_args.title, notification_args.categoryName, notification_args.itemId);
        }

        // Fetch updated notifications to return to client for sync
        const { getNotifications } = await import('../lib/db');
        const updatedNotifications = await getNotifications();

        return res.status(200).json({ updatedServiceData: serviceData, updatedNotifications });
    } catch (error) {
        console.error(`API Error in servicedata for ${req.body.serviceId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ message: `Internal Server Error: ${errorMessage}` });
    }
}