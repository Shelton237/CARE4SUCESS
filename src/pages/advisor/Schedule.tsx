import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
    CalendarDays, CalendarPlus, CheckSquare, FileClock, LayoutList, Search, SlidersHorizontal, ChevronDown, ChevronUp,
    ChevronLeft, ChevronRight, RotateCcw, MoreVertical, MapPin, Clock, Loader2, Pencil, Trash2, CheckCircle2,
    PlayCircle, XCircle, Undo2, FolderOpen, ListChecks, Flag, RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
    createAdvisorAppointment, deleteAdvisorAppointment, fetchAdvisorAppointments, fetchAdvisorFamilies, updateAdvisorAppointment,
} from "@/api/backoffice";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Kind = "rdv" | "tache" | "echeance";
type Ev = {
    id: string; kind: Kind; title: string; date: string; time: string | null; endTime: string | null;
    priority: "haute" | "normale" | "basse"; status: string; location: string | null;
    studentId: string | null; studentName: string | null; parentName: string | null; teacherName: string | null; notes: string | null;
};

const BLUE = "#1A6CC8";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const INPUT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15";
const LABEL = "text-xs font-semibold text-[#0D2D5A] mb-1.5 block";
const DASH = String.fromCharCode(0x2014);

const KINDS: Record<Kind, { label: string; icon: any; tile: string; badge: string }> = {
    rdv: { label: "Rendez-vous", icon: CalendarDays, tile: "bg-blue-50 text-[#1A6CC8]", badge: "bg-blue-50 text-blue-700" },
    tache: { label: "Tâche", icon: CheckSquare, tile: "bg-emerald-50 text-emerald-600", badge: "bg-emerald-50 text-emerald-700" },
    echeance: { label: "Échéance", icon: FileClock, tile: "bg-amber-50 text-amber-600", badge: "bg-amber-50 text-amber-700" },
};
const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
    "planifié": { label: "Planifié", cls: "bg-indigo-50 text-indigo-700" },
    "confirmé": { label: "Confirmé", cls: "bg-sky-50 text-sky-700" },
    "à faire": { label: "À faire", cls: "bg-amber-50 text-amber-700" },
    "en cours": { label: "En cours", cls: "bg-blue-50 text-blue-700" },
    "réalisé": { label: "Réalisé", cls: "bg-emerald-50 text-emerald-700" },
    "terminé": { label: "Terminé", cls: "bg-emerald-50 text-emerald-700" },
    "annulé": { label: "Annulé", cls: "bg-gray-100 text-gray-500" },
};
const STATUS_BY_KIND: Record<Kind, string[]> = {
    rdv: ["planifié", "confirmé", "réalisé", "annulé"],
    tache: ["à faire", "en cours", "terminé", "annulé"],
    echeance: ["à faire", "en cours", "terminé", "annulé"],
};
const LOCATIONS = ["En visioconférence", "Au bureau", "Par téléphone", "Au domicile de la famille"];
const DONE = ["réalisé", "terminé", "annulé"];
const PRIORITY_RANK = { haute: 0, normale: 1, basse: 2 } as const;

const pad = (n: number) => String(n).padStart(2, "0");
const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const nowHm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const clean = (v: unknown) => { const s = String(v ?? "").trim(); return s && s !== DASH ? s : ""; };
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const dayLabel = (date: string) => {
    const today = new Date();
    const t = isoDay(today);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    if (date === t) return "Aujourd'hui";
    if (date === isoDay(tomorrow)) return "Demain";
    if (date === isoDay(yesterday)) return "Hier";
    const [y, m, d] = date.split("-");
    return d && m && y ? `${d}/${m}/${y}` : date;
};
const timeLabel = (e: Ev) => e.time ? (e.endTime ? `${e.time} - ${e.endTime}` : e.time) : "Toute la journée";

// Passé sans être clôturé : « En retard » pour une tâche ou une échéance, « À clôturer » pour un rendez-vous.
const isOverdue = (e: Ev) => {
    if (DONE.includes(e.status)) return false;
    const today = isoDay(new Date());
    if (e.date < today) return true;
    const end = e.endTime || e.time;
    return e.date === today && !!end && end < nowHm();
};
const statusView = (e: Ev) => isOverdue(e)
    ? { label: e.kind === "rdv" ? "À clôturer" : "En retard", cls: "bg-rose-50 text-rose-600" }
    : STATUS_STYLE[e.status] ?? { label: e.status, cls: "bg-gray-100 text-gray-500" };

type Form = {
    id?: string; kind: Kind; title: string; date: string; time: string; endTime: string; location: string;
    priority: Ev["priority"]; status: string; familyKey: string; studentId: string | null; studentName: string;
    parentName: string; teacherName: string; notes: string;
};
const emptyForm = (date = isoDay(new Date())): Form => ({
    kind: "rdv", title: "", date, time: "", endTime: "", location: "", priority: "normale", status: "",
    familyKey: "", studentId: null, studentName: "", parentName: "", teacherName: "", notes: "",
});

type Filters = { status: string; priority: string; from: string; to: string; teacher: string; student: string };
const EMPTY_F: Filters = { status: "", priority: "", from: "", to: "", teacher: "", student: "" };

export default function AdvisorSchedule() {
    const { user } = useAuth();
    const advisorId = user?.id ?? "";
    const location = useLocation();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const [tab, setTab] = useState<"all" | Kind>("all");
    const [search, setSearch] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [f, setF] = useState<Filters>(EMPTY_F);
    const [view, setView] = useState<"list" | "calendar">("list");
    const [sort, setSort] = useState<"near" | "far" | "priority">("near");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [form, setForm] = useState<Form | null>(null);
    const [toDelete, setToDelete] = useState<Ev | null>(null);

    const eventsQuery = useQuery<Ev[]>({
        queryKey: ["advisorAppointments", advisorId],
        queryFn: () => fetchAdvisorAppointments(advisorId),
        enabled: !!advisorId,
    });
    const familiesQuery = useQuery<any[]>({ queryKey: ["advisorFamilies"], queryFn: fetchAdvisorFamilies });
    const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
    const families = useMemo(() => familiesQuery.data ?? [], [familiesQuery.data]);

    const invalidate = () => qc.invalidateQueries({ queryKey: ["advisorAppointments", advisorId] });
    const saveMutation = useMutation({
        mutationFn: ({ id, payload }: { id?: string; payload: any }) =>
            id ? updateAdvisorAppointment(advisorId, id, payload) : createAdvisorAppointment(advisorId, payload),
        onSuccess: (_d, v) => { invalidate(); setForm(null); toast.success(v.id ? "Événement mis à jour" : "Événement ajouté à l'agenda"); },
        onError: (e: any) => toast.error(e?.message || "Enregistrement impossible"),
    });
    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateAdvisorAppointment(advisorId, id, { status }),
        onSuccess: () => { invalidate(); toast.success("Statut mis à jour"); },
        onError: (e: any) => toast.error(e?.message || "Mise à jour impossible"),
    });
    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteAdvisorAppointment(advisorId, id),
        onSuccess: () => { invalidate(); setToDelete(null); toast.success("Événement supprimé"); },
        onError: (e: any) => toast.error(e?.message || "Suppression impossible"),
    });

    // Arrivée depuis « Planifier un rendez-vous » (Mes élèves, Demandes de bilan) : formulaire prérempli.
    // L'élève est retrouvé par l'identifiant de sa fiche, jamais par son nom.
    const incoming = location.state as { familyId?: string; familyName?: string; childName?: string; type?: string } | null;
    useEffect(() => {
        if (!incoming || (incoming.familyId && familiesQuery.isLoading)) return;
        const fam = incoming.familyId ? families.find(x => String(x.id) === String(incoming.familyId)) : null;
        setForm({
            ...emptyForm(),
            title: incoming.type || "",
            ...(fam ? familyFields(fam) : {
                familyKey: incoming.childName || incoming.familyName ? "__keep" : "",
                studentName: clean(incoming.childName), parentName: clean(incoming.familyName),
            }),
        });
        navigate(location.pathname, { replace: true, state: null });
    }, [incoming, families, familiesQuery.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const options = useMemo(() => {
        const uniq = (l: (string | null)[]) => [...new Set(l.map(clean).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
        return {
            teachers: uniq(events.map(e => e.teacherName)),
            students: uniq(events.map(e => e.studentName)),
            familyTeachers: uniq(families.map(x => x.teacher)),
        };
    }, [events, families]);

    // Filtres hors onglet : sert aussi aux compteurs des onglets
    const base = useMemo(() => {
        const q = norm(search);
        return events.filter(e => {
            if (f.status === "late" && !isOverdue(e)) return false;
            if (f.status === "active" && DONE.includes(e.status)) return false;
            if (f.status === "done" && !["réalisé", "terminé"].includes(e.status)) return false;
            if (f.status === "annulé" && e.status !== "annulé") return false;
            if (f.priority && e.priority !== f.priority) return false;
            if (f.from && e.date < f.from) return false;
            if (f.to && e.date > f.to) return false;
            if (f.teacher && clean(e.teacherName) !== f.teacher) return false;
            if (f.student && clean(e.studentName) !== f.student) return false;
            if (q && !norm([e.title, e.studentName, e.parentName, e.teacherName, e.location, e.notes].join(" ")).includes(q)) return false;
            return true;
        });
    }, [events, f, search]);

    const counts = useMemo(() => ({
        all: base.length,
        rdv: base.filter(e => e.kind === "rdv").length,
        tache: base.filter(e => e.kind === "tache").length,
        echeance: base.filter(e => e.kind === "echeance").length,
    }), [base]);

    const filtered = useMemo(() => {
        const list = base.filter(e => tab === "all" || e.kind === tab);
        const key = (e: Ev) => `${e.date} ${e.time || "00:00"}`;
        const done = (e: Ev) => DONE.includes(e.status) ? 1 : 0;
        return list.sort((a, b) => {
            if (sort === "far") return key(b).localeCompare(key(a));
            // À traiter d'abord (en retard puis à venir), les éléments clôturés en dernier
            if (done(a) !== done(b)) return done(a) - done(b);
            if (sort === "priority" && a.priority !== b.priority) return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
            return done(a) ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b));
        });
    }, [base, tab, sort]);

    useEffect(() => { setPage(1); }, [tab, f, search, sort, pageSize]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;
    const pageItems = filtered.slice(start, start + pageSize);
    const activeFilters = Object.values(f).filter(Boolean).length;
    const lateCount = events.filter(isOverdue).length;

    function familyFields(fam: any): Partial<Form> {
        const teacher = clean(fam.teacher);
        return {
            familyKey: String(fam.id),
            studentId: fam.studentId || fam.childId || null,
            studentName: clean(fam.childName || fam.child),
            parentName: clean(fam.parentName || fam.parent),
            ...(teacher ? { teacherName: teacher } : {}),
        };
    }

    const openEdit = (e: Ev) => {
        const fam = e.studentId ? families.find(x => (x.studentId || x.childId) === e.studentId) : null;
        setForm({
            id: e.id, kind: e.kind, title: e.title, date: e.date, time: e.time || "", endTime: e.endTime || "",
            location: e.location || "", priority: e.priority, status: e.status,
            familyKey: fam ? String(fam.id) : e.studentName || e.parentName ? "__keep" : "",
            studentId: e.studentId, studentName: e.studentName || "", parentName: e.parentName || "",
            teacherName: e.teacherName || "", notes: e.notes || "",
        });
    };

    const submit = (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!form) return;
        const payload: any = {
            kind: form.kind, title: form.title, date: form.date, time: form.time || null,
            endTime: form.kind === "rdv" ? form.endTime || null : null,
            location: form.kind === "rdv" ? form.location : "", priority: form.priority,
            studentId: form.studentId, studentName: form.studentName, parentName: form.parentName,
            teacherName: form.teacherName, notes: form.notes,
        };
        if (form.id) payload.status = STATUS_BY_KIND[form.kind].includes(form.status) ? form.status : STATUS_BY_KIND[form.kind][0];
        saveMutation.mutate({ id: form.id, payload });
    };

    const people = (e: Ev) => [
        e.studentName && <>Élève : <strong className="font-semibold text-[#0D2D5A]">{e.studentName}</strong></>,
        e.parentName && <>Parent : {e.parentName}</>,
        e.teacherName && <>Enseignant : {e.teacherName}</>,
    ].filter(Boolean);

    const quickActions = (e: Ev) => {
        const set = (status: string) => statusMutation.mutate({ id: e.id, status });
        if (DONE.includes(e.status)) {
            return <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => set(STATUS_BY_KIND[e.kind][0])}><Undo2 className="w-4 h-4" /> Rouvrir</DropdownMenuItem>;
        }
        return (
            <>
                {e.kind === "rdv" && e.status === "planifié" && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => set("confirmé")}><CheckCircle2 className="w-4 h-4" /> Confirmer</DropdownMenuItem>}
                {e.kind !== "rdv" && e.status === "à faire" && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => set("en cours")}><PlayCircle className="w-4 h-4" /> Démarrer</DropdownMenuItem>}
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => set(e.kind === "rdv" ? "réalisé" : "terminé")}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> {e.kind === "rdv" ? "Marquer comme réalisé" : "Marquer comme terminé"}
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => set("annulé")}><XCircle className="w-4 h-4" /> Annuler</DropdownMenuItem>
            </>
        );
    };

    const menu = (e: Ev) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label={`Actions pour ${e.title}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openEdit(e)}><Pencil className="w-4 h-4" /> Modifier</DropdownMenuItem>
                {quickActions(e)}
                {e.studentId && (
                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/families", { state: { familyId: e.studentId } })}>
                        <FolderOpen className="w-4 h-4" /> Ouvrir la fiche élève
                    </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600" onClick={() => setToDelete(e)}><Trash2 className="w-4 h-4" /> Supprimer</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const row = (e: Ev) => {
        const k = KINDS[e.kind], s = statusView(e), who = people(e);
        return (
            <div key={e.id} className={cn("rounded-xl border border-gray-100 px-4 py-3 grid grid-cols-[auto_minmax(0,1fr)] md:grid-cols-[auto_minmax(0,1fr)_200px_130px_auto] gap-x-4 gap-y-2 items-center", DONE.includes(e.status) && "opacity-70")}>
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center", k.tile)}><k.icon className="w-5 h-5" /></div>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-md", k.badge)}>{k.label}</span>
                        {e.priority === "haute" && !DONE.includes(e.status) && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 inline-flex items-center gap-1"><Flag className="w-3 h-3" /> Haute priorité</span>}
                    </div>
                    <button onClick={() => openEdit(e)} className={cn("text-sm font-bold text-[#0D2D5A] hover:underline text-left mt-0.5", e.status === "annulé" && "line-through")}>{e.title}</button>
                    {who.length > 0 && <p className="text-xs text-gray-500 truncate">{who.map((w, i) => <span key={i}>{i > 0 && " • "}{w}</span>)}</p>}
                </div>
                <div className="col-start-2 md:col-start-auto text-xs space-y-1">
                    <p className="flex items-center gap-2"><CalendarDays className="w-4 h-4 text-gray-400 shrink-0" /><span className="font-semibold text-[#0D2D5A]">{dayLabel(e.date)}</span><span className="text-gray-500">{timeLabel(e)}</span></p>
                    {e.location && <p className="flex items-center gap-2 text-gray-500"><MapPin className="w-4 h-4 text-gray-400 shrink-0" />{e.location}</p>}
                </div>
                <div className="col-start-2 md:col-start-auto"><span className={cn("inline-flex text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap", s.cls)}>{s.label}</span></div>
                <div className="col-start-2 md:col-start-auto md:justify-self-end">{menu(e)}</div>
            </div>
        );
    };

    // Calendrier mensuel (semaines du lundi au dimanche)
    const calendarDays = useMemo(() => {
        const first = new Date(month);
        const offset = (first.getDay() + 6) % 7;
        const startDay = new Date(first); startDay.setDate(first.getDate() - offset);
        return Array.from({ length: 42 }, (_, i) => { const d = new Date(startDay); d.setDate(startDay.getDate() + i); return d; });
    }, [month]);
    const byDay = useMemo(() => {
        const m = new Map<string, Ev[]>();
        filtered.forEach(e => m.set(e.date, [...(m.get(e.date) || []), e]));
        m.forEach(l => l.sort((a, b) => (a.time || "").localeCompare(b.time || "")));
        return m;
    }, [filtered]);

    const tabs: { key: "all" | Kind; label: string; icon: any; n: number }[] = [
        { key: "all", label: "Tous", icon: LayoutList, n: counts.all },
        { key: "rdv", label: "Rendez-vous", icon: CalendarDays, n: counts.rdv },
        { key: "tache", label: "Tâches", icon: CheckSquare, n: counts.tache },
        { key: "echeance", label: "Échéances", icon: FileClock, n: counts.echeance },
    ];
    const setFormField = <K extends keyof Form>(k: K, v: Form[K]) => setForm(x => (x ? { ...x, [k]: v } : x));

    return (
        <div className="w-full p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Tâches & Rendez-vous</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Gérez vos tâches et vos rendez-vous avec les familles, les élèves et les enseignants.</p>
                </div>
                <button onClick={() => setForm(emptyForm())} className={cn(BTN, "text-white shadow-sm")} style={{ background: BLUE }}>
                    <CalendarPlus className="w-4 h-4" /> Nouvel événement
                </button>
            </div>

            <div role="tablist" className="bg-white rounded-2xl shadow-sm border border-gray-100 flex gap-6 px-5 overflow-x-auto">
                {tabs.map(t => (
                    <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
                        className={cn("flex items-center gap-2 py-3.5 text-sm font-bold border-b-2 whitespace-nowrap", tab === t.key ? "border-[#1A6CC8] text-[#0D2D5A]" : "border-transparent text-gray-500 hover:text-[#0D2D5A]")}>
                        <t.icon className="w-4 h-4" /> {t.label}
                        <span className={cn("min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] flex items-center justify-center", tab === t.key ? "text-white" : "bg-[#1A6CC8]/10 text-[#1A6CC8]")} style={tab === t.key ? { background: BLUE } : undefined}>{t.n}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
                {/* Recherche et filtres (repliés) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                    <p className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A]"><SlidersHorizontal className="w-4 h-4" /> Filtres et recherche</p>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input aria-label="Rechercher" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève, parent, enseignant..." className={cn(INPUT, "pl-9")} />
                    </div>
                    {lateCount > 0 && (
                        <button onClick={() => setF(x => ({ ...x, status: x.status === "late" ? "" : "late" }))} aria-pressed={f.status === "late"}
                            className={cn("w-full rounded-lg px-3 py-2 text-left text-xs font-semibold border", f.status === "late" ? "border-rose-300 bg-rose-50 text-rose-700" : "border-rose-100 text-rose-600 hover:bg-rose-50")}>
                            {lateCount} élément{lateCount > 1 ? "s" : ""} en retard ou à clôturer
                        </button>
                    )}
                    <button onClick={() => setShowFilters(o => !o)} aria-expanded={showFilters}
                        className={cn(BTN, "w-full justify-between border", activeFilters ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>
                        <span className="flex items-center gap-2"><SlidersHorizontal className="w-4 h-4" /> Filtres avancés{activeFilters ? ` · ${activeFilters}` : ""}</span>
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {showFilters && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <label><span className={LABEL}>Statut</span>
                                    <select value={f.status} onChange={e => setF(x => ({ ...x, status: e.target.value }))} className={INPUT}>
                                        <option value="">Tous</option><option value="active">À traiter</option><option value="late">En retard</option>
                                        <option value="done">Terminés</option><option value="annulé">Annulés</option>
                                    </select>
                                </label>
                                <label><span className={LABEL}>Priorité</span>
                                    <select value={f.priority} onChange={e => setF(x => ({ ...x, priority: e.target.value }))} className={INPUT}>
                                        <option value="">Toutes</option><option value="haute">Haute</option><option value="normale">Normale</option><option value="basse">Basse</option>
                                    </select>
                                </label>
                            </div>
                            <div>
                                <span className={LABEL}>Période</span>
                                <div className="flex items-center gap-2">
                                    <input type="date" aria-label="Du" value={f.from} onChange={e => setF(x => ({ ...x, from: e.target.value }))} className={cn(INPUT, "px-2")} />
                                    <span className="text-gray-400">→</span>
                                    <input type="date" aria-label="Au" value={f.to} onChange={e => setF(x => ({ ...x, to: e.target.value }))} className={cn(INPUT, "px-2")} />
                                </div>
                            </div>
                            <label className="block"><span className={LABEL}>Intervenant</span>
                                <select value={f.teacher} onChange={e => setF(x => ({ ...x, teacher: e.target.value }))} className={INPUT}>
                                    <option value="">Tous</option>{options.teachers.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>
                            <label className="block"><span className={LABEL}>Élève / Famille</span>
                                <select value={f.student} onChange={e => setF(x => ({ ...x, student: e.target.value }))} className={INPUT}>
                                    <option value="">Tous</option>{options.students.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </label>
                        </div>
                    )}
                    {(activeFilters > 0 || search) && (
                        <button onClick={() => { setF(EMPTY_F); setSearch(""); }} className={cn(BTN, "w-full border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}>
                            <RotateCcw className="w-4 h-4" /> Réinitialiser
                        </button>
                    )}
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex gap-2" role="group" aria-label="Affichage">
                            <button onClick={() => setView("list")} aria-pressed={view === "list"} className={cn(BTN, view === "list" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "list" ? { background: BLUE } : undefined}>
                                <ListChecks className="w-4 h-4" /> Liste
                            </button>
                            <button onClick={() => setView("calendar")} aria-pressed={view === "calendar"} className={cn(BTN, view === "calendar" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "calendar" ? { background: BLUE } : undefined}>
                                <CalendarDays className="w-4 h-4" /> Calendrier
                            </button>
                        </div>
                        {view === "list" ? (
                            <label className="flex items-center gap-2 text-xs text-gray-500">Trier par :
                                <select value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
                                    <option value="near">Date la plus proche</option><option value="far">Date la plus lointaine</option><option value="priority">Priorité</option>
                                </select>
                            </label>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button aria-label="Mois précédent" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-sm font-bold text-[#0D2D5A] w-36 text-center capitalize">{month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
                                <button aria-label="Mois suivant" onClick={() => setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1))} className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center"><ChevronRight className="w-4 h-4" /></button>
                            </div>
                        )}
                    </div>

                    {eventsQuery.isLoading ? (
                        <div className="py-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" /></div>
                    ) : eventsQuery.isError ? (
                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700 flex items-center justify-between">
                            <span>Impossible de charger l'agenda.</span>
                            <button onClick={() => eventsQuery.refetch()} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100"><RefreshCw className="w-3 h-3" /> Réessayer</button>
                        </div>
                    ) : view === "list" ? (
                        <>
                            <p className="text-sm font-bold text-[#0D2D5A]">Événements <span className="text-gray-400 font-semibold">({filtered.length})</span></p>
                            {filtered.length === 0 ? (
                                <div className="py-12 text-center text-sm text-gray-500">
                                    <CalendarDays className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                                    {events.length ? "Aucun événement ne correspond aux filtres." : "Votre agenda est vide. Ajoutez un rendez-vous, une tâche ou une échéance."}
                                </div>
                            ) : (
                                <div className="space-y-2">{pageItems.map(row)}</div>
                            )}
                            {filtered.length > 0 && (
                                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                                    <span className="text-xs text-gray-500">Affichage {start + 1}-{Math.min(start + pageSize, filtered.length)} sur {filtered.length} éléments</span>
                                    <div className="flex items-center gap-3">
                                        <select aria-label="Éléments par page" value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-9 border border-gray-200 rounded-lg px-2 text-xs bg-white">
                                            {[10, 20, 50].map(n => <option key={n} value={n}>{n} par page</option>)}
                                        </select>
                                        <nav aria-label="Pagination de l'agenda" className="flex items-center gap-1">
                                            <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                                                <button key={n} onClick={() => setPage(n)} aria-current={n === current ? "page" : undefined}
                                                    className={cn("w-9 h-9 rounded-lg text-xs font-bold", n === current ? "text-white" : "border border-gray-200 text-gray-500")} style={n === current ? { background: BLUE } : undefined}>{n}</button>
                                            ))}
                                            <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                                        </nav>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="overflow-x-auto">
                            <div className="grid grid-cols-7 min-w-[700px] border-l border-t border-gray-100 text-xs">
                                {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d} className="px-2 py-2 font-bold text-gray-400 border-r border-b border-gray-100 bg-gray-50/60">{d}</div>)}
                                {calendarDays.map(d => {
                                    const key = isoDay(d), list = byDay.get(key) || [], inMonth = d.getMonth() === month.getMonth();
                                    const isToday = key === isoDay(new Date());
                                    return (
                                        <div key={key} className={cn("min-h-[104px] border-r border-b border-gray-100 p-1.5 space-y-1", !inMonth && "bg-gray-50/50")}>
                                            <button onClick={() => setForm(emptyForm(key))} title="Ajouter un événement ce jour"
                                                className={cn("w-6 h-6 rounded-full text-[11px] font-bold", isToday ? "text-white" : inMonth ? "text-[#0D2D5A] hover:bg-gray-100" : "text-gray-300")} style={isToday ? { background: BLUE } : undefined}>
                                                {d.getDate()}
                                            </button>
                                            {list.slice(0, 3).map(e => (
                                                <button key={e.id} onClick={() => openEdit(e)} title={`${e.title} · ${timeLabel(e)}`}
                                                    className={cn("w-full text-left truncate rounded px-1.5 py-0.5 text-[11px] font-medium", KINDS[e.kind].badge, isOverdue(e) && "ring-1 ring-rose-300", DONE.includes(e.status) && "opacity-60 line-through")}>
                                                    {e.time ? `${e.time} ` : ""}{e.title}
                                                </button>
                                            ))}
                                            {list.length > 3 && <p className="text-[10px] text-gray-400 px-1">+{list.length - 3} autre{list.length - 3 > 1 ? "s" : ""}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Création / modification */}
            <Dialog open={!!form} onOpenChange={open => { if (!open) setForm(null); }}>
                <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                    {form && (
                        <form onSubmit={submit} className="space-y-4">
                            <DialogHeader>
                                <DialogTitle>{form.id ? "Modifier l'événement" : "Nouvel événement"}</DialogTitle>
                                <DialogDescription>Rendez-vous avec une famille, tâche à réaliser ou échéance à respecter.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Type d'événement">
                                {(Object.keys(KINDS) as Kind[]).map(k => {
                                    const K = KINDS[k];
                                    return (
                                        <button type="button" key={k} role="radio" aria-checked={form.kind === k} onClick={() => setFormField("kind", k)}
                                            className={cn("h-10 rounded-lg border text-sm font-semibold flex items-center justify-center gap-2", form.kind === k ? "border-[#1A6CC8] bg-[#1A6CC8]/5 text-[#1A6CC8]" : "border-gray-200 text-gray-500")}>
                                            <K.icon className="w-4 h-4" /> {K.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <label className="block"><span className={LABEL}>Titre *</span>
                                <input required value={form.title} onChange={e => setFormField("title", e.target.value)} className={INPUT}
                                    placeholder={form.kind === "rdv" ? "Ex. Entretien avec la famille" : form.kind === "tache" ? "Ex. Envoyer le bilan pédagogique" : "Ex. Remise du rapport mensuel"} />
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <label><span className={LABEL}>Date *</span><input type="date" required value={form.date} onChange={e => setFormField("date", e.target.value)} className={INPUT} /></label>
                                <label><span className={LABEL}>{form.kind === "rdv" ? "Début" : "Heure (facultatif)"}</span><input type="time" value={form.time} onChange={e => setFormField("time", e.target.value)} className={INPUT} /></label>
                                {form.kind === "rdv" && <label><span className={LABEL}>Fin</span><input type="time" value={form.endTime} min={form.time || undefined} onChange={e => setFormField("endTime", e.target.value)} className={INPUT} /></label>}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {form.kind === "rdv" && (
                                    <label><span className={LABEL}>Lieu</span>
                                        <input list="agenda-locations" value={form.location} onChange={e => setFormField("location", e.target.value)} className={INPUT} placeholder="Visioconférence, bureau..." />
                                        <datalist id="agenda-locations">{LOCATIONS.map(l => <option key={l} value={l} />)}</datalist>
                                    </label>
                                )}
                                <label><span className={LABEL}>Priorité</span>
                                    <select value={form.priority} onChange={e => setFormField("priority", e.target.value as Form["priority"])} className={INPUT}>
                                        <option value="haute">Haute</option><option value="normale">Normale</option><option value="basse">Basse</option>
                                    </select>
                                </label>
                                {form.id && (
                                    <label><span className={LABEL}>Statut</span>
                                        <select value={STATUS_BY_KIND[form.kind].includes(form.status) ? form.status : STATUS_BY_KIND[form.kind][0]} onChange={e => setFormField("status", e.target.value)} className={INPUT}>
                                            {STATUS_BY_KIND[form.kind].map(s => <option key={s} value={s}>{STATUS_STYLE[s].label}</option>)}
                                        </select>
                                    </label>
                                )}
                            </div>
                            <label className="block"><span className={LABEL}>Élève / famille concernée</span>
                                <select value={form.familyKey} onChange={e => {
                                    const v = e.target.value;
                                    if (v === "__keep") return;
                                    const fam = families.find(x => String(x.id) === v);
                                    setForm(x => x && (fam ? { ...x, ...familyFields(fam) } : { ...x, familyKey: "", studentId: null, studentName: "", parentName: "" }));
                                }} className={INPUT}>
                                    <option value="">Aucun élève</option>
                                    {form.familyKey === "__keep" && <option value="__keep">{[form.studentName, form.parentName].filter(Boolean).join(" · ")} (non relié à une fiche)</option>}
                                    {families.map(x => (
                                        <option key={x.id} value={String(x.id)}>{clean(x.childName || x.child) || "Élève"}{clean(x.parentName || x.parent) ? ` · ${clean(x.parentName || x.parent)}` : ""}{clean(x.level) ? ` (${clean(x.level)})` : ""}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="block"><span className={LABEL}>Enseignant / tuteur</span>
                                <input list="agenda-teachers" value={form.teacherName} onChange={e => setFormField("teacherName", e.target.value)} className={INPUT} placeholder="Facultatif" />
                                <datalist id="agenda-teachers">{options.familyTeachers.map(t => <option key={t} value={t} />)}</datalist>
                            </label>
                            <label className="block"><span className={LABEL}>Notes</span>
                                <textarea value={form.notes} onChange={e => setFormField("notes", e.target.value)} rows={3} className={cn(INPUT, "h-auto py-2")} placeholder="Ordre du jour, documents à préparer..." />
                            </label>
                            <DialogFooter className="gap-2">
                                <button type="button" onClick={() => setForm(null)} className={cn(BTN, "border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>Annuler</button>
                                <button type="submit" disabled={saveMutation.isPending} className={cn(BTN, "text-white")} style={{ background: BLUE }}>
                                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                    {form.id ? "Enregistrer" : "Ajouter à l'agenda"}
                                </button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!toDelete} onOpenChange={open => { if (!open) setToDelete(null); }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer cet événement ?</AlertDialogTitle>
                        <AlertDialogDescription>« {toDelete?.title} » sera retiré définitivement de votre agenda. Pour garder une trace, préférez « Annuler ».</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Garder</AlertDialogCancel>
                        <AlertDialogAction onClick={() => toDelete && deleteMutation.mutate(toDelete.id)} className="bg-rose-600 hover:bg-rose-700">Supprimer</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
