

import React, { useState, useMemo } from 'react';
import { useData } from './contexts/DataContext';
import { User } from './types';
import { getAvatar, getAvatarColor } from './services/avatarRegistry';
import { Users, Search, Edit, Trash2, AlertTriangle, UserPlus } from 'lucide-react';
import UserEditModal from './components/UserEditModal';
import UserAddModal from './components/UserAddModal';

const UserManagementApp: React.FC = () => {
    const { appData, updateUser, deleteUser, addUser } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    const users = useMemo(() => {
        return Object.values(appData.users).sort((a, b) => {
            if (a.accessLevel !== b.accessLevel) {
                return a.accessLevel === 'admin' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        });
    }, [appData.users]);

    const filteredUsers = useMemo(() => {
        if (!searchTerm) return users;
        const lowerTerm = searchTerm.toLowerCase();
        return users.filter(u => u.name.toLowerCase().includes(lowerTerm));
    }, [users, searchTerm]);

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setEditModalOpen(true);
    };
    
    const handleSaveUser = async (user: User, newPassword?: string) => {
        const userToSave = { ...user };
        if (newPassword) {
            userToSave.password = newPassword;
            userToSave.forcePasswordChange = true;
        }
        await updateUser(userToSave);
        setEditModalOpen(false);
    };
    
    const handleAddUser = async (userData: { name: string; password_NOT_HASHED: string; accessLevel: 'admin' | 'view' }) => {
        if (addUser) {
            await addUser(userData);
        }
        setAddModalOpen(false);
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        await deleteUser(userToDelete.name);
        setUserToDelete(null);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-blue-600"/>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestione Utenze</h1>
                        <p className="text-gray-500">Visualizza e modifica gli utenti del sistema.</p>
                    </div>
                </div>
                <button onClick={() => setAddModalOpen(true)} className="btn btn-primary">
                    <UserPlus className="h-5 w-5" />
                    <span>Aggiungi Utente</span>
                </button>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                    type="search"
                    placeholder="Cerca utente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                />
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-left">Utente</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-left">Livello</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-center">Password da cambiare</th>
                            <th className="px-4 py-3 font-semibold text-gray-600 uppercase text-right">Azioni</th>
                        </tr>
                    </thead>
                     <tbody className="divide-y divide-gray-200">
                        {filteredUsers.map(user => {
                            const Avatar = getAvatar(user.avatar);
                            const color = getAvatarColor(user.avatar);
                            return (
                                <tr key={user.name}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100">
                                                <Avatar className="w-6 h-6" style={{color}}/>
                                            </div>
                                            <span className="font-semibold text-gray-800">{user.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.accessLevel === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                            {user.accessLevel === 'admin' ? 'Demand' : 'Moderatori'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {user.forcePasswordChange && <span className="text-yellow-600 font-bold">Sì</span>}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleEdit(user)} className="p-2 text-gray-500 hover:text-blue-600 rounded-full hover:bg-gray-100" title="Modifica"><Edit size={16}/></button>
                                        <button onClick={() => setUserToDelete(user)} className="p-2 text-red-600 hover:bg-red-100 rounded-full" title="Elimina"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            )
                        })}
                     </tbody>
                </table>
            </div>
            
            {isEditModalOpen && editingUser && (
                <UserEditModal 
                    user={editingUser}
                    onClose={() => setEditModalOpen(false)}
                    onSave={handleSaveUser}
                />
            )}

            {isAddModalOpen && addUser && (
                <UserAddModal 
                    onClose={() => setAddModalOpen(false)}
                    onSave={handleAddUser}
                />
            )}
            
            {userToDelete && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setUserToDelete(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Conferma Eliminazione</h2>
                        <p className="text-gray-600 mb-6">
                            Sei sicuro di voler eliminare l'utente <strong>{userToDelete.name}</strong>? L'azione è irreversibile.
                        </p>
                        <div className="flex justify-center gap-4">
                           <button onClick={() => setUserToDelete(null)} className="btn btn-secondary">Annulla</button>
                           <button onClick={handleDeleteUser} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 h-5"/> Elimina</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagementApp;