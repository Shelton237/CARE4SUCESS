import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
    FileText, CalendarClock, CalendarX2, TrendingDown, ClipboardList, Frown, AlertTriangle, CalendarCheck, ArrowRight, ChevronRight,
    Info, Users, TrendingUp, CalendarDays, FileCheck2, Star, Clock, Search, SlidersHorizontal, Download, MoreVertical, Loader2,
    RefreshCw, ChevronLeft, ChevronDown, FolderOpen, ClipboardCheck, MessageSquare, BookOpen, Route, BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdvisorFollowup } from "@/api/backoffice";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type AlertItem = { familyId: string | null; studentId: string | null; name: string; detail: string };
type AlertGroup = { key: string; label: string; rule: string; short: string; count: number; items: AlertItem[] };
type Row = {
    familyId: string; studentId: string | null; name: string; level: string | null; initialAvg: number | null; latestAvg: number | null;
    delta: number | null; evaluations: number; lastEvalAt: string | null; sessions30: { done: number; planned: number };
    homeworkRate: number | null; homeworkCount: number; feedback: { avg: number | null; n: number }; alerts: string[]; step: string; stepLabel: string;
};
type Followup = {
    period: { from: string; to: string };
    alerts: AlertGroup[];
    kpis: {
        students: { total: number; variation: number | null; withDiagnostic: number; withPlan: number; withTutor: number };
        progression: { avg: number | null; n: number; variation: number | null };
        attendance: { rate: number | null; n: number; variation: number | null };
        homework: { rate: number | null; n: number; variation: number | null; correctionDays: number | null; correctionN: number };
        satisfaction: { avg: number | null; n: number; variation: number | null };
    };
    funnel: { key: string; label: string; count: number; medianDays: number | null; n: number | null }[];
    subjects: { subject: string; n: number; initial: number; latest: number; delta: number; reliability: number | null; measures: number }[];
    evaluatedStudents: number;
    evaluatorGap: { avg: number | null; n: number };
    students: Row[];
};

const BLUE = "#1A6CC8";
const PAGE_SIZE = 10;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const fmt = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? "" : n.toLocaleString("fr-FR", { minimumFractionDigits: digits, maximumFractionDigits: digits }));
const signed = (n: number, digits = 1) => `${n > 0 ? "+" : ""}${fmt(n, digits)}`;
const dateLabel = (k: string) => new Date(`${k}T12:00:00`).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const longDate = (v: string | null) => (v ? new Date(v).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");
const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const PRESETS = [
    { key: "30d", label: "30 derniers jours", range: () => { const t = new Date(); return [iso(addDays(t, -29)), iso(t)]; } },
    { key: "month", label: "Mois en cours", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth(), 1)), iso(t)]; } },
    { key: "prev", label: "Mois précédent", range: () => { const t = new Date(); return [iso(new Date(t.getFullYear(), t.getMonth() - 1, 1)), iso(new Date(t.getFullYear(), t.getMonth(), 0))]; } },
    { key: "90d", label: "3 derniers mois", range: () => { const t = new Date(); return [iso(addDays(t, -89)), iso(t)]; } },
];

const ALERT_STYLE: Record<string, { icon: any; cls: string }> = {
    diagPending: { icon: FileText, cls: "bg-orange-50 text-orange-500" },
    reevalDue: { icon: CalendarClock, cls: "bg-blue-50 text-blue-600" },
    planNoSession: { icon: CalendarX2, cls: "bg-violet-50 text-violet-600" },
    regression: { icon: TrendingDown, cls: "bg-rose-50 text-rose-500" },
    homeworkLate: { icon: ClipboardList, cls: "bg-emerald-50 text-emerald-600" },
    dissatisfaction: { icon: Frown, cls: "bg-amber-50 text-amber-500" },
    alertNote: { icon: AlertTriangle, cls: "bg-indigo-50 text-indigo-500" },
    agenda: { icon: CalendarCheck, cls: "bg-teal-50 text-teal-600" },
};
const ALERT_PANEL: Record<string, string> = { diagPending: "diagnostic", reevalDue: "diagnostic", regression: "diagnostic", planNoSession: "plan", alertNote: "notes" };
const ALERT_CHIP: Record<string, string> = {
    "Recul mesuré": "bg-rose-50 text-rose-600", "Insatisfaction parent": "bg-rose-50 text-rose-600",
    "Devoirs en retard": "bg-amber-50 text-amber-700", "Plan sans séance": "bg-amber-50 text-amber-700",
};
const FUNNEL_COLORS = ["#E0ECFB", "#DDF3EA", "#FDF1D6", "#ECE4FB", "#E0ECFB", "#DDF3EA"];
const SUBJECT_COLORS = ["#0F9B8E", "#7C3AED", "#4F46E5", "#1A6CC8", "#D97706", "#BE185D"];

function Variation({ value, unit = "", digits = 1, title }: { value: number | null; unit?: string; digits?: number; title?: string }) {
    if (value === null || value === undefined) return null;
    const up = value >= 0;
    return (
        <span title={title} className={cn("inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap", up ? "text-emerald-700" : "text-rose-600")}>
            {up ? "↑" : "↓"} {signed(value, digits)}{unit}
        </span>
    );
}

function Ring({ value, color }: { value: number | null; color: string }) {
    const r = 15, c = 2 * Math.PI * r, v = value ?? 0;
    return (
        <svg width="38" height="38" viewBox="0 0 38 38" aria-label={value === null ? "Fiabilité non mesurée" : `Fiabilité ${value}%`}>
            <circle cx="19" cy="19" r={r} fill="none" stroke="#EEF2F7" strokeWidth="4" />
            <circle cx="19" cy="19" r={r} fill="none" stroke={color} strokeWidth="4" strokeDasharray={c} strokeDashoffset={c * (1 - v / 100)} strokeLinecap="round" transform="rotate(-90 19 19)" />
            <text x="19" y="22" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0D2D5A">{value === null ? "?" : `${value}%`}</text>
        </svg>
    );
}

export default function AdvisorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [range, setRange] = useState<[string, string]>(() => PRESETS[0].range() as [string, string]);
    const [custom, setCustom] = useState<[string, string]>(range);
    const [alertOpen, setAlertOpen] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [stepFilter, setStepFilter] = useState<string[]>([]);
    const [onlyAlerts, setOnlyAlerts] = useState(false);
    const [onlyRegress, setOnlyRegress] = useState(false);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [page, setPage] = useState(1);

    const query = useQuery<Followup>({
        queryKey: ["advisorFollowup", range[0], range[1]],
        queryFn: () => fetchAdvisorFollowup(range[0], range[1]),
        enabled: !!user?.id,
    });
    const data = query.data;

    const rows = useMemo(() => {
        const q = norm(search);
        return (data?.students ?? []).filter(r => {
            if (q && !norm(`${r.name} ${r.level ?? ""}`).includes(q)) return false;
            if (stepFilter.length && !stepFilter.includes(r.step)) return false;
            if (onlyAlerts && !r.alerts.length) return false;
            if (onlyRegress && !(r.delta !== null && r.delta < 0)) return false;
            return true;
        }).sort((a, b) => b.alerts.length - a.alerts.length || (b.lastEvalAt || "").localeCompare(a.lastEvalAt || ""));
    }, [data, search, stepFilter, onlyAlerts, onlyRegress]);
    useEffect(() => { setPage(1); }, [search, stepFilter, onlyAlerts, onlyRegress, range]);
    const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const pageRows = rows.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

    const openFile = (familyId: string | null, studentId: string | null, panel?: string) =>
        navigate("/advisor/families", { state: { familyId: familyId || studentId, ...(panel ? { defaultPanel: panel } : {}) } });

    const exportCsv = () => {
        const list = selected.size ? rows.filter(r => selected.has(r.familyId)) : rows;
        const cell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const lines = [
            ["Élève", "Niveau", "Niveau initial", "Niveau actuel", "Écart", "Dernière évaluation", "Séances effectuées (30 j)", "Séances prévues (30 j)", "Devoirs rendus (%)", "Avis parent", "Nombre d'avis", "Alertes", "Étape du parcours"],
            ...list.map(r => [r.name, r.level, fmt(r.initialAvg), fmt(r.latestAvg), r.delta === null ? "" : signed(r.delta), longDate(r.lastEvalAt), r.sessions30.done, r.sessions30.planned, r.homeworkRate ?? "", fmt(r.feedback.avg), r.feedback.n, r.alerts.join(" ; "), r.stepLabel]),
        ];
        const blob = new Blob(["﻿" + lines.map(l => l.map(cell).join(";")).join("\n")], { type: "text/csv;charset=utf-8" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `suivi-eleves-${range[0]}-${range[1]}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const firstName = (user?.name || "").trim().split(/\s+/)[0] || "";
    const totalAlerts = data?.alerts.reduce((a, g) => a + g.count, 0) ?? 0;
    const activePreset = PRESETS.find(p => { const [a, b] = p.range(); return a === range[0] && b === range[1]; });
    const openGroup = data?.alerts.find(g => g.key === alertOpen) || null;

    if (query.isError) {
        return (
            <div className="p-4 md:p-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-700 flex items-center justify-between">
                    <span>Impossible de charger le tableau de bord.</span>
                    <button onClick={() => query.refetch()} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100"><RefreshCw className="w-3 h-3" /> Réessayer</button>
                </div>
            </div>
        );
    }

    const k = data?.kpis;
    const total = k?.students.total ?? 0;
    const bar = (label: string, n: number, color: string) => (
        <div>
            <div className="flex items-center justify-between text-xs"><span className="text-[#0D2D5A]">{label}</span><span className="text-gray-400 text-[11px]">{total ? Math.round((n / total) * 100) : 0}% ({n}/{total})</span></div>
            <div className="h-1.5 rounded-full bg-gray-100 mt-1"><div className="h-full rounded-full" style={{ width: `${total ? (n / total) * 100 : 0}%`, background: color }} /></div>
        </div>
    );
    const kpiCard = (icon: any, iconCls: string, value: string, label: string, variation: React.ReactNode, children: React.ReactNode) => {
        const Icon = icon;
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 min-w-0">
                <div className="flex items-start gap-3">
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", iconCls)}><Icon className="w-6 h-6" /></div>
                    <div className="flex-1 min-w-0"><p className="text-2xl font-bold text-[#0D2D5A] leading-tight">{value}</p><p className="text-sm text-[#0D2D5A]">{label}</p></div>
                    {variation}
                </div>
                {children}
            </div>
        );
    };

    return (
        <TooltipProvider>
            <div className="w-full p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-[#0D2D5A]">Bonjour{firstName ? `, ${firstName}` : ""} 👋</h1>
                        <p className="text-gray-500 text-sm mt-0.5">Voici un aperçu de l'activité pédagogique et du suivi de vos élèves.</p>
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="h-10 px-4 rounded-xl bg-white border border-gray-200 shadow-sm flex items-center gap-2 text-sm text-[#0D2D5A]" aria-label="Choisir la période">
                                <CalendarDays className="w-4 h-4 text-gray-400" /> <span className="text-gray-500">Période :</span>
                                <span className="font-semibold">{dateLabel(range[0])} – {dateLabel(range[1])}</span><ChevronDown className="w-4 h-4 text-gray-400" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-72 space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                {PRESETS.map(p => (
                                    <button key={p.key} onClick={() => { const r = p.range() as [string, string]; setRange(r); setCustom(r); }}
                                        className={cn("h-9 rounded-lg border text-xs font-semibold", activePreset?.key === p.key ? "border-[#1A6CC8] bg-[#1A6CC8]/5 text-[#1A6CC8]" : "border-gray-200 text-[#0D2D5A]")}>{p.label}</button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="date" aria-label="Du" value={custom[0]} max={custom[1]} onChange={e => setCustom([e.target.value, custom[1]])} className="h-9 flex-1 border border-gray-200 rounded-lg px-2 text-xs" />
                                <input type="date" aria-label="Au" value={custom[1]} min={custom[0]} onChange={e => setCustom([custom[0], e.target.value])} className="h-9 flex-1 border border-gray-200 rounded-lg px-2 text-xs" />
                            </div>
                            <button disabled={!custom[0] || !custom[1] || custom[0] > custom[1]} onClick={() => setRange(custom)} className="w-full h-9 rounded-lg text-white text-sm font-semibold disabled:opacity-40" style={{ background: BLUE }}>Appliquer</button>
                            <p className="text-[11px] text-gray-400">Les variations comparent à la période précédente de même durée.</p>
                        </PopoverContent>
                    </Popover>
                </div>

                {query.isLoading || !data || !k ? (
                    <div className="py-24 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" /></div>
                ) : (
                    <>
                        {/* À traiter aujourd'hui */}
                        <section className="rounded-2xl border border-rose-100 bg-rose-50/40 p-4 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-rose-500 shadow-sm"><FileText className="w-5 h-5" /></div>
                                    <div>
                                        <h2 className="text-lg font-bold text-[#0D2D5A] flex items-center gap-2">À traiter aujourd'hui
                                            <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center">{totalAlerts}</span></h2>
                                        <p className="text-xs text-gray-500">Cliquez sur une alerte pour accéder directement au dossier concerné.</p>
                                    </div>
                                </div>
                                <button onClick={() => setAlertOpen("__all")} className="text-sm font-semibold text-[#1A6CC8] flex items-center gap-1">Voir tout <ArrowRight className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 2xl:grid-cols-8 gap-3">
                                {data.alerts.map(g => {
                                    const st = ALERT_STYLE[g.key];
                                    return (
                                        <button key={g.key} onClick={() => setAlertOpen(g.key)} aria-label={`${g.label} : ${g.count}`}
                                            className={cn("bg-white rounded-xl border border-gray-100 p-3 text-left flex flex-col justify-start hover:border-[#1A6CC8]/40 transition-colors", !g.count && "opacity-70")}>
                                            <div className="flex items-start justify-between"><div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", st.cls)}><st.icon className="w-4 h-4" /></div><ChevronRight className="w-4 h-4 text-gray-400" /></div>
                                            <p className={cn("text-xl font-bold mt-2", g.count ? "text-rose-600" : "text-[#0D2D5A]")}>{g.count}</p>
                                            <p className="text-sm font-semibold text-[#0D2D5A] leading-tight">{g.label}</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{g.rule}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Indicateurs clés */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="text-lg font-bold text-[#0D2D5A] flex items-center gap-2">Indicateurs clés du portefeuille
                                    <Tooltip><TooltipTrigger asChild><Info className="w-4 h-4 text-gray-400" aria-label="À propos des indicateurs" /></TooltipTrigger>
                                        <TooltipContent className="max-w-xs">Chaque indicateur indique son effectif. Les variations comparent la période choisie à la période précédente de même durée.</TooltipContent></Tooltip>
                                </h2>
                                <span className="text-xs text-gray-500 flex items-center gap-1"><TrendingUp className="w-4 h-4 text-emerald-600" /> Variation vs période précédente</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                                {kpiCard(Users, "bg-blue-50 text-[#1A6CC8]", String(total), "Élèves suivis", <Variation value={k.students.variation} unit="%" digits={0} title="Par rapport au nombre d'élèves au début de la période" />,
                                    <div className="space-y-2.5">{bar("Avec un diagnostic", k.students.withDiagnostic, BLUE)}{bar("Avec un plan actif", k.students.withPlan, BLUE)}{bar("Avec un tuteur", k.students.withTutor, "#0F9B8E")}</div>)}
                                {kpiCard(TrendingUp, "bg-blue-50 text-[#1A6CC8]", k.progression.avg === null ? "Non mesurée" : signed(k.progression.avg), "Progression moyenne", <Variation value={k.progression.variation} title="Écart avec la progression mesurée au début de la période" />,
                                    <>
                                        <p className="text-xs text-gray-500">Sur {k.progression.n} élève{k.progression.n > 1 ? "s" : ""} évalué{k.progression.n > 1 ? "s" : ""} au moins 2 fois</p>
                                        <p className="mt-auto text-[11px] text-gray-500 bg-gray-50 rounded-lg px-3 py-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Échelle 0-5 • Par rapport au diagnostic initial</p>
                                    </>)}
                                {kpiCard(CalendarDays, "bg-blue-50 text-[#1A6CC8]", k.attendance.rate === null ? "Non mesurée" : `${k.attendance.rate}%`, "Assiduité", <Variation value={k.attendance.variation} unit=" pts" digits={0} />,
                                    <p className="text-xs text-gray-500">Sur {k.attendance.n} séance{k.attendance.n > 1 ? "s" : ""} prévue{k.attendance.n > 1 ? "s" : ""} et échue{k.attendance.n > 1 ? "s" : ""}</p>)}
                                {kpiCard(FileCheck2, "bg-emerald-50 text-emerald-600", k.homework.rate === null ? "Non mesuré" : `${k.homework.rate}%`, "Devoirs rendus", <Variation value={k.homework.variation} unit=" pts" digits={0} />,
                                    <>
                                        <p className="text-xs text-gray-500">Sur {k.homework.n} devoir{k.homework.n > 1 ? "s" : ""} à échéance</p>
                                        <div className="text-xs text-gray-500">Délai moyen de correction
                                            <p className="flex items-center gap-1.5 text-sm font-bold text-[#0D2D5A] mt-1"><Clock className="w-4 h-4" />{k.homework.correctionDays === null ? <span className="font-normal text-gray-400 text-xs">Pas encore mesuré</span> : `${fmt(k.homework.correctionDays)} jours`}</p>
                                        </div>
                                    </>)}
                                {kpiCard(Star, "bg-violet-50 text-violet-600", k.satisfaction.avg === null ? "Aucun avis" : `${fmt(k.satisfaction.avg)}/5`, "Satisfaction des parents", <Variation value={k.satisfaction.variation} />,
                                    <p className="text-xs text-gray-500">Sur {k.satisfaction.n} avis</p>)}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                            {/* Entonnoir */}
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4 min-w-0">
                                <h2 className="text-base font-bold text-[#0D2D5A] flex items-center gap-2"><Route className="w-5 h-5 text-[#1A6CC8]" /> Entonnoir du parcours pédagogique</h2>
                                <div className="overflow-x-auto">
                                    <div className="grid grid-cols-6 min-w-[560px]">
                                        {data.funnel.map((s, i) => (
                                            <div key={s.key} className="text-center">
                                                <div className="h-16 flex flex-col justify-center pl-4 pr-3 text-left" style={{ background: FUNNEL_COLORS[i], clipPath: i === 0 ? "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%)" : "polygon(0 0, 88% 0, 100% 50%, 88% 100%, 0 100%, 12% 50%)" }}>
                                                    <p className="text-lg font-bold text-[#0D2D5A] leading-none">{s.count}</p>
                                                    <p className="text-[11px] font-semibold text-[#0D2D5A] mt-1">{s.label}</p>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2" title={s.n ? `Médiane sur ${s.n} dossier${s.n > 1 ? "s" : ""}` : "Aucun dossier daté"}>
                                                    {i === 0 ? "" : s.medianDays === null ? "Non mesuré" : <><strong className="text-[#0D2D5A]">{fmt(s.medianDays, s.medianDays % 1 ? 1 : 0)} j</strong> (médiane)</>}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 bg-[#1A6CC8]/5 rounded-lg px-3 py-2.5 flex gap-2"><Info className="w-4 h-4 text-[#1A6CC8] shrink-0" />
                                    <span>Le délai médian indique le temps entre chaque étape pour les dossiers qui ont avancé. Les dossiers bloqués sont visibles dans la section « À traiter ».</span></p>
                            </section>

                            {/* Progression par matière */}
                            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 className="text-base font-bold text-[#0D2D5A] flex items-center gap-2"><BarChart3 className="w-5 h-5 text-[#1A6CC8]" /> Progression par matière</h2>
                                    <span className="text-xs font-semibold text-[#1A6CC8] bg-[#1A6CC8]/5 rounded-full px-3 py-1">{data.evaluatedStudents} élève{data.evaluatedStudents > 1 ? "s" : ""} évalué{data.evaluatedStudents > 1 ? "s" : ""}</span>
                                </div>
                                {data.subjects.length === 0 ? (
                                    <p className="text-sm text-gray-400 py-8 text-center">Aucun élève n'a encore été réévalué : la progression apparaîtra après une deuxième évaluation.</p>
                                ) : (
                                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                        {data.subjects.map((s, i) => (
                                            <div key={s.subject} className="grid grid-cols-[minmax(0,1.3fr)_auto_minmax(0,1.4fr)_auto] items-center gap-3">
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }}><BookOpen className="w-4 h-4" /></div>
                                                    <span className="text-sm font-semibold text-[#0D2D5A] truncate" title={`${s.subject} (${s.n} élève${s.n > 1 ? "s" : ""})`}>{s.subject}</span>
                                                </div>
                                                <span className="text-xs text-[#0D2D5A] whitespace-nowrap">{fmt(s.initial)} → <strong>{fmt(s.latest)}</strong> <span className={cn("font-bold", s.delta > 0 ? "text-emerald-600" : s.delta < 0 ? "text-rose-600" : "text-gray-400")}>({signed(s.delta)})</span></span>
                                                <div className="space-y-1" aria-label={`Niveau initial ${fmt(s.initial)}, dernier niveau ${fmt(s.latest)} sur 5`}>
                                                    <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-[#C7DBF5]" style={{ width: `${(s.initial / 5) * 100}%` }} /></div>
                                                    <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${(s.latest / 5) * 100}%`, background: BLUE }} /></div>
                                                </div>
                                                <div className="flex items-center gap-1.5" title={`${s.reliability ?? 0}% des ${s.measures} notes appuyées par un test ou un bulletin`}>
                                                    <Ring value={s.reliability} color={(s.reliability ?? 0) >= 75 ? "#16A34A" : (s.reliability ?? 0) >= 50 ? "#D97706" : "#DC2626"} />
                                                    <span className="text-[10px] text-gray-400 leading-tight hidden sm:block">Fiabilité<br />des mesures</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-gray-500">
                                    <div className="flex items-center gap-4"><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#C7DBF5]" /> Niveau initial</span><span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: BLUE }} /> Dernier niveau</span></div>
                                    <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" />{data.evaluatorGap.avg === null ? "Écart entre évaluateurs : aucune double évaluation" : `Écart entre évaluateurs : ${fmt(data.evaluatorGap.avg)} en moyenne (${data.evaluatorGap.n})`}</span>
                                </div>
                            </section>
                        </div>

                        {/* Suivi des élèves */}
                        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4">
                                <h2 className="text-base font-bold text-[#0D2D5A] flex items-center gap-2"><Users className="w-5 h-5 text-[#1A6CC8]" /> Suivi des élèves</h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input aria-label="Rechercher un élève" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un élève..." className="h-9 w-56 pl-9 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1A6CC8]" />
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className={cn("h-9 px-3 rounded-lg border text-sm font-semibold flex items-center gap-2", stepFilter.length || onlyAlerts || onlyRegress ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-[#0D2D5A]")}>
                                                <SlidersHorizontal className="w-4 h-4" /> Filtres{stepFilter.length + Number(onlyAlerts) + Number(onlyRegress) ? ` · ${stepFilter.length + Number(onlyAlerts) + Number(onlyRegress)}` : ""}
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-60">
                                            <DropdownMenuCheckboxItem checked={onlyAlerts} onCheckedChange={v => setOnlyAlerts(!!v)}>Avec au moins une alerte</DropdownMenuCheckboxItem>
                                            <DropdownMenuCheckboxItem checked={onlyRegress} onCheckedChange={v => setOnlyRegress(!!v)}>Progression négative</DropdownMenuCheckboxItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel>Étape du parcours</DropdownMenuLabel>
                                            {data.funnel.map(s => (
                                                <DropdownMenuCheckboxItem key={s.key} checked={stepFilter.includes(s.key)}
                                                    onCheckedChange={v => setStepFilter(l => (v ? [...l, s.key] : l.filter(x => x !== s.key)))}>{s.label}</DropdownMenuCheckboxItem>
                                            ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    <button onClick={exportCsv} disabled={!rows.length} className="h-9 px-3 rounded-lg border border-gray-200 text-sm font-semibold text-[#0D2D5A] flex items-center gap-2 disabled:opacity-40" title={selected.size ? `Exporter les ${selected.size} élèves cochés` : "Exporter la liste filtrée (CSV)"}>
                                        <Download className="w-4 h-4" /> Exporter{selected.size ? ` (${selected.size})` : ""}
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[1080px]">
                                    <thead>
                                        <tr className="text-left text-[11px] text-gray-400 border-y border-gray-100 bg-gray-50/50">
                                            <th className="px-4 py-2.5 w-8"><input type="checkbox" aria-label="Tout sélectionner" checked={!!pageRows.length && pageRows.every(r => selected.has(r.familyId))}
                                                onChange={e => setSelected(s => { const n = new Set(s); pageRows.forEach(r => (e.target.checked ? n.add(r.familyId) : n.delete(r.familyId))); return n; })} /></th>
                                            <th className="px-3 py-2.5 font-semibold">Élève</th><th className="px-3 py-2.5 font-semibold">Niveau initial → actuel</th><th className="px-3 py-2.5 font-semibold">Écart</th>
                                            <th className="px-3 py-2.5 font-semibold">Dernière évaluation</th><th className="px-3 py-2.5 font-semibold">Séances sur 30 j</th><th className="px-3 py-2.5 font-semibold">Devoirs rendus</th>
                                            <th className="px-3 py-2.5 font-semibold">Avis parent</th><th className="px-3 py-2.5 font-semibold">Alertes</th><th className="px-3 py-2.5 font-semibold">Étape du parcours</th><th className="px-3 py-2.5 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {pageRows.map(r => (
                                            <tr key={r.familyId} className="hover:bg-gray-50/60">
                                                <td className="px-4 py-2.5"><input type="checkbox" aria-label={`Sélectionner ${r.name}`} checked={selected.has(r.familyId)} onChange={e => setSelected(s => { const n = new Set(s); e.target.checked ? n.add(r.familyId) : n.delete(r.familyId); return n; })} /></td>
                                                <td className="px-3 py-2.5">
                                                    <button onClick={() => openFile(r.familyId, r.studentId)} className="flex items-center gap-2.5 text-left">
                                                        <span className="w-8 h-8 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] text-[11px] font-bold flex items-center justify-center shrink-0">{initials(r.name)}</span>
                                                        <span><span className="block text-xs font-bold text-[#0D2D5A] hover:underline">{r.name}</span><span className="block text-[11px] text-gray-400">{r.level || "Niveau non renseigné"}</span></span>
                                                    </button>
                                                </td>
                                                <td className="px-3 py-2.5 text-xs text-[#0D2D5A]">{r.initialAvg === null ? <span className="text-gray-400">Non évalué</span> : r.evaluations < 2 ? <>{fmt(r.initialAvg)} <span className="text-gray-400">(1 évaluation)</span></> : <>{fmt(r.initialAvg)} → <strong>{fmt(r.latestAvg)}</strong></>}</td>
                                                <td className="px-3 py-2.5">{r.delta === null ? <span className="text-[11px] text-gray-400">À réévaluer</span> :
                                                    <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", r.delta > 0 ? "bg-emerald-50 text-emerald-700" : r.delta < 0 ? "bg-rose-50 text-rose-600" : "bg-gray-100 text-gray-500")}>{signed(r.delta)}</span>}</td>
                                                <td className="px-3 py-2.5 text-xs text-gray-500">{longDate(r.lastEvalAt) || <span className="text-gray-400">Aucune</span>}</td>
                                                <td className="px-3 py-2.5">{r.sessions30.planned ? (
                                                    <div className="w-20"><span className="text-xs text-[#0D2D5A]">{r.sessions30.done}/{r.sessions30.planned}</span>
                                                        <div className="h-1 rounded-full bg-gray-100 mt-1"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(r.sessions30.done / r.sessions30.planned) * 100}%` }} /></div></div>
                                                ) : <span className="text-[11px] text-gray-400">Aucune</span>}</td>
                                                <td className="px-3 py-2.5 text-xs font-semibold text-[#0D2D5A]">{r.homeworkRate === null ? <span className="font-normal text-gray-400">Aucun</span> : `${r.homeworkRate}%`}</td>
                                                <td className="px-3 py-2.5 text-xs text-[#0D2D5A]">{r.feedback.n ? <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-[#F5A623] fill-[#F5A623]" />{fmt(r.feedback.avg)}/5 <span className="text-gray-400">({r.feedback.n})</span></span> : <span className="text-gray-400">Aucun avis</span>}</td>
                                                <td className="px-3 py-2.5">{r.alerts.length ? (
                                                    <span title={r.alerts.join(", ")} className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap", ALERT_CHIP[r.alerts[0]] || "bg-amber-50 text-amber-700")}>{r.alerts[0]}{r.alerts.length > 1 ? ` +${r.alerts.length - 1}` : ""}</span>
                                                ) : <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Aucune</span>}</td>
                                                <td className="px-3 py-2.5"><span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1A6CC8]/5 text-[#1A6CC8] whitespace-nowrap">{r.stepLabel}</span></td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild><button aria-label={`Actions pour ${r.name}`} className="w-8 h-8 rounded-lg inline-flex items-center justify-center text-gray-400 hover:bg-gray-100"><MoreVertical className="w-4 h-4" /></button></DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-52">
                                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(r.familyId, r.studentId)}><FolderOpen className="w-4 h-4" /> Ouvrir la fiche</DropdownMenuItem>
                                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(r.familyId, r.studentId, "diagnostic")}><ClipboardCheck className="w-4 h-4" /> {r.evaluations ? "Réévaluer" : "Faire le diagnostic"}</DropdownMenuItem>
                                                            {r.studentId && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/messages", { state: { contactId: r.studentId } })}><MessageSquare className="w-4 h-4" /> Écrire à l'élève</DropdownMenuItem>}
                                                            <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/schedule", { state: { familyId: r.familyId, type: "Suivi régulier" } })}><CalendarDays className="w-4 h-4" /> Planifier un rendez-vous</DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))}
                                        {!pageRows.length && <tr><td colSpan={11} className="px-4 py-10 text-center text-sm text-gray-400">Aucun élève ne correspond.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                            {rows.length > PAGE_SIZE && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                                    <span className="text-xs text-gray-500">{(current - 1) * PAGE_SIZE + 1}-{Math.min(current * PAGE_SIZE, rows.length)} sur {rows.length} élèves</span>
                                    <nav aria-label="Pagination du suivi" className="flex items-center gap-1">
                                        <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                        <span className="text-xs font-semibold text-[#0D2D5A] px-2">{current} / {totalPages}</span>
                                        <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                                    </nav>
                                </div>
                            )}
                        </section>
                    </>
                )}

                {/* Détail des alertes */}
                <Dialog open={!!alertOpen} onOpenChange={o => { if (!o) setAlertOpen(null); }}>
                    <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{openGroup ? openGroup.label : "À traiter aujourd'hui"}</DialogTitle>
                            <DialogDescription>{openGroup ? `Règle : ${openGroup.rule}` : `${totalAlerts} alerte${totalAlerts > 1 ? "s" : ""} au total`}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {(openGroup ? [openGroup] : data?.alerts.filter(g => g.count) ?? []).map(g => (
                                <div key={g.key} className="space-y-1.5">
                                    {!openGroup && <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">{g.label} ({g.count})</p>}
                                    {g.items.length === 0 && <p className="text-sm text-gray-400">Rien à traiter.</p>}
                                    {g.items.map((it, i) => (
                                        <button key={`${g.key}-${i}`} onClick={() => { setAlertOpen(null); g.key === "agenda" ? navigate("/advisor/schedule") : openFile(it.familyId, it.studentId, ALERT_PANEL[g.key]); }}
                                            className="w-full flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2 text-left hover:border-[#1A6CC8]/40">
                                            <span className="min-w-0"><span className="block text-sm font-semibold text-[#0D2D5A] truncate">{it.name}</span><span className="block text-xs text-gray-500">{it.detail}</span></span>
                                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                                        </button>
                                    ))}
                                </div>
                            ))}
                            {!openGroup && totalAlerts === 0 && <p className="text-sm text-gray-400">Aucune alerte : tout est à jour.</p>}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
