
import React, { useState, useMemo } from 'react';
import { Campaign, CampaignsData, UserProfile } from './types';
import CampaignModal from './components/CampaignModal';
import CampaignsHeader from './components/CampaignsHeader';
import CampaignsList from './components/CampaignsList';
import CampaignCalendar from './components/CampaignCalendar';
import { useData } from './contexts/DataContext';

interface CampaignsAppProps {
  serviceId: string;
  isReadOnly: boolean;
  currentUser: UserProfile | null;
}

const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const CampaignsApp: React.FC<CampaignsAppProps> = ({ serviceId, isReadOnly, currentUser }) => {
    const { servicesData, saveServiceData } = useData();
    const campaigns: CampaignsData = servicesData[serviceId]?.data || [];

    const [view, setView] = useState<'dashboard' | 'archive'>('dashboard');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

    const [channelFilter, setChannelFilter] = useState('tutti');
    const [dateFilter, setDateFilter] = useState<{ start: string; end: string } | null>(null);

    const handleAddNew = () => {
        setEditingCampaign(null);
        setIsModalOpen(true);
    };

    const handleEdit = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsModalOpen(true);
    };

    const handleDelete = (campaignId: string) => {
        if (!currentUser) return;
        const campaignToDelete = campaigns.find(c => c.id === campaignId);
        if (!campaignToDelete) return;

        const newCampaigns = campaigns.filter(c => c.id !== campaignId);
        saveServiceData(serviceId, newCampaigns, currentUser.name, 'delete', campaignToDelete.title, campaignId);
    };

    const handleSaveCampaign = (campaign: Campaign) => {
        if (!currentUser) return;
        let newCampaigns;
        const isUpdate = campaigns.some(c => c.id === campaign.id);
        if (isUpdate) { // Update existing
            newCampaigns = campaigns.map(c => c.id === campaign.id ? campaign : c);
        } else { // Add new
            newCampaigns = [...campaigns, campaign];
        }
        const action = isUpdate ? 'update' : 'add';
        saveServiceData(serviceId, newCampaigns, currentUser.name, action, campaign.title, campaign.id);
    };
    
    const todayStr = useMemo(getTodayDateString, []);

    const { activeCampaigns, archivedCampaigns } = useMemo(() => {
        return campaigns.reduce(
            (acc, campaign) => {
                if (campaign.end < todayStr) {
                    acc.archivedCampaigns.push(campaign);
                } else {
                    acc.activeCampaigns.push(campaign);
                }
                return acc;
            },
            { activeCampaigns: [] as Campaign[], archivedCampaigns: [] as Campaign[] }
        );
    }, [campaigns, todayStr]);

    const campaignsToDisplay = useMemo(() => {
        const source = view === 'archive' ? archivedCampaigns : activeCampaigns;
        if (channelFilter === 'tutti') return source;
        return source.filter(c => c.channel === channelFilter);
    }, [activeCampaigns, archivedCampaigns, view, channelFilter]);

    const MainContent = () => (
        <div className="space-y-8">
            <CampaignsList 
                campaigns={campaignsToDisplay} 
                isReadOnly={isReadOnly || view === 'archive'} 
                isArchive={view === 'archive'}
                onEdit={handleEdit} 
                onDelete={handleDelete} 
            />
            {view === 'dashboard' && (
                <CampaignCalendar
                    campaigns={activeCampaigns} // Calendar always shows active campaigns regardless of filter
                    dateFilter={dateFilter}
                    setDateFilter={setDateFilter}
                />
            )}
        </div>
    );

    return (
        <div>
            <CampaignsHeader
                isReadOnly={isReadOnly}
                view={view}
                setView={setView}
                channelFilter={channelFilter}
                setChannelFilter={setChannelFilter}
                onAddNew={handleAddNew}
            />
            
            <main className="my-6">
                <MainContent />
            </main>

            {isModalOpen && (
                <CampaignModal
                    campaign={editingCampaign}
                    onClose={() => setIsModalOpen(false)}
                    onSave={handleSaveCampaign}
                />
            )}
        </div>
    );
};

export default CampaignsApp;