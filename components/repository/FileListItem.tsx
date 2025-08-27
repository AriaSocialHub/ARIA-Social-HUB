
import React from 'react';
import { StoredFile } from '../../types';
import FileTypeIcon from './FileTypeIcon';
import { Download, Trash2 } from 'lucide-react';

interface FileListItemProps {
    file: StoredFile;
    onDelete: (id: string) => void;
    isReadOnly: boolean;
}

function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

const FileListItem: React.FC<FileListItemProps> = ({ file, onDelete, isReadOnly }) => {
    return (
        <tr className="hover:bg-gray-50/50">
            <td className="px-4 py-3"><FileTypeIcon category={file.category} /></td>
            <td className="px-4 py-3 max-w-sm">
                <p className="font-semibold text-gray-800 truncate">{file.name}</p>
                <p className="text-gray-500 truncate text-xs">{file.description}</p>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-600">{formatBytes(file.size)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-600 hidden md:table-cell">{file.author}</td>
            <td className="px-4 py-3 whitespace-nowrap text-gray-600 hidden sm:table-cell">{new Date(file.createdAt).toLocaleDateString('it-IT')}</td>
            <td className="px-4 py-3 text-right">
                <div className="inline-flex items-center gap-2">
                    <a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer" className="p-2 rounded-full hover:bg-gray-200 text-gray-600" title="Scarica">
                        <Download size={18} />
                    </a>
                    {!isReadOnly && (
                        <button onClick={() => onDelete(file.id)} className="p-2 rounded-full hover:bg-red-100 text-red-500" title="Elimina">
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default FileListItem;
