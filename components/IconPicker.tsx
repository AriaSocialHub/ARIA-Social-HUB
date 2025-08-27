import React from 'react';
import { iconList, getIcon } from '../services/iconRegistry';
import { X } from 'lucide-react';

interface IconPickerProps {
    onSelect: (iconName: string) => void;
    onClose: () => void;
}

const IconPicker: React.FC<IconPickerProps> = ({ onSelect, onClose }) => {
    return (
        <div 
            className="absolute z-20 mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 p-4"
            onClick={(e) => e.stopPropagation()}
        >
            <h4 className="text-sm font-semibold text-gray-800 mb-3">Scegli un'icona</h4>
            <div className="grid grid-cols-6 gap-2 max-h-60 overflow-y-auto pr-2">
                {iconList.map(iconName => {
                    const Icon = getIcon(iconName);
                    return (
                        <button
                            key={iconName}
                            onClick={() => {
                                onSelect(iconName);
                                onClose();
                            }}
                            className="flex items-center justify-center p-2 rounded-md hover:bg-gray-100 text-gray-600 hover:text-blue-600 transition-colors"
                            title={iconName}
                        >
                            <Icon className="w-6 h-6" />
                        </button>
                    )
                })}
            </div>
             <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
            </button>
        </div>
    )
}

export default IconPicker;