// Grille commune d'évaluation du diagnostic (échelle 0-5) : chaque note a une
// définition fixe pour que deux conseillers évaluent un même élève de la même façon.

export type DiagLevel = {
    value: number;
    label: string;
    hint: string;
    color: string;
    bg: string;
};

export const DIAG_LEVELS: DiagLevel[] = [
    { value: 0, label: "Non évalué",             hint: "Matière pas encore évaluée.",                                   color: "#94A3B8", bg: "#F1F5F9" },
    { value: 1, label: "Lacunes importantes",    hint: "Bases du programme non acquises, soutien prioritaire.",          color: "#DC2626", bg: "#FEE2E2" },
    { value: 2, label: "Fragile",                hint: "Notions partiellement comprises, erreurs fréquentes.",           color: "#EA580C", bg: "#FFEDD5" },
    { value: 3, label: "En cours d'acquisition", hint: "Comprend avec de l'aide, manque de régularité.",                 color: "#D97706", bg: "#FEF3C7" },
    { value: 4, label: "Acquis",                 hint: "Applique seul les notions du niveau.",                           color: "#16A34A", bg: "#DCFCE7" },
    { value: 5, label: "Maîtrisé",               hint: "Maîtrise solide, peut aller au-delà du programme.",             color: "#0F9B8E", bg: "#CCFBF1" },
];

export const DIAG_MAX = 5;

export const getDiagLevel = (score: unknown): DiagLevel => {
    const n = Math.round(Number(score));
    const clamped = Number.isFinite(n) ? Math.min(DIAG_MAX, Math.max(0, n)) : 0;
    return DIAG_LEVELS[clamped];
};

export const STRENGTH_CRITERIA = [
    "Bonnes bases du programme",
    "Méthodologie",
    "Autonomie",
    "Concentration",
    "Raisonnement logique",
    "Expression écrite",
    "Expression orale",
    "Curiosité / motivation",
    "Régularité du travail",
    "Confiance en soi",
];

export const WEAKNESS_CRITERIA = [
    "Lacunes sur le programme précédent",
    "Méthodologie",
    "Autonomie",
    "Concentration",
    "Raisonnement logique",
    "Expression écrite",
    "Expression orale",
    "Motivation",
    "Gestion du temps",
    "Confiance en soi",
];

const SEP = " · ";

// Stockage dans les colonnes texte existantes (strengths / weaknesses) :
// ligne 1 = critères cochés séparés par " · ", lignes suivantes = commentaire libre.
export const serializeCriteria = (criteria: string[], comment: string): string | null => {
    const lines = [criteria.join(SEP), comment.trim()].filter(Boolean);
    return lines.length ? lines.join("\n") : null;
};

export const parseCriteria = (text: unknown, known: string[]): { criteria: string[]; comment: string } => {
    const raw = typeof text === "string" ? text.trim() : "";
    if (!raw) return { criteria: [], comment: "" };
    const [first, ...rest] = raw.split("\n");
    const items = first.split(SEP).map(s => s.trim()).filter(Boolean);
    if (items.length && items.every(i => known.includes(i))) {
        return { criteria: items, comment: rest.join("\n").trim() };
    }
    // Ancien diagnostic saisi en texte libre
    return { criteria: [], comment: raw };
};

export type ScoreSummary = { priority: string[]; consolidate: string[]; acquired: string[]; unrated: string[] };

export const summarizeScores = (scores: Record<string, unknown> | null | undefined): ScoreSummary => {
    const out: ScoreSummary = { priority: [], consolidate: [], acquired: [], unrated: [] };
    for (const [subject, value] of Object.entries(scores || {})) {
        const v = getDiagLevel(value).value;
        if (v === 0) out.unrated.push(subject);
        else if (v <= 2) out.priority.push(subject);
        else if (v === 3) out.consolidate.push(subject);
        else out.acquired.push(subject);
    }
    return out;
};
