import React from 'react';
import { NotificationItem, UserProfile } from '../types';
import { serviceMap } from '../services/registry';
import { timeAgo } from './utils/time';
import { useData } from '../contexts/DataContext';
import { X, CheckCheck } from 'lucide-react';

interface NotificationPopupProps {
    notifications: NotificationItem[];
    currentUser: UserProfile;
    onClose: () => void;
    onNavigate: (notification: NotificationItem) => void;
}

const NotificationPopup: React.FC<NotificationPopupProps> = ({ notifications, currentUser, onClose, onNavigate }) => {
    const { markNotificationRead, markAllNotificationsRead } = useData();

    // Show unread notifications first, then read ones
    const relevantNotifications = notifications
        .filter(n => n.author !== currentUser.name)
        .sort((a, b) => {
            const aRead = a.readBy.includes(currentUser.name);
            const bRead = b.readBy.includes(currentUser.name);
            if (aRead === bRead) {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
            return aRead ? 1 : -1;
        })
        .slice(0, 10); // Show max 10 recent notifications in popup

    const handleMouseEnter = (notification: NotificationItem) => {
        if (!notification.readBy.includes(currentUser.name)) {
            markNotificationRead(notification.id, currentUser.name);
        }
    };

    const handleMarkAll = () => {
        markAllNotificationsRead(currentUser.name);
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Notifiche</h3>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleMarkAll}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                        title="Segna tutte come lette"
                    >
                        <CheckCheck className="w-3 h-3" /> Tutte lette
                    </button>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                {relevantNotifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {relevantNotifications.map(n => {
                            const isRead = n.readBy.includes(currentUser.name);
                            const ServiceIcon = serviceMap[n.serviceId]?.icon || 'div';
                            
                            return (
                                <div 
                                    key={n.id}
                                    className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${isRead ? 'opacity-75' : 'bg-blue-50/30'}`}
                                    onMouseEnter={() => handleMouseEnter(n)}
                                    onClick={() => { onNavigate(n); onClose(); }}
                                >
                                    <div className="flex gap-3">
                                        <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${isRead ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                                        <div className="flex-grow">
                                            <p className={`text-sm ${isRead ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                                                {n.message}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                <ServiceIcon className="w-3 h-3 text-gray-400" />
                                                <span className="text-xs text-gray-400">{timeAgo(n.timestamp)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-8 text-center text-gray-500">
                        <p className="text-sm">Nessuna nuova notifica</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPopup;