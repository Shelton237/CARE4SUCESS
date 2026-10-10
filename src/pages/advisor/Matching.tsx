import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeftRight, Search, ListChecks, Sparkles, History, RotateCcw, SlidersHorizontal, ChevronDown, ChevronUp,
    List, LayoutGrid, MapPin, Star, Briefcase, Check, Mail, MoreVertical, Loader2, RefreshCw, ChevronLeft,
    ChevronRight, UserPlus, Eye, AlertTriangle, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
    AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const API = import.meta.env.VITE_API_URL || "/api";
const NAVY = "#0D2D5A";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const SELECT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none focus:border-[#0D2D5A] focus:ring-2 focus:ring-[#0D2D5A]/10";
const LABEL = "text-xs font-semibold text-[#0D2D5A] mb-1.5 block";

type Reason = { key: string; ok: boolean; partial?: boolean; label: string };
type Tutor = {
    id: string; name: string; subjects: string[]; city: string; status: string | null; yearsExperience: number | null;
    languages: string[]; specialties: string[]; hasAvailability: boolean; rate: number; currency: string;
    reviewCount: number; reviewAvg: number | null; alreadyAssigned: boolean; score: number; reasons: Reason[];
    profile?: { percent: number; missing: string[] };
};
type StudentInfo = {
    id: string; name: string; subject: string | null; level: string | null; city: string; hasDiagnostic: boolean;
    scores: Record<string, number>; prioritySubjects: string[]; consolidateSubjects: string[];
};
type Item = { student: StudentInfo; assignedTeachers: { id: string; name: string }[]; matches: Tutor[] };
type Row = { key: string; student: StudentInfo; tutor: Tutor; rank: number; assigned: { id: string; name: string }[] };

const PALETTE = [
    { bg: "#F3E8FF", fg: "#7C3AED" }, { bg: "#DCFCE7", fg: "#15803D" }, { bg: "#FCE7F3", fg: "#BE185D" },
    { bg: "#DBEAFE", fg: "#1D4ED8" }, { bg: "#FEF3C7", fg: "#B45309" }, { bg: "#E0F2FE", fg: "#0369A1" },
];
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const tone = (name = "") => PALETTE[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
// Langues / compétences peuvent être du texte ou des objets ({ name, level }...) selon le profil public.
const asLabel = (v: unknown): string =>
    typeof v === "string" ? v : v && typeof v === "object" ? String((v as any).name ?? (v as any).language ?? (v as any).label ?? (v as any).title ?? "") : String(v ?? "");
const labels = (list: unknown): string[] => (Array.isArray(list) ? list.map(asLabel).filter(Boolean) : []);
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Besoin de l'élève, lu dans le diagnostic (grille 0-5)
const needBadge = (s: StudentInfo) => {
    if (!s.hasDiagnostic) return { label: "Diagnostic à faire", cls: "bg-gray-100 text-gray-500" };
    const values = Object.values(s.scores || {}).map(Number).filter(v => v > 0);
    if (values.some(v => v <= 1)) return { label: "Besoins spécifiques", cls: "bg-amber-50 text-amber-700" };
    if (s.prioritySubjects.length) return { label: "En difficulté", cls: "bg-red-50 text-red-600" };
    if (s.consolidateSubjects.length) return { label: "Niveau intermédiaire", cls: "bg-blue-50 text-blue-700" };
    if (values.length && values.every(v => v >= 5)) return { label: "En avance", cls: "bg-purple-50 text-purple-700" };
    return { label: "Bon niveau", cls: "bg-emerald-50 text-emerald-700" };
};

const statusBadge = (t: Tutor) =>
    t.alreadyAssigned ? { label: "Affecté", cls: "bg-[#0F9B8E]/10 text-[#0F9B8E]", dot: "#0F9B8E" }
        : t.hasAvailability ? { label: "Disponible", cls: "bg-emerald-50 text-emerald-700", dot: "#16A34A" }
        : { label: "En attente", cls: "bg-amber-50 text-amber-700", dot: "#D97706" };

// Les 3 critères affichés sous "Correspondance", tirés du détail du score serveur
const criteria = (t: Tutor) => {
    const by = (k: string) => t.reasons.find(r => r.key === k);
    const subject = by("priority") || by("consolidate") || by("subject");
    return [
        { label: "Même matière", ok: !!subject?.ok || !!subject?.partial, detail: subject?.label },
        { label: "Même niveau", ok: !!by("level")?.ok, detail: by("level")?.label },
        { label: t.hasAvailability ? "Disponibilités renseignées" : "Disponibilités à confirmer", ok: t.hasAvailability, detail: undefined },
    ];
};

function ScoreRing({ score }: { score: number }) {
    const color = score >= 70 ? "#16A34A" : score >= 40 ? "#D97706" : "#94A3B8";
    const r = 22, c = 2 * Math.PI * r;
    return (
        <div className="relative w-14 h-14 shrink-0" title={`Score de correspondance : ${score} sur 100`}>
            <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90" aria-hidden>
                <circle cx="28" cy="28" r={r} fill="none" stroke="#E5EAF1" strokeWidth="5" />
                <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={`${(c * score) / 100} ${c}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" style={{ color }}>{score}%</span>
        </div>
    );
}

const Avatar = ({ name }: { name: string }) => {
    const t = tone(name);
    return <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: t.bg, color: t.fg }}>{initials(name)}</div>;
};

type Filters = { search: string; subject: string; level: string; availability: string; status: string; language: string; experience: string; specialty: string };
const EMPTY: Filters = { search: "", subject: "", level: "", availability: "", status: "", language: "", experience: "", specialty: "" };

export default function AdvisorMatching() {
    const { token } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const location = useLocation();
    const targeted = location.state as { childName?: string } | null;

    const [tab, setTab] = useState<"list" | "reco" | "history">("list");
    const [optimal, setOptimal] = useState(true);
    const [filters, setFilters] = useState<Filters>({ ...EMPTY, search: targeted?.childName ?? "" });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [sort, setSort] = useState<"pertinence" | "student" | "tutor">("pertinence");
    const [view, setView] = useState<"list" | "cards">("list");
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [confirm, setConfirm] = useState<Row | null>(null);

    // Correspondance optimale : meilleur tuteur par élève ; sinon les 3 meilleurs. Recommandations : toujours 3.
    const top = tab === "reco" ? 3 : optimal ? 1 : 3;
    const { data, isLoading, isError, refetch, isFetching } = useQuery<{ tutorCount: number; items: Item[] }>({
        queryKey: ["advisorMatches", top],
        queryFn: async () => {
            const res = await fetch(`${API}/advisor/matches?top=${top}`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Impossible de charger les correspondances");
            return res.json();
        },
        enabled: !!token,
        staleTime: 30_000,
    });
    const items = data?.items ?? [];

    const assign = useMutation({
        mutationFn: async (row: Row) => {
            const res = await fetch(`${API}/advisor/students/${row.student.id}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ teacherId: row.tutor.id }),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Affectation impossible");
            return row;
        },
        onSuccess: (row) => {
            toast.success(`${row.tutor.name} est maintenant affecté à ${row.student.name}`);
            setConfirm(null);
            qc.invalidateQueries({ queryKey: ["advisorMatches"] });
            qc.invalidateQueries({ queryKey: ["advisorFamilies"] });
            qc.invalidateQueries({ queryKey: ["matching", row.student.id] });
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const rows: Row[] = useMemo(() => {
        const out: Row[] = [];
        for (const it of items) {
            if (tab === "reco" && it.assignedTeachers.length) continue;
            it.matches.forEach((t, i) => out.push({ key: `${it.student.id}:${t.id}`, student: it.student, tutor: t, rank: i + 1, assigned: it.assignedTeachers }));
        }
        return out;
    }, [items, tab]);

    const options = useMemo(() => {
        const subjects = new Set<string>(), levels = new Set<string>(), languages = new Set<string>(), specialties = new Set<string>();
        items.forEach(it => {
            [it.student.subject, ...it.student.prioritySubjects, ...it.student.consolidateSubjects].filter(Boolean).forEach(s => subjects.add(String(s)));
            if (it.student.level) levels.add(asLabel(it.student.level));
            it.matches.forEach(t => { labels(t.languages).forEach(l => languages.add(l)); labels(t.specialties).forEach(s => specialties.add(s)); });
        });
        const sorted = (s: Set<string>) => [...s].map(String).sort((a, b) => a.localeCompare(b, "fr"));
        return { subjects: sorted(subjects), levels: sorted(levels), languages: sorted(languages), specialties: sorted(specialties) };
    }, [items]);

    const filtered = useMemo(() => {
        const q = norm(filters.search);
        const list = rows.filter(r => {
            if (q && ![r.student.name, r.tutor.name, r.student.subject, ...r.tutor.subjects].some(v => norm(v).includes(q))) return false;
            if (filters.subject) {
                const studentSubjects = [r.student.subject, ...r.student.prioritySubjects, ...r.student.consolidateSubjects].map(norm);
                if (!studentSubjects.includes(norm(filters.subject))) return false;
            }
            if (filters.level && r.student.level !== filters.level) return false;
            if (filters.availability === "yes" && !r.tutor.hasAvailability) return false;
            if (filters.availability === "no" && r.tutor.hasAvailability) return false;
            if (filters.status === "available" && (r.tutor.alreadyAssigned || !r.tutor.hasAvailability)) return false;
            if (filters.status === "unassigned" && r.assigned.length) return false;
            if (filters.status === "assigned" && !r.tutor.alreadyAssigned) return false;
            if (filters.language && !labels(r.tutor.languages).includes(filters.language)) return false;
            const y = r.tutor.yearsExperience;
            if (filters.experience === "none" && y != null) return false;
            if (filters.experience === "lt2" && !(y != null && y < 2)) return false;
            if (filters.experience === "2to5" && !(y != null && y >= 2 && y <= 5)) return false;
            if (filters.experience === "gt5" && !(y != null && y > 5)) return false;
            if (filters.specialty && !labels(r.tutor.specialties).includes(filters.specialty)) return false;
            return true;
        });
        return [...list].sort((a, b) =>
            sort === "student" ? asLabel(a.student.name).localeCompare(asLabel(b.student.name), "fr") || a.rank - b.rank
                : sort === "tutor" ? asLabel(a.tutor.name).localeCompare(asLabel(b.tutor.name), "fr")
                : b.tutor.score - a.tutor.score
        );
    }, [rows, filters, sort]);

    useEffect(() => { setPage(1); }, [filters, sort, tab, optimal, pageSize]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;
    const pageRows = filtered.slice(start, start + pageSize);
    const set = (k: keyof Filters, v: string) => setFilters(f => ({ ...f, [k]: v }));
    const activeFilters = [filters.subject, filters.level, filters.availability, filters.status, filters.language, filters.experience, filters.specialty].filter(Boolean).length;

    const history = useMemo(
        () => items.flatMap(it => it.assignedTeachers.map(t => ({ student: it.student, teacher: t }))),
        [items]
    );

    const targetNotFound = !!targeted?.childName && !isLoading && !items.some(it => norm(it.student.name).includes(norm(targeted.childName)));

    const actions = (r: Row) => {
        const st = statusBadge(r.tutor);
        return (
            <div className="flex flex-col items-stretch gap-2 w-40 shrink-0">
                <span className={cn("self-start inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full", st.cls)}>
                    {r.tutor.alreadyAssigned || r.tutor.hasAvailability ? <Check className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />}
                    {st.label}
                </span>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="h-8 px-3 rounded-lg border border-gray-200 text-xs text-[#0D2D5A] flex items-center justify-between hover:bg-gray-50">
                            Voir le profil <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/families", { state: { familyId: r.student.id, defaultPanel: "matching" } })}>
                            <Eye className="w-4 h-4" /> Fiche de l'élève
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.open(`/professeurs/${r.tutor.id}`, "_blank", "noopener")}>
                            <Eye className="w-4 h-4" /> Profil public du tuteur
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/advisor/tutors?id=${r.tutor.id}`)}>
                            <Eye className="w-4 h-4" /> Fiche tuteur (complétude)
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => navigate("/advisor/messages", { state: { contactId: r.tutor.id, contactName: r.tutor.name } })}
                        className={cn(BTN, "h-8 px-3 text-xs flex-1 bg-[#0D2D5A] text-white hover:bg-[#0D2D5A]/90")}
                    >
                        <Mail className="w-3.5 h-3.5" /> Contacter
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button aria-label={`Plus d'actions pour ${r.student.name} et ${r.tutor.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem disabled={r.tutor.alreadyAssigned} className="gap-2 cursor-pointer" onClick={() => setConfirm(r)}>
                                <UserPlus className="w-4 h-4" /> {r.tutor.alreadyAssigned ? "Déjà affecté" : "Affecter ce tuteur"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        );
    };

    const studentBlock = (s: StudentInfo) => {
        const need = needBadge(s);
        return (
            <div className="flex items-start gap-3 min-w-0">
                <Avatar name={s.name} />
                <div className="min-w-0 space-y-1">
                    <p className="text-sm font-bold text-[#0D2D5A] truncate">{s.name}</p>
                    <p className="text-xs text-gray-500 truncate">{[s.level, s.subject].filter(Boolean).join(" - ") || "Niveau non renseigné"}</p>
                    <p className={cn("text-xs flex items-center gap-1", s.city ? "text-gray-500" : "text-amber-600")}><MapPin className="w-3 h-3" />{s.city || "Localisation à renseigner"}</p>
                    <span className={cn("inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full", need.cls)}>{need.label}</span>
                </div>
            </div>
        );
    };

    const tutorBlock = (t: Tutor) => (
        <div className="flex items-start gap-3 min-w-0">
            <Avatar name={t.name} />
            <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-[#0D2D5A] truncate">{t.name}</p>
                <p className="text-xs text-gray-500 truncate">{t.subjects.length ? `Prof. de ${t.subjects.slice(0, 2).join(", ")}` : "Matières non renseignées"}</p>
                <p className="text-xs flex items-center gap-1 text-gray-500">
                    <Star className={cn("w-3 h-3", t.reviewCount ? "text-[#F5A623] fill-[#F5A623]" : "text-gray-300")} />
                    {t.reviewCount ? `${t.reviewAvg} (${t.reviewCount} avis)` : "Pas encore d'avis"}
                </p>
                <p className={cn("text-xs flex items-center gap-1", t.city ? "text-gray-500" : "text-amber-600")}><MapPin className="w-3 h-3" />{t.city || "Ville à renseigner"}</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                    <Briefcase className="w-3 h-3" />
                    {t.yearsExperience != null ? `${t.yearsExperience} an${t.yearsExperience > 1 ? "s" : ""} d'expérience` : "Expérience non renseignée"}
                </span>
            </div>
        </div>
    );

    const criteriaBlock = (r: Row) => (
        <div className="flex items-start gap-3 min-w-0">
            <ScoreRing score={r.tutor.score} />
            <div className="min-w-0 space-y-1">
                <p className="text-sm font-bold text-[#0F9B8E]">Correspondance</p>
                {criteria(r.tutor).map(c => (
                    <p key={c.label} className={cn("text-xs flex items-center gap-1.5", c.ok ? "text-[#0D2D5A]" : "text-gray-400")} title={c.detail}>
                        {c.ok ? <Check className="w-3.5 h-3.5 text-[#0F9B8E]" /> : <X className="w-3.5 h-3.5" />} {c.label}
                    </p>
                ))}
                {r.rank === 1 && r.tutor.score >= 40 && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700" title="Meilleur score pour cet élève">
                        <Sparkles className="w-3 h-3" /> Recommandé
                    </span>
                )}
                {r.tutor.profile && r.tutor.profile.missing.length > 0 && (
                    <p className="text-[11px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Profil tuteur incomplet</p>
                )}
            </div>
        </div>
    );

    return (
        <div className="p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            <div>
                <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                    Matching enseignant <ArrowLeftRight className="w-6 h-6" /> élève
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Trouvez la meilleure correspondance entre vos élèves et vos enseignants selon la matière, le niveau, les critères pédagogiques et vos préférences.
                </p>
            </div>

            {targetNotFound && (
                <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3">
                    « {targeted?.childName} » n'a pas encore de compte élève : créez-le depuis Mes élèves pour pouvoir lui affecter un tuteur.
                </p>
            )}

            {/* Onglets + filtres */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
                <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-4" role="tablist">
                    {([
                        { k: "list", label: "Liste des correspondances", icon: ListChecks },
                        { k: "reco", label: "Élèves à affecter", icon: Sparkles, badge: items.filter(i => !i.assignedTeachers.length).length },
                        { k: "history", label: "Historique des matching", icon: History },
                    ] as const).map(t => (
                        <button key={t.k} role="tab" aria-selected={tab === t.k} onClick={() => setTab(t.k)}
                            className={cn(BTN, tab === t.k ? "bg-[#0D2D5A] text-white" : "text-gray-500 hover:bg-gray-50")}>
                            <t.icon className="w-4 h-4" /> {t.label}
                            {"badge" in t && t.badge > 0 && <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full", tab === t.k ? "bg-white/20" : "bg-amber-100 text-amber-700")}>{t.badge}</span>}
                        </button>
                    ))}
                </div>

                {tab !== "history" && (
                    <>
                        {/* Toujours visibles : recherche, mode de correspondance, ouverture des filtres */}
                        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input value={filters.search} onChange={e => set("search", e.target.value)} placeholder="Rechercher un enseignant, un élève, une matière..."
                                    aria-label="Rechercher"
                                    className="w-full h-10 border border-gray-200 rounded-lg pl-9 pr-3 text-sm outline-none focus:border-[#0D2D5A] focus:ring-2 focus:ring-[#0D2D5A]/10" />
                            </div>
                            {tab === "list" && (
                                <label className="flex items-center gap-2.5 rounded-lg border border-gray-100 h-10 px-3" title="Activé : le meilleur tuteur par élève. Désactivé : les 3 meilleurs.">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-semibold text-[#0D2D5A] whitespace-nowrap">Correspondance optimale</span>
                                    <Switch checked={optimal} onCheckedChange={setOptimal} aria-label="Correspondance optimale" />
                                </label>
                            )}
                            <button
                                onClick={() => setShowAdvanced(o => !o)}
                                aria-expanded={showAdvanced}
                                className={cn(BTN, "border", activeFilters ? "border-[#0D2D5A] bg-[#0D2D5A]/5 text-[#0D2D5A]" : "border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}
                            >
                                <SlidersHorizontal className="w-4 h-4" /> Filtres{activeFilters ? ` · ${activeFilters}` : ""}
                                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            {(activeFilters > 0 || filters.search) && (
                                <button onClick={() => setFilters(EMPTY)} className={cn(BTN, "text-gray-500 hover:bg-gray-50")}>
                                    <RotateCcw className="w-4 h-4" /> Réinitialiser
                                </button>
                            )}
                        </div>

                        {showAdvanced && (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pt-1">
                                <label><span className={LABEL}>Matière</span>
                                    <select value={filters.subject} onChange={e => set("subject", e.target.value)} className={SELECT}>
                                        <option value="">Toutes les matières</option>{options.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                                <label><span className={LABEL}>Niveau</span>
                                    <select value={filters.level} onChange={e => set("level", e.target.value)} className={SELECT}>
                                        <option value="">Tous les niveaux</option>{options.levels.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                                <label><span className={LABEL}>Disponibilité du tuteur</span>
                                    <select value={filters.availability} onChange={e => set("availability", e.target.value)} className={SELECT}>
                                        <option value="">Tous les créneaux</option><option value="yes">Disponibilités renseignées</option><option value="no">Disponibilités à confirmer</option>
                                    </select>
                                </label>
                                <label><span className={LABEL}>Statut</span>
                                    <select value={filters.status} onChange={e => set("status", e.target.value)} className={SELECT}>
                                        <option value="">Tous les statuts</option><option value="available">Disponibles uniquement</option>
                                        <option value="unassigned">Élèves sans tuteur</option><option value="assigned">Déjà affectés</option>
                                    </select>
                                </label>
                                <label><span className={LABEL}>Langue du tuteur</span>
                                    <select value={filters.language} onChange={e => set("language", e.target.value)} className={SELECT}>
                                        <option value="">Toutes les langues</option>{options.languages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                                <label><span className={LABEL}>Expérience</span>
                                    <select value={filters.experience} onChange={e => set("experience", e.target.value)} className={SELECT}>
                                        <option value="">Toutes</option><option value="lt2">Moins de 2 ans</option><option value="2to5">2 à 5 ans</option>
                                        <option value="gt5">Plus de 5 ans</option><option value="none">Non renseignée</option>
                                    </select>
                                </label>
                                <label><span className={LABEL}>Compétences</span>
                                    <select value={filters.specialty} onChange={e => set("specialty", e.target.value)} className={SELECT}>
                                        <option value="">Toutes</option>{options.specialties.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </label>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Résultats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#0D2D5A]" /></div>
                ) : isError ? (
                    <div className="p-5 flex items-center justify-between text-sm text-red-700 bg-red-50">
                        Impossible de charger les correspondances.
                        <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-xs font-semibold"><RefreshCw className="w-3 h-3" /> Réessayer</button>
                    </div>
                ) : tab === "history" ? (
                    <>
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-base font-bold text-[#0D2D5A]">{history.length} affectation{history.length > 1 ? "s" : ""} en cours</h2>
                        </div>
                        {history.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-12">Aucune affectation pour le moment.</p>
                        ) : (
                            <ul className="divide-y divide-gray-50">
                                {history.map(h => (
                                    <li key={`${h.student.id}:${h.teacher.id}`} className="px-5 py-3 flex items-center gap-4">
                                        <Avatar name={h.student.name} />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-[#0D2D5A]">{h.student.name}</p>
                                            <p className="text-xs text-gray-500">{[h.student.level, h.student.subject].filter(Boolean).join(" - ")}</p>
                                        </div>
                                        <ArrowLeftRight className="w-4 h-4 text-gray-400" />
                                        <Avatar name={h.teacher.name} />
                                        <p className="text-sm font-bold text-[#0D2D5A] min-w-0 flex-1 truncate">{h.teacher.name}</p>
                                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#0F9B8E]/10 text-[#0F9B8E]">Affecté</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                            <div>
                                <h2 className="text-base font-bold text-[#0D2D5A]">
                                    {filtered.length} correspondance{filtered.length > 1 ? "s" : ""} trouvée{filtered.length > 1 ? "s" : ""}
                                    {isFetching && <Loader2 className="inline w-4 h-4 ml-2 animate-spin text-gray-400" />}
                                </h2>
                                <p className="text-xs text-gray-400">
                                    {filtered.length ? `Affichage de ${start + 1} à ${Math.min(start + pageSize, filtered.length)} sur ${filtered.length} résultats` : "Aucun résultat"}
                                    {data && ` · ${items.length} élèves, ${data.tutorCount} tuteurs`}
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-500" htmlFor="match-sort">Trier par :</label>
                                <select id="match-sort" value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
                                    <option value="pertinence">Pertinence</option><option value="student">Élève (A-Z)</option><option value="tutor">Tuteur (A-Z)</option>
                                </select>
                                <button onClick={() => setView("list")} aria-label="Vue liste" aria-pressed={view === "list"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center", view === "list" ? "bg-[#0D2D5A] text-white" : "text-gray-400 hover:bg-gray-100")}><List className="w-4 h-4" /></button>
                                <button onClick={() => setView("cards")} aria-label="Vue cartes" aria-pressed={view === "cards"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center", view === "cards" ? "bg-[#0D2D5A] text-white" : "text-gray-400 hover:bg-gray-100")}><LayoutGrid className="w-4 h-4" /></button>
                            </div>
                        </div>

                        {pageRows.length === 0 ? (
                            <p className="text-sm text-gray-400 italic text-center py-12">Aucune correspondance ne répond à ces critères.</p>
                        ) : view === "list" ? (
                            <ul className="p-3 space-y-3">
                                {pageRows.map(r => (
                                    <li key={r.key} className="rounded-xl border border-gray-100 p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                                        <div className="lg:w-[24%] min-w-0">{studentBlock(r.student)}</div>
                                        <ArrowLeftRight className="hidden lg:block w-5 h-5 text-gray-300 shrink-0" />
                                        <div className="lg:w-[24%] min-w-0">{tutorBlock(r.tutor)}</div>
                                        <div className="flex-1 min-w-0">{criteriaBlock(r)}</div>
                                        {actions(r)}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                                {pageRows.map(r => (
                                    <div key={r.key} className="rounded-xl border border-gray-100 p-4 space-y-4">
                                        {studentBlock(r.student)}
                                        <div className="flex items-center gap-2 text-gray-300"><ArrowLeftRight className="w-4 h-4" /><span className="h-px flex-1 bg-gray-100" /></div>
                                        {tutorBlock(r.tutor)}
                                        {criteriaBlock(r)}
                                        {actions(r)}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-t border-gray-100">
                            <label className="text-xs text-gray-500 flex items-center gap-2">Éléments par page :
                                <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-8 border border-gray-200 rounded-lg px-2 text-xs bg-white">
                                    {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                                </select>
                            </label>
                            <nav aria-label="Pagination des correspondances" className="flex items-center gap-1">
                                <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                    <button key={n} onClick={() => setPage(n)} aria-current={n === current ? "page" : undefined}
                                        className={cn("min-w-8 h-8 px-2 rounded-lg text-xs font-bold", n === current ? "bg-[#0D2D5A] text-white" : "text-gray-500 hover:bg-gray-100")}>{n}</button>
                                ))}
                                <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </nav>
                        </div>
                    </>
                )}
            </div>

            <AlertDialog open={!!confirm} onOpenChange={open => { if (!open) setConfirm(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Affecter {confirm?.tutor.name} à {confirm?.student.name} ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Score de correspondance : {confirm?.tutor.score}/100.
                            {confirm && confirm.assigned.length > 0 && ` ${confirm.student.name} a déjà ${confirm.assigned.map(a => a.name).join(", ")} : ce tuteur s'ajoutera.`}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={assign.isPending}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            disabled={assign.isPending}
                            onClick={e => { e.preventDefault(); if (confirm) assign.mutate(confirm); }}
                            style={{ background: NAVY }}
                        >
                            {assign.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmer l'affectation"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
