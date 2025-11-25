


import React, { useState, useMemo, useEffect } from 'react';
import { User } from '../types';
import { avatarList, getAvatar, getAvatarColor } from '../services/avatarRegistry';
import { XCircle, Loader2, Sparkles } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface AvatarSetupProps {
  onProfileCreated: (user: User) => void;
  user: User;
}

const AvatarSetup: React.FC<AvatarSetupProps> = ({ onProfileCreated, user }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { appData, updateUser } = useData();
  
  // Filter taken avatars to strictly exclude those taken *TODAY*.
  // Avatars from previous days are considered free.
  const takenAvatars = useMemo(() => {
    const avatarMap = new Map<string, string>();
    const today = new Date().toLocaleDateString('en-CA');
    
    Object.values(appData.users).forEach(u => {
      if (u.avatar && u.name.toLowerCase() !== user.name.toLowerCase()) {
        // Check if the avatar was claimed today
        if (u.avatarDate === today) {
            avatarMap.set(u.avatar, u.name);
        }
      }
    });
    return avatarMap;
  }, [appData.users, user.name]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAvatar) {
      setError('Per favore, scegli un avatar.');
      return;
    }
    setError('');
    setIsLoading(true);

    try {
        // Save avatar with today's date
        const updatedUser = { 
            ...user, 
            avatar: selectedAvatar,
            avatarDate: new Date().toLocaleDateString('en-CA')
        };
        await updateUser(updatedUser);
        onProfileCreated(updatedUser);
    } catch (err) {
        console.error(err);
        setError("Salvataggio del profilo fallito. Riprova.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 antialiased" style={{ backgroundColor: 'var(--c-bg)' }}>
      <div className="w-full max-w-3xl">
        <div className="card p-8 relative overflow-hidden">
            {/* Decorazione sfondo */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--c-primary-light)] to-[var(--c-accent)]"></div>
            
            <div className="text-center mb-8">
                <div className="mx-auto h-16 w-16 rounded-full bg-gradient-to-br from-[var(--c-accent)] to-orange-600 flex items-center justify-center mb-4 text-white shadow-lg animate-bounce">
                    <Sparkles size={32} />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Ogni giorno è una nuova avventura!</h1>
                <p className="text-lg text-gray-600 mt-2 max-w-lg mx-auto">
                    Come da tradizione, gli avatar vengono resettati ogni mattina.<br/>
                    <span className="font-medium text-[var(--c-primary)]">Scegli il tuo personaggio per la giornata di oggi!</span>
                </p>
            </div>
            
            <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-8">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center">
                        <p className="text-sm text-gray-500 mb-1">Stai accedendo come</p>
                        <p className="text-xl font-bold text-gray-800">{user.name}</p>
                    </div>

                    <div>
                         <div className="flex justify-between items-end mb-4">
                            <label className="block text-sm font-bold text-gray-700">
                                Avatar Disponibili Oggi
                            </label>
                            <span className="text-xs text-gray-500 italic">
                                {takenAvatars.size} avatar già presi dai colleghi
                            </span>
                         </div>
                        
                        <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-9 gap-3">
                            {avatarList.map((avatarName) => {
                                const AvatarIcon = getAvatar(avatarName);
                                const isSelected = selectedAvatar === avatarName;
                                const isTaken = takenAvatars.has(avatarName);
                                const takenBy = isTaken ? takenAvatars.get(avatarName) : null;
                                
                                let iconColor = getAvatarColor(avatarName);
                                let buttonClasses = 'p-3 rounded-xl flex items-center justify-center transition-all duration-200 aspect-square relative';

                                if (isTaken) {
                                    buttonClasses += ' bg-gray-100 cursor-not-allowed opacity-40 grayscale';
                                    iconColor = '#6B7280';
                                } else if (isSelected) {
                                    buttonClasses += ' ring-4 ring-[var(--c-primary-light)] shadow-lg transform scale-110 bg-teal-50 z-10';
                                } else {
                                    buttonClasses += ' bg-white border border-gray-200 hover:border-[var(--c-primary-light)] hover:shadow-md transform hover:-translate-y-1';
                                }

                                return (
                                    <div key={avatarName} className="relative group">
                                        <button
                                            type="button"
                                            title={isTaken ? `Già scelto da ${takenBy} per oggi` : avatarName}
                                            onClick={() => !isTaken && setSelectedAvatar(avatarName)}
                                            disabled={isTaken}
                                            className={buttonClasses}
                                        >
                                            <AvatarIcon className="h-8 w-8" style={{ color: iconColor }} />
                                        </button>
                                        {isTaken && takenBy && (
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap z-20 shadow-sm max-w-full truncate">
                                                {takenBy.split(' ')[0]}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center justify-center gap-2 text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-pulse">
                            <XCircle className="h-5 w-5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="btn w-full justify-center text-lg py-3 shadow-lg hover:shadow-xl transform active:scale-95 transition-all"
                          style={{ backgroundColor: 'var(--c-primary-light)', color: 'white' }}
                        >
                        { isLoading ? <Loader2 className="animate-spin" /> : 'Conferma e Entra' }
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