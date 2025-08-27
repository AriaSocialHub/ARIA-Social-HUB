import { UsefulContent, CategorizedUsefulContent } from '../types';
import { excelSerialToDate } from './utils';

declare const XLSX: any; // The XLSX library is loaded from a CDN.

// Aliases are defined to be robust, handling both specific Vademecum headers
// and other common variants to prevent parsing failures.
const headerAliases: Record<keyof Omit<UsefulContent, 'id'>, string[]> = {
  casistica: ['casistica', '📌⚠️CASISTICA', 'argomento', 'oggetto', 'titolo', 'documento'],
  comeAgire: ['occasione_come_agire_esempi', 'occasione/come agire/esempi', 'come agire', 'contenuto', 'descrizione', 'dettagli'],
  dataInserimento: ['data_condivisione', 'data inserimento', 'data'],
};

const headerMap: Record<string, keyof UsefulContent> = {};
for (const key in headerAliases) {
    const typedKey = key as keyof UsefulContent;
    headerAliases[typedKey].forEach(alias => {
        headerMap[alias.toLowerCase()] = typedKey;
    });
}

export const parseVademecumXLSX = (file: File): Promise<CategorizedUsefulContent> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: false });
        
        const categorizedDocuments: CategorizedUsefulContent = {};
        let globalIdCounter = 0;

        let targetSheetName = "V.Gestione social";
        let worksheet = workbook.Sheets[targetSheetName];

        if (!worksheet) {
            const foundSheetName = workbook.SheetNames.find(name => name.toLowerCase().includes('gestione social'));
            if (foundSheetName) {
                 console.warn(`Sheet "${targetSheetName}" not found. Using "${foundSheetName}" instead.`);
                 worksheet = workbook.Sheets[foundSheetName];
                 targetSheetName = foundSheetName;
            } else {
                 return reject(new Error(`Sheet "V.Gestione social" non trovata nel file.`));
            }
        }

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });
        if (rows.length === 0) {
            return resolve({});
        }

        let headerRowIndex = -1;
        let columnIndexMap: Partial<Record<keyof UsefulContent, number>> = {};
        
        const maxHeaderSearchRows = Math.min(10, rows.length);
        for (let i = 0; i < maxHeaderSearchRows; i++) {
            const potentialHeaderRow = rows[i];
            const tempColumnIndexMap: Partial<Record<keyof UsefulContent, number>> = {};
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
            // Using reject here to provide clear feedback to the user on failure.
            return reject(new Error(`Nessuna intestazione principale (es. "CASISTICA", "OCCASIONE_COME_AGIRE_ESEMPI") trovata nel foglio "${targetSheetName}".`));
        }

        const dataRows = rows.slice(headerRowIndex + 1);

        const sheetDocuments: UsefulContent[] = dataRows.map((row: any[]) => {
          const casisticaRaw = columnIndexMap.casistica !== undefined ? row[columnIndexMap.casistica] : null;
          
          if (!casisticaRaw || String(casisticaRaw).trim() === '') {
            return null;
          }

          const doc: Partial<UsefulContent> = {
              id: `vademecum-${globalIdCounter++}`,
              casistica: String(casisticaRaw).trim(),
          };

          const comeAgireRaw = columnIndexMap.comeAgire !== undefined ? row[columnIndexMap.comeAgire] : null;
          doc.comeAgire = comeAgireRaw ? String(comeAgireRaw).trim() : null;

          const dataInserimentoRaw = columnIndexMap.dataInserimento !== undefined ? row[columnIndexMap.dataInserimento] : null;
          if (typeof dataInserimentoRaw === 'number' && dataInserimentoRaw > 1) {
              const d = excelSerialToDate(dataInserimentoRaw);
              if (dataInserimentoRaw % 1 !== 0) { // Check for time
                doc.dataInserimento = d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              } else {
                doc.dataInserimento = d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
              }
          } else if (dataInserimentoRaw) {
              let dateString = String(dataInserimentoRaw).trim();
              
              // Check for Italian format DD/MM/YYYY and convert to YYYY-MM-DD for reliable parsing
              const italianDateMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
              if (italianDateMatch) {
                  const [, day, month, year, timePart] = italianDateMatch;
                  dateString = `${year}-${month}-${day}${timePart.trim().replace(' ', 'T')}`;
              }

              const date = new Date(dateString.replace(' ', 'T'));

              if (!isNaN(date.getTime())) {
                if (String(dataInserimentoRaw).includes(':')) {
                    doc.dataInserimento = date.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                } else {
                    doc.dataInserimento = date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
                }
              } else {
                doc.dataInserimento = String(dataInserimentoRaw).trim();
              }
          } else {
              doc.dataInserimento = null;
          }
          
          return doc as UsefulContent;
        }).filter((p): p is UsefulContent => p !== null);
        
        if (sheetDocuments.length > 0) {
          categorizedDocuments[targetSheetName] = sheetDocuments;
        }
        
        resolve(categorizedDocuments);

      } catch (error) {
        console.error("Fatal error parsing Vademecum XLSX:", error);
        reject(new Error("Si è verificato un errore imprevisto durante la lettura del file del Vademecum."));
      }
    };
    reader.onerror = (error) => {
        reject(error);
    }
    reader.readAsArrayBuffer(file);
  });
};