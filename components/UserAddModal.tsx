import React, { useState } from 'react';
import { User } from '../types';
import { X, Save, UserPlus } from 'lucide-react';

interface UserAddModalProps {
    onClose: () => void;
    onSave: (userData: { name: string; password_NOT_HASHED: string; accessLevel: 'admin' | 'view' }) => Promise<void>;
}

const UserAddModal: React.FC<UserAddModalProps> = ({ onClose, onSave }) => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [accessLevel, setAccessLevel] = useState<'admin' | 'view'>('view');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim() || !password) {
            setError("Nome utente e password sono obbligatori.");
            return;
        }
        if (password.length < 6) {
            setError("La password deve essere di almeno 6 caratteri.");
            return;
        }
        setIsLoading(true);
        try {
            await onSave({ name: name.trim(), password_NOT_HASHED: password, accessLevel });
            onClose();
        } catch (err: any) {
            setError(err.message || "Errore durante la creazione dell'utente.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 p-4 pt-12" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><UserPlus /> Aggiungi Nuovo Utente</h2>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Chiudi"><X size={20} /></button>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Utente</label>
                            <input id="name" type="text" value={name} onChange={e => setName(e.target.value)} className="form-input mt-1" required disabled={isLoading} />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input mt-1" required disabled={isLoading} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Livello di Accesso</label>
                            <div className="mt-2 space-y-2">
                                <label className="flex items-center">
                                    <input type="radio" name="accessLevel" value="view" checked={accessLevel === 'view'} onChange={() => setAccessLevel('view')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" disabled={isLoading} />
                                    <span className="ml-3 text-sm text-gray-700">Moderatori</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" name="accessLevel" value="admin" checked={accessLevel === 'admin'} onChange={() => setAccessLevel('admin')} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" disabled={isLoading} />
                                    <span className="ml-3 text-sm text-gray-700">Demand</span>
                                </label>
                            </div>
                        </div>
                        {error && (
                            <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t">
                        <button type="button" onClick={onClose} className="btn btn-secondary" disabled={isLoading}>Annulla</button>
                        <button type="submit" className="btn btn-primary" disabled={isLoading}>
                            {isLoading ? 'Salvataggio...' : <><Save size={16}/> Aggiungi Utente</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserAddModal;
