import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Loader2, FileText } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { GoogleGenAI, Type } from '@google/genai';
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
];

interface SearchableItem {
    serviceId: string;
    categoryName: string;
    itemId: string;
    title: string;
    content: string;
}

interface SearchResult extends SearchableItem {
    // Add any other properties needed for display
}

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
            if (service?.data && typeof service.data === 'object') {
                Object.entries(service.data).forEach(([categoryName, items]) => {
                    if (Array.isArray(items)) {
                        items.forEach((item: any) => {
                            if (item && item.id) {
                                const title = item[serviceConfig.textFields[0]] || 'Senza titolo';
                                const content = serviceConfig.textFields.map(field => item[field]).filter(Boolean).join(' ');
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
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            
            const documentsForSearch = allSearchableData.current.map(item => ({
                id: item.itemId,
                serviceId: item.serviceId,
                categoryName: item.categoryName,
                text: `${item.title} ${item.content}`
            }));

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Basandoti sulla query di ricerca "${query}", trova i file più pertinenti dall'elenco JSON fornito. Restituisci solo un oggetto JSON con una chiave "results" che contenga un array degli oggetti originali completi dei file che corrispondono semanticamente. Includi solo i 5 risultati migliori. Non inventare risultati. Se non ci sono risultati, restituisci un array vuoto. Ecco i dati: ${JSON.stringify(documentsForSearch)}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            results: {
                                type: Type.ARRAY,
                                description: "Un array degli oggetti originali completi che sono semanticamente pertinenti.",
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        id: { type: Type.STRING },
                                        serviceId: { type: Type.STRING },
                                        categoryName: { type: Type.STRING },
                                        text: { type: Type.STRING }
                                    }
                                }
                            }
                        },
                        required: ["results"]
                    }
                }
            });

            const parsedResult = JSON.parse(response.text);
            const foundIds = new Set((parsedResult.results || []).map((r: any) => r.id));
            const finalResults = allSearchableData.current.filter(item => foundIds.has(item.itemId));

            setResults(finalResults);
        } catch (error) {
            console.error("Errore nella ricerca semantica:", error);
            setError("La ricerca non è riuscita. Riprova più tardi.");
            setResults([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(searchTerm);
        }, 500);
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
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-start p-4 pt-[15vh]" onClick={closeModal}>
            <div ref={modalRef} className="bg-white rounded-xl shadow-2xl w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        {isLoading ? <Loader2 className="w-5 h-5 text-gray-400 animate-spin" /> : <Search className="w-5 h-5 text-gray-400" />}
                    </div>
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        placeholder="Cerca in tutto l'hub..."
                        className="w-full pl-12 pr-12 py-4 text-lg border-0 border-b border-gray-200 focus:ring-0 focus:border-blue-500 rounded-t-xl"
                    />
                    <button onClick={closeModal} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-gray-100">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="max-h-[50vh] overflow-y-auto p-2">
                    {error && <div className="p-4 text-center text-red-600">{error}</div>}
                    {!isLoading && searchTerm.length > 2 && results.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                             <FileText className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                            <p className="font-semibold">Nessun risultato trovato</p>
                            <p className="text-sm">Prova con termini di ricerca diversi.</p>
                        </div>
                    )}
                    {results.length > 0 && (
                        <ul>
                            {results.map(result => {
                                const service = serviceMap[result.serviceId];
                                const ServiceIcon = service?.icon;
                                return (
                                    <li key={`${result.serviceId}-${result.itemId}`}>
                                        <button onClick={() => onResultClick(result)} className="w-full text-left flex items-start gap-4 p-3 hover:bg-gray-100 rounded-lg">
                                            {ServiceIcon && (
                                                <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                                    <ServiceIcon className="h-5 w-5 text-gray-600" />
                                                </div>
                                            )}
                                            <div className="flex-grow overflow-hidden">
                                                <div className="font-semibold text-gray-800 truncate">{result.title}</div>
                                                <div className="text-sm text-gray-500">{service.name} / {result.categoryName}</div>
                                            </div>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalSearchModal;