import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Pencil, Trash2, Check, X } from 'lucide-react';

interface ExpandableListItemProps {
  id: string;
  title: string;
  content: string | null;
  date: string | null;
  onUpdate?: (id: string, updatedData: { title: string; content: string | null }) => void;
  onDelete?: (id: string) => void;
  startInEditMode?: boolean;
  useFaqStyle?: boolean;
  color?: string;
  contentLabel?: string;
}

const ExpandableListItem: React.FC<ExpandableListItemProps> = ({ id, title, content, date, onUpdate, onDelete, startInEditMode = false, useFaqStyle = false, color = '#6B7280', contentLabel = 'Dettagli' }) => {
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editedTitle, setEditedTitle] = useState(title);
  const [editedContent, setEditedContent] = useState(content || '');
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null); // Changed from HTMLInputElement

  // Effect for initial focus when starting in edit mode
  useEffect(() => {
    if (isEditing && startInEditMode) {
      titleInputRef.current?.focus();
    }
  }, [isEditing, startInEditMode]);

  const handleSave = () => {
    if (onUpdate) {
        onUpdate(id, { title: editedTitle, content: editedContent });
        setIsEditing(false);
        setConfirmingDelete(false);
    }
  };

  const handleCancelEdit = () => {
    // If it was a new item being added, deleting it on cancel is a good UX
    if (startInEditMode && onDelete) {
        onDelete(id);
    } else {
        setEditedTitle(title);
        setEditedContent(content || '');
        setIsEditing(false);
        setConfirmingDelete(false);
    }
  }

  const handleDelete = () => {
    if (onDelete) {
        onDelete(id);
    }
  };
  
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setEditedContent(e.target.value);
  };

  if (isEditing && onUpdate) {
    return (
      <div id={`item-${id}`} className="p-4 bg-blue-50/50 border-l-4 border-blue-500">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor={`title-${id}`}>Titolo</label>
            <textarea
              ref={titleInputRef}
              id={`title-${id}`}
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm whitespace-pre-wrap bg-white text-gray-900"
              rows={1}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700" htmlFor={`content-${id}`}>Contenuto / Risoluzione</label>
            <textarea
              ref={contentTextareaRef}
              id={`content-${id}`}
              value={editedContent}
              onChange={handleContentChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm whitespace-pre-wrap bg-white text-gray-900"
              rows={4}
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end items-center gap-3">
          <button onClick={handleCancelEdit} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
            <X className="h-5 w-5 text-gray-600" />
          </button>
          <button onClick={handleSave} className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
            <Check className="h-5 w-5 text-blue-700" />
          </button>
        </div>
      </div>
    );
  }

  const detailsClasses = useFaqStyle ? 'group rounded-md' : 'group';
  const detailsStyles = useFaqStyle ? { borderLeft: `4px solid ${color}` } : {};

  const summaryClasses = `flex items-center justify-between p-4 list-none cursor-pointer ${!useFaqStyle ? 'hover:bg-gray-50 transition-colors' : ''}`;
  const summaryStyles = useFaqStyle ? { backgroundColor: `${color}1A` } : {};

  const titleClasses = useFaqStyle ? 'font-semibold text-base' : 'text-md font-semibold text-gray-800 group-hover:text-blue-700';
  const titleStyles = useFaqStyle ? { color } : {};

  const contentWrapperClasses = useFaqStyle ? 'p-4 bg-white' : 'px-4 pb-4 bg-white';
  const contentWrapperStyles = useFaqStyle ? { borderTop: `1px solid ${color}33` } : { borderTop: '1px solid #E5E7EB' };

  return (
    <details id={`item-${id}`} className={detailsClasses} style={detailsStyles}>
        <summary className={summaryClasses} style={summaryStyles}>
            <h3 className={titleClasses} style={titleStyles}>{title || ''}</h3>
            <div className="flex items-center gap-2">
              {onUpdate && onDelete && (
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity focus-within:opacity-100">
                  {!confirmingDelete ? (
                    <>
                        <button onClick={(e) => { e.preventDefault(); setIsEditing(true); }} className="p-1.5 rounded-md hover:bg-gray-200">
                            <Pencil className="h-4 w-4 text-gray-600" />
                        </button>
                        <button onClick={(e) => { e.preventDefault(); setConfirmingDelete(true); }} className="p-1.5 rounded-md hover:bg-red-100">
                            <Trash2 className="h-4 w-4 text-red-600" />
                        </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-md shadow-sm ring-1 ring-red-200">
                        <span className="text-xs text-red-700 font-medium">Sicuro?</span>
                        <button onClick={(e) => { e.preventDefault(); setConfirmingDelete(false); }} className="p-1 rounded-full hover:bg-gray-200">
                            <X className="h-4 w-4 text-gray-500" />
                        </button>
                        <button onClick={(e) => { e.preventDefault(); handleDelete(); }} className="p-1 rounded-full bg-red-100 hover:bg-red-200">
                            <Check className="h-4 w-4 text-red-600" />
                        </button>
                    </div>
                  )}
                </div>
              )}
              <ChevronDown className="h-5 w-5 text-gray-400 transition-transform duration-200 group-open:rotate-180" />
            </div>
        </summary>
        <div className={contentWrapperClasses} style={contentWrapperStyles}>
            {content && (
                <div className="mb-3">
                    <h4 className="text-sm font-semibold text-blue-700 mb-1.5">{contentLabel}</h4>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap bg-blue-50/60 p-3 rounded-md border border-blue-200/80">{content}</p>
                </div>
            )}
            {date && (
                <div className="mt-4 pt-3 border-t border-gray-200/80 flex items-center gap-1.5 text-xs text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>Data:</span>
                    <span className="font-medium text-gray-700">{date}</span>
                </div>
            )}
             {!content && !date && (
                <div className="text-sm text-gray-500 italic">Nessun dettaglio aggiuntivo.</div>
            )}
        </div>
    </details>
  );
};

export default ExpandableListItem;