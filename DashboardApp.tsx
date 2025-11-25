import React from 'react';
import { UserProfile, OnlineUser, Ticket, Procedura, Guideline, NotificationItem, NavigationTarget, NewsArticle, UsefulContent, StoredFile, User } from './types';
import NewsSection from './components/NewsSection';
import InfoWidgets from './components/InfoWidgets';
import { useData } from './contexts/DataContext';
import NotificationsList from './components/NotificationsList';

interface DashboardAppProps {
    isReadOnly: boolean;
    currentUser: UserProfile | null;
    onlineUsers: OnlineUser[];
    setView: (view: string) => void;
    handleNavigate: (target: NavigationTarget | NotificationItem) => void;
}

const WelcomeBanner = () => (
    <div 
      className="p-8 rounded-xl text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg, var(--c-primary-light), var(--c-primary))' }}
    >
      <h2 className="text-4xl font-bold">Demand extrasanità</h2>
      <p className="mt-2 text-lg opacity-90">Qui trovate una panoramica delle ultime novità sulla piattaforma!</p>
    </div>
);

const DashboardApp: React.FC<DashboardAppProps> = ({
    isReadOnly, currentUser, onlineUsers, setView, handleNavigate
}) => {
    const { notifications } = useData();
    
    // This logic ensures the "Recent Activity" panel always shows the latest 8 global updates chronologically.
    const recentActivity = React.useMemo(() => {
        return notifications
            .slice() // Create a shallow copy to avoid mutating the original array
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, 8);
    }, [notifications]);

    const handleArticleSelect = (article: NewsArticle) => {
        handleNavigate({
            serviceId: 'newsArchive',
            itemId: article.id,
        });
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            <WelcomeBanner />
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2">
                    <NewsSection 
                        isReadOnly={isReadOnly} 
                        currentUser={currentUser}
                        onArticleClick={handleArticleSelect}
                    />
                </div>
                <div className="space-y-8">
                    <InfoWidgets
                        onlineUsers={onlineUsers}
                        recentActivity={recentActivity}
                        currentUser={currentUser}
                        handleNavigate={handleNavigate}
                    />
                    <NotificationsList 
                        notifications={notifications}
                        currentUser={currentUser}
                        onNotificationClick={(notification) => handleNavigate(notification)}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardApp;

// Add a simple fade-in animation for the dashboard.
if (!document.getElementById('dashboard-animation-style')) {
    const style = document.createElement('style');
    style.id = 'dashboard-animation-style';
    style.innerHTML = `
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
        }
    `;
    document.head.appendChild(style);
}