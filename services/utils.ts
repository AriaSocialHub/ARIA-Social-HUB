/**
 * Converts an Excel serial date number to a JavaScript Date object.
 * @param serial The Excel serial date number.
 * @returns A JavaScript Date object.
 */
export function excelSerialToDate(serial: number): Date {
    const excelEpoch = new Date(1899, 11, 30);
    return new Date(excelEpoch.getTime() + serial * 24 * 60 * 60 * 1000);
}

/**
 * Converts an Excel serial date number or a date string to a formatted date string.
 * This is a more comprehensive version used for ticket dates.
 * @param value The value from the Excel cell.
 * @returns A formatted date string (DD/MM/YYYY, HH:MM:SS) or null.
 */
export function formatDateValue(value: any): string | null {
    if (!value) return null;
    let date: Date | null = null;

    if (typeof value === 'number' && value > 1) {
        // Handle Excel serial numbers.
        date = excelSerialToDate(value);
    } else if (typeof value === 'string') {
        const parsedDate = new Date(value);
        if (!isNaN(parsedDate.getTime())) {
            date = parsedDate;
        }
    } else if (value instanceof Date && !isNaN(value.getTime())) {
        date = value;
    }
    
    if (date) {
        // Format to Italian standard and remove comma between date and time.
        return date.toLocaleString('it-IT', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).replace(',', '');
    }

    if (typeof value === 'string') return value.trim(); // Fallback for unparsed strings
    return null;
}

/**
 * Robustly parses a date string from various formats into a Date object.
 * Handles ISO, Italian (DD/MM/YYYY), and common variations.
 * @param dateStr The date string to parse.
 * @returns A valid Date object, or the Unix epoch (1970-01-01) if parsing fails.
 */
export const robustParseDate = (dateStr: string | null | undefined): Date => {
    if (!dateStr) return new Date(0);

    // Try parsing Italian format: DD/MM/YYYY, optional HH:mm:ss
    const italianMatch = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:,?\s*(\d{2}:\d{2}:\d{2}))?/);
    if (italianMatch) {
        const [, day, month, year, time] = italianMatch;
        const timePart = time || '00:00:00';
        // Construct an ISO-like string that new Date() can parse reliably
        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${timePart}`;
        const d = new Date(isoString);
        if (!isNaN(d.getTime())) return d;
    }
    
    // Fallback to standard ISO/other formats handled by new Date()
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? new Date(0) : date;
};
