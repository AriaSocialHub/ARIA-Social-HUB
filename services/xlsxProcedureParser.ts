import { Procedura, CategorizedProcedure } from '../types';
import { excelSerialToDate } from './utils';

declare const XLSX: any; // The XLSX library is loaded from a CDN.

const headerAliases: Record<keyof Omit<Procedura, 'id'>, string[]> = {
  casistica: ['casistica', 'argomento', 'richiesta', 'problematica'],
  comeAgire: ['come agire', 'risoluzione', 'procedura'],
  dataInserimento: ['data inserimento procedura', 'data', 'data inserimento'],
};

const headerMap: Record<string, keyof Procedura> = {};
let primaryKeyAliases: string[] = [];
for (const key in headerAliases) {
    const typedKey = key as keyof Procedura;
    if (typedKey === 'casistica') {
        primaryKeyAliases = headerAliases[typedKey].map(a => a.toLowerCase());
    }
    headerAliases[typedKey].forEach(alias => {
        headerMap[alias.toLowerCase()] = typedKey;
    });
}

export const parseProcedureXLSX = (file: File): Promise<CategorizedProcedure> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        
        const categorizedProcedures: CategorizedProcedure = {};
        let globalIdCounter = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });

            if (rows.length === 0) return;

            let headerRowIndex = -1;
            let columnIndexMap: Partial<Record<keyof Procedura, number>> = {};
            
            const maxHeaderSearchRows = Math.min(10, rows.length);
            for (let i = 0; i < maxHeaderSearchRows; i++) {
                const potentialHeaderRow = rows[i];
                const tempColumnIndexMap: Partial<Record<keyof Procedura, number>> = {};
                let foundPrimaryKey = false;

                potentialHeaderRow.forEach((cell: any, index: number) => {
                    const normalizedHeader = String(cell || '').trim().toLowerCase();
                    const key = headerMap[normalizedHeader];
                    if (key) {
                        tempColumnIndexMap[key] = index;
                        // A header row is considered valid if it contains either the main topic ('casistica')
                        // or the main action ('comeAgire'), as both are critical for this content type.
                        if (key === 'casistica' || key === 'comeAgire') {
                            foundPrimaryKey = true;
                        }
                    }
                });
                
                if (foundPrimaryKey) {
                    headerRowIndex = i;
                    columnIndexMap = tempColumnIndexMap;
                    break;
                }
            }

            if (headerRowIndex === -1) {
                console.warn(`Sheet "${sheetName}" was skipped because a primary header (e.g., 'casistica', 'come agire') was not found in the first ${maxHeaderSearchRows} rows.`);
                return;
            }

            const dataRows = rows.slice(headerRowIndex + 1);

            const sheetProcedures: Procedura[] = dataRows.map((row: any[]) => {
              const casisticaRaw = columnIndexMap.casistica !== undefined ? row[columnIndexMap.casistica] : null;
              
              if (!casisticaRaw || String(casisticaRaw).trim() === '') {
                return null;
              }

              const procedura: Partial<Procedura> = {
                  id: `proc-${globalIdCounter++}`,
                  casistica: String(casisticaRaw).trim(),
              };

              const comeAgireRaw = columnIndexMap.comeAgire !== undefined ? row[columnIndexMap.comeAgire] : null;
              procedura.comeAgire = comeAgireRaw ? String(comeAgireRaw).trim() : null;

              const dataInserimentoRaw = columnIndexMap.dataInserimento !== undefined ? row[columnIndexMap.dataInserimento] : null;
              if (typeof dataInserimentoRaw === 'number' && dataInserimentoRaw > 1) {
                  procedura.dataInserimento = excelSerialToDate(dataInserimentoRaw).toLocaleDateString('it-IT');
              } else if (dataInserimentoRaw) {
                  procedura.dataInserimento = String(dataInserimentoRaw).trim();
              } else {
                  procedura.dataInserimento = null;
              }
              
              return procedura as Procedura;
            }).filter((p): p is Procedura => p !== null);
            
            if (sheetProcedures.length > 0) {
              categorizedProcedures[sheetName] = sheetProcedures;
            }
        });
        
        resolve(categorizedProcedures);

      } catch (error) {
        console.error("Fatal error parsing XLSX for Procedures:", error);
        reject(new Error("Si è verificato un errore imprevisto durante la lettura del file."));
      }
    };
    reader.onerror = (error) => {
        reject(error);
    }
    reader.readAsArrayBuffer(file);
  });
};