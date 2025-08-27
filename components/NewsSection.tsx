

import React, { useState, useCallback } from 'react';
import { NewsArticle, UserProfile } from '../types';
import { PlusCircle, Edit, Trash2, Star, FilePlus2, AlertTriangle } from 'lucide-react';
import NewsModal from './NewsModal';
import { useData } from '../contexts/DataContext';
import FeaturedSwapModal from './FeaturedSwapModal';

interface NewsSectionProps {
    currentUser: UserProfile | null;
    isReadOnly: boolean;
    onArticleClick: (article: NewsArticle) => void;
}

const NewsSection: React.FC<NewsSectionProps> = ({ currentUser, isReadOnly, onArticleClick }) => {
    const { servicesData, saveServiceData } = useData();
    const [newsModal, setNewsModal] = useState<{ isOpen: boolean, article: NewsArticle | null }>({ isOpen: false, article: null });
    const [articleToHide, setArticleToHide] = useState<NewsArticle | null>(null);
    const [swapFeaturedState, setSwapFeaturedState] = useState<{ newArticle: NewsArticle, existingFeatured: NewsArticle[] } | null>(null);

    const newsData: NewsArticle[] = servicesData.newsArchive?.data || [];
    
    const news: NewsArticle[] = newsData
        .filter((a: NewsArticle) => a.isVisibleOnDashboard !== false)
        .sort((a: NewsArticle, b: NewsArticle) => {
             if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
             return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        });
    
    const onSaveNewsArticle = async (article: NewsArticle) => {
        if (isReadOnly || !currentUser) return;

        const isNew = !article.id;
        const finalArticle = { 
            ...article, 
            id: isNew ? `news-${Date.now()}` : article.id,
            author: article.author || currentUser.name, 
            createdAt: article.createdAt || new Date().toISOString(),
            isVisibleOnDashboard: article.isVisibleOnDashboard !== false,
        };
        
        // Featured logic
        if (finalArticle.isFeatured) {
            const currentlyFeatured = newsData.filter(a => a.isFeatured && a.id !== finalArticle.id);
            if (currentlyFeatured.length >= 3) {
                setSwapFeaturedState({ newArticle: finalArticle, existingFeatured: currentlyFeatured });
                return; // Stop saving until user makes a choice
            }
        }
        
        let updatedNews: NewsArticle[];
        if (isNew) {
             updatedNews = [finalArticle, ...newsData];
        } else {
            updatedNews = newsData.map((a: NewsArticle) => a.id === article.id ? finalArticle : a);
        }
        
        const action = isNew ? 'add' : 'update';
        saveServiceData('newsArchive', updatedNews, currentUser.name, action, finalArticle.title, finalArticle.id);
    };

    const handleFeatureSwap = (articleToUnfeatureId: string) => {
        if (!swapFeaturedState || !currentUser) return;
        const { newArticle } = swapFeaturedState;
        
        let updatedNews = newsData.map(a => {
            if (a.id === articleToUnfeatureId) return { ...a, isFeatured: false };
            if (a.id === newArticle.id) return { ...newArticle, isFeatured: true };
            return a;
        });

        const isNew = !newsData.some(a => a.id === newArticle.id);
        if (isNew) {
            updatedNews.unshift(newArticle);
        }

        const action = isNew ? 'add' : 'update';
        saveServiceData('newsArchive', updatedNews, currentUser.name, action, newArticle.title, newArticle.id);
        
        setSwapFeaturedState(null);
        handleCloseNewsModal();
    };
    
    const onHideNewsArticle = async (articleId: string) => {
        if (isReadOnly || !currentUser) return;

        const articleToHide = newsData.find((a: NewsArticle) => a.id === articleId);
        if (!articleToHide) return;
        
        const updatedNews = newsData.map((a: NewsArticle) => 
            a.id === articleId ? { ...a, isVisibleOnDashboard: false } : a
        );
        
        saveServiceData('newsArchive', updatedNews, currentUser.name, 'update', `Nascosto: ${articleToHide.title}`, articleToHide.id);
        setArticleToHide(null);
    };

    const handleOpenNewsModal = useCallback((article: NewsArticle | null) => setNewsModal({ isOpen: true, article }), []);
    const handleCloseNewsModal = useCallback(() => setNewsModal({ isOpen: false, article: null }), []);
    const handleSaveNews = (article: NewsArticle) => {
        onSaveNewsArticle(article);
        // Only close modal if not interrupted by swap logic
        if (swapFeaturedState === null) {
            handleCloseNewsModal();
        }
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
                    <div key={article.id} onClick={() => onArticleClick(article)} className={`group relative flex items-start gap-4 p-3 rounded-lg cursor-pointer transition-colors ${article.isFeatured ? 'bg-yellow-50 border-l-4 border-yellow-400 hover:bg-yellow-100/70' : 'hover:bg-gray-50'}`}>
                        <img src={article.imageUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop'} alt={article.title} className="w-20 h-20 object-cover rounded-md flex-shrink-0" />
                        <div className="flex-grow">
                            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                                {article.isFeatured && <span title="In evidenza"><Star className="h-4 w-4 text-yellow-500 fill-current flex-shrink-0" /></span>}
                                {article.title}
                            </h4>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.content}</p>
                            <div className="text-xs text-gray-500 mt-2">Di {article.author} - {new Date(article.createdAt).toLocaleDateString('it-IT')}</div>
                        </div>
                        {!isReadOnly && (
                            <div className="flex-shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); handleOpenNewsModal(article); }} className="p-1.5 rounded-full hover:bg-gray-200" title="Modifica"><Edit className="h-4 w-4 text-gray-500" /></button>
                                <button onClick={(e) => { e.stopPropagation(); setArticleToHide(article); }} className="p-1.5 rounded-full hover:bg-red-100" title="Nascondi dalla dashboard"><Trash2 className="h-4 w-4 text-red-500" /></button>
                            </div>
                        )}
                    </div>
                 )) : (
                    <div className="flex flex-col items-center justify-center text-center text-gray-500 h-full py-16">
                        <FilePlus2 size={48} className="text-gray-300 mb-4" />
                        <p className="font-semibold">Ancora nessun post...</p>
                        {!isReadOnly && <p className="text-sm">siate i primi!</p>}
                    </div>
                 )}
            </div>

             {newsModal.isOpen && (
                <NewsModal
                    newsArticle={newsModal.article}
                    onClose={handleCloseNewsModal}
                    onSave={handleSaveNews}
                    isReadOnly={isReadOnly}
                />
            )}
            
            {articleToHide && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setArticleToHide(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma</h2>
                        <p className="text-gray-600 mb-6">
                            Vuoi nascondere il post <strong>"{articleToHide.title}"</strong> dalla dashboard? Potrai ripristinarlo dall'archivio.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setArticleToHide(null)} className="btn btn-secondary">Annulla</button>
                            <button onClick={() => onHideNewsArticle(articleToHide.id)} className="btn bg-red-600 hover:bg-red-700 text-white">
                                <Trash2 className="w-5 w-5"/> Nascondi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {swapFeaturedState && (
                <FeaturedSwapModal
                    newArticle={swapFeaturedState.newArticle}
                    existingFeatured={swapFeaturedState.existingFeatured}
                    onCancel={() => setSwapFeaturedState(null)}
                    onConfirm={handleFeatureSwap}
                />
            )}
        </div>
    );
};

export default NewsSection;
