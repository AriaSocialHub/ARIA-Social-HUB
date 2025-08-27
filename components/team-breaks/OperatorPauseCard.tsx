
import React, { useState, useMemo, useEffect } from 'react';
import { PauseData } from '../../types';
import { getAvatar, getAvatarColor } from '../../services/avatarRegistry';
import { Trash2, X, Check } from 'lucide-react';
import { calculateEndTime, PAUSE_DURATIONS } from './helpers';

// Sotto-componente per una singola riga di pausa all'interno della card
const PauseItem: React.FC<{
    pauseKey: string;
    label: string;
    data: PauseData;
    now: Date;
    isAnotherPauseActive: boolean;
    onCheckboxChange: (id: string, type: string, checked: boolean) => void;
    onTimeUpdate: (id: string, type: string, newTime: string | null) => void;
    isLocked: boolean;
    lockedReason: string;
}> = ({ pauseKey, label, data, now, isAnotherPauseActive, onCheckboxChange, onTimeUpdate, isLocked, lockedReason }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTime, setEditedTime] = useState('');

    const plannedTime = data[pauseKey as keyof PauseData] as string | null;
    const actualStartTime = data.actual_start_times?.[pauseKey];
    const duration = PAUSE_DURATIONS[pauseKey];
    const endTime = actualStartTime ? calculateEndTime(actualStartTime, duration, now) : null;

    const isFinished = endTime ? now >= endTime : false;
    const isActive = endTime ? now < endTime && !!actualStartTime : false;
    const canEdit = !isLocked && !actualStartTime && !isFinished;
    const isCheckboxDisabled = isLocked || isFinished || (isAnotherPauseActive && !isActive) || !plannedTime;

    const getCheckboxTitle = () => {
        if (!plannedTime) return 'Pausa non pianificata';
        if (isFinished) return 'Pausa conclusa';
        if (isLocked) return lockedReason;
        if (isAnotherPauseActive && !isActive) return 'Un\'altra pausa è in corso';
        if (actualStartTime) return 'Annulla inizio';
        return 'Inizia pausa';
    };

    const handleStartEditing = () => {
        if (canEdit) {
            setEditedTime(plannedTime || '');
            setIsEditing(true);
        }
    };

    const handleSave = () => {
        onTimeUpdate(data.id, pauseKey, editedTime || null);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };
    
    useEffect(() => {
        if (isLocked && isEditing) setIsEditing(false);
    }, [isLocked, isEditing]);

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg transition-colors ${isActive ? 'bg-teal-50 border border-teal-200' : 'bg-gray-50/70'} ${(isFinished || (isLocked && !actualStartTime)) ? 'opacity-60 bg-gray-100' : ''}`}>
            <div className="flex items-center gap-3">
                <input 
                    type="checkbox"
                    className="h-5 w-5 rounded border-gray-300 text-[var(--c-primary-light)] focus:ring-[var(--c-primary-light)] disabled:opacity-50"
                    checked={!!actualStartTime} 
                    disabled={isCheckboxDisabled}
                    title={getCheckboxTitle()}
                    onChange={(e) => onCheckboxChange(data.id, pauseKey, e.target.checked)} 
                />
                 <span className="text-sm font-medium text-gray-700 w-28">{label}</span>
            </div>
            
            <div className="flex items-center gap-2">
                {isEditing ? (
                    <>
                        <input 
                            type="time" 
                            value={editedTime}
                            onChange={(e) => setEditedTime(e.target.value)}
                            className="form-input !w-28 !py-1"
                            autoFocus
                            onKeyDown={(e) => {
                                if(e.key === 'Enter') handleSave();
                                if(e.key === 'Escape') handleCancel();
                            }}
                            min="08:00"
                            max="20:00"
                        />
                        <button onClick={handleSave} className="p-1.5 rounded-full text-teal-600 bg-teal-100 hover:bg-teal-200" title="Salva"> <Check size={16} /> </button>
                        <button onClick={handleCancel} className="p-1.5 rounded-full text-gray-500 hover:bg-gray-200" title="Annulla"> <X size={16} /> </button>
                    </>
                ) : (
                     <span 
                        className={`text-sm font-semibold w-16 text-center rounded px-1 ${canEdit ? 'cursor-pointer hover:bg-gray-200' : ''} ${actualStartTime ? 'text-teal-600' : 'text-gray-800'}`}
                        onClick={handleStartEditing}
                        title={canEdit ? plannedTime ? 'Modifica orario' : 'Aggiungi orario' : actualStartTime ? `Iniziata alle: ${actualStartTime}`: 'Non modificabile'}
                    >
                        {actualStartTime || plannedTime || '––:––'}
                    </span>
                )}
            </div>
        </div>
    );
};

interface OperatorPauseCardProps {
    data: PauseData;
    now: Date;
    onCheckboxChange: (id: string, type: string, checked: boolean) => void;
    onDelete: (id: string, operatorName: string) => void;
    onTimeUpdate: (id: string, type: string, newTime: string | null) => void;
    creatorAvatar: string;
    canModify: boolean;
}

const OperatorPauseCard: React.FC<OperatorPauseCardProps> = ({ data, now, onCheckboxChange, onDelete, onTimeUpdate, creatorAvatar, canModify }) => {
    
    const pauseTypes = useMemo(() => [
        { key: 'prima_pausa', label: 'Prima Pausa' },
        { key: 'seconda_pausa', label: 'Seconda Pausa' },
        { key: 'pausa_pranzo', label: 'Pausa Pranzo' },
        { key: 'terza_pausa', label: 'Terza Pausa (8h)' }
    ], []);
    
    const activePauseKey = useMemo(() => {
        return pauseTypes.find(pt => {
            const startTime = data.actual_start_times?.[pt.key];
            if (!startTime) return false;
            const duration = PAUSE_DURATIONS[pt.key];
            const endTime = calculateEndTime(startTime, duration, now);
            const startTimeObj = calculateEndTime(startTime, 0, now);
            return endTime && startTimeObj && now >= startTimeObj && now < endTime;
        })?.key;
    }, [data.actual_start_times, now, pauseTypes]);

    const AvatarComponent = getAvatar(creatorAvatar);
    const avatarColor = getAvatarColor(creatorAvatar);

    return (
        <div className="bg-white rounded-lg shadow-sm border" title={`Pausa aggiunta da: ${data.creatorName}`}>
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                        <AvatarComponent className="h-6 w-6" style={{ color: avatarColor }} />
                    </div>
                    <span className="font-bold text-gray-800 text-lg">{data.operatore}</span>
                </div>
                {canModify &&
                    <button 
                        onClick={() => onDelete(data.id, data.operatore)} 
                        className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Elimina moderatore"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                }
            </div>
            <div className="p-4 space-y-3">
                {pauseTypes.map((pt, index) => {
                    let isLockedByLogic = false;
                    let logicLockReason = '';
                    
                    for (let i = 0; i < index; i++) {
                        const prevPauseKey = pauseTypes[i].key;
                        const prevPlannedTime = data[prevPauseKey as keyof PauseData] as string | null;
                        const prevActualStartTime = data.actual_start_times?.[prevPauseKey];

                        if (prevPlannedTime && !prevActualStartTime) {
                            isLockedByLogic = true;
                            logicLockReason = 'Completa la pausa precedente prima di iniziare questa.';
                            break;
                        }
                    }

                    const isLocked = !canModify || isLockedByLogic;
                    const lockedReason = !canModify ? "Permessi di sola lettura." : logicLockReason;

                    return (
                        <PauseItem 
                            key={pt.key}
                            pauseKey={pt.key}
                            label={pt.label}
                            data={data}
                            now={now}
                            isAnotherPauseActive={!!activePauseKey && activePauseKey !== pt.key}
                            onCheckboxChange={onCheckboxChange}
                            onTimeUpdate={onTimeUpdate}
                            isLocked={isLocked}
                            lockedReason={lockedReason}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default OperatorPauseCard;