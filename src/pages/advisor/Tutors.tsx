import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Loader2, Search, Send, Pencil, RefreshCw, Users, List, LayoutGrid, RotateCcw, Plus, ChevronUp, ChevronDown,
    BookOpen, GraduationCap, MapPin, Crosshair, CalendarDays, Clock, ChevronRight, Banknote, CircleDollarSign,
    Eye, MoreVertical, BadgeCheck, X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { ALL_LEVELS, ALL_SUBJECTS, SUBJECT_CATEGORIES } from "@/data/education";
import { CityAutocomplete } from "@/components/common/CityAutocomplete";
import { TutorProfileForm, type TutorProfile } from "@/components/tutor/TutorProfileForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const API = import.meta.env.VITE_API_URL || "/api";
const BLUE = "#1A6CC8";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const BTN_BLUE = `${BTN} bg-[#1A6CC8] text-white hover:bg-[#1A6CC8]/90`;
const BTN_OUTLINE = `${BTN} border border-[#1A6CC8]/40 bg-white text-[#1A6CC8] hover:bg-[#1A6CC8]/5`;
const INPUT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] placeholder:text-gray-400 outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 bg-white";
const CHIP = "text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors";

type Tutor = TutorProfile & { status?: string | null; createdAt?: string | null };

const DAYS = [
    { key: "lun", label: "Lundi", short: "Lun" }, { key: "mar", label: "Mardi", short: "Mar" },
    { key: "mer", label: "Mercredi", short: "Mer" }, { key: "jeu", label: "Jeudi", short: "Jeu" },
    { key: "ven", label: "Vendredi", short: "Ven" }, { key: "sam", label: "Samedi", short: "Sam" },
    { key: "dim", label: "Dimanche", short: "Dim" },
];
const SLOTS = [
    { key: "matin", label: "Matin", hours: "7h - 12h", from: 7, to: 12 },
    { key: "debut-apres-midi", label: "Début d'après-midi", hours: "12h - 15h", from: 12, to: 15 },
    { key: "apres-midi", label: "Après-midi", hours: "15h - 18h", from: 15, to: 18 },
    { key: "soiree", label: "Soirée", hours: "18h - 22h", from: 18, to: 22 },
];
const CURRENCIES = [
    { value: "", label: "Toutes les devises" },
    { value: "XAF", label: "FCFA (XAF), Afrique centrale" },
    { value: "XOF", label: "FCFA (XOF), Afrique de l'Ouest" },
    { value: "MGA", label: "Ariary (MGA)" },
    { value: "EUR", label: "Euro (EUR)" },
];
const CATEGORY_SHORT: Record<string, string> = { sciences: "Sciences", humanites: "Lettres", langues: "Langues", gestion: "Gestion", autre: "Autre" };
const AVATAR_COLORS = ["#B45309", "#1A6CC8", "#0D2D5A", "#0F9B8E", "#7C3AED", "#BE185D"];

const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const initials = (name = "") => name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const avatarColor = (name = "") => AVATAR_COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

const formatRate = (t: Tutor) =>
    t.rate >= 500 ? `${new Intl.NumberFormat("fr-FR").format(t.rate)} ${["XAF", "XOF"].includes(t.currency) ? "FCFA" : t.currency}/h` : null;
// XOF (Afrique de l'Ouest) signalé : la plupart des tuteurs sont au Cameroun (XAF).
const CurrencyNote = ({ t }: { t: Tutor }) =>
    t.rate >= 500 && t.currency === "XOF" ? <span className="block text-[10px] font-semibold text-amber-600">Devise XOF à vérifier</span> : null;

const categoryChip = (subjects: string[]) => {
    if (!subjects.length) return null;
    const cat = SUBJECT_CATEGORIES.find(c => c.subjects.includes(subjects[0]));
    const label = cat ? CATEGORY_SHORT[cat.id] ?? subjects[0] : subjects[0];
    return subjects.length > 1 ? `${label} +${subjects.length - 1}` : label;
};

// "Lun - Ven • 7h - 18h" à partir des créneaux cochés
const availabilitySummary = (avail: Record<string, string[]>) => {
    const days = DAYS.filter(d => (avail?.[d.key] || []).length > 0);
    if (!days.length) return null;
    const idx = days.map(d => DAYS.indexOf(d));
    const contiguous = idx.every((v, i) => i === 0 || v === idx[i - 1] + 1);
    const dayLabel = days.length === 1 ? days[0].short : contiguous ? `${days[0].short} - ${days[days.length - 1].short}` : days.map(d => d.short).join(", ");
    const used = SLOTS.filter(s => days.some(d => avail[d.key].includes(s.key)));
    return `${dayLabel} • ${Math.min(...used.map(s => s.from))}h - ${Math.max(...used.map(s => s.to))}h`;
};

type Filters = { subjects: string[]; levels: string[]; city: string; zones: string[]; slots: Record<string, string[]>; maxRate: string; currency: string };
const EMPTY_FILTERS: Filters = { subjects: [], levels: [], city: "", zones: [], slots: {}, maxRate: "", currency: "" };

const matchesFilters = (t: Tutor, f: Filters) => {
    if (f.subjects.length && !f.subjects.some(s => t.subjects.includes(s))) return false;
    if (f.levels.length && !t.levels.some(l => norm(l).startsWith("tous") || f.levels.includes(l)) && !f.levels.includes("Tous niveaux")) return false;
    const places = [t.city, ...t.zones].map(norm).filter(Boolean);
    if (f.city && !places.some(p => p.includes(norm(f.city)) || norm(f.city).includes(p))) return false;
    if (f.zones.length && !f.zones.some(z => places.some(p => p.includes(norm(z))))) return false;
    const wanted = Object.entries(f.slots).flatMap(([d, ss]) => ss.map(s => [d, s] as const));
    if (wanted.length && !wanted.some(([d, s]) => (t.availability?.[d] || []).includes(s))) return false;
    if (f.maxRate && !(t.rate > 0 && t.rate <= Number(f.maxRate))) return false;
    if (f.currency && t.currency !== f.currency) return false;
    return true;
};

function Section({ icon: Icon, title, children, collapsible = false }: { icon: any; title: string; children: React.ReactNode; collapsible?: boolean }) {
    const [open, setOpen] = useState(true);
    return (
        <section className="py-4 border-t border-gray-100 first:border-t-0">
            <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A]">
                    <Icon className="w-4 h-4" style={{ color: BLUE }} /> {title}
                </h3>
                {collapsible && (
                    <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-label={open ? `Replier ${title}` : `Déplier ${title}`} className="text-gray-400 hover:text-[#0D2D5A]">
                        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                )}
            </div>
            {open && children}
        </section>
    );
}

function ProgressRing({ value, total }: { value: number; total: number }) {
    const pct = total ? value / total : 0;
    const r = 26, c = 2 * Math.PI * r;
    return (
        <div className="relative w-16 h-16 shrink-0" aria-hidden>
            <svg viewBox="0 0 64 64" className="w-16 h-16 -rotate-90">
                <circle cx="32" cy="32" r={r} fill="none" stroke="#E5EAF1" strokeWidth="6" />
                <circle cx="32" cy="32" r={r} fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#0D2D5A]">{value}/{total}</span>
        </div>
    );
}

function CompletionBar({ percent }: { percent: number }) {
    const color = percent === 100 ? "#16A34A" : percent >= 60 ? "#D97706" : "#DC2626";
    return (
        <div className="w-full">
            <p className="text-[11px] font-semibold text-[#0D2D5A] mb-1">Profil complété à {percent} %</p>
            <div className="h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} /></div>
        </div>
    );
}

export default function AdvisorTutors() {
    const { token } = useAuth();
    const qc = useQueryClient();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [onlyIncomplete, setOnlyIncomplete] = useState(false);
    const [view, setView] = useState<"list" | "cards">("list");
    const [sort, setSort] = useState<"recent" | "completeness" | "name">("recent");
    const [draft, setDraft] = useState<Filters>(EMPTY_FILTERS);
    const [applied, setApplied] = useState<Filters>(EMPTY_FILTERS);
    const [zoneDraft, setZoneDraft] = useState("");
    const editingId = searchParams.get("id");

    const { data: tutors = [], isLoading, isError, refetch } = useQuery<Tutor[]>({
        queryKey: ["advisorTutors"],
        queryFn: async () => {
            const res = await fetch(`${API}/advisor/tutors`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Impossible de charger les tuteurs");
            return res.json();
        },
        enabled: !!token,
    });

    const save = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<TutorProfile> }) => {
            const res = await fetch(`${API}/advisor/tutors/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Enregistrement impossible");
            return body as Tutor;
        },
        onSuccess: (tutor) => {
            qc.setQueryData<Tutor[]>(["advisorTutors"], prev => (prev || []).map(t => (t.id === tutor.id ? { ...t, ...tutor } : t)));
            qc.invalidateQueries({ queryKey: ["matching"] });
            toast.success(`Profil de ${tutor.name} enregistré`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const remind = useMutation({
        mutationFn: async (t: Tutor) => {
            const res = await fetch(`${API}/advisor/tutors/${t.id}/remind`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Relance impossible");
            return t;
        },
        onSuccess: (t) => toast.success(`Relance envoyée à ${t.name}`),
        onError: (e: Error) => toast.error(e.message),
    });

    const complete = tutors.filter(t => (t.completeness?.percent ?? 0) === 100).length;
    const globalPercent = tutors.length ? Math.round((complete / tutors.length) * 100) : 0;
    const topMissing = useMemo(() => {
        const count: Record<string, number> = {};
        tutors.forEach(t => (t.completeness?.missing || []).forEach(m => { count[m] = (count[m] || 0) + 1; }));
        return Object.entries(count).sort((a, b) => b[1] - a[1]).map(([m]) => m).slice(0, 4);
    }, [tutors]);
    const medianRate = useMemo(() => {
        const valid = tutors.filter(t => t.rate >= 500).map(t => t.rate).sort((a, b) => a - b);
        if (!valid.length) return null;
        const m = valid[Math.floor(valid.length / 2)];
        return `${new Intl.NumberFormat("fr-FR").format(m)} FCFA/h`;
    }, [tutors]);

    const filtered = useMemo(() => {
        const q = norm(search);
        const list = tutors.filter(t =>
            (!q || [t.name, t.city, ...t.subjects, ...t.zones].some(v => norm(v).includes(q))) &&
            (!onlyIncomplete || (t.completeness?.percent ?? 0) < 100) &&
            matchesFilters(t, applied)
        );
        return [...list].sort((a, b) =>
            sort === "name" ? (a.name || "").localeCompare(b.name || "", "fr")
                : sort === "completeness" ? (a.completeness?.percent ?? 0) - (b.completeness?.percent ?? 0)
                : String(b.createdAt || "").localeCompare(String(a.createdAt || ""))
        );
    }, [tutors, search, onlyIncomplete, applied, sort]);

    const editing = tutors.find(t => t.id === editingId) || null;
    useEffect(() => { if (editingId && !isLoading && !editing) setSearchParams({}); }, [editingId, editing, isLoading, setSearchParams]);

    const toggle = (key: "subjects" | "levels", v: string) =>
        setDraft(f => ({ ...f, [key]: f[key].includes(v) ? f[key].filter(x => x !== v) : [...f[key], v] }));
    const toggleSlot = (day: string, slot: string) =>
        setDraft(f => {
            const cur = f.slots[day] || [];
            return { ...f, slots: { ...f.slots, [day]: cur.includes(slot) ? cur.filter(s => s !== slot) : [...cur, slot] } };
        });
    const toggleSlotColumn = (slot: string) =>
        setDraft(f => {
            const all = DAYS.every(d => (f.slots[d.key] || []).includes(slot));
            const slots = { ...f.slots };
            DAYS.forEach(d => {
                const cur = slots[d.key] || [];
                slots[d.key] = all ? cur.filter(s => s !== slot) : [...new Set([...cur, slot])];
            });
            return { ...f, slots };
        });
    const addZone = () => {
        const z = zoneDraft.trim();
        if (z && !draft.zones.includes(z)) setDraft(f => ({ ...f, zones: [...f.zones, z] }));
        setZoneDraft("");
    };
    const reset = () => { setDraft(EMPTY_FILTERS); setApplied(EMPTY_FILTERS); setSearch(""); setOnlyIncomplete(false); };

    const actions = (t: Tutor, compact = false) => (
        <div className={cn("flex items-center gap-2 shrink-0", compact && "w-full")}>
            <a href={`/professeurs/${t.id}`} target="_blank" rel="noreferrer" className={cn(BTN, "h-8 px-3 text-xs border border-gray-200 bg-white text-[#0D2D5A] hover:bg-gray-50", compact && "flex-1")}>
                <Eye className="w-3.5 h-3.5" /> Voir profil
            </a>
            <button onClick={() => setSearchParams({ id: t.id! })} className={cn(BTN_BLUE, "h-8 px-3 text-xs", compact && "flex-1")}>
                <Pencil className="w-3.5 h-3.5" /> Compléter
            </button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button aria-label={`Plus d'actions pour ${t.name}`} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={(t.completeness?.percent ?? 0) === 100 || remind.isPending} onClick={() => remind.mutate(t)} className="gap-2 cursor-pointer">
                        <Send className="w-4 h-4" /> Relancer le tuteur
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/advisor/matching")} className="gap-2 cursor-pointer">
                        <Users className="w-4 h-4" /> Voir le matching
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    return (
        <div className="p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            {/* En-tête */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-white shrink-0" style={{ background: BLUE }}>
                    <Users className="w-7 h-7" />
                </div>
                <div>
                    <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Tuteurs</h1>
                    <p className="text-gray-500 text-sm mt-0.5">
                        Complétez les profils pour un matching fiable : matières, niveaux, zone, disponibilités et tarif.
                        {tutors.length > 0 && <> {tutors.length - complete} profil{tutors.length - complete > 1 ? "s" : ""} sur {tutors.length} à compléter.</>}
                    </p>
                </div>
            </div>

            {/* Barre d'outils */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un tuteur, une matière, une ville..."
                        className="w-full border border-gray-200 rounded-full pl-10 pr-4 h-10 text-sm outline-none focus:ring-2 focus:ring-[#1A6CC8]/15 focus:border-[#1A6CC8]"
                    />
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-[#0D2D5A]">
                    <input type="checkbox" checked={onlyIncomplete} onChange={e => setOnlyIncomplete(e.target.checked)} className="w-4 h-4 accent-[#1A6CC8]" />
                    Profils incomplets uniquement
                </label>
                <div className="md:ml-auto flex gap-2" role="group" aria-label="Affichage">
                    <button onClick={() => setView("list")} aria-pressed={view === "list"} className={cn(BTN, "h-9 px-3", view === "list" ? "bg-[#1A6CC8] text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50")}>
                        <List className="w-4 h-4" /> Vue liste
                    </button>
                    <button onClick={() => setView("cards")} aria-pressed={view === "cards"} className={cn(BTN, "h-9 px-3", view === "cards" ? "bg-[#1A6CC8] text-white" : "border border-gray-200 text-gray-500 hover:bg-gray-50")}>
                        <LayoutGrid className="w-4 h-4" /> Vue cartes
                    </button>
                </div>
            </div>

            {/* Synthèse + recherche multicritère */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col lg:flex-row lg:items-center gap-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-4 lg:w-80">
                        <ProgressRing value={complete} total={tutors.length} />
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[#0D2D5A]">Profils complétés</p>
                            <p className="text-sm font-bold" style={{ color: BLUE }}>{globalPercent} %</p>
                            <div className="h-1.5 rounded-full bg-gray-100 mt-1"><div className="h-full rounded-full" style={{ width: `${globalPercent}%`, background: BLUE }} /></div>
                        </div>
                    </div>
                    <div className="flex-1 lg:border-l lg:border-gray-100 lg:pl-5 text-sm">
                        {topMissing.length > 0 && <p className="text-xs text-gray-500">Il manque le plus souvent : {topMissing.join(", ")}</p>}
                        {medianRate && <p className="text-[#0D2D5A] mt-1">Tarif médian : <span className="font-semibold">{medianRate}</span></p>}
                    </div>
                    <div className="flex gap-2">
                        <button onClick={reset} className={BTN_OUTLINE}><RotateCcw className="w-4 h-4" /> Réinitialiser</button>
                        <button onClick={() => navigate("/advisor/applications")} title="Un tuteur est créé à partir d'une candidature acceptée" className={BTN_BLUE}>
                            <Plus className="w-4 h-4" /> Nouveau tuteur
                        </button>
                    </div>
                </div>

                <Section icon={BookOpen} title="Matières enseignées" collapsible>
                    <div className="flex flex-wrap gap-2">
                        {ALL_SUBJECTS.map(s => (
                            <button key={s} type="button" aria-pressed={draft.subjects.includes(s)} onClick={() => toggle("subjects", s)}
                                className={cn(CHIP, draft.subjects.includes(s) ? "bg-[#1A6CC8] text-white border-[#1A6CC8]" : "bg-white text-[#0D2D5A] border-gray-200 hover:border-gray-300")}>
                                {s}
                            </button>
                        ))}
                    </div>
                </Section>

                <Section icon={GraduationCap} title="Niveaux">
                    <div className="flex flex-wrap gap-2">
                        {["Tous niveaux", ...ALL_LEVELS].map(l => (
                            <button key={l} type="button" aria-pressed={draft.levels.includes(l)} onClick={() => toggle("levels", l)}
                                className={cn(CHIP, draft.levels.includes(l) ? "bg-[#1A6CC8] text-white border-[#1A6CC8]" : "bg-white text-[#0D2D5A] border-gray-200 hover:border-gray-300")}>
                                {l}
                            </button>
                        ))}
                    </div>
                </Section>

                <section className="py-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A] mb-3"><MapPin className="w-4 h-4" style={{ color: BLUE }} /> Ville</h3>
                        <CityAutocomplete value={draft.city} onChange={v => setDraft(f => ({ ...f, city: v }))} placeholder="Ex. : Douala" />
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A] mb-3"><MapPin className="w-4 h-4" style={{ color: BLUE }} /> Zones d'intervention (quartiers, villes)</h3>
                        <div className="flex gap-2">
                            <input value={zoneDraft} onChange={e => setZoneDraft(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addZone(); } }} placeholder="Ex : Akwa, Bonapriso" className={INPUT} />
                            <button type="button" onClick={addZone} aria-label="Ajouter la zone" className="w-10 h-10 shrink-0 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50" style={{ color: BLUE }}>
                                <Crosshair className="w-4 h-4" />
                            </button>
                        </div>
                        {draft.zones.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {draft.zones.map(z => (
                                    <span key={z} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[#1A6CC8]/10" style={{ color: BLUE }}>
                                        {z}<button type="button" aria-label={`Retirer ${z}`} onClick={() => setDraft(f => ({ ...f, zones: f.zones.filter(x => x !== z) }))}><X className="w-3 h-3" /></button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <Section icon={CalendarDays} title="Disponibilités">
                    <div className="flex flex-wrap gap-2 mb-4">
                        {SLOTS.map(s => {
                            const all = DAYS.every(d => (draft.slots[d.key] || []).includes(s.key));
                            return (
                                <button key={s.key} type="button" aria-pressed={all} onClick={() => toggleSlotColumn(s.key)}
                                    className={cn("px-4 py-1.5 rounded-lg border text-center transition-colors", all ? "bg-[#1A6CC8] text-white border-[#1A6CC8]" : "bg-gray-50 border-gray-100 text-[#0D2D5A] hover:border-gray-200")}>
                                    <span className="block text-xs font-bold">{s.label}</span>
                                    <span className={cn("block text-[10px]", all ? "text-white/80" : "text-gray-400")}>{s.hours}</span>
                                </button>
                            );
                        })}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px] border-separate border-spacing-x-2 border-spacing-y-1.5">
                            <thead>
                                <tr>
                                    <th className="w-24" />
                                    {SLOTS.map(s => <th key={s.key} className="text-xs font-semibold text-[#0D2D5A] pb-1">{s.label}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {DAYS.map(d => (
                                    <tr key={d.key}>
                                        <th scope="row" className="text-left text-xs font-semibold text-[#0D2D5A]">{d.label}</th>
                                        {SLOTS.map(s => {
                                            const on = (draft.slots[d.key] || []).includes(s.key);
                                            return (
                                                <td key={s.key}>
                                                    <button type="button" aria-pressed={on} aria-label={`${d.label} ${s.label}`} onClick={() => toggleSlot(d.key, s.key)}
                                                        className={cn("w-full h-8 rounded-lg border flex items-center gap-2 px-2.5 text-[11px] transition-colors",
                                                            on ? "bg-[#1A6CC8]/10 border-[#1A6CC8]/40 text-[#1A6CC8] font-semibold" : "bg-white border-gray-200 text-gray-400 hover:border-gray-300")}>
                                                        <Clock className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="flex-1 text-left truncate">{on ? `Disponible ${s.hours}` : "Sélectionner des créneaux..."}</span>
                                                        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Section>

                <section className="pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A] mb-3"><Banknote className="w-4 h-4" style={{ color: BLUE }} /> Tarif horaire</h3>
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden focus-within:border-[#1A6CC8] focus-within:ring-2 focus-within:ring-[#1A6CC8]/15">
                            <input type="number" min={0} step={500} value={draft.maxRate} onChange={e => setDraft(f => ({ ...f, maxRate: e.target.value }))}
                                placeholder="Ex. : 7500 (maximum)" aria-label="Tarif horaire maximum" className="flex-1 h-10 px-3 text-sm outline-none text-[#0D2D5A] placeholder:text-gray-400" />
                            <select value={draft.currency} onChange={e => setDraft(f => ({ ...f, currency: e.target.value }))} aria-label="Devise du tarif"
                                className="h-10 px-2 text-xs border-l border-gray-200 text-[#0D2D5A] bg-white outline-none">
                                {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.value ? (["XAF", "XOF"].includes(c.value) ? `FCFA (${c.value})` : c.value) : "Toutes"}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <h3 className="flex items-center gap-2 text-sm font-bold text-[#0D2D5A] mb-3"><CircleDollarSign className="w-4 h-4" style={{ color: BLUE }} /> Devise</h3>
                        <select value={draft.currency} onChange={e => setDraft(f => ({ ...f, currency: e.target.value }))} className={INPUT}>
                            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                    <button onClick={() => setApplied(draft)} className={cn(BTN_BLUE, "h-11 px-6")}>
                        <Search className="w-4 h-4" /> Rechercher
                    </button>
                </section>
            </div>

            {/* Résultats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A]">{filtered.length} tuteur{filtered.length > 1 ? "s" : ""}</h2>
                    <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500" htmlFor="tutor-sort">Trier par :</label>
                        <select id="tutor-sort" value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
                            <option value="recent">Date d'ajout (récent)</option>
                            <option value="completeness">Complétude (croissante)</option>
                            <option value="name">Nom (A-Z)</option>
                        </select>
                        <button onClick={() => setView("list")} aria-label="Vue liste" aria-pressed={view === "list"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center", view === "list" ? "bg-[#1A6CC8] text-white" : "text-gray-400 hover:bg-gray-100")}><List className="w-4 h-4" /></button>
                        <button onClick={() => setView("cards")} aria-label="Vue cartes" aria-pressed={view === "cards"} className={cn("w-9 h-9 rounded-lg flex items-center justify-center", view === "cards" ? "bg-[#1A6CC8] text-white" : "text-gray-400 hover:bg-gray-100")}><LayoutGrid className="w-4 h-4" /></button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: BLUE }} /></div>
                ) : isError ? (
                    <div className="p-5 flex items-center justify-between text-sm text-red-700 bg-red-50">
                        Impossible de charger les tuteurs.
                        <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-xs font-semibold"><RefreshCw className="w-3 h-3" /> Réessayer</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-12">Aucun tuteur ne correspond à ces critères.</p>
                ) : view === "list" ? (
                    <ul className="divide-y divide-gray-50">
                        {filtered.map(t => {
                            const rate = formatRate(t);
                            const avail = availabilitySummary(t.availability || {});
                            const place = [t.city, t.zones[0]].filter(Boolean).join(", ");
                            const chip = categoryChip(t.subjects);
                            return (
                                <li key={t.id} className="px-5 py-3 flex flex-col gap-3 xl:grid xl:items-center xl:gap-4 xl:grid-cols-[minmax(230px,1.5fr)_minmax(120px,0.9fr)_minmax(110px,0.8fr)_minmax(120px,0.9fr)_minmax(100px,0.7fr)_auto]">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: avatarColor(t.name) }}>{initials(t.name)}</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-[#0D2D5A] truncate flex items-center gap-1">
                                                {t.name}{t.status === "actif" && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Tuteur actif" />}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{t.subjects.length ? t.subjects.join(", ") : "Aucune matière"}</p>
                                        </div>
                                        {chip && <span className="hidden 2xl:inline max-w-[110px] truncate text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#1A6CC8]/10 shrink-0" style={{ color: BLUE }} title={chip}>{chip}</span>}
                                    </div>
                                    <CompletionBar percent={t.completeness?.percent ?? 0} />
                                    <p className={cn("text-xs flex items-center gap-1.5 min-w-0", place ? "text-[#0D2D5A]" : "text-amber-600")} title={place || "Zone à renseigner"}><MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" /><span className="truncate">{place || "À renseigner"}</span></p>
                                    <p className={cn("text-xs flex items-center gap-1.5 min-w-0", avail ? "text-[#0D2D5A]" : "text-amber-600")} title={avail || "Disponibilités à renseigner"}><CalendarDays className="w-3.5 h-3.5 shrink-0 text-gray-400" /><span className="truncate">{avail || "À renseigner"}</span></p>
                                    <p className="text-sm font-bold min-w-0" title={rate || "Tarif à vérifier"}>{rate ? <span className="text-[#0D2D5A]">{rate}</span> : <span className="text-amber-600">Tarif à vérifier</span>}<CurrencyNote t={t} /></p>
                                    {actions(t)}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="p-5 grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                        {filtered.map(t => {
                            const rate = formatRate(t);
                            const avail = availabilitySummary(t.availability || {});
                            const place = [t.city, t.zones[0]].filter(Boolean).join(", ");
                            return (
                                <div key={t.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: avatarColor(t.name) }}>{initials(t.name)}</div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#0D2D5A] truncate flex items-center gap-1">{t.name}{t.status === "actif" && <BadgeCheck className="w-4 h-4 text-emerald-500 shrink-0" aria-label="Tuteur actif" />}</p>
                                            <p className="text-xs text-gray-400 truncate">{t.subjects.join(", ") || "Aucune matière"}</p>
                                        </div>
                                    </div>
                                    <CompletionBar percent={t.completeness?.percent ?? 0} />
                                    <div className="space-y-1 text-xs">
                                        <p className={cn("flex items-center gap-1.5", place ? "text-[#0D2D5A]" : "text-amber-600")}><MapPin className="w-3.5 h-3.5 text-gray-400" />{place || "Zone à renseigner"}</p>
                                        <p className={cn("flex items-center gap-1.5", avail ? "text-[#0D2D5A]" : "text-amber-600")}><CalendarDays className="w-3.5 h-3.5 text-gray-400" />{avail || "Disponibilités à renseigner"}</p>
                                        <p className="font-bold text-sm">{rate ? <span className="text-[#0D2D5A]">{rate}</span> : <span className="text-amber-600">Tarif à vérifier</span>}<CurrencyNote t={t} /></p>
                                    </div>
                                    {actions(t, true)}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Dialog open={!!editing} onOpenChange={open => { if (!open) setSearchParams({}); }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Compléter le profil de {editing?.name}</DialogTitle>
                        <DialogDescription>Ces informations alimentent le score de matching. Le tarif et la devise ne sont modifiables que par l'équipe.</DialogDescription>
                    </DialogHeader>
                    {editing && (
                        <TutorProfileForm
                            value={editing}
                            allowRate
                            saving={save.isPending}
                            onSave={payload => save.mutate({ id: editing.id!, payload }, { onSuccess: () => setSearchParams({}) })}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
