
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { ArchiveItem } from '../../types';
import { X, Calendar, Search, ExternalLink } from 'lucide-react';

interface ArchiveContentModalProps {
    item: ArchiveItem;
    onClose: () => void;
}

const ArchiveContentModal: React.FC<ArchiveContentModalProps> = ({ item, onClose }) => {
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

    const isLNItem = item.source === 'LN';
    const buttonClass = isLNItem 
        ? 'bg-[#2D9C92] text-white hover:bg-[#20756d]' 
        : 'bg-[#04434E] text-white hover:bg-[#2D9C92]';
    const titleColor = isLNItem ? 'text-[#2D9C92]' : 'text-[#04434E]';

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex justify-center items-start p-4 pt-10 animate-fadeIn overflow-y-auto pointer-events-none">
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl min-h-[60vh] flex flex-col relative overflow-hidden my-auto pointer-events-auto">
                
                {/* Header */}
                <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start bg-gray-50 shrink-0 gap-4">
                    <div className="flex-grow pr-4">
                        <h2 className={`text-2xl font-bold ${titleColor} leading-tight`}>{item.titolo}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                            <Calendar size={14} />
                            <span>Ultimo agg: {item.data_ultimo_aggiornamento_informazioni}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 self-end sm:self-start shrink-0">
                        <a href={item.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-semibold text-sm ${buttonClass}`}>
                            <ExternalLink size={16} /> Pagina Originale
                        </a>
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

                {/* Footer (Simplified) */}
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
