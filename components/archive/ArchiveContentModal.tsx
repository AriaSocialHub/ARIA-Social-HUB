import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArchiveItem, NavigationTarget, NotificationItem } from '../../types';
import { X, Calendar, Search, ExternalLink, Eye } from 'lucide-react';

const INTERNAL_DOC_COLORS: Record<string, string> = {
    'Ticket Utili': '#3B82F6',
    'Procedure': '#10B981',
    'Linee Guida': '#8B5CF6',
    'Tematiche Sanitarie': '#EF4444',
    'Falco Pellegrino': '#F97316',
    'Vademecum': '#06B6D4',
    'Belvedere': '#F59E0B'
};

interface ArchiveContentModalProps {
    item: ArchiveItem;
    onClose: () => void;
    onNavigate?: (target: NavigationTarget | NotificationItem) => void;
}

const ArchiveContentModal: React.FC<ArchiveContentModalProps> = ({ item, onClose, onNavigate }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [onClose]);

    const highlightedContent = useMemo(() => {
        if (!searchTerm.trim()) return item.testo;
        
        const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = item.testo.split(regex);
        
        return parts.map((part, i) => 
            regex.test(part) ? <span key={i} className="bg-yellow-300 text-black font-semibold">{part}</span> : part
        );
    }, [item.testo, searchTerm]);

    const isInternal = !!item.internal_service_id;
    const sourceLabel = item.source as string;
    const themeColor = isInternal ? (INTERNAL_DOC_COLORS[sourceLabel] || '#3b82f6') : (item.source === 'LN' ? '#2D9C92' : '#04434E');

    const handleActionClick = () => {
        if (isInternal && onNavigate) {
            onNavigate({
                serviceId: item.internal_service_id as any,
                categoryName: item.macro_area,
                itemId: String(item.id)
            });
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start p-4 pt-10 animate-fadeIn overflow-y-auto pointer-events-none z-[10000]">
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl min-h-[60vh] flex flex-col relative overflow-hidden my-auto pointer-events-auto border-t-8" style={{ borderTopColor: themeColor }}>
                
                {/* Header */}
                <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start bg-gray-50 shrink-0 gap-4">
                    <div className="flex-grow pr-4">
                        <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold text-white mb-2" style={{ backgroundColor: themeColor }}>
                            {sourceLabel}
                        </div>
                        <h2 className={`text-2xl font-bold leading-tight`} style={{ color: themeColor }}>{item.titolo}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Calendar size={14} />
                            <span>Ultimo agg: {item.data_ultimo_aggiornamento_informazioni}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                        {isInternal ? (
                            <button onClick={handleActionClick} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm text-white hover:brightness-110`} style={{ backgroundColor: themeColor }}>
                                <Eye size={16} /> Vedi voce
                            </button>
                        ) : (
                            <a href={item.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all font-semibold text-sm text-white hover:brightness-110`} style={{ backgroundColor: themeColor }}>
                                <ExternalLink size={16} /> Pagina Originale
                            </a>
                        )}
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={24} className="text-gray-600" />
                        </button>
                    </div>
                </div>

                {/* Search Bar within Modal */}
                <div className="px-6 py-3 border-b bg-white flex items-center gap-2 shrink-0 sticky top-0 z-10 shadow-sm">
                    <Search className="text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Cerca nel testo..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full p-2 text-sm focus:outline-none"
                        autoFocus
                    />
                </div>

                {/* Scrollable Content */}
                <div className="p-8 overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed text-lg flex-grow">
                    {highlightedContent}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex justify-end items-center shrink-0">
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveContentModal;