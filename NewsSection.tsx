

import React, { useState, useCallback } from 'react';
import { NewsArticle, UserProfile } from '../types';
import { PlusCircle, Edit, Trash2, Star, FilePlus2 } from 'lucide-react';
import NewsModal from './NewsModal';
import { useData } from '../../contexts/DataContext';

interface NewsSectionProps {
    currentUser: UserProfile | null;
    isReadOnly: boolean;
    onArticleClick: (article: NewsArticle) => void;
}

const NewsSection: React.FC<NewsSectionProps> = ({ currentUser, isReadOnly, onArticleClick }) => {
    const { servicesData, saveServiceData } = useData();
    const news: NewsArticle[] = (servicesData.newsArchive?.data || []).sort((a: NewsArticle, b: NewsArticle) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    const [newsModal, setNewsModal] = useState<{ isOpen: boolean, article: NewsArticle | null }>({ isOpen: false, article: null });

    const onSaveNewsArticle = async (article: NewsArticle) => {
        if (isReadOnly || !currentUser) return;
        const newsData = servicesData.newsArchive?.data || [];
        const newArticle = { ...article, author: article.author || currentUser.name, createdAt: article.createdAt || new Date().toISOString() };
        
        let updatedNews: NewsArticle[];
        const isNew = !article.id;
        if (isNew) {
             updatedNews = [{...newArticle, id: `news-${Date.now()}`}, ...newsData];
        } else {
            updatedNews = newsData.map((a: NewsArticle) => a.id === article.id ? newArticle : a);
        }
        
        const action = isNew ? 'add' : 'update';
        saveServiceData('newsArchive', updatedNews, currentUser.name, action, newArticle.title, newArticle.id);
    };
    
    const onDeleteNewsArticle = async (articleId: string) => {
        if (isReadOnly || !currentUser) return;
        if (!window.confirm("Sei sicuro di voler eliminare questa notizia?")) return;
        const newsData = servicesData.newsArchive?.data || [];
        const articleToDelete = newsData.find((a: NewsArticle) => a.id === articleId);
        if(!articleToDelete) return;

        const updatedNews = newsData.filter((a: NewsArticle) => a.id !== articleId);
        saveServiceData('newsArchive', updatedNews, currentUser.name, 'delete', articleToDelete.title, articleToDelete.id);
    };

    const handleOpenNewsModal = useCallback((article: NewsArticle | null) => setNewsModal({ isOpen: true, article }), []);
    const handleCloseNewsModal = useCallback(() => setNewsModal({ isOpen: false, article: null }), []);
    const handleSaveNews = (article: NewsArticle) => {
        onSaveNewsArticle(article);
        handleCloseNewsModal();
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-[var(--c-text-heading)]">News & Feed</h2>
                {!isReadOnly && (
                    <button onClick={() => handleOpenNewsModal(null)} className="btn btn-primary text-sm py-2 px-3">
                        <PlusCircle className="h-5 w-5" />
                        <span>Crea Post</span>
                    </button>
                )}
            </div>
            <div className="border-b border-gray-200 mb-4">
                <h3 className="py-2 text-sm font-semibold text-gray-600">Ultimi Post</h3>
            </div>
            
            <div className="flex-grow space-y-4 overflow-y-auto">
                 {news.length > 0 ? news.slice(0, 5).map(article => (
                    <div key={article.id} onClick={() => onArticleClick(article)} className="group relative flex items-start gap-4 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <img src={article.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop'} alt={article.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <h4 className="font-semibold text-gray-800">{article.title}</h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.content}</p>
                            <div className="text-xs text-gray-500 mt-2">Di {article.author} - {new Date(article.createdAt).toLocaleDateString('it-IT')}</div>
                        </div>
                        {!isReadOnly && (
                            <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenNewsModal(article); }} className="p-1.5 rounded-full hover:bg-gray-200" title="Modifica"><Edit className="h-4 w-4 text-gray-500" /></button>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteNewsArticle(article.id); }} className="p-1.5 rounded-full hover:bg-red-100" title="Elimina"><Trash2 className="h-4 w-4 text-red-500" /></button>
                            </div>
                        )}
                    </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full py-16">
                        <FilePlus2 size={48} className="text-gray-300 mb-4" />
                        <p className="font-semibold">Ancora nessun post...</p>
                        <p className="text-sm">siate i primi!</p>
                    </div>
                 )}
            </div>

             {newsModal.isOpen && (
                <NewsModal
                    newsArticle={newsModal.article}
                    onClose={handleCloseNewsModal}
                    onSave={handleSaveNews}
                />
            )}
        </div>
    );
};

export default NewsSection;