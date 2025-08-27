
import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStatePlaceholderProps {
  message: string;
  ctaText?: string;
  onCtaClick?: () => void;
  secondaryCtaText?: string;
  onSecondaryCtaClick?: () => void;
}

const EmptyStatePlaceholder: React.FC<EmptyStatePlaceholderProps> = ({ 
  message, 
  ctaText, 
  onCtaClick,
  secondaryCtaText,
  onSecondaryCtaClick 
}) => {
  return (
    <div className="card text-center max-w-2xl mx-auto p-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
        <FileQuestion className="h-6 w-6 text-gray-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">Nessun dato disponibile</h3>
      <p className="mt-2 text-sm text-gray-600">{message}</p>
      <div className="mt-6 flex justify-center items-center gap-4">
        {ctaText && onCtaClick && (
          <button
            type="button"
            onClick={onCtaClick}
            className="btn btn-primary"
            style={{backgroundColor: 'var(--c-primary-light)'}}
          >
            {ctaText}
          </button>
        )}
        {secondaryCtaText && onSecondaryCtaClick && (
          <button
            type="button"
            onClick={onSecondaryCtaClick}
            className="btn btn-secondary"
          >
            {secondaryCtaText}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyStatePlaceholder;
