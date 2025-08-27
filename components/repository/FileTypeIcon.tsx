import React from 'react';
import { File, FileText, FileSpreadsheet, Presentation, FileType as FilePdf } from 'lucide-react';

interface FileTypeIconProps {
    category?: 'PDF' | 'Document' | 'Spreadsheet' | 'Presentation' | 'Other';
    className?: string;
}

const FileTypeIcon: React.FC<FileTypeIconProps> = ({ category, className = "h-7 w-7" }) => {
    switch (category) {
        case 'PDF':
            return <FilePdf className={`${className} text-red-500`} />;
        case 'Document':
            return <FileText className={`${className} text-blue-500`} />;
        case 'Spreadsheet':
            return <FileSpreadsheet className={`${className} text-green-500`} />;
        case 'Presentation':
            return <Presentation className={`${className} text-orange-500`} />;
        default:
            return <File className={`${className} text-gray-500`} />;
    }
};

export default FileTypeIcon;