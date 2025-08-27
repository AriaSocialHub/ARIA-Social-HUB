import React, { useState, useRef, useEffect, useCallback } from 'react';
import { NewsArticle } from '../types';
import { Check, X, UploadCloud, Trash2, Loader2, Star } from 'lucide-react';
import ImageUploader from './ImageUploader';


// --- NewsModal Component ---
interface NewsModalProps {
    newsArticle: NewsArticle | null;
    onClose: () => void;
    onSave: (article: NewsArticle) => void;
    isReadOnly: boolean;
}

const NewsModal: React.FC<NewsModalProps> = ({ newsArticle, onClose, onSave, isReadOnly }) => {
    const [formData, setFormData] = useState<Partial<NewsArticle>>(
        newsArticle || { title: '', content: '', imageUrl: null, isFeatured: false }
    );
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Scroll to the top of the page when the modal opens to ensure it's visible.
        window.scrollTo({ top: 0, behavior: 'smooth' });

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

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, isFeatured: e.target.checked }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (!formData.title || !formData.content) {
            alert("Titolo e contenuto sono obbligatori.");
            return;
        }
        onSave(formData as NewsArticle);
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-12">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-semibold text-gray-800">{newsArticle ? 'Modifica Notizia' : 'Crea Nuova Notizia'}</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                            <input type="text" id="title" value={formData.title} onChange={handleChange} className="form-input" required readOnly={isReadOnly} />
                        </div>
                        <div>
                            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">Contenuto</label>
                            <textarea id="content" value={formData.content} onChange={handleChange} rows={6} className="form-input" required readOnly={isReadOnly} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Immagine (Opzionale)</label>
                            <ImageUploader
                                currentImageUrl={formData.imageUrl || null}
                                onImageUploaded={(dataUrl) => {
                                    if(!isReadOnly) setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
                                }}
                            />
                        </div>
                        <div className="flex items-center">
                            <label htmlFor="isFeatured" className={`flex items-center ${isReadOnly ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        id="isFeatured"
                                        checked={!!formData.isFeatured}
                                        onChange={handleCheckboxChange}
                                        disabled={isReadOnly}
                                        className="appearance-none h-5 w-5 border border-gray-300 rounded-sm bg-white checked:bg-yellow-500 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-gray-200"
                                    />
                                    {!!formData.isFeatured && (
                                        <Star className="absolute top-0.5 left-0.5 h-4 w-4 text-white pointer-events-none" />
                                    )}
                                </div>
                                <span className={`ml-3 text-sm font-medium ${isReadOnly ? 'text-gray-500' : 'text-gray-900'}`}>Metti in evidenza</span>
                            </label>
                        </div>
                    </div>
                    {!isReadOnly && (
                        <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t">
                            <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
                            <button type="submit" className="btn btn-primary">Salva Notizia</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default NewsModal;