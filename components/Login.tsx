

import React, { useState } from 'react';
import { XCircle, Eye, EyeOff, Bot } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { User } from '../types';
import { ADMIN_USERS, MODERATOR_USERS } from '../services/userData';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [accessLevel, setAccessLevel] = useState<'view' | 'admin'>('view');
  const [selectedUser, setSelectedUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { appData } = useData();
  
  const userList = accessLevel === 'admin' ? ADMIN_USERS : MODERATOR_USERS;
  
  const handleAccessLevelChange = (newLevel: 'view' | 'admin') => {
    setAccessLevel(newLevel);
    setSelectedUser(''); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser || !password) {
        setError('Tutti i campi sono obbligatori.');
        return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
        const users = appData.users;
        const userKey = selectedUser.trim().toLowerCase();
        const foundUser = users[userKey];

        if (foundUser && foundUser.password === password) {
            onLoginSuccess(foundUser);
        } else {
            setError('Credenziali non valide. Controlla i dati inseriti.');
            setIsLoading(false);
        }
    }, 500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="card p-8">
            <div className="text-center mb-8">
                 <div style={{ backgroundColor: 'var(--c-accent)' }} className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4 text-white">
                    <Bot size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-heading)' }}>Social Hub</h1>
                <p className="text-gray-500 mt-1">Accedi alla piattaforma</p>
            </div>
            
            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Livello di Accesso</label>
                        <div className="relative w-full bg-gray-200 rounded-full p-1 flex">
                            <div
                                className="absolute top-1 bottom-1 left-1 w-1/2 bg-white rounded-full shadow transition-transform duration-300 ease-in-out"
                                style={{ transform: accessLevel === 'view' ? 'translateX(0%)' : 'translateX(100%)' }}
                            ></div>
                            <button
                                type="button"
                                onClick={() => handleAccessLevelChange('view')}
                                className={`relative z-10 w-1/2 py-2 text-sm font-semibold text-center rounded-full transition-colors ${accessLevel === 'view' ? 'text-[var(--c-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Moderatori
                            </button>
                            <button
                                type="button"
                                onClick={() => handleAccessLevelChange('admin')}
                                className={`relative z-10 w-1/2 py-2 text-sm font-semibold text-center rounded-full transition-colors ${accessLevel === 'admin' ? 'text-[var(--c-primary)]' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                Demand
                            </button>
                        </div>
                    </div>
                    
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nome Utente</label>
                        <select id="username" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="form-input mt-1" required>
                             <option value="" disabled>Seleziona un utente</option>
                             {userList.map(user => <option key={user} value={user}>{user}</option>)}
                        </select>
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                           <input
                              id="password"
                              name="password"
                              type={showPassword ? 'text' : 'password'}
                              autoComplete="current-password"
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className="form-input"
                              placeholder="••••••••"
                           />
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={showPassword ? "Nascondi password" : "Mostra password"}>
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                           </button>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                        type="submit"
                        disabled={isLoading || !selectedUser}
                        className="btn btn-primary w-full justify-center"
                        >
                        {isLoading ? 'Accesso in corso...' : 'Accedi'}
                        </button>
                    </div>
                </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default Login;