

import React, { useState } from 'react';
import { XCircle, User, Eye, EyeOff, Users, Bot } from 'lucide-react';
import { OPERATORS } from './team-breaks/helpers';

interface LoginProps {
  onLogin: (level: 'admin' | 'view', username: string) => void;
}

const ADMIN_KEY = 'admin123';
const VIEW_KEY = 'view123';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [loginType, setLoginType] = useState<'view' | 'admin'>('view');
  const [username, setUsername] = useState('');
  const [selectedOperator, setSelectedOperator] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalUsername = loginType === 'admin' ? username : selectedOperator;

    if (!finalUsername || !accessKey) {
        setError('Tutti i campi sono obbligatori.');
        return;
    }
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      let valid = false;
      if (loginType === 'admin' && accessKey === ADMIN_KEY) {
        onLogin('admin', finalUsername);
        valid = true;
      } else if (loginType === 'view' && accessKey === VIEW_KEY) {
        onLogin('view', finalUsername);
        valid = true;
      }
      
      if (!valid) {
        setError('Credenziali non valide. Controlla la chiave di accesso.');
        setIsLoading(false);
        setAccessKey('');
      }
    }, 500);
  };

  const inputBaseClasses = "block w-full rounded-md border-gray-300 bg-gray-50 text-gray-900 py-2.5 placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 sm:text-sm";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8">
            <div className="text-center mb-8">
                 <div style={{ backgroundColor: 'var(--c-accent)' }} className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-4 text-white">
                    <Bot size={32} strokeWidth={2.5} />
                </div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-heading)' }}>Social Hub</h1>
                <p className="text-gray-500 mt-1">Accedi alla piattaforma</p>
            </div>
            
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-200 rounded-lg mb-6">
                <button onClick={() => setLoginType('view')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${loginType === 'view' ? 'bg-white text-[var(--c-primary-light)] shadow' : 'bg-transparent text-gray-600'}`}>
                    Primo Livello
                </button>
                <button onClick={() => setLoginType('admin')} className={`px-4 py-2 rounded-md text-sm font-semibold transition-colors ${loginType === 'admin' ? 'bg-white text-[var(--c-primary-light)] shadow' : 'bg-transparent text-gray-600'}`}>
                    Secondo Livello
                </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                    {loginType === 'view' ? (
                       <div>
                            <label htmlFor="operator-select" className="block text-sm font-medium text-gray-700">
                                User
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                    <Users className="h-5 w-5 text-gray-400" />
                                </div>
                                <select
                                    id="operator-select"
                                    name="operator-select"
                                    value={selectedOperator}
                                    onChange={(e) => setSelectedOperator(e.target.value)}
                                    className="form-input pl-10 appearance-none"
                                >
                                    <option value="" disabled>-- Seleziona un moderatore --</option>
                                    {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                Admin
                            </label>
                            <div className="mt-1 relative rounded-md shadow-sm">
                              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <User className="h-5 w-5 text-gray-400" />
                              </div>
                              <input
                                  id="username"
                                  name="username"
                                  type="text"
                                  autoComplete="username"
                                  required
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="form-input pl-10"
                                  placeholder="Nome admin"
                              />
                            </div>
                        </div>
                    )}

                    <div>
                        <label htmlFor="access-key" className="block text-sm font-medium text-gray-700">
                        Chiave di Accesso
                        </label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                           <input
                              id="access-key"
                              name="access-key"
                              type={showKey ? 'text' : 'password'}
                              autoComplete="current-password"
                              required
                              value={accessKey}
                              onChange={(e) => setAccessKey(e.target.value)}
                              className="form-input px-3"
                              placeholder="••••••••"
                           />
                           <button type="button" onClick={() => setShowKey(!showKey)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none" aria-label={showKey ? "Nascondi chiave" : "Mostra chiave"}>
                              {showKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                        disabled={isLoading}
                        className="btn btn-primary w-full justify-center"
                        style={{backgroundColor: 'var(--c-primary-light)'}}
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