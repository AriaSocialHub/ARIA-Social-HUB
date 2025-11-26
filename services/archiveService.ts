
import initSqlJs, { Database } from 'sql.js';
import { ArchiveItem } from '../types';

let SQL: any;

// Initialize SQL.js
const initSQL = async () => {
    if (!SQL) {
        // Use CDN for wasm binary to avoid build/copy issues in Vercel
        SQL = await initSqlJs({
            locateFile: (file: string) => `https://sql.js.org/dist/${file}`
        });
    }
    return SQL;
};

// Function to download DB file into memory
export const loadDatabase = async (signedUrl: string): Promise<Database> => {
    const sql = await initSQL();
    const response = await fetch(signedUrl);
    if (!response.ok) throw new Error('Failed to download database file');
    const buf = await response.arrayBuffer();
    return new sql.Database(new Uint8Array(buf));
};

// Function to query the database
export const queryArchive = (db: Database, params: {
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
    
    query += " ORDER BY DataAggiornamento DESC LIMIT 500"; // Limit results for performance

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

export const getDistinctValues = (db: Database, column: string): string[] => {
    const res = db.exec(`SELECT DISTINCT "${column}" FROM archivio ORDER BY "${column}" ASC`);
    if (res.length > 0 && res[0].values) {
        return res[0].values.flat().map(v => String(v)).filter(v => v !== 'null' && v !== '');
    }
    return [];
};

export const getDbMetadata = (db: Database): { count: number, lastUpdate: string | null } => {
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
