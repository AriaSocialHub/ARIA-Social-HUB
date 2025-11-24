
import { GoogleGenAI, Type } from '@google/genai';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { query, documents, mode } = req.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        console.error("Server API Key is missing");
        return res.status(500).json({ error: 'Configuration error on server' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        let prompt = "";
        let schema = null;

        if (mode === 'repository') {
            prompt = `Basandoti sulla query di ricerca "${query}", trova i file più pertinenti. Ecco un elenco di file in formato JSON:\n${JSON.stringify(documents)}\nRestituisci solo un oggetto JSON con una chiave "relevant_ids" che contenga un array degli ID dei file che corrispondono semanticamente. Includi solo i risultati migliori.`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    relevant_ids: {
                        type: Type.ARRAY,
                        description: "Un array degli ID dei file che sono semanticamente pertinenti alla query di ricerca.",
                        items: { type: Type.STRING }
                    }
                },
                required: ["relevant_ids"]
            };
        } else {
            // Global Search Mode
            prompt = `Basandoti sulla query di ricerca "${query}", trova i file più pertinenti dall'elenco JSON fornito. Restituisci solo un oggetto JSON con una chiave "results" che contenga un array degli oggetti originali completi dei file che corrispondono semanticamente. Includi solo i 5 risultati migliori. Non inventare risultati. Se non ci sono risultati, restituisci un array vuoto. Ecco i dati: ${JSON.stringify(documents)}`;
            schema = {
                type: Type.OBJECT,
                properties: {
                    results: {
                        type: Type.ARRAY,
                        description: "Un array degli oggetti originali completi che sono semanticamente pertinenti.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                id: { type: Type.STRING },
                                serviceId: { type: Type.STRING },
                                categoryName: { type: Type.STRING },
                                text: { type: Type.STRING }
                            }
                        }
                    }
                },
                required: ["results"]
            };
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema as any
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return res.status(200).json(JSON.parse(text));

    } catch (error: any) {
        console.error("Search API Error:", error);
        return res.status(500).json({ error: "Errore durante l'elaborazione della ricerca." });
    }
}
