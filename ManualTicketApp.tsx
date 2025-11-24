import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { ManualTicket, ManualTicketsData, User } from './types';
import { useData } from './contexts/DataContext';
import { Search, Plus, Download, Edit, Trash2, Filter as FilterIcon, AlertTriangle, Moon } from 'lucide-react';
import ManualTicketModal from './components/manual-tickets/ManualTicketModal';
import {
    getPlatformIcon,
    getFlagIcons,
    calculateDiff,
    isFuoriOrario,
    formatDateTime,
    MODERATORI,
    SOGLIE,
    ARGOMENTI,
    PLATFORMS,
    FLAG_MAP
} from './components/manual-tickets/helpers';

declare const html2pdf: any;

interface ManualTicketAppProps {
  serviceId: string;
  isReadOnly: boolean;
  currentUser: User | null;
}

const ManualTicketApp: React.FC<ManualTicketAppProps> = ({ serviceId, isReadOnly, currentUser }) => {
    const { servicesData, saveServiceData } = useData();
    const tickets: ManualTicketsData = servicesData[serviceId]?.data || [];

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTicket, setEditingTicket] = useState<ManualTicket | null>(null);
    const [ticketToDelete, setTicketToDelete] = useState<ManualTicket | null>(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
    const [filterDropdown, setFilterDropdown] = useState<{ open: boolean, key: string, target: HTMLElement | null }>({ open: false, key: '', target: null });
    const filterDropdownRef = useRef<HTMLDivElement>(null);
    
    // Custom permission logic for this component
    const userAccessLevel = currentUser?.accessLevel;
    const isViewingAsModerator = userAccessLevel === 'admin' && isReadOnly;

    const canAdd = !isViewingAsModerator;
    const canEdit = !isViewingAsModerator;
    const canDelete = userAccessLevel === 'admin' && !isViewingAsModerator;

    const handleDataUpdate = (newTickets: ManualTicketsData, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => {
        if (!currentUser) return;
        saveServiceData(serviceId, newTickets, currentUser.name, action, title, itemId);
    };

    const handleSaveTicket = (ticket: ManualTicket) => {
        const isUpdate = !!ticket.id;
        let finalTicket = ticket;
        if (!isUpdate) {
            finalTicket = { ...ticket, id: `manual-ticket-${Date.now()}` };
        }
        
        const newTickets = isUpdate
            ? tickets.map(t => (t.id === finalTicket.id ? finalTicket : t))
            : [...tickets, finalTicket];

        const action = isUpdate ? 'update' : 'add';
        const title = `Ticket per ${ticket.nome_utente}`;
        handleDataUpdate(newTickets, action, title, finalTicket.id);
        setIsModalOpen(false);
    };

    const confirmDeleteTicket = () => {
        if (!ticketToDelete || !currentUser) return;
        const title = `Ticket per ${ticketToDelete.nome_utente}`;
        handleDataUpdate(tickets.filter(t => t.id !== ticketToDelete.id), 'delete', title, ticketToDelete.id);
        setTicketToDelete(null);
    };
    
    const augmentedTickets = useMemo(() => {
        return tickets.map(t => {
            const diff = calculateDiff(t.data_domanda, t.data_gestione);
            const fuoriOrario = isFuoriOrario(t.data_domanda);
            const dataDomandaObj = new Date(t.data_domanda);
            const data_domanda_month_year = dataDomandaObj.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

            const flag_texts: string[] = [];
            if (t.azione_principale) flag_texts.push(t.azione_principale);
            else flag_texts.push('Non Risposto');
            if (t.azione_inoltro) flag_texts.push(t.azione_inoltro);

            return { ...t, diff, fuoriOrario, data_domanda_month_year, flag_texts, fuori_orario_text: fuoriOrario ? 'Sì' : 'No' };
        });
    }, [tickets]);

    const filteredTickets = useMemo(() => {
        let filtered = augmentedTickets;

        if (globalSearch) {
            const lowerCaseTerm = globalSearch.toLowerCase();
            const searchableKeys: (keyof ManualTicket)[] = ['piattaforma', 'nome_utente', 'moderatore', 'soglia', 'testo_contenuto'];
            filtered = filtered.filter(t => searchableKeys.some(key => String(t[key] || '').toLowerCase().includes(lowerCaseTerm)));
        }

        Object.entries(columnFilters).forEach(([key, value]) => {
            if (!value) return;
            filtered = filtered.filter(t => {
                if (key === 'flags') return (t as any).flag_texts.includes(value);
                return String((t as any)[key] || 'N/D') === value;
            });
        });
        
        return filtered.sort((a,b) => new Date(b.data_domanda).getTime() - new Date(a.data_domanda).getTime());
    }, [augmentedTickets, globalSearch, columnFilters]);

    const handleFilterDropdown = (e: React.MouseEvent<HTMLSpanElement>, key: string) => {
        e.stopPropagation();
        setFilterDropdown({ open: true, key, target: e.currentTarget });
    };
    
    const handleColumnFilterSelect = (key: string, value: string) => {
        setColumnFilters(prev => {
            const newFilters = { ...prev };
            if (value) newFilters[key] = value;
            else delete newFilters[key];
            return newFilters;
        });
        setFilterDropdown({ open: false, key: '', target: null });
    };
    
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
                setFilterDropdown({ open: false, key: '', target: null });
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const generatePDF = () => {
        if (filteredTickets.length === 0) {
            alert("Nessun ticket da esportare.");
            return;
        }

        const tableContent = `
            <style>
                body { color: #333333; }
                table { width: 100%; border-collapse: collapse; font-family: Inter, sans-serif; font-size: 9px; }
                th, td { border: 1px solid #ddd; padding: 5px; text-align: left; word-break: break-word; }
                th { background-color: #f2f2f2; }
                .header-container { text-align: right; margin-bottom: 20px; font-family: sans-serif; }
                .header-container h1 { font-size: 18px; margin: 0; color: #1d4ed8; }
                .header-container p { font-size: 8px; color: #64748b; margin: 2px 0; }
            </style>
            <table>
                <thead>
                    <tr>
                        ${['Piattaforma', 'Utente', 'Data Domanda', 'Fuori orario', 'Moderatore', 'Data Gestione', 'Diff.', 'Soglia', 'Flag'].map(h => `<th>${h}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${filteredTickets.map(ticket => `
                        <tr>
                            <td>${ticket.piattaforma || '–'}</td>
                            <td>${ticket.nome_utente || '–'}</td>
                            <td>${formatDateTime(ticket.data_domanda)}</td>
                            <td>${ticket.fuoriOrario ? 'Sì' : 'No'}</td>
                            <td>${ticket.moderatore || '–'}</td>
                            <td>${formatDateTime(ticket.data_gestione)}</td>
                            <td>${ticket.diff || '–'}</td>
                            <td>${ticket.soglia || '–'}</td>
                            <td>${ticket.flag_texts.join(', ')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        const exportDate = new Date().toLocaleString('it-IT', { dateStyle: 'full', timeStyle: 'short' });
        const headerHTML = `
            <div class="header-container">
                <h1>Report Ticket Manuale</h1>
                <p>Data di esportazione: ${exportDate}</p>
            </div>
        `;

        const elementToPrint = document.createElement('div');
        elementToPrint.innerHTML = headerHTML + tableContent;
        
        html2pdf().from(elementToPrint).set({
            margin: 10,
            filename: `Report_Ticket_${new Date().toISOString().slice(0, 10)}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        }).save().catch((err: any) => {
            console.error("PDF generation failed:", err);
            alert("Si è verificato un errore durante la generazione del PDF.");
        });
    };


    const renderColumnFilter = () => {
        if (!filterDropdown.open) return null;
        
        const { key, target } = filterDropdown;
        const rect = target!.getBoundingClientRect();
        
        let uniqueValues: string[];
        if (key === 'flags') {
            uniqueValues = Object.keys(FLAG_MAP);
        } else if (key === 'moderatore') {
            uniqueValues = MODERATORI;
        } else if (key === 'soglia') {
            uniqueValues = SOGLIE;
        } else {
            uniqueValues = [...new Set(augmentedTickets.map(t => String((t as any)[key] || 'N/D')).filter(Boolean))].sort((a,b) => a.localeCompare(b));
        }

        return (
            <div ref={filterDropdownRef} style={{ top: rect.bottom + window.scrollY + 5, left: rect.left }} className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg min-w-[220px] max-h-72 overflow-y-auto p-2">
                <ul>
                    <li onClick={() => handleColumnFilterSelect(key, '')} className="p-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer font-semibold text-gray-500">-- Tutti --</li>
                    {uniqueValues.map(value => (
                        <li key={value} onClick={() => handleColumnFilterSelect(key, value)} className={`p-2 text-sm rounded-md hover:bg-gray-100 cursor-pointer ${columnFilters[key] === value ? 'bg-blue-100 text-blue-800 font-semibold' : ''}`}>
                            {value}
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
    
    const centeredHeaders = ['Fuori orario', 'Diff.', 'Soglia', 'Flag'];

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Ticket manuali</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                     <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input type="search" placeholder="Cerca ovunque..." value={globalSearch} onChange={e => setGlobalSearch(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
                    </div>
                    <button onClick={generatePDF} className="p-2.5 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 shadow-sm" title="Esporta PDF"><Download className="h-5 w-5" /></button>
                    {canAdd && (
                        <button onClick={() => { setEditingTicket(null); setIsModalOpen(true); }} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 shadow-sm font-semibold">
                            <Plus className="h-5 w-5" />
                            <span className="hidden sm:inline">Nuovo</span>
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Piattaforma', 'Utente', 'Data Domanda', 'Fuori orario', 'Moderatore', 'Data Gestione', 'Diff.', 'Soglia', 'Flag'].map(h => {
                                const keyMap: Record<string, string> = { 'Piattaforma': 'piattaforma', 'Utente': 'nome_utente', 'Data Domanda': 'data_domanda_month_year', 'Fuori orario': 'fuori_orario_text', 'Moderatore': 'moderatore', 'Soglia': 'soglia', 'Flag': 'flags'};
                                const filterKey = keyMap[h];
                                return (
                                    <th key={h} className={`px-4 py-3 font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap ${centeredHeaders.includes(h) ? 'text-center' : 'text-left'}`}>
                                        <div className={`flex items-center gap-2 ${centeredHeaders.includes(h) ? 'justify-center' : ''}`}>
                                            {h}
                                            {filterKey && <span onClick={(e) => handleFilterDropdown(e, filterKey)} className={`cursor-pointer p-1 rounded-full hover:bg-gray-200 ${columnFilters[filterKey] ? 'text-blue-600' : 'text-gray-400'}`}><FilterIcon size={14} /></span>}
                                        </div>
                                    </th>
                                )
                            })}
                            {(canEdit || canDelete) && <th className="px-4 py-3 text-left font-semibold text-gray-600 uppercase tracking-wider">Azioni</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredTickets.length > 0 ? filteredTickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 whitespace-nowrap"><div className="flex items-center gap-3">{getPlatformIcon(ticket.piattaforma)} <span className="font-semibold text-gray-800">{ticket.piattaforma}</span></div></td>
                                <td className="px-4 py-3 max-w-xs"><div className="font-bold text-gray-800 truncate">{ticket.nome_utente}</div><div className="text-gray-500 truncate">{ticket.testo_contenuto}</div></td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDateTime(ticket.data_domanda)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    {ticket.fuoriOrario && <span title="Fuori Orario"><Moon className="w-5 h-5 text-indigo-600 mx-auto"/></span>}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{ticket.moderatore || '–'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700">{formatDateTime(ticket.data_gestione)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-gray-700 font-medium text-center">{ticket.diff || '–'}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-center"><span className={`font-bold ${ticket.soglia === 'KO' ? 'text-red-600' : 'text-green-600'}`}>{ticket.soglia || '–'}</span></td>
                                <td className="px-4 py-3 whitespace-nowrap text-xl text-center">{getFlagIcons(ticket)}</td>
                                {(canEdit || canDelete) && <td className="px-4 py-3 whitespace-nowrap">
                                    {canEdit && <button onClick={() => {setEditingTicket(ticket); setIsModalOpen(true);}} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" title="Modifica"><Edit size={16}/></button>}
                                    {canDelete && <button onClick={() => setTicketToDelete(ticket)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Elimina"><Trash2 size={16}/></button>}
                                </td>}
                            </tr>
                        )) : (
                            <tr><td colSpan={(canEdit || canDelete) ? 10 : 9} className="text-center py-16 text-gray-500 bg-white">Nessun ticket trovato.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {renderColumnFilter()}

            {isModalOpen && <ManualTicketModal ticket={editingTicket} onSave={handleSaveTicket} onClose={() => setIsModalOpen(false)} />}
            
            {ticketToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setTicketToDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma Eliminazione</h2>
                        <p className="text-gray-600 mb-6">
                            Sei sicuro di voler eliminare il ticket per <strong>{ticketToDelete.nome_utente}</strong> del {formatDateTime(ticketToDelete.data_domanda)}? L'azione è irreversibile.
                        </p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setTicketToDelete(null)} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-md hover:bg-gray-300 transition">Annulla</button>
                            <button onClick={confirmDeleteTicket} className="px-6 py-2 bg-red-600 text-white font-semibold rounded-md hover:bg-red-700 transition flex items-center gap-2">
                                <Trash2 className="w-4 h-4"/>
                                Elimina
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManualTicketApp;