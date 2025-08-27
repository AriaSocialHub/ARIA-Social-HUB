import React, { useState, useEffect } from 'react';
import { Folder, ArrowRight, PlusCircle, Pencil, Trash2, Check, X, Search } from 'lucide-react';
import { getIcon } from '../services/iconRegistry';
import IconPicker from './IconPicker';

interface CategoryMetadata {
  icon: string;
  color: string;
}

interface CategorySelectorProps {
  categories: Record<string, any[]>;
  onSelect: (category: string) => void;
  onAddCategoryClick?: () => void;
  onDeleteCategory?: (name: string) => void;
  onRenameCategory?: (oldName: string, newName: string) => void;
  metadata?: Record<string, CategoryMetadata>;
  onUpdateCategoryMetadata?: (categoryName: string, meta: Partial<CategoryMetadata>) => void;
  itemNoun?: string;
  itemNounPlural?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({ 
    categories, 
    onSelect, 
    onAddCategoryClick, 
    onDeleteCategory, 
    onRenameCategory,
    metadata,
    onUpdateCategoryMetadata,
    itemNoun = "voce",
    itemNounPlural = "voci"
}) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [confirmingDelete, setConfirmingDelete] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [pickingIconFor, setPickingIconFor] = useState<string | null>(null);

  const sortedCategories = Object.entries(categories).sort(([a], [b]) => a.localeCompare(b));
  const filteredCategories = sortedCategories.filter(([name]) => 
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditClick = (name: string) => {
    setEditingCategory(name);
    setNewCategoryName(name);
    setConfirmingDelete(null);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNewCategoryName('');
  };

  const handleSaveEdit = () => {
    if (editingCategory && newCategoryName.trim() && onRenameCategory) {
      onRenameCategory(editingCategory, newCategoryName.trim());
    }
    handleCancelEdit();
  };

  const handleDelete = (name: string) => {
    if (onDeleteCategory) {
        onDeleteCategory(name);
        setConfirmingDelete(null);
    }
  };

  const renderCategoryCard = (name: string, items: any[]) => {
    const meta = metadata?.[name];
    const IconComponent = getIcon(meta?.icon);
    const itemCount = items.length;
    const itemNounDisplay = itemCount === 1 ? itemNoun : itemNounPlural;

    return (
     <div key={name} className="relative bg-white border border-gray-200 rounded-lg shadow-sm flex flex-col h-full transition-all duration-200 hover:shadow-md hover:border-blue-300">
        {editingCategory === name && onRenameCategory ? (
            <div className="p-5 bg-white border-2 border-blue-500 rounded-lg shadow-lg h-full flex flex-col justify-between">
              <input 
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                className="text-lg font-semibold text-gray-800 border-b-2 border-blue-300 focus:outline-none w-full bg-white text-gray-900"
                autoFocus
              />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={handleCancelEdit} className="p-2 rounded-full hover:bg-gray-200"> <X className="h-5 w-5 text-gray-600"/> </button>
                <button onClick={handleSaveEdit} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200"> <Check className="h-5 w-5 text-blue-700"/> </button>
              </div>
            </div>
         ) : (
            <div className="p-5 flex flex-col flex-grow group">
                <div className="flex-grow">
                    <div className="flex items-start justify-between">
                        <button onClick={() => onSelect(name)} className="flex items-center gap-3 text-left w-full">
                           <div className="relative">
                              <IconComponent className="h-8 w-8" style={{ color: meta?.color || '#4A5568' }} />
                                {onUpdateCategoryMetadata && (
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); setPickingIconFor(name === pickingIconFor ? null : name); }}
                                      className="absolute -top-1 -right-1 p-1 bg-white rounded-full shadow-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                      aria-label="Cambia icona"
                                  >
                                      <Pencil className="h-3 w-3" />
                                  </button>
                                )}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-800 group-hover:text-blue-700 transition-colors break-all">{name}</h3>
                        </button>
                        <span className="text-sm font-bold bg-gray-100 text-gray-700 px-3 py-1 rounded-full group-hover:bg-blue-100 group-hover:text-blue-800 transition-colors ml-2">
                            {itemCount}
                        </span>
                    </div>
                    <p className="mt-3 text-sm text-gray-600">
                        Contiene {itemCount} {itemNounDisplay}. Clicca per visualizzare i dettagli.
                    </p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                    <button onClick={() => onSelect(name)} className="text-sm font-semibold text-blue-600 flex items-center gap-2 hover:underline">
                        <span>Visualizza</span>
                        <ArrowRight className="h-4 w-4" />
                    </button>
                    {(onRenameCategory || onDeleteCategory) && (
                        confirmingDelete === name ? (
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-red-700 font-semibold">Sicuro?</span>
                                <button onClick={() => setConfirmingDelete(null)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label={`Annulla eliminazione ${name}`}>
                                    <X className="h-4 w-4 text-gray-700"/>
                                </button>
                                <button onClick={() => handleDelete(name)} className="p-2 rounded-full bg-red-100 hover:bg-red-200 transition-colors" aria-label={`Conferma eliminazione ${name}`}>
                                    <Check className="h-4 w-4 text-red-600"/>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                {onRenameCategory && 
                                    <button onClick={() => handleEditClick(name)} className="p-2 rounded-full hover:bg-gray-200 transition-colors" aria-label={`Modifica ${name}`}>
                                        <Pencil className="h-4 w-4 text-gray-700"/>
                                    </button>
                                }
                                {onDeleteCategory &&
                                    <button onClick={() => setConfirmingDelete(name)} className="p-2 rounded-full hover:bg-red-100 transition-colors" aria-label={`Elimina ${name}`}>
                                        <Trash2 className="h-4 w-4 text-red-600"/>
                                    </button>
                                }
                            </div>
                        )
                    )}
                </div>
            </div>
         )}
         {pickingIconFor === name && onUpdateCategoryMetadata && (
            <IconPicker
                onClose={() => setPickingIconFor(null)}
                onSelect={(iconName) => {
                    onUpdateCategoryMetadata(name, { icon: iconName });
                    setPickingIconFor(null);
                }}
            />
        )}
      </div>
    )
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div className="flex-grow">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Esplora per Sezione</h2>
            <div className="relative mt-2 max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cerca una sezione..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
            </div>
        </div>
        {onAddCategoryClick && (
            <button onClick={onAddCategoryClick} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors self-end">
                <PlusCircle className="h-5 w-5" />
                <span>Aggiungi Sezione</span>
            </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCategories.map(([name, items]) => renderCategoryCard(name, items))}
        {filteredCategories.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white border border-gray-200 rounded-lg">
                <p className="text-gray-600">{searchTerm ? `Nessuna sezione trovata per "${searchTerm}".` : 'Nessuna sezione presente.'}</p>
            </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelector;
