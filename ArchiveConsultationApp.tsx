
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, Filter, Loader2, Database, ExternalLink, Copy, BookOpen, RotateCcw, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { loadDatabase, queryArchive, getDistinctValues, getAvailableYears, deduplicateResults } from './services/archiveService';
import { ArchiveItem } from './types';
import ArchiveContentModal from './components/archive/ArchiveContentModal';

const ArchiveConsultationApp: React.FC = () => {
    // 'both' mode allows searching across RL and LN
    const [activeDbMode, setActiveDbMode] = useState<'archivio.sqlite' | 'archivio-LN.sqlite' | 'both'>('archivio.sqlite');
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    
    // DB Instances (cached in service, but we keep refs here to trigger updates)
    const [dbInstances, setDbInstances] = useState<{ RL: any, LN: any }>({ RL: null, LN: null });

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
    
    // Pagination & Results State
    const [page, setPage] = useState(1);
    const pageSize = 15;
    const [allMergedResults, setAllMergedResults] = useState<ArchiveItem[]>([]); // Holds ALL matching results before pagination
    const [displayedResults, setDisplayedResults] = useState<ArchiveItem[]>([]);
    
    // Options
    const [options, setOptions] = useState({
        utenti: [] as string[],
        macro_area: [] as string[],
        argomento: [] as string[],
        sottocategoria: [] as string[],
        years: [] as string[]
    });

    const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

    // Load Database(s) based on mode
    useEffect(() => {
        const init = async () => {
            setIsLoadingDb(true);
            try {
                const newInstances = { ...dbInstances };

                // Load RL if needed
                if (activeDbMode === 'archivio.sqlite' || activeDbMode === 'both') {
                    if (!newInstances.RL) {
                        const res = await fetch(`/api/archiveStorage?filename=archivio.sqlite`);
                        if (res.ok) {
                            const { signedUrl } = await res.json();
                            newInstances.RL = await loadDatabase(signedUrl, 'archivio.sqlite');
                        }
                    }
                }

                // Load LN if needed
                if (activeDbMode === 'archivio-LN.sqlite' || activeDbMode === 'both') {
                    if (!newInstances.LN) {
                        const res = await fetch(`/api/archiveStorage?filename=archivio-LN.sqlite`);
                        if (res.ok) {
                            const { signedUrl } = await res.json();
                            newInstances.LN = await loadDatabase(signedUrl, 'archivio-LN.sqlite');
                        }
                    }
                }

                setDbInstances(newInstances);
            } catch (error) {
                console.error("Failed to load DB", error);
                alert("Impossibile caricare gli archivi.");
            } finally {
                setIsLoadingDb(false);
            }
        };
        init();
    }, [activeDbMode]);

    // Update Filter Options
    useEffect(() => {
        const { RL, LN } = dbInstances;
        const currentDb = activeDbMode === 'archivio.sqlite' ? RL : (activeDbMode === 'archivio-LN.sqlite' ? LN : null);

        if (activeDbMode === 'both') {
            // For combined mode, we can merge distinct values or just simplify filters.
            // Simplification: Show merged Macro-areas and Years. Disable specific RL filters.
            const yearsRL = RL ? getAvailableYears(RL, 'RL') : [];
            const yearsLN = LN ? getAvailableYears(LN, 'LN') : [];
            const macroRL = RL ? getDistinctValues(RL, 'Macro-area') : [];
            const macroLN = LN ? getDistinctValues(LN, 'Macro-area') : [];

            setOptions({
                utenti: [], // Disabled in combined
                macro_area: Array.from(new Set([...macroRL, ...macroLN])).sort(),
                argomento: [], // Disabled
                sottocategoria: [], // Disabled
                years: Array.from(new Set([...yearsRL, ...yearsLN])).sort().reverse()
            });
        } else if (currentDb) {
            const type = activeDbMode === 'archivio-LN.sqlite' ? 'LN' : 'RL';
            setOptions({
                utenti: type === 'RL' ? getDistinctValues(currentDb, 'Utenti') : [],
                macro_area: getDistinctValues(currentDb, 'Macro-area', filters),
                argomento: type === 'RL' ? getDistinctValues(currentDb, 'Argomento', filters) : [],
                sottocategoria: type === 'RL' ? getDistinctValues(currentDb, 'Sottocategoria', filters) : [],
                years: getAvailableYears(currentDb, type)
            });
        }
    }, [dbInstances, activeDbMode, filters.utenti, filters.macro_area, filters.argomento]);

    // Perform Search Query
    const runQuery = useCallback(() => {
        try {
            const { RL, LN } = dbInstances;
            if (!RL && !LN) return;

            let resultsRL: ArchiveItem[] = [];
            let resultsLN: ArchiveItem[] = [];

            const commonParams = {
                search: searchText,
                searchScope,
                years: selectedYears,
                filters
            };

            if ((activeDbMode === 'archivio.sqlite' || activeDbMode === 'both') && RL) {
                resultsRL = queryArchive(RL, commonParams, 'RL');
            }

            if ((activeDbMode === 'archivio-LN.sqlite' || activeDbMode === 'both') && LN) {
                resultsLN = queryArchive(LN, commonParams, 'LN');
            }

            // Merge
            let combined = [...resultsRL, ...resultsLN];

            // Deduplicate
            combined = deduplicateResults(combined);

            // Sort by date desc
            combined.sort((a, b) => {
                // Helper to parse Italian date for sorting
                const parseIt = (d: string) => {
                    if (!d) return 0;
                    try {
                        const parts = d.split('/');
                        if (parts.length === 3) return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`).getTime();
                    } catch (e) {
                        return 0;
                    }
                    return 0;
                };
                return parseIt(b.data_ultimo_aggiornamento_informazioni) - parseIt(a.data_ultimo_aggiornamento_informazioni);
            });

            setAllMergedResults(combined);
            setPage(1); // Reset to page 1 on new search
        } catch (error) {
            console.error("Error processing query results:", error);
            // Fail gracefully
            setAllMergedResults([]);
        }
    }, [dbInstances, activeDbMode, searchText, searchScope, selectedYears, filters]);

    // Trigger query on dependency change
    useEffect(() => {
        if (!isLoadingDb) {
            runQuery();
        }
    }, [runQuery, isLoadingDb]);

    // Handle Pagination Slice
    useEffect(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        setDisplayedResults(allMergedResults.slice(start, end));
    }, [page, allMergedResults]);


    // Handlers
    const handleReset = () => {
        setFilters({ utenti: 'Tutti', macro_area: 'Tutte', argomento: 'Tutti', sottocategoria: 'Tutte' });
        setSearchText('');
        setSearchScope('both');
        setSelectedYears([]);
    };

    const handleYearToggle = (year: string) => {
        setSelectedYears(prev => 
            prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]
        );
    };

    const totalPages = Math.ceil(allMergedResults.length / pageSize);
    const isLN = activeDbMode === 'archivio-LN.sqlite';
    const isCombined = activeDbMode === 'both';

    return (
        <div className="animate-fadeIn space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#04434E]">Consultazione Archivi</h1>
                    <p className="text-gray-600 mt-1">Naviga tra le informazioni del Sito RL e Lombardia Notizie.</p>
                </div>
            </div>

            {/* DB Selection */}
            <div className="flex flex-wrap gap-4 justify-center">
                 <button onClick={() => { setActiveDbMode('archivio.sqlite'); handleReset(); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${activeDbMode === 'archivio.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Database size={20} /> Sito RL
                </button>
                <button onClick={() => { setActiveDbMode('archivio-LN.sqlite'); handleReset(); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${activeDbMode === 'archivio-LN.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Database size={20} /> Lombardia Notizie
                </button>
                <button onClick={() => { setActiveDbMode('both'); handleReset(); }} className={`flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-all ${activeDbMode === 'both' ? 'bg-[#04434E] text-white shadow-md scale-105 ring-2 ring-[#04434E] ring-offset-2' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                    <Layers size={20} /> Entrambi (Ricerca Globale)
                </button>
            </div>

            {isLoadingDb && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto text-[#04434E] animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-600">Caricamento archivi in corso...</p>
                </div>
            )}

            {/* Main Interface */}
            {!isLoadingDb && (
                <div className="space-y-6">
                    {/* Filters Box */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-5 relative">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-semibold text-gray-700 flex items-center gap-2"><Filter size={18}/> Filtri di Ricerca</h3>
                            <button onClick={handleReset} className="text-sm text-red-600 hover:bg-red-50 px-3 py-1 rounded-md flex items-center gap-1 transition-colors">
                                <RotateCcw size={14} /> Reset Filtri
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {!isLN && !isCombined && (
                                <select className="form-input" value={filters.utenti} onChange={e => { setFilters(p => ({...p, utenti: e.target.value, macro_area: 'Tutte', argomento: 'Tutti'})); }}>
                                    <option value="Tutti">Utenti (Tutti)</option>
                                    {options.utenti.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                            )}
                            
                            <select className="form-input" value={filters.macro_area} onChange={e => { setFilters(p => ({...p, macro_area: e.target.value, argomento: 'Tutti'})); }}>
                                <option value="Tutte">Macro-area (Tutte)</option>
                                {options.macro_area.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>

                            {!isLN && !isCombined && (
                                <>
                                    <select className="form-input" value={filters.argomento} onChange={e => { setFilters(p => ({...p, argomento: e.target.value})); }} disabled={options.argomento.length === 0}>
                                        <option value="Tutti">Argomento (Tutti)</option>
                                        {options.argomento.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                    <select className="form-input" value={filters.sottocategoria} onChange={e => { setFilters(p => ({...p, sottocategoria: e.target.value})); }} disabled={options.sottocategoria.length === 0}>
                                        <option value="Tutte">Sottocategoria (Tutte)</option>
                                        {options.sottocategoria.map(o => <option key={o} value={o}>{o}</option>)}
                                    </select>
                                </>
                            )}
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
                                        <input type="text" className="form-input pl-10" placeholder="Cerca per parola chiave..." value={searchText} onChange={e => setSearchText(e.target.value)} />
                                    </div>
                                </div>
                            </div>

                            {/* Year Selector */}
                            <div className="lg:w-1/3">
                                <p className="text-sm font-medium text-gray-700 mb-2">Filtra per Anno ({isLN ? 'Pubblicazione' : 'Aggiornamento'}):</p>
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
                            <p className="text-gray-700 font-medium">Trovati {allMergedResults.length} risultati. Pagina {page} di {totalPages || 1}</p>
                        </div>

                        {displayedResults.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{item.titolo}</h3>
                                <div className="text-xs text-gray-500 mb-4 flex flex-wrap gap-x-4 gap-y-1">
                                    <span><strong>Data:</strong> {item.data_ultimo_aggiornamento_informazioni}</span>
                                    {item.utenti && <span><strong>Utenti:</strong> {item.utenti}</span>}
                                    <span><strong>Macro-area:</strong> {item.macro_area}</span>
                                    {item.argomento && <span><strong>Argomento:</strong> {item.argomento}</span>}
                                </div>
                                <p className="text-gray-600 mb-6 line-clamp-3">{item.testo}</p>
                                <div className="flex flex-wrap gap-3">
                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-md font-semibold hover:bg-[#2D9C92] transition-colors">
                                        <ExternalLink size={16} /> Pagina Originale
                                    </a>
                                    <button onClick={() => setSelectedItem(item)} className="flex items-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-md font-semibold hover:bg-[#2D9C92] transition-colors">
                                        <BookOpen size={16} /> Leggi Contenuto
                                    </button>
                                    <button onClick={() => {navigator.clipboard.writeText(item.url); alert('URL Copiato!')}} className="flex items-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-md font-semibold hover:bg-[#2D9C92] transition-colors">
                                        <Copy size={16} /> Copia URL
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {displayedResults.length === 0 && (
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
