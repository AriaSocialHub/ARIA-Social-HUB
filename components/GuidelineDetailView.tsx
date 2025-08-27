import React, { useState, useMemo, useEffect } from 'react';
import { Guideline } from '../types';
import { ChevronRight, Search, PlusCircle, Pencil, Trash2, Check, X } from 'lucide-react';
import ExpandableListItem from './ExpandableListItem';
import { getIcon } from '../services/iconRegistry';

interface CategoryMetadata {
  icon: string;
  color: string;
}

interface GuidelineDetailViewProps {
  categoryName: string;
  guidelines: Guideline[];
  onBack: () => void;
  categoryMetadata?: CategoryMetadata;
  onAddItem?: (categoryName: string, item: Guideline) => void;
  onUpdateItem?: (categoryName: string, itemId: string, updatedItem: Partial<Guideline>) => void;
  onDeleteItem?: (categoryName: string, itemId: string) => void;
  scrollToItemId?: string | null;
}

const PALETTE = ['#3B82F6', '#10B981', '#8B5CF6', '#F97316', '#EF4444', '#06B6D4', '#F59E0B'];

const GuidelineDetailView: React.FC<GuidelineDetailViewProps> = ({ categoryName, guidelines, onBack, categoryMetadata, onAddItem, onUpdateItem, onDeleteItem, scrollToItemId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [newlyAddedItemId, setNewlyAddedItemId] = useState<string | null>(null);
  const [editingEmoticonId, setEditingEmoticonId] = useState<string | null>(null);
  const [editedEmoticonValue, setEditedEmoticonValue] = useState('');
  const [confirmingDeleteEmoticon, setConfirmingDeleteEmoticon] = useState<string | null>(null);

  const isEmoticonCategory = useMemo(() => categoryName.toUpperCase().includes('EMOTICON'), [categoryName]);

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
  }, [scrollToItemId, guidelines]);

  const handleAddItem = () => {
    if (!onAddItem) return;
    const newId = `guide-${Date.now()}`;
    const newItem: Guideline = {
        id: newId,
        casistica: isEmoticonCategory ? '🆕' : 'Nuova Linea Guida',
        comeAgire: '',
        dataInserimento: new Date().toLocaleDateString('it-IT')
    };
    onAddItem(categoryName, newItem);
    setNewlyAddedItemId(newId);
    if(isEmoticonCategory) {
        setEditingEmoticonId(newId);
        setEditedEmoticonValue('🆕');
    }
  };
  
  const handleUpdateItem = (itemId: string, updatedData: { title: string; content: string | null }) => {
      onUpdateItem?.(categoryName, itemId, { casistica: updatedData.title, comeAgire: updatedData.content });
      if (itemId === newlyAddedItemId) setNewlyAddedItemId(null);
  };
  
  const handleDeleteItem = (itemId: string) => {
      onDeleteItem?.(categoryName, itemId);
      if (itemId === newlyAddedItemId) setNewlyAddedItemId(null);
  }

  const filteredGuidelines = useMemo(() => {
    if (!searchTerm) {
      return guidelines;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return guidelines.filter(guideline =>
      guideline.casistica.toLowerCase().includes(lowercasedFilter) ||
      (guideline.comeAgire && guideline.comeAgire.toLowerCase().includes(lowercasedFilter))
    );
  }, [guidelines, searchTerm]);

  const renderStandardView = () => (
     <div className="bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold text-gray-800">Linee Guida</h2>
        <p className="text-gray-600 mt-1 mb-6">Consulta le linee guida per le casistiche più comuni.</p>
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cerca per casistica o istruzioni..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            aria-label="Cerca linee guida"
          />
        </div>
        <div className="space-y-3">
            {filteredGuidelines.length > 0 ? (
                filteredGuidelines.map((guideline, index) => (
                    <ExpandableListItem
                      key={guideline.id} 
                      id={guideline.id}
                      title={guideline.casistica}
                      content={guideline.comeAgire}
                      date={guideline.dataInserimento}
                      startInEditMode={guideline.id === newlyAddedItemId}
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
  );
  
  const handleStartEmoticonUpdate = (id: string, casistica: string) => {
    setEditingEmoticonId(id);
    setEditedEmoticonValue(casistica);
    setConfirmingDeleteEmoticon(null);
  };
  
  const handleSaveEmoticonUpdate = () => {
    if (editingEmoticonId && editedEmoticonValue.trim()) {
      onUpdateItem?.(categoryName, editingEmoticonId, { casistica: editedEmoticonValue.trim() });
    }
    setEditingEmoticonId(null);
    setEditedEmoticonValue('');
    setNewlyAddedItemId(null);
  };
  
  const handleCancelEmoticonUpdate = (id: string) => {
      setEditingEmoticonId(null);
      if(newlyAddedItemId === id && onDeleteItem) {
          onDeleteItem(categoryName, id);
      }
      setNewlyAddedItemId(null);
  }

  const renderEmoticonView = () => (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
       <div className="flex flex-wrap gap-3 justify-center">
        {filteredGuidelines.map(guideline => {
            if (editingEmoticonId === guideline.id && onUpdateItem) {
                return (
                    <div key={guideline.id} id={`item-${guideline.id}`} className="text-3xl p-3 bg-blue-100 rounded-lg ring-2 ring-blue-500 flex items-center gap-2">
                        <input
                            type="text"
                            value={editedEmoticonValue}
                            onChange={(e) => setEditedEmoticonValue(e.target.value)}
                            className="w-16 p-1 text-center bg-white text-gray-900 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEmoticonUpdate()}
                        />
                        <button onClick={() => handleCancelEmoticonUpdate(guideline.id)} className="p-1 rounded-full hover:bg-gray-200">
                            <X className="h-5 w-5 text-gray-600"/>
                        </button>
                        <button onClick={handleSaveEmoticonUpdate} className="p-1 rounded-full hover:bg-blue-200">
                           <Check className="h-5 w-5 text-blue-700"/>
                        </button>
                    </div>
                )
            }
            return (
              <div key={guideline.id} id={`item-${guideline.id}`} className="group relative text-3xl p-3 bg-gray-100 rounded-lg transition-transform hover:scale-110" title={guideline.casistica}>
                {guideline.casistica}
                {onUpdateItem && onDeleteItem && (
                    confirmingDeleteEmoticon !== guideline.id ? (
                        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleStartEmoticonUpdate(guideline.id, guideline.casistica)} className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-gray-200 transition-colors">
                                <Pencil className="h-4 w-4 text-gray-700"/>
                            </button>
                            <button onClick={() => setConfirmingDeleteEmoticon(guideline.id)} className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-red-200 transition-colors">
                                <Trash2 className="h-4 w-4 text-red-600"/>
                            </button>
                        </div>
                    ) : (
                        <div className="absolute -top-2 -right-2 z-10 flex items-center gap-1 bg-white p-1 rounded-lg shadow-md">
                            <button onClick={() => setConfirmingDeleteEmoticon(null)} className="p-1.5 rounded-full hover:bg-gray-200">
                               <X className="h-4 w-4 text-gray-600"/>
                            </button>
                            <button onClick={() => { onDeleteItem(categoryName, guideline.id); setConfirmingDeleteEmoticon(null); }} className="p-1.5 rounded-full hover:bg-red-200">
                               <Check className="h-4 w-4 text-red-700"/>
                            </button>
                        </div>
                    )
                )}
              </div>
            )
        })}
      </div>
    </div>
  );
  
  const IconComponent = getIcon(categoryMetadata?.icon);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-2 text-sm text-gray-600">
        <div 
            className="flex items-center gap-2"
        >
            <button onClick={onBack} className="hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-700 focus:underline">
                Tutte le Sezioni
            </button>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="font-semibold text-gray-800 flex items-center gap-2">
                <IconComponent className="h-5 w-5" style={{ color: categoryMetadata?.color }} />
                {categoryName}
            </span>
        </div>
        {onAddItem &&
            <button
                onClick={handleAddItem}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-opacity"
            >
                <PlusCircle className="h-4 w-4"/>
                <span>{isEmoticonCategory ? 'Aggiungi Emoticon' : 'Aggiungi Linea Guida'}</span>
            </button>
        }
      </div>
      
      {isEmoticonCategory ? renderEmoticonView() : renderStandardView()}
    </div>
  );
};

export default GuidelineDetailView;