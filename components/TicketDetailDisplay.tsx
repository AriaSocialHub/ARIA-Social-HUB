import React, { useState, useMemo, useEffect } from 'react';
import { Ticket } from '../types';
import ExpandableListItem from './ExpandableListItem';
import { Search, PlusCircle, Check, X, ChevronDown } from 'lucide-react';
import { robustParseDate } from '../services/utils';

interface TicketDetailDisplayProps {
  tickets: Ticket[];
  categoryName: string;
  onAddItem?: (categoryName: string, item: Ticket) => void;
  onUpdateItem?: (categoryName: string, itemId: string, updatedItem: Partial<Ticket>) => void;
  onDeleteItem?: (categoryName: string, itemId: string) => void;
  scrollToItemId?: string | null;
}

const PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444', '#06B6D4', '#F59E0B'];

const TicketDetailDisplay: React.FC<TicketDetailDisplayProps> = ({ tickets, categoryName, onAddItem, onUpdateItem, onDeleteItem, scrollToItemId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingArgomento, setIsAddingArgomento] = useState(false);
  const [newArgomentoName, setNewArgomentoName] = useState('');
  
  useEffect(() => {
    if (scrollToItemId) {
      const targetTicket = tickets.find(t => t.id === scrollToItemId);
      if (targetTicket?.argomento) {
        const argomentoId = `argomento-${targetTicket.argomento.replace(/[^a-zA-Z0-9-]/g, '-')}`;
        
        setTimeout(() => {
          const argomentoElement = document.getElementById(argomentoId) as HTMLDetailsElement | null;
          if (argomentoElement) {
              if (!argomentoElement.open) {
                  // Clicking the summary is a more reliable way to trigger the open animation and event listeners
                  argomentoElement.querySelector('summary')?.click();
              }

              setTimeout(() => {
                  const ticketElement = document.getElementById(`item-${scrollToItemId}`);
                  if (ticketElement) {
                      ticketElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      ticketElement.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
                      ticketElement.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                      const summary = ticketElement.querySelector('summary');
                      if (summary && !(ticketElement as HTMLDetailsElement).open) {
                          summary.click();
                      }
                      setTimeout(() => {
                        ticketElement.style.backgroundColor = '';
                      }, 2500);
                  }
              }, 200);
          }
        }, 100);
      }
    }
  }, [scrollToItemId, tickets]);

  const groupedTickets = useMemo(() => {
    return tickets.reduce((acc, ticket) => {
      const key = ticket.argomento || 'Senza Argomento';
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(ticket);
      return acc;
    }, {} as Record<string, Ticket[]>);
  }, [tickets]);

  const sortedGroupKeys = useMemo(() => {
    const getLatestDateForGroup = (groupKey: string): Date => {
      const ticketsInGroup = groupedTickets[groupKey];
      if (!ticketsInGroup || ticketsInGroup.length === 0) {
        return new Date(0); // Epoch for empty/invalid groups
      }
      // Map tickets to their dates, parse them, and find the max
      const dates = ticketsInGroup.map(ticket => robustParseDate(ticket.data));
      return new Date(Math.max(...dates.map(d => d.getTime())));
    };

    return Object.keys(groupedTickets).sort((a, b) => {
      const latestDateA = getLatestDateForGroup(a);
      const latestDateB = getLatestDateForGroup(b);
      // Sort descending: most recent first
      return latestDateB.getTime() - latestDateA.getTime();
    });
  }, [groupedTickets]);

  const filteredArgomenti = useMemo(() => {
      if (!searchTerm) return sortedGroupKeys;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return sortedGroupKeys.filter(argomento =>
          argomento.toLowerCase().includes(lowerCaseSearchTerm) ||
          groupedTickets[argomento].some(ticket => 
              (ticket.richiesta && ticket.richiesta.toLowerCase().includes(lowerCaseSearchTerm)) ||
              (ticket.risoluzione && ticket.risoluzione.toLowerCase().includes(lowerCaseSearchTerm)) ||
              (ticket.nTicket && ticket.nTicket.toLowerCase().includes(lowerCaseSearchTerm))
          )
      );
  }, [sortedGroupKeys, groupedTickets, searchTerm]);

  const handleSaveNewArgomento = () => {
    if (newArgomentoName && newArgomentoName.trim() && onAddItem) {
        const newTicket: Ticket = {
            id: `ticket-${Date.now()}`,
            utente: null,
            nTicket: null,
            argomento: newArgomentoName.trim(),
            richiesta: `Nuova richiesta per l'argomento "${newArgomentoName.trim()}"`,
            risoluzione: '',
            data: new Date().toLocaleDateString('it-IT'),
            canale: null,
            operatore: null,
        };
        onAddItem(categoryName, newTicket);
        setNewArgomentoName('');
        setIsAddingArgomento(false);
    }
  };

  const handleItemUpdate = (itemId: string, updatedData: { title: string; content: string | null }) => {
      if (onUpdateItem) {
          onUpdateItem(categoryName, itemId, { 
              richiesta: updatedData.title,
              risoluzione: updatedData.content,
          });
      }
  };

  const handleItemDelete = (itemId: string) => {
      if (onDeleteItem) {
          onDeleteItem(categoryName, itemId);
      }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold text-gray-800">Domande Frequenti (FAQ)</h2>
      <p className="text-gray-600 mt-1 mb-6">Trova le risposte alle domande più comuni in questa sezione.</p>

      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div className="relative flex-grow min-w-[200px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cerca argomento o ticket..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
          />
        </div>
        {!isAddingArgomento && onAddItem && (
          <button
              onClick={() => setIsAddingArgomento(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
              <PlusCircle className="h-5 w-5"/>
              <span>Nuovo Argomento</span>
          </button>
        )}
      </div>

      {isAddingArgomento && onAddItem && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-4">
              <input
                  type="text"
                  placeholder="Nome del nuovo argomento"
                  value={newArgomentoName}
                  onChange={(e) => setNewArgomentoName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveNewArgomento()}
                  className="flex-grow pl-4 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                  autoFocus
              />
              <button onClick={() => setIsAddingArgomento(false)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                  <X className="h-5 w-5 text-gray-600" />
              </button>
              <button onClick={handleSaveNewArgomento} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
                  <Check className="h-5 w-5 text-blue-700" />
              </button>
          </div>
      )}

      <div className="space-y-3">
        {filteredArgomenti.length > 0 ? filteredArgomenti.map((argomento, index) => {
          const ticketsInArgomento = groupedTickets[argomento];
          const argomentoId = `argomento-${argomento.replace(/[^a-zA-Z0-9-]/g, '-')}`;
          const color = PALETTE[index % PALETTE.length];

          return (
            <details key={argomento} id={argomentoId} className="group rounded-md" style={{ borderLeft: `4px solid ${color}` }}>
              <summary className="flex items-center justify-between p-4 list-none cursor-pointer" style={{ backgroundColor: `${color}1A` }}>
                <h3 className="font-semibold" style={{ color }}>{argomento}</h3>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white px-2.5 py-0.5 rounded-full" style={{ backgroundColor: color }}>
                        {ticketsInArgomento.length}
                    </span>
                    <ChevronDown className="h-5 w-5 text-gray-500 transition-transform duration-200 group-open:rotate-180" />
                </div>
              </summary>
              <div className="p-4 bg-white" style={{ borderTop: `1px solid ${color}33` }}>
                <div className="divide-y divide-gray-100 -mx-4">
                    {ticketsInArgomento.map(ticket => (
                      <ExpandableListItem
                        key={ticket.id}
                        id={ticket.id}
                        title={ticket.richiesta || 'Richiesta non specificata'}
                        content={ticket.risoluzione}
                        date={ticket.data}
                        onUpdate={onUpdateItem ? handleItemUpdate : undefined}
                        onDelete={onDeleteItem ? handleItemDelete : undefined}
                        contentLabel="Risoluzione/Risposta"
                      />
                    ))}
                </div>
              </div>
            </details>
          );
        }) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
              <p className="text-gray-600">{searchTerm ? `Nessun risultato trovato per "${searchTerm}".` : 'Non ci sono argomenti in questa sezione.'}</p>
              {onAddItem && <p className="text-sm text-gray-500 mt-2">Usa il pulsante "Nuovo Argomento" per crearne uno.</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketDetailDisplay;