import React from 'react';
import { Campaign } from '../types';
import { Pencil, Trash2, Moon, Link, Facebook, Instagram, Linkedin, Twitter, Music } from 'lucide-react';

const iconMap: Record<string, React.FC<any>> = { Facebook, Instagram, TikTok: Music, Linkedin, X: Twitter };
const iconColorMap: Record<string, string> = { Facebook: '#1877F2', Instagram: '#E4405F', TikTok: '#EE1D52', Linkedin: '#0A66C2', X: '#000000' };

interface CampaignsListProps {
  campaigns: Campaign[];
  isReadOnly: boolean;
  isArchive: boolean;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('it-IT');
};

const CampaignsList: React.FC<CampaignsListProps> = ({ campaigns, isReadOnly, isArchive, onEdit, onDelete }) => {
    const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());

    const title = isArchive ? "Elenco Campagne Terminate" : "Elenco Campagne Attive";
    const emptyMessage = isArchive ? "Nessuna campagna archiviata" : "Nessuna campagna attiva inserita";

    return (
        <section className="bg-white rounded-xl shadow-sm border border-gray-300">
            <div className="p-6 border-b">
                <h2 className="text-2xl font-semibold text-gray-800">{title}</h2>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Titolo</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Anteprima</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Periodo</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Campo jolly</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Canale</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Dark</th>
                            <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Link</th>
                            {!isReadOnly && <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Azioni</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {sortedCampaigns.length === 0 ? (
                            <tr>
                                <td colSpan={isReadOnly ? 7 : 8} className="text-center py-8 text-gray-500">{emptyMessage}</td>
                            </tr>
                        ) : (
                            sortedCampaigns.map(campaign => {
                                const Icon = iconMap[campaign.channel];
                                const color = iconColorMap[campaign.channel] || 'currentColor';
                                return (
                                <tr key={campaign.id} className="hover:bg-blue-50 transition-colors duration-150">
                                    <td className="px-4 py-2 text-sm text-gray-900 leading-tight">{campaign.title || ''}</td>
                                    <td className="px-4 py-2 text-center leading-tight">
                                        {campaign.image && <img src={campaign.image || ''} alt="Anteprima" className="w-12 h-12 object-cover mx-auto rounded-lg border border-gray-200" />}
                                    </td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-900 leading-tight">{formatDate(campaign.start)} - {formatDate(campaign.end)}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-900 leading-tight">{campaign.type || ''}</td>
                                    <td className="px-4 py-2 text-sm text-center text-gray-900 leading-tight">
                                        <div className="flex items-center justify-center gap-2">
                                            {Icon && <Icon className="w-4 h-4" style={{color: color}} />}
                                            <span>{campaign.channel || ''}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-2 text-center leading-tight">
                                        {campaign.dark && <Moon className="h-4 w-4 mx-auto text-gray-700 fill-current" />}
                                    </td>
                                    <td className="px-4 py-2 text-center leading-tight">
                                        {campaign.link && <a href={campaign.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1.5">
                                            <Link className="h-3 w-3" /> Link
                                        </a>}
                                    </td>
                                    {!isReadOnly && (
                                        <td className="px-4 py-2 text-center leading-tight">
                                            <div className="flex justify-center space-x-2">
                                                <button onClick={() => onEdit(campaign)} className="p-1.5 bg-white border border-gray-200 text-yellow-600 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors" title="Modifica">
                                                    <Pencil className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onDelete(campaign.id)} className="p-1.5 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors" title="Elimina">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            )})
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default CampaignsList;