import React from 'react';
import { Shift } from '../../types';
import { getItalianDay, getRowBg, sortShifts, getDurationText } from './helpers';
import { Edit, Trash2 } from 'lucide-react';

interface DayCardProps {
    dateObj: Date;
    dayShifts: Shift[];
    isReadOnly: boolean;
    onEditClick: () => void;
    onDeleteClick: () => void;
}

const DayCard: React.FC<DayCardProps> = ({ dateObj, dayShifts, isReadOnly, onEditClick, onDeleteClick }) => {
    return (
        <div className="bg-white rounded-lg shadow-sm border flex flex-col">
            <div className="bg-blue-100 px-4 py-3 border-b flex justify-between items-center">
                <span className="font-semibold text-blue-800">{getItalianDay(dateObj.getDay())} {dateObj.getDate()}</span>
                {!isReadOnly && dayShifts.length > 0 && (
                    <div className="flex gap-1">
                        <button className="p-1.5 rounded-md hover:bg-blue-200" title="Modifica Turno" onClick={onEditClick}><Edit className="w-4 h-4 text-gray-600" /></button>
                        <button className="p-1.5 rounded-md hover:bg-red-200" title="Elimina Turno" onClick={onDeleteClick}><Trash2 className="w-4 h-4 text-red-600" /></button>
                    </div>
                )}
            </div>
            <div className="p-2 flex-grow">
                {dayShifts.length > 0 ? (
                    <table className="w-full text-base">
                        <thead className="text-sm text-gray-500">
                            <tr>
                                <th className="pb-2 px-2 font-semibold text-left">Nome</th>
                                <th className="pb-2 px-2 font-semibold text-center">Turno</th>
                                <th className="pb-2 px-2 font-semibold text-center">Note</th>
                                <th className="pb-2 px-2 font-semibold text-center">Tipo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {sortShifts(dayShifts).map(s => (
                                <tr key={s.id} className={`${getRowBg(s.justification)} align-middle`}>
                                    <td className="py-1.5 px-2 font-medium text-gray-800 text-left">{s.employeeName}</td>
                                    <td className="py-1.5 px-2 text-center">
                                        {s.shiftTime && s.shiftTime !== '-' ? (
                                            <div>
                                                <span className="font-semibold block text-gray-900">{s.shiftTime}</span>
                                                <span className={`text-sm block ${s.baseMode === 'Smart Working' ? 'text-blue-700' : 'text-green-700'}`}>{s.baseMode}</span>
                                            </div>
                                        ) : <span className="text-gray-500">-</span>}
                                    </td>
                                    <td className="py-1.5 px-2 text-red-600 font-semibold text-center">{getDurationText(s.permStart, s.permEnd)}</td>
                                    <td className="py-1.5 px-2 font-semibold text-gray-900 text-center">{s.justification !== "-" ? s.justification : "-"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-sm text-gray-500 text-center py-4">Nessun turno registrato.</p>}
            </div>
        </div>
    );
};

export default DayCard;
