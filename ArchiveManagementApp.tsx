
import React, { useState, useRef } from 'react';
import { Upload, Download, Database, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { loadDatabase, getDbMetadata } from './services/archiveService';

const ArchiveManagementCard: React.FC<{ 
    title: string, 
    filename: string, 
    description: string 
}> = ({ title, filename, description }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [isChecking, setIsChecking] = useState(false);
    const [metadata, setMetadata] = useState<{ count: number, lastUpdate: string | null } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCheckStatus = async () => {
        setIsChecking(true);
        try {
            // Get signed URL
            const res = await fetch(`/api/archiveStorage?filename=${filename}`);
            if(!res.ok) throw new Error("File not found");
            const { signedUrl } = await res.json();
            
            // Load DB in memory to check stats
            const db = await loadDatabase(signedUrl);
            const meta = getDbMetadata(db);
            setMetadata(meta);
            db.close();
        } catch (error) {
            console.error(error);
            setMetadata(null);
        } finally {
            setIsChecking(false);
        }
    };

    // Check status on mount roughly (or manual trigger)
    React.useEffect(() => {
        handleCheckStatus();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        
        setIsUploading(true);
        try {
            const response = await fetch(`/api/archiveStorage?filename=${filename}`, {
                method: 'POST',
                body: file
            });
            if (!response.ok) throw new Error('Upload failed');
            await handleCheckStatus();
            alert('Database caricato con successo!');
        } catch (error) {
            console.error(error);
            alert('Errore durante il caricamento.');
        } finally {
            setIsUploading(false);
            if(fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDownload = async () => {
        try {
            const res = await fetch(`/api/archiveStorage?filename=${filename}`);
            if(!res.ok) throw new Error("Impossibile scaricare il file");
            const { signedUrl } = await res.json();
            
            const link = document.createElement('a');
            link.href = signedUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            alert("Errore durante il download.");
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
            <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center text-teal-700">
                    <Database size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500">{filename}</p>
                </div>
            </div>
            
            <p className="text-gray-600 mb-6 flex-grow">{description}</p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2 border border-gray-100">
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stato Archivio:</span>
                    {isChecking ? (
                        <span className="flex items-center gap-1 text-gray-600"><Loader2 className="w-3 h-3 animate-spin"/> Controllo...</span>
                    ) : metadata ? (
                        <span className="flex items-center gap-1 text-green-600 font-medium"><CheckCircle className="w-4 h-4"/> Online</span>
                    ) : (
                        <span className="flex items-center gap-1 text-red-500 font-medium"><AlertTriangle className="w-4 h-4"/> Non presente</span>
                    )}
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Voci Totali:</span>
                    <span className="font-mono font-medium">{metadata ? metadata.count.toLocaleString() : '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Ultimo Aggiornamento DB:</span>
                    <span className="font-medium">{metadata?.lastUpdate || '-'}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleUpload} 
                    accept=".sqlite,.db,.sqlite3" 
                    className="hidden" 
                />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isUploading || isChecking}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#04434E] text-white rounded-lg hover:bg-[#2D9C92] transition disabled:opacity-50"
                >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                    <span>Upload</span>
                </button>
                <button 
                    onClick={handleDownload}
                    disabled={!metadata || isUploading}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                </button>
            </div>
        </div>
    );
};

const ArchiveManagementApp: React.FC = () => {
    return (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Archivi RL</h1>
                <p className="text-gray-600">Gestisci i database SQLite per la consultazione.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <ArchiveManagementCard 
                    title="Sito Web RL" 
                    filename="archivio.sqlite"
                    description="Archivio completo delle informazioni e delle pagine del Sito Web Regione Lombardia."
                />
                <ArchiveManagementCard 
                    title="Lombardia Notizie" 
                    filename="archivio-LN.sqlite"
                    description="Database contenente le notizie e i comunicati stampa di Lombardia Notizie."
                />
            </div>
        </div>
    );
};

export default ArchiveManagementApp;
