import React, { useState, useMemo, useEffect } from 'react';
import { UserProfile, OnlineUser } from '../types';
import { avatarList, getAvatar, getAvatarColor } from '../services/avatarRegistry';
import { XCircle } from 'lucide-react';

interface AvatarSetupProps {
  onProfileCreated: (profile: UserProfile) => void;
  onlineUsers: OnlineUser[];
  username: string;
  accessLevel: 'admin' | 'view';
}

const AvatarSetup: React.FC<AvatarSetupProps> = ({ onProfileCreated, onlineUsers, username, accessLevel }) => {
  const [name, setName] = useState(username);
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');

  const takenAvatars = useMemo(() => 
    new Map(onlineUsers.map(user => [user.avatar, user.name])), 
  [onlineUsers]);

  useEffect(() => {
    if (username) {
      setName(username);
    }
  }, [username]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Per favore, inserisci il tuo nome.');
      return;
    }
    if (!selectedAvatar) {
      setError('Per favore, scegli un avatar.');
      return;
    }
    const existingUserWithAvatar = takenAvatars.get(selectedAvatar);
    if (existingUserWithAvatar && existingUserWithAvatar !== name) {
        setError('Questo avatar è già stato scelto. Per favore, scegline un altro.');
        return;
    }
    setError('');
    onProfileCreated({ name: name.trim(), avatar: selectedAvatar });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-full max-w-2xl">
        <div className="card p-8">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--c-text-heading)' }}>Crea il tuo Profilo</h1>
                <p className="text-gray-500 mt-1">Scegli un nome e un avatar per essere riconosciuto dal team.</p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-6">
                    <div>
                        <label htmlFor="display-name" className="block text-sm font-medium text-gray-700">
                           Nome Visualizzato
                        </label>
                        <div className="mt-1">
                          <input
                              id="display-name"
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              disabled={accessLevel === 'view'}
                              className="form-input disabled:bg-gray-200"
                              placeholder="Es. Mario Rossi"
                          />
                        </div>
                    </div>

                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Scegli il tuo Avatar
                        </label>
                        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-4">
                            {avatarList.map((avatarName) => {
                                const AvatarIcon = getAvatar(avatarName);
                                const isSelected = selectedAvatar === avatarName;
                                const isTaken = takenAvatars.has(avatarName) && takenAvatars.get(avatarName) !== name;
                                const takenBy = isTaken ? takenAvatars.get(avatarName) : null;
                                
                                let iconColor = getAvatarColor(avatarName);
                                let buttonClasses = 'p-4 rounded-full flex items-center justify-center transition-all duration-200 aspect-square';

                                if (isTaken) {
                                    buttonClasses += ' bg-gray-200 cursor-not-allowed opacity-70';
                                    iconColor = '#9CA3AF';
                                } else if (isSelected) {
                                    buttonClasses += ' ring-4 ring-[var(--c-primary-light)] transform hover:-translate-y-1 bg-teal-50';
                                } else {
                                    buttonClasses += ' bg-white ring-2 ring-gray-200 hover:bg-gray-50 transform hover:-translate-y-1 hover:ring-[var(--c-primary-light)]';
                                }

                                return (
                                    <div key={avatarName} className="relative">
                                        <button
                                            type="button"
                                            title={isTaken ? `Scelto da ${takenBy}` : avatarName}
                                            onClick={() => !isTaken && setSelectedAvatar(avatarName)}
                                            disabled={isTaken}
                                            className={buttonClasses}
                                        >
                                            <AvatarIcon className="h-10 w-10" style={{ color: iconColor }} />
                                        </button>
                                        {isTaken && takenBy && (
                                            <div className="absolute -bottom-1 -right-1 bg-gray-700 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white pointer-events-none" title={`Scelto da ${takenBy}`}>
                                                {takenBy.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <button
                          type="submit"
                          className="btn w-full justify-center"
                          style={{ backgroundColor: 'var(--c-primary-light)', color: 'white' }}
                        >
                        Salva e Continua
                        </button>
                    </div>
                </div>
            </form>
          </div>
      </div>
    </div>
  );
};

export default AvatarSetup;
