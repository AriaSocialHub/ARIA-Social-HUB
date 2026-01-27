import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Loader2, FileText, Calendar, Rss, Database } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { serviceMap } from '../services/registry';
import { NavigationTarget, NotificationItem } from '../types';

// Define which services are searchable and what fields to use.
const SEARCHABLE_SERVICES = [
    { id: 'tickets', textFields: ['argomento', 'richiesta', 'risoluzione'] },
    { id: 'procedures', textFields: ['casistica', 'comeAgire'] },
    { id: 'guidelines', textFields: ['casistica', 'comeAgire'] },
    { id: 'sanita', textFields: ['casistica', 'comeAgire'] },
    { id: 'documentArchive', textFields: ['casistica', 'comeAgire'] },
    { id: 'vademecum', textFields: ['casistica', 'comeAgire'] },
    { id: 'belvedere', textFields: ['argomento', 'richiesta', 'risoluzione', 'casistica', 'comeAgire'] },
    { id: 'newsArchive', textFields: ['title', 'content', 'author'] },
    { id: 'repository', textFields: ['name', 'description'] },
    { id: 'campaigns', textFields: ['title', 'type'] },
];

interface SearchableItem {
    serviceId: string;
    categoryName?: string;
    itemId: string;
    title: string;
    content: string;
}

interface SearchResult extends SearchableItem {}

interface GlobalSearchModalProps {
    handleNavigate: (targetOrNotification: NavigationTarget | NotificationItem | any) => void;
}

const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ handleNavigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [results, setResults] = useState<SearchResult[]>([]);
    const { servicesData } = useData();
    const modalRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const allSearchableData = useRef<SearchableItem[]>([]);

    useEffect(() => {
        const aggregatedData: SearchableItem[] = [];
        
        SEARCHABLE_SERVICES.forEach(serviceConfig => {
            const service = servicesData[serviceConfig.id];
            if (!service?.data) return;

            // Handle categorized data (standard resources)
            if (typeof service.data === 'object' && !Array.isArray(service.data)) {
                Object.entries(service.data).forEach(([categoryName, items]) => {
                    if (Array.isArray(items)) {
                        items.forEach((item: any) => {
                            if (item && item.id) {
                                const title = item[serviceConfig.textFields[0]] || 'Senza titolo';
                                const content = serviceConfig.textFields.slice(1).map(field => item[field]).filter(Boolean).join(' ');
                                aggregatedData.push({
                                    serviceId: serviceConfig.id,
                                    categoryName,
                                    itemId: item.id,
                                    title,
                                    content,
                                });
                            }
                        });
                    }
                });
            } 
            // Handle flat array data (News, Repo, Campaigns)
            else if (Array.isArray(service.data)) {
                service.data.forEach((item: any) => {
                    if (item && item.id) {
                        const titleField = serviceConfig.id === 'repository' ? 'name' : serviceConfig.textFields[0];
                        const title = item[titleField] || 'Senza titolo';
                        const content = serviceConfig.textFields.filter(f => f !== titleField).map(field => item[field]).filter(Boolean).join(' ');
                        aggregatedData.push({
                            serviceId: serviceConfig.id,
                            itemId: item.id,
                            title,
                            content,
                        });
                    }
                });
            }
        });
        allSearchableData.current = aggregatedData;
    }, [servicesData]);

    const openModal = useCallback(() => {
        setIsOpen(true);
        setTimeout(() => inputRef.current?.focus(), 100);
    }, []);

    const closeModal = useCallback(() => {
        setIsOpen(false);
        setSearchTerm('');
        setResults([]);
        setError(null);
    }, []);

    useEffect(() => {
        document.addEventListener('open-contextual-search', openModal);
        return () => document.removeEventListener('open-contextual-search', openModal);
    }, [openModal]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') closeModal();
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                openModal();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [closeModal, openModal]);

    const performSearch = useCallback(async (query: string) => {
        if (!query || query.length < 3) {
            setResults([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Se la query è breve, eseguiamo una ricerca locale veloce prima di quella semantica
            const localTerm = query.toLowerCase();
            const localResults = allSearchableData.current
                .filter(item => item.title.toLowerCase().includes(localTerm) || item.content.toLowerCase().includes(localTerm))
                .slice(0, 10);

            // Chiamata al motore di ricerca per ranking avanzato
            const documentsForSearch = allSearchableData.current.map(item => ({
                id: item.itemId,
                serviceId: item.serviceId,
                title: item.title,
                content: item.content
            }));

            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query,
                    documents: documentsForSearch,
                    mode: 'global'
                }),
            });

            if (response.ok) {
                const parsedResult = await response.json();
                const foundItems = (parsedResult.results || [])
                    .slice(0, 10)
                    .map((r: any) => allSearchableData.current.find(item => item.itemId === r.id && item.serviceId === r.serviceId))
                    .filter(Boolean);
                
                setResults(foundItems.length > 0 ? foundItems : localResults);
            } else {
                setResults(localResults);
            }
        } catch (error) {
            console.error("Errore nella ricerca:", error);
            setError("La ricerca ha riscontrato un problema.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(searchTerm);
        }, 300);
        return () => clearTimeout(handler);
    }, [searchTerm, performSearch]);

    const onResultClick = (result: SearchResult) => {
        handleNavigate({
            serviceId: result.serviceId,
            categoryName: result.categoryName,
            itemId: result.itemId
        });
        closeModal();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-[10001] flex justify-center items-start p-4 pt-[15vh]" onClick={closeModal}>
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isLoading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <Search className="w-5 h-5 text-gray-400" />}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cerca risorse, news, file o campagne..."
                        className="w-full pl-12 pr-12 py-5 text-lg border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-500 rounded-t-xl text-gray-900"
                    />
                    <button onClick={closeModal} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-3 bg-gray-50/50">
                    {error && <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg m-2">{error}</div>}
                    {!isLoading && searchTerm.length > 2 && results.length === 0 && (
                        <div className="p-12 text-center text-gray-500">
                             <FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                            <p className="font-semibold text-lg">Nessun risultato pertinente</p>
                            <p className="text-sm">Prova a cercare termini meno specifici.</p>
                        </div>
                    )}
                    {results.length > 0 && (
                        <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 px-3 py-2">Risultati Suggeriti (Top 10)</p>
                            {results.map(result => {
                                const service = serviceMap[result.serviceId];
                                const ServiceIcon = service?.icon || FileText;
                                return (
                                    <button 
                                        key={`${result.serviceId}-${result.itemId}`} 
                                        onClick={() => onResultClick(result)} 
                                        className="w-full text-left flex items-start gap-4 p-4 hover:bg-white hover:shadow-md hover:ring-1 hover:ring-blue-100 rounded-xl transition-all group"
                                    >
                                        <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                                            <ServiceIcon className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
                                        </div>
                                        <div className="flex-grow overflow-hidden">
                                            <div className="font-bold text-gray-800 truncate group-hover:text-blue-800 transition-colors">{result.title}</div>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                <span className="font-medium text-blue-600/70">{service?.name || 'Risorsa'}</span>
                                                {result.categoryName && (
                                                    <>
                                                        <span className="opacity-40">/</span>
                                                        <span className="truncate">{result.categoryName}</span>
                                                    </>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-400 mt-2 line-clamp-1 italic font-light">
                                                {result.content.substring(0, 120)}...
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                    {!searchTerm && (
                         <div className="p-12 text-center text-gray-400">
                             <Search className="w-16 h-16 mx-auto opacity-20 mb-4" />
                             <p className="text-sm">Digita almeno 3 caratteri per iniziare la ricerca globale</p>
                         </div>
                    )}
                </div>
                <div className="p-4 bg-gray-100 border-t flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                    <span>Archivi SQL esclusi dalla ricerca</span>
                    <div className="flex gap-4">
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 shadow-sm">ESC</kbd> Chiudi</span>
                        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-white rounded border border-gray-300 shadow-sm">↵</kbd> Seleziona</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;