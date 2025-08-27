import React, { useState, useRef, useEffect } from 'react';
import { BannerItem } from '../types';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface BannerModalProps {
    banner: BannerItem | null;
    bannersCount: number;
    onClose: () => void;
    onSave: (banner: BannerItem) => void;
    onDelete: (bannerId: string) => void;
}

const BannerModal: React.FC<BannerModalProps> = ({ banner, bannersCount, onClose, onSave, onDelete }) => {
    const [formData, setFormData] = useState<Partial<BannerItem>>(
        banner || { title: '', description: '', imageUrl: '', link: '' }
    );
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.description || !formData.imageUrl) {
            alert("Titolo, Descrizione e URL Immagine sono obbligatori.");
            return;
        }
        onSave(formData as BannerItem);
    };

    const inputClasses = "block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-12">
            <div ref={modalRef} className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
                    <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800">Gestisci Banner</h3>
                        <p className="text-sm text-gray-500">Aggiungi o modifica un banner. {bannersCount > 0 ? `Ci sono ${bannersCount} banner.` : ''}</p>
                    </div>
                    <div className="p-6 space-y-4 border-t overflow-y-auto flex-grow">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                            <input type="text" id="title" value={formData.title} onChange={handleChange} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                            <textarea id="description" value={formData.description} onChange={handleChange} rows={3} className={inputClasses} required />
                        </div>
                        <div>
                            <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-1">URL Immagine</label>
                            <input type="url" id="imageUrl" value={formData.imageUrl} onChange={handleChange} className={inputClasses} placeholder="https://..." required />
                        </div>
                         <div>
                            <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-1">URL Link (Opzionale)</label>
                            <input type="url" id="link" value={formData.link || ''} onChange={handleChange} className={inputClasses} placeholder="https://..." />
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 flex justify-between items-center mt-auto border-t">
                        <div>
                            {banner && (
                                <button onClick={() => onDelete(banner.id!)} type="button" className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 text-sm font-medium rounded-md hover:bg-red-200">
                                    <Trash2 className="h-4 w-4"/>
                                    Elimina
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300">Annulla</button>
                            <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                               {banner ? <Edit className="h-4 w-4"/> : <Plus className="h-4 w-4"/>}
                               {banner ? 'Salva Modifiche' : 'Aggiungi Banner'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BannerModal;