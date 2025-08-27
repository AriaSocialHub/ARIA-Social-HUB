import React, { useState } from 'react';
import { PauseData, UserProfile } from '../../types';
import { OPERATORS } from './helpers';
import { Clock, UserCircle, Coffee, Download } from 'lucide-react';

interface CurrentUser extends UserProfile {
    accessLevel: 'admin' | 'view';
}

interface AddPauseModalProps {
    onClose: () => void;
    onSave: (data: any) => void;
    existingOperators: string[];
    currentUser: CurrentUser | null;
}

const HamburgerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 16H4a2 2 0 1 1 0-4h16a2 2 0 1 1 0 4h-4.25"/>
        <path d="M5 12a2 2 0 0 1-2-2 9 7 0 0 1 18 0 2 2 0 0 1-2 2"/>
        <path d="M5 16a2 2 0 0 0-2 2 3 3 0 0 0 3 3h12a3 3 0 0 0 3-3 2 2 0 0 0-2-2q0 0 0 0"/>
        <path d="m6.67 12 6.13 4.6a2 2 0 0 0 2.8-.4l3.15-4.2"/>
    </svg>
);

const CocktailIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9 6 6.6 2.8C6.3 2.4 5.6 2 5 2H2"/>
        <path d="m18 6-7 8-7-8Z"/>
        <path d="M15.4 9.1A4 4 0 1 0 14 6"/>
        <path d="M11 14v8"/>
        <path d="M7 22h8"/>
    </svg>
);


const AddPauseModal: React.FC<AddPauseModalProps> = ({ onClose, onSave, existingOperators, currentUser }) => {
    const [formData, setFormData] = useState<Partial<PauseData>>({
        operatore: '',
        prima_pausa: null, 
        seconda_pausa: null, 
        pausa_pranzo: null, 
        terza_pausa: null
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.operatore) {
            alert("Selezionare un moderatore.");
            return;
        }

        if (!formData.prima_pausa && !formData.seconda_pausa && !formData.pausa_pranzo && !formData.terza_pausa) {
             alert('Inserire almeno un orario di pausa pianificato.');
             return;
        }
        onSave(formData);
    };

    const iconClasses = "w-5 h-5 text-[var(--c-primary-light)]";
    const labelClasses = "flex items-center gap-2 mb-1 text-sm font-medium text-gray-700";
    
    return (
         <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start p-4 pt-12">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
               <div className="p-6 border-b">
                 <h3 className="text-xl font-bold text-gray-800 flex items-center gap-3"><Clock className="w-6 h-6 text-[var(--c-primary-light)]"/> Pianifica le tue Pause</h3>
               </div>
               <form onSubmit={handleSubmit} noValidate>
                    <div className="p-6 space-y-4">
                        <div>
                           <label htmlFor="modal-operatore" className={labelClasses}><UserCircle className={iconClasses}/> Nome e Cognome:</label>
                           <select 
                                id="modal-operatore" 
                                name="operatore" 
                                value={formData.operatore} 
                                onChange={handleChange} 
                                className="form-input"
                                required
                            >
                                <option value="" disabled>-- Seleziona un moderatore --</option>
                                {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                            </select>
                        </div>
                        <div> <label htmlFor="modal-prima-pausa" className={labelClasses}><Coffee className={iconClasses}/> Prima Pausa (15 min):</label> <input type="time" id="modal-prima-pausa" name="prima_pausa" defaultValue={formData.prima_pausa || ''} onChange={handleChange} min="08:00" max="20:00" className="form-input"/> </div>
                        <div> <label htmlFor="modal-seconda-pausa" className={labelClasses}><Coffee className={iconClasses}/> Seconda Pausa (15 min):</label> <input type="time" id="modal-seconda-pausa" name="seconda_pausa" defaultValue={formData.seconda_pausa || ''} onChange={handleChange} min="08:00" max="20:00" className="form-input"/> </div>
                        <div> <label htmlFor="modal-pausa-pranzo" className={labelClasses}><HamburgerIcon className={iconClasses}/> Pausa Pranzo (1h):</label> <input type="time" id="modal-pausa-pranzo" name="pausa_pranzo" defaultValue={formData.pausa_pranzo || ''} onChange={handleChange} min="08:00" max="20:00" className="form-input"/> </div>
                        <div> <label htmlFor="modal-terza-pausa" className={labelClasses}><CocktailIcon className={iconClasses}/> Terza Pausa (15 min):</label> <input type="time" id="modal-terza-pausa" name="terza_pausa" defaultValue={formData.terza_pausa || ''} onChange={handleChange} min="08:00" max="20:00" className="form-input"/> </div>
                    </div>
                    <div className="px-6 py-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
                        <button type="submit" className="btn btn-primary"><Download className="w-5 h-5"/> Salva</button>
                    </div>
               </form>
            </div>
       </div>
    );
};

export default AddPauseModal;