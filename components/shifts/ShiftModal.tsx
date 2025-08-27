import React, { useState, useEffect, useMemo } from 'react';
import { Shift, ShiftsData } from '../../types';
import { OPERATORS } from '../team-breaks/helpers';
import { formatDate, formInput } from './helpers';
import { X } from 'lucide-react';

const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed";

interface ShiftModalProps {
    open: boolean;
    date?: string;
    shiftId?: string;
    shiftsData: ShiftsData;
    onSave: (shift: Omit<Shift, 'id'>, date: string, shiftId?: string) => void;
    onClose: () => void;
    isPrimoLivello: boolean;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ open, date, shiftId, shiftsData, onSave, onClose, isPrimoLivello }) => {
    const shiftToEdit = useMemo(() => {
        if (!date || !shiftId) return null;
        return (shiftsData[date] || []).find(s => s.id === shiftId) || null;
    }, [date, shiftId, shiftsData]);

    const [formData, setFormData] = useState<Omit<Shift, 'id'>>({
        employeeName: '', shiftTime: '08:00-17:00', baseMode: '-', justification: '-', permStart: '', permEnd: ''
    });
    const [shiftDate, setShiftDate] = useState(date || formatDate(new Date()));
    
    useEffect(() => {
        if(shiftToEdit) {
            setFormData({...shiftToEdit});
            if(date) setShiftDate(date);
        } else {
            setFormData({ employeeName: '', shiftTime: '08:00-17:00', baseMode: '-', justification: '-', permStart: '', permEnd: '' });
            if (date) setShiftDate(date);
            else setShiftDate(formatDate(new Date()));
        }
    }, [shiftToEdit, date, open]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        let dataToSave = {...formData};
        if(["Riposo","Ferie","Malattia","Festivo"].includes(dataToSave.justification)){
          dataToSave.shiftTime = "-";
          dataToSave.baseMode = "-";
        }
        if(!["Permesso","Straordinario","Riunione Sindacale","Visita Medica"].includes(dataToSave.justification)) {
            dataToSave.permStart = '';
            dataToSave.permEnd = '';
        }
        onSave(dataToSave, shiftDate, shiftId);
    };

    const showExtraTime = ["Permesso","Straordinario","Riunione Sindacale","Visita Medica"].includes(formData.justification);
    const hideStandardShift = ["Riposo","Ferie","Malattia","Festivo"].includes(formData.justification);

    if (!open) return null;
    
    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 p-4 pt-12">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"><X className="w-5 h-5 text-gray-500"/></button>
                <h2 className="text-xl font-bold text-gray-900 mb-6">{shiftId ? 'Modifica Turno' : 'Inserisci Turno'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="shiftDate" className="block text-sm font-medium text-gray-700 mb-1">Data del Turno:</label>
                        <input type="date" id="shiftDate" value={shiftDate} onChange={(e) => setShiftDate(e.target.value)} className={formInput} required style={{ colorScheme: 'light' }} />
                    </div>
                    <div>
                        <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-1">Nome e Cognome:</label>
                        {isPrimoLivello ? (
                            <select id="employeeName" value={formData.employeeName} onChange={handleChange} className={formInput} required style={{ colorScheme: 'light' }}>
                                <option value="" disabled>Seleziona moderatore</option>
                                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        ) : (
                            <input type="text" id="employeeName" value={formData.employeeName} onChange={handleChange} className={formInput} required />
                        )}
                    </div>
                    
                    {!hideStandardShift && (
                        <>
                         <div>
                            <label htmlFor="shiftTime" className="block text-sm font-medium text-gray-700 mb-1">Orario Standard:</label>
                            <select id="shiftTime" value={formData.shiftTime} onChange={handleChange} className={formInput} required style={{ colorScheme: 'light' }}>
                                <option value="08:00-17:00">08:00-17:00</option><option value="08:30-17:30">08:30-17:30</option><option value="08:00-16:00">08:00-16:00</option><option value="14:00-20:00">14:00-20:00</option><option value="12:00-20:00">12:00-20:00</option><option value="11:00-20:00">11:00-20:00</option>
                            </select>
                         </div>
                         <div>
                            <label htmlFor="baseMode" className="block text-sm font-medium text-gray-700 mb-1">Modalità Turno:</label>
                            <select id="baseMode" value={formData.baseMode} onChange={handleChange} className={formInput} required style={{ colorScheme: 'light' }}>
                                <option value="-">-</option><option value="Smart Working">Smart Working</option><option value="Sede">Sede</option>
                            </select>
                         </div>
                        </>
                    )}
                    
                    <div>
                        <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">Giustificativo:</label>
                        <select id="justification" value={formData.justification} onChange={handleChange} className={formInput} required style={{ colorScheme: 'light' }}>
                            <option value="-">-</option><option value="Permesso">Permesso</option><option value="Straordinario">Straordinario</option><option value="Riunione Sindacale">Riunione Sindacale</option><option value="Visita Medica">Visita Medica</option><option value="Riposo">Riposo</option><option value="Ferie">Ferie</option><option value="Malattia">Malattia</option><option value="Festivo">Festivo</option>
                        </select>
                    </div>
                    
                    {showExtraTime && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Orario Extra (Inizio - Fine):</label>
                            <div className="grid grid-cols-2 gap-4">
                                <input type="time" id="permStart" value={formData.permStart || ''} onChange={handleChange} className={formInput} style={{ colorScheme: 'light' }} />
                                <input type="time" id="permEnd" value={formData.permEnd || ''} onChange={handleChange} className={formInput} style={{ colorScheme: 'light' }} />
                            </div>
                        </div>
                    )}
                    <div className="pt-4 flex justify-end">
                        <button type="submit" className={btnPrimary}>Salva</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShiftModal;