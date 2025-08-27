import React, { useEffect } from 'react';
import { Ticket } from '../types';
import TicketDetailDisplay from './TicketDetailDisplay';
import { ChevronRight } from 'lucide-react';
import { getIcon } from '../services/iconRegistry';

interface CategoryMetadata {
  icon: string;
  color: string;
  createdAt?: string;
}

interface CategoryDetailViewProps {
  categoryName: string;
  tickets: Ticket[];
  onBack: () => void;
  categoryMetadata?: CategoryMetadata;
  onAddItem?: (categoryName: string, item: Ticket) => void;
  onUpdateItem?: (categoryName: string, itemId: string, updatedItem: Partial<Ticket>) => void;
  onDeleteItem?: (categoryName: string, itemId: string) => void;
  scrollToItemId?: string | null;
}

const CategoryDetailView: React.FC<CategoryDetailViewProps> = ({ categoryName, tickets, onBack, categoryMetadata, onAddItem, onUpdateItem, onDeleteItem, scrollToItemId }) => {
  
  const IconComponent = getIcon(categoryMetadata?.icon);

  return (
    <div>
      <div className="mb-6 flex items-center gap-2 text-sm text-gray-600 border-l-4 pl-3" style={{ borderColor: categoryMetadata?.color || 'transparent' }}>
        <button onClick={onBack} className="hover:text-blue-600 hover:underline focus:outline-none focus:text-blue-700 focus:underline">
          Tutte le Sezioni
        </button>
        <ChevronRight className="h-4 w-4 text-gray-400" />
        <span className="font-semibold text-gray-800 flex items-center gap-2">
            <IconComponent className="h-5 w-5" style={{ color: categoryMetadata?.color }} />
            {categoryName}
        </span>
      </div>
      
      <TicketDetailDisplay 
        tickets={tickets} 
        categoryName={categoryName}
        onAddItem={onAddItem}
        onUpdateItem={onUpdateItem}
        onDeleteItem={onDeleteItem}
        scrollToItemId={scrollToItemId}
      />
    </div>
  );
};

export default CategoryDetailView;