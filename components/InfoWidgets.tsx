import React, { useMemo } from 'react';
import { OnlineUser, UserProfile, NotificationItem, NavigationTarget, User } from './types';
import { getAvatar, getAvatarColor } from '../services/avatarRegistry';
import { Users, ArrowRight, BookText, Wifi, PauseCircle, Activity } from 'lucide-react';
import { PAUSE_DURATIONS, calculateEndTime } from './team-breaks/helpers';
import { useData } from '../contexts/DataContext';
import { serviceMap } from '../services/registry';
import { timeAgo } from './utils/time';

const AuthorAvatar: React.FC<{ authorName: string | null; usersMap: Map<string, User> }> = ({ authorName, usersMap }) => {
    if (!authorName) return null;
    
    const user = usersMap.get(authorName);
    if (user && user.avatar) {
        const AvatarIcon = getAvatar(user.avatar);
        const color = getAvatarColor(user.avatar);
        return (
             <div className="h-5 w-5 rounded-full flex items-center justify-center bg-gray-100">
                <AvatarIcon className="h-4 w-4" style={{ color }} />
            </div>
        );
    }
    
    const initial = authorName.charAt(0).toUpperCase();
    const colorIndex = (authorName.charCodeAt(0) || 0) % 5;
    const colors = [
        'bg-red-200 text-red-800', 'bg-blue-200 text-blue-800', 'bg-green-200 text-green-800',
        'bg-yellow-200 text-yellow-800', 'bg-purple-200 text-purple-800',
    ];
    return <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${colors[colorIndex]}`}>{initial}</div>;
};

interface InfoWidgetsProps {
    onlineUsers: OnlineUser[];
    recentActivity: NotificationItem[];
    currentUser: UserProfile | null;
    handleNavigate: (target: NavigationTarget | NotificationItem) => void;
}

const InfoWidgets: React.FC<InfoWidgetsProps> = ({ onlineUsers, recentActivity, currentUser, handleNavigate }) => {
    const { servicesData, appData } = useData();
    const now = new Date();
    
    const usersMap = useMemo(() => new Map(Object.values(appData.users || {}).map((u: User) => [u.name, u])), [appData.users]);

    const sortedOnlineUsers = [...onlineUsers].sort((a, b) => {
        if (a.name === currentUser?.name) return -1;
        if (b.name === currentUser?.name) return 1;
        return a.name.localeCompare(b.name);
    });
    
    const onBreakUsers = React.useMemo(() => {
        const allBreaks = servicesData['teamBreaks-primo-livello']?.data || [];
        return allBreaks.flatMap((data: any) =>
            Object.entries(data.actual_start_times || {})
                .map(([type, startTime]: [string, any]) => {
                    if (!startTime) return null;
                    const endTime = calculateEndTime(startTime, PAUSE_DURATIONS[type], now);
                    if (endTime && now < endTime) {
                        return { 
                            name: data.operatore,
                            avatar: data.creatorAvatar,
                            sessionId: `break-${data.id}-${type}`,
                            breakEndTime: endTime 
                        };
                    }
                    return null;
                })
        ).filter((v): v is { name: string, avatar: string, sessionId: string, breakEndTime: Date } => !!v);
    }, [servicesData, now]);

    const renderTime = (date: Date) => date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    return (
        <>
            {/* Online Users Widget */}
            <div className="card">
                <h3 className="flex items-center gap-3 font-bold text-[var(--c-text-heading)] mb-4">
                    <Wifi style={{ color: 'var(--c-online)'}} />
                    <span>Chi è Online ({onlineUsers.length})</span>
                </h3>
                {onlineUsers.length > 0 ? (
                    <div className="flex flex-wrap gap-4">
                        {sortedOnlineUsers.map(user => {
                            const AvatarIcon = getAvatar(user.avatar);
                            const avatarColor = getAvatarColor(user.avatar);
                            return (
                                <div key={user.sessionId} className="flex items-center gap-3">
                                    <div className={`h-12 w-12 rounded-full flex items-center justify-center bg-gray-100`}>
                                        <AvatarIcon className="h-7 w-7" style={{ color: avatarColor }}/>
                                    </div>
                                    <span className="font-medium text-sm">{user.name}</span>
                                </div>
                            );
                        })}
                    </div>
                 ) : (
                    <p className="text-sm text-gray-500">Nessun utente online.</p>
                )}
            </div>

            {/* On Break Widget */}
            <div className="card">
                 <h3 className="flex items-center gap-3 font-bold text-[var(--c-text-heading)] mb-4">
                    <PauseCircle style={{ color: 'var(--c-pause)'}} />
                    <span>In Pausa ({onBreakUsers.length})</span>
                </h3>
                {onBreakUsers.length > 0 ? (
                    <div className="space-y-3">
                        {onBreakUsers.map((user) => {
                            const Avatar = getAvatar(user.avatar);
                            const color = getAvatarColor(user.avatar);
                             return (
                                <div key={user.sessionId} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                       <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100">
                                            <Avatar className="h-4 w-4" style={{ color }} />
                                       </div>
                                       <span className="font-medium text-sm">{user.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-700">Fine: {renderTime(user.breakEndTime)}</span>
                                </div>
                             )
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-gray-500">Tutti operativi al momento!</p>
                )}
            </div>
            
            {/* Latest Updates Widget */}
            <div className="card">
                 <h3 className="flex items-center gap-3 font-bold text-[var(--c-text-heading)] mb-4">
                    <Activity />
                    <span>Attività Recente</span>
                </h3>
                <div className="space-y-2">
                    {recentActivity.length > 0 ? (
                        recentActivity.map(notification => {
                            const ServiceIcon = serviceMap[notification.serviceId]?.icon || BookText;
                            
                            return (
                                <button onClick={() => handleNavigate(notification)} key={notification.id} className="w-full group flex items-start justify-between p-2 border border-gray-300 hover:bg-[#04434E]/5 hover:border-[#04434E] rounded-lg text-left gap-3 transition-all duration-200">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                       <ServiceIcon className="h-5 w-5 text-gray-500" />
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <p className="text-sm text-gray-800 break-words">{notification.message}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
                                            <AuthorAvatar authorName={notification.author} usersMap={usersMap} />
                                            <span className="font-medium">{notification.author || 'Sistema'}</span>
                                            <span>·</span>
                                            <span>{timeAgo(notification.timestamp)}</span>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--c-primary)] transition-colors flex-shrink-0 ml-2 mt-1" />
                                </button>
                            );
                        })
                    ) : (
                        <p className="text-sm text-gray-500">Nessuna attività da mostrare.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default InfoWidgets;