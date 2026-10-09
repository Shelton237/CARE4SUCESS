import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users, Search, Phone,
    MessageCircle, FileText, Loader2, ChevronRight, ChevronLeft,
    SearchCheck, Briefcase, PlusCircle, AlertTriangle,
    ThumbsUp, Lightbulb, Eye, UserCircle2,
    ClipboardCheck, CalendarRange, Trash2,
    Zap, Star, RefreshCw, UserPlus, GitMerge, CheckCircle2,
    CalendarDays, TrendingUp, ArrowUpDown, ArrowUp, ArrowDown, Check,
    Calculator, BookOpen, Globe2, FlaskConical, Leaf, Landmark, Save,
    Clock, Mail,
} from "lucide-react";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AcademicFile from "../common/AcademicFile";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import AdvisorBilanView from "@/components/advisor/AdvisorBilanView";
import {
    API, readJsonSafe, isProspectFamily, getRequestId, getStudentId,
    diagnosticQueryKey, planQueryKey as buildPlanQueryKey, notesQueryKey,
    diagnosticUrl, planUrl as buildPlanUrl,
    fetchNotes, fetchDiagnostic, fetchPlan,
} from "@/components/advisor/familyQueries";

const SUBJECTS_DIAG = ["Mathématiques", "Français", "Anglais", "Physique", "SVT", "Histoire-Géo"];

// Matières choisies à l'inscription (stockées "Maths, Anglais" ou en tableau) ; liste complète si rien n'est renseigné.
const getFamilySubjects = (family: any): string[] => {
    const raw = family?.subject ?? family?.subjects;
    const list = (Array.isArray(raw) ? raw : String(raw ?? "").split(","))
        .map((s: unknown) => String(s).trim())
        .filter((s: string) => s && s !== String.fromCharCode(0x2014));
    return list.length ? [...new Set(list)] : SUBJECTS_DIAG;
};
// Valeur par défaut des curseurs du diagnostic : partagée entre l'affichage et le payload envoyé
const DEFAULT_DIAG_SCORE = 3;
const PAGE_SIZE = 8;
const NOT_PROVIDED = "Non renseigné";

// Normalise une valeur d'affichage : vide ou tiret (valeurs de repli du serveur) => libellé neutre
const displayOr = (value: unknown, fallback: string = NOT_PROVIDED): string => {
    if (typeof value !== "string") return fallback;
    const v = value.trim();
    return v === "" || v === String.fromCharCode(0x2014) ? fallback : v;
};

function PanelError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div role="alert" className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between gap-2 text-[10px] text-red-700 font-semibold">
            <span>{message}</span>
            <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[9px] font-black hover:bg-red-100 transition-colors shrink-0"
            >
                <RefreshCw className="w-2.5 h-2.5" /> Réessayer
            </button>
        </div>
    );
}

const SUBJECT_ICON: Record<string, any> = {
    "Mathématiques": Calculator,
    "Français": BookOpen,
    "Anglais": Globe2,
    "Physique": FlaskConical,
    "SVT": Leaf,
    "Histoire-Géo": Landmark,
};

function SubjectBar({ subject, score, max = 5, editable = false, onChange }: { subject: string; score: number; max?: number; editable?: boolean; onChange?: (v: number) => void }) {
    const Icon = SUBJECT_ICON[subject] || BookOpen;
    const pct = Math.max(0, Math.min(100, (score / max) * 100));
    return (
        <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full border border-[#0D2D5A]/15 flex items-center justify-center shrink-0 text-[#0D2D5A]">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold text-[#0D2D5A] w-24 shrink-0 truncate">{subject}</span>
            {editable ? (
                <input
                    type="range"
                    min={0}
                    max={max}
                    value={score}
                    onChange={e => onChange?.(+e.target.value)}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-[#1A6CC8] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#1A6CC8] [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                    style={{ background: `linear-gradient(to right, #1A6CC8 ${pct}%, #E5EAF1 ${pct}%)` }}
                />
            ) : (
                <div className="flex-1 h-2 rounded-full bg-gray-100 relative">
                    <div className="h-full rounded-full bg-[#1A6CC8]" style={{ width: `${pct}%` }} />
                    <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-[#1A6CC8] border-2 border-white shadow" style={{ left: `calc(${pct}% - 7px)` }} />
                </div>
            )}
            <span className="text-xs font-bold text-[#0D2D5A] w-9 text-right shrink-0">{score}/{max}</span>
        </div>
    );
}
const NOTE_TYPES = [
    { value: "observation",    label: "Observation",    icon: Eye,          color: "text-slate-500" },
    { value: "recommandation", label: "Recommandation", icon: Lightbulb,    color: "text-[#1A6CC8]" },
    { value: "alerte",         label: "Alerte",          icon: AlertTriangle, color: "text-[#F5A623]" },
    { value: "positif",        label: "Positif",        icon: ThumbsUp,     color: "text-emerald-600" },
];

const STEPS = [
    { key: "compte",      label: "Compte élève" },
    { key: "rdv",         label: "Rendez-vous" },
    { key: "diagnostic",  label: "Diagnostic" },
    { key: "plan",        label: "Plan" },
    { key: "matching",    label: "Matching" },
] as const;

const FILTER_TABS = [
    { key: "toutes",      label: "Toutes" },
    { key: "prospects",   label: "Prospects" },
    { key: "parents",     label: "Inscrits" },
    { key: "a-qualifier", label: "À qualifier" },
] as const;

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    "nouveau":          { label: "Nouveau",        bg: "#EAF1FE", text: "#3B82F6", icon: Mail },
    "matching":         { label: "Matching",        bg: "#F3EEFE", text: "#8B5CF6", icon: GitMerge },
    "bilan planifié":   { label: "Bilan planifié",  bg: "#EAF1FE", text: "#3B82F6", icon: CalendarDays },
    "suivi actif":      { label: "Suivi actif",     bg: "#E6F7F4", text: "#0F9B8E", icon: CheckCircle2 },
    "à qualifier":      { label: "À qualifier",     bg: "#E6F7F4", text: "#0F9B8E", icon: Clock },
    "prospect":         { label: "Prospect",        bg: "#FEF3E2", text: "#F5A623", icon: AlertTriangle },
};

// FAM-15 : règle des onglets « Prospects » / « À qualifier ».
// Le serveur (/api/advisor/families) calcule `status` : "nouveau" (demande reçue, rien
// d'engagé), "matching" (assignation en attente ou demande en traitement),
// "bilan planifié" (demande assignée), "suivi actif" (assignation confirmée).
// - « Prospects » = toutes les familles sans compte élève, quel que soit leur statut.
// - « À qualifier » = prospects dont le statut est encore initial ("nouveau", vide ou
//   inconnu), donc pas encore en matching, assignés ou avec bilan planifié.
// La carte de stat « À qualifier » et le badge de ligne utilisent la même règle.
const isProspect = isProspectFamily;
const ADVANCED_STATUSES = ["matching", "bilan planifié", "suivi actif"];
const isInitialStatus = (status: unknown) => !ADVANCED_STATUSES.includes(String(status ?? ""));
const isToQualifyFamily = (f: any) => isProspectFamily(f) && isInitialStatus(f?.status);

// Badge de statut d'une ligne : un prospect affiche son vrai statut serveur s'il est
// avancé, sinon « À qualifier » ; un élève avec compte retombe sur « Nouveau ».
const getStatusBadge = (f: any) =>
    isProspectFamily(f)
        ? (isInitialStatus(f?.status) ? STATUS_BADGE["à qualifier"] : STATUS_BADGE[f.status])
        : (STATUS_BADGE[f?.status] || STATUS_BADGE["nouveau"]);

type SortKey = "family" | "child" | "status";
const SORT_VALUE: Record<SortKey, (f: any) => string> = {
    family: (f) => displayOr(f.parentName || f.parent, ""),
    child:  (f) => displayOr(f.childName || f.child, ""),
    status: (f) => getStatusBadge(f).label,
};

function StatCard({ icon: Icon, value, label, desc, bg }: { icon: any; value: string | number; label: string; desc: string; bg: string }) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
                <div className="text-2xl font-bold text-[#0D2D5A] leading-tight">{value}</div>
                <div className="text-sm font-bold text-[#0D2D5A]">{label}</div>
                <div className="text-[11px] text-gray-400 leading-tight">{desc}</div>
            </div>
        </div>
    );
}

export default function AdvisorFamilies() {
    const { user, token } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    // Selection
    const [searchTerm, setSearchTerm] = useState("");
    const [filterTab, setFilterTab] = useState<typeof FILTER_TABS[number]["key"]>("toutes");
    const [selectedFamily, setSelectedFamily] = useState<any>(null);

    // Notes
    const [noteContent, setNoteContent] = useState("");
    const [noteType, setNoteType] = useState("observation");
    const [showNoteForm, setShowNoteForm] = useState(false);

    // Active panel
    const [activePanel, setActivePanel] = useState<"notes" | "diagnostic" | "plan" | "matching">("notes");

    // Diagnostic form
    const [diagScores, setDiagScores] = useState<Record<string, number>>({});
    const [diagStrengths, setDiagStrengths] = useState("");
    const [diagWeaknesses, setDiagWeaknesses] = useState("");

    // Plan form
    const [planTitle, setPlanTitle] = useState("");
    const [planStart, setPlanStart] = useState("");
    const [planWeeks, setPlanWeeks] = useState([{ objective: "", subjects: [] as string[], done: false }]);

    // ──────────────────────────────────────────────────────────────────────
    // Helper : est-ce un prospect (pas encore de compte élève) ?
    // ──────────────────────────────────────────────────────────────────────
    const requestId  = getRequestId(selectedFamily);
    const studentId  = getStudentId(selectedFamily);
    const familySubjects = getFamilySubjects(selectedFamily);

    // Clé unifiée pour les queries (request ou student), partagée avec AdvisorBilanView
    const diagQueryKey  = diagnosticQueryKey(selectedFamily);
    const planQueryKey  = buildPlanQueryKey(selectedFamily);

    // ──────────────────────────────────────────────────────────────────────
    // Families list
    // ──────────────────────────────────────────────────────────────────────
    const { data: families = [], isLoading, isError, refetch } = useQuery({
        queryKey: ["advisorFamilies"],
        queryFn: fetchAdvisorFamilies,
    });

    // Auto-sélection si on arrive avec un requestId, familyId ou childName
    useEffect(() => {
        if (!families || families.length === 0) return;
        const targetReqId = location.state?.requestId || searchParams.get("requestId");
        const targetFamilyId = location.state?.familyId || searchParams.get("familyId");
        const targetChild = location.state?.childName || searchParams.get("child");
        const targetPanel = location.state?.defaultPanel || searchParams.get("panel");

        let found = null;
        if (targetReqId) {
            found = families.find((f: any) => String(f.id) === String(targetReqId));
        }
        if (!found && targetFamilyId) {
            found = families.find((f: any) => String(f.id) === String(targetFamilyId) || String(f.studentId) === String(targetFamilyId));
        }
        if (!found && targetChild) {
            found = families.find((f: any) =>
                (f.childName || f.child || "").toLowerCase().includes(targetChild.toLowerCase()) ||
                (f.parentName || f.parent || "").toLowerCase().includes(targetChild.toLowerCase())
            );
        }

        if (found) {
            setSelectedFamily(found);
            if (targetPanel && ["notes", "diagnostic", "plan", "matching"].includes(targetPanel)) {
                setActivePanel(targetPanel as any);
            }
        }
    }, [families, location.state, searchParams]);

    // ──────────────────────────────────────────────────────────────────────
    // Notes (uniquement pour les élèves avec compte)
    // ──────────────────────────────────────────────────────────────────────
    const { data: advisorNotes = [], isError: notesError, refetch: refetchNotes } = useQuery<any[]>({
        queryKey: notesQueryKey(studentId),
        queryFn: () => fetchNotes(studentId, token),
        enabled: !!studentId && !!token,
    });

    const addNoteMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API}/advisor-notes`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentId,
                    studentName: selectedFamily?.childName,
                    advisorId: user?.id,
                    advisorName: user?.name,
                    noteType,
                    content: noteContent,
                })
            });
            if (!res.ok) throw new Error("Echec ajout note");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["advisorNotes", studentId] });
            setNoteContent("");
            setShowNoteForm(false);
            toast.success("Note ajoutée");
        },
        onError: () => toast.error("Erreur lors de l'ajout de la note"),
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (noteId: string) => {
            const res = await fetch(`${API}/advisor-notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Echec suppression note");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["advisorNotes", studentId] });
            toast.success("Note supprimée");
        },
        onError: () => toast.error("Erreur lors de la suppression de la note"),
    });

    // ──────────────────────────────────────────────────────────────────────
    // Diagnostic — adapte l'endpoint selon prospect ou élève
    // ──────────────────────────────────────────────────────────────────────
    const diagUrl = diagnosticUrl(selectedFamily);

    const { data: diagnostic, isError: diagError, refetch: refetchDiag } = useQuery({
        queryKey: diagQueryKey,
        queryFn: () => fetchDiagnostic(selectedFamily, token),
        enabled: !!(isProspect(selectedFamily) ? requestId : studentId) && !!token,
    });

    const diagMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(diagUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentName: selectedFamily?.childName,
                    evaluatorId: user?.id,
                    evaluatorName: user?.name,
                    // Même valeur par défaut que l'affichage des curseurs (DEFAULT_DIAG_SCORE)
                    scores: Object.fromEntries(
                        familySubjects.map(subj => [subj, diagScores[subj] ?? DEFAULT_DIAG_SCORE])
                    ),
                    strengths: diagStrengths || null,
                    weaknesses: diagWeaknesses || null,
                })
            });
            if (!res.ok) throw new Error("Echec sauvegarde diagnostic");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: diagQueryKey });
            // Dossier académique (AcademicFile) et matching dérivent du même diagnostic
            if (studentId) {
                qc.invalidateQueries({ queryKey: ["studentDiagnostic", studentId] });
                qc.invalidateQueries({ queryKey: ["matching", studentId] });
            }
            setDiagScores({});
            setDiagStrengths("");
            setDiagWeaknesses("");
            toast.success("Diagnostic enregistré !");
        },
        onError: () => toast.error("Erreur lors de la sauvegarde du diagnostic"),
    });

    // ──────────────────────────────────────────────────────────────────────
    // Plan pédagogique — adapte l'endpoint selon prospect ou élève
    // ──────────────────────────────────────────────────────────────────────
    const planUrl = buildPlanUrl(selectedFamily);

    const { data: activePlan, isError: planError, refetch: refetchPlan } = useQuery({
        queryKey: planQueryKey,
        queryFn: () => fetchPlan(selectedFamily, token),
        enabled: !!(isProspect(selectedFamily) ? requestId : studentId) && !!token,
    });

    const planMutation = useMutation({
        mutationFn: async () => {
            const body = isProspect(selectedFamily)
                ? { title: planTitle, startDate: planStart, weeks: planWeeks, createdBy: user?.id }
                : { studentName: selectedFamily?.childName, createdBy: user?.id, title: planTitle, weeks: planWeeks, startDate: planStart };
            const res = await fetch(planUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(body)
            });
            if (!res.ok) throw new Error("Echec sauvegarde plan");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: planQueryKey });
            // Dossier académique (AcademicFile) lit le plan avec sa propre clé
            if (studentId) qc.invalidateQueries({ queryKey: ["studentPlan", studentId] });
            setPlanTitle("");
            setPlanStart("");
            setPlanWeeks([{ objective: "", subjects: [], done: false }]);
            toast.success("Plan pédagogique enregistré !");
        },
        onError: () => toast.error("Erreur lors de la sauvegarde du plan"),
    });

    // ──────────────────────────────────────────────────────────────────────
    // Matching (uniquement pour les élèves avec compte)
    // ──────────────────────────────────────────────────────────────────────
    const { data: matching, isFetching: matchFetching, isError: matchError, refetch: refetchMatching } = useQuery({
        queryKey: ["matching", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/advisor/match/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error("Impossible de charger le matching");
            return res.json();
        },
        enabled: !!studentId && !!token && activePanel === "matching",
    });

    // ──────────────────────────────────────────────────────────────────────
    // Conversion prospect → élève
    // ──────────────────────────────────────────────────────────────────────
    const convertMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API}/requests/${requestId}/convert`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            });
            // Parse protégé : une 502 HTML ne doit pas afficher "Unexpected token <"
            const data = await readJsonSafe(res);
            if (!res.ok) {
                // 409 = compte déjà existant
                throw new Error(data?.message || "Erreur lors de la conversion. Veuillez réessayer.");
            }
            return data ?? {};
        },
        onSuccess: (data) => {
            toast.success(`Compte élève créé. Email temporaire : ${data.studentEmail}`);
            qc.invalidateQueries({ queryKey: ["advisorFamilies"] });
            // Compteurs du tableau de bord conseiller et liste des demandes
            qc.invalidateQueries({ queryKey: ["advisorDashboard"] });
            qc.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            setSelectedFamily(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // ──────────────────────────────────────────────────────────────────────
    // Filtre (recherche + onglets)
    // ──────────────────────────────────────────────────────────────────────
    const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" } | null>(null);
    const [bilanFamily, setBilanFamily] = useState<any>(null);
    const [page, setPage] = useState(1);

    useEffect(() => { setPage(1); }, [searchTerm, filterTab, sort]);

    const toggleSort = (key: SortKey) =>
        setSort(prev => (prev?.key === key && prev.dir === "asc" ? { key, dir: "desc" } : { key, dir: "asc" }));

    const filteredFamilies = (Array.isArray(families) ? families : []).filter((f: any) => {
        const pName = (f.parentName || f.parent || "").toLowerCase();
        const cName = (f.childName || f.child || "").toLowerCase();
        const term = searchTerm.trim().toLowerCase();
        if (term && !pName.includes(term) && !cName.includes(term)) return false;

        const fp = isProspect(f);
        if (filterTab === "prospects" && !fp) return false;
        if (filterTab === "parents" && fp) return false;
        if (filterTab === "a-qualifier" && !isToQualifyFamily(f)) return false;
        return true;
    });

    const ariaSort = (key: SortKey): "ascending" | "descending" | "none" =>
        sort?.key === key ? (sort.dir === "asc" ? "ascending" : "descending") : "none";
    const sortButton = (key: SortKey, label: string) => {
        const Icon = sort?.key === key ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
        return (
            <button
                type="button"
                onClick={() => toggleSort(key)}
                className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-[#0D2D5A] transition-colors"
            >
                {label} <Icon className={cn("w-3 h-3", sort?.key === key && "text-[#0D2D5A]")} />
            </button>
        );
    };

    // Tri sur la liste filtrée. Array.prototype.sort est stable : à valeur égale,
    // l'ordre d'origine est conservé (le sens desc inverse le comparateur, pas le tableau).
    const sortedFamilies = sort
        ? [...filteredFamilies].sort((a: any, b: any) => {
            const cmp = SORT_VALUE[sort.key](a).localeCompare(SORT_VALUE[sort.key](b), "fr", { sensitivity: "base" });
            return sort.dir === "asc" ? cmp : -cmp;
        })
        : filteredFamilies;

    const totalPages = Math.max(1, Math.ceil(sortedFamilies.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pagedFamilies = sortedFamilies.slice(pageStart, pageStart + PAGE_SIZE);

    const stats = useMemo(() => {
        const list = Array.isArray(families) ? families : [];
        return {
            total: list.length,
            toQualify: list.filter((f: any) => isToQualifyFamily(f)).length,
            activeFollowups: list.filter((f: any) => !isProspect(f) && f.status === "suivi actif").length,
        };
    }, [families]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#0F9B8E] w-10 h-10" />
                <p className="text-gray-400 text-sm mt-4">Chargement des élèves...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between text-sm text-red-700">
                    <span>Impossible de charger les élèves. Service temporairement indisponible.</span>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            </div>
        );
    }

    const prospect = isProspect(selectedFamily);

    // Statut d'avancement du dossier sélectionné, pour le stepper du panneau de droite
    const stepDone = selectedFamily ? [
        !prospect,
        displayOr(selectedFamily.nextRdv, "") !== "",
        !!(diagnostic as any)?.id,
        !!(activePlan as any)?.id,
        !prospect && !["", "Non assigné"].includes(displayOr(selectedFamily.teacherName, "")),
    ] : [false, false, false, false, false];
    const currentStepIdx = stepDone.findIndex(d => !d);
    const activeStepIdx = currentStepIdx === -1 ? STEPS.length - 1 : currentStepIdx;

    return (
        <div className="p-4 md:px-8 md:pb-8 md:pt-0 space-y-5 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Suivi des élèves</h1>
                <p className="text-gray-500 text-sm mt-0.5">Suivez le parcours de chaque élève, de la demande à l'affectation d'un tuteur.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Colonne gauche : stats + liste */}
                <div className="xl:col-span-6 flex flex-col gap-5">
                    {/* Cartes statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon={Users} value={stats.total} label="Élèves" desc="Total des élèves suivis" bg="#0D2D5A" />
                        <StatCard icon={UserCircle2} value={stats.toQualify} label="À qualifier" desc="Nécessitent un suivi rapproché" bg="#F5A623" />
                        <StatCard icon={TrendingUp} value={stats.activeFollowups} label="Suivis actifs" desc="En accompagnement" bg="#0F9B8E" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Recherche + onglets de filtre */}
                        <div className="flex flex-col md:flex-row md:items-center gap-3 px-6 py-4 border-b border-gray-100">
                            <div className="relative flex-1 max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un élève ou un parent..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F9B8E]/20 focus:border-[#0F9B8E] transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                                {FILTER_TABS.map(tab => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setFilterTab(tab.key)}
                                        className={cn(
                                            "px-3.5 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap",
                                            filterTab === tab.key
                                                ? "bg-[#0D2D5A] text-white"
                                                : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tableau */}
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[640px] table-fixed text-sm">
                                <colgroup>
                                    <col className="w-[28%]" />
                                    <col className="w-[24%]" />
                                    <col className="w-[19%]" />
                                    <col className="w-[20%]" />
                                    <col className="w-[9%]" />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
                                        <th aria-sort={ariaSort("child")} className="pl-5 pr-3 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            {sortButton("child", "Élève")}
                                        </th>
                                        <th aria-sort={ariaSort("family")} className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            {sortButton("family", "Parent / Contact")}
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">Tuteur assigné</th>
                                        <th aria-sort={ariaSort("status")} className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            {sortButton("status", "Statut")}
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {pagedFamilies.map((f: any) => {
                                        const fp = isProspect(f);
                                        const isSelected = selectedFamily?.id === f.id;
                                        return (
                                            <tr
                                                key={f.id}
                                                onClick={() => { setSelectedFamily(f); setActivePanel("notes"); }}
                                                className={cn(
                                                    "cursor-pointer transition-colors hover:bg-gray-50/70",
                                                    isSelected && "bg-[#0F9B8E]/[0.06]"
                                                )}
                                                style={isSelected ? { boxShadow: "inset 3px 0 0 #0F9B8E" } : undefined}
                                            >
                                                <td className="pl-5 pr-3 py-3.5">
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0",
                                                            isSelected
                                                                ? (fp ? "bg-[#F5A623] text-white" : "bg-[#0D2D5A] text-white")
                                                                : "bg-gray-50 border border-gray-100 text-[#0D2D5A]"
                                                        )}>
                                                            {displayOr(f.childName || f.child, "?").charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                <span className="font-bold text-[#0D2D5A] truncate" title={displayOr(f.childName || f.child, "Élève non renseigné")}>{displayOr(f.childName || f.child, "Élève non renseigné")}</span>
                                                                {fp ? (
                                                                    <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 rounded-md uppercase tracking-wide font-bold">Prospect</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="shrink-0 border-gray-200 text-gray-400 font-bold text-[9px] px-1.5 rounded-md uppercase tracking-wide">Inscrit</Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-400 block truncate">Niveau : {displayOr(f.level)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium min-w-0">
                                                        <Users className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                                        <span className="truncate" title={displayOr(f.parentName || f.parent, "Parent non renseigné")}>{displayOr(f.parentName || f.parent, "Parent non renseigné")}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1 min-w-0">
                                                        <MessageCircle className="w-3 h-3 shrink-0" /> <span className="truncate">{displayOr(f.parentEmail || f.email)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium min-w-0">
                                                        <UserCircle2 className="w-3.5 h-3.5 text-gray-300 shrink-0" />
                                                        <span className="truncate">{fp ? "Non assigné" : displayOr(f.teacherName || f.teacher, "Non assigné")}</span>
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">{fp ? "Prospect" : "Tuteur"}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {(() => {
                                                        const badge = getStatusBadge(f);
                                                        const BadgeIcon = badge.icon;
                                                        return (
                                                            <span
                                                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap"
                                                                style={{ background: badge.bg, color: badge.text }}
                                                            >
                                                                <BadgeIcon className="w-3.5 h-3.5" /> {badge.label}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 hover:bg-[#0D2D5A] hover:text-white transition-all ml-auto">
                                                        <ChevronRight className="w-4 h-4" />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredFamilies.length === 0 && (
                                <div className="px-6 py-16 text-center">
                                    <SearchCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 italic">Aucun élève ne correspond à votre recherche.</p>
                                </div>
                            )}
                        </div>

                        {sortedFamilies.length > PAGE_SIZE && (
                            <nav aria-label="Pagination des élèves" className="flex items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
                                <p className="text-xs text-gray-400">
                                    <span className="font-bold text-[#0D2D5A]">{pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, sortedFamilies.length)}</span> sur {sortedFamilies.length} élèves
                                </p>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        aria-label="Page précédente"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                        <button
                                            key={n}
                                            type="button"
                                            onClick={() => setPage(n)}
                                            aria-current={n === currentPage ? "page" : undefined}
                                            className={cn(
                                                "min-w-8 h-8 px-2 rounded-full text-xs font-bold transition-colors",
                                                n === currentPage ? "bg-[#0D2D5A] text-white" : "text-gray-500 hover:bg-gray-100"
                                            )}
                                        >
                                            {n}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => setPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        aria-label="Page suivante"
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </nav>
                        )}
                    </div>
                </div>

                {/* Colonne droite : fiche détaillée */}
                <div className="xl:col-span-6">
                    {selectedFamily ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Header fiche */}
                            <div className="p-5 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                    <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shrink-0",
                                        prospect ? "bg-[#F5A623]" : "bg-[#0D2D5A]"
                                    )}>
                                        {displayOr(selectedFamily.childName || selectedFamily.child, "?").charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base font-bold text-[#0D2D5A] uppercase truncate">
                                            {displayOr(selectedFamily.childName || selectedFamily.child, "Élève non renseigné")}
                                        </h2>
                                        <p className="text-sm text-gray-400 mt-0.5">
                                            {selectedFamily.level || "Niveau non défini"}{selectedFamily.subject ? ` · ${selectedFamily.subject}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold text-white",
                                    prospect ? "bg-[#F5A623]" : "bg-[#0F9B8E]"
                                )}>
                                    {prospect && <AlertTriangle className="w-3.5 h-3.5" />}
                                    {prospect ? "Prospect" : "Inscrit"}
                                </span>
                            </div>

                            {/* Infos rapides : élève / tuteur / date */}
                            <div className="flex items-center flex-wrap gap-x-5 gap-y-3 px-5 pb-5 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-gray-300 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-[#0D2D5A] leading-tight">{displayOr(selectedFamily.parentName || selectedFamily.parent, "Parent non renseigné")}</p>
                                        <p className="text-[10px] text-gray-400 leading-tight truncate">Parent · {displayOr(selectedFamily.parentEmail || selectedFamily.email)}</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="flex items-center gap-2">
                                    <UserCircle2 className="w-4 h-4 text-gray-300 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-[#0D2D5A] leading-tight">{prospect ? "Non assigné" : displayOr(selectedFamily.teacherName || selectedFamily.teacher, "Non assigné")}</p>
                                        <p className="text-[10px] text-gray-400 leading-tight">Tuteur assigné</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-gray-300 shrink-0" />
                                    <div>
                                        <p className="text-xs font-bold text-[#0D2D5A] leading-tight">{displayOr(selectedFamily.requestDate)}</p>
                                        <p className="text-[10px] text-gray-400 leading-tight">Date de la demande</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stepper de progression */}
                            <div className="px-5 pt-5">
                                <div className="flex items-center">
                                    {STEPS.map((s, i) => (
                                        <div key={s.key} className="flex-1 flex items-center last:flex-none">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={cn(
                                                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                                                    stepDone[i] ? "bg-[#0F9B8E] text-white" :
                                                    i === activeStepIdx ? "bg-[#0F9B8E] text-white" :
                                                    "bg-gray-100 text-gray-400"
                                                )}>
                                                    {stepDone[i] ? <Check className="w-4 h-4" /> : i + 1}
                                                </div>
                                                <span className="text-[10px] font-bold text-gray-500 text-center leading-tight max-w-[60px]">{s.label}</span>
                                            </div>
                                            {i < STEPS.length - 1 && (
                                                <div className={cn("flex-1 h-0.5 mx-1 mb-4", stepDone[i] ? "bg-[#0F9B8E]" : "bg-gray-100")} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="p-4 md:p-5 space-y-4">
                                {/* Alerte étape courante */}
                                {activeStepIdx < STEPS.length && !stepDone[activeStepIdx] && (
                                    <div className="p-4 bg-[#FEF3E2] rounded-xl border border-[#FBE0B8] flex gap-3">
                                        <div className="w-7 h-7 rounded-full bg-[#F5A623] flex items-center justify-center shrink-0">
                                            <AlertTriangle className="w-4 h-4 text-white" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-[#B5650A]">Étape {activeStepIdx + 1} : {STEPS[activeStepIdx].label}</p>
                                            <p className="text-xs text-[#B5650A]/80 leading-relaxed mt-1">
                                                {activeStepIdx === 0 && "Créez les comptes parent & élève pour débloquer toutes les fonctionnalités."}
                                                {activeStepIdx === 1 && "Planifiez un premier rendez-vous avec la famille."}
                                                {activeStepIdx === 2 && "Évaluez le niveau de l'élève dans chaque matière pour personnaliser son parcours de formation et préparer le plan d'accompagnement."}
                                                {activeStepIdx === 3 && "Construisez le plan pédagogique personnalisé de l'élève."}
                                                {activeStepIdx === 4 && "Confirmez l'affectation d'un enseignant adapté au profil de l'élève."}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* CTA : Créer le compte élève (prospect uniquement) */}
                                {prospect && (
                                    <Button
                                        disabled={convertMutation.isPending}
                                        onClick={() => convertMutation.mutate()}
                                        className="w-full h-10 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black uppercase tracking-widest rounded-xl gap-2"
                                    >
                                        {convertMutation.isPending ? (
                                            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Création...</>
                                        ) : (
                                            <><UserPlus className="w-3.5 h-3.5" /> Créer le compte élève</>
                                        )}
                                    </Button>
                                )}

                                {/* Bouton Planifier RDV */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigate("/advisor/schedule", {
                                        state: {
                                            familyName: selectedFamily.parentName || selectedFamily.parent,
                                            childName: selectedFamily.childName || selectedFamily.child,
                                            type: prospect ? "Bilan pédagogique initial" : "Suivi régulier",
                                        }
                                    })}
                                    className="w-full text-xs font-bold text-[#0F9B8E] border-[#0F9B8E]/30 hover:bg-[#0F9B8E]/5 gap-2 h-10 rounded-xl"
                                >
                                    <CalendarDays className="w-3.5 h-3.5" /> Planifier un rendez-vous
                                </Button>

                                {/* Tabs navigation */}
                                <div className="flex border border-gray-100 rounded-xl overflow-hidden">
                                    {([
                                        { key: "notes",      label: "Notes", icon: FileText },
                                        { key: "diagnostic", label: "Diag.", icon: ClipboardCheck },
                                        { key: "plan",       label: "Plan",  icon: CalendarRange },
                                        { key: "matching",   label: "Match", icon: Zap },
                                    ] as const).map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActivePanel(key)}
                                            disabled={key === "matching" && prospect}
                                            className={cn(
                                                "flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors",
                                                activePanel === key ? "bg-[#0D2D5A] text-white" : "text-gray-400 hover:bg-gray-50",
                                                key === "matching" && prospect ? "opacity-30 cursor-not-allowed" : ""
                                            )}
                                        >
                                            <Icon className="w-3 h-3" /> {label}
                                        </button>
                                    ))}
                                </div>

                                {/* ── Panel Notes ── */}
                                {activePanel === "notes" && (
                                    <div className="space-y-2">
                                        {prospect && (
                                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 text-[9px] text-blue-600 font-semibold flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Notes disponibles uniquement après création du compte élève.
                                            </div>
                                        )}
                                        {!prospect && (
                                            <>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                                        Observations{notesError ? "" : ` (${advisorNotes.length})`}
                                                    </p>
                                                    <button
                                                        onClick={() => setShowNoteForm(!showNoteForm)}
                                                        className="text-[9px] font-black text-[#0F9B8E] uppercase tracking-widest flex items-center gap-1"
                                                    >
                                                        <PlusCircle className="w-3 h-3" /> Ajouter
                                                    </button>
                                                </div>
                                                {showNoteForm && (
                                                    <div className="space-y-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex gap-1 flex-wrap">
                                                            {NOTE_TYPES.map(nt => (
                                                                <button
                                                                    key={nt.value}
                                                                    onClick={() => setNoteType(nt.value)}
                                                                    className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest border rounded-md transition-colors flex items-center gap-1 ${
                                                                        noteType === nt.value ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "bg-white text-slate-400 border-slate-200"
                                                                    }`}
                                                                >
                                                                    <nt.icon className="w-2.5 h-2.5" /> {nt.label}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        <textarea
                                                            value={noteContent}
                                                            onChange={e => setNoteContent(e.target.value)}
                                                            rows={3}
                                                            placeholder="Votre observation..."
                                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[#0F9B8E] resize-none"
                                                        />
                                                        <button
                                                            disabled={!noteContent.trim() || addNoteMutation.isPending}
                                                            onClick={() => addNoteMutation.mutate()}
                                                            className="w-full h-8 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                                                        >
                                                            {addNoteMutation.isPending ? "..." : "Enregistrer"}
                                                        </button>
                                                    </div>
                                                )}
                                                {notesError && (
                                                    <PanelError message="Impossible de charger les notes." onRetry={() => refetchNotes()} />
                                                )}
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {!notesError && advisorNotes.map((note: any) => {
                                                        const nt = NOTE_TYPES.find(n => n.value === note.note_type) || NOTE_TYPES[0];
                                                        return (
                                                            <div key={note.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100 group">
                                                                <nt.icon className={`w-3 h-3 mt-0.5 flex-shrink-0 ${nt.color}`} />
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-[10px] font-bold text-[#0D2D5A] leading-relaxed">{note.content}</p>
                                                                    <p className="text-[8px] text-gray-300 mt-0.5">{new Date(note.created_at).toLocaleDateString("fr-FR")}</p>
                                                                </div>
                                                                <button
                                                                    onClick={() => deleteNoteMutation.mutate(note.id)}
                                                                    disabled={deleteNoteMutation.isPending}
                                                                    aria-label="Supprimer la note"
                                                                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 text-[8px] font-black transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {!notesError && advisorNotes.length === 0 && !showNoteForm && (
                                                        <p className="text-[9px] text-gray-300 italic px-1">Aucune observation enregistrée</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}

                                {/* ── Panel Diagnostic ── */}
                                {activePanel === "diagnostic" && (
                                    <div className="space-y-3">
                                        {prospect && (
                                            <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-100 mb-1">
                                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                <p className="text-[9px] text-amber-700 font-semibold">Diagnostic prospect : sera migré vers le compte élève lors de la conversion.</p>
                                            </div>
                                        )}
                                        {diagError ? (
                                            <PanelError message="Impossible de charger le diagnostic." onRetry={() => refetchDiag()} />
                                        ) : diagnostic && (diagnostic as any).id ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        Diagnostic enregistré · {new Date((diagnostic as any).created_at).toLocaleDateString("fr-FR")}
                                                    </p>
                                                </div>
                                                <p className="text-sm font-bold text-[#0D2D5A] pt-1">Niveau des matières</p>
                                                <div className="space-y-3">
                                                    {Object.entries((diagnostic as any).scores || {}).map(([subj, score]: any) => (
                                                        <SubjectBar key={subj} subject={subj} score={Number(score)} />
                                                    ))}
                                                </div>
                                                {((diagnostic as any).strengths || (diagnostic as any).weaknesses) && (
                                                    <div className="grid grid-cols-2 gap-3 pt-1">
                                                        <div>
                                                            <p className="text-xs font-bold text-[#0D2D5A] mb-1">Points forts</p>
                                                            <p className="text-[11px] text-gray-500 leading-relaxed">{(diagnostic as any).strengths || NOT_PROVIDED}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-[#0D2D5A] mb-1">Points à renforcer</p>
                                                            <p className="text-[11px] text-gray-500 leading-relaxed">{(diagnostic as any).weaknesses || NOT_PROVIDED}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Après le diagnostic : CTA Matching ou Lancer matching */}
                                                <button
                                                    onClick={() => {
                                                        if (prospect) {
                                                            navigate("/advisor/matching", {
                                                                state: { childName: selectedFamily.childName || selectedFamily.child, level: selectedFamily.level, subject: selectedFamily.subject }
                                                            });
                                                        } else {
                                                            setActivePanel("matching");
                                                        }
                                                    }}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg text-[10px] font-black hover:bg-violet-100 transition-colors mt-1"
                                                >
                                                    <GitMerge className="w-3 h-3" /> Lancer le matching
                                                </button>
                                                <button
                                                    onClick={() => qc.setQueryData(diagQueryKey, null)}
                                                    className="text-[9px] font-black text-[#0F9B8E] uppercase tracking-widest"
                                                >
                                                    + Nouveau diagnostic
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <p className="text-sm font-bold text-[#0D2D5A]">Niveau des matières</p>
                                                <div className="space-y-3">
                                                    {familySubjects.map(subj => (
                                                        <SubjectBar
                                                            key={subj}
                                                            subject={subj}
                                                            score={diagScores[subj] ?? DEFAULT_DIAG_SCORE}
                                                            editable
                                                            onChange={v => setDiagScores(prev => ({ ...prev, [subj]: v }))}
                                                        />
                                                    ))}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 pt-1">
                                                    <div>
                                                        <p className="text-xs font-bold text-[#0D2D5A] mb-1.5">Points forts</p>
                                                        <div className="relative">
                                                            <textarea
                                                                value={diagStrengths}
                                                                onChange={e => setDiagStrengths(e.target.value.slice(0, 200))}
                                                                rows={3}
                                                                maxLength={200}
                                                                placeholder="Ex : bonne compréhension, rigueur..."
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1A6CC8] resize-none"
                                                            />
                                                            <span className="absolute bottom-1.5 right-2 text-[9px] text-gray-300">{diagStrengths.length}/200</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-[#0D2D5A] mb-1.5">Points à renforcer</p>
                                                        <div className="relative">
                                                            <textarea
                                                                value={diagWeaknesses}
                                                                onChange={e => setDiagWeaknesses(e.target.value.slice(0, 200))}
                                                                rows={3}
                                                                maxLength={200}
                                                                placeholder="Ex : exercices, expression écrite..."
                                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#1A6CC8] resize-none"
                                                            />
                                                            <span className="absolute bottom-1.5 right-2 text-[9px] text-gray-300">{diagWeaknesses.length}/200</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={diagMutation.isPending}
                                                    onClick={() => diagMutation.mutate()}
                                                    className="w-full h-12 bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white text-sm font-bold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {diagMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                    {diagMutation.isPending ? "Enregistrement..." : "Enregistrer le diagnostic"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Panel Plan Pédagogique ── */}
                                {activePanel === "plan" && (
                                    <div className="space-y-3">
                                        {prospect && (
                                            <div className="flex items-center gap-1.5 p-2 bg-amber-50 rounded-lg border border-amber-100 mb-1">
                                                <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0" />
                                                <p className="text-[9px] text-amber-700 font-semibold">Plan prospect : sera migré vers le compte élève lors de la conversion.</p>
                                            </div>
                                        )}
                                        {planError ? (
                                            <PanelError message="Impossible de charger le plan pédagogique." onRetry={() => refetchPlan()} />
                                        ) : activePlan && (activePlan as any).id ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-black text-[#0D2D5A]">{(activePlan as any).title}</p>
                                                    <span className="text-[8px] font-bold text-[#0F9B8E] bg-[#0F9B8E]/10 px-1.5 py-0.5 rounded">Actif</span>
                                                </div>
                                                <p className="text-[9px] text-gray-400">Début : {new Date((activePlan as any).start_date).toLocaleDateString("fr-FR")}</p>
                                                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                                                    {((activePlan as any).weeks || []).map((w: any, i: number) => (
                                                        <div key={i} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                            <div className={`w-4 h-4 flex-shrink-0 rounded-full border-2 mt-0.5 ${w.done ? "bg-emerald-500 border-emerald-500" : "border-gray-300"}`} />
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase">Semaine {i + 1}</p>
                                                                <p className="text-[10px] font-bold text-[#0D2D5A]">{w.objective}</p>
                                                                {w.subjects?.length > 0 && (
                                                                    <div className="flex gap-1 mt-0.5 flex-wrap">
                                                                        {w.subjects.map((s: string) => (
                                                                            <span key={s} className="text-[8px] bg-[#0F9B8E]/10 text-[#0F9B8E] px-1 rounded font-bold">{s}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => qc.setQueryData(planQueryKey, null)}
                                                    className="text-[9px] font-black text-[#0F9B8E] uppercase tracking-widest"
                                                >
                                                    + Nouveau plan
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={planTitle}
                                                    onChange={e => setPlanTitle(e.target.value)}
                                                    placeholder="Titre du plan..."
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[#0F9B8E]"
                                                />
                                                <input
                                                    type="date"
                                                    value={planStart}
                                                    onChange={e => setPlanStart(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[#0F9B8E]"
                                                />
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Semaines</p>
                                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                                    {planWeeks.map((week, i) => (
                                                        <div key={i} className="p-2 bg-gray-50 rounded-lg border border-gray-100 space-y-1.5">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase">S{i + 1}</span>
                                                                {planWeeks.length > 1 && (
                                                                    <button
                                                                        onClick={() => setPlanWeeks(prev => prev.filter((_, j) => j !== i))}
                                                                        className="text-red-300 hover:text-red-500"
                                                                    >
                                                                        <Trash2 className="w-2.5 h-2.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                value={week.objective}
                                                                onChange={e => setPlanWeeks(prev => prev.map((w, j) => j === i ? { ...w, objective: e.target.value } : w))}
                                                                placeholder="Objectif de la semaine..."
                                                                className="w-full border border-gray-200 rounded px-2 py-1 text-[10px] outline-none focus:border-[#0F9B8E]"
                                                            />
                                                            <div className="flex gap-1 flex-wrap">
                                                                {familySubjects.map(s => (
                                                                    <button
                                                                        key={s}
                                                                        onClick={() => setPlanWeeks(prev => prev.map((w, j) => j === i ? {
                                                                            ...w,
                                                                            subjects: w.subjects.includes(s) ? w.subjects.filter(x => x !== s) : [...w.subjects, s]
                                                                        } : w))}
                                                                        className={`text-[8px] font-black px-1.5 py-0.5 rounded border transition-colors ${
                                                                            week.subjects.includes(s) ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "bg-white text-gray-400 border-gray-200"
                                                                        }`}
                                                                    >
                                                                        {s.slice(0, 4)}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => setPlanWeeks(prev => [...prev, { objective: "", subjects: [], done: false }])}
                                                    className="w-full h-7 border border-dashed border-[#0F9B8E]/40 text-[#0F9B8E] text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#0F9B8E]/5 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <PlusCircle className="w-3 h-3" /> Ajouter une semaine
                                                </button>
                                                <button
                                                    disabled={!planTitle.trim() || !planStart || planMutation.isPending}
                                                    onClick={() => planMutation.mutate()}
                                                    className="w-full h-8 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                                                >
                                                    {planMutation.isPending ? "..." : "Enregistrer le plan"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* ── Panel Matching ── */}
                                {activePanel === "matching" && !prospect && (
                                    <div className="space-y-2">
                                        {matchFetching ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="w-5 h-5 animate-spin text-[#0F9B8E]/40" />
                                            </div>
                                        ) : matchError ? (
                                            <PanelError message="Impossible de charger les tuteurs recommandés." onRetry={() => refetchMatching()} />
                                        ) : matching?.matches?.length > 0 ? (
                                            <>
                                                {matching.student?.weakSubjects?.length > 0 && (
                                                    <div className="p-2 bg-red-50 rounded-lg border border-red-100 mb-2">
                                                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-0.5">Matières à renforcer</p>
                                                        <div className="flex gap-1 flex-wrap">
                                                            {matching.student.weakSubjects.map((s: string) => (
                                                                <span key={s} className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">{s}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tuteurs recommandés</p>
                                                {matching.matches.map((t: any, i: number) => (
                                                    <div key={t.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[8px] font-black text-white ${i === 0 ? "bg-[#F5A623]" : "bg-[#0F9B8E]/30 text-[#0F9B8E]"}`}>{i + 1}</div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className="text-[11px] font-black text-[#0D2D5A]">{t.name}</p>
                                                                <div className="flex items-center gap-0.5">
                                                                    <Star className="w-2.5 h-2.5 text-[#F5A623] fill-[#F5A623]" />
                                                                    <span className="text-[9px] font-black text-[#0D2D5A]">{t.perf?.toFixed(1)}</span>
                                                                </div>
                                                            </div>
                                                            <p className="text-[8px] text-gray-400 mt-0.5">{new Intl.NumberFormat("fr-FR").format(t.rate)} FCFA/h · Score : {t.score}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={() => navigate("/advisor/matching", {
                                                        state: { childName: selectedFamily.childName || selectedFamily.child, level: selectedFamily.level, subject: selectedFamily.subject }
                                                    })}
                                                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg text-[10px] font-black hover:bg-violet-100 transition-colors mt-1"
                                                >
                                                    <GitMerge className="w-3 h-3" /> Confirmer l'assignation
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-[9px] text-gray-300 italic text-center py-6">Aucun tuteur disponible pour le moment</p>
                                        )}
                                    </div>
                                )}

                                {/* ── Dossier Académique (élèves avec compte uniquement) ── */}
                                {!prospect && (
                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                        <h3 className="text-[12px] font-black text-[#0D2D5A] uppercase tracking-widest mb-4">Dossier Académique</h3>
                                        <AcademicFile studentId={studentId} />
                                    </div>
                                )}

                                {/* CTA bas de fiche */}
                                <div className="pt-2 space-y-2 mt-4">
                                    {selectedFamily?.phone && (
                                        <a
                                            href={`tel:${selectedFamily.phone}`}
                                            className="w-full flex items-center justify-center gap-2 bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white font-bold h-11 rounded-xl shadow-sm transition-colors text-sm"
                                        >
                                            <Phone className="w-4 h-4" /> Appeler la famille
                                        </a>
                                    )}
                                    {!prospect && (
                                        <Button
                                            onClick={() => selectedFamily.parentId
                                                // FAM-08 : Messages.tsx présélectionne le contact via location.state.contactId
                                                ? navigate("/advisor/messages", {
                                                    state: {
                                                        contactId: selectedFamily.parentId,
                                                        contactName: displayOr(selectedFamily.parentName || selectedFamily.parent, ""),
                                                    },
                                                })
                                                : navigate("/advisor/messages")}
                                            className="w-full bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white font-bold h-11 rounded-xl shadow-sm gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Contacter la famille
                                        </Button>
                                    )}
                                    <Button
                                        variant="outline"
                                        onClick={() => setBilanFamily(selectedFamily)}
                                        className="w-full border-gray-200 text-gray-500 font-bold h-11 rounded-xl hover:bg-gray-50 gap-2"
                                    >
                                        <FileText className="w-4 h-4" /> Bilan Conseil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center h-full min-h-[500px] flex flex-col items-center justify-center space-y-4">
                            <Users className="w-12 h-12 text-gray-100" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-300 italic">Fiche élève</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[220px] mx-auto leading-relaxed text-center">
                                    Sélectionnez un élève pour accéder à son dossier détaillé et à l'affectation de son tuteur.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {bilanFamily && (
                <AdvisorBilanView family={bilanFamily} onClose={() => setBilanFamily(null)} />
            )}
        </div>
    );
}
