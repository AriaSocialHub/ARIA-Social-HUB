import { Ticket, CategorizedTickets } from '../types';
import { formatDateValue } from './utils';

declare const XLSX: any; // The XLSX library is loaded from a CDN.

// Defines flexible aliases for column headers. All aliases are checked case-insensitively.
const headerAliases: Record<keyof Omit<Ticket, 'id'>, string[]> = {
  utente: ['utente'],
  nTicket: ['n° ticket', 'n ticket', 'ticket', 'n°ticket'],
  argomento: ['argomento', 'oggetto'],
  richiesta: ['richiesta'],
  risoluzione: ['risoluzione'],
  data: ['data'],
  canale: ['canale'],
  operatore: ['operatore'],
};

// Creates a reverse map for quick, case-insensitive lookup (e.g., "n° ticket" -> "nTicket").
const headerMap: Record<string, keyof Ticket> = {};
for (const key in headerAliases) {
    headerAliases[key as keyof Ticket].forEach(alias => {
        headerMap[alias.toLowerCase()] = key as keyof Ticket;
    });
}

export const parseXLSX = (file: File): Promise<CategorizedTickets> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        
        const categorizedTickets: CategorizedTickets = {};
        let globalRowIndex = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, blankrows: false });

            if (rawJson.length === 0) return;

            const headers = Object.keys(rawJson[0]);
            const ticketKeyToRawHeader: Partial<Record<keyof Ticket, string>> = {};
            headers.forEach(header => {
                const ticketKey = headerMap[header.trim().toLowerCase()];
                if (ticketKey && !ticketKeyToRawHeader[ticketKey]) {
                    ticketKeyToRawHeader[ticketKey] = header;
                }
            });
            
            if (!ticketKeyToRawHeader.argomento && !ticketKeyToRawHeader.richiesta) {
                console.warn(`Sheet "${sheetName}" was skipped because no primary headers ('Argomento', 'Richiesta') were found.`);
                return;
            }

            const sheetTickets: Ticket[] = rawJson.map((row: any) => {
              const ticket: Partial<Ticket> = {};

              const getStringOrNull = (key: keyof Ticket): string | null => {
                  const rawHeader = ticketKeyToRawHeader[key];
                  if (rawHeader) {
                      const value = row[rawHeader];
                      if (value !== null && value !== undefined && String(value).trim() !== '') {
                          return String(value).trim();
                      }
                  }
                  return null;
              };

              ticket.utente = getStringOrNull('utente');
              ticket.nTicket = getStringOrNull('nTicket');
              ticket.argomento = getStringOrNull('argomento') || 'Senza Argomento'; // Default for grouping purposes
              ticket.richiesta = getStringOrNull('richiesta');
              ticket.risoluzione = getStringOrNull('risoluzione');
              ticket.canale = getStringOrNull('canale');
              ticket.operatore = getStringOrNull('operatore');
              
              const dateRawHeader = ticketKeyToRawHeader['data'];
              ticket.data = formatDateValue(dateRawHeader ? row[dateRawHeader] : null);

              // Use N° Ticket as ID if available and not null/0, otherwise generate one.
              ticket.id = (ticket.nTicket && ticket.nTicket !== '0' && ticket.nTicket !== null) ? String(ticket.nTicket) : `gen-id-${sheetName}-${globalRowIndex++}`;
              
              return ticket as Ticket;
            }).filter(ticket => ticket.richiesta || ticket.risoluzione); // A ticket should have at least a request or a resolution.
            
            if (sheetTickets.length > 0) {
              categorizedTickets[sheetName] = sheetTickets;
            }
        });
        
        resolve(categorizedTickets);

      } catch (error) {
        console.error("Error parsing Ticket XLSX:", error);
        reject(new Error("Si è verificato un errore durante l'analisi del file. Assicurati che il formato sia corretto."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};