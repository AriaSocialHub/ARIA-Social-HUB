import { Shift } from '../../types';

export const formatDate = (d: Date): string => {
  const y = d.getFullYear();
  const m = ('0' + (d.getMonth() + 1)).slice(-2);
  const day = ('0' + d.getDate()).slice(-2);
  return `${y}-${m}-${day}`;
};

export const getItalianMonth = (mIndex: number): string => 
  ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'][mIndex];

export const getItalianDay = (dIndex: number): string => 
  ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'][dIndex];

export const getDuration = (start: string, end: string): number => {
  if (!start || !end) return 0;
  const [h1, m1] = start.split(':').map(Number);
  const [h2, m2] = end.split(':').map(Number);
  return ((h2 * 60 + m2) - (h1 * 60 + m1));
};

const shortDuration = (d: number): string => {
  if (d < 60) return `${d}m`;
  const hours = Math.floor(d / 60);
  const mins = d % 60;
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
};

export const getDurationText = (start?: string, end?: string): string => {
    if (!start || !end) return '-';
    return `${start}-${end} (${shortDuration(getDuration(start, end))})`;
};

export const sortShifts = (shifts: Shift[]): Shift[] => {
  const special = ["Riposo", "Ferie", "Malattia", "Festivo"];
  return [...shifts].sort((a, b) => {
    const aSpec = special.includes(a.justification);
    const bSpec = special.includes(b.justification);
    if (aSpec && !bSpec) return 1;
    if (!aSpec && bSpec) return -1;
    if (!aSpec && !bSpec) {
      const aStart = a.shiftTime.split('-')[0];
      const bStart = b.shiftTime.split('-')[0];
      return aStart.localeCompare(bStart);
    }
    return a.employeeName.localeCompare(b.employeeName);
  });
};

export const getRowBg = (giust: string): string => {
  if (giust === "Riposo") return "bg-yellow-100";
  if (["Ferie", "Malattia", "Festivo"].includes(giust)) return "bg-red-100";
  return "bg-white";
};

export const formInput = "block w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-md text-sm shadow-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";
