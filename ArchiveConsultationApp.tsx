
import React, { useState, useEffect } from 'react';
import { Search, Filter, Loader2, Database, ExternalLink, Copy, BookOpen } from 'lucide-react';
import { loadDatabase, queryArchive, getDistinctValues } from './services/archiveService';
import { ArchiveItem } from './types';
import ArchiveContentModal from './components/archive/ArchiveContentModal';

const ArchiveConsultationApp: React.FC = () => {
    const [activeDbName, setActiveDbName] = useState<'archivio.sqlite' | 'archivio-LN.sqlite'>('archivio.sqlite');
    const [dbInstance, setDbInstance] = useState<any>(null);
    const [isLoadingDb, setIsLoadingDb] = useState(false);
    
    const [filters, setFilters] = useState({
        utenti: 'Tutti',
        macro_area: 'Tutte',
        argomento: 'Tutti',
        sottocategoria: 'Tutte'
    });
    const [searchText, setSearchText] = useState('');
    const [results, setResults] = useState<ArchiveItem[]>([]);
    
    // Option lists for select dropdowns
    const [options, setOptions] = useState({
        utenti: [] as string[],
        macro_area: [] as string[],
        argomento: [] as string[],
        sottocategoria: [] as string[]
    });

    const [selectedItem, setSelectedItem] = useState<ArchiveItem | null>(null);

    // 1. Load Database when activeDbName changes
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
                
                // Load initial options
                setOptions({
                    utenti: getDistinctValues(db, 'Utenti'),
                    macro_area: getDistinctValues(db, 'Macro-area'),
                    argomento: getDistinctValues(db, 'Argomento'),
                    sottocategoria: getDistinctValues(db, 'Sottocategoria')
                });
                
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

    // 2. Perform Search
    const handleSearch = () => {
        if (!dbInstance) return;
        const res = queryArchive(dbInstance, {
            search: searchText,
            filters: filters
        });
        setResults(res);
    };

    // 3. Handle Copy URL
    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("URL copiato negli appunti!");
    };

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Header & DB Selector */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#04434E]">Consulta l'Archivio del Sito Web RL</h1>
                    <p className="text-gray-600 mt-1">Premi il pulsante per caricare i dati. Utilizza i filtri avanzati per navigare e trovare le informazioni che cerchi.</p>
                </div>
            </div>

            {/* DB Selection Buttons */}
            <div className="flex gap-4 justify-center">
                 <button 
                    onClick={() => setActiveDbName('archivio.sqlite')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeDbName === 'archivio.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    <Database size={20} /> Leggi Archivio Sito RL
                </button>
                <button 
                    onClick={() => setActiveDbName('archivio-LN.sqlite')}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${activeDbName === 'archivio-LN.sqlite' ? 'bg-[#04434E] text-white shadow-md scale-105' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                >
                    <Database size={20} /> Leggi Archivio Lombardia Notizie
                </button>
            </div>

            {isLoadingDb && (
                <div className="text-center py-12">
                    <Loader2 className="w-12 h-12 mx-auto text-[#04434E] animate-spin mb-4" />
                    <p className="text-lg font-medium text-gray-600">Caricamento database in corso...</p>
                </div>
            )}

            {/* Filters & Search */}
            {dbInstance && !isLoadingDb && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <select 
                            className="form-input" 
                            value={filters.utenti} 
                            onChange={e => setFilters(prev => ({ ...prev, utenti: e.target.value }))}
                        >
                            <option value="Tutti">Filtra per Utenti (Tutti)</option>
                            {options.utenti.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <select 
                            className="form-input" 
                            value={filters.macro_area} 
                            onChange={e => setFilters(prev => ({ ...prev, macro_area: e.target.value }))}
                        >
                            <option value="Tutte">Filtra per Macro-area (Tutte)</option>
                            {options.macro_area.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                        <select 
                            className="form-input" 
                            value={filters.argomento} 
                            onChange={e => setFilters(prev => ({ ...prev, argomento: e.target.value }))}
                        >
                            <option value="Tutti">Filtra per Argomento (Tutti)</option>
                            {options.argomento.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                         {/* Optional Sottocategoria filter if needed, kept simple for now matching screenshot style */}
                    </div>

                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                className="form-input pl-10" 
                                placeholder="Cerca per parola chiave..." 
                                value={searchText}
                                onChange={e => setSearchText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button 
                            onClick={handleSearch}
                            className="bg-[#04434E] text-white px-6 py-2 rounded-lg font-semibold hover:bg-[#2D9C92] transition-colors flex items-center gap-2"
                        >
                            <Search size={18} /> Cerca
                        </button>
                    </div>
                </div>
            )}

            {/* Results */}
            {dbInstance && !isLoadingDb && (
                <div className="space-y-4">
                    <div className="border-l-4 border-[#04434E] pl-3 py-1 bg-gray-50">
                        <p className="text-gray-700 font-medium">Visualizzando {results.length} di {options.utenti.length > 0 ? '...' : '0'} elementi.</p>
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
                                <a 
                                    href={item.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-4 py-2 bg-[#84CC16] text-white rounded-md font-semibold hover:bg-[#65A30D] transition-colors"
                                >
                                    <ExternalLink size={16} /> Pagina Originale
                                </a>
                                <button 
                                    onClick={() => setSelectedItem(item)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    <BookOpen size={16} /> Leggi Contenuto
                                </button>
                                <button 
                                    onClick={() => copyToClipboard(item.url)}
                                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    <Copy size={16} /> Copia URL
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {results.length === 0 && (
                        <div className="text-center py-16 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                            <Database size={48} className="mx-auto mb-4 text-gray-300" />
                            <p>Nessun risultato trovato. Prova a cercare qualcosa.</p>
                        </div>
                    )}
                </div>
            )}

            {selectedItem && (
                <ArchiveContentModal 
                    item={selectedItem} 
                    onClose={() => setSelectedItem(null)} 
                />
            )}
        </div>
    );
};

export default ArchiveConsultationApp;
