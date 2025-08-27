import React from 'react';
import { NotificationItem, UserProfile } from '../types';
import { serviceMap } from '../services/registry';
import { timeAgo } from './utils/time';

interface NotificationsListProps {
    notifications: NotificationItem[];
    currentUser: UserProfile | null;
    onNotificationClick: (notification: NotificationItem) => void;
}

const NotificationsList: React.FC<NotificationsListProps> = ({ notifications, currentUser, onNotificationClick }) => {

    if (!currentUser) return null;

    const myNotifications = notifications.filter(n => n.author !== currentUser?.name);

    if (myNotifications.length === 0) {
        return (
            <div id="notifications-feed" className="bg-white rounded-2xl shadow-lg border p-6">
                <h2 className="text-2xl font-bold text-gray-800">Registro delle Novità</h2>
                <div className="text-center py-8 text-gray-500">
                    <p>Nessun nuovo aggiornamento da visualizzare.</p>
                </div>
            </div>
        )
    }

    return (
        <div id="notifications-feed" className="bg-white rounded-2xl shadow-lg border p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Registro delle Novità</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {myNotifications.map(notification => {
                    const isUnread = !notification.readBy.includes(currentUser.name);
                    const ServiceIcon = serviceMap[notification.serviceId]?.icon || 'div';
                    return (
                        <div
                            key={notification.id}
                            onClick={() => onNotificationClick(notification)}
                            className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer transition-colors ${isUnread ? 'bg-blue-50 hover:bg-blue-100' : 'bg-gray-50 hover:bg-gray-100'}`}
                        >
                            <div className={`flex-shrink-0 mt-1 h-3 w-3 rounded-full ${isUnread ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
                                <ServiceIcon className="h-5 w-5 text-gray-600" />
                            </div>
                            <div className="flex-grow">
                                <p className="text-sm text-gray-800">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{timeAgo(notification.timestamp)}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default NotificationsList;
