
import type { VercelRequest, VercelResponse } from '@vercel/node';
import MiniSearch from 'minisearch';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, documents, mode } = req.body;

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
        return res.status(200).json(mode === 'repository' ? { relevant_ids: [] } : { results: [] });
    }

    try {
        // 1. Normalizzazione e Preparazione Dati
        // Mappiamo i documenti in ingresso in un formato standard per l'indicizzazione
        const normalizedDocs = documents.map(doc => ({
            id: doc.id,
            // Repository usa 'name', Global usa 'title' o è implicito in 'text'. 
            // Normalizziamo tutto in 'title' e 'content' per il motore di ricerca.
            title: doc.name || doc.title || (doc.text ? doc.text.substring(0, 50) : ''),
            content: doc.description || doc.content || doc.text || '',
            // Campi originali da preservare nel risultato
            originalData: doc
        }));

        // 2. Configurazione Motore di Ricerca (Full-Text + Fuzzy)
        const miniSearch = new MiniSearch({
            fields: ['title', 'content'], // Campi in cui cercare
            storeFields: ['id', 'originalData'], // Campi da restituire
            searchOptions: {
                boost: { title: 3, content: 1 }, // Il titolo pesa 3 volte più del contenuto
                fuzzy: 0.2, // Tolleranza errori (es. 'tcket' trova 'ticket')
                prefix: true, // 'doc' trova 'documento'
                combineWith: 'AND' // Tutte le parole cercate devono essere presenti (più preciso)
            },
            // Processore per normalizzare accenti italiani (es. 'città' == 'citta')
            processTerm: (term) => {
                return term.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            }
        });

        // 3. Indicizzazione
        miniSearch.addAll(normalizedDocs);

        // 4. Esecuzione Ricerca
        // Normalizziamo anche la query utente
        const cleanQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        // Se la query è troppo corta, usa una ricerca più permissiva (OR), altrimenti stretta (AND)
        const searchResults = miniSearch.search(cleanQuery, {
            combineWith: cleanQuery.split(' ').length > 2 ? 'AND' : 'OR' 
        });

        // 5. Formattazione Risposta in base al chiamante
        if (mode === 'repository') {
            // Repository si aspetta solo gli ID
            const relevantIds = searchResults.map(r => r.id);
            return res.status(200).json({ relevant_ids: relevantIds });
        } else {
            // Global Search si aspetta gli oggetti completi
            // Limitiamo a 15 risultati per performance e pulizia
            const finalResults = searchResults.slice(0, 15).map(r => {
                const original = r.originalData;
                // Ricostruiamo l'oggetto come se lo aspetta il frontend
                return {
                    id: original.id,
                    serviceId: original.serviceId,
                    categoryName: original.categoryName,
                    title: original.title || original.name, // Fallback
                    content: original.content || original.description || original.text
                };
            });
            
            return res.status(200).json({ results: finalResults });
        }

    } catch (error: any) {
        console.error("Search Engine Error:", error);
        // Fallback grazioso: restituisce array vuoto invece di 500
        return res.status(200).json(mode === 'repository' ? { relevant_ids: [] } : { results: [] });
    }
}
