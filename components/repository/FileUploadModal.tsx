import React, { useState, useRef } from 'react';
import { StoredFile } from '../../types';
import { UploadCloud, Loader2 } from 'lucide-react';

interface FileUploadModalProps {
    onClose: () => void;
    onSave: (fileData: Omit<StoredFile, 'id' | 'author' | 'createdAt' | 'url'>, file: File) => Promise<void>;
}

const determineCategory = (mimeType: string, fileName: string): StoredFile['category'] => {
    const lowerFileName = fileName.toLowerCase();
    if (mimeType === 'application/pdf' || lowerFileName.endsWith('.pdf')) return 'PDF';
    if (mimeType.includes('word') || lowerFileName.endsWith('.docx') || lowerFileName.endsWith('.doc')) return 'Document';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || lowerFileName.endsWith('.xlsx') || lowerFileName.endsWith('.xls')) return 'Spreadsheet';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint') || lowerFileName.endsWith('.pptx') || lowerFileName.endsWith('.ppt')) return 'Presentation';
    return 'Other';
};


const FileUploadModal: React.FC<FileUploadModalProps> = ({ onClose, onSave }) => {
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState<StoredFile['category']>('Other');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (selectedFile: File) => {
        setFile(selectedFile);
        setCategory(determineCategory(selectedFile.type, selectedFile.name));
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
            e.target.value = ''; // Reset input to allow re-uploading the same file
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !description.trim()) {
            alert("Per favore, seleziona un file e fornisci una descrizione.");
            return;
        }
        setIsProcessing(true);
        try {
            await onSave({
                name: file.name,
                type: file.type,
                size: file.size,
                description: description.trim(),
                category: category,
            }, file);
        } catch (err) {
            console.error("Save failed", err);
            alert("Salvataggio del file fallito.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 pt-12" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b">
                        <h3 className="text-xl font-bold text-gray-800">Carica un nuovo file</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" disabled={isProcessing} />
                        {!file ? (
                             <div 
                                className={`w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                                onDragEnter={() => setIsDragging(true)}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <UploadCloud className="h-10 w-10 text-gray-400 mb-2"/>
                                <p className="font-semibold text-gray-700">Trascina un file o <span className="text-blue-600">clicca per sfogliare</span></p>
                                <p className="text-xs text-gray-500">PDF, Word, Excel, PowerPoint, ecc.</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-gray-50 border rounded-lg">
                                <p className="font-semibold text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">{file.type}</p>
                            </div>
                        )}

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Descrizione (per ricerca)</label>
                            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="form-input" required placeholder="Descrivi il contenuto del file per aiutare la ricerca..." disabled={isProcessing}></textarea>
                        </div>
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                            <select id="category" value={category} onChange={(e) => setCategory(e.target.value as StoredFile['category'])} className="form-input" disabled={isProcessing}>
                                <option value="PDF">PDF</option>
                                <option value="Document">Documento (Word)</option>
                                <option value="Spreadsheet">Foglio di calcolo (Excel)</option>
                                <option value="Presentation">Presentazione (PowerPoint)</option>
                                <option value="Other">Altro</option>
                            </select>
                        </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isProcessing}>Annulla</button>
                        <button type="submit" className="btn btn-primary" disabled={!file || isProcessing}>
                            {isProcessing ? <><Loader2 className="w-5 h-5 animate-spin"/> Caricamento...</> : 'Carica File'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FileUploadModal;
