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
    const { markAllNotificationsRead } = useData();

    // Show ONLY unread notifications
    const unreadNotifications = notifications
        .filter(n => n.author !== currentUser.name && !n.readBy.includes(currentUser.name))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Show max 10 recent unread notifications

    const handleMarkAll = () => {
        markAllNotificationsRead(currentUser.name);
    };

    return (
        <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <h3 className="font-semibold text-gray-800">Notifiche</h3>
                <div className="flex items-center gap-2">
                    {unreadNotifications.length > 0 && (
                        <button 
                            onClick={handleMarkAll}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                            title="Segna tutte come lette"
                        >
                            <CheckCheck className="w-3 h-3" /> Tutte lette
                        </button>
                    )}
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                {unreadNotifications.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                        {unreadNotifications.map(n => {
                            const ServiceIcon = serviceMap[n.serviceId]?.icon || 'div';
                            
                            return (
                                <div 
                                    key={n.id}
                                    className="p-4 hover:bg-gray-50 transition-colors cursor-pointer bg-blue-50/30"
                                    onClick={() => { onNavigate(n); onClose(); }}
                                >
                                    <div className="flex gap-3">
                                        <div className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></div>
                                        <div className="flex-grow">
                                            <p className="text-sm text-gray-900 font-medium">
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
                        <p className="text-sm">Non sono presenti nuove notifiche</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationPopup;