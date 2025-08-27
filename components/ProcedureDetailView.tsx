import React, { useState, useMemo, useEffect } from 'react';
import { Procedura } from '../types';
import { ChevronRight, Search, PlusCircle } from 'lucide-react';
import ExpandableListItem from './ExpandableListItem';
import { getIcon } from '../services/iconRegistry';

interface CategoryMetadata {
  icon: string;
  color: string;
}

interface ProcedureDetailViewProps {
  categoryName: string;
  procedures: Procedura[];
  onBack: () => void;
  categoryMetadata?: CategoryMetadata;
  onAddItem?: (categoryName: string, item: Procedura) => void;
  onUpdateItem?: (categoryName: string, itemId: string, updatedItem: Partial<Procedura>) => void;
  onDeleteItem?: (categoryName: string, itemId: string) => void;
  scrollToItemId?: string | null;
}

const PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444', '#06B6D4', '#F59E0B'];

const ProcedureDetailView: React.FC<ProcedureDetailViewProps> = ({ categoryName, procedures, onBack, categoryMetadata, onAddItem, onUpdateItem, onDeleteItem, scrollToItemId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newlyAddedItemId, setNewlyAddedItemId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollToItemId) {
      const element = document.getElementById(`item-${scrollToItemId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.style.transition = 'background-color 0.3s ease, border-color 0.3s ease';
        element.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
        const summary = element.querySelector('summary');
        if (summary && !(element as HTMLDetailsElement).open) {
          summary.click();
        }
        setTimeout(() => {
          element.style.backgroundColor = '';
        }, 2000);
      }
    }
  }, [scrollToItemId, procedures]);

  const handleAddItem = () => {
    if (!onAddItem) return;
    const newId = `proc-${Date.now()}`;
    const newItem: Procedura = {
        id: newId,
        casistica: 'Nuova Procedura',
        comeAgire: '',
        dataInserimento: new Date().toLocaleDateString('it-IT')
    };
    onAddItem(categoryName, newItem);
    setNewlyAddedItemId(newId);
  };
  
  const handleUpdateItem = (itemId: string, updatedData: { title: string; content: string | null }) => {
      onUpdateItem?.(categoryName, itemId, { casistica: updatedData.title, comeAgire: updatedData.content });
      if (itemId === newlyAddedItemId) setNewlyAddedItemId(null);
  };
  
  const handleDeleteItem = (itemId: string) => {
      onDeleteItem?.(categoryName, itemId);
      if (itemId === newlyAddedItemId) setNewlyAddedItemId(null);
  }

  const filteredProcedures = useMemo(() => {
    if (!searchTerm) {
      return procedures;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return procedures.filter(procedure =>
      procedure.casistica.toLowerCase().includes(lowercasedFilter) ||
      (procedure.comeAgire && procedure.comeAgire.toLowerCase().includes(lowercasedFilter))
    );
  }, [procedures, searchTerm]);

  const IconComponent = getIcon(categoryMetadata?.icon);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
          <button onClick={onBack} className="hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-700 focus:underline">
              Tutte le Sezioni
          </button>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="font-semibold text-gray-800 flex items-center gap-2">
              <IconComponent className="h-5 w-5" style={{ color: categoryMetadata?.color }} />
              {categoryName}
          </span>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800">Procedure</h2>
        <p className="text-gray-600 mt-1 mb-6">Consulta le procedure operative per le casistiche più comuni.</p>

        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cerca per casistica o istruzioni..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
              aria-label="Cerca procedure"
            />
          </div>
          {onAddItem && (
              <button
                  onClick={handleAddItem}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                  <PlusCircle className="h-4 w-4"/>
                  <span>Aggiungi Procedura</span>
              </button>
          )}
        </div>
      
        <div className="space-y-3">
            {filteredProcedures.length > 0 ? (
                filteredProcedures.map((procedure, index) => (
                    <ExpandableListItem
                      key={procedure.id} 
                      id={procedure.id}
                      title={procedure.casistica}
                      content={procedure.comeAgire}
                      date={procedure.dataInserimento}
                      startInEditMode={procedure.id === newlyAddedItemId}
                      onUpdate={onUpdateItem ? handleUpdateItem : undefined}
                      onDelete={onDeleteItem ? handleDeleteItem : undefined}
                      useFaqStyle={true}
                      color={PALETTE[index % PALETTE.length]}
                    />
                ))
            ) : (
                <div className="text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed">
                    <p className="text-gray-600">Nessun risultato trovato per "{searchTerm}".</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ProcedureDetailView;