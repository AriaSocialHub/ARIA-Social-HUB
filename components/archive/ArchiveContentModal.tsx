
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
        document.body.style.overflow = 'hidden';
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.body.style.overflow = 'unset';
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

    return (
        <div className="fixed inset-0 z-[9999] bg-black/60 flex justify-center items-center p-4 animate-fadeIn">
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden">
                
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-start bg-gray-50 shrink-0">
                    <div className="flex-grow pr-8">
                        <h2 className="text-2xl font-bold text-[#04434E]">{item.titolo}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar size={14} />
                            <span>Ultimo agg: {item.data_ultimo_aggiornamento_informazioni}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors flex-shrink-0">
                        <X size={24} className="text-gray-600" />
                    </button>
                </div>

                {/* Search Bar within Modal */}
                <div className="px-6 py-3 border-b bg-white flex items-center gap-2 shrink-0">
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
                <div className="p-8 overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed text-lg min-h-0 flex-grow">
                    {highlightedContent}
                </div>

                {/* Footer */}
                <div className="p-4 bg-gray-50 border-t flex justify-between items-center shrink-0">
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-lg hover:bg-[#2D9C92] transition-colors font-semibold">
                        <ExternalLink size={16} /> Pagina Originale
                    </a>
                    <button onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveContentModal;
