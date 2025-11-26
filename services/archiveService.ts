
import { ArchiveItem } from '../types';

let SQL: any;

const loadSqlJsLib = (): Promise<any> => {
    if (SQL) return Promise.resolve(SQL);

    return new Promise((resolve, reject) => {
        // Check if already loaded via global
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

export const loadDatabase = async (signedUrl: string): Promise<any> => {
    const sql = await loadSqlJsLib();
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Failed to download database file');
    const buf = await response.arrayBuffer();
    return new sql.Database(new Uint8Array(buf));
};

export const queryArchive = (db: any, params: {
    search?: string,
    filters?: {
        utenti?: string,
        macro_area?: string,
        argomento?: string,
        sottocategoria?: string
    }
}): ArchiveItem[] => {
    let query = "SELECT rowid as id, * FROM archivio WHERE 1=1";
    const queryParams: any[] = [];

    if (params.filters) {
        if (params.filters.utenti && params.filters.utenti !== 'Tutti') {
            query += " AND Utenti = ?";
            queryParams.push(params.filters.utenti);
        }
        if (params.filters.macro_area && params.filters.macro_area !== 'Tutte') {
            query += " AND \"Macro-area\" = ?";
            queryParams.push(params.filters.macro_area);
        }
        if (params.filters.argomento && params.filters.argomento !== 'Tutti') {
            query += " AND Argomento = ?";
            queryParams.push(params.filters.argomento);
        }
        if (params.filters.sottocategoria && params.filters.sottocategoria !== 'Tutte') {
            query += " AND Sottocategoria = ?";
            queryParams.push(params.filters.sottocategoria);
        }
    }

    if (params.search && params.search.trim() !== '') {
        query += " AND (Titolo LIKE '%' || ? || '%' OR Testo LIKE '%' || ? || '%')";
        queryParams.push(params.search, params.search);
    }
    
    query += " ORDER BY DataAggiornamento DESC LIMIT 500";

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
};

export const getDistinctValues = (db: any, column: string): string[] => {
    try {
        const res = db.exec(`SELECT DISTINCT "${column}" FROM archivio ORDER BY "${column}" ASC`);
        if (res.length > 0 && res[0].values) {
            return res[0].values.flat().map((v: any) => String(v)).filter((v: string) => v !== 'null' && v !== '');
        }
    } catch (e) {
        console.warn(`Could not get distinct values for ${column}`, e);
    }
    return [];
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
