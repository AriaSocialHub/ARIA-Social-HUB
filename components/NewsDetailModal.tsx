import React, { useRef, useEffect, useState, useMemo } from 'react';
import { NewsArticle, User } from '../types';
import { X, Edit, Trash2, FileText, Star } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { getAvatar, getAvatarColor } from '../services/avatarRegistry';

const ArticleImage: React.FC<{ src: string | null; alt: string; className: string }> = ({ src, alt, className }) => {
    const [hasError, setHasError] = useState(false);
    useEffect(() => { setHasError(false); }, [src]);
    if (!src || hasError) {
        return <div className={`${className} bg-gray-100 flex items-center justify-center`}><FileText className="w-16 h-16 text-gray-300" /></div>;
    }
    return <img src={src} alt={alt} className={className} onError={() => setHasError(true)} />;
};

interface NewsDetailModalProps {
    article: NewsArticle;
    isReadOnly: boolean;
    onClose: () => void;
    onEdit: (article: NewsArticle) => void;
    onDelete: (article: NewsArticle) => void;
}

const NewsDetailModal: React.FC<NewsDetailModalProps> = ({ article, isReadOnly, onClose, onEdit, onDelete }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const { appData } = useData();

    const usersMap = useMemo(() => new Map(Object.values(appData.users || {}).map((u: User) => [u.name, u])), [appData.users]);
    
    const AuthorAvatar: React.FC<{ authorName: string | null }> = ({ authorName }) => {
        if (!authorName) return null;
        const user = usersMap.get(authorName);
        if (user && user.avatar) {
            const AvatarIcon = getAvatar(user.avatar);
            const color = getAvatarColor(user.avatar);
            return (
                <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-100" title={authorName}>
                    <AvatarIcon className="w-6 h-6" style={{ color }} />
                </div>
            );
        }
        
        const initial = authorName.charAt(0).toUpperCase();
        const colorIndex = (authorName.charCodeAt(0) || 0) % 5;
        const colors = [
            'bg-red-200 text-red-800', 'bg-blue-200 text-blue-800', 'bg-green-200 text-green-800',
            'bg-yellow-200 text-yellow-800', 'bg-purple-200 text-purple-800',
        ];
        return <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${colors[colorIndex]}`} title={authorName}>{initial}</div>;
    };


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
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 p-4 pt-12">
            <div ref={modalRef} className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col">
                <div className="relative">
                    <ArticleImage
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-64 object-cover rounded-t-xl"
                    />
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8 flex-grow">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        {article.title}
                        {article.isFeatured && <span title="In evidenza"><Star className="h-6 w-6 text-yellow-500 fill-yellow-500" /></span>}
                    </h1>

                    <div className="flex items-center gap-3 my-4 pb-4 border-b border-gray-100">
                        <AuthorAvatar authorName={article.author} />
                        <div>
                            <p className="font-semibold text-gray-800">{article.author}</p>
                            <p className="text-sm text-gray-500">{new Date(article.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>

                    <p className="text-gray-700 text-base leading-relaxed whitespace-pre-wrap">
                        {article.content}
                    </p>
                </div>

                {!isReadOnly && (
                    <div className="px-8 py-4 bg-gray-50 flex justify-end gap-3 border-t sticky bottom-0 rounded-b-xl">
                        <button onClick={() => onEdit(article)} className="btn btn-secondary">
                            <Edit className="h-4 w-4" /> Modifica
                        </button>
                        <button onClick={() => onDelete(article)} className="btn bg-red-100 text-red-700 hover:bg-red-200 border-red-200">
                            <Trash2 className="h-4 w-4" /> Elimina
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsDetailModal;