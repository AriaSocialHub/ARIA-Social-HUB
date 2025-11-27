
import { ArchiveItem } from '../types';

let SQL: any;
const dbCache: Record<string, any> = {};

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

// Helper function to clean strings and apply Title Case to fix duplicate filters
const normalizeString = (str: string): string => {
    if (!str) return '';
    try {
        let decoded = decodeURIComponent(str);
        decoded = decoded.replace(/[+\-_]/g, ' '); 
        decoded = decoded.replace(/\s+/g, ' ').trim();
        
        // Apply Title Case: Uppercase first letter of each word, lowercase the rest
        return decoded.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    } catch (e) {
        return str;
    }
};

export const normalizeDatabase = (db: any) => {
    try {
        // Check if we are in RL db (has 'Utenti') or LN db
        const checkStmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='archivio'");
        if (!checkStmt.step()) { checkStmt.free(); return; } // No archive table
        checkStmt.free();

        // Check columns to decide normalization strategy
        const cols = db.exec("PRAGMA table_info(archivio)")[0].values.map((v: any) => v[1]);
        const isRL = cols.includes('Utenti');

        if (isRL) {
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

            if (updates.length > 0) {
                db.exec("BEGIN TRANSACTION");
                const updateStmt = db.prepare("UPDATE archivio SET Utenti = ?, \"Macro-area\" = ?, Argomento = ?, Sottocategoria = ? WHERE rowid = ?");
                for (const u of updates) {
                    updateStmt.run([u.utenti, u.macro, u.argomento, u.sotto, u.id]);
                }
                updateStmt.free();
                db.exec("COMMIT");
            }
        } else {
            // LN Normalization (Only Macro-area exists as category)
            const stmt = db.prepare("SELECT rowid, \"Macro-area\" FROM archivio");
            const updates: any[] = [];
            while (stmt.step()) {
                const row = stmt.getAsObject();
                updates.push({
                    id: row.rowid,
                    macro: normalizeString(row['Macro-area'] as string),
                });
            }
            stmt.free();

            if (updates.length > 0) {
                db.exec("BEGIN TRANSACTION");
                const updateStmt = db.prepare("UPDATE archivio SET \"Macro-area\" = ? WHERE rowid = ?");
                for (const u of updates) {
                    updateStmt.run([u.macro, u.id]);
                }
                updateStmt.free();
                db.exec("COMMIT");
            }
        }
    } catch (e) {
        console.error("Error normalizing database:", e);
    }
};

export const loadDatabase = async (signedUrl: string, dbName: string, useCache: boolean = true): Promise<any> => {
    // Check cache first if enabled
    if (useCache && dbCache[dbName]) {
        // Simple check to see if the cached DB is still valid/open
        try {
            dbCache[dbName].exec("SELECT 1");
            return dbCache[dbName];
        } catch (e) {
            console.warn(`Cached DB ${dbName} appears closed or invalid. Reloading.`);
            delete dbCache[dbName];
        }
    }

    const sql = await loadSqlJsLib();
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Failed to download database file');
    const buf = await response.arrayBuffer();
    const db = new sql.Database(new Uint8Array(buf));
    
    // Normalize data immediately after load
    normalizeDatabase(db);
    
    // Store in cache only if requested
    if (useCache) {
        dbCache[dbName] = db;
    }
    
    return db;
};

export const queryArchive = (db: any, params: {
    search?: string,
    searchScope?: 'title' | 'content' | 'both',
    years?: string[],
    filters?: {
        utenti?: string,
        macro_area?: string,
        argomento?: string,
        sottocategoria?: string
    }
}, dbType: 'RL' | 'LN' = 'RL'): ArchiveItem[] => {
    
    try {
        let baseQuery = "FROM archivio WHERE 1=1";
        const queryParams: any[] = [];

        // Determine correct date column based on DB Type
        const dateCol = dbType === 'LN' ? '"Data di Pubblicazione"' : '"Data Ultimo Aggiornamento Informazioni"';

        // Filters
        if (params.filters) {
            if (dbType === 'RL') {
                if (params.filters.utenti && params.filters.utenti !== 'Tutti') {
                    baseQuery += " AND Utenti = ?";
                    queryParams.push(params.filters.utenti);
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
            // Macro-area is common
            if (params.filters.macro_area && params.filters.macro_area !== 'Tutte') {
                baseQuery += " AND \"Macro-area\" = ?";
                queryParams.push(params.filters.macro_area);
            }
        }

        // Year Filter
        if (params.years && params.years.length > 0) {
            const yearConditions = params.years.map(() => `${dateCol} LIKE ?`).join(" OR ");
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
                baseQuery += " AND (Titolo LIKE '%' || ? || '%' OR Testo LIKE '%' || ? || '%')";
                queryParams.push(term, term);
            }
        }

        // Select based on DB Schema
        let selectClause = "";
        if (dbType === 'LN') {
            // Map LN columns to ArchiveItem interface
            selectClause = `SELECT rowid as id, URL, '' as Utenti, "Macro-area", '' as Argomento, '' as Sottocategoria, Titolo, Testo, "Data di Pubblicazione" as "Data Ultimo Aggiornamento Informazioni", DataAggiornamento`;
        } else {
            selectClause = `SELECT rowid as id, *`;
        }

        const query = `${selectClause} ${baseQuery} ORDER BY DataAggiornamento DESC`;
        
        // We fetch ALL results matching criteria to handle deduplication and pagination in JS (for multi-db support)
        const stmt = db.prepare(query);
        stmt.bind(queryParams);
        
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
        
        return results;
    } catch (e) {
        console.error("Error querying archive:", e);
        return [];
    }
};

// Deduplicate items based on Title + Date
export const deduplicateResults = (items: ArchiveItem[]): ArchiveItem[] => {
    const seen = new Set<string>();
    return items.filter(item => {
        // Create a unique key based on title and update date (ignore URL differences)
        const key = `${item.titolo.toLowerCase()}|${item.data_ultimo_aggiornamento_informazioni}`;
        if (seen.has(key)) {
            return false;
        }
        seen.add(key);
        return true;
    });
};

export const getDistinctValues = (db: any, column: string, currentFilters: any = {}): string[] => {
    try {
        // Check if column exists first (for LN compatibility)
        const cols = db.exec("PRAGMA table_info(archivio)")[0].values.map((v: any) => v[1]);
        if (!cols.includes(column)) return [];

        let query = `SELECT DISTINCT "${column}" FROM archivio WHERE 1=1`;
        const params: any[] = [];

        // Apply hierarchy only if columns exist
        if (column === 'Macro-area' && cols.includes('Utenti') && currentFilters.utenti && currentFilters.utenti !== 'Tutti') {
            query += " AND Utenti = ?";
            params.push(currentFilters.utenti);
        }
        
        // ... (Similar logic for Argomento/Sottocategoria if needed, simplified for robustness)

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
        console.error(`Error getting distinct values for ${column}:`, e);
        return [];
    }
};

export const getAvailableYears = (db: any, dbType: 'RL' | 'LN' = 'RL'): string[] => {
    try {
        const dateCol = dbType === 'LN' ? '"Data di Pubblicazione"' : '"Data Ultimo Aggiornamento Informazioni"';
        const res = db.exec(`SELECT DISTINCT ${dateCol} FROM archivio`);
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
        console.error("Error getting available years:", e);
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
        console.error("Error getting metadata:", e);
        return { count: 0, lastUpdate: null };
    }
};
