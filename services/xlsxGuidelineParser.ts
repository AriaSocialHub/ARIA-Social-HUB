import { Guideline, CategorizedGuidelines } from '../types';
import { excelSerialToDate } from './utils';

declare const XLSX: any; 

const parseDateValue = (value: any): string | null => {
    if (!value) return null;
    let date: Date | null = null;

    if (typeof value === 'number' && value > 1) {
        date = excelSerialToDate(value);
    } else if (typeof value === 'string') {
        // Handle YYYY-MM-DD HH:MM:SS by replacing space with 'T'
        const d = new Date(String(value).trim().replace(' ', 'T'));
        if (!isNaN(d.getTime())) {
            date = d;
        }
    } else if (value instanceof Date && !isNaN(value.getTime())) {
        date = value;
    }

    if (date) {
        // Check if the date has a time component
        if (date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0) {
             return date.toLocaleString('it-IT', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit'
            }).replace(',', '');
        }
        return date.toLocaleDateString('it-IT', {
             year: 'numeric', month: '2-digit', day: '2-digit'
        });
    }

    return String(value).trim(); // Fallback
};

// Generic row parser for simple sheets
const parseSimpleSheet = (rows: any[][], idPrefix: string): Guideline[] => {
    let idCounter = 0;
    const content: Guideline[] = [];
    rows.forEach(row => {
        const casistica = row[0] ? String(row[0]).trim() : null;
        if (!casistica) return;

        let comeAgireParts: string[] = [];
        if (row[1]) comeAgireParts.push(String(row[1]).trim());

        // Check for extra columns to append based on prefix
        if(row[2]) {
             if (idPrefix.includes('pubblico')) {
                comeAgireParts.push(`--- ECCEZIONI ---\n${String(row[2]).trim()}`);
            } else if (idPrefix.includes('chat')) {
                comeAgireParts.push(`--- SCRIPT IN INGLESE (EVENTUALE) ---\n${String(row[2]).trim()}`);
            }
        }
        
        const dateColIndex = (idPrefix.includes('pubblico') || idPrefix.includes('chat')) ? 3 : 2;
        const dataInserimento = parseDateValue(row[dateColIndex]);

        content.push({
            id: `${idPrefix}-${idCounter++}`,
            casistica,
            comeAgire: comeAgireParts.join('\n\n').trim() || null,
            dataInserimento,
        });
    });
    return content;
};

const parseResSheet = (rows: any[][]): Guideline[] => {
    let idCounter = 0;
    const content: Guideline[] = [];
    let currentCategory = '';

    rows.forEach(row => {
        const categoryCell = row[0] ? String(row[0]).trim().toUpperCase() : '';
        const casisticaCell = row[1] ? String(row[1]).trim() : null;
        const esempiCell = row[2] ? String(row[2]).trim() : null;
        
        if (['ELOGI', 'RECLAMI', 'SEGNALAZIONI'].includes(categoryCell)) {
            currentCategory = categoryCell.charAt(0) + categoryCell.slice(1).toLowerCase();
        }

        if (casisticaCell) {
            content.push({
                id: `res-${idCounter++}`,
                casistica: `${currentCategory}: ${casisticaCell}`,
                comeAgire: esempiCell ? `--- ESEMPI ---\n${esempiCell}` : null,
                dataInserimento: parseDateValue(row[3]),
            });
        }
    });
    return content;
};

const parseEmoticonSheet = (rows: any[][]): Guideline[] => {
    let idCounter = 0;
    const content: Guideline[] = [];
    rows.forEach(row => {
        const casistica = row[0] ? String(row[0]).trim() : null;
        if (casistica && !casistica.toLowerCase().includes('emoticon')) {
             content.push({
                id: `emoticon-${idCounter++}`,
                casistica,
                comeAgire: null,
                dataInserimento: null
            });
        }
    });
    return content;
};


export const parseGuidelineXLSX = (file: File): Promise<CategorizedGuidelines> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event: ProgressEvent<FileReader>) => {
            try {
                if (!event.target?.result) {
                    return reject(new Error("Failed to read file."));
                }
                const data = new Uint8Array(event.target.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: false });

                const categorizedGuidelines: CategorizedGuidelines = {};
                
                const sheetParsers: Record<string, { parser: (rows: any[][]) => Guideline[], skipRows: number }> = {
                    'generali': { parser: (rows) => parseSimpleSheet(rows, 'generali'), skipRows: 1 },
                    'pubblico': { parser: (rows) => parseSimpleSheet(rows, 'pubblico'), skipRows: 1 },
                    'privato': { parser: (rows) => parseSimpleSheet(rows, 'privato'), skipRows: 1 },
                    'chat': { parser: (rows) => parseSimpleSheet(rows, 'chat'), skipRows: 1 },
                    'r.e.s.': { parser: (rows) => parseResSheet(rows), skipRows: 1 },
                    'emoticon': { parser: (rows) => parseEmoticonSheet(rows), skipRows: 0 },
                    'tkt inoltrati': { parser: (rows) => parseSimpleSheet(rows, 'tkt'), skipRows: 0 },
                    'linee guida ig - gl': { parser: (rows) => {
                         let idCounter = 0;
                         return rows.map(row => {
                             const casistica = row[0] ? String(row[0]).trim() : null;
                             if (!casistica) return null;
                             return {
                                 id: `ig-gl-${idCounter++}`,
                                 casistica,
                                 comeAgire: row[1] ? String(row[1]).trim() : null,
                                 dataInserimento: null
                             };
                         }).filter(Boolean) as Guideline[];
                    }, skipRows: 1}
                };

                workbook.SheetNames.forEach(sheetName => {
                    const normalizedSheetName = sheetName.trim().toLowerCase();
                    const parserKey = Object.keys(sheetParsers).find(key => normalizedSheetName.includes(key));
                    
                    if (parserKey) {
                        const worksheet = workbook.Sheets[sheetName];
                        if (!worksheet) return;

                        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });
                        if (rows.length === 0) return;
                        
                        const config = sheetParsers[parserKey];
                        const dataRows = rows.slice(config.skipRows);

                        const guidelines = config.parser(dataRows);

                        if (guidelines.length > 0) {
                            categorizedGuidelines[sheetName.trim()] = guidelines;
                        }
                    }
                });

                if (Object.keys(categorizedGuidelines).length === 0) {
                    return reject(new Error("Il file non contiene fogli di lavoro riconoscibili o dati validi. Controlla che i nomi dei fogli (es. 'GENERALI', 'PUBBLICO') siano corretti."));
                }
                
                resolve(categorizedGuidelines);

            } catch (error) {
                console.error("Fatal error parsing Guideline XLSX:", error);
                reject(new Error("Si è verificato un errore imprevisto durante la lettura del file. Assicurati che il formato sia corretto."));
            }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
};
