// Tableau interactif en temps réel (classe virtuelle).
// L'enseignant publie ses traits ; élèves, parents et invités les reçoivent par
// Server-Sent Events (SSE). SSE passe par le proxy HTTP existant, sans
// configuration serveur supplémentaire. On utilise fetch + ReadableStream plutôt
// qu'EventSource pour pouvoir envoyer l'en-tête Authorization.

export type BoardEvent =
    | { t: "s"; k: "pen" | "eraser"; c: string; w: number; p: [number, number][]; f?: boolean }
    | { t: "snap"; d: string };

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const FLUSH_DELAY_MS = 60;

/** File d'attente côté enseignant : regroupe les points d'un même trait et envoie par lots. */
export function createBoardPublisher(sessionId: string, getToken: () => string | null | undefined) {
    let queue: BoardEvent[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    let sending = false;

    const send = async () => {
        timer = null;
        if (sending) { timer = setTimeout(send, FLUSH_DELAY_MS); return; }
        if (queue.length === 0) return;
        const events = queue;
        queue = [];
        sending = true;
        try {
            const token = getToken();
            await fetch(`${API_BASE}/sessions/${sessionId}/board-events`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ events }),
            });
        } catch {
            // Réseau : les points de trait perdus seront corrigés par le prochain instantané.
        } finally {
            sending = false;
        }
    };

    return {
        push(event: BoardEvent) {
            const last = queue[queue.length - 1];
            // Fusionne les points consécutifs d'un même trait pour limiter les requêtes.
            if (
                event.t === "s" && !event.f && last && last.t === "s" &&
                last.k === event.k && last.c === event.c && last.w === event.w && last.p.length < 300
            ) {
                last.p.push(...event.p);
            } else if (event.t === "snap") {
                // Un instantané remplace tout ce qui l'a précédé dans la file.
                queue = [event];
            } else {
                queue.push(event);
            }
            if (!timer) timer = setTimeout(send, FLUSH_DELAY_MS);
        },
        dispose() {
            if (timer) clearTimeout(timer);
            timer = null;
            queue = [];
        },
    };
}

/**
 * Écoute le flux du tableau. Se reconnecte tout seul (délai croissant, plafonné à 10 s).
 * Retourne une fonction qui arrête l'écoute.
 */
export function subscribeBoard(
    sessionId: string,
    token: string | null | undefined,
    onEvent: (event: BoardEvent) => void,
    onStatus?: (connected: boolean) => void,
): () => void {
    const controller = new AbortController();
    let stopped = false;

    const wait = (ms: number) => new Promise<void>((resolve) => {
        const id = setTimeout(resolve, ms);
        controller.signal.addEventListener("abort", () => { clearTimeout(id); resolve(); }, { once: true });
    });

    const run = async () => {
        let retry = 1000;
        while (!stopped) {
            try {
                const res = await fetch(`${API_BASE}/sessions/${sessionId}/board-stream`, {
                    headers: { Accept: "text/event-stream", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    signal: controller.signal,
                });
                if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
                onStatus?.(true);
                retry = 1000;
                const reader = res.body.getReader();
                const decoder = new TextDecoder();
                let buffer = "";
                for (;;) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    buffer += decoder.decode(value, { stream: true });
                    let cut: number;
                    while ((cut = buffer.indexOf("\n\n")) !== -1) {
                        const frame = buffer.slice(0, cut);
                        buffer = buffer.slice(cut + 2);
                        for (const line of frame.split("\n")) {
                            if (!line.startsWith("data: ")) continue;
                            try { onEvent(JSON.parse(line.slice(6)) as BoardEvent); } catch { /* trame illisible : ignorée */ }
                        }
                    }
                }
            } catch {
                // Coupure réseau ou arrêt volontaire : on retombe sur la reconnexion ci-dessous.
            }
            onStatus?.(false);
            if (stopped) break;
            await wait(retry);
            retry = Math.min(retry * 2, 10000);
        }
    };
    void run();

    return () => {
        stopped = true;
        controller.abort();
    };
}
