export function timeAgo(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    let interval = seconds / 31536000;
    if (interval > 1) {
        return Math.floor(interval) === 1 ? "1 anno fa" : `${Math.floor(interval)} anni fa`;
    }
    interval = seconds / 2592000;
    if (interval > 1) {
        return Math.floor(interval) === 1 ? "1 mese fa" : `${Math.floor(interval)} mesi fa`;
    }
    interval = seconds / 86400;
    if (interval > 1) {
        return Math.floor(interval) === 1 ? "1 giorno fa" : `${Math.floor(interval)} giorni fa`;
    }
    interval = seconds / 3600;
    if (interval > 1) {
        return Math.floor(interval) === 1 ? "1 ora fa" : `${Math.floor(interval)} ore fa`;
    }
    interval = seconds / 60;
    if (interval > 1) {
        return Math.floor(interval) === 1 ? "1 minuto fa" : `${Math.floor(interval)} minuti fa`;
    }
    if (seconds < 10) return "pochi secondi fa";
    return `${Math.floor(seconds)} secondi fa`;
}
