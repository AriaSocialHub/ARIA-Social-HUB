import React, { useState, useEffect, useMemo } from 'react';
import { CommentPost, CommentAnalysisData } from '../../types';
import { useModalBehavior, getLocalISOString, formInput, btnPrimary, btnSecondary, card } from './helpers';
import { Save } from 'lucide-react';

const PostModal: React.FC<{ post: Partial<CommentPost> | null; onClose: () => void; onSave: (post: CommentPost) => void; isReadOnly: boolean; allPosts: CommentAnalysisData }> = ({ post, onClose, onSave, isReadOnly, allPosts }) => {
    const modalRef = useModalBehavior(onClose);
    const [formData, setFormData] = useState<Partial<CommentPost>>({
        name: post?.name || '',
        platform: post?.platform || 'Facebook',
        publicationDate: post?.publicationDate || '',
        correlationTag: post?.correlationTag || null,
    });
    const [initialComments, setInitialComments] = useState<number | undefined>();
    const [initialTimestamp, setInitialTimestamp] = useState('');

    const isEditing = !!post?.id;

    useEffect(() => {
        if (!isEditing) {
             const nowStr = getLocalISOString();
            setFormData(f => ({ ...f, publicationDate: nowStr }));
            setInitialTimestamp(nowStr);
        }
    }, [isEditing]);
    
    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadOnly || !formData.name || !formData.publicationDate) return;

        const dataPoints: import('../../types').CommentDataPoint[] = post?.dataPoints || [];
        if (!isEditing && initialComments !== undefined && initialTimestamp) {
            dataPoints.push({ totalComments: initialComments, timestamp: initialTimestamp });
        }

        const postToSave: CommentPost = {
            id: post?.id || `post_${Date.now()}`,
            name: formData.name,
            platform: formData.platform || 'Facebook',
            publicationDate: formData.publicationDate,
            correlationTag: formData.correlationTag || null,
            dataPoints,
        };
        onSave(postToSave);
        onClose();
    };

    const uniqueTags = useMemo(() => {
        const tags = new Set(allPosts.map(p => p.correlationTag).filter(Boolean));
        return Array.from(tags) as string[];
    }, [allPosts]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 pt-12">
            <div ref={modalRef} className={`${card} w-full max-w-lg`}>
                <h3 className="text-xl font-bold mb-4">{isEditing ? 'Modifica Post' : 'Nuovo Post da Analizzare'}</h3>
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="text-sm font-medium">Nome del Post</label>
                        <input type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={formInput} placeholder="Es. Lancio Prodotto X" required disabled={isReadOnly} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="platform" className="text-sm font-medium">Piattaforma</label>
                            <select id="platform" value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value})} className={formInput} required disabled={isReadOnly}>
                                <option>Facebook</option><option>Instagram</option><option>TikTok</option><option>LinkedIn</option><option>X (Twitter)</option><option>YouTube</option><option>Altro</option>
                            </select>
                        </div>
                         <div>
                            <label htmlFor="publicationDate" className="text-sm font-medium">Data Pubblicazione</label>
                            <input type="datetime-local" id="publicationDate" value={formData.publicationDate} onChange={e => setFormData({...formData, publicationDate: e.target.value})} className={formInput} required disabled={isReadOnly} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="correlationTag" className="text-sm font-medium">Tag di Correlazione (opzionale)</label>
                        <input type="text" id="correlationTag" value={formData.correlationTag || ''} onChange={e => setFormData({...formData, correlationTag: e.target.value || null})} className={formInput} placeholder="Es. NATALE2024" list="existing-tags" disabled={isReadOnly} />
                        <datalist id="existing-tags">
                            {uniqueTags.map(tag => <option key={tag} value={tag} />)}
                        </datalist>
                    </div>
                     {!isEditing && (
                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600 mb-2">Inserisci la prima rilevazione di dati (opzionale).</p>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="initialComments" className="text-sm font-medium">Commenti Iniziali</label>
                                    <input type="number" id="initialComments" value={initialComments || ''} onChange={e => setInitialComments(Number(e.target.value))} className={formInput} placeholder="Es. 25" min="0" disabled={isReadOnly} />
                                </div>
                                <div>
                                    <label htmlFor="initialTimestamp" className="text-sm font-medium">Ora Rilevazione</label>
                                    <input type="datetime-local" id="initialTimestamp" value={initialTimestamp} onChange={e => setInitialTimestamp(e.target.value)} className={formInput} disabled={isReadOnly} />
                                </div>
                            </div>
                        </div>
                     )}

                    {!isReadOnly && (
                        <div className="flex justify-end gap-3 pt-4">
                            <button type="button" onClick={onClose} className={btnSecondary}>Annulla</button>
                            <button type="submit" className={btnPrimary}><Save className="w-4 h-4" /> Salva</button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PostModal;