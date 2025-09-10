


import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { PauseData, AllPauseData, OnlineUser, UserProfile } from './types';
import { UserPlus, Filter, Trash2, Coffee, AlertTriangle } from 'lucide-react';

import AddPauseModal from './components/team-breaks/AddPauseModal';
import OperatorPauseCard from './components/team-breaks/OperatorPauseCard';
import RegulationsSection from './components/team-breaks/RegulationsSection';
import { formatDateTime, formatTime, calculateEndTime, PAUSE_DURATIONS } from './components/team-breaks/helpers';
import { getAvatar } from './services/avatarRegistry';
import { useData } from './contexts/DataContext';


interface CurrentUser extends UserProfile {
    accessLevel: 'admin' | 'view';
}

interface TeamBreaksAppProps {
  serviceId: string;
  isReadOnly: boolean;
  onlineUsers?: OnlineUser[];
  currentUserForBreaks?: CurrentUser | null;
  now: Date;
}

const TeamBreaksApp: React.FC<TeamBreaksAppProps> = ({ serviceId, isReadOnly, onlineUsers, currentUserForBreaks: currentUser, now }) => {
    const { servicesData, saveServiceData } = useData();
    const pauseData: AllPauseData = servicesData[serviceId]?.data || [];

    const [isAddModalOpen, setAddModalOpen] = useState(false);
    const [deleteRequest, setDeleteRequest] = useState<{id: string, name: string} | null>(null);
    const [filter, setFilter] = useState('tutti');
    const [isDeleteAllConfirmOpen, setDeleteAllConfirmOpen] = useState(false);
    
    const canAddAndModify = useMemo(() => {
        if (!currentUser) {
            return false;
        }
        // Both admin and view can modify, the global isReadOnly prop will handle admin view-only mode.
        return currentUser.accessLevel === 'admin' || currentUser.accessLevel === 'view';
    }, [currentUser]);

    const onlineUserMap = useMemo(() => new Map((onlineUsers || []).map(u => [u.name, u])), [onlineUsers]);
    
    const handleSaveData = (newData: AllPauseData) => {
        if (currentUser) {
            saveServiceData(serviceId, newData, currentUser.name);
        }
    };

    const handleDeleteAllPauses = () => {
        handleSaveData([]);
        setDeleteAllConfirmOpen(false);
    };

    const handleAddPause = (formData: Omit<PauseData, 'id' | 'actual_start_times' | 'creatorAvatar' | 'creatorName'>) => {
        if (!currentUser) return;
        const newEntry: PauseData = { 
            id: `pause_${Date.now()}`, 
            actual_start_times: {}, 
            ...formData,
            creatorAvatar: currentUser.avatar,
            creatorName: currentUser.name
        };
        handleSaveData([...pauseData, newEntry]);
        setAddModalOpen(false);
    };

    const handleDeleteOperator = (idToDelete: string) => {
        if(deleteRequest) {
            handleSaveData(pauseData.filter(p => p.id !== idToDelete));
            setDeleteRequest(null);
        }
    };
    
    const handleCheckboxChange = (id: string, type: string, checked: boolean) => {
        const newData = pauseData.map(p => {
            if (p.id === id) {
                const newActualTimes = { ...(p.actual_start_times || {}) };
                newActualTimes[type] = checked ? formatTime(new Date()) : null;
                return { ...p, actual_start_times: newActualTimes };
            }
            return p;
        });
        handleSaveData(newData);
    };
    
    const handleTimeUpdate = (id: string, type: string, newTime: string | null) => {
        const newData = pauseData.map(p => {
            if (p.id === id) {
                const updatedPause = { ...p, [type]: newTime || null };
                return updatedPause;
            }
            return p;
        });
        handleSaveData(newData);
    };

    const bannerUsers = useMemo(() => {
        return pauseData.flatMap(opData => {
            return Object.keys(opData.actual_start_times || {}).map(pauseKey => {
                const startTime = opData.actual_start_times[pauseKey];
                if (!startTime) return null;
                const duration = PAUSE_DURATIONS[pauseKey];
                if (!duration) return null;
                
                const startTimeObj = calculateEndTime(startTime, 0, now);
                const endTime = calculateEndTime(startTime, duration, now);
                
                if (startTimeObj && endTime && now >= startTimeObj && now < endTime) {
                    const Icon = getAvatar(opData.creatorAvatar);
                    return { operator: opData.operatore, endTime, icon: Icon, creatorName: opData.creatorName };
                }
                return null;
            }).filter((item): item is { operator: string; endTime: Date; icon: React.FC<React.SVGProps<SVGSVGElement>>; creatorName: string } => !!item);
        }).filter((v, i, a) => a.findIndex(t => (t.operator === v.operator)) === i);
    }, [pauseData, now]);

    const filteredData = useMemo(() => {
        return pauseData.filter(item => {
            if (filter === 'tutti') return true;

            const safeActualStartTimes = item.actual_start_times || {};

            const activePause = Object.keys(safeActualStartTimes).find(key => {
                const startTime = safeActualStartTimes[key];
                if (!startTime) return false;
                const endTime = calculateEndTime(startTime, PAUSE_DURATIONS[key], now);
                const startTimeObj = calculateEndTime(startTime, 0, now);
                return endTime && startTimeObj && now >= startTimeObj && now < endTime;
            });

            if (filter === 'in_corso') return !!activePause;

            if (filter === 'conclusa') {
                const allPlannedPauses = Object.keys(PAUSE_DURATIONS).filter(key => item[key as keyof PauseData]);
                const allTakenPauses = Object.keys(safeActualStartTimes).filter(key => safeActualStartTimes[key]);
                return !activePause && allPlannedPauses.length > 0 && allPlannedPauses.every(p => allTakenPauses.includes(p));
            }
            return true;
        }).sort((a, b) => a.operatore.localeCompare(b.operatore));
    }, [pauseData, filter, now]);
    
    return (
        <div className="space-y-8">
             <div className="flex flex-wrap justify-between items-start gap-4">
                <div>
                     <h1 className="text-3xl font-bold" style={{color: 'var(--c-text-heading)'}}>Gestione Pause</h1>
                     <div className="mt-2 text-sm text-gray-500 font-medium bg-white/60 px-3 py-1 rounded-full w-fit">{formatDateTime(now)}</div>
                </div>
                <div className="flex items-center gap-2">
                    {!isReadOnly && currentUser?.accessLevel === 'admin' && pauseData.length > 0 &&
                        <button onClick={() => setDeleteAllConfirmOpen(true)} className="btn bg-red-600 text-white hover:bg-red-700">
                            <Trash2 className="w-5 h-5"/> Elimina Tutto
                        </button>
                    }
                    {canAddAndModify && 
                        <button onClick={() => setAddModalOpen(true)} className="btn btn-primary"><UserPlus className="w-5 h-5"/> Aggiungi Pausa</button>
                    }
                </div>
            </div>
            
            <div className="card">
                <h3 className="text-xl font-bold text-[var(--c-text-heading)] mb-4">Operatori in Pausa</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-4 min-h-[5rem]">
                    {bannerUsers.length > 0 ? (
                        bannerUsers.map((user, index) => (
                            <div key={`${user.operator}-${index}`} className="flex items-center gap-3 text-center" title={`Pausa aggiunta da: ${user.creatorName}`}>
                                <div className="h-12 w-12 rounded-full flex items-center justify-center bg-amber-100 ring-2 ring-amber-300">
                                    <user.icon className="h-7 w-7 text-amber-600"/>
                                </div>
                                <div>
                                    <span className="font-semibold text-gray-800 block">{user.operator}</span>
                                    <span className="text-sm text-gray-500">Fine: {formatTime(user.endTime)}</span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center justify-center w-full text-gray-500">Nessun collega attualmente in pausa.</div>
                    )}
                </div>
            </div>


            <div className="card">
                <div className="flex items-center gap-2 mb-4">
                    <label htmlFor="filter-select" className="text-sm font-medium text-gray-700 flex items-center gap-2"><Filter className="w-5 h-5"/> Mostra:</label>
                    <select id="filter-select" value={filter} onChange={e => setFilter(e.target.value)} className="form-input !w-auto !py-1.5">
                        <option value="tutti">Tutti</option>
                        <option value="in_corso">In Pausa</option>
                        <option value="conclusa">Pause Concluse</option>
                    </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredData.length > 0 ? (
                        filteredData.map(pData => (
                            <OperatorPauseCard
                                key={pData.id} 
                                data={pData} 
                                now={now}
                                onCheckboxChange={handleCheckboxChange}
                                onDelete={(id, name) => setDeleteRequest({id, name})}
                                onTimeUpdate={handleTimeUpdate}
                                creatorAvatar={pData.creatorAvatar}
                                canModify={canAddAndModify}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-16 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <Coffee size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-xl font-semibold text-gray-700">Nessuna Pausa Trovata</h3>
                            <p className="text-gray-500 mt-2">{filter === 'tutti' ? 'Aggiungi una nuova pausa per un moderatore.' : 'Nessuna pausa corrisponde ai filtri selezionati.'}</p>
                        </div>
                    )}
                </div>
            </div>

            <RegulationsSection />

            {isAddModalOpen && <AddPauseModal onClose={() => setAddModalOpen(false)} onSave={handleAddPause} existingOperators={pauseData.map(p => p.operatore)} currentUser={currentUser} />}
            
            {deleteRequest && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteRequest(null)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sei sicuro?</h2>
                        <p className="text-gray-600 mb-6">Stai per eliminare tutte le pause per il moderatore <strong>{deleteRequest.name}</strong>. L'azione è irreversibile.</p>
                        <div className="flex justify-center gap-4">
                           <button onClick={() => setDeleteRequest(null)} className="btn btn-secondary">Annulla</button>
                           <button onClick={() => handleDeleteOperator(deleteRequest.id)} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 h-5"/> Elimina</button>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteAllConfirmOpen && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setDeleteAllConfirmOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm text-center" onClick={e => e.stopPropagation()}>
                        <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Sei sicuro?</h2>
                        <p className="text-gray-600 mb-6">Stai per eliminare <strong>tutte le pause</strong> inserite. L'azione è irreversibile.</p>
                        <div className="flex justify-center gap-4">
                            <button onClick={() => setDeleteAllConfirmOpen(false)} className="btn btn-secondary">Annulla</button>
                            <button onClick={handleDeleteAllPauses} className="btn bg-red-600 hover:bg-red-700 text-white"><Trash2 className="w-5 h-5"/> Elimina Tutto</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default TeamBreaksApp;