import React, { useState, useEffect } from 'react';
import { CommentPost, CommentDataPoint } from '../../types';
import { useModalBehavior, getLocalISOString, formInput, btnPrimary, btnSecondary, card } from './helpers';
import { Save } from 'lucide-react';

const DataPointModal: React.FC<{
    dataPoint: CommentDataPoint | null;
    post: CommentPost;
    onClose: () => void;
    onSave: (point: CommentDataPoint, originalTimestamp?: string) => void;
}> = ({ dataPoint, post, onClose, onSave }) => {
    const modalRef = useModalBehavior(onClose);
    const [formData, setFormData] = useState<CommentDataPoint>({ timestamp: '', totalComments: 0 });
    
    const isEditing = !!dataPoint;

    useEffect(() => {
        if (isEditing) {
            setFormData(dataPoint);
        } else {
            const nowStr = getLocalISOString();
            setFormData(f => ({ ...f, timestamp: nowStr }));
        }
    }, [dataPoint, isEditing]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        
        const lastDataPoint = post.dataPoints.length > 0 ? [...post.dataPoints].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] : null;
        if (!isEditing && lastDataPoint && new Date(formData.timestamp) <= new Date(lastDataPoint.timestamp)) {
            alert('Errore: La data della nuova rilevazione non può essere precedente o uguale all\'ultima registrata.');
            return;
        }

        onSave(formData, isEditing ? dataPoint.timestamp : undefined);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 pt-12">
            <div ref={modalRef} className={`${card} w-full max-w-lg`}>
                <h3 className="text-xl font-bold mb-4">{isEditing ? 'Modifica Rilevazione' : 'Aggiungi Rilevazione'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                     <div>
                        <label htmlFor="totalComments" className="text-sm font-medium">Numero Totale Commenti</label>
                        <input type="number" id="totalComments" min="0" step="1" value={formData.totalComments || ''} onChange={e => setFormData({...formData, totalComments: Number(e.target.value)})} className={formInput} required />
                    </div>
                    <div>
                        <label htmlFor="timestamp" className="text-sm font-medium">Data e Ora Rilevazione</label>
                        <input type="datetime-local" id="timestamp" value={formData.timestamp} onChange={e => setFormData({...formData, timestamp: e.target.value})} className={formInput} required />
                    </div>
                    <div className="flex justify-end gap-3 pt-4">
                        <button type="button" onClick={onClose} className={btnSecondary}>Annulla</button>
                        <button type="submit" className={btnPrimary}><Save className="w-4 h-4" /> Salva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DataPointModal;