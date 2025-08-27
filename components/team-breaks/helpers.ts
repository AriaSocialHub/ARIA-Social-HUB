export const PAUSE_DURATIONS: Record<string, number> = { prima_pausa: 15, seconda_pausa: 15, pausa_pranzo: 60, terza_pausa: 15 };

export const OPERATORS = [
    "Del Tevere Giuseppe", "Furnari Alfredo", "Gamiddo Marialorenza", "Giuffrida Giusi", 
    "Giuffrida Martina", "Leocata Rita", "Lo Cicero Laura", "Mangani Federica", 
    "Mazzaglia Cinzia", "Paparo Tiziana", "Perri Marilisa", "Romano Roberta", 
    "Venuto Mariannunziata"
];

export const calculateEndTime = (st: string, dur: number, now: Date): Date | null => {
    if (!st || !/^\d{1,2}:\d{2}/.test(st)) return null;
    const timeMatch = st.match(/(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;
    const [, h, m] = timeMatch.map(Number);
    const sd = new Date(now); // Use the synchronized date from the parent component
    sd.setHours(h, m, 0, 0);
    return new Date(sd.getTime() + dur * 60000);
};

export const formatDateTime = (d: Date) => d.toLocaleString('it-IT');
export const formatTime = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });