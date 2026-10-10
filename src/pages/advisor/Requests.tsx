import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRequests, updateRequestStatus, createRequest } from "@/api/backoffice";
import type { RequestStatus, BackofficeRequest } from "@/integrations/supabase/types";
import {
    Phone, RefreshCw, Loader2, GitMerge, Plus, Search, ClipboardList, CheckCircle2, Clock, Mail, Settings2, CircleCheck,
    X, UserCheck, CalendarPlus, ChevronRight, ChevronDown, ChevronUp, SlidersHorizontal, RotateCcw, KanbanSquare, Table2,
    MoreVertical, TrendingUp, TrendingDown, ChevronLeft, FileText, Inbox,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type Req = BackofficeRequest & {
    requestDate?: string | null; createdAt?: string | null; urgency?: string | null;
    hasDiagnostic?: boolean; hasPlan?: boolean; email?: string;
};

const BLUE = "#1A6CC8";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const SELECT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15";
const LABEL = "text-xs font-semibold text-[#0D2D5A] mb-1.5 block";
const STATUSES: RequestStatus[] = ["reçu", "en traitement", "assigné", "clôturé"];
const STATUS_SET = new Set<RequestStatus>(STATUSES);

const STATUS_META: Record<RequestStatus, { label: string; icon: React.ElementType; head: string; text: string; badge: string; badgeLabel: string }> = {
    "reçu":          { label: "Reçu",          icon: Mail,        head: "bg-amber-50 border-amber-100",   text: "text-amber-700",   badge: "bg-amber-50 text-amber-700",   badgeLabel: "Reçu" },
    "en traitement": { label: "En traitement", icon: Settings2,   head: "bg-blue-50 border-blue-100",     text: "text-blue-700",    badge: "bg-blue-50 text-blue-700",     badgeLabel: "En cours" },
    "assigné":       { label: "Assigné",       icon: CheckCircle2, head: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", badge: "bg-emerald-50 text-emerald-700", badgeLabel: "Assigné" },
    "clôturé":       { label: "Clôturé",       icon: CircleCheck, head: "bg-gray-50 border-gray-100",     text: "text-gray-600",    badge: "bg-gray-100 text-gray-600",    badgeLabel: "Clôturé" },
};

const URGENCY: Record<string, { label: string; cls: string; rank: number }> = {
    "urgent":        { label: "Urgent",          cls: "bg-red-50 text-red-600",     rank: 3 },
    "cette-semaine": { label: "Cette semaine",   cls: "bg-amber-50 text-amber-700", rank: 2 },
    "2-semaines":    { label: "Sous 2 semaines", cls: "bg-blue-50 text-blue-700",   rank: 1 },
};
const urgencyOf = (r: Req) => URGENCY[r.urgency ?? ""] ?? { label: "Normal", cls: "bg-gray-100 text-gray-500", rank: 0 };

const PALETTE = [
    { bg: "#DBEAFE", fg: "#1D4ED8" }, { bg: "#DCFCE7", fg: "#15803D" }, { bg: "#FCE7F3", fg: "#BE185D" },
    { bg: "#F3E8FF", fg: "#7C3AED" }, { bg: "#FEF3C7", fg: "#B45309" }, { bg: "#E0F2FE", fg: "#0369A1" },
];
const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const tone = (n = "") => PALETTE[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

const when = (r: Req) => {
    const d = r.createdAt ? new Date(r.createdAt) : r.requestDate ? new Date(r.requestDate) : null;
    if (!d || isNaN(d.getTime())) return r.date || "";
    const day = d.toLocaleDateString("fr-FR");
    return r.createdAt ? `${day} • ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}` : day;
};
const timeOf = (r: Req) => new Date(r.createdAt || r.requestDate || 0).getTime() || 0;

// Avancement du dossier : prise en charge 20 %, diagnostic 40 %, plan 40 %
const progressOf = (r: Req) => {
    const pct = 20 + (r.hasDiagnostic ? 40 : 0) + (r.hasPlan ? 40 : 0);
    const label = r.hasPlan ? "Plan pédagogique fait" : r.hasDiagnostic ? "Diagnostic fait" : "Diagnostic à faire";
    return { pct, label };
};

// Variation des 30 derniers jours par rapport aux 30 précédents
const trend = (list: Req[]) => {
    const now = Date.now(), day = 86_400_000;
    const recent = list.filter(r => timeOf(r) > now - 30 * day).length;
    const before = list.filter(r => timeOf(r) <= now - 30 * day && timeOf(r) > now - 60 * day).length;
    if (!before) return null;
    return Math.round(((recent - before) / before) * 100);
};

const EMPTY_FORM = { parentName: "", childName: "", level: "", subject: "", phone: "" };
type Filters = { search: string; status: RequestStatus | ""; subject: string; level: string; from: string; to: string; urgency: string };
const EMPTY_FILTERS: Filters = { search: "", status: "", subject: "", level: "", from: "", to: "", urgency: "" };
const COLUMN_PREVIEW = 3;

export default function AdvisorRequests() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
    const [showFilters, setShowFilters] = useState(false);
    const [view, setView] = useState<"kanban" | "table">("kanban");
    const [sort, setSort] = useState<"recent" | "old" | "urgency" | "name">("recent");
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});
    const [pageSize, setPageSize] = useState(10);
    const [page, setPage] = useState(1);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newForm, setNewForm] = useState(EMPTY_FORM);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["backoffice", "requests"],
        queryFn: fetchRequests,
        staleTime: 30_000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: RequestStatus }) => updateRequestStatus(id, status),
        onSuccess: (_d, { status }) => {
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            queryClient.invalidateQueries({ queryKey: ["advisorDashboard"] });
            toast.success(status === "en traitement" ? "Demande prise en charge ! Vous pouvez maintenant lancer le matching." : "Statut mis à jour");
        },
        onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
    });

    const createMutation = useMutation({
        mutationFn: () => createRequest(newForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            toast.success("Demande créée avec succès");
            setNewForm(EMPTY_FORM);
            setShowAddModal(false);
        },
        onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
    });

    const all = (data ?? []) as Req[];
    const set = <K extends keyof Filters>(k: K, v: Filters[K]) => setFilters(f => ({ ...f, [k]: v }));
    const countOf = (s: RequestStatus) => all.filter(r => r.status === s).length;

    const options = useMemo(() => {
        const subjects = new Set<string>(), levels = new Set<string>();
        all.forEach(r => {
            String(r.subject || "").split(",").map(x => x.trim()).filter(Boolean).forEach(x => subjects.add(x));
            if (r.level) levels.add(r.level);
        });
        return { subjects: [...subjects].sort((a, b) => a.localeCompare(b, "fr")), levels: [...levels].sort((a, b) => a.localeCompare(b, "fr")) };
    }, [all]);

    const filtered = useMemo(() => {
        const q = norm(filters.search);
        const from = filters.from ? new Date(`${filters.from}T00:00:00`).getTime() : null;
        const to = filters.to ? new Date(`${filters.to}T23:59:59`).getTime() : null;
        const list = all.filter(r =>
            (!q || [r.child, r.parent, r.phone, r.subject].some(v => norm(v).includes(q))) &&
            (!filters.status || r.status === filters.status) &&
            (!filters.subject || String(r.subject || "").split(",").map(x => x.trim()).includes(filters.subject)) &&
            (!filters.level || r.level === filters.level) &&
            (from === null || timeOf(r) >= from) && (to === null || timeOf(r) <= to) &&
            (!filters.urgency || (filters.urgency === "normal" ? !URGENCY[r.urgency ?? ""] : r.urgency === filters.urgency))
        );
        return [...list].sort((a, b) =>
            sort === "old" ? timeOf(a) - timeOf(b)
                : sort === "urgency" ? urgencyOf(b).rank - urgencyOf(a).rank || timeOf(b) - timeOf(a)
                : sort === "name" ? String(a.child).localeCompare(String(b.child), "fr")
                : timeOf(b) - timeOf(a)
        );
    }, [all, filters, sort]);

    const grouped = useMemo(() => {
        const base = Object.fromEntries(STATUSES.map(s => [s, [] as Req[]])) as Record<RequestStatus, Req[]>;
        filtered.forEach(r => base[STATUS_SET.has(r.status) ? r.status : "reçu"].push(r));
        return base;
    }, [filtered]);

    const activeFilters = [filters.status, filters.subject, filters.level, filters.from || filters.to, filters.urgency].filter(Boolean).length;
    useEffect(() => { setPage(1); }, [filters, sort, pageSize]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;

    const handleDrop = (e: React.DragEvent, status: RequestStatus) => {
        e.preventDefault();
        const id = e.dataTransfer.getData("requestId");
        const req = all.find(r => r.id === id);
        if (id && req && req.status !== status) updateStatusMutation.mutate({ id, status });
    };
    const openDossier = (r: Req, panel?: string) => navigate("/advisor/families", { state: { requestId: r.id, ...(panel ? { defaultPanel: panel } : {}) } });

    const kpis = [
        { label: "Total des demandes", value: all.length, trend: trend(all), status: "" as const, icon: ClipboardList, card: "bg-white", iconBg: "bg-gray-100 text-[#0D2D5A]", text: "text-[#0D2D5A]" },
        { label: "À prendre en charge", value: countOf("reçu"), trend: trend(all.filter(r => r.status === "reçu")), status: "reçu" as const, icon: CalendarPlus, card: "bg-amber-50/60", iconBg: "bg-amber-100 text-amber-600", text: "text-amber-600" },
        { label: "En traitement", value: countOf("en traitement"), trend: trend(all.filter(r => r.status === "en traitement")), status: "en traitement" as const, icon: Clock, card: "bg-blue-50/60", iconBg: "bg-blue-100 text-blue-700", text: "text-blue-700" },
        { label: "Assignées", value: countOf("assigné"), trend: trend(all.filter(r => r.status === "assigné")), status: "assigné" as const, icon: CheckCircle2, card: "bg-emerald-50/60", iconBg: "bg-emerald-100 text-emerald-700", text: "text-emerald-700" },
    ];

    const menu = (r: Req) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button onClick={e => e.stopPropagation()} aria-label={`Actions pour la demande de ${r.child}`} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/schedule", { state: { familyName: r.parent, childName: r.child, type: "Bilan pédagogique initial" } })}>
                    <CalendarPlus className="w-4 h-4" /> Planifier le diagnostic
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openDossier(r, "diagnostic")}>
                    <ClipboardList className="w-4 h-4" /> Remplir le bilan
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/matching", { state: { childName: r.child, level: r.level, subject: r.subject } })}>
                    <GitMerge className="w-4 h-4" /> Lancer le matching
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-xs text-gray-400">Changer le statut</DropdownMenuLabel>
                {STATUSES.filter(s => s !== r.status).map(s => (
                    <DropdownMenuItem key={s} className="gap-2 cursor-pointer" onClick={() => updateStatusMutation.mutate({ id: r.id, status: s })}>
                        <ChevronRight className="w-4 h-4" /> {STATUS_META[s].label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const card = (r: Req) => {
        const t = tone(r.child);
        const u = urgencyOf(r);
        const meta = STATUS_META[STATUS_SET.has(r.status) ? r.status : "reçu"];
        const prog = progressOf(r);
        return (
            <div
                key={r.id}
                draggable
                onDragStart={e => e.dataTransfer.setData("requestId", r.id)}
                className="bg-white rounded-xl p-3.5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow cursor-grab active:cursor-grabbing space-y-2.5"
            >
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: t.bg, color: t.fg }}>{initials(r.child)}</div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                        <p className="text-sm font-bold text-[#0D2D5A] leading-tight line-clamp-2 break-words">{r.child}</p>
                        <p className="text-[11px] text-gray-500 truncate" title={[r.level, r.subject].filter(Boolean).join(" - ")}>{[r.level, r.subject].filter(Boolean).join(" - ") || "Niveau non renseigné"}</p>
                        <p className="text-[11px] text-gray-500 truncate" title={r.parent}>Parent : {r.parent || "Non renseigné"}</p>
                        {r.phone && (
                            <a href={`tel:${r.phone}`} onClick={e => e.stopPropagation()} className="text-[11px] font-semibold text-[#0D2D5A] flex items-center gap-1 whitespace-nowrap hover:underline">
                                <Phone className="w-3 h-3" /> {r.phone}
                            </a>
                        )}
                    </div>
                    <div className="flex items-start gap-1 shrink-0">
                        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", r.status === "reçu" ? u.cls : meta.badge)}>
                            {r.status === "reçu" ? u.label : meta.badgeLabel}
                        </span>
                        {menu(r)}
                    </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-gray-400">
                    <span>{when(r)}</span>
                    {r.status !== "reçu" && r.urgency && URGENCY[r.urgency] && <span className={cn("font-bold px-2 py-0.5 rounded-full", u.cls)}>{u.label}</span>}
                </div>

                {r.status === "en traitement" && (
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${prog.pct}%`, background: BLUE }} /></div>
                            <span className="text-[10px] font-bold text-[#0D2D5A]">{prog.pct}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">{prog.label}</p>
                    </div>
                )}

                {r.status === "reçu" ? (
                    <button
                        onClick={e => { e.stopPropagation(); updateStatusMutation.mutate({ id: r.id, status: "en traitement" }); }}
                        disabled={updateStatusMutation.isPending}
                        className={cn(BTN, "w-full h-8 text-xs text-white hover:opacity-90")}
                        style={{ background: BLUE }}
                    >
                        <UserCheck className="w-3.5 h-3.5" /> Prendre en charge
                    </button>
                ) : (
                    <div className="flex justify-end">
                        <button onClick={e => { e.stopPropagation(); openDossier(r); }} className={cn(BTN, "h-7 px-3 text-[11px] border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>
                            Voir le détail
                        </button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            {/* En-tête */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="text-[11px] uppercase tracking-[3px] text-gray-400 font-bold mb-1">Conseiller - Pipeline</p>
                    <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight flex items-center gap-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                        <span className="w-8 h-8 rounded-full bg-[#0D2D5A] text-white flex items-center justify-center"><FileText className="w-4 h-4" /></span>
                        Demandes de bilan
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Suivez et gérez les demandes d'évaluation, du premier contact jusqu'au matching enseignant.</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className={cn(BTN, "h-11 px-5 text-white shadow-md hover:opacity-90")} style={{ background: BLUE }}>
                    <Plus className="w-4 h-4" /> Nouvelle demande
                </button>
            </div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map(k => (
                    <button
                        key={k.label}
                        onClick={() => setFilters(f => ({ ...f, status: k.status }))}
                        aria-pressed={filters.status === k.status}
                        className={cn("rounded-2xl p-4 flex items-center gap-4 border text-left shadow-sm transition-colors", k.card,
                            filters.status === k.status && k.status ? "border-current" : "border-gray-100", k.text)}
                    >
                        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", k.iconBg)}><k.icon className="w-5 h-5" /></div>
                        <div className="flex-1 min-w-0">
                            <p className="text-2xl font-bold">{isLoading ? "…" : k.value}</p>
                            <p className="text-xs font-semibold">{k.label}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3 self-stretch justify-between">
                            {k.trend !== null && (
                                <span className={cn("inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full", k.trend >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600")}
                                    title="Variation des 30 derniers jours par rapport aux 30 précédents">
                                    {k.trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{k.trend >= 0 ? "+" : ""}{k.trend}%
                                </span>
                            )}
                            <ChevronRight className="w-4 h-4 text-gray-400 mt-auto" />
                        </div>
                    </button>
                ))}
            </div>

            {/* Filtres */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input value={filters.search} onChange={e => set("search", e.target.value)} aria-label="Rechercher"
                            placeholder="Rechercher un élève, parent, téléphone..."
                            className="w-full h-10 border border-gray-200 rounded-lg pl-9 pr-3 text-sm outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15" />
                    </div>
                    <button onClick={() => setShowFilters(o => !o)} aria-expanded={showFilters}
                        className={cn(BTN, "border", activeFilters ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>
                        <SlidersHorizontal className="w-4 h-4" /> Filtres avancés{activeFilters ? ` · ${activeFilters}` : ""}
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {(activeFilters > 0 || filters.search) && (
                        <button onClick={() => setFilters(EMPTY_FILTERS)} className={cn(BTN, "border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}>
                            <RotateCcw className="w-4 h-4" /> Réinitialiser
                        </button>
                    )}
                </div>

                {showFilters && (
                    <div className="space-y-4">
                        <div>
                            <span className={LABEL}>Statut</span>
                            <div className="flex flex-wrap gap-2">
                                {([["", `Tous (${all.length})`], ...STATUSES.map(s => [s, `${STATUS_META[s].label} (${countOf(s)})`])] as [RequestStatus | "", string][]).map(([s, label]) => (
                                    <button key={s || "all"} onClick={() => set("status", s)} aria-pressed={filters.status === s}
                                        className={cn("text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors",
                                            filters.status === s ? "text-white border-transparent" : "bg-white border-gray-200 text-gray-600 hover:border-gray-300")}
                                        style={filters.status === s ? { background: BLUE } : undefined}>
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
                            <div>
                                <span className={LABEL}>Date de demande</span>
                                <div className="flex items-center gap-2">
                                    <input type="date" value={filters.from} onChange={e => set("from", e.target.value)} aria-label="Du" className={SELECT} />
                                    <span className="text-gray-400">→</span>
                                    <input type="date" value={filters.to} onChange={e => set("to", e.target.value)} aria-label="Au" className={SELECT} />
                                </div>
                            </div>
                            <label><span className={LABEL}>Urgence</span>
                                <select value={filters.urgency} onChange={e => set("urgency", e.target.value)} className={SELECT}>
                                    <option value="">Toutes</option><option value="urgent">Urgent (sous 48h)</option><option value="cette-semaine">Cette semaine</option>
                                    <option value="2-semaines">Sous 2 semaines</option><option value="normal">Normal</option>
                                </select>
                            </label>
                        </div>
                    </div>
                )}
            </div>

            {/* Barre d'affichage */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2" role="group" aria-label="Affichage">
                    <button onClick={() => setView("kanban")} aria-pressed={view === "kanban"} className={cn(BTN, view === "kanban" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "kanban" ? { background: BLUE } : undefined}>
                        <KanbanSquare className="w-4 h-4" /> Kanban
                    </button>
                    <button onClick={() => setView("table")} aria-pressed={view === "table"} className={cn(BTN, view === "table" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "table" ? { background: BLUE } : undefined}>
                        <Table2 className="w-4 h-4" /> Tableau
                    </button>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">Trier par :
                    <select value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
                        <option value="recent">Plus récentes</option><option value="old">Plus anciennes</option>
                        <option value="urgency">Les plus urgentes</option><option value="name">Élève (A-Z)</option>
                    </select>
                </label>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger les demandes."}</span>
                    <button onClick={() => refetch()} className="inline-flex items-center gap-1 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100">
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            )}

            {view === "kanban" ? (
                <div className={cn("grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4", updateStatusMutation.isPending && "opacity-60 pointer-events-none")}>
                    {STATUSES.map(status => {
                        const meta = STATUS_META[status];
                        const list = grouped[status];
                        const open = !!expanded[status];
                        const shown = open ? list : list.slice(0, COLUMN_PREVIEW);
                        return (
                            <div key={status} onDragOver={e => e.preventDefault()} onDrop={e => handleDrop(e, status)}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden" aria-label={`Colonne ${meta.label}`}>
                                <div className={cn("px-4 py-3 flex items-center justify-between border-b", meta.head)}>
                                    <span className={cn("flex items-center gap-2 text-sm font-bold", meta.text)}><meta.icon className="w-4 h-4" /> {meta.label}</span>
                                    <span className={cn("text-sm font-bold", meta.text)}>{isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : list.length}</span>
                                </div>
                                <div className="p-3 space-y-3 flex-1 min-h-[300px]">
                                    {shown.map(card)}
                                    {!isLoading && list.length === 0 && (
                                        <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                                            <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-3"><Inbox className="w-7 h-7 text-gray-300" /></div>
                                            <p className="text-sm font-bold text-[#0D2D5A]">Aucune demande</p>
                                            <p className="text-xs text-gray-400 mt-1">Glissez une carte ici pour changer son statut.</p>
                                        </div>
                                    )}
                                </div>
                                {list.length > COLUMN_PREVIEW && (
                                    <button onClick={() => setExpanded(e => ({ ...e, [status]: !open }))} className="m-3 mt-0 h-9 rounded-lg bg-gray-50 text-xs font-semibold text-[#0D2D5A] hover:bg-gray-100">
                                        {open ? "Réduire" : `Voir tous (${list.length})`}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm min-w-[860px]">
                            <thead>
                                <tr className="bg-gray-50/60 border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                                    <th className="px-5 py-3 font-bold">Élève</th><th className="px-4 py-3 font-bold">Parent / Téléphone</th>
                                    <th className="px-4 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">Urgence</th>
                                    <th className="px-4 py-3 font-bold">Statut</th><th className="px-4 py-3 font-bold">Avancement</th><th className="px-4 py-3" />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.slice(start, start + pageSize).map(r => {
                                    const t = tone(r.child), u = urgencyOf(r), meta = STATUS_META[STATUS_SET.has(r.status) ? r.status : "reçu"], prog = progressOf(r);
                                    return (
                                        <tr key={r.id} className="hover:bg-gray-50/60">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: t.bg, color: t.fg }}>{initials(r.child)}</div>
                                                    <div className="min-w-0"><p className="font-bold text-[#0D2D5A] truncate">{r.child}</p><p className="text-xs text-gray-500 truncate">{[r.level, r.subject].filter(Boolean).join(" - ")}</p></div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3"><p className="text-[#0D2D5A]">{r.parent}</p>{r.phone && <a href={`tel:${r.phone}`} className="text-xs text-gray-500 hover:underline">{r.phone}</a>}</td>
                                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{when(r)}</td>
                                            <td className="px-4 py-3"><span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", u.cls)}>{u.label}</span></td>
                                            <td className="px-4 py-3"><span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", meta.badge)}>{meta.label}</span></td>
                                            <td className="px-4 py-3 w-40">
                                                {r.status === "reçu" ? <span className="text-xs text-gray-400">À prendre en charge</span> : (
                                                    <div className="flex items-center gap-2"><div className="flex-1 h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${prog.pct}%`, background: BLUE }} /></div><span className="text-[10px] font-bold">{prog.pct}%</span></div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1">
                                                    {r.status === "reçu" ? (
                                                        <button onClick={() => updateStatusMutation.mutate({ id: r.id, status: "en traitement" })} className={cn(BTN, "h-8 px-3 text-xs text-white")} style={{ background: BLUE }}>
                                                            <UserCheck className="w-3.5 h-3.5" /> Prendre en charge
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => openDossier(r)} className={cn(BTN, "h-8 px-3 text-xs border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>Voir le détail</button>
                                                    )}
                                                    {menu(r)}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length === 0 && <p className="text-sm text-gray-400 italic text-center py-12">Aucune demande ne correspond à ces critères.</p>}
                </div>
            )}

            {/* Pied : volume et pagination (tableau) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs text-gray-500">
                    {filtered.length ? (view === "table"
                        ? `Affichage ${start + 1} - ${Math.min(start + pageSize, filtered.length)} sur ${filtered.length} demandes`
                        : `${filtered.length} demande${filtered.length > 1 ? "s" : ""} affichée${filtered.length > 1 ? "s" : ""} sur ${all.length}`) : "Aucune demande"}
                </p>
                {view === "table" && (
                    <div className="flex items-center gap-2">
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} aria-label="Demandes par page" className="h-9 border border-gray-200 rounded-lg px-2 text-xs bg-white">
                            {[10, 20, 50].map(n => <option key={n} value={n}>{n} par page</option>)}
                        </select>
                        <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button key={n} onClick={() => setPage(n)} aria-current={n === current ? "page" : undefined}
                                className={cn("w-9 h-9 rounded-lg text-xs font-bold", n === current ? "text-white" : "border border-gray-200 text-gray-500")} style={n === current ? { background: BLUE } : undefined}>{n}</button>
                        ))}
                        <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </div>
                )}
            </div>

            {/* Nouvelle demande */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-label="Nouvelle demande">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#0D2D5A]">Nouvelle demande</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Enregistrer une demande de bilan manuelle</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} aria-label="Fermer" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            {[
                                { key: "parentName", label: "Nom du parent", placeholder: "Ex : Ngono Marie" },
                                { key: "childName", label: "Nom de l'élève", placeholder: "Ex : Junior Ngono" },
                                { key: "level", label: "Niveau scolaire", placeholder: "Ex : Terminale C" },
                                { key: "subject", label: "Matière concernée", placeholder: "Ex : Mathématiques" },
                                { key: "phone", label: "Téléphone", placeholder: "+237..." },
                            ].map(({ key, label, placeholder }) => (
                                <label key={key} className="block">
                                    <span className={LABEL}>{label}</span>
                                    <Input value={newForm[key as keyof typeof newForm]} onChange={e => setNewForm(prev => ({ ...prev, [key]: e.target.value }))} placeholder={placeholder} className="rounded-lg h-10" />
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setShowAddModal(false)} className={cn(BTN, "border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>Annuler</button>
                            <button
                                disabled={!newForm.parentName || !newForm.childName || !newForm.phone || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                                className={cn(BTN, "text-white")} style={{ background: BLUE }}
                            >
                                {createMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" /> Création...</> : "Créer la demande"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
