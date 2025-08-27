import { UsefulContent, CategorizedUsefulContent } from '../types';
import { excelSerialToDate } from './utils';

declare const XLSX: any; // The XLSX library is loaded from a CDN.

const headerAliases: Record<keyof Omit<UsefulContent, 'id'>, string[]> = {
  casistica: ['casistica'],
  comeAgire: ['come agire'],
  // We'll handle NOTE/ESEMPI separately
  dataInserimento: ['data inserimento procedura'],
};

const noteHeaderAlias = 'note/esempi';

const headerMap: Record<string, keyof Omit<UsefulContent, 'id'>> = {};
for (const key in headerAliases) {
    const typedKey = key as keyof Omit<UsefulContent, 'id'>;
    headerAliases[typedKey].forEach(alias => {
        headerMap[alias.toLowerCase()] = typedKey;
    });
}

export const parseSanitaXLSX = (file: File): Promise<CategorizedUsefulContent> => {
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
        let globalIdCounter = 0;

        const sheetName = "Tematiche di competenza sanità";
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
            return reject(new Error(`Sheet "${sheetName}" non trovata nel file.`));
        }

        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null, blankrows: false });

        if (rows.length < 4) { // Header on row 3, data starts on row 4
            console.warn(`Sheet "${sheetName}" has less than 4 rows and will be skipped.`);
            return resolve({});
        }

        const headerRow = rows[2]; // Header is on the 3rd row (index 2)
        const columnIndexMap: Partial<Record<keyof UsefulContent | 'note', number>> = {};
        
        headerRow.forEach((cell: any, index: number) => {
            const normalizedHeader = String(cell || '').trim().toLowerCase();
            const key = headerMap[normalizedHeader];
            if (key) {
                columnIndexMap[key] = index;
            } else if (normalizedHeader === noteHeaderAlias) {
                columnIndexMap['note' as any] = index;
            }
        });
        
        if (!columnIndexMap.casistica && !columnIndexMap.comeAgire) {
            return reject(new Error(`Nessuna intestazione principale (es. "CASISTICA", "COME AGIRE") trovata nel foglio "${sheetName}".`));
        }

        const dataRows = rows.slice(3); // Data starts from the 4th row (index 3)

        const sheetContent: UsefulContent[] = dataRows.map((row: any[]) => {
          const casisticaRaw = columnIndexMap.casistica !== undefined ? row[columnIndexMap.casistica] : null;
          
          if (!casisticaRaw || String(casisticaRaw).trim() === '') {
            return null;
          }

          const content: Partial<UsefulContent> = {
              id: `sanita-${globalIdCounter++}`,
              casistica: String(casisticaRaw).trim(),
          };

          const comeAgireRaw = columnIndexMap.comeAgire !== undefined ? row[columnIndexMap.comeAgire] : null;
          let comeAgireText = comeAgireRaw ? String(comeAgireRaw).trim() : '';

          const noteRaw = (columnIndexMap as any).note !== undefined ? row[(columnIndexMap as any).note] : null;
          if (noteRaw && String(noteRaw).trim()) {
              comeAgireText += `\n\n--- NOTE/ESEMPI ---\n${String(noteRaw).trim()}`;
          }

          content.comeAgire = comeAgireText || null;

          const dataInserimentoRaw = columnIndexMap.dataInserimento !== undefined ? row[columnIndexMap.dataInserimento] : null;
          if (typeof dataInserimentoRaw === 'number' && dataInserimentoRaw > 1) {
              const d = excelSerialToDate(dataInserimentoRaw);
              content.dataInserimento = d.toLocaleString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(',', '');
          } else if (dataInserimentoRaw) {
              // Handle 'DD/MM/YYYY'
              let dateString = String(dataInserimentoRaw).trim();
              const italianDateMatch = dateString.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
              if (italianDateMatch) {
                  const [, day, month, year] = italianDateMatch;
                  dateString = `${year}-${month}-${day}`;
              }
              const date = new Date(dateString);
              if (!isNaN(date.getTime())) {
                  content.dataInserimento = date.toLocaleDateString('it-IT');
              } else {
                  content.dataInserimento = String(dataInserimentoRaw).trim();
              }
          } else {
              content.dataInserimento = null;
          }
          
          return content as UsefulContent;
        }).filter((p): p is UsefulContent => p !== null);
        
        if (sheetContent.length > 0) {
          categorizedContent[sheetName] = sheetContent;
        }
        
        resolve(categorizedContent);

      } catch (error) {
        console.error("Fatal error parsing Sanita XLSX:", error);
        reject(new Error("Si è verificato un errore imprevisto durante la lettura del file."));
      }
    };
    reader.onerror = (error) => {
        reject(error);
    }
    reader.readAsArrayBuffer(file);
  });
};
