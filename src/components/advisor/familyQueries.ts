// Requêtes de lecture partagées entre la fiche famille (Families.tsx) et la vue
// de synthèse « Bilan Conseil » (AdvisorBilanView). Mêmes clés React Query et
// mêmes queryFn : les deux écrans partagent le cache.

export const API = import.meta.env.VITE_API_URL || "/api";

// Lecture JSON protégée (corps vide ou non JSON, ex. page HTML d'un proxy en 502)
export async function readJsonSafe(res: Response): Promise<any> {
    try {
        return await res.json();
    } catch {
        return null;
    }
}

// Un prospect n'a pas encore de compte élève
export const isProspectFamily = (f: any): boolean => !f?.studentId && !f?.childId;

export const getRequestId = (f: any): string | null =>
    f?.id && !String(f.id).startsWith("no-request-") ? String(f.id) : null;

export const getStudentId = (f: any): string | null => f?.studentId || f?.childId || null;

export function diagnosticQueryKey(f: any) {
    return isProspectFamily(f) ? ["reqDiagnostic", getRequestId(f)] : ["diagnostic", getStudentId(f)];
}

export function planQueryKey(f: any) {
    return isProspectFamily(f) ? ["reqPlan", getRequestId(f)] : ["academicPlan", getStudentId(f)];
}

export const notesQueryKey = (studentId: string | null) => ["advisorNotes", studentId];

export const diagnosticUrl = (f: any) =>
    isProspectFamily(f)
        ? `${API}/requests/${getRequestId(f)}/diagnostic`
        : `${API}/students/${getStudentId(f)}/diagnostic`;

export const planUrl = (f: any) =>
    isProspectFamily(f)
        ? `${API}/requests/${getRequestId(f)}/plan`
        : `${API}/students/${getStudentId(f)}/academic-plan`;

export async function fetchNotes(studentId: string | null, token: string | null | undefined): Promise<any[]> {
    if (!studentId) return [];
    const res = await fetch(`${API}/advisor-notes/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Impossible de charger les notes");
    const data = await readJsonSafe(res);
    return Array.isArray(data) ? data : [];
}

export async function fetchDiagnostic(family: any, token: string | null | undefined): Promise<any> {
    const res = await fetch(diagnosticUrl(family), { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Impossible de charger le diagnostic");
    return res.json();
}

export async function fetchPlan(family: any, token: string | null | undefined): Promise<any> {
    const res = await fetch(planUrl(family), { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Impossible de charger le plan");
    return res.json();
}
