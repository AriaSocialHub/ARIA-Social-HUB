

import React from 'react';
import { UserProfile, OnlineUser, Ticket, Procedura, Guideline, NotificationItem, NavigationTarget, NewsArticle, UsefulContent, StoredFile } from './types';
import NewsSection from './components/NewsSection';
import InfoWidgets from './components/InfoWidgets';
import { useData } from './contexts/DataContext';
import NotificationsList from './components/NotificationsList';
import { robustParseDate } from './services/utils';


interface DashboardAppProps {
    isReadOnly: boolean;
    currentUser: UserProfile | null;
    onlineUsers: OnlineUser[];
    setView: (view: string) => void;
    handleNavigate: (targetOrNotification: NavigationTarget | NotificationItem) => void;
}

interface DatedItem {
  id: string;
  createdAt?: string;
  data?: string;
  dataInserimento?: string;
}

interface LatestItemResult<T> {
    item: T;
    categoryName?: string;
}

const getLatestItem = <T extends DatedItem>(serviceData: { data: any, metadata?: any } | undefined): LatestItemResult<T> | null => {
    if (!serviceData?.data) return null;

    const getDate = (item: DatedItem): Date => {
        const dateStr = item.createdAt || item.data || item.dataInserimento;
        return robustParseDate(dateStr);
    };

    let latestItemResult: LatestItemResult<T> | null = null;
    let latestDate: Date = new Date(0);

    // 1. Find the latest ITEM
    if (Array.isArray(serviceData.data)) {
        // Handle flat array data (e.g., newsArchive)
        const datedItems = serviceData.data.filter(item => item && (item.createdAt || item.data || item.dataInserimento));
        if (datedItems.length > 0) {
            const latestItem = datedItems.reduce((latest, item) => {
                return getDate(item) > getDate(latest) ? item : latest;
            });
            latestItemResult = { item: latestItem as T, categoryName: undefined };
            latestDate = getDate(latestItem);
        }
    } else if (typeof serviceData.data === 'object' && serviceData.data !== null) {
        // Handle categorized data
        Object.entries(serviceData.data).forEach(([categoryName, categoryItems]) => {
            let itemsInCategory: DatedItem[] = [];
            
            if (categoryItems && typeof categoryItems === 'object' && !Array.isArray(categoryItems)) {
                 if (Array.isArray((categoryItems as any).textItems)) itemsInCategory.push(...(categoryItems as any).textItems);
                 if (Array.isArray((categoryItems as any).files)) itemsInCategory.push(...(categoryItems as any).files);
            } else if (Array.isArray(categoryItems)) {
                itemsInCategory = categoryItems;
            }

            const datedItems = itemsInCategory.filter(item => item && (item.createdAt || item.data || item.dataInserimento));
            
            if (datedItems.length > 0) {
                const latestInCategory = datedItems.reduce((latest, item) => getDate(item) > getDate(latest) ? item : latest);
                const itemDate = getDate(latestInCategory);
                if (itemDate > latestDate) {
                    latestDate = itemDate;
                    latestItemResult = { item: latestInCategory as T, categoryName };
                }
            }
        });
    }

    // 2. Find the latest CATEGORY and compare its creation date with the latest item's date
    if (serviceData.metadata && typeof serviceData.metadata === 'object') {
        Object.entries(serviceData.metadata).forEach(([categoryName, meta]: [string, any]) => {
            if (meta && meta.createdAt) {
                const categoryDate = robustParseDate(meta.createdAt);
                if (categoryDate > latestDate) {
                    latestDate = categoryDate;
                    // Create a synthetic item for the new category to display in the widget
                    const syntheticItem = {
                        id: `category-creation-${categoryName}`,
                        casistica: `Nuova sezione: ${categoryName}`,
                        title: `Nuova sezione: ${categoryName}`,
                        argomento: `Nuova sezione: ${categoryName}`,
                        name: `Nuova sezione: ${categoryName}`,
                        createdAt: meta.createdAt,
                    } as unknown as T;
                    
                    latestItemResult = { item: syntheticItem, categoryName };
                }
            }
        });
    }
    
    return latestItemResult;
};


const WelcomeBanner = () => (
    <div 
      className="p-8 rounded-xl text-white shadow-lg"
      style={{ background: 'linear-gradient(135deg, var(--c-primary-light), var(--c-primary))' }}
    >
      <h2 className="text-4xl font-bold">Servizio Digital - Demand extrasanità</h2>
      <p className="mt-2 text-lg opacity-90">Qui trovate una panoramica delle ultime novità sulla piattaforma!</p>
    </div>
);

const DashboardApp: React.FC<DashboardAppProps> = ({
    isReadOnly, currentUser, onlineUsers, setView, handleNavigate
}) => {
    const { servicesData, notifications } = useData();
    const allServicesData = servicesData;

    const latestUpdates = React.useMemo(() => ({
        tickets: getLatestItem<Ticket>(allServicesData.tickets),
        procedures: getLatestItem<Procedura>(allServicesData.procedures),
        guidelines: getLatestItem<Guideline>(allServicesData.guidelines),
        sanita: getLatestItem<UsefulContent>(allServicesData.sanita),
        documentArchive: getLatestItem<StoredFile | UsefulContent>(allServicesData.documentArchive),
        vademecum: getLatestItem<UsefulContent>(allServicesData.vademecum),
        belvedere: getLatestItem<Ticket | UsefulContent>(allServicesData.belvedere),
        newsArchive: getLatestItem<NewsArticle>(allServicesData.newsArchive),
    }), [allServicesData]);

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
                        latestUpdates={latestUpdates}
                        currentUser={currentUser}
                        handleNavigate={handleNavigate}
                    />
                     {isReadOnly && notifications.length > 0 && (
                        <NotificationsList 
                            notifications={notifications}
                            currentUser={currentUser}
                            onNotificationClick={(notification) => handleNavigate(notification)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default DashboardApp;

// Add a simple fade-in animation for the dashboard.
// This is a side effect, but it's a common pattern for simple one-off styles.
// Making sure it's only run once.
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
