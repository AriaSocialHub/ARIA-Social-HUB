

import React from 'react';
import { Facebook, Instagram, Twitter, Linkedin, Music, Lock, XCircle, ArrowRightCircle, ArrowLeftCircle, ThumbsUp, MessageCircle, MessageCircleOff, Ghost } from 'lucide-react';

export const MODERATORI = [
    'Del Tevere Giuseppe', 'Furnari Alfredo', 'Gamiddo Marialorenza', 'Giuffrida Giusi', 
    'Giuffrida Martina', 'Leocata Rita', 'Lo Cicero Laura', 'Mangani Federica', 
    'Mazzaglia Cinzia', 'Paparo Tiziana', 'Perri Marilisa', 'Romano Roberta', 
    'Venuto Mariannunziata'
];
export const SOGLIE = ['OK', 'KO'];
export const ARGOMENTI = ['Richiesta di servizi', 'Richiedi una demo', 'Supporto', 'Opportunità di carriera', 'Altro'];

export const PLATFORMS = [
    'Facebook Pubblico', 'Facebook Privato', 'X Pubblico', 'X Privato',
    'Instagram Pubblico', 'Instagram Direct', 'LinkedIn Pubblico', 'LinkedIn Privato',
    'TikTok Pubblico', 'TikTok Privato'
];

const PLATFORM_ICONS: Record<string, React.FC<any>> = {
    'Facebook': Facebook,
    'X': Twitter,
    'Instagram': Instagram,
    'LinkedIn': Linkedin,
    'TikTok': Music,
};

export const FLAG_MAP: Record<string, { icon: React.FC<any>, color: string }> = {
    'Non Risposto': { icon: XCircle, color: 'text-red-500' },
    'Risposto': { icon: MessageCircle, color: 'text-green-600' },
    'Ignorato': { icon: Ghost, color: 'text-gray-500' },
    'Nascosto': { icon: MessageCircleOff, color: 'text-gray-500' },
    'Inoltrato al BO': { icon: ArrowRightCircle, color: 'text-blue-500' },
    'Rilasciato al FO': { icon: ArrowLeftCircle, color: 'text-purple-500' },
    'Reaction': { icon: ThumbsUp, color: 'text-yellow-500' }
};

export const getPlatformIcon = (platformName: string): React.ReactNode => {
    let baseName = '';
    if (platformName.includes('Facebook')) baseName = 'Facebook';
    else if (platformName.includes('X')) baseName = 'X';
    else if (platformName.includes('Instagram')) baseName = 'Instagram';
    else if (platformName.includes('LinkedIn')) baseName = 'LinkedIn';
    else if (platformName.includes('TikTok')) baseName = 'TikTok';

    const IconComponent = baseName ? PLATFORM_ICONS[baseName] : null;
    const isPrivate = platformName.includes('Privato') || platformName.includes('Direct');

    return React.createElement(
        'div',
        { className: "relative w-6 h-6 flex items-center justify-center" },
        IconComponent ? React.createElement(IconComponent, { className: "w-full h-full text-gray-700" }) : '?',
        isPrivate ? React.createElement(
            'div',
            { className: "absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center border" },
            React.createElement(Lock, { className: "w-2.5 h-2.5 text-gray-600" })
        ) : null
    );
};

export const getFlagIcons = (ticket: { azione_principale: string | null; azione_inoltro: string; }): React.ReactNode => {
    const icons = [];
    const mainAction = ticket.azione_principale || 'Non Risposto';
    
    const mainActionInfo = FLAG_MAP[mainAction];
    if (mainActionInfo) {
        icons.push(React.createElement(mainActionInfo.icon, { key: mainAction, title: mainAction, className: `w-5 h-5 ${mainActionInfo.color}` }));
    }

    if (ticket.azione_inoltro) {
        const inoltroInfo = FLAG_MAP[ticket.azione_inoltro];
        if (inoltroInfo) {
            icons.push(React.createElement(inoltroInfo.icon, { key: ticket.azione_inoltro, title: ticket.azione_inoltro, className: `w-5 h-5 ${inoltroInfo.color}` }));
        }
    }
    
    return React.createElement('div', { className: "inline-flex gap-2" }, ...icons);
};


export const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '–';
    try {
        return new Date(isoString).toLocaleString('it-IT', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return 'Data non valida';
    }
};

const isWeekend = (date: Date): boolean => {
    const day = date.getDay();
    return day === 0 || day === 6; // Sunday or Saturday
};

export const calculateDiff = (startISO: string | null, endISO: string | null): string | null => {
    if (!startISO || !endISO) return null;
    let startDate = new Date(startISO);
    let endDate = new Date(endISO);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()) || startDate >= endDate) {
        return null;
    }

    const WORK_DAY_START_HOUR = 8;
    const WORK_DAY_END_HOUR = 20;

    let totalWorkMinutes = 0;
    let current = new Date(startDate);

    // Adjust start date if it's outside working hours
    if (isWeekend(current) || current.getHours() >= WORK_DAY_END_HOUR) {
         current.setDate(current.getDate() + 1);
         current.setHours(WORK_DAY_START_HOUR, 0, 0, 0);
         while (isWeekend(current)) {
            current.setDate(current.getDate() + 1);
         }
    } else if (current.getHours() < WORK_DAY_START_HOUR) {
        current.setHours(WORK_DAY_START_HOUR, 0, 0, 0);
    }
    
    // After clamping, if start is now after end, no time has passed.
    if (current >= endDate) return null;

    while (current < endDate) {
        const loopDayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0);

        if (!isWeekend(current)) {
            const workDayStart = new Date(current.getFullYear(), current.getMonth(), current.getDate(), WORK_DAY_START_HOUR);
            const workDayEnd = new Date(current.getFullYear(), current.getMonth(), current.getDate(), WORK_DAY_END_HOUR);

            // Calculate the intersection of [current, endDate] and [workDayStart, workDayEnd]
            const effectiveStart = Math.max(current.getTime(), workDayStart.getTime());
            const effectiveEnd = Math.min(endDate.getTime(), workDayEnd.getTime());

            if (effectiveEnd > effectiveStart) {
                totalWorkMinutes += (effectiveEnd - effectiveStart) / (1000 * 60);
            }
        }
        
        // Move current to the start of the next day
        current = loopDayEnd;
    }

    if (totalWorkMinutes < 1) return "0m";
    
    const hours = Math.floor(totalWorkMinutes / 60);
    const minutes = Math.round(totalWorkMinutes % 60);

    let result = '';
    if (hours > 0) result += `${hours}h `;
    result += `${minutes}m`;

    return result.trim();
};

export const isFuoriOrario = (isoString: string | null): boolean => {
    if (!isoString) return false;
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return false;
    
    const day = date.getDay(); // 0 = Sunday, 6 = Saturday
    const hour = date.getHours();

    // Fuori orario se è weekend
    if (day === 0 || day === 6) return true;
    // Fuori orario se è un giorno feriale ma fuori dall'orario lavorativo (8-20)
    if (hour < 8 || hour >= 20) return true;
    
    return false;
};

// Function to combine date and time strings into a full ISO string
export const toISOString = (dateStr?: string, timeStr?: string): string | null => {
    if (!dateStr || !timeStr) return null;
    return new Date(`${dateStr}T${timeStr}`).toISOString();
};

// Function to split an ISO string into date and time parts for form inputs
export const fromISOString = (isoString: string | null): { date: string, time: string } => {
    if (!isoString) return { date: '', time: '' };
    try {
        const d = new Date(isoString);
        const date = d.toISOString().split('T')[0];
        const time = d.toTimeString().split(' ')[0].substring(0, 5);
        return { date, time };
    } catch {
        return { date: '', time: '' };
    }
};