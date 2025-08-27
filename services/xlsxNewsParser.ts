import { NewsArticle } from '../types';
import { excelSerialToDate } from './utils';

declare const XLSX: any;

// Aliases for the specific format requested by the user, plus some common alternatives for robustness.
const headerAliases: Record<keyof Omit<NewsArticle, 'id'>, string[]> = {
  title: ['vademecum comunicazioni di servizio', 'titolo', 'oggetto'],
  content: ['message_content', 'contenuto', 'testo'],
  createdAt: ['message_date', 'data', 'data condivisione messaggio telegram'],
  imageUrl: ['imageurl', 'immagine'],
  isFeatured: ['isfeatured', 'in evidenza'],
  author: ['author', 'autore'],
  isVisibleOnDashboard: ['isvisibleondashboard', 'visibile in dashboard'],
};

// Create a reverse map for easy, case-insensitive lookup
const headerMap: Record<string, keyof NewsArticle> = {};
for (const key in headerAliases) {
    headerAliases[key as keyof NewsArticle].forEach(alias => {
        headerMap[alias.toLowerCase().trim()] = key as keyof NewsArticle;
    });
}

// Helper to safely parse dates from various formats (Excel serial, ISO, YYYY-MM-DD HH:MM:SS, DD/MM/YYYY)
const parseDateSafe = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date && !isNaN(dateValue.getTime())) return dateValue;
    if (typeof dateValue === 'number') {
        return excelSerialToDate(dateValue);
    }

    let dateString = String(dateValue).trim();

    // Try parsing Italian format DD/MM/YYYY HH:mm or DD-MM-YYYY HH:mm
    const italianDateMatch = dateString.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})[\sT]*([\d:]*)/);
    if (italianDateMatch) {
        let [, day, month, year, timePart] = italianDateMatch;
        // Handle YY vs YYYY, assuming 2-digit years are in the 21st century
        if (year.length === 2) {
            year = String(parseInt(year, 10) + 2000);
        }
        
        // Reconstruct to YYYY-MM-DDTHH:mm:ss format for reliable parsing
        const isoLikeString = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${timePart || '00:00:00'}`;
        const date = new Date(isoLikeString);
        if (!isNaN(date.getTime())) {
            return date;
        }
    }

    // Fallback to default Date parsing which is good with ISO formats like YYYY-MM-DD HH:MM:SS
    const date = new Date(dateString.replace(' ', 'T'));
    if (!isNaN(date.getTime())) {
        return date;
    }

    return null;
}


export const parseNewsXLSX = (file: File): Promise<Record<string, NewsArticle[]>> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
            return reject(new Error("Failed to read file."));
        }
        const data = new Uint8Array(event.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const categorizedNews: Record<string, NewsArticle[]> = {};
        let globalIdCounter = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            if (!worksheet) return;

            const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: null, blankrows: false });
            if (rawJson.length === 0) return;

            const headers = Object.keys(rawJson[0]);
            const newsKeyToRawHeader: Partial<Record<keyof NewsArticle, string>> = {};
            headers.forEach(header => {
                const newsKey = headerMap[header.trim().toLowerCase()];
                if (newsKey && !newsKeyToRawHeader[newsKey]) {
                    newsKeyToRawHeader[newsKey] = header;
                }
            });

            // A row is valid if it has at least a title or content.
            if (!newsKeyToRawHeader.title && !newsKeyToRawHeader.content) {
                console.warn(`Sheet "${sheetName}" skipped: could not find required columns like 'VADEMECUM COMUNICAZIONI DI SERVIZIO' or 'message_content'.`);
                return;
            }

            const sheetArticles: NewsArticle[] = rawJson.map((row: any) => {
              const titleRaw = row[newsKeyToRawHeader.title!] || '';
              const contentRaw = row[newsKeyToRawHeader.content!] || '';
              
              // Skip if both title and content are effectively empty
              if (String(titleRaw).trim() === '' && String(contentRaw).trim() === '') {
                  return null;
              }

              const date = parseDateSafe(row[newsKeyToRawHeader.createdAt!]);

              const article: NewsArticle = {
                id: `news-import-${sheetName}-${globalIdCounter++}`,
                title: String(titleRaw).trim(),
                content: String(contentRaw).trim() || String(titleRaw).trim(),
                imageUrl: null, // This format does not contain images
                createdAt: date ? date.toISOString() : new Date().toISOString(),
                isFeatured: false, // Default to false for this import type
                author: 'Comunicazione Interna', // Default author for this import type
              };
              
              return article;
            }).filter((a): a is NewsArticle => a !== null);
            
            if (sheetArticles.length > 0) {
              categorizedNews[sheetName] = sheetArticles;
            }
        });
        
        if (Object.keys(categorizedNews).length === 0) {
            reject(new Error("Nessun articolo valido trovato nel file XLSX. Assicurati che le colonne 'VADEMECUM COMUNICAZIONI DI SERVIZIO' e 'message_content' siano presenti e compilate."));
            return;
        }

        resolve(categorizedNews);
      } catch (error) {
        console.error("Error parsing News (Vademecum Comunicazioni) XLSX:", error);
        reject(new Error("Errore durante l'analisi del file. Controlla il formato e la struttura delle colonne."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
