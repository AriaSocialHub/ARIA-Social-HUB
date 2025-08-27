import React, { useState, useRef } from 'react';
import { NewsArticle } from '../types';
import { AlertTriangle, Star } from 'lucide-react';

interface FeaturedSwapModalProps {
    newArticle: NewsArticle;
    existingFeatured: NewsArticle[];
    onCancel: () => void;
    onConfirm: (articleIdToUnfeature: string) => void;
}

const FeaturedSwapModal: React.FC<FeaturedSwapModalProps> = ({ newArticle, existingFeatured, onCancel, onConfirm }) => {
    const [selectedToUnfeature, setSelectedToUnfeature] = useState<string | null>(null);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleSubmit = () => {
        if (selectedToUnfeature) {
            onConfirm(selectedToUnfeature);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onCancel}>
            <div ref={modalRef} className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="text-center">
                    <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Limite Notizie in Evidenza Raggiunto</h2>
                    <p className="text-gray-600 mb-6">
                        Puoi avere un massimo di 3 notizie in evidenza. Per mettere in evidenza "<strong>{newArticle.title}</strong>", seleziona quale delle seguenti notizie rimuovere dall'evidenza.
                    </p>
                </div>
                
                <div className="space-y-3 my-6">
                    {existingFeatured.map(article => (
                        <label
                            key={article.id}
                            className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${selectedToUnfeature === article.id ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                            <input
                                type="radio"
                                name="unfeature-selection"
                                checked={selectedToUnfeature === article.id}
                                onChange={() => setSelectedToUnfeature(article.id)}
                                className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                            />
                            <div className="ml-4 flex-grow">
                                <p className="font-semibold text-gray-800">{article.title}</p>
                                <p className="text-xs text-gray-500">di {article.author}</p>
                            </div>
                            <Star className="h-5 w-5 text-yellow-500 fill-current flex-shrink-0" />
                        </label>
                    ))}
                </div>

                <div className="flex justify-end gap-4">
                    <button onClick={onCancel} className="btn btn-secondary">Annulla</button>
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedToUnfeature}
                        className="btn btn-primary"
                    >
                        Conferma e Sostituisci
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FeaturedSwapModal;
