import React, { useState, useEffect } from 'react';
import { NavigationTarget, NotificationItem, UserProfile } from './types';
import CategorySelector from './components/CategorySelector';
import EmptyStatePlaceholder from './components/EmptyStatePlaceholder';
import { useData } from './contexts/DataContext';

interface ResourceAppProps {
  serviceId: string;
  isReadOnly: boolean;
  onUploadClick?: () => void;
  currentUser: UserProfile;
  navigationTarget?: (NavigationTarget & { onNavigate?: unknown }) | null;
  onNavigationComplete: () => void;
  handleNavigate: (target: { serviceId: string; onNavigate: (category: string, itemId?: string) => void; categoryName: string; itemId: string; } | NavigationTarget | NotificationItem) => void;
  detailViews: { default: React.FC<any>, [key: string]: React.FC<any> };
  itemNoun: string;
  itemNounPlural: string;
}

const ResourceApp: React.FC<ResourceAppProps> = ({
  serviceId,
  isReadOnly,
  onUploadClick,
  currentUser,
  navigationTarget,
  onNavigationComplete,
  handleNavigate,
  detailViews,
  itemNoun,
  itemNounPlural,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [scrollToItemId, setScrollToItemId] = useState<string | null>(null);
  
  const {
    servicesData,
    onAddCategory,
    onDeleteCategory,
    onDeleteMultipleCategories,
    onRenameCategory,
    onUpdateCategoryMetadata,
    onAddItem,
    onUpdateItem,
    onDeleteItem,
  } = useData();
  
  const serviceData = servicesData[serviceId];
  const { data, metadata } = serviceData || { data: null, metadata: {} };

  useEffect(() => {
    if (navigationTarget && navigationTarget.serviceId === serviceId) {
      if (navigationTarget.categoryName && data?.[navigationTarget.categoryName]) {
        setSelectedCategory(navigationTarget.categoryName);
        if (navigationTarget.itemId) {
          setScrollToItemId(navigationTarget.itemId);
          setTimeout(() => setScrollToItemId(null), 1000);
        }
      }
      onNavigationComplete();
    }
  }, [navigationTarget, serviceId, data, onNavigationComplete]);

  const handleSelectCategory = (category: string, itemId?: string) => {
    setSelectedCategory(category);
    if (itemId) {
      setScrollToItemId(itemId);
      setTimeout(() => setScrollToItemId(null), 1000);
    }
    window.scrollTo(0, 0);
  };
  
  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setScrollToItemId(null);
  };

  const handleAddCategory = (name: string) => {
    if (isReadOnly || !name.trim()) return;
    onAddCategory(serviceId, name.trim(), currentUser.name);
    setIsAddingCategory(false);
  };

  useEffect(() => {
    if (data === null || (selectedCategory && !data[selectedCategory])) {
      setSelectedCategory(null);
    }
  }, [data, selectedCategory]);

  const hasData = data && Object.keys(data).length > 0;

  if (!hasData && !isAddingCategory) {
    return (
        <EmptyStatePlaceholder 
            message={isReadOnly ? "Nessun dato è stato ancora caricato dall'amministratore." : "Nessun dato disponibile. Carica il file XLSX corrispondente o aggiungi manualmente una nuova sezione."}
            ctaText={isReadOnly ? undefined : "Vai alla pagina di caricamento"}
            onCtaClick={onUploadClick}
            secondaryCtaText={isReadOnly ? undefined : "Aggiungi Sezione Manualmente"}
            onSecondaryCtaClick={!isReadOnly ? () => setIsAddingCategory(true) : undefined}
        />
    );
  }
  
  if (isAddingCategory) {
      return (
        <CategorySelector 
            categories={{}} 
            onSelect={() => {}} 
            metadata={{}}
            onAddCategory={handleAddCategory} 
            startInAddMode={true} 
            onAddFinished={() => setIsAddingCategory(false)}
            serviceId={serviceId}
            handleNavigate={handleNavigate}
            itemNoun={itemNoun}
            itemNounPlural={itemNounPlural}
        />
      );
  }

  const renderDetailView = () => {
      if (!selectedCategory || !data?.[selectedCategory]) return null;

      const DetailComponent = detailViews[selectedCategory] || detailViews.default;
      
      const componentProps = {
          categoryName: selectedCategory,
          // Pass the correct data key based on the component type
          tickets: data[selectedCategory],
          procedures: data[selectedCategory],
          guidelines: data[selectedCategory],
          documents: data[selectedCategory],
          // Common props
          onBack: handleBackToCategories,
          categoryMetadata: metadata?.[selectedCategory],
          onAddItem: !isReadOnly ? (catName: string, item: any) => onAddItem(serviceId, catName, item, currentUser.name) : undefined,
          onUpdateItem: !isReadOnly ? (catName: string, itemId: string, updatedItem: any) => onUpdateItem(serviceId, catName, itemId, updatedItem, currentUser.name) : undefined,
          onDeleteItem: !isReadOnly ? (catName: string, itemId: string) => onDeleteItem(serviceId, catName, itemId, currentUser.name) : undefined,
          scrollToItemId: scrollToItemId,
      };

      return <DetailComponent {...componentProps} />;
  };

  return (
    <div>
        {!selectedCategory ? (
            <CategorySelector 
                categories={data || {}} 
                metadata={metadata}
                onSelect={handleSelectCategory}
                onAddCategory={!isReadOnly ? handleAddCategory : undefined}
                onAddCategoryClick={!isReadOnly ? () => setIsAddingCategory(true) : undefined}
                onDeleteCategory={!isReadOnly ? (name) => onDeleteCategory(serviceId, name, currentUser.name) : undefined}
                onDeleteMultipleCategories={!isReadOnly ? (names) => onDeleteMultipleCategories(serviceId, names, currentUser.name) : undefined}
                onRenameCategory={!isReadOnly ? (oldName, newName) => onRenameCategory(serviceId, oldName, newName, currentUser.name) : undefined}
                onUpdateCategoryMetadata={!isReadOnly ? (catName, meta) => onUpdateCategoryMetadata(serviceId, catName, meta) : undefined}
                itemNoun={itemNoun}
                itemNounPlural={itemNounPlural}
                serviceId={serviceId}
                handleNavigate={handleNavigate}
            />
        ) : (
            renderDetailView()
        )}
    </div>
  );
};

export default ResourceApp;