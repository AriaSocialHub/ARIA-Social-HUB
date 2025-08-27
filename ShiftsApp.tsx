
import React, { useState, useMemo } from 'react';
import { useData } from './contexts/DataContext';
import { ShiftsData, UserProfile } from './types';
import { getItalianMonth } from './components/shifts/helpers';
import DayCard from './components/shifts/DayCard';
import ShiftModal from './components/shifts/ShiftModal';
import SelectEmployeeModal from './components/shifts/SelectEmployeeModal';
import ErrorModal from './components/shifts/ErrorModal';
import { Edit, Trash2 } from 'lucide-react';


const btnPrimary = "inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed";
const btnSecondary = "inline-flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-semibold rounded-md hover:bg-gray-300 transition";
const btnDanger = "inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 transition";


const ShiftsApp: React.FC<{ serviceId: string; isReadOnly: boolean, currentUser: UserProfile | null }> = ({ serviceId, isReadOnly, currentUser }) => {
    const { servicesData, saveServiceData } = useData();
    const shiftsData: ShiftsData = useMemo(() => servicesData[serviceId]?.data || {}, [servicesData, serviceId]);
    
    const isPrimoLivello = serviceId.includes('primo-livello');

    const [currentDate, setCurrentDate] = useState(new Date());
    
    // Modals state
    const [shiftModal, setShiftModal] = useState<{ open: boolean, date?: string, shiftId?: string }>({ open: false });
    const [selectEmployeeModal, setSelectEmployeeModal] = useState<{ open: boolean, date?: string, action?: 'edit' | 'delete' }>({ open: false });
    const [deleteModal, setDeleteModal] = useState<{ open: boolean, date?: string, shiftId?: string }>({ open: false });
    const [errorModal, setErrorModal] = useState<{ open: boolean, message: string }>({ open: false, message: '' });

    const handleDataUpdate = (newShiftsData: ShiftsData, action?: 'add' | 'update' | 'delete', title?: string, itemId?: string) => {
        if (!currentUser) return;
        saveServiceData(serviceId, newShiftsData, currentUser.name, action, title, itemId);
    };

    const handleOpenShiftModal = (date?: string, shiftId?: string) => {
        setShiftModal({ open: true, date, shiftId });
    };

    const handleSaveShift = (shift: Omit<import('./types').Shift, 'id'>, date: string, shiftId?: string) => {
        const newShiftsData = JSON.parse(JSON.stringify(shiftsData));
        const shiftsOnDate = newShiftsData[date] || [];

        if (shiftsOnDate.some((s: import('./types').Shift) => s.employeeName.toLowerCase() === shift.employeeName.toLowerCase() && s.id !== shiftId)) {
            setErrorModal({ open: true, message: "Esiste già un turno per questo dipendente in questa data." });
            return;
        }

        let finalShiftId = shiftId;
        const isUpdate = !!shiftId;

        if (isUpdate) {
            const index = shiftsOnDate.findIndex((s: import('./types').Shift) => s.id === shiftId);
            if (index !== -1) {
                shiftsOnDate[index] = { ...shiftsOnDate[index], ...shift };
            }
        } else {
            finalShiftId = `shift_${Date.now()}`;
            shiftsOnDate.push({ ...shift, id: finalShiftId });
        }
        newShiftsData[date] = shiftsOnDate;

        const action = isUpdate ? 'update' : 'add';
        const title = `Turno per ${shift.employeeName} il ${date}`;
        handleDataUpdate(newShiftsData, action, title, finalShiftId);

        setShiftModal({ open: false });
    };

    const handleDeleteShift = (date: string, shiftId: string) => {
        const newShiftsData = JSON.parse(JSON.stringify(shiftsData));
        const shiftsOnDate = newShiftsData[date] || [];
        const shiftToDelete = shiftsOnDate.find((s: import('./types').Shift) => s.id === shiftId);

        newShiftsData[date] = shiftsOnDate.filter((s: import('./types').Shift) => s.id !== shiftId);
        if (newShiftsData[date].length === 0) {
            delete newShiftsData[date];
        }

        if (shiftToDelete) {
             const title = `Turno per ${shiftToDelete.employeeName} il ${date}`;
             handleDataUpdate(newShiftsData, 'delete', title, shiftId);
        } else {
            handleDataUpdate(newShiftsData);
        }
        setDeleteModal({ open: false });
    };
    
    const MemoizedDayCard = React.memo(({ dateObj, fDate }: { dateObj: Date, fDate: string }) => {
        const dayShifts = shiftsData[fDate] || [];
        return (
            <DayCard
                dateObj={dateObj}
                dayShifts={dayShifts}
                isReadOnly={isReadOnly}
                onEditClick={() => setSelectEmployeeModal({ open: true, date: fDate, action: 'edit' })}
                onDeleteClick={() => setSelectEmployeeModal({ open: true, date: fDate, action: 'delete' })}
            />
        );
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    return (
        <div>
             <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900">{isPrimoLivello ? 'Turni Primo Livello' : 'Turni Secondo Livello'}</h1>
                {!isReadOnly && <button className={btnPrimary} onClick={() => handleOpenShiftModal()}>Inserisci Turno</button>}
             </div>
            
            <div className="flex items-center justify-center p-3 mb-6 bg-white rounded-lg shadow-sm border">
                <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}><span className="material-icons-round">chevron_left</span></button>
                <div className="text-xl font-semibold text-gray-800 mx-4 w-48 text-center">{getItalianMonth(month)} {year}</div>
                <button className="p-2 rounded-full hover:bg-gray-100" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}><span className="material-icons-round">chevron_right</span></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: daysInMonth }, (_, i) => {
                    const dateObj = new Date(year, month, i + 1);
                    const fDate = new Date(year, month, i + 1).toISOString().slice(0, 10);
                    return <MemoizedDayCard key={dateObj.toISOString()} dateObj={dateObj} fDate={fDate} />;
                })}
            </div>

            {shiftModal.open && <ShiftModal {...shiftModal} shiftsData={shiftsData} onSave={handleSaveShift} onClose={() => setShiftModal({ open: false })} isPrimoLivello={isPrimoLivello} />}
            
            {selectEmployeeModal.open && (
                <SelectEmployeeModal 
                    {...selectEmployeeModal} 
                    shiftsOnDate={shiftsData[selectEmployeeModal.date!] || []} 
                    onClose={() => setSelectEmployeeModal({ open: false })}
                    onConfirm={(shiftId) => {
                        if(selectEmployeeModal.action === 'edit') handleOpenShiftModal(selectEmployeeModal.date, shiftId);
                        else setDeleteModal({ open: true, date: selectEmployeeModal.date, shiftId });
                    }}
                />
            )}

            {deleteModal.open && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
                        <h2 className="text-lg font-bold text-gray-900">Conferma Eliminazione</h2>
                        <p className="text-sm text-gray-600 mt-2 mb-6">Sei sicuro di voler eliminare questo turno?</p>
                        <div className="flex justify-end gap-3">
                           <button onClick={() => setDeleteModal({ open: false })} className={btnSecondary}>Annulla</button>
                           <button onClick={() => handleDeleteShift(deleteModal.date!, deleteModal.shiftId!)} className={btnDanger}>Elimina</button>
                        </div>
                    </div>
                </div>
            )}
            
            {errorModal.open && (
                <ErrorModal 
                    message={errorModal.message}
                    onClose={() => setErrorModal({ open: false, message: '' })}
                />
            )}
        </div>
    );
};


export default ShiftsApp;