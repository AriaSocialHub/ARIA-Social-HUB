



import React from 'react';
import { OnlineUser, UserProfile, Ticket, Procedura, Guideline, NewsArticle, UsefulContent, StoredFile, NavigationTarget } from '../types';
import { getAvatar, getAvatarColor } from '../services/avatarRegistry';
import { Users, ArrowRight, BookText, Archive, ClipboardCheck, Wifi, PauseCircle, Activity, Newspaper, HeartPulse, Bird, BookMarked, Telescope } from 'lucide-react';
import { PAUSE_DURATIONS, calculateEndTime } from './team-breaks/helpers';
import { useData } from '../contexts/DataContext';

const FallbackAvatar: React.FC<{ authorName: string }> = ({ authorName }) => {
    const initial = authorName.charAt(0).toUpperCase();
    const colorIndex = (authorName.charCodeAt(0) || 0) % 5;
    const colors = [
        'bg-red-200 text-red-800',
        'bg-blue-200 text-blue-800',
        'bg-green-200 text-green-800',
        'bg-yellow-200 text-yellow-800',
        'bg-purple-200 text-purple-800',
    ];

    return (
        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-xs ${colors[colorIndex]}`}>
            {initial}
        </div>
    );
};

interface LatestItemResult<T> {
    item: T;
    categoryName?: string;
}

interface InfoWidgetsProps {
    onlineUsers: OnlineUser[];
    latestUpdates: {
        tickets: LatestItemResult<Ticket> | null;
        procedures: LatestItemResult<Procedura> | null;
        guidelines: LatestItemResult<Guideline> | null;
        sanita: LatestItemResult<UsefulContent> | null;
        documentArchive: LatestItemResult<StoredFile | UsefulContent> | null;
        vademecum: LatestItemResult<UsefulContent> | null;
        belvedere: LatestItemResult<Ticket | UsefulContent> | null;
        newsArchive: LatestItemResult<NewsArticle> | null;
    };
    currentUser: UserProfile | null;
    handleNavigate: (target: NavigationTarget) => void;
}

const InfoWidgets: React.FC<InfoWidgetsProps> = ({ onlineUsers, latestUpdates, currentUser, handleNavigate }) => {
    const { servicesData } = useData();
    const now = new Date();

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
                    {Object.values(latestUpdates).every(item => item === null) && (
                         <p className="text-sm text-gray-500">Nessuna attività da mostrare.</p>
                    )}
                    {Object.entries(latestUpdates).map(([key, result]) => {
                        if (!result) return null;

                        const { item, categoryName } = result;
                        
                        const details = {
                            tickets: { icon: Archive, label: 'Ticket', serviceId: 'tickets', text: (item as Ticket).argomento },
                            procedures: { icon: ClipboardCheck, label: 'Procedura', serviceId: 'procedures', text: (item as Procedura).casistica },
                            guidelines: { icon: ClipboardCheck, label: 'Linea Guida', serviceId: 'guidelines', text: (item as Guideline).casistica },
                            sanita: { icon: HeartPulse, label: 'Tematica Sanitaria', serviceId: 'sanita', text: (item as UsefulContent).casistica },
                            documentArchive: { icon: Bird, label: 'Falco Pellegrino', serviceId: 'documentArchive', text: (item as StoredFile).name || (item as UsefulContent).casistica, author: (item as StoredFile).author },
                            vademecum: { icon: BookMarked, label: 'Vademecum', serviceId: 'vademecum', text: (item as UsefulContent).casistica },
                            belvedere: { icon: Telescope, label: 'Belvedere', serviceId: 'belvedere', text: (item as UsefulContent).casistica || (item as Ticket).argomento },
                            newsArchive: { icon: Newspaper, label: 'News', serviceId: 'newsArchive', text: (item as NewsArticle).title, author: (item as NewsArticle).author },
                        }[key];
                        
                        if (!details) return null;

                        const onlineAuthor = details.author ? onlineUsers.find(u => u.name === details.author) : null;
                        const AuthorAvatar = onlineAuthor ? getAvatar(onlineAuthor.avatar) : null;
                        const avatarColor = onlineAuthor ? getAvatarColor(onlineAuthor.avatar) : '';
                        
                        return (
                            <button onClick={() => handleNavigate({ serviceId: details.serviceId, categoryName, itemId: item.id })} key={key} className="w-full group flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg text-left">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                       <details.icon className={`h-5 w-5 text-gray-500`} />
                                    </div>
                                    <div className="flex-grow overflow-hidden">
                                        <div className="font-semibold text-sm text-gray-800 truncate">{details.text}</div>
                                        <div className="text-xs text-gray-500 flex items-center gap-1.5">
                                            <span>{details.label}</span>
                                            {details.author && (
                                                <>
                                                  <span>di</span>
                                                   {AuthorAvatar ? (
                                                      <div className="h-5 w-5 rounded-full flex items-center justify-center bg-gray-100">
                                                        <AuthorAvatar className="h-4 w-4" style={{color: avatarColor}}/>
                                                      </div>
                                                   ) : (
                                                       <FallbackAvatar authorName={details.author} />
                                                   )}
                                                  <span className="font-medium">{details.author}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-[var(--c-primary-light)] transition-colors flex-shrink-0 ml-2" />
                            </button>
                        );
                    })}
                </div>
            </div>
        </>
    );
};

export default InfoWidgets;