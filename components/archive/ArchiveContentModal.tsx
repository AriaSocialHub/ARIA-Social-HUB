
import React, { useEffect, useRef } from 'react';
import { ArchiveItem } from '../../types';
import { X, Calendar } from 'lucide-react';

interface ArchiveContentModalProps {
    item: ArchiveItem;
    onClose: () => void;
}

const ArchiveContentModal: React.FC<ArchiveContentModalProps> = ({ item, onClose }) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [onClose]);

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] p-4 animate-fadeIn">
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-[#04434E]">{item.titolo}</h2>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <Calendar size={14} />
                            <span>Ultimo agg: {item.data_ultimo_aggiornamento_informazioni}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={24} className="text-gray-500" />
                    </button>
                </div>
                <div className="p-8 overflow-y-auto whitespace-pre-wrap text-gray-800 leading-relaxed text-lg">
                    {item.testo}
                </div>
                <div className="p-4 bg-gray-50 border-t text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-[#04434E] text-white rounded-lg hover:bg-[#2D9C92] transition-colors font-semibold">
                        Chiudi
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ArchiveContentModal;
