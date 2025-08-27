import React, { useState, useEffect } from 'react';
import { Shift } from '../../types';
import { formInput } from './helpers';
import { X } from 'lucide-react';

const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition";
const btnDanger = "inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition";

interface SelectEmployeeModalProps {
    open: boolean;
    date?: string;
    action?: 'edit' | 'delete';
    shiftsOnDate: Shift[];
    onClose: () => void;
    onConfirm: (shiftId: string) => void;
}

const SelectEmployeeModal: React.FC<SelectEmployeeModalProps> = ({ open, date, action, shiftsOnDate, onClose, onConfirm }) => {
    const [selectedShiftId, setSelectedShiftId] = useState<string>(shiftsOnDate[0]?.id || '');
    
    useEffect(() => {
        if(shiftsOnDate.length > 0) setSelectedShiftId(shiftsOnDate[0].id)
    }, [shiftsOnDate, open]);

    if (!open) return null;

    const title = action === 'edit' ? 'Seleziona Dipendente da Modificare' : 'Seleziona Dipendente da Eliminare';
    const btnClass = action === 'edit' ? btnPrimary : btnDanger;
    const btnText = action === 'edit' ? 'Modifica' : 'Elimina';
    
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm relative">
                <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500 mt-2 mb-4">Data: {date}</p>
                <select value={selectedShiftId} onChange={(e) => setSelectedShiftId(e.target.value)} className={formInput} style={{ colorScheme: 'light' }}>
                    {shiftsOnDate.map(s => <option key={s.id} value={s.id}>{s.employeeName}</option>)}
                </select>
                <div className="mt-6 flex justify-end gap-3">
                     <button onClick={onClose} className={btnSecondary}>Annulla</button>
                     <button onClick={() => { onConfirm(selectedShiftId); onClose(); }} className={btnClass}>{btnText}</button>
                </div>
            </div>
        </div>
    );
};

export default SelectEmployeeModal;
