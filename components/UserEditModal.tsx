
import React, { useState } from 'react';
import { User } from '../types';
import { avatarList, getAvatar, getAvatarColor } from '../services/avatarRegistry';
import { useData } from '../contexts/DataContext';
import { X, Save, Key } from 'lucide-react';

interface UserEditModalProps {
    user: User;
    onClose: () => void;
    onSave: (user: User, newPassword?: string) => void;
}

const UserEditModal: React.FC<UserEditModalProps> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState<User>(user);
    const [newPassword, setNewPassword] = useState('');
    const [error, setError] = useState('');
    const { appData } = useData();

    const takenAvatars = React.useMemo(() => {
        const avatarMap = new Map<string, string>();
        Object.values(appData.users).forEach(u => {
            if (u.avatar && u.name.toLowerCase() !== user.name.toLowerCase()) {
                avatarMap.set(u.avatar, u.name);
            }
        });
        return avatarMap;
    }, [appData.users, user.name]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (newPassword && newPassword.length < 6) {
            setError('La nuova password deve essere di almeno 6 caratteri.');
            return;
        }

        const avatarIsTaken = takenAvatars.has(formData.avatar);
        if(avatarIsTaken){
            setError(`L'avatar selezionato è già in uso da ${takenAvatars.get(formData.avatar)}. Scegline un altro.`);
            return;
        }

        onSave(formData, newPassword);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex justify-center items-start z-50 p-4 pt-12" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <form onSubmit={handleSubmit} className="flex flex-col h-full w-full">
                    <div className="p-6 border-b flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-800">Modifica Utente</h2>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Chiudi"><X size={20} /></button>
                    </div>

                    <div className="p-6 space-y-4 overflow-y-auto">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Nome Utente</label>
                            <input id="name" type="text" value={formData.name} disabled className="form-input mt-1 disabled:bg-gray-200"/>
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Avatar</label>
                            <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
                                {avatarList.map(avatarName => {
                                    const AvatarIcon = getAvatar(avatarName);
                                    const isSelected = formData.avatar === avatarName;
                                    const isTaken = takenAvatars.has(avatarName);
                                    
                                    return (
                                        <button key={avatarName} type="button" onClick={() => !isTaken && setFormData(f => ({...f, avatar: avatarName}))} disabled={isTaken}
                                            className={`p-3 rounded-full flex items-center justify-center transition-all duration-200 aspect-square ${isTaken ? 'bg-gray-200 cursor-not-allowed opacity-70' : isSelected ? 'ring-4 ring-blue-500 bg-blue-50' : 'bg-gray-100 ring-2 ring-transparent hover:ring-blue-400'}`}
                                            title={isTaken ? `In uso da ${takenAvatars.get(avatarName)}` : avatarName}>
                                            <AvatarIcon className="w-8 h-8" style={{color: getAvatarColor(avatarName)}} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Nuova Password (opzionale)</label>
                            <input id="newPassword" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input mt-1" placeholder="Lascia vuoto per non cambiare"/>
                            <p className="text-xs text-gray-500 mt-1">Se impostata, l'utente dovrà cambiarla al prossimo accesso.</p>
                        </div>
                         {error && (
                            <div className="text-sm text-red-600 p-3 bg-red-50 rounded-md border border-red-200">{error}</div>
                        )}
                    </div>

                    <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t sticky bottom-0">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
                        <button type="submit" className="btn btn-primary"><Save size={16}/> Salva Modifiche</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditModal;
