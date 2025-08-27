import React, { useState, useEffect, useRef } from 'react';
import { Campaign } from '../types';
import { Moon, Check } from 'lucide-react';
import ImageUploader from './ImageUploader';

interface CampaignModalProps {
  campaign: Campaign | null;
  onClose: () => void;
  onSave: (campaign: Campaign) => void;
}

const CampaignModal: React.FC<CampaignModalProps> = ({ campaign, onClose, onSave }) => {
  const [formData, setFormData] = useState<Campaign>(
    campaign || {
      id: '',
      title: '',
      image: null,
      start: '',
      end: '',
      type: '',
      channel: '',
      dark: false,
      link: null,
    }
  );
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [onClose]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = isCheckbox ? (e.target as HTMLInputElement).checked : undefined;

    setFormData(prev => ({ ...prev, [id]: isCheckbox ? checked : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.start && formData.end && formData.end < formData.start) {
      alert('La data di fine non può essere precedente alla data di inizio!');
      return;
    }
    onSave({ ...formData, id: formData.id || `camp-${Date.now()}` });
    onClose();
  };
  
  const inputClasses = "w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-start z-50 p-4 pt-12">
      <div ref={modalRef} className="bg-white rounded-xl shadow-lg w-11/12 md:w-1/2 lg:w-1/3 p-6 relative max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">{campaign ? 'Modifica Campagna' : 'Aggiungi Campagna'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo <span className="text-red-500">*</span></label>
            <input type="text" id="title" value={formData.title || ''} onChange={handleChange} className={inputClasses} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Immagine Campagna</label>
            <ImageUploader 
              currentImageUrl={formData.image}
              onImageUploaded={(dataUrl) => setFormData(prev => ({...prev, image: dataUrl}))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Periodo <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-2 gap-4">
              <input type="date" id="start" value={formData.start || ''} onChange={handleChange} className={inputClasses} required />
              <input type="date" id="end" value={formData.end || ''} onChange={handleChange} className={inputClasses} required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Campo jolly <span className="text-red-500">*</span></label>
            <input type="text" id="type" value={formData.type || ''} onChange={handleChange} className={inputClasses} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Canale Social <span className="text-red-500">*</span></label>
            <select id="channel" value={formData.channel || ''} onChange={handleChange} className={inputClasses} required>
              <option value="">Seleziona</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="TikTok">TikTok</option>
              <option value="Linkedin">Linkedin</option>
              <option value="X">X</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
             <label htmlFor="dark" className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                <div className="relative flex items-center">
                    <input
                        type="checkbox"
                        id="dark"
                        name="dark"
                        checked={formData.dark}
                        onChange={handleChange}
                        className="appearance-none h-5 w-5 border border-gray-400 rounded-sm bg-white checked:bg-blue-600 checked:border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                    />
                    {formData.dark && (
                        <Check className="h-4 w-4 text-white absolute left-0.5 top-0.5 pointer-events-none" />
                    )}
                </div>
                <Moon className="h-5 w-5 fill-black" />
                <span>Sponsorizzata in dark</span>
             </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Link</label>
            <input type="url" id="link" value={formData.link || ''} onChange={handleChange} className={inputClasses} placeholder="https://..." />
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium text-sm transition">Annulla</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm transition">Salva</button>
          </div>
        </form>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};

export default CampaignModal;