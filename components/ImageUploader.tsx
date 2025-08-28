import React, { useState, useCallback, useRef } from 'react';
import { UploadCloud, Loader2, Trash2 } from 'lucide-react';

interface ImageUploaderProps {
    currentImageUrl: string | null;
    onImageUploaded: (url: string | null) => void;
    targetWidth?: number;
    targetHeight?: number;
}

// FIX: Added helper to call the file upload API endpoint. This function was previously missing.
async function uploadFile(file: File | Blob, filename: string): Promise<string> {
    const response = await fetch(`/api/upload?filename=${encodeURIComponent(filename)}`, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
    });
    if (!response.ok) {
        const errorText = await response.text();
        console.error('File upload failed:', errorText);
        throw new Error("Caricamento del file fallito.");
    }
    const result = await response.json();
    return result.url;
}


const ImageUploader: React.FC<ImageUploaderProps> = ({
    currentImageUrl,
    onImageUploaded,
    targetWidth = 600,
    targetHeight = 338 // 16:9 ratio
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const processAndUploadImage = useCallback((file: File) => {
        if (!file.type.startsWith('image/')) {
            alert('Per favore, carica un file immagine (es. JPG, PNG).');
            return;
        }
        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = targetWidth;
                canvas.height = targetHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    setIsProcessing(false);
                    return;
                }

                const sourceAspectRatio = img.width / img.height;
                const targetAspectRatio = targetWidth / targetHeight;
                let sourceX = 0, sourceY = 0, sourceWidth = img.width, sourceHeight = img.height;

                if (sourceAspectRatio > targetAspectRatio) { // Image is wider
                    sourceWidth = img.height * targetAspectRatio;
                    sourceX = (img.width - sourceWidth) / 2;
                } else { // Image is taller or same aspect ratio
                    sourceHeight = img.width / targetAspectRatio;
                    sourceY = (img.height - sourceHeight) / 2;
                }

                ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, targetWidth, targetHeight);
                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            const uploadedUrl = await uploadFile(blob, file.name);
                            onImageUploaded(uploadedUrl);
                        } catch (error) {
                            console.error(error);
                            alert("Caricamento dell'immagine fallito.");
                        } finally {
                            setIsProcessing(false);
                        }
                    }
                }, 'image/jpeg', 0.85);
            };
            img.onerror = () => {
                alert("Impossibile caricare l'immagine.");
                setIsProcessing(false);
            };
            img.src = e.target?.result as string;
        };
        reader.onerror = () => {
            alert('Errore nella lettura del file.');
            setIsProcessing(false);
        };
    }, [onImageUploaded, targetWidth, targetHeight]);

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files?.length > 0) {
            processAndUploadImage(e.dataTransfer.files[0]);
        }
    };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.length > 0) {
            processAndUploadImage(e.target.files[0]);
            e.target.value = ''; // Reset input
        }
    };

    if (currentImageUrl) {
        return (
            <div className="relative group w-full border rounded-lg bg-gray-50 aspect-[16/9]">
                <img src={currentImageUrl} alt="Anteprima" className="w-full h-full object-cover rounded-lg" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                    <button
                        type="button"
                        onClick={() => onImageUploaded(null)}
                        disabled={isProcessing}
                        className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-md font-semibold text-sm shadow-md"
                    >
                        <Trash2 className="w-4 h-4" /> Rimuovi
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
            className={`relative w-full aspect-[16/9] border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${isProcessing ? 'cursor-default' : 'cursor-pointer'} ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'}`}
        >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" disabled={isProcessing} />
            {isProcessing ? (
                <>
                    <Loader2 className="h-8 w-8 text-gray-500 animate-spin" />
                    <p className="mt-2 text-sm text-gray-600">Elaborazione...</p>
                </>
            ) : (
                <>
                    <UploadCloud className="h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-600 text-center">
                        <span className="font-semibold text-blue-600">Carica un'immagine</span> o trascinala qui
                    </p>
                    <p className="text-xs text-gray-500 mt-1">L'immagine verrà ritagliata in 16:9</p>
                </>
            )}
        </div>
    );
};

export default ImageUploader;