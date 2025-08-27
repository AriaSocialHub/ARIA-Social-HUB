

import React from 'react';
import { PlusCircle, BookOpen, Moon, Facebook, Instagram, Linkedin, Twitter, Music } from 'lucide-react';

interface CampaignsHeaderProps {
  isReadOnly: boolean;
  view: 'dashboard' | 'archive';
  setView: (view: 'dashboard' | 'archive') => void;
  channelFilter: string;
  setChannelFilter: (filter: string) => void;
  onAddNew: () => void;
}

const CampaignsHeader: React.FC<CampaignsHeaderProps> = ({
  isReadOnly,
  view,
  setView,
  channelFilter,
  setChannelFilter,
  onAddNew
}) => {
  return (
    <>
      <section className="p-4 bg-white rounded-xl shadow-sm flex flex-wrap items-center gap-x-6 gap-y-3 border">
        <div className="flex items-center space-x-2">
          <Facebook className="w-5 h-5" style={{ color: '#1877F2' }}/>
          <span className="text-sm font-medium">Facebook</span>
        </div>
        <div className="flex items-center space-x-2">
          <Instagram className="w-5 h-5" style={{ color: '#E4405F' }}/>
          <span className="text-sm font-medium">Instagram</span>
        </div>
        <div className="flex items-center space-x-2">
          <Music className="w-5 h-5" style={{ color: '#EE1D52' }}/>
          <span className="text-sm font-medium">TikTok</span>
        </div>
        <div className="flex items-center space-x-2">
          <Linkedin className="w-5 h-5" style={{ color: '#0A66C2' }}/>
          <span className="text-sm font-medium">Linkedin</span>
        </div>
        <div className="flex items-center space-x-2">
          <Twitter className="w-5 h-5" style={{ color: '#000000' }}/>
          <span className="text-sm font-medium">X</span>
        </div>
        <div className="flex items-center space-x-2 border-l pl-4 ml-auto">
          <Moon className="w-4 h-4 fill-black" />
          <span className="text-sm font-medium">Sponsorizzata in dark</span>
        </div>
      </section>

      {!isReadOnly && (
        <section className="mt-6 p-4 bg-white rounded-xl shadow-sm flex flex-wrap items-center justify-between gap-4 border">
            <div className="flex items-center gap-2">
                <button 
                    onClick={onAddNew}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle className="h-5 w-5"/>
                    <span>Nuova Campagna</span>
                </button>
                 <button 
                    onClick={() => setView(view === 'dashboard' ? 'archive' : 'dashboard')}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-700 transition-colors"
                >
                    <BookOpen className="h-5 w-5"/>
                    <span>{view === 'dashboard' ? 'Vai ad Archivio' : 'Vai a Dashboard'}</span>
                </button>
            </div>
             <div className="flex items-center space-x-2">
              <label htmlFor="channel-filter" className="text-sm font-medium text-gray-700">Canale:</label>
              <select 
                id="channel-filter" 
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="border border-gray-300 rounded-lg p-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              >
                <option value="tutti">Tutti</option>
                <option value="Facebook">Facebook</option>
                <option value="Instagram">Instagram</option>
                <option value="TikTok">TikTok</option>
                <option value="Linkedin">Linkedin</option>
                <option value="X">X</option>
              </select>
            </div>
        </section>
      )}
    </>
  );
};

export default CampaignsHeader;