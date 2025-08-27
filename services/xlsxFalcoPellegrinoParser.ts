import { UsefulContent, CategorizedUsefulContent } from '../types';
import { robustParseDate } from './utils';

declare const XLSX: any;

// Helper to extract date string from text
const extractDateString = (text: string | null): string | null => {
    if (!text) return null;
    const date = robustParseDate(text);
    // Return null if date is epoch, which means parsing failed or date is actually 1970-01-01
    if (date.getTime() === 0) return null;
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};


export const parseFalcoPellegrinoXLSX = (file: File): Promise<CategorizedUsefulContent> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        
        const categorizedContent: CategorizedUsefulContent = {};
        let idCounter = 0;
        
        const processSheet = (sheetName: string, parser: (rows: any[][]) => UsefulContent[]) => {
            const worksheet = workbook.Sheets[sheetName];
            if (worksheet) {
                const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });
                if (rows.length === 0) return;
                const content = parser(rows);
                if (content.length > 0) {
                    categorizedContent[sheetName.trim()] = content;
                }
            } else {
                 console.warn(`Sheet "${sheetName}" not found in the provided file.`);
            }
        };
        
        const sheetNameToParserMap: Record<string, (rows: any[][]) => UsefulContent[]> = {
            "Info generali": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('domande frequenti');
                const dataRows = isHeader ? rows.slice(1) : rows;

                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    
                    let comeAgire = row[1] ? String(row[1]).trim() : null;
                    const riferimento = row[2] ? String(row[2]).trim() : null;
                    if (riferimento && riferimento.toLowerCase() !== 'nan' && riferimento.toLowerCase() !== 'null') {
                        comeAgire = `${comeAgire || ''}\n\n--- Riferimenti ---\n${riferimento}`.trim();
                    }
                    
                    return { id: `falco-gen-${idCounter++}`, casistica, comeAgire, dataInserimento: null };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Info anno 2022": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('faq falchi');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-2022-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: extractDateString(risposta) };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Info anno 2023": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('faq falchi');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-2023-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: extractDateString(risposta) };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Info anno 2024": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('faq falchi');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-2024-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: extractDateString(risposta) };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Info anno 2025": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('faq falchi');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-2025-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: extractDateString(risposta) };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Curiosità sui falchi": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('domande');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-curiosity-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: null };
                }).filter((item): item is UsefulContent => !!item);
            },
            "ESEMPI DI RISPOSTE": (rows) => {
                 if (rows.length > 0 && rows[0][0]) {
                     return [{ id: 'falco-esempi-0', casistica: "Esempi di Risposte Standard", comeAgire: String(rows[0][0]).trim(), dataInserimento: null }];
                 }
                 return [];
            },
            "News sui falchi": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('news falchi');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const descrizione = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-news-${idCounter++}`, casistica, comeAgire: descrizione, dataInserimento: extractDateString(casistica) };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Moderazione post Falchi": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('casistica');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const comeAgire = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-mod-${idCounter++}`, casistica, comeAgire, dataInserimento: null };
                }).filter((item): item is UsefulContent => !!item);
            },
            "Ticket utili": (rows) => {
                const header = rows[0] || [];
                const isHeader = String(header[0] || '').toLowerCase().includes('domande/richieste');
                const dataRows = isHeader ? rows.slice(1) : rows;
                return dataRows.map(row => {
                    const casistica = row[0] ? String(row[0]).trim() : null;
                    if (!casistica) return null;
                    const risposta = row[1] ? String(row[1]).trim() : null;
                    return { id: `falco-ticket-${idCounter++}`, casistica, comeAgire: risposta, dataInserimento: null };
                }).filter((item): item is UsefulContent => !!item);
            }
        };

        // Iterate through expected sheet names to ensure order and correctness
        for (const sheetName in sheetNameToParserMap) {
            processSheet(sheetName, sheetNameToParserMap[sheetName]);
        }

        if (Object.keys(categorizedContent).length === 0) {
            reject(new Error("Il file non contiene fogli di lavoro riconoscibili o dati validi per la sezione Falco Pellegrino. Controllare i nomi dei fogli."));
            return;
        }

        resolve(categorizedContent);

      } catch (error) {
        console.error("Fatal error parsing Falco Pellegrino XLSX:", error);
        reject(new Error("Si è verificato un errore imprevisto durante la lettura del file. Assicurati che il formato sia corretto."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
