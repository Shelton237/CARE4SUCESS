// Tableau interactif en temps réel (classe virtuelle).
// L'enseignant publie ses traits ; élèves, parents et invités les reçoivent par
// Server-Sent Events (SSE). SSE passe par le proxy HTTP existant, sans
// configuration serveur supplémentaire. On utilise fetch + ReadableStream plutôt
// qu'EventSource pour pouvoir envoyer l'en-tête Authorization.
//
// Un spectateur peut demander la main : l'enseignant l'accepte ou la retire, et
// le spectateur autorisé dessine à son tour (ses traits sont diffusés à tous).

export type BoardEvent =
    | { t: "s"; k: "pen" | "eraser"; c: string; w: number; p: [number, number][]; f?: boolean }
    | { t: "snap"; d: string }
    // Reçus par l'enseignant : un spectateur demande / annule sa demande.
    | { t: "req"; cid: string; name: string }
    | { t: "req-cancel"; cid: string }
    // Reçu par le spectateur concerné : la main est accordée / retirée.
    | { t: "grant"; allow: boolean };

const API_BASE = import.meta.env.VITE_API_URL || "/api";
const FLUSH_DELAY_MS = 60;

const authHeaders = (token?: string | null): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {});

/** Identifiant propre à cet onglet et à cette séance, conservé au rechargement de la page. */
export function getBoardClientId(sessionId: string): string {
    const key = `c4s-board-cid:${sessionId}`;
    try {
        const existing = sessionStorage.getItem(key);
        if (existing) return existing;
        const created = crypto.randomUUID();
        sessionStorage.setItem(key, created);
        return created;
    } catch {
        return crypto.randomUUID();
    }
}

/** File d'attente d'envoi : regroupe les points d'un même trait et envoie par lots. */
export function createBoardPublisher(
    sessionId: string,
    getToken: () => string | null | undefined,
    cid: string,
) {
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
            await fetch(`${API_BASE}/sessions/${sessionId}/board-events`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders(getToken()) },
                body: JSON.stringify({ events, cid }),
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

async function postJson(path: string, token: string | null | undefined, body: unknown) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string }).message || "Requête refusée.");
    return data;
}

/** Spectateur : demande la main (ou annule sa demande / rend la main avec `cancel`). */
export const requestBoardAccess = (
    sessionId: string,
    token: string | null | undefined,
    cid: string,
    name: string,
    cancel = false,
) => postJson(`/sessions/${sessionId}/board-request`, token, { cid, name, cancel });

/** Enseignant : accorde ou retire la main à un spectateur. */
export const answerBoardRequest = (
    sessionId: string,
    token: string | null | undefined,
    cid: string,
    allow: boolean,
) => postJson(`/sessions/${sessionId}/board-grant`, token, { cid, allow });

/**
 * Écoute le flux du tableau. Se reconnecte tout seul (délai croissant, plafonné à 10 s).
 * Retourne une fonction qui arrête l'écoute.
 */
export function subscribeBoard(
    sessionId: string,
    token: string | null | undefined,
    cid: string,
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
                const res = await fetch(`${API_BASE}/sessions/${sessionId}/board-stream?cid=${encodeURIComponent(cid)}`, {
                    headers: { Accept: "text/event-stream", ...authHeaders(token) },
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
