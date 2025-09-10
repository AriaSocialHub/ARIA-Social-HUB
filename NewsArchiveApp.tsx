import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { NewsArticle, User, UserProfile, NavigationTarget } from './types';
import { useData } from './contexts/DataContext';
import { Search, FileText, Edit, Trash2, PlusCircle, Star, AlertTriangle, FileUp, Eye, EyeOff } from 'lucide-react';
import NewsModal from './components/NewsModal';
import NewsDetailModal from './components/NewsDetailModal';
import FeaturedSwapModal from './components/FeaturedSwapModal';
import { getAvatar, getAvatarColor } from './services/avatarRegistry';

const ArticleImage: React.FC<{ src: string | null; alt: string; className: string }> = ({ src, alt, className }) => {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        setHasError(false);
    }, [src]);

    if (!src || hasError) {
        return (
            <div className={`${className} bg-gray-100 flex items-center justify-center`} title="Nessuna immagine">
                <FileText className="w-16 h-16 text-gray-300" />
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={alt}
            className={className}
            onError={() => {
                console.warn(`[WARN] Immagine non trovata in archivio al percorso: ${src}`);
                setHasError(true);
            }}
        />
    );
};


interface NewsArchiveAppProps {
    serviceId: string;
    currentUser: UserProfile | null;
    isReadOnly: boolean;
    navigationTarget?: NavigationTarget | null;
    onNavigationComplete?: () => void;
    onUploadClick?: () => void;
}

const NewsArchiveApp: React.FC<NewsArchiveAppProps> = ({ serviceId, currentUser, isReadOnly, navigationTarget, onNavigationComplete, onUploadClick }) => {
    const { servicesData, saveServiceData, appData } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState<{ type: 'edit' | 'detail' | null, article: NewsArticle | null }>({ type: null, article: null });
    const [articleToDelete, setArticleToDelete] = useState<NewsArticle | null>(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
    const [swapFeaturedState, setSwapFeaturedState] = useState<{ newArticle: NewsArticle, existingFeatured: NewsArticle[] } | null>(null);

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

        return (
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center font-bold text-sm ${colors[colorIndex]}`} title={authorName}>
                {initial}
            </div>
        );
    };


    const allNewsData: NewsArticle[] = servicesData[serviceId]?.data || [];

    const allNews: NewsArticle[] = useMemo(() => {
         return [...allNewsData].sort((a, b) => {
            if (a.isFeatured !== b.isFeatured) return a.isFeatured ? -1 : 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    }, [allNewsData]);

    const onSaveNewsArticle = useCallback((article: NewsArticle) => {
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
            const currentlyFeatured = allNewsData.filter(a => a.isFeatured && a.id !== finalArticle.id);
            if (currentlyFeatured.length >= 3) {
                setSwapFeaturedState({ newArticle: finalArticle, existingFeatured: currentlyFeatured });
                return; // Stop saving until user makes a choice
            }
        }

        let updatedNewsArray: NewsArticle[];
        if (isNew) {
             updatedNewsArray = [finalArticle, ...allNewsData];
        } else {
            updatedNewsArray = allNewsData.map((a: NewsArticle) => a.id === article.id ? finalArticle : a);
        }
        
        const action = isNew ? 'add' : 'update';
        saveServiceData(serviceId, updatedNewsArray, currentUser.name, action, finalArticle.title, finalArticle.id);
    }, [isReadOnly, currentUser, allNewsData, serviceId, saveServiceData]);
    
    const handleFeatureSwap = (articleToUnfeatureId: string) => {
        if (!swapFeaturedState || !currentUser) return;
        const { newArticle } = swapFeaturedState;
        
        let updatedNews = allNewsData.map(a => {
            if (a.id === articleToUnfeatureId) return { ...a, isFeatured: false };
            if (a.id === newArticle.id) return { ...newArticle, isFeatured: true };
            return a;
        });

        const isNew = !allNewsData.some(a => a.id === newArticle.id);
        if (isNew) {
            updatedNews.unshift(newArticle);
        }

        const action = isNew ? 'add' : 'update';
        saveServiceData(serviceId, updatedNews, currentUser.name, action, newArticle.title, newArticle.id);
        
        setSwapFeaturedState(null);
        handleCloseModal();
    };

    const handleConfirmDelete = useCallback(() => {
        if (!articleToDelete || isReadOnly || !currentUser) return;
        
        const updatedNewsArray = allNewsData.filter((a: NewsArticle) => a.id !== articleToDelete.id);
        saveServiceData(serviceId, updatedNewsArray, currentUser.name, 'delete', articleToDelete.title, articleToDelete.id);
        setArticleToDelete(null);
        setModalState({ type: null, article: null });
    }, [articleToDelete, isReadOnly, currentUser, allNewsData, serviceId, saveServiceData]);
    
    const handleRestoreToDashboard = useCallback((articleId: string) => {
        if (isReadOnly || !currentUser) return;
        const articleToRestore = allNewsData.find((a: NewsArticle) => a.id === articleId);
        if (!articleToRestore) return;

        const updatedNewsArray = allNewsData.map((a: NewsArticle) =>
            a.id === articleId ? { ...a, isVisibleOnDashboard: true } : a
        );

        saveServiceData(serviceId, updatedNewsArray, currentUser.name, 'update', `Ripristinato: ${articleToRestore.title}`, articleToRestore.id);
    }, [isReadOnly, currentUser, allNewsData, serviceId, saveServiceData]);
    
    const toggleSelection = (articleId: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(articleId)) {
                newSet.delete(articleId);
            } else {
                newSet.add(articleId);
            }
            return newSet;
        });
    };

    const handleStartSelection = () => {
        setIsSelectionMode(true);
        setSelectedIds(new Set());
    };

    const handleCancelSelection = () => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    const handleBulkDelete = () => {
        if (isReadOnly || !currentUser || selectedIds.size === 0) return;

        const updatedNewsArray = allNewsData.filter((a: NewsArticle) => !selectedIds.has(a.id));
        
        saveServiceData(serviceId, updatedNewsArray, currentUser.name, 'delete', `${selectedIds.size} post`);

        setBulkDeleteConfirm(false);
        handleCancelSelection();
    };

    const handleCloseModal = () => setModalState({ type: null, article: null });

    const handleSaveNews = (article: NewsArticle) => {
        onSaveNewsArticle(article);
        if (!swapFeaturedState) {
            handleCloseModal();
        }
    };

    const filteredNews = useMemo(() => {
        if (!searchTerm) return allNews;
        const lowerTerm = searchTerm.toLowerCase();
        return allNews.filter(
            article => article.title.toLowerCase().includes(lowerTerm) ||
                       article.content.toLowerCase().includes(lowerTerm) ||
                       article.author.toLowerCase().includes(lowerTerm)
        );
    }, [allNews, searchTerm]);
    
    useEffect(() => {
        if (navigationTarget?.serviceId === 'newsArchive' && navigationTarget?.itemId && onNavigationComplete) {
            const targetArticle = allNews.find(a => a.id === navigationTarget.itemId);
            if(targetArticle) {
                setModalState({ type: 'detail', article: targetArticle });
            }
            onNavigationComplete();
        }
    }, [navigationTarget, onNavigationComplete, allNews]);


    return (
        <div className="animate-fadeIn">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Archivio News e Aggiornamenti</h1>
                    <p className="text-lg text-gray-600">Consulta e gestisci tutti i post pubblicati sulla dashboard.</p>
                </div>
                 {!isReadOnly && (
                    <div className="flex items-center gap-2">
                        {isSelectionMode ? (
                            <>
                                <button onClick={handleCancelSelection} className="btn btn-secondary">
                                    Annulla
                                </button>
                                <button onClick={() => setBulkDeleteConfirm(true)} disabled={selectedIds.size === 0} className="btn bg-red-600 text-white hover:bg-red-700">
                                    <Trash2 className="h-5 w-5" />
                                    <span>Elimina Selezionati ({selectedIds.size})</span>
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={handleStartSelection} className="btn btn-secondary">
                                    Seleziona
                                </button>
                                {onUploadClick && (
                                    <button onClick={onUploadClick} className="btn btn-secondary">
                                        <FileUp className="h-5 w-5" />
                                        <span>Importa da File</span>
                                    </button>
                                )}
                                <button onClick={() => setModalState({ type: 'edit', article: null })} className="btn btn-primary">
                                    <PlusCircle className="h-5 w-5" />
                                    <span>Crea Post</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="search"
                    placeholder="Cerca per titolo, contenuto o autore..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
            </div>

            <div className="space-y-6">
                {filteredNews.length > 0 ? (
                    filteredNews.map(article => {
                        const isSelected = isSelectionMode && selectedIds.has(article.id);
                        const isHidden = article.isVisibleOnDashboard === false;
                        return (
                            <div 
                                key={article.id} 
                                id={`news-article-${article.id}`} 
                                onClick={() => {
                                    if (isSelectionMode) {
                                        toggleSelection(article.id);
                                    } else {
                                        setModalState({ type: 'detail', article });
                                    }
                                }}
                                className={`group relative bg-white border rounded-lg p-6 transition-all duration-200 
                                  ${isSelectionMode ? 'cursor-pointer' : 'hover:shadow-md cursor-pointer'} 
                                  ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'} 
                                  ${isHidden && !isSelected ? 'opacity-70' : ''}
                                  ${article.isFeatured && !isSelected ? 'bg-yellow-50/50 border-yellow-300' : ''}
                                `}
                            >
                                {isSelectionMode && !isReadOnly && (
                                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all bg-white z-10 pointer-events-none" style={{ borderColor: isSelected ? 'var(--c-primary)' : '#9ca3af' }}>
                                        {isSelected && <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'var(--c-primary)' }} />}
                                    </div>
                                )}
                                {!isReadOnly && !isSelectionMode && (
                                    <div className="absolute top-4 right-4 z-10 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {isHidden && (
                                            <button onClick={(e) => { e.stopPropagation(); handleRestoreToDashboard(article.id); }} className="p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm hover:bg-green-100 text-green-600" title="Ripristina su Dashboard">
                                                <Eye className="w-5 h-5"/>
                                            </button>
                                        )}
                                        <button onClick={(e) => { e.stopPropagation(); setModalState({ type: 'edit', article }); }} className="p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm hover:bg-blue-100 text-blue-600" title="Modifica">
                                            <Edit className="w-5 h-5"/>
                                        </button>
                                        <button onClick={(e) => { e.stopPropagation(); setArticleToDelete(article); }} className="p-2 bg-white/70 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-100 text-red-600" title="Elimina Permanentemente">
                                            <Trash2 className="w-5 h-5"/>
                                        </button>
                                    </div>
                                )}
                                <div className="flex flex-col sm:flex-row items-start gap-6">
                                    <ArticleImage 
                                        src={article.imageUrl} 
                                        alt={article.title}
                                        className="w-full sm:w-48 h-48 object-cover rounded-lg flex-shrink-0"
                                    />
                                    <div className="flex-grow">
                                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                                            <span>{article.title}</span>
                                            {article.isFeatured && <span title="In evidenza"><Star className="h-5 w-5 text-yellow-500 fill-yellow-500" /></span>}
                                            {isHidden && <span title="Nascosto dalla dashboard"><EyeOff className="h-5 w-5 text-gray-500" /></span>}
                                        </h2>
                                        <div className="flex items-center gap-3 my-3">
                                            <AuthorAvatar authorName={article.author} />
                                            <div>
                                                <p className="font-semibold text-gray-800">{article.author}</p>
                                                <p className="text-xs text-gray-500">{new Date(article.createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
                                        </div>
                                        <p className="text-gray-700 mt-2 whitespace-pre-wrap line-clamp-3">{article.content}</p>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed">
                        <FileText className="h-12 w-12 mx-auto text-gray-400" />
                        <h3 className="mt-4 text-xl font-semibold text-gray-700">Nessuna notizia trovata</h3>
                        <p className="mt-1 text-gray-500">{searchTerm ? "Non ci sono post che corrispondono alla tua ricerca." : (isReadOnly ? "Nessun post presente." : "Crea un nuovo post per iniziare.")}</p>
                    </div>
                )}
            </div>
            
            {modalState.type === 'edit' && (
                <NewsModal
                    newsArticle={modalState.article}
                    onClose={handleCloseModal}
                    onSave={handleSaveNews}
                    isReadOnly={isReadOnly}
                />
            )}
            
            {modalState.type === 'detail' && modalState.article && (
                 <NewsDetailModal
                    article={modalState.article}
                    isReadOnly={isReadOnly}
                    onClose={handleCloseModal}
                    onEdit={(article) => setModalState({ type: 'edit', article })}
                    onDelete={(article) => setArticleToDelete(article)}
                />
            )}

            {swapFeaturedState && (
                <FeaturedSwapModal
                    newArticle={swapFeaturedState.newArticle}
                    existingFeatured={swapFeaturedState.existingFeatured}
                    onCancel={() => setSwapFeaturedState(null)}
                    onConfirm={handleFeatureSwap}
                />
            )}

            {articleToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setArticleToDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma Eliminazione</h2>
                        <p className="text-gray-600 mb-6">
                            Vuoi eliminare definitivamente il post <strong>"{articleToDelete.title}"</strong>? L'azione è irreversibile.
                        </p>
                        <div className="flex justify-center gap-4">
                           <button onClick={() => setArticleToDelete(null)} className="btn btn-secondary">Annulla</button>
                           <button onClick={handleConfirmDelete} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 w-5"/> Elimina</button>
                        </div>
                    </div>
                </div>
            )}
            
            {bulkDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setBulkDeleteConfirm(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma Eliminazione</h2>
                        <p className="text-gray-600 mb-6">
                            Vuoi eliminare permanentemente <strong>{selectedIds.size}</strong> post? L'azione è irreversibile.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setBulkDeleteConfirm(false)} className="btn btn-secondary">Annulla</button>
                            <button onClick={handleBulkDelete} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 w-5"/> Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default NewsArchiveApp;