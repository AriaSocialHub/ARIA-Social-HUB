
import { ArchiveItem } from '../types';

let SQL: any;

const loadSqlJsLib = (): Promise<any> => {
    if (SQL) return Promise.resolve(SQL);

    return new Promise((resolve, reject) => {
        if ((window as any).initSqlJs) {
            (window as any).initSqlJs({
                locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            }).then((sql: any) => {
                SQL = sql;
                resolve(SQL);
            }).catch(reject);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
        script.async = true;
        script.onload = () => {
            if ((window as any).initSqlJs) {
                 (window as any).initSqlJs({
                    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
                }).then((sql: any) => {
                    SQL = sql;
                    resolve(SQL);
                }).catch(reject);
            } else {
                reject(new Error('SQL.js loaded but initSqlJs not found'));
            }
        };
        script.onerror = () => reject(new Error('Failed to load SQL.js script'));
        document.body.appendChild(script);
    });
};

// Helper function to clean strings
const normalizeString = (str: string): string => {
    if (!str) return '';
    try {
        // Decode URI components (e.g. %20 -> space, %2C -> comma)
        let decoded = decodeURIComponent(str);
        // Replace specific patterns and normalize separators
        decoded = decoded.replace(/[+\-_]/g, ' '); // Replace +, -, _ with space
        decoded = decoded.replace(/\s+/g, ' '); // Collapse multiple spaces
        decoded = decoded.trim();
        // Title Case (capitalize first letter of each word is too aggressive, just sentence case or keep as is but trimmed)
        // Let's just ensure first char is upper for consistency if it's text
        if (decoded.length > 0) {
            return decoded.charAt(0).toUpperCase() + decoded.slice(1);
        }
        return decoded;
    } catch (e) {
        return str;
    }
};

export const normalizeDatabase = (db: any) => {
    // Fetch all rows that need normalization
    const stmt = db.prepare("SELECT rowid, Utenti, \"Macro-area\", Argomento, Sottocategoria FROM archivio");
    const updates: any[] = [];
    
    while (stmt.step()) {
        const row = stmt.getAsObject();
        updates.push({
            id: row.rowid,
            utenti: normalizeString(row.Utenti as string),
            macro: normalizeString(row['Macro-area'] as string),
            argomento: normalizeString(row.Argomento as string),
            sotto: normalizeString(row.Sottocategoria as string)
        });
    }
    stmt.free();

    // Batch update
    db.exec("BEGIN TRANSACTION");
    const updateStmt = db.prepare("UPDATE archivio SET Utenti = ?, \"Macro-area\" = ?, Argomento = ?, Sottocategoria = ? WHERE rowid = ?");
    for (const u of updates) {
        updateStmt.run([u.utenti, u.macro, u.argomento, u.sotto, u.id]);
    }
    updateStmt.free();
    db.exec("COMMIT");
};

export const loadDatabase = async (signedUrl: string): Promise<any> => {
    const sql = await loadSqlJsLib();
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Failed to download database file');
    const buf = await response.arrayBuffer();
    const db = new sql.Database(new Uint8Array(buf));
    
    // Normalize data immediately after load
    normalizeDatabase(db);
    
    return db;
};

export const queryArchive = (db: any, params: {
    search?: string,
    searchScope?: 'title' | 'content' | 'both',
    years?: string[],
    page: number,
    pageSize: number,
    filters?: {
        utenti?: string,
        macro_area?: string,
        argomento?: string,
        sottocategoria?: string
    }
}): { results: ArchiveItem[], total: number } => {
    let baseQuery = "FROM archivio WHERE 1=1";
    const queryParams: any[] = [];

    // Filters
    if (params.filters) {
        if (params.filters.utenti && params.filters.utenti !== 'Tutti') {
            baseQuery += " AND Utenti = ?";
            queryParams.push(params.filters.utenti);
        }
        if (params.filters.macro_area && params.filters.macro_area !== 'Tutte') {
            baseQuery += " AND \"Macro-area\" = ?";
            queryParams.push(params.filters.macro_area);
        }
        if (params.filters.argomento && params.filters.argomento !== 'Tutti') {
            baseQuery += " AND Argomento = ?";
            queryParams.push(params.filters.argomento);
        }
        if (params.filters.sottocategoria && params.filters.sottocategoria !== 'Tutte') {
            baseQuery += " AND Sottocategoria = ?";
            queryParams.push(params.filters.sottocategoria);
        }
    }

    // Year Filter (checking string contains year)
    if (params.years && params.years.length > 0) {
        const yearConditions = params.years.map(() => "\"Data Ultimo Aggiornamento Informazioni\" LIKE ?").join(" OR ");
        baseQuery += ` AND (${yearConditions})`;
        params.years.forEach(y => queryParams.push(`%${y}%`));
    }

    // Search
    if (params.search && params.search.trim() !== '') {
        const term = params.search.trim();
        if (params.searchScope === 'title') {
            baseQuery += " AND Titolo LIKE '%' || ? || '%'";
            queryParams.push(term);
        } else if (params.searchScope === 'content') {
            baseQuery += " AND Testo LIKE '%' || ? || '%'";
            queryParams.push(term);
        } else {
            // Both
            baseQuery += " AND (Titolo LIKE '%' || ? || '%' OR Testo LIKE '%' || ? || '%')";
            queryParams.push(term, term);
        }
    }

    // Count Total
    const countStmt = db.prepare(`SELECT COUNT(*) ${baseQuery}`);
    countStmt.bind(queryParams);
    countStmt.step();
    const total = countStmt.getAsObject()['COUNT(*)'] as number;
    countStmt.free();

    // Fetch Page
    const offset = (params.page - 1) * params.pageSize;
    const query = `SELECT rowid as id, * ${baseQuery} ORDER BY DataAggiornamento DESC LIMIT ? OFFSET ?`;
    const stmt = db.prepare(query);
    stmt.bind([...queryParams, params.pageSize, offset]);
    
    const results: ArchiveItem[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        results.push({
            id: row.id as number,
            url: row.URL as string,
            utenti: row.Utenti as string,
            macro_area: row['Macro-area'] as string,
            argomento: row.Argomento as string,
            sottocategoria: row.Sottocategoria as string,
            titolo: row.Titolo as string,
            testo: row.Testo as string,
            data_ultimo_aggiornamento_informazioni: row['Data Ultimo Aggiornamento Informazioni'] as string,
            data_aggiornamento: row.DataAggiornamento as string
        });
    }
    stmt.free();
    
    return { results, total };
};

export const getDistinctValues = (db: any, column: string, currentFilters: any = {}): string[] => {
    try {
        // Build hierarchy logic
        let query = `SELECT DISTINCT "${column}" FROM archivio WHERE 1=1`;
        const params: any[] = [];

        // If asking for Macro-area, filter by selected Utenti
        if (column === 'Macro-area' && currentFilters.utenti && currentFilters.utenti !== 'Tutti') {
            query += " AND Utenti = ?";
            params.push(currentFilters.utenti);
        }
        // If asking for Argomento, filter by Utenti AND Macro-area
        if (column === 'Argomento') {
            if (currentFilters.utenti && currentFilters.utenti !== 'Tutti') {
                query += " AND Utenti = ?";
                params.push(currentFilters.utenti);
            }
            if (currentFilters.macro_area && currentFilters.macro_area !== 'Tutte') {
                query += " AND \"Macro-area\" = ?";
                params.push(currentFilters.macro_area);
            }
        }
        // If asking for Sottocategoria, filter by all above
        if (column === 'Sottocategoria') {
             if (currentFilters.utenti && currentFilters.utenti !== 'Tutti') {
                query += " AND Utenti = ?";
                params.push(currentFilters.utenti);
            }
            if (currentFilters.macro_area && currentFilters.macro_area !== 'Tutte') {
                query += " AND \"Macro-area\" = ?";
                params.push(currentFilters.macro_area);
            }
            if (currentFilters.argomento && currentFilters.argomento !== 'Tutti') {
                query += " AND Argomento = ?";
                params.push(currentFilters.argomento);
            }
        }

        query += ` ORDER BY "${column}" ASC`;

        const stmt = db.prepare(query);
        stmt.bind(params);
        
        const values: string[] = [];
        while(stmt.step()) {
            const val = stmt.getAsObject()[column];
            if (val && val !== 'null' && String(val).trim() !== '') {
                values.push(String(val));
            }
        }
        stmt.free();
        return values;
    } catch (e) {
        console.warn(`Could not get distinct values for ${column}`, e);
    }
    return [];
};

export const getAvailableYears = (db: any): string[] => {
    try {
        // Heuristic: extract years (4 digits) from the 'Data Ultimo Aggiornamento Informazioni' column
        // Since SQLite substring/regex is limited, we fetch distinct values and parse in JS
        const res = db.exec(`SELECT DISTINCT "Data Ultimo Aggiornamento Informazioni" FROM archivio`);
        const years = new Set<string>();
        
        if (res.length > 0 && res[0].values) {
            res[0].values.flat().forEach((val: any) => {
                if (typeof val === 'string') {
                    const match = val.match(/\d{4}/);
                    if (match) years.add(match[0]);
                }
            });
        }
        return Array.from(years).sort().reverse();
    } catch (e) {
        return [];
    }
};

export const getDbMetadata = (db: any): { count: number, lastUpdate: string | null } => {
    try {
        const countRes = db.exec("SELECT COUNT(*) FROM archivio");
        const count = countRes[0].values[0][0] as number;
        
        const dateRes = db.exec("SELECT MAX(DataAggiornamento) FROM archivio");
        const lastUpdate = dateRes[0].values[0][0] as string;
        
        return { count, lastUpdate };
    } catch (e) {
        console.error("Error getting metadata", e);
        return { count: 0, lastUpdate: null };
    }
};
