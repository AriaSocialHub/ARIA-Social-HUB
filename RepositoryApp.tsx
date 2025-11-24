
import React, { useState, useMemo, useEffect } from 'react';
import { StoredFile, User } from './types';
import { useData } from './contexts/DataContext';
import { Search, Plus, Loader2, Database, AlertTriangle, Trash2, X } from 'lucide-react';
import FileUploadModal from './components/repository/FileUploadModal';
import FileListItem from './components/repository/FileListItem';

const TABS = ['Tutti', 'PDF', 'Document', 'Spreadsheet', 'Presentation', 'Image', 'Other'];
const TAB_LABELS: { [key: string]: string } = {
  'Tutti': 'Tutti',
  'PDF': 'PDF',
  'Document': 'Documenti',
  'Spreadsheet': 'Fogli di calcolo',
  'Presentation': 'Presentazioni',
  'Image': 'Immagini',
  'Other': 'Altro',
};


const RepositoryApp: React.FC<{ serviceId: string; isReadOnly: boolean; currentUser: User | null }> = ({ serviceId, isReadOnly, currentUser }) => {
    const { servicesData, onAddFile, onDeleteFile } = useData();
    const allFiles: StoredFile[] = useMemo(() => {
        const data = servicesData[serviceId]?.data;
        if (Array.isArray(data)) { // Handle flat array structure for repository
            return [...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        return [];
    }, [servicesData, serviceId]);
    

    const [isUploadModalOpen, setUploadModalOpen] = useState(false);
    const [fileToDelete, setFileToDelete] = useState<StoredFile | null>(null);
    const [activeTab, setActiveTab] = useState('Tutti');
    
    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [searchedFileIds, setSearchedFileIds] = useState<string[] | null>(null);

    const handleSaveFile = async (fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File) => {
        if (!currentUser) return;
        // FIX: Pass the current user's name to `onAddFile` to resolve scope issues in the data context.
        await onAddFile(serviceId, '', fileData, file, currentUser.name);
        setUploadModalOpen(false);
    };

    const handleDeleteFile = () => {
        if (!fileToDelete || !currentUser) return;
        onDeleteFile(serviceId, '', fileToDelete.id, currentUser.name);
        setFileToDelete(null);
    };

    const performSearch = async (term: string) => {
        if (term.length < 3) {
            setSearchedFileIds(null);
            return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
            const documentsForSearch = allFiles.map(f => ({ id: f.id, name: f.name, description: f.description }));
            
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: term,
                    documents: documentsForSearch,
                    mode: 'repository'
                }),
            });

            if (!response.ok) {
                throw new Error('Search request failed');
            }

            const result = await response.json();
            setSearchedFileIds(result.relevant_ids || []);
        } catch (error) {
            console.error("Errore nella ricerca semantica:", error);
            setSearchError("La ricerca non è riuscita. Riprova più tardi.");
            setSearchedFileIds([]);
        } finally {
            setIsSearching(false);
        }
    };
    
    useEffect(() => {
        const handler = setTimeout(() => {
            performSearch(searchTerm);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm, allFiles]);


    const displayedFiles = useMemo(() => {
        let files = allFiles;
        if (searchedFileIds !== null) {
            const idSet = new Set(searchedFileIds);
            files = allFiles.filter(f => idSet.has(f.id));
        }
        if (activeTab !== 'Tutti') {
            return files.filter(f => f.category === activeTab);
        }
        return files;
    }, [allFiles, activeTab, searchedFileIds]);
    
    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Database className="h-8 w-8 text-blue-600"/>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Archivio File</h1>
                        <p className="text-gray-500">Archivio centralizzato con ricerca semantica.</p>
                    </div>
                </div>
                 {!isReadOnly && (
                    <button onClick={() => setUploadModalOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-semibold w-full sm:w-auto justify-center">
                        <Plus className="h-5 w-5" />
                        <span>Carica File</span>
                    </button>
                )}
            </div>
            
            <div className="relative mb-4">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400">
                    {isSearching ? <Loader2 className="animate-spin" /> : <Search />}
                </div>
                <input 
                    type="search"
                    placeholder="Ricerca semantica per nome e descrizione del file..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
                 {searchError && <p className="text-xs text-red-500 mt-1">{searchError}</p>}
            </div>

            <div className="border-b border-gray-200 mb-4">
                <nav className="-mb-px flex space-x-6 overflow-x-auto">
                    {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${activeTab === tab ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {TAB_LABELS[tab]}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50/70">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-left w-12">Tipo</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-left">Nome & Descrizione</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-left">Dim.</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-left hidden md:table-cell">Autore</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-left hidden sm:table-cell">Data</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 text-right">Azioni</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {displayedFiles.length > 0 ? displayedFiles.map(file => (
                            <FileListItem key={file.id} file={file} onDelete={() => setFileToDelete(file)} isReadOnly={isReadOnly} />
                        )) : (
                            <tr>
                                <td colSpan={6} className="text-center py-16 text-gray-500">
                                    <p className="font-semibold">Nessun file trovato.</p>
                                    <p className="text-xs mt-1">
                                        {searchedFileIds !== null ? "Prova a modificare i termini di ricerca." : "Carica un file per iniziare."}
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isUploadModalOpen && <FileUploadModal onClose={() => setUploadModalOpen(false)} onSave={handleSaveFile} />}
            
            {fileToDelete && (
                 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setFileToDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma Eliminazione</h2>
                        <p className="text-gray-600 mb-6">Vuoi eliminare definitivamente il file <strong>"{fileToDelete.name}"</strong>? L'azione è irreversibile.</p>
                        <div className="flex justify-center gap-4">
                           <button onClick={() => setFileToDelete(null)} className="btn btn-secondary">Annulla</button>
                           <button onClick={handleDeleteFile} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 h-5"/> Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RepositoryApp;
