
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, Loader2, Database, ExternalLink, Copy, BookOpen, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import { loadDatabase, queryArchive, getDistinctValues, getAvailableYears } from './services/archiveService';
import { ArchiveItem } from './types';
import ArchiveContentModal from './components/archive/ArchiveContentModal';

const ArchiveConsultationApp: React.FC = () => {
    const [activeDbName, setActiveDbName] = useState<'archivio.sqlite' | 'archivio-LN.sqlite'>('archivio.sqlite');
    const [dbInstance, setDbInstance] = useState<any>(null);
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    
    // Search & Filter State
    const [filters, setFilters] = useState({
        utenti: 'Tutti',
        macro_area: 'Tutte',
        argomento: 'Tutti',
        sottocategoria: 'Tutte'
    });
    const [searchText, setSearchText] = useState('');
    const [searchScope, setSearchScope] = useState<'title' | 'content' | 'both'>('both');
    const [selectedYears, setSelectedYears] = useState<string[]>([]);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [totalResults, setTotalResults] = useState(0);
    const [results, setResults] = useState<ArchiveItem[]>([]);
    
    // Options
    const [options, setOptions] = useState({
        utenti: [] as string[],
        macro_area: [] as string[],
        argomento: [] as string[],
        sottocategoria: [] as string[],
        years: [] as string[]
    });

    const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

    // Load DB
    useEffect(() => {
        const init = async () => {
            setIsLoadingDb(true);
            setDbInstance(null);
            setResults([]);
            try {
                const res = await fetch(`/api/archiveStorage?filename=${activeDbName}`);
                if (!res.ok) throw new Error("Database not found");
                const { signedUrl } = await res.json();
                
                const db = await loadDatabase(signedUrl);
                setDbInstance(db);
                
                // Load initial independent options
                setOptions(prev => ({
                    ...prev,
                    utenti: getDistinctValues(db, 'Utenti'),
                    years: getAvailableYears(db)
                }));
                
                // Trigger initial search to show data
                const initRes = queryArchive(db, {
                    page: 1,
                    pageSize,
                    filters: { utenti: 'Tutti', macro_area: 'Tutte', argomento: 'Tutti', sottocategoria: 'Tutte' }
                });
                setResults(initRes.results);
                setTotalResults(initRes.total);

            } catch (error) {
                console.error("Failed to load DB", error);
                alert("Impossibile caricare l'archivio selezionato.");
            } finally {
                setIsLoadingDb(false);
            }
        };
        init();
        
        return () => {
            if(dbInstance) dbInstance.close();
        }
    }, [activeDbName]);

    // Hierarchical Options Updates
    useEffect(() => {
        if (!dbInstance) return;
        setOptions(prev => ({
            ...prev,
            macro_area: getDistinctValues(dbInstance, 'Macro-area', filters),
            argomento: getDistinctValues(dbInstance, 'Argomento', filters),
            sottocategoria: getDistinctValues(dbInstance, 'Sottocategoria', filters)
        }));
    }, [dbInstance, filters.utenti, filters.macro_area, filters.argomento]);

    // Perform Search / Filter
    const runQuery = useCallback(() => {
        if (!dbInstance) return;
        const res = queryArchive(dbInstance, {
            search: searchText,
            searchScope,
            years: selectedYears,
            filters,
            page,
            pageSize
        });
        setResults(res.results);
        setTotalResults(res.total);
    }, [dbInstance, searchText, searchScope, selectedYears, filters, page]);

    useEffect(() => {
        runQuery();
    }, [runQuery]);

    // Handlers
    const handleReset = () => {
        setFilters({ utenti: 'Tutti', macro_area: 'Tutte', argomento: 'Tutti', sottocategoria: 'Tutte' });
        setSearchText('');
        setSearchScope('both');
        setSelectedYears([]);
        setPage(1);
    };

    const handleYearToggle = (year: string) => {
        setSelectedYears(prev => 
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
        setPage(1);
    };

    const totalPages = Math.ceil(totalResults / pageSize);

    return (
        <div className="animate-fadeIn space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#04434E]">Consulta l'Archivio del Sito Web RL</h1>
                    <p className="text-gray-600 mt-1">Utilizza i filtri avanzati per navigare tra le informazioni archiviate.</p>
                </div>
            </div>

            {/* DB Selection */}
            <div className="flex gap-4 justify-center">
                 <button onClick={() => setActiveDbName('archivio.sqlite')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeDbName === 'archivio.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Database size={20} /> Sito RL
                </button>
                <button onClick={() => setActiveDbName('archivio-LN.sqlite')} className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeDbName === 'archivio-LN.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Database size={20} /> Lombardia Notizie
                </button>
            </div>

            {isLoadingDb && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto text-[#04434E] animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-600">Caricamento database e normalizzazione dati...</p>
                </div>
            )}

            {/* Main Interface */}
            {dbInstance && !isLoadingDb && (
                <div className="space-y-6">
                    {/* Filters Box */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5 relative">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Filter size={18}/> Filtri di Ricerca</h3>
                            <button onClick={handleReset} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded-md flex items-center gap-1 transition-colors">
                                <RotateCcw size={14} /> Reset Filtri
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <select className="form-input" value={filters.utenti} onChange={e => { setFilters(p => ({...p, utenti: e.target.value, macro_area: 'Tutte', argomento: 'Tutti'})); setPage(1); }}>
                                <option value="Tutti">Utenti (Tutti)</option>
                                {options.utenti.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <select className="form-input" value={filters.macro_area} onChange={e => { setFilters(p => ({...p, macro_area: e.target.value, argomento: 'Tutti'})); setPage(1); }} disabled={options.macro_area.length === 0}>
                                <option value="Tutte">Macro-area (Tutte)</option>
                                {options.macro_area.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                            <select className="form-input" value={filters.argomento} onChange={e => { setFilters(p => ({...p, argomento: e.target.value})); setPage(1); }} disabled={options.argomento.length === 0}>
                                <option value="Tutti">Argomento (Tutti)</option>
                                {options.argomento.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex flex-col lg:flex-row gap-6">
                            {/* Search Scope & Input */}
                            <div className="flex-grow space-y-3">
                                <div className="flex gap-4 text-sm">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="scope" checked={searchScope === 'title'} onChange={() => setSearchScope('title')} className="text-[#04434E] focus:ring-[#04434E]"/> Solo Titolo
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="scope" checked={searchScope === 'content'} onChange={() => setSearchScope('content')} className="text-[#04434E] focus:ring-[#04434E]"/> Solo Contenuto
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="scope" checked={searchScope === 'both'} onChange={() => setSearchScope('both')} className="text-[#04434E] focus:ring-[#04434E]"/> Entrambi
                                    </label>
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <input type="text" className="form-input pl-10" placeholder="Cerca per parola chiave..." value={searchText} onChange={e => { setSearchText(e.target.value); setPage(1); }} />
                                    </div>
                                </div>
                            </div>

                            {/* Year Selector */}
                            <div className="lg:w-1/3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Filtra per Anno:</p>
                                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-2 border rounded-md bg-gray-50">
                                    {options.years.map(year => (
                                        <label key={year} className="inline-flex items-center bg-white px-2 py-1 rounded border border-gray-200 text-xs cursor-pointer hover:border-[#04434E]">
                                            <input type="checkbox" checked={selectedYears.includes(year)} onChange={() => handleYearToggle(year)} className="mr-1.5 text-[#04434E] rounded focus:ring-[#04434E]" />
                                            {year}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results List */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center border-l-4 border-[#04434E] pl-3 py-1 bg-gray-50">
                            <p className="text-gray-700 font-medium">Trovati {totalResults} risultati. Pagina {page} di {totalPages || 1}</p>
                        </div>

                        {results.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.titolo}</h3>
                                <div className="text-xs text-gray-500 mb-4 flex flex-wrap gap-x-4 gap-y-1">
                                    <span><strong>Aggiornato il:</strong> {item.data_ultimo_aggiornamento_informazioni}</span>
                                    <span><strong>Percorso:</strong> {item.utenti} {'>'} {item.macro_area} {'>'} {item.argomento} {item.sottocategoria ? `> ${item.sottocategoria}` : ''}</span>
                                </div>
                                <p className="text-gray-600 mb-6 line-clamp-3">{item.testo}</p>
                                <div className="flex flex-wrap gap-3">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors">
                                        <ExternalLink size={16} /> Pagina Originale
                                    </a>
                                    <button onClick={() => setSelectedItem(item)} className="flex items-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-md font-semibold hover:bg-[#2D9C92] transition-colors">
                                        <BookOpen size={16} /> Leggi Contenuto
                                    </button>
                                    <button onClick={() => {navigator.clipboard.writeText(item.url); alert('URL Copiato!')}} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md font-semibold hover:bg-gray-200 transition-colors">
                                        <Copy size={16} /> Copia URL
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {results.length === 0 && (
                            <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                                <Database size={48} className="mx-auto mb-4 text-gray-300" />
                                <p>Nessun risultato trovato con i filtri attuali.</p>
                            </div>
                        )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-8">
                            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-2 rounded-md border bg-white disabled:opacity-50 hover:bg-gray-50">
                                <ChevronLeft />
                            </button>
                            <span className="flex items-center px-4 font-medium text-gray-700">Pagina {page} di {totalPages}</span>
                            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-2 rounded-md border bg-white disabled:opacity-50 hover:bg-gray-50">
                                <ChevronRight />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {selectedItem && <ArchiveContentModal item={selectedItem} onClose={() => setSelectedItem(null)} />}
        </div>
    );
};

export default ArchiveConsultationApp;
