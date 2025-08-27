
import React, { useState } from 'react';
import { User } from '../types';
import { useData } from '../contexts/DataContext';
import { XCircle, Eye, EyeOff, Bot } from 'lucide-react';

interface PasswordChangeProps {
  user: User;
  onPasswordChanged: (user: User) => void;
}

const PasswordChange: React.FC<PasswordChangeProps> = ({ user, onPasswordChanged }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { updateUser } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('La password deve essere di almeno 6 caratteri.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Le password non coincidono.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      const updatedUser = {
        ...user,
        password: newPassword,
        forcePasswordChange: false,
      };
      await updateUser(updatedUser);
      onPasswordChanged(updatedUser);
    } catch (err) {
      setError('Si è verificato un errore. Riprova.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="card p-8">
            <div className="text-center mb-8">
                <div style={{ backgroundColor: 'var(--c-accent)' }} className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4 text-white">
                    <Bot size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-heading)' }}>Cambia la tua Password</h1>
                <p className="text-gray-500 mt-1">Benvenuto {user.name}! Per sicurezza, imposta una nuova password.</p>
            </div>
            
            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">Nuova Password</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                           <input id="new-password" type={showPassword ? 'text' : 'password'} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="form-input px-3" placeholder="••••••••"/>
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700" aria-label="Mostra/nascondi password">
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                           </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Conferma Password</label>
                        <div className="mt-1">
                           <input id="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="form-input px-3" placeholder="••••••••"/>
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button type="submit" disabled={isLoading} className="btn btn-primary w-full justify-center" style={{backgroundColor: 'var(--c-primary-light)'}}>
                            {isLoading ? 'Salvataggio...' : 'Imposta Password e Accedi'}
                        </button>
                    </div>
                </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default PasswordChange;
