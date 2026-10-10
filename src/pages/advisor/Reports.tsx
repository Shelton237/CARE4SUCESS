import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import {
  FileText, CheckCircle2, Clock, UserX, Loader2, RefreshCw, Eye, Search, Plus, SlidersHorizontal, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, RotateCcw, List, Table2, MoreVertical, UserRound, CalendarDays, TrendingUp, TrendingDown,
  Info, ArrowRight, ClipboardCheck, CalendarRange, GitMerge, FolderOpen, CircleDot,
} from "lucide-react";
import AdvisorBilanView from "@/components/advisor/AdvisorBilanView";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Un bilan = l'évaluation pédagogique d'un élève : diagnostic par matière, puis plan.
// À traiter : aucun diagnostic ; En cours : diagnostic sans plan ; Terminé : diagnostic + plan.
type BilanStatus = "a_traiter" | "en_cours" | "termine";
type Bilan = {
  family: any;
  name: string;
  subjects: string[];
  level: string;
  status: BilanStatus;
  evaluator: string | null;
  evaluations: number;
  // Vrai seulement si le diagnostic contient des notes par matière
  scored: boolean;
  date: string | null;
  hasPlan: boolean;
};

const BLUE = "#1A6CC8";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const SELECT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15";
const LABEL = "text-xs font-semibold text-[#0D2D5A] mb-1.5 block";
const DASH = String.fromCharCode(0x2014);

const STATUS: Record<BilanStatus, { label: string; icon: any; cls: string }> = {
  termine: { label: "Terminé", icon: CheckCircle2, cls: "bg-emerald-50 text-emerald-700" },
  en_cours: { label: "En cours", icon: RefreshCw, cls: "bg-blue-50 text-blue-700" },
  a_traiter: { label: "À traiter", icon: CircleDot, cls: "bg-amber-50 text-amber-700" },
};

const PALETTE = [
  { bg: "#EDE9FE", fg: "#6D28D9" }, { bg: "#DBEAFE", fg: "#1D4ED8" }, { bg: "#DCFCE7", fg: "#15803D" },
  { bg: "#FCE7F3", fg: "#BE185D" }, { bg: "#FEF3C7", fg: "#B45309" }, { bg: "#E0F2FE", fg: "#0369A1" },
];
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const tone = (n = "") => PALETTE[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
const clean = (v: unknown) => { const s = String(v ?? "").trim(); return s && s !== DASH ? s : ""; };
const toDate = (d?: string | null) => { const x = d ? new Date(d) : null; return x && !isNaN(x.getTime()) ? x : null; };
const formatDay = (d?: string | null) => toDate(d)?.toLocaleDateString("fr-FR") ?? "Non datée";
const formatTime = (d?: string | null) => toDate(d)?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) ?? "";
const familySubjects = (f: any): string[] => {
  const raw = f?.subject ?? f?.subjects;
  return [...new Set((Array.isArray(raw) ? raw : String(raw ?? "").split(",")).map(clean).filter(Boolean))];
};

const toBilan = (f: any): Bilan => {
  const b = f.bilan ?? {};
  const diag = b.diagnostic ?? null;
  const status: BilanStatus = b.status === "termine" || b.status === "en_cours" ? b.status : "a_traiter";
  const fromDiag: string[] = Array.isArray(diag?.subjects) ? diag.subjects : [];
  return {
    family: f,
    name: clean(f.childName || f.child) || "Élève non renseigné",
    subjects: fromDiag.length ? fromDiag : familySubjects(f),
    level: clean(f.level),
    status,
    evaluator: diag?.evaluator || null,
    evaluations: Number(diag?.count) || 0,
    scored: fromDiag.length > 0,
    // Date du bilan : premier diagnostic ; sinon date de la demande ou de création de l'élève
    date: diag?.firstAt || diag?.at || f.createdAt || null,
    hasPlan: !!b.plan,
  };
};

// Variation des 30 derniers jours par rapport aux 30 précédents
const trend = (list: Bilan[]) => {
  const now = Date.now(), day = 86_400_000, t = (b: Bilan) => toDate(b.date)?.getTime() ?? 0;
  const recent = list.filter(b => t(b) > now - 30 * day).length;
  const before = list.filter(b => t(b) <= now - 30 * day && t(b) > now - 60 * day).length;
  return before ? Math.round(((recent - before) / before) * 100) : null;
};

type Filters = { status: "" | BilanStatus; level: string; subject: string; evaluator: string; from: string; to: string };
const EMPTY: Filters = { status: "", level: "", subject: "", evaluator: "", from: "", to: "" };

export default function AdvisorReports() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "todo">("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [f, setF] = useState<Filters>(EMPTY);
  const [view, setView] = useState<"list" | "table">("list");
  const [sort, setSort] = useState<"recent" | "old" | "name">("recent");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [bilanFamily, setBilanFamily] = useState<any>(null);

  const familiesQuery = useQuery({ queryKey: ["advisorFamilies"], queryFn: fetchAdvisorFamilies });
  const bilans = useMemo(() => (familiesQuery.data ?? []).map(toBilan), [familiesQuery.data]);

  const counts = useMemo(() => ({
    all: bilans.length,
    en_cours: bilans.filter(b => b.status === "en_cours").length,
    termine: bilans.filter(b => b.status === "termine").length,
    a_traiter: bilans.filter(b => b.status === "a_traiter").length,
  }), [bilans]);

  const options = useMemo(() => {
    const uniq = (l: string[]) => [...new Set(l.filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
    return {
      levels: uniq(bilans.map(b => b.level)),
      subjects: uniq(bilans.flatMap(b => b.subjects)),
      evaluators: uniq(bilans.map(b => b.evaluator || "")),
    };
  }, [bilans]);

  const filtered = useMemo(() => {
    const q = norm(search);
    const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
    const to = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null;
    const list = bilans.filter(b => {
      if (tab === "todo" && b.status !== "a_traiter") return false;
      if (tab === "all" && f.status && b.status !== f.status) return false;
      if (f.level && b.level !== f.level) return false;
      if (f.subject && !b.subjects.includes(f.subject)) return false;
      if (f.evaluator && b.evaluator !== f.evaluator) return false;
      const t = toDate(b.date)?.getTime();
      if (from !== null && (!t || t < from)) return false;
      if (to !== null && (!t || t > to)) return false;
      if (q) {
        const fam = b.family;
        const hay = norm([b.name, fam.parentName || fam.parent, fam.parentEmail, fam.childEmail, b.level, ...b.subjects, b.evaluator].join(" "));
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const time = (b: Bilan) => toDate(b.date)?.getTime() ?? 0;
    return list.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name, "fr") : sort === "old" ? time(a) - time(b) : time(b) - time(a));
  }, [bilans, tab, f, search, sort]);

  useEffect(() => { setPage(1); }, [tab, f, search, sort, pageSize]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * pageSize;
  const pageItems = filtered.slice(start, start + pageSize);
  const activeFilters = [tab === "all" ? f.status : "", f.level, f.subject, f.evaluator, f.from, f.to].filter(Boolean).length;

  const pickerFamilies = useMemo(() => {
    const term = norm(pickerSearch);
    return bilans.filter(b => !term || norm(`${b.name} ${b.family.parentName || b.family.parent || ""}`).includes(term));
  }, [bilans, pickerSearch]);

  // La fiche élève est retrouvée par identifiant (id de la demande ou de l'élève), jamais par nom.
  const openFile = (b: Bilan, panel: string) => navigate("/advisor/families", { state: { familyId: b.family.id, defaultPanel: panel } });

  const pickKpi = (key: "all" | BilanStatus) => {
    if (key === "a_traiter") { setTab("todo"); return; }
    setTab("all");
    setF(x => ({ ...x, status: key === "all" ? "" : key }));
  };

  if (familiesQuery.isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
      </div>
    );
  }

  if (familiesQuery.isError) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-700 flex items-center justify-between">
          <span>Impossible de charger les bilans.</span>
          <button onClick={() => familiesQuery.refetch()} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition-colors">
            <RefreshCw className="w-3 h-3" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  const statusPill = (b: Bilan) => {
    const s = STATUS[b.status];
    return <span className={cn("inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap", s.cls)}><s.icon className="w-3.5 h-3.5" />{s.label}</span>;
  };

  const mainAction = (b: Bilan) => b.status === "a_traiter"
    ? <button onClick={() => openFile(b, "diagnostic")} className={cn(BTN, "text-white")} style={{ background: BLUE }}><ClipboardCheck className="w-4 h-4" /> Évaluer</button>
    : <button onClick={() => setBilanFamily(b.family)} className={cn(BTN, "border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}><Eye className="w-4 h-4" /> Voir le bilan</button>;

  const menu = (b: Bilan) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button aria-label={`Actions pour ${b.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
          <MoreVertical className="w-4 h-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setBilanFamily(b.family)}><Eye className="w-4 h-4" /> Voir le bilan</DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(b, "diagnostic")}>
          <ClipboardCheck className="w-4 h-4" /> {b.status === "a_traiter" ? "Faire le diagnostic" : "Mettre à jour le diagnostic"}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(b, "plan")}>
          <CalendarRange className="w-4 h-4" /> {b.hasPlan ? "Voir le plan" : "Créer le plan"}
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(b, "matching")}><GitMerge className="w-4 h-4" /> Proposer un tuteur</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openFile(b, "dossier")}><FolderOpen className="w-4 h-4" /> Ouvrir la fiche élève</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const avatar = (b: Bilan, size = "w-11 h-11") => {
    const t = tone(b.name);
    return <div className={cn(size, "rounded-full flex items-center justify-center text-sm font-bold shrink-0")} style={{ background: t.bg, color: t.fg }}>{initials(b.name)}</div>;
  };

  const chips = (items: string[]) => items.length
    ? <div className="flex flex-wrap gap-1.5">{items.map(s => <span key={s} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#1A6CC8]/5 text-[#1A6CC8]">{s}</span>)}</div>
    : <span className="text-xs text-amber-600">Non renseignées</span>;

  const evaluatorLine = (b: Bilan) => (
    <div className="flex items-start gap-2">
      <UserRound className="w-4 h-4 text-[#1A6CC8] mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-[11px] text-gray-400">Évalué par</p>
        <p className={cn("text-xs font-semibold truncate", b.evaluator ? "text-[#0D2D5A]" : "text-gray-400")}>
          {b.evaluator || "Pas encore évalué"}{b.evaluations > 1 ? ` · ${b.evaluations} évaluations` : ""}
        </p>
        {b.evaluator && !b.scored && <p className="text-[11px] text-amber-600">Diagnostic sans note</p>}
      </div>
    </div>
  );

  const dateLine = (b: Bilan) => (
    <div className="flex items-start gap-2">
      <CalendarDays className="w-4 h-4 text-[#1A6CC8] mt-0.5 shrink-0" />
      <div>
        <p className="text-[11px] text-gray-400">{b.status === "a_traiter" ? "Date de la demande" : "Date du bilan"}</p>
        <p className="text-xs font-semibold text-[#0D2D5A]">{formatDay(b.date)}</p>
        {formatTime(b.date) && <p className="text-[11px] text-gray-400">{formatTime(b.date)}</p>}
      </div>
    </div>
  );

  const kpis = [
    { key: "all" as const, label: "Bilans trouvés", value: counts.all, icon: FileText, ring: "bg-blue-50 text-[#1A6CC8]", list: bilans },
    { key: "en_cours" as const, label: "En cours", value: counts.en_cours, icon: Clock, ring: "bg-sky-50 text-sky-600", list: bilans.filter(b => b.status === "en_cours") },
    { key: "termine" as const, label: "Terminés", value: counts.termine, icon: CheckCircle2, ring: "bg-emerald-50 text-emerald-600", list: bilans.filter(b => b.status === "termine") },
    { key: "a_traiter" as const, label: "À traiter", value: counts.a_traiter, icon: UserX, ring: "bg-rose-50 text-rose-500", list: bilans.filter(b => b.status === "a_traiter") },
  ];
  const kpiActive = (k: "all" | BilanStatus) => k === "a_traiter" ? tab === "todo" : tab === "all" && (f.status || "all") === k;

  return (
    <div className="w-full p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Bilans pédagogiques</h1>
          <p className="text-gray-500 text-sm mt-0.5">Consultez et suivez le bilan de chaque élève : diagnostic par matière, puis plan de travail.</p>
        </div>
        <button onClick={() => { setPickerSearch(""); setPickerOpen(true); }} className={cn(BTN, "text-white shadow-sm")} style={{ background: BLUE }}>
          <Plus className="w-4 h-4" /> Nouveau bilan
        </button>
      </div>

      {/* Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map(k => {
          const tr = trend(k.list);
          return (
            <button key={k.key} onClick={() => pickKpi(k.key)} aria-pressed={kpiActive(k.key)}
              className={cn("bg-white rounded-2xl p-4 flex items-center gap-4 border text-left shadow-sm transition-colors", kpiActive(k.key) ? "border-[#1A6CC8]" : "border-gray-100 hover:border-gray-200")}>
              <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", k.ring)}><k.icon className="w-5 h-5" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold text-[#0D2D5A]">{k.value}</p>
                <p className="text-sm text-gray-500">{k.label}</p>
              </div>
              {tr !== null && (
                <span className={cn("self-start inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full", tr >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}
                  title="30 derniers jours par rapport aux 30 précédents">
                  {tr >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{tr >= 0 ? "+" : ""}{tr}%
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Onglets, recherche et filtres (repliés) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div role="tablist" className="flex gap-6 px-5 border-b border-gray-100">
          {([["all", "Bilans trouvés", counts.all, "bg-[#1A6CC8]"], ["todo", "Bilans à traiter", counts.a_traiter, "bg-rose-500"]] as const).map(([key, label, n, badge]) => (
            <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={cn("flex items-center gap-2 py-3.5 text-sm font-bold border-b-2 -mb-px", tab === key ? "border-[#1A6CC8] text-[#0D2D5A]" : "border-transparent text-gray-500 hover:text-[#0D2D5A]")}>
              {label}<span className={cn("min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] text-white flex items-center justify-center", badge)}>{n}</span>
            </button>
          ))}
        </div>
        <div className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input type="text" aria-label="Rechercher" placeholder="Rechercher un élève, un parent, une matière..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A6CC8]/15 focus:border-[#1A6CC8] outline-none" />
            </div>
            <button onClick={() => setShowFilters(o => !o)} aria-expanded={showFilters}
              className={cn(BTN, "border", activeFilters ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>
              <SlidersHorizontal className="w-4 h-4" /> Filtres avancés{activeFilters ? ` · ${activeFilters}` : ""}
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {(activeFilters > 0 || search) && (
              <button onClick={() => { setF(EMPTY); setSearch(""); }} className={cn(BTN, "border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}>
                <RotateCcw className="w-4 h-4" /> Réinitialiser
              </button>
            )}
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <label><span className={LABEL}>Statut</span>
                <select value={tab === "todo" ? "a_traiter" : f.status} disabled={tab === "todo"} onChange={e => setF(x => ({ ...x, status: e.target.value as Filters["status"] }))} className={SELECT}>
                  <option value="">Tous</option><option value="a_traiter">À traiter</option><option value="en_cours">En cours</option><option value="termine">Terminé</option>
                </select>
              </label>
              <label><span className={LABEL}>Niveau d'enseignement</span>
                <select value={f.level} onChange={e => setF(x => ({ ...x, level: e.target.value }))} className={SELECT}>
                  <option value="">Tous</option>{options.levels.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label><span className={LABEL}>Matière</span>
                <select value={f.subject} onChange={e => setF(x => ({ ...x, subject: e.target.value }))} className={SELECT}>
                  <option value="">Toutes</option>{options.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <label><span className={LABEL}>Évalué par</span>
                <select value={f.evaluator} onChange={e => setF(x => ({ ...x, evaluator: e.target.value }))} className={SELECT}>
                  <option value="">Tous</option>{options.evaluators.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
              <div className="md:col-span-2">
                <span className={LABEL}>Date du bilan ou de la demande</span>
                <div className="flex items-center gap-2">
                  <input type="date" aria-label="Du" value={f.from} onChange={e => setF(x => ({ ...x, from: e.target.value }))} className={SELECT} />
                  <span className="text-gray-400">→</span>
                  <input type="date" aria-label="Au" value={f.to} onChange={e => setF(x => ({ ...x, to: e.target.value }))} className={SELECT} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'affichage */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2" role="group" aria-label="Affichage">
            <button onClick={() => setView("list")} aria-pressed={view === "list"} className={cn(BTN, view === "list" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "list" ? { background: BLUE } : undefined}>
              <List className="w-4 h-4" /> Liste
            </button>
            <button onClick={() => setView("table")} aria-pressed={view === "table"} className={cn(BTN, view === "table" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "table" ? { background: BLUE } : undefined}>
              <Table2 className="w-4 h-4" /> Tableau
            </button>
          </div>
          <p className="text-sm font-bold text-[#0D2D5A]">{filtered.length} bilan{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-500">Trier par :
          <select value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
            <option value="recent">Plus récents</option><option value="old">Plus anciens</option><option value="name">Nom (A-Z)</option>
          </select>
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-500 shadow-sm flex flex-col items-center justify-center min-h-[240px]">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-gray-400" /></div>
          <h3 className="text-lg font-bold text-[#0D2D5A] mb-1">{bilans.length ? "Aucun bilan ne correspond" : "Aucun élève suivi pour l'instant"}</h3>
          <p className="text-sm">{bilans.length ? "Modifiez la recherche ou les filtres." : "Les bilans apparaissent dès qu'une demande de bilan est reçue."}</p>
        </div>
      ) : view === "list" ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {pageItems.map(b => (
            <div key={b.family.id} className="grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_210px_120px_minmax(0,1.3fr)_180px] gap-4 md:gap-6 items-center px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                {avatar(b)}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#0D2D5A] truncate">{b.name}</p>
                  <p className="text-xs text-gray-500 truncate">{b.subjects.join(" • ") || "Matières non renseignées"}</p>
                  <p className={cn("text-xs font-semibold", b.level ? "text-[#1A6CC8]" : "text-amber-600")}>{b.level || "Niveau non renseigné"}</p>
                </div>
              </div>
              <div className="space-y-2.5 min-w-0">{evaluatorLine(b)}{dateLine(b)}</div>
              <div>{statusPill(b)}</div>
              <div className="space-y-2 min-w-0">
                <div><p className="text-[11px] text-gray-400 mb-1">{b.scored ? "Matières évaluées" : "Matières demandées"}</p>{chips(b.subjects)}</div>
                <div><p className="text-[11px] text-gray-400 mb-1">Niveau</p>{b.level ? chips([b.level]) : <span className="text-xs text-amber-600">Non renseigné</span>}</div>
              </div>
              <div className="flex items-center gap-1 md:justify-end">{mainAction(b)}{menu(b)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-sm min-w-[900px]">
            <thead>
              <tr className="bg-gray-50/60 border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-bold">Élève</th><th className="px-4 py-3 font-bold">Niveau</th><th className="px-4 py-3 font-bold">Matières</th>
                <th className="px-4 py-3 font-bold">Évalué par</th><th className="px-4 py-3 font-bold">Date</th><th className="px-4 py-3 font-bold">Statut</th><th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pageItems.map(b => (
                <tr key={b.family.id} className="hover:bg-gray-50/60">
                  <td className="px-5 py-3"><div className="flex items-center gap-3">{avatar(b, "w-9 h-9")}<span className="font-bold text-[#0D2D5A]">{b.name}</span></div></td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.level || "Non renseigné"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600 max-w-[220px] truncate">{b.subjects.join(", ") || "Non renseignées"}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">{b.evaluator || "Pas encore évalué"}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{formatDay(b.date)}</td>
                  <td className="px-4 py-3">{statusPill(b)}</td>
                  <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">{mainAction(b)}{menu(b)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "all" && counts.a_traiter > 0 && (
        <div className="rounded-2xl border border-[#1A6CC8]/15 bg-[#1A6CC8]/5 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: BLUE }}><Info className="w-4 h-4" /></div>
            <div>
              <p className="text-sm font-bold text-[#0D2D5A]">Bilans à traiter</p>
              <p className="text-xs text-gray-500">{counts.a_traiter} élève{counts.a_traiter > 1 ? "s attendent" : " attend"} un diagnostic de votre part.</p>
            </div>
          </div>
          <button onClick={() => setTab("todo")} className={cn(BTN, "bg-white border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}>
            Voir les {counts.a_traiter} bilans <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {filtered.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="text-xs text-gray-500 flex items-center gap-2">Éléments par page :
            <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-8 border border-gray-200 rounded-lg px-2 text-xs bg-white">
              {[10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">{start + 1}-{Math.min(start + pageSize, filtered.length)} sur {filtered.length}</span>
            <nav aria-label="Pagination des bilans" className="flex items-center gap-1">
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

      {/* Nouveau bilan : choisir l'élève, sa fiche s'ouvre sur le diagnostic */}
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau bilan</DialogTitle>
            <DialogDescription>Choisissez l'élève à évaluer. Sa fiche s'ouvre sur l'onglet Diagnostic.</DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
            <input type="text" value={pickerSearch} onChange={e => setPickerSearch(e.target.value)} placeholder="Rechercher un élève ou un parent..."
              className="w-full h-10 border border-gray-200 rounded-lg pl-10 pr-4 text-sm outline-none focus:border-[#1A6CC8]" />
          </div>
          <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {pickerFamilies.map(b => (
              <li key={b.family.id}>
                <button onClick={() => { setPickerOpen(false); openFile(b, "diagnostic"); }} className="w-full text-left px-3 py-2.5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0D2D5A] truncate">{b.name}</div>
                    <div className="text-xs text-gray-400 truncate">{clean(b.family.parentName || b.family.parent) || "Parent non renseigné"} · {b.level || "Niveau non défini"}</div>
                  </div>
                  {statusPill(b)}
                </button>
              </li>
            ))}
            {pickerFamilies.length === 0 && <li className="px-3 py-6 text-center text-sm text-gray-400">Aucun élève ne correspond à votre recherche.</li>}
          </ul>
        </DialogContent>
      </Dialog>

      {bilanFamily && <AdvisorBilanView family={bilanFamily} onClose={() => setBilanFamily(null)} />}
    </div>
  );
}
