import { getDiagLevel } from "./diagnosticRubric";

export type PlanWeek = { objective: string; subjects: string[]; done: boolean };

export const PLAN_DURATIONS = [4, 6, 8, 10, 12];

export const emptyWeek = (): PlanWeek => ({ objective: "", subjects: [], done: false });

const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
};

// Lundi qui suit (ou aujourd'hui si on est lundi) : début de plan par défaut.
export const nextMonday = (from: Date = new Date()): string => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const offset = (8 - d.getDay()) % 7;
    d.setDate(d.getDate() + offset);
    return toISO(d);
};

const parseISO = (iso: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};

const MONTH = new Intl.DateTimeFormat("fr-FR", { month: "short" });

// "13-19 oct." ou "27 oct.-2 nov." pour la semaine d'indice `index` (0 = première).
export const weekLabel = (startISO: string, index: number): string => {
    const start = parseISO(startISO);
    if (!start) return "";
    const a = new Date(start); a.setDate(a.getDate() + index * 7);
    const b = new Date(a); b.setDate(b.getDate() + 6);
    return a.getMonth() === b.getMonth()
        ? `${a.getDate()}-${b.getDate()} ${MONTH.format(b)}`
        : `${a.getDate()} ${MONTH.format(a)}-${b.getDate()} ${MONTH.format(b)}`;
};

export const planEndLabel = (startISO: string, weeks: number): string => {
    const start = parseISO(startISO);
    if (!start || weeks < 1) return "";
    const end = new Date(start); end.setDate(end.getDate() + weeks * 7 - 1);
    return end.toLocaleDateString("fr-FR");
};

// Matières proposées dans les semaines : celles du diagnostic (les plus faibles d'abord), puis celles de l'inscription.
export const planSubjects = (scores: Record<string, unknown> | null | undefined, familySubjects: string[]): string[] => {
    const evaluated = Object.entries(scores || {})
        .map(([s, v]) => ({ s, v: getDiagLevel(v).value }))
        .sort((x, y) => (x.v || 99) - (y.v || 99))
        .map(x => x.s);
    return [...new Set([...evaluated, ...familySubjects])];
};

// Trame : les matières prioritaires (1-2) reçoivent deux fois plus de semaines que celles à consolider (3).
// Sans faiblesse, on approfondit les matières évaluées. Dernière semaine = bilan dès 4 semaines.
export const buildPlanFromDiagnostic = (
    scores: Record<string, unknown> | null | undefined,
    childName: string,
    weeksCount: number,
): { title: string; weeks: PlanWeek[] } => {
    const entries = Object.entries(scores || {}).map(([s, v]) => ({ s, v: getDiagLevel(v).value })).filter(e => e.v > 0);
    const priority = entries.filter(e => e.v <= 2).sort((a, b) => a.v - b.v).map(e => e.s);
    const consolidate = entries.filter(e => e.v === 3).map(e => e.s);
    const deepen = entries.filter(e => e.v >= 4).map(e => e.s);

    const targets = priority.length || consolidate.length ? [...priority, ...consolidate] : deepen;
    const withReview = weeksCount >= 4 && targets.length > 0;
    const slots = withReview ? weeksCount - 1 : weeksCount;

    const sequence: string[] = [];
    if (priority.length || consolidate.length) {
        priority.forEach(s => sequence.push(s, s));
        consolidate.forEach(s => sequence.push(s));
    } else {
        sequence.push(...deepen);
    }

    const seen: Record<string, number> = {};
    const objectiveFor = (s: string) => {
        const n = (seen[s] = (seen[s] || 0) + 1);
        if (priority.includes(s)) return n === 1 ? `Reprendre les bases en ${s}` : `S'entraîner sur des exercices ciblés en ${s}`;
        if (consolidate.includes(s)) return n === 1 ? `Consolider les acquis en ${s}` : `Gagner en régularité en ${s}`;
        return `Approfondir ${s}`;
    };

    const weeks: PlanWeek[] = [];
    for (let i = 0; i < slots; i++) {
        if (!sequence.length) { weeks.push(emptyWeek()); continue; }
        const s = sequence[i % sequence.length];
        weeks.push({ objective: objectiveFor(s), subjects: [s], done: false });
    }
    if (withReview) {
        weeks.push({ objective: "Bilan de fin de plan : évaluation des progrès", subjects: [...targets], done: false });
    }

    const name = childName.trim();
    return { title: name ? `Plan d'accompagnement de ${name}` : "Plan d'accompagnement", weeks };
};

export const subjectCoverage = (weeks: PlanWeek[]): Record<string, number> => {
    const out: Record<string, number> = {};
    weeks.forEach(w => w.subjects.forEach(s => { out[s] = (out[s] || 0) + 1; }));
    return out;
};

export const missingPlanItems = (title: string, start: string, weeks: PlanWeek[]): string[] => {
    const missing: string[] = [];
    if (!title.trim()) missing.push("titre");
    if (!start) missing.push("date de début");
    weeks.forEach((w, i) => {
        if (!w.objective.trim()) missing.push(`objectif S${i + 1}`);
        if (!w.subjects.length) missing.push(`matière S${i + 1}`);
    });
    return missing;
};
