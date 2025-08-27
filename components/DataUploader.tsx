import React, { useState, useCallback } from 'react';
import { UploadCloud, CheckCircle, XCircle, ArrowRight } from 'lucide-react';

interface DataUploaderProps {
  serviceId: string;
  title: string;
  description: string;
  parser: (file: File) => Promise<any>;
  onUploadSuccess: (serviceId: string, parsedData: any, fileName: string) => void;
  fileInfo: { name: string; itemCount: number; categoryCount: number } | null;
  onViewData: () => void;
}

const DataUploader: React.FC<DataUploaderProps> = ({ serviceId, title, description, parser, onUploadSuccess, fileInfo, onViewData }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileUpload = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        
        try {
            const parsedData = await parser(file);
            if (Object.keys(parsedData).length === 0) {
                throw new Error("Il file è vuoto o non contiene dati validi. Assicurati che le colonne e i dati siano corretti.");
            }
            onUploadSuccess(serviceId, parsedData, file.name);
        } catch (e: any) {
            setError(e.message || "Si è verificato un errore imprevisto durante l'analisi del file.");
        } finally {
            setIsLoading(false);
        }
            
    }, [parser, serviceId, onUploadSuccess]);

    const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDragIn = (e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };

    const handleDragOut = (e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e);
        setIsDragging(false);
    };

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        handleDrag(e);
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || file.name.endsWith('.xlsx')) {
                handleFileUpload(file);
            } else {
                setError("Per favore, carica un file .xlsx valido.");
            }
            e.dataTransfer.clearData();
        }
    }, [handleFileUpload]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFileUpload(e.target.files[0]);
            e.target.value = '';
        }
    };

    if (fileInfo && !isLoading && !error) {
        return (
            <div className="card h-full flex flex-col">
                <div className="flex items-center gap-3">
                    <CheckCircle className="h-7 w-7 text-[var(--c-primary-light)]" />
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 flex-grow">
                    <p className="text-sm font-semibold text-gray-800 break-all">{fileInfo.name}</p>
                    <div className="mt-2 text-xs text-gray-600 space-y-1">
                        <p><span className="font-medium">{fileInfo.categoryCount}</span> sezioni trovate</p>
                        <p><span className="font-medium">{fileInfo.itemCount}</span> voci totali</p>
                    </div>
                </div>
                <div className="mt-4 space-y-2">
                    <button
                        onClick={onViewData}
                        className="btn w-full justify-center" style={{backgroundColor: 'var(--c-primary-light)', color: 'white'}}
                    >
                        Visualizza Dati <ArrowRight className="h-4 w-4" />
                    </button>
                    <label htmlFor={`file-upload-${title}`} className="btn btn-secondary w-full">
                        Carica un nuovo file...
                    </label>
                    <input type="file" id={`file-upload-${title}`} className="sr-only" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleChange} disabled={isLoading} />
                </div>
            </div>
        );
    }

    const uploaderClasses = `
        mt-4 border-2 border-dashed rounded-lg p-6 transition-colors text-center h-48 flex flex-col justify-center items-center
        ${isDragging ? 'border-[var(--c-primary-light)] bg-teal-50' : ''}
        ${!isDragging && !error ? 'border-gray-300 bg-gray-50' : ''}
        ${isLoading ? 'border-[var(--c-primary-light)] bg-teal-50 cursor-wait' : ''}
        ${error ? 'border-red-500 bg-red-50' : ''}
        ${!isLoading && !error ? 'hover:border-[var(--c-primary-light)] hover:bg-teal-50/50 cursor-pointer' : ''}
    `;

    return (
        <div className="card h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
            <p className="mt-1 text-sm text-gray-600 flex-grow">{description}</p>
            
            <div
                onDragEnter={handleDragIn}
                onDragLeave={handleDragOut}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={uploaderClasses}
            >
                <input type="file" id={`file-upload-${title}`} className="sr-only" accept=".xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleChange} disabled={isLoading} />
                
                {isLoading && (
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--c-primary-light)]"></div>
                        <p className="mt-4 font-semibold text-gray-700">Analisi in corso...</p>
                    </div>
                )}

                {error && (
                     <div className="flex flex-col items-center justify-center text-center">
                        <XCircle className="h-12 w-12 text-red-500" />
                        <p className="mt-3 font-semibold text-red-700">Errore nel Caricamento</p>
                        <p className="mt-1 text-xs text-red-600 max-w-xs">{error}</p>
                        <label htmlFor={`file-upload-${title}`} className="mt-4 text-sm font-semibold text-[var(--c-primary-light)] hover:underline cursor-pointer">
                            Riprova a caricare
                        </label>
                    </div>
                )}

                {!isLoading && !error && (
                     <label htmlFor={`file-upload-${title}`} className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                        <UploadCloud className="h-12 w-12 text-gray-400" />
                        <p className="mt-4 font-semibold text-gray-700">Trascina il file qui o <span className="text-[var(--c-primary-light)] font-semibold">sfoglia</span></p>
                        <p className="mt-1 text-xs text-gray-500">Supporta solo file .xlsx</p>
                    </label>
                )}
            </div>
        </div>
    );
};

export default DataUploader;
