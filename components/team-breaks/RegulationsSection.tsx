import React from 'react';
import { BookOpen } from 'lucide-react';

const RegulationsSection: React.FC = React.memo(() => (
    <section className="card">
        <h4 className="flex items-center gap-3 text-xl font-bold text-[var(--c-text-heading)] mb-4"><BookOpen className="w-6 h-6"/> Regolamento Gestione Pause</h4>
        <ol className="space-y-3 list-decimal list-inside text-gray-600">
            <li>Non sovrapporsi nella selezione dell'orario della pausa (moderatori attivi &lt;5);</li>
            <li>È possibile sovrapporsi in caso di molti moderatori attivi in turno (moderatori attivi &gt;=5);</li>
            <li>Per favorire la visione globale della gestione all'intero gruppo, inserire la spunta su eseguita una volta terminata la pausa;</li>
            <li>Se la pausa precedentemente inserita dovesse slittare, aggiornare l'orario (clicca sull'orario per modificare). La durata rimane invariata (15 min / 1h pranzo).</li>
            <li>Nel limite del possibile, soprattutto quando si é solo in tre in turno, evitare di andare in pausa consecutivamente, lasciare sempre qualche minuto di stacco;</li>
            <li>Le pause pranzo (1h) devono essere organizzate verificando il numero di colleghi in turno, normally il numero di operatori attivi non deve essere inferiore a 3. Tuttavia è possibile, in caso di necessità, concordare la pausa con il II livello. In caso di flussi alti coordinarsi con i colleghi e i supervisori.</li>
            <li>Le pause brevi (Prima, Seconda, Terza) hanno una durata fissa di 15 minuti.</li>
        </ol>
    </section>
));

export default RegulationsSection;
