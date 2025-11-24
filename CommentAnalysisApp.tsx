import React, { useState, useCallback, useMemo } from 'react';
import { CommentPost, CommentAnalysisData, UserProfile } from './types';
import { Search, PlusCircle, Inbox, ClipboardList, Check } from 'lucide-react';
import { useData } from './contexts/DataContext';
import { btnPrimary, btnSecondary, formInput, getPlatformIcon } from './components/comment-analysis/helpers';
import PostDetailView from './components/comment-analysis/PostDetailView';
import PostComparisonView from './components/comment-analysis/PostComparisonView';
import PostModal from './components/comment-analysis/PostModal';
import { calculateAllMetrics, getTrendInfo } from './components/comment-analysis/helpers';
import { PieChart, BarChartHorizontal, Edit, Trash2 } from 'lucide-react';


interface CommentAnalysisAppProps {
    serviceId: string;
    isReadOnly: boolean;
    currentUser: UserProfile | null;
}

const CommentAnalysisApp: React.FC<CommentAnalysisAppProps> = ({ isReadOnly, serviceId, currentUser }) => {
    const { servicesData, saveServiceData } = useData();
    const posts: CommentAnalysisData = servicesData[serviceId]?.data || [];
    
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const [isPostModalOpen, setPostModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Partial<CommentPost> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const [isComparing, setIsComparing] = useState(false);
    const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set());
    const [comparisonPosts, setComparisonPosts] = useState<CommentAnalysisData | null>(null);

    const handleSavePost = (postToSave: CommentPost) => {
        if (isReadOnly || !currentUser) return;
        const existing = posts.find(p => p.id === postToSave.id);
        let newPosts;
        if (existing) {
            newPosts = posts.map(p => p.id === postToSave.id ? postToSave : p);
        } else {
            newPosts = [...posts, postToSave];
        }
        const action = existing ? 'update' : 'add';
        saveServiceData(serviceId, newPosts, currentUser.name, action, postToSave.name, postToSave.id);
    };

    const handleDeletePost = (postId: string) => {
        if (isReadOnly || !currentUser) return;
        const postToDelete = posts.find(p => p.id === postId);
        if (!postToDelete) return;

        if (window.confirm("Sei sicuro di voler eliminare questo post e tutte le sue rilevazioni?")) {
            const newPosts = posts.filter(p => p.id !== postId);
            saveServiceData(serviceId, newPosts, currentUser.name, 'delete', postToDelete.name, postId);
            if (selectedPostId === postId) {
                setSelectedPostId(null);
            }
        }
    };

    const handleUpdatePost = (updatedPost: CommentPost) => {
        if (isReadOnly || !currentUser) return;
        const newPosts = posts.map(p => (p.id === updatedPost.id ? updatedPost : p));
        const originalPost = posts.find(p => p.id === updatedPost.id);
        const changeDescription = originalPost && originalPost.dataPoints.length !== updatedPost.dataPoints.length
            ? `Rilevazioni per "${updatedPost.name}"`
            : `Dettagli per "${updatedPost.name}"`;
        saveServiceData(serviceId, newPosts, currentUser.name, 'update', changeDescription, updatedPost.id);
    };
    
    const handleToggleComparisonSelection = (postId: string) => {
        const newSelection = new Set(selectedForComparison);
        if (newSelection.has(postId)) {
            newSelection.delete(postId);
        } else {
            newSelection.add(postId);
        }
        setSelectedForComparison(newSelection);
    };

    const handleStartComparison = () => {
        if (selectedForComparison.size < 2) {
            alert("Seleziona almeno due post da confrontare.");
            return;
        }
        const toCompare = posts.filter(p => selectedForComparison.has(p.id));
        setComparisonPosts(toCompare);
        setIsComparing(false);
    };

    const handleCancelComparison = () => {
        setIsComparing(false);
        setSelectedForComparison(new Set());
    };

    const filteredPosts = useMemo(() => {
        if (!searchTerm) return posts;
        const lowerSearch = searchTerm.toLowerCase();
        return posts.filter(p => p.name.toLowerCase().includes(lowerSearch) || p.platform.toLowerCase().includes(lowerSearch) || p.correlationTag?.toLowerCase().includes(lowerSearch));
    }, [posts, searchTerm]);

    const selectedPost = useMemo(() => posts.find(p => p.id === selectedPostId), [posts, selectedPostId]);
    
    if (comparisonPosts) {
        return <PostComparisonView posts={comparisonPosts} onBack={() => { setComparisonPosts(null); setSelectedForComparison(new Set()); }} />
    }
    if (selectedPost) {
        return <PostDetailView post={selectedPost} onBack={() => setSelectedPostId(null)} onUpdatePost={handleUpdatePost} isReadOnly={isReadOnly} />
    }
    
    return (
        <div className="space-y-6">
            <div className="flex flex-wrap gap-4 items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Trend Commenti</h1>
                    <p className="text-gray-600">Analizza la velocità e il trend dei commenti dei post social.</p>
                </div>
                <div className="flex gap-2">
                    {isComparing ? (
                        <>
                            <button className={btnSecondary} onClick={handleCancelComparison}>Annulla</button>
                            <button className={btnPrimary} onClick={handleStartComparison} disabled={selectedForComparison.size < 2}>
                                Confronta ({selectedForComparison.size})
                            </button>
                        </>
                    ) : (
                        !isReadOnly && (
                            <>
                                <button className={btnSecondary} onClick={() => setIsComparing(true)} disabled={posts.length < 2}>
                                    <ClipboardList className="w-5 h-5"/> Confronta Post
                                </button>
                                <button className={btnPrimary} onClick={() => { setEditingPost(null); setPostModalOpen(true); }}>
                                    <PlusCircle className="w-5 h-5"/> Nuovo Post
                                </button>
                            </>
                        )
                    )}
                </div>
            </div>
            
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Cerca per nome, piattaforma o tag..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className={`${formInput} pl-10`} />
            </div>

            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...filteredPosts].sort((a,b) => new Date(b.publicationDate).getTime() - new Date(a.publicationDate).getTime()).map(post => {
                    const metrics = calculateAllMetrics(post);
                    const TrendInfo = getTrendInfo(metrics.trend);
                    const totalComments = post.dataPoints.length > 0 ? [...post.dataPoints].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].totalComments : 0;
                    const isSelected = isComparing && selectedForComparison.has(post.id);

                    return (
                        <div 
                            key={post.id}
                            className={`group bg-white p-6 rounded-xl shadow-sm border border-gray-300 relative flex flex-col justify-between transition-all duration-200 cursor-pointer ${isSelected ? 'ring-2 ring-blue-500 shadow-blue-200/50' : 'hover:shadow-md hover:bg-blue-50/20 hover:border-blue-400'}`} 
                            onClick={() => {
                                if (isComparing) {
                                    handleToggleComparisonSelection(post.id);
                                } else {
                                    setSelectedPostId(post.id);
                                }
                            }}
                        >
                            {isComparing && (
                                <div className={`absolute top-4 right-4 h-6 w-6 rounded-full flex items-center justify-center border-2 transition-all ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-400'}`}>
                                    {isSelected && <Check className="w-4 h-4 text-white"/>}
                                </div>
                            )}
                            
                            {/* Card Content */}
                            <div>
                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-bold text-lg text-gray-800 leading-tight truncate" title={post.name}>{post.name}</h3>
                                        <p className="text-sm text-gray-500 flex items-center gap-1.5">{getPlatformIcon(post.platform)} {post.platform}</p>
                                    </div>
                                    {post.correlationTag && !isComparing && (
                                        <div className="text-xs bg-purple-100 text-purple-700 font-semibold px-2 py-1 rounded-full flex-shrink-0">{post.correlationTag}</div>
                                    )}
                                </div>

                                {/* Main Metric & Trend */}
                                <div className="text-center my-6">
                                    <p className="text-gray-600 text-sm">Velocità Recente (c/min)</p>
                                    <p className="font-bold text-gray-800 text-5xl my-1">{metrics.recentVelocityPerMinute.toFixed(2)}</p>
                                     <div className={`inline-flex items-center gap-2 py-1 px-3 mt-2 rounded-full text-base font-bold ${TrendInfo.color} ${TrendInfo.color.replace('text', 'bg').replace('-500', '-100')}`}>
                                        <TrendInfo.icon className="w-5 h-5"/> 
                                        <span>{TrendInfo.text}</span>
                                    </div>
                                </div>

                                {/* Secondary Metrics */}
                                <div className="grid grid-cols-2 gap-4 text-center mt-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                            <PieChart size={16} />
                                            <span>Commenti Totali</span>
                                        </div>
                                        <p className="font-bold text-xl text-gray-800 mt-1">{totalComments}</p>
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                                            <BarChartHorizontal size={16} />
                                            <span>Picco (c/min)</span>
                                        </div>
                                        <p className="font-bold text-xl text-gray-800 mt-1">{metrics.peakVelocityPerMinute.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            {!isReadOnly && !isComparing && (
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={(e) => { e.stopPropagation(); setEditingPost(post); setPostModalOpen(true); }} className="p-2 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 rounded-full shadow-sm transition-all" title="Modifica"><Edit className="w-4 h-4"/></button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeletePost(post.id); }} className="p-2 bg-white border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-300 rounded-full shadow-sm transition-all" title="Elimina"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            )}
                        </div>
                    );
                })}
                </div>
            ) : (
                <div className={`bg-white p-6 rounded-xl shadow-sm border text-center col-span-full py-16`}>
                    <Inbox className="w-12 h-12 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-xl font-semibold">Nessun post da analizzare</h3>
                    <p className="mt-2 text-gray-500">Aggiungi un nuovo post per iniziare a monitorare i commenti.</p>
                </div>
            )}

            {isPostModalOpen && <PostModal post={editingPost} onClose={() => setPostModalOpen(false)} onSave={handleSavePost} isReadOnly={isReadOnly} allPosts={posts} />}
        </div>
    );
};

export default CommentAnalysisApp;