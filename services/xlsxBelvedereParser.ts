import { UsefulContent, Ticket } from '../types';
import { formatDateValue } from './utils';

declare const XLSX: any;

type BelvedereParsedData = Record<string, (UsefulContent[] | Ticket[])>;

export const parseBelvedereXLSX = (file: File): Promise<BelvedereParsedData> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("Failed to read file."));
                }
                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: false });
                
                const parsedData: BelvedereParsedData = {};
                let idCounter = 0;

                // --- 1. Parse "Gestione chat" ---
                const chatSheetName = "Gestione chat";
                const chatSheet = workbook.Sheets[chatSheetName];
                if (chatSheet) {
                    const chatRows: any[][] = XLSX.utils.sheet_to_json(chatSheet, { header: 1, defval: null });
                    const chatContent: UsefulContent[] = [];
                    chatRows.forEach(row => {
                        const casistica = row[0] ? String(row[0]).trim() : null;
                        const comeAgire = row[1] ? String(row[1]).trim() : null;
                        if (casistica) {
                            chatContent.push({
                                id: `belvedere-chat-${idCounter++}`,
                                casistica,
                                comeAgire,
                                dataInserimento: null,
                            });
                        }
                    });
                    if (chatContent.length > 0) {
                        parsedData[chatSheetName] = chatContent;
                    }
                }

                // --- 2. Parse "Gestione Social" ---
                const socialSheetName = "Gestione Social";
                const socialSheet = workbook.Sheets[socialSheetName];
                if (socialSheet) {
                    const socialRows: any[][] = XLSX.utils.sheet_to_json(socialSheet, { header: 1, defval: null });
                    const socialContent: UsefulContent[] = [];
                    // Skip header row if it exists
                    const startRow = socialRows.length > 0 && String(socialRows[0][0]).toLowerCase().includes('gestione sui social') ? 1 : 0;
                    for (let i = startRow; i < socialRows.length; i++) {
                        const row = socialRows[i];
                        const casistica = row[0] ? String(row[0]).trim() : null;
                        if (casistica) {
                            const desc = row[1] ? String(row[1]).trim() : '';
                            const examples = row[2] ? String(row[2]).trim() : '';
                            let comeAgire = desc;
                            if (examples) {
                                comeAgire += `\n\n--- Esempi ---\n${examples}`;
                            }
                            socialContent.push({
                                id: `belvedere-social-${idCounter++}`,
                                casistica,
                                comeAgire: comeAgire.trim() || null,
                                dataInserimento: null,
                            });
                        }
                    }
                    if (socialContent.length > 0) {
                        parsedData[socialSheetName] = socialContent;
                    }
                }

                // --- 3. Parse "Stile comunicativo" ---
                const stileSheetName = "Stile comunicativo";
                const stileSheet = workbook.Sheets[stileSheetName];
                if (stileSheet) {
                    const stileRows: any[][] = XLSX.utils.sheet_to_json(stileSheet, { header: 1, defval: null });
                    const stileContent: UsefulContent[] = [];
                    const startRow = stileRows.length > 0 && String(stileRows[0][0]).toLowerCase().includes('stile comunicativo') ? 1 : 0;
                    for (let i = startRow; i < stileRows.length; i++) {
                        const row = stileRows[i];
                        const casistica = row[0] ? String(row[0]).trim() : null;
                        if (casistica) {
                            const details = row[1] ? String(row[1]).trim() : '';
                            const examples = row[2] ? String(row[2]).trim() : '';
                            let comeAgire = details;
                            if (examples) {
                                comeAgire += `\n\n--- Da evitare ---\n${examples}`;
                            }
                             stileContent.push({
                                id: `belvedere-stile-${idCounter++}`,
                                casistica,
                                comeAgire: comeAgire.trim() || null,
                                dataInserimento: null,
                            });
                        }
                    }
                     if (stileContent.length > 0) {
                        parsedData[stileSheetName] = stileContent;
                    }
                }

                // --- 4. Parse "TICKET UTILI" ---
                const ticketSheetName = "TICKET UTILI";
                const ticketSheet = workbook.Sheets[ticketSheetName];
                if(ticketSheet) {
                    const ticketJson: any[] = XLSX.utils.sheet_to_json(ticketSheet, { defval: null });
                    const tickets: Ticket[] = ticketJson.map((row) => {
                        const headers = Object.keys(row);
                        const findHeader = (aliases: string[]) => {
                            const lowerAliases = aliases.map(a => a.toLowerCase());
                            return headers.find(h => lowerAliases.includes(h.toLowerCase()));
                        }
                        
                        const utenteHeader = findHeader(['Utente']);
                        const nTicketHeader = findHeader(['N° Ticket', 'N°Ticket']);
                        const argomentoHeader = findHeader(['Argomento']);
                        const richiestaHeader = findHeader(['Richiesta']);
                        const risoluzioneHeader = findHeader(['Risoluzione']);
                        const dataHeader = findHeader(['Data']);
                        const canaleHeader = findHeader(['Canale']);
                        
                        const nTicketValue = nTicketHeader ? row[nTicketHeader] : `belvedere-gen-${idCounter++}`;
                        
                        return {
                            id: String(nTicketValue),
                            utente: utenteHeader && row[utenteHeader] ? String(row[utenteHeader]) : null,
                            nTicket: nTicketHeader && row[nTicketHeader] ? String(row[nTicketHeader]) : null,
                            argomento: argomentoHeader && row[argomentoHeader] ? String(row[argomentoHeader]) : 'Non specificato',
                            richiesta: richiestaHeader && row[richiestaHeader] ? String(row[richiestaHeader]) : 'Richiesta non fornita',
                            risoluzione: risoluzioneHeader && row[risoluzioneHeader] ? String(row[risoluzioneHeader]) : 'In attesa di risoluzione',
                            data: dataHeader ? formatDateValue(row[dataHeader]) : null,
                            canale: canaleHeader && row[canaleHeader] ? String(row[canaleHeader]) : 'Non specificato',
                            operatore: null 
                        };
                    }).filter(t => t.nTicket || (t.richiesta && t.richiesta !== 'Richiesta non fornita'));

                    if (tickets.length > 0) {
                        parsedData[ticketSheetName] = tickets;
                    }
                }

                if (Object.keys(parsedData).length === 0) {
                    return reject(new Error("Il file non contiene fogli validi o dati riconoscibili per la sezione Belvedere."));
                }

                resolve(parsedData);
            } catch (error) {
                console.error("Error parsing Belvedere XLSX:", error);
                reject(new Error("Si è verificato un errore durante l'analisi del file Belvedere."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
