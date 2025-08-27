

import React, { useState, useMemo, useEffect } from 'react';
import { Campaign } from '../types';
import { ChevronLeft, ChevronRight, Facebook, Instagram, Linkedin, Twitter, Music } from 'lucide-react';

interface CampaignCalendarProps {
  campaigns: Campaign[];
  dateFilter: { start: string; end: string } | null;
  setDateFilter: (filter: { start: string; end: string } | null) => void;
}

const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const iconMap: Record<string, React.FC<any>> = { Facebook, Instagram, TikTok: Music, Linkedin, X: Twitter };
const iconColorMap: Record<string, string> = { Facebook: '#1877F2', Instagram: '#E4405F', TikTok: '#EE1D52', Linkedin: '#0A66C2', X: '#000000' };

const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day).toLocaleDateString('it-IT');
};

const CampaignCalendar: React.FC<CampaignCalendarProps> = ({ campaigns, dateFilter, setDateFilter }) => {
    const today = useMemo(() => new Date(), []);
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());

    const { minDate, maxDate } = useMemo(() => {
        if (!dateFilter) return { minDate: null, maxDate: null };
        return { minDate: new Date(dateFilter.start), maxDate: new Date(dateFilter.end) };
    }, [dateFilter]);
    
    useEffect(() => {
        if (dateFilter) {
            setCurrentMonth(minDate!.getMonth());
            setCurrentYear(minDate!.getFullYear());
        } else {
            setCurrentMonth(today.getMonth());
            setCurrentYear(today.getFullYear());
        }
    }, [dateFilter, minDate, today]);

    const handlePrevMonth = () => {
        if (dateFilter && minDate) {
            if (currentYear > minDate.getFullYear() || (currentYear === minDate.getFullYear() && currentMonth > minDate.getMonth())) {
                setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
                if (currentMonth === 0) setCurrentYear(currentYear - 1);
            }
        } else {
            setCurrentMonth(currentMonth === 0 ? 11 : currentMonth - 1);
            if (currentMonth === 0) setCurrentYear(currentYear - 1);
        }
    };
    
    const handleNextMonth = () => {
        if (dateFilter && maxDate) {
             if (currentYear < maxDate.getFullYear() || (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth())) {
                setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
                if (currentMonth === 11) setCurrentYear(currentYear + 1);
            }
        } else {
            setCurrentMonth(currentMonth === 11 ? 0 : currentMonth + 1);
            if (currentMonth === 11) setCurrentYear(currentYear + 1);
        }
    };

    const handleApplyDateFilter = (e: React.FormEvent) => {
        e.preventDefault();
        const start = (document.getElementById('calendar-start') as HTMLInputElement).value;
        const end = (document.getElementById('calendar-end') as HTMLInputElement).value;
        if (start && end && end >= start) {
            setDateFilter({ start, end });
        } else {
            alert("Seleziona un intervallo di date valido.");
        }
    };

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDayOfMonth; i++) {
            cells.push(<div key={`empty-${i}`} className="bg-white p-2 min-h-[100px]"></div>);
        }
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            const currentDateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const dayCampaigns = campaigns.filter(c => c.start <= currentDateStr && c.end >= currentDateStr);

            let cellClasses = "bg-white p-2 min-h-[100px] space-y-1";
            if (dateFilter && (date < minDate! || date > maxDate!)) {
                cellClasses = "bg-gray-100 p-2 min-h-[100px] space-y-1 opacity-50";
            }
            
            cells.push(
                <div key={day} className={cellClasses}>
                    <div className="text-sm font-semibold text-gray-700">{day}</div>
                    {dayCampaigns.map(c => {
                         const Icon = iconMap[c.channel];
                         const color = iconColorMap[c.channel] || 'currentColor';
                         const stripe = (
                            <div
                                title={`${c.title} (${formatDate(c.start)} - ${formatDate(c.end)})`}
                                className="flex items-center gap-1 text-xs text-gray-800 rounded-lg p-1 cursor-pointer truncate hover:bg-gray-100 transition"
                            >
                                {Icon && <Icon className="w-4 h-4 flex-shrink-0" style={{color}} />}
                                <span className="truncate">{c.title}</span>
                            </div>
                        );
                        return c.link ? <a key={c.id} href={c.link} target="_blank" rel="noopener noreferrer">{stripe}</a> : <div key={c.id}>{stripe}</div>;
                    })}
                </div>
            );
        }
        return cells;
    }, [currentMonth, currentYear, campaigns, dateFilter, minDate, maxDate]);

  return (
    <section className="bg-white rounded-xl shadow-sm border">
      <div className="p-6 border-b flex items-center justify-between">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="h-6 w-6 text-gray-700" />
        </button>
        <h2 className="text-2xl font-bold text-gray-800 text-center flex-1">{`${monthNames[currentMonth]} ${currentYear}`}</h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="h-6 w-6 text-gray-700" />
        </button>
      </div>
      <form onSubmit={handleApplyDateFilter} className="p-6 border-b">
        <div className="flex items-end space-x-4">
          <div>
            <label htmlFor="calendar-start" className="block text-sm font-medium text-gray-700 mb-1">Dal:</label>
            <input type="date" id="calendar-start" defaultValue={dateFilter?.start} className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
          </div>
          <div>
            <label htmlFor="calendar-end" className="block text-sm font-medium text-gray-700 mb-1">Al:</label>
            <input type="date" id="calendar-end" defaultValue={dateFilter?.end} className="border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900" />
          </div>
          <div className="flex items-end space-x-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm">Applica</button>
            <button type="button" onClick={() => { setDateFilter(null); (document.getElementById('calendar-start') as HTMLInputElement).value = ''; (document.getElementById('calendar-end') as HTMLInputElement).value = ''; }} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition text-sm">Reset</button>
          </div>
        </div>
      </form>
      <div className="grid grid-cols-7 gap-px p-6 bg-gray-100">
        <div className="bg-white text-center py-3 text-sm font-semibold">Dom</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Lun</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Mar</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Mer</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Gio</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Ven</div>
        <div className="bg-white text-center py-3 text-sm font-semibold">Sab</div>
        {calendarGrid}
      </div>
    </section>
  );
};

export default CampaignCalendar;