import React from 'react';
import { X } from 'lucide-react';

const COLORS = ['#3B82F6', '#10B981', '#F97316', '#8B5CF6', '#EF4444', '#06B6D4', '#F59E0B', '#6366F1'];

const ColorPicker: React.FC<{ onSelect: (color: string) => void; onClose: () => void; }> = ({ onSelect, onClose }) => {
    const handleSelect = (e: React.MouseEvent, color: string) => {
        e.stopPropagation();
        onSelect(color);
        onClose();
    }
    
    return (
        <div className="absolute z-20 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 p-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-800">Scegli un colore</h4>
                <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                    <X className="h-4 w-4" />
                </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {COLORS.map(color => (
                    <button
                        key={color}
                        onClick={(e) => handleSelect(e, color)}
                        className="w-8 h-8 rounded-full border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        style={{ backgroundColor: color }}
                        aria-label={color}
                    />
                ))}
            </div>
        </div>
    );
};
export default ColorPicker;
