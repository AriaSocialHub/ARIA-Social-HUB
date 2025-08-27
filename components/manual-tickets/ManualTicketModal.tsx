import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ManualTicket } from '../../types';
import { MODERATORI, SOGLIE, ARGOMENTI, PLATFORMS, toISOString, fromISOString } from './helpers';
import { X, Save } from 'lucide-react';

interface ManualTicketModalProps {
    ticket: ManualTicket | null;
    onSave: (ticket: ManualTicket) => void;
    onClose: () => void;
}

const formInputClasses = "w-full border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm bg-white text-gray-900 p-2.5 disabled:bg-gray-100 disabled:cursor-not-allowed";
const formLabelClasses = "block text-sm font-medium text-gray-700 mb-1";
const radioInputClasses = "appearance-none h-4 w-4 rounded-full border-2 border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition cursor-pointer disabled:border-gray-400 disabled:bg-gray-200";

const ManualTicketModal: React.FC<ManualTicketModalProps> = ({ ticket, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<ManualTicket>>({});
    const [dateDomanda, setDateDomanda] = useState({ date: '', time: '' });
    const [dateGestione, setDateGestione] = useState({ date: '', time: '' });
    
    useEffect(() => {
        if (ticket) {
            setFormData(ticket);
            setDateDomanda(fromISOString(ticket.data_domanda));
            setDateGestione(fromISOString(ticket.data_gestione));
        } else {
            const now = new Date();
            const today = now.toISOString().split('T')[0];
            const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
            setFormData({ piattaforma: 'Facebook Pubblico', azione_inoltro: '', azione_principale: null, soglia: '' });
            setDateDomanda({ date: today, time: currentTime });
            setDateGestione({ date: '', time: '' });
        }
    }, [ticket]);

    const isPublic = useMemo(() => {
        if (!formData.piattaforma) return true;
        return !formData.piattaforma.includes('Privato') && !formData.piattaforma.includes('Direct');
    }, [formData.piattaforma]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const dataGestione = toISOString(dateGestione.date, dateGestione.time);
        
        const finalTicket: Partial<ManualTicket> = {
            ...formData,
            id: ticket?.id,
            data_domanda: toISOString(dateDomanda.date, dateDomanda.time)!,
            data_gestione: dataGestione,
        };

        if(!finalTicket.data_domanda) {
            alert('Data e ora della domanda sono obbligatori.');
            return;
        }

        if (!finalTicket.azione_principale) {
            alert('Selezionare un\'azione principale obbligatoria.');
            return;
        }

        onSave(finalTicket as ManualTicket);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 p-4 pt-12" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800">{ticket ? `Modifica Ticket` : 'Nuovo Ticket'}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Chiudi"><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto">
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                        
                        <div><label htmlFor="piattaforma" className={formLabelClasses}>Piattaforma</label><select id="piattaforma" name="piattaforma" value={formData.piattaforma || ''} onChange={handleChange} required className={formInputClasses}><option value="" disabled>-- Seleziona --</option>{PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}</select></div>
                        <div><label htmlFor="nome_utente" className={formLabelClasses}>Nome Utente</label><input type="text" id="nome_utente" name="nome_utente" value={formData.nome_utente || ''} onChange={handleChange} required className={formInputClasses}/></div>
                        
                        <div className="col-span-full"><label htmlFor="testo_contenuto" className={formLabelClasses}>Testo Commento/Messaggio</label><textarea id="testo_contenuto" name="testo_contenuto" value={formData.testo_contenuto || ''} onChange={handleChange} required rows={3} className={formInputClasses}></textarea></div>

                        <div><label htmlFor="data_domanda_date" className={formLabelClasses}>Data Domanda</label><input type="date" id="data_domanda_date" value={dateDomanda.date} onChange={e => setDateDomanda(p => ({...p, date: e.target.value}))} required className={formInputClasses}/></div>
                        <div><label htmlFor="data_domanda_time" className={formLabelClasses}>Ora Domanda</label><input type="time" id="data_domanda_time" value={dateDomanda.time} onChange={e => setDateDomanda(p => ({...p, time: e.target.value}))} required className={formInputClasses}/></div>
                        
                        <div><label htmlFor="data_gestione_date" className={formLabelClasses}>Data Gestione</label><input type="date" id="data_gestione_date" value={dateGestione.date} onChange={e => setDateGestione(p => ({...p, date: e.target.value}))} className={formInputClasses}/></div>
                        <div><label htmlFor="data_gestione_time" className={formLabelClasses}>Ora Gestione</label><input type="time" id="data_gestione_time" value={dateGestione.time} onChange={e => setDateGestione(p => ({...p, time: e.target.value}))} className={formInputClasses}/></div>

                        <div><label htmlFor="moderatore" className={formLabelClasses}>Moderatore</label><select id="moderatore" name="moderatore" value={formData.moderatore || ''} onChange={handleChange} className={formInputClasses}><option value="">-- Seleziona --</option>{MODERATORI.map(m => <option key={m} value={m}>{m}</option>)}</select></div>
                        <div><label htmlFor="soglia" className={formLabelClasses}>Soglia (SLA)</label><select id="soglia" name="soglia" value={formData.soglia || ''} onChange={handleChange} className={formInputClasses}><option value="">-- Seleziona --</option>{SOGLIE.map(s => <option key={s} value={s}>{s}</option>)}</select></div>

                        {formData.piattaforma === 'Instagram Pubblico' && <div><label htmlFor="id_piattaforma" className={formLabelClasses}>ID Post/Commento</label><input type="text" id="id_piattaforma" name="id_piattaforma" value={formData.id_piattaforma || ''} onChange={handleChange} className={formInputClasses}/></div>}
                        {formData.piattaforma === 'LinkedIn Privato' && <div><label htmlFor="argomento" className={formLabelClasses}>Argomento</label><select id="argomento" name="argomento" value={formData.argomento || ''} onChange={handleChange} className={formInputClasses}><option value="">-- Seleziona --</option>{ARGOMENTI.map(a => <option key={a} value={a}>{a}</option>)}</select></div>}
                        
                        <fieldset className="col-span-full border border-gray-200 p-4 rounded-md">
                             <legend className="text-sm font-medium text-gray-700 px-2">Azione Principale (Obbligatoria)</legend>
                             <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                                {isPublic ? (
                                    ['Risposto', 'Nascosto', 'Reaction'].map(val => (
                                        <div key={val} className="flex items-center">
                                            <input type="radio" id={`azione_principale_${val}`} name="azione_principale" value={val} checked={formData.azione_principale === val} onChange={handleChange} required className={radioInputClasses} />
                                            <label htmlFor={`azione_principale_${val}`} className="ml-3 block text-sm text-gray-900">{val}</label>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex items-center">
                                        <input type="radio" id="azione_principale_Risposto" name="azione_principale" value="Risposto" checked={formData.azione_principale === 'Risposto'} onChange={handleChange} required className={radioInputClasses} />
                                        <label htmlFor="azione_principale_Risposto" className="ml-3 block text-sm text-gray-900">Risposto</label>
                                    </div>
                                )}
                                <div className="flex items-center">
                                    <input type="radio" id="azione_principale_Ignorato" name="azione_principale" value="Ignorato" checked={formData.azione_principale === 'Ignorato'} onChange={handleChange} required className={radioInputClasses} />
                                    <label htmlFor="azione_principale_Ignorato" className="ml-3 block text-sm text-gray-900">Ignorato</label>
                                </div>
                            </div>
                        </fieldset>
                        
                        <fieldset className="col-span-full border border-gray-200 p-4 rounded-md"><legend className="text-sm font-medium text-gray-700 px-2">Azione di Inoltro (Opzionale)</legend><div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">{['', 'Inoltrato al BO', 'Rilasciato al FO'].map(val => (<div key={val} className="flex items-center"><input type="radio" id={`azione_inoltro_${val || 'nessuna'}`} name="azione_inoltro" value={val} checked={formData.azione_inoltro === val} onChange={handleChange} className={radioInputClasses}/><label htmlFor={`azione_inoltro_${val || 'nessuna'}`} className="ml-3 block text-sm text-gray-900">{val || 'Nessuna'}</label></div>))}</div ></fieldset>

                    </div>
                    <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t sticky bottom-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 font-medium text-sm transition">Annulla</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium text-sm flex items-center gap-2 shadow-sm"><Save size={16}/> Salva Ticket</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ManualTicketModal;