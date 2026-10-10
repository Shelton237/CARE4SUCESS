import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchTeacherApplications,
    reviewTeacherApplication,
} from "@/api/backoffice";
import type {
    TeacherApplication,
    TeacherApplicationStatus,
    ReviewerRole,
} from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RateType } from "@/integrations/supabase/types";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    CheckCircle2,
    XCircle,
    UserPlus,
    Mail,
    FileText,
    Loader2,
    Copy,
    Search,
    Calendar,
    Briefcase,
    GraduationCap,
    AlertCircle,
    Phone,
    Clock,
    CalendarDays,
    DollarSign,
    Users,
    MapPin,
    Star,
    Eye,
    MoreVertical,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    RotateCcw,
    LayoutGrid,
    Table2,
    TrendingUp,
    TrendingDown,
} from "lucide-react";

const STATUS_FILTERS: Array<{
    value: TeacherApplicationStatus | "all";
    label: string;
}> = [
        { value: "pending", label: "En attente" },
        { value: "approved", label: "Validées" },
        { value: "rejected", label: "Refusées" },
        { value: "all", label: "Toutes" },
    ];

const STATUS_STYLES: Record<
    TeacherApplicationStatus,
    { bg: string; text: string; label: string; short: string }
> = {
    pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "En attente",
        short: "En attente",
    },
    approved: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Validée",
        short: "Validé",
    },
    rejected: {
        bg: "bg-rose-100",
        text: "text-rose-700",
        label: "Refusée",
        short: "Refusé",
    },
};

// ─── Présentation (cartes, filtres) ──────────────────────────────────────────
type App = TeacherApplication & {
    city?: string; zones?: string[]; levels?: string[]; interviewDate?: string; interviewStatus?: string;
    userId?: string | null; reviewCount?: number; reviewAvg?: number | null;
};
const BLUE = "#1A6CC8";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors disabled:opacity-50";
const SELECT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15";
const LABEL = "text-xs font-semibold text-[#0D2D5A] mb-1.5 block";
const PALETTE = [
    { bg: "#DBEAFE", fg: "#1D4ED8" }, { bg: "#DCFCE7", fg: "#15803D" }, { bg: "#FCE7F3", fg: "#BE185D" },
    { bg: "#F3E8FF", fg: "#7C3AED" }, { bg: "#FEF3C7", fg: "#B45309" }, { bg: "#E0F2FE", fg: "#0369A1" },
];
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const tone = (n = "") => PALETTE[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length];
const formatDay = (d?: string | null) => { const x = d ? new Date(d) : null; return x && !isNaN(x.getTime()) ? x.toLocaleDateString("fr-FR") : "Non datée"; };
// Variation des 30 derniers jours par rapport aux 30 précédents
const trend = (list: App[]) => {
    const now = Date.now(), day = 86_400_000, t = (a: App) => new Date(a.createdAt).getTime() || 0;
    const recent = list.filter(a => t(a) > now - 30 * day).length;
    const before = list.filter(a => t(a) <= now - 30 * day && t(a) > now - 60 * day).length;
    return before ? Math.round(((recent - before) / before) * 100) : null;
};
// Complétude du dossier de candidature (aide à la décision, pas un score de qualité)
const completeness = (a: App) => {
    const checks: [string, boolean][] = [
        ["matières", a.subjects.length > 0],
        ["niveaux", (a.levels || []).length > 0],
        ["ville", !!a.city],
        ["expérience", Number(a.experienceYears) > 0],
        ["disponibilités", !!(a.availability && a.availability.trim())],
        ["CV", !!a.cvUrl],
        ["motivation", !!(a.motivation && a.motivation.trim())],
    ];
    const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
    return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
};
const experienceLabel = (a: App) => {
    const y = Number(a.experienceYears) || 0;
    return y > 0 ? `${y} an${y > 1 ? "s" : ""} d'expérience` : "Expérience non renseignée";
};
type BoardFilters = { subject: string; level: string; city: string; experience: string; from: string; to: string; completeOnly: boolean };
const EMPTY_F: BoardFilters = { subject: "", level: "", city: "", experience: "", from: "", to: "", completeOnly: false };

interface TeacherApplicationsBoardProps {
    reviewerRole: ReviewerRole;
    title?: string;
    description?: string;
}

export default function TeacherApplicationsBoard({
    reviewerRole,
    title = "Candidatures enseignants",
    description = "Analysez les nouveaux profils et validez les meilleurs candidats.",
}: TeacherApplicationsBoardProps) {
    const [statusFilter, setStatusFilter] = useState<TeacherApplicationStatus | "all">("all");
    const [showFilters, setShowFilters] = useState(false);
    const [f, setF] = useState<BoardFilters>(EMPTY_F);
    const [sort, setSort] = useState<"recent" | "old" | "experience" | "complete" | "name">("recent");
    const [view, setView] = useState<"cards" | "table">("cards");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(9);
    const [detail, setDetail] = useState<App | null>(null);
    const navigate = useNavigate();
    const [decisionDialog, setDecisionDialog] = useState<{
        app: TeacherApplication;
        status: Exclude<TeacherApplicationStatus, "pending">;
    } | null>(null);
    const [notes, setNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [rateType, setRateType] = useState<RateType>("hourly");
    const [negotiatedRate, setNegotiatedRate] = useState<string>("7500");
    const [currency, setCurrency] = useState<string>("XAF");
    const [rateUnitMinutes, setRateUnitMinutes] = useState<string>("60");
    const [newCredentials, setNewCredentials] = useState<{
        email: string;
        password?: string;
        name: string;
        alreadyExists?: boolean;
    } | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Toutes les candidatures en une fois : les compteurs et les filtres se calculent côté écran.
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["teacherApplications", "all"],
        queryFn: () => fetchTeacherApplications(undefined),
        refetchOnWindowFocus: false,
    });

    const mutation = useMutation({
        mutationFn: ({
            id,
            status,
            reviewNotes,
            rateType,
            negotiatedRate,
            currency,
            rateUnitMinutes,
        }: {
            id: string;
            status: Exclude<TeacherApplicationStatus, "pending">;
            reviewNotes?: string;
            rateType?: RateType;
            negotiatedRate?: number;
            currency?: string;
            rateUnitMinutes?: number;
        }) =>
            reviewTeacherApplication(id, {
                status,
                reviewNotes,
                reviewerName: user?.name ?? reviewerRole.toUpperCase(),
                reviewerRole,
                rateType,
                negotiatedRate,
                currency,
                rateUnitMinutes,
            }),
        onSuccess: (data: any) => {
            if (data?.credentials) {
                setNewCredentials(data.credentials);
            } else {
                toast({
                    title: "Candidature mise à jour",
                    description: "La décision a été enregistrée.",
                });
            }
            queryClient.invalidateQueries({ queryKey: ["teacherApplications"] });
            setDecisionDialog(null);
        },
        onError: (err: Error) => {
            toast({
                title: "Impossible de mettre à jour",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const applications = (data ?? []) as App[];
    const countOf = (st: TeacherApplicationStatus) => applications.filter(a => a.status === st).length;
    const pendingCount = countOf("pending");

    const options = useMemo(() => {
        const subjects = new Set<string>(), levels = new Set<string>(), cities = new Set<string>();
        applications.forEach(a => {
            a.subjects.forEach(x => subjects.add(String(x)));
            (a.levels || []).forEach(x => levels.add(String(x)));
            if (a.city) cities.add(a.city);
        });
        const sorted = (x: Set<string>) => [...x].sort((p, q) => p.localeCompare(q, "fr"));
        return { subjects: sorted(subjects), levels: sorted(levels), cities: sorted(cities) };
    }, [applications]);

    const filteredApplications = useMemo(() => {
        const q = norm(searchTerm);
        const from = f.from ? new Date(`${f.from}T00:00:00`).getTime() : null;
        const to = f.to ? new Date(`${f.to}T23:59:59`).getTime() : null;
        const list = applications.filter(app => {
            const t = new Date(app.createdAt).getTime();
            const y = Number(app.experienceYears) || 0;
            return (
                (!q || [app.fullName, app.email, app.phone, app.city, ...app.subjects].some(v => norm(v).includes(q))) &&
                (statusFilter === "all" || app.status === statusFilter) &&
                (!f.subject || app.subjects.includes(f.subject)) &&
                (!f.level || (app.levels || []).includes(f.level)) &&
                (!f.city || app.city === f.city) &&
                (!f.experience || (f.experience === "lt2" ? y < 2 : f.experience === "2to5" ? y >= 2 && y <= 5 : y > 5)) &&
                (from === null || t >= from) && (to === null || t <= to) &&
                (!f.completeOnly || completeness(app).percent === 100)
            );
        });
        return [...list].sort((a, b) =>
            sort === "old" ? +new Date(a.createdAt) - +new Date(b.createdAt)
                : sort === "experience" ? (Number(b.experienceYears) || 0) - (Number(a.experienceYears) || 0)
                : sort === "complete" ? completeness(b).percent - completeness(a).percent
                : sort === "name" ? a.fullName.localeCompare(b.fullName, "fr")
                : +new Date(b.createdAt) - +new Date(a.createdAt)
        );
    }, [applications, searchTerm, statusFilter, f, sort]);

    useEffect(() => { setPage(1); }, [searchTerm, statusFilter, f, sort, pageSize]);
    const totalPages = Math.max(1, Math.ceil(filteredApplications.length / pageSize));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * pageSize;
    const pageItems = filteredApplications.slice(start, start + pageSize);
    const activeFilters = [statusFilter !== "all", f.subject, f.level, f.city, f.experience, f.from || f.to, f.completeOnly].filter(Boolean).length;

    const openDecision = (
        app: TeacherApplication,
        status: Exclude<TeacherApplicationStatus, "pending">
    ) => {
        setNotes("");
        setRateType("hourly");
        setNegotiatedRate("7500");
        setDecisionDialog({ app, status });
    };

    const copyCredentials = () => {
        if (!newCredentials) return;
        const text = newCredentials.alreadyExists
            ? `Bonjour ${newCredentials.name},\nVotre candidature a été validée. Votre compte enseignant a été lié à votre email existant : ${newCredentials.email}`
            : `Bonjour ${newCredentials.name},\nVotre candidature a été validée.\nVoici vos identifiants temporaires de connexion à Care4Success :\nEmail : ${newCredentials.email}\nMot de passe : ${newCredentials.password}`;
        navigator.clipboard.writeText(text);
        toast({ title: "Copié !", description: "Identifiants copiés dans le presse-papier." });
    };

    const contact = (app: App) =>
        app.userId
            ? navigate(`/${reviewerRole === "admin" ? "admin" : "advisor"}/messages`, { state: { contactId: app.userId, contactName: app.fullName } })
            : (window.location.href = `mailto:${app.email}`);

    const kpis = [
        { key: "pending" as const, label: "En attente", sub: "Profils à valider", value: pendingCount, icon: Users, card: "bg-white", ring: "bg-blue-50 text-[#1A6CC8]", text: "text-[#0D2D5A]" },
        { key: "approved" as const, label: "Validées", sub: "Profils confirmés", value: countOf("approved"), icon: CheckCircle2, card: "bg-emerald-50/50", ring: "bg-emerald-100 text-emerald-600", text: "text-emerald-700" },
        { key: "rejected" as const, label: "Refusées", sub: "Profils non retenus", value: countOf("rejected"), icon: XCircle, card: "bg-rose-50/50", ring: "bg-rose-100 text-rose-600", text: "text-rose-600" },
        { key: "all" as const, label: "Toutes", sub: "Total des candidatures", value: applications.length, icon: FileText, card: "bg-violet-50/50", ring: "bg-violet-100 text-violet-600", text: "text-violet-700" },
    ];

    const menu = (app: App) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button aria-label={`Actions pour ${app.fullName}`} className="w-7 h-7 rounded-md flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#0D2D5A]">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => setDetail(app)}><Eye className="w-4 h-4" /> Voir le profil</DropdownMenuItem>
                {app.cvUrl && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => window.open(app.cvUrl!, "_blank", "noopener")}><FileText className="w-4 h-4" /> Ouvrir le CV</DropdownMenuItem>}
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => contact(app)}><Mail className="w-4 h-4" /> Contacter</DropdownMenuItem>
                <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { navigator.clipboard.writeText(app.email); toast({ title: "Email copié", description: app.email }); }}>
                    <Copy className="w-4 h-4" /> Copier l'email
                </DropdownMenuItem>
                {app.status === "pending" && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="gap-2 cursor-pointer text-emerald-700" onClick={() => openDecision(app, "approved")}><CheckCircle2 className="w-4 h-4" /> Valider</DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 cursor-pointer text-rose-600" onClick={() => openDecision(app, "rejected")}><XCircle className="w-4 h-4" /> Refuser</DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const statusPill = (app: App) => {
        const ui = STATUS_STYLES[app.status];
        return <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap", ui.bg, ui.text)}>{ui.short}</span>;
    };

    const mainAction = (app: App) =>
        app.status === "pending" ? (
            <button onClick={() => openDecision(app, "approved")} className={cn(BTN, "flex-1 text-white")} style={{ background: BLUE }}>
                <CheckCircle2 className="w-4 h-4" /> Valider
            </button>
        ) : app.status === "approved" ? (
            <button onClick={() => contact(app)} className={cn(BTN, "flex-1 border border-[#1A6CC8]/40 text-[#1A6CC8] hover:bg-[#1A6CC8]/5")}>
                <Mail className="w-4 h-4" /> Contacter
            </button>
        ) : (
            <span className={cn(BTN, "flex-1 border border-rose-200 text-rose-600 cursor-default")}><XCircle className="w-4 h-4" /> Refusé</span>
        );

    const appCard = (app: App) => {
        const t = tone(app.fullName);
        const c = completeness(app);
        const place = [app.city, ...(app.zones || []).slice(0, 1)].filter(Boolean).join(", ");
        return (
            <div key={app.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
                <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ background: t.bg, color: t.fg }}>{initials(app.fullName)}</div>
                    <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-bold text-[#0D2D5A] leading-tight line-clamp-2" title={app.fullName}>{app.fullName}</p>
                            <div className="flex items-center gap-1 shrink-0">{statusPill(app)}{menu(app)}</div>
                        </div>
                        <p className="text-xs text-gray-500 truncate" title={app.subjects.join(" • ")}>{app.subjects.join(" • ") || "Aucune matière"}</p>
                        <p className={cn("text-xs flex items-center gap-1.5", place ? "text-gray-500" : "text-amber-600")}><MapPin className="w-3.5 h-3.5 shrink-0" />{place || "Ville non renseignée"}</p>
                        <p className={cn("text-xs flex items-center gap-1.5", Number(app.experienceYears) > 0 ? "text-gray-500" : "text-amber-600")}><Briefcase className="w-3.5 h-3.5 shrink-0" />{experienceLabel(app)}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate"><GraduationCap className="w-3.5 h-3.5 shrink-0" />{(app.levels || []).length ? (app.levels || []).join(", ") : "Niveaux non renseignés"}</p>
                        <p className="text-xs flex items-center gap-1.5 text-gray-500">
                            <Star className={cn("w-3.5 h-3.5 shrink-0", app.reviewCount ? "text-[#F5A623] fill-[#F5A623]" : "text-gray-300")} />
                            {app.reviewCount ? `${app.reviewAvg} (${app.reviewCount} avis)` : "Pas encore d'avis"}
                        </p>
                    </div>
                </div>
                <div title={c.missing.length ? `Manque : ${c.missing.join(", ")}` : "Dossier complet"}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="flex items-center gap-1 font-semibold text-[#0D2D5A]"><CheckCircle2 className={cn("w-3.5 h-3.5", c.percent === 100 ? "text-emerald-600" : "text-gray-300")} /> {c.percent === 100 ? "Dossier complet" : "Complétude du dossier"}</span>
                        <span className="font-bold text-[#0D2D5A]">{c.percent}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full" style={{ width: `${c.percent}%`, background: c.percent === 100 ? "#16A34A" : c.percent >= 60 ? "#D97706" : "#DC2626" }} /></div>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> Candidature : <strong className="text-[#0D2D5A] font-semibold">{formatDay(app.createdAt)}</strong></span>
                    <span className="flex items-center gap-1 min-w-0"><Clock className="w-3.5 h-3.5 shrink-0" /> Disponible : <strong className="text-[#0D2D5A] font-semibold truncate max-w-[140px]" title={app.availability}>{app.availability || "Non précisé"}</strong></span>
                </div>
                <div className="flex gap-2 mt-auto">
                    <button onClick={() => setDetail(app)} className={cn(BTN, "flex-1 border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}><Eye className="w-4 h-4" /> Voir le profil</button>
                    {mainAction(app)}
                </div>
            </div>
        );
    };

    return (
        <div className="w-full p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-[#0D2D5A]" />
                <div>
                    <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h1>
                    <p className="text-gray-500 text-sm mt-0.5">{description}</p>
                </div>
            </div>

            {/* Indicateurs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {kpis.map(k => {
                    const tr = trend(applications.filter(a => k.key === "all" || a.status === k.key));
                    return (
                        <button key={k.key} onClick={() => setStatusFilter(k.key)} aria-pressed={statusFilter === k.key}
                            className={cn("rounded-2xl p-4 flex items-center gap-4 border text-left shadow-sm", k.card, statusFilter === k.key ? "border-current" : "border-gray-100", k.text)}>
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center shrink-0", k.ring)}><k.icon className="w-5 h-5" /></div>
                            <div className="flex-1 min-w-0">
                                <p className="text-2xl font-bold">{isLoading ? "…" : k.value}</p>
                                <p className="text-sm font-semibold">{k.label}</p>
                                <p className="text-xs text-gray-500">{k.sub}</p>
                            </div>
                            {tr !== null && (
                                <span className={cn("self-start inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full", tr >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-600")}
                                    title="Candidatures des 30 derniers jours par rapport aux 30 précédents">
                                    {tr >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{tr >= 0 ? "+" : ""}{tr}%
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Recherche et filtres (repliés) */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="text" aria-label="Rechercher" placeholder="Rechercher par nom, email, téléphone, spécialité..." value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#1A6CC8]/15 focus:border-[#1A6CC8] outline-none" />
                    </div>
                    <button onClick={() => setShowFilters(o => !o)} aria-expanded={showFilters}
                        className={cn(BTN, "border", activeFilters ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>
                        <SlidersHorizontal className="w-4 h-4" /> Filtres avancés{activeFilters ? ` · ${activeFilters}` : ""}
                        {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {(activeFilters > 0 || searchTerm) && (
                        <button onClick={() => { setF(EMPTY_F); setStatusFilter("all"); setSearchTerm(""); }} className={cn(BTN, "border border-gray-200 text-[#1A6CC8] hover:bg-gray-50")}>
                            <RotateCcw className="w-4 h-4" /> Réinitialiser
                        </button>
                    )}
                </div>
                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <label><span className={LABEL}>Statut</span>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className={SELECT}>
                                {STATUS_FILTERS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </label>
                        <label><span className={LABEL}>Spécialité</span>
                            <select value={f.subject} onChange={e => setF(x => ({ ...x, subject: e.target.value }))} className={SELECT}>
                                <option value="">Toutes</option>{options.subjects.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <label><span className={LABEL}>Niveau d'enseignement</span>
                            <select value={f.level} onChange={e => setF(x => ({ ...x, level: e.target.value }))} className={SELECT}>
                                <option value="">Tous</option>{options.levels.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <label><span className={LABEL}>Expérience</span>
                            <select value={f.experience} onChange={e => setF(x => ({ ...x, experience: e.target.value }))} className={SELECT}>
                                <option value="">Toutes</option><option value="lt2">Moins de 2 ans</option><option value="2to5">2 à 5 ans</option><option value="gt5">Plus de 5 ans</option>
                            </select>
                        </label>
                        <label><span className={LABEL}>Ville</span>
                            <select value={f.city} onChange={e => setF(x => ({ ...x, city: e.target.value }))} className={SELECT}>
                                <option value="">Toutes</option>{options.cities.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </label>
                        <div className="md:col-span-2">
                            <span className={LABEL}>Date de candidature</span>
                            <div className="flex items-center gap-2">
                                <input type="date" aria-label="Du" value={f.from} onChange={e => setF(x => ({ ...x, from: e.target.value }))} className={SELECT} />
                                <span className="text-gray-400">→</span>
                                <input type="date" aria-label="Au" value={f.to} onChange={e => setF(x => ({ ...x, to: e.target.value }))} className={SELECT} />
                            </div>
                        </div>
                        <label className="rounded-lg border border-gray-100 px-3 flex items-center justify-between gap-3 self-end h-10">
                            <span className="text-sm font-semibold text-[#0D2D5A]">Dossiers complets uniquement</span>
                            <Switch checked={f.completeOnly} onCheckedChange={v => setF(x => ({ ...x, completeOnly: v }))} aria-label="Dossiers complets uniquement" />
                        </label>
                    </div>
                )}
            </div>

            {/* Barre d'affichage */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2" role="group" aria-label="Affichage">
                        <button onClick={() => setView("cards")} aria-pressed={view === "cards"} className={cn(BTN, view === "cards" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "cards" ? { background: BLUE } : undefined}>
                            <LayoutGrid className="w-4 h-4" /> Cartes
                        </button>
                        <button onClick={() => setView("table")} aria-pressed={view === "table"} className={cn(BTN, view === "table" ? "text-white" : "border border-gray-200 bg-white text-[#0D2D5A]")} style={view === "table" ? { background: BLUE } : undefined}>
                            <Table2 className="w-4 h-4" /> Tableau
                        </button>
                    </div>
                    <p className="text-sm font-bold text-[#0D2D5A]">{filteredApplications.length} professeur{filteredApplications.length > 1 ? "s" : ""} trouvé{filteredApplications.length > 1 ? "s" : ""}</p>
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-500">Trier par :
                    <select value={sort} onChange={e => setSort(e.target.value as any)} className="h-9 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] bg-white outline-none">
                        <option value="recent">Plus récents</option><option value="old">Plus anciens</option><option value="experience">Plus d'expérience</option>
                        <option value="complete">Dossier le plus complet</option><option value="name">Nom (A-Z)</option>
                    </select>
                </label>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {error instanceof Error ? error.message : "Impossible de charger les candidatures."}
                </div>
            )}

            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#1A6CC8]" />
                    <p className="font-medium text-gray-500">Chargement des candidatures…</p>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-500 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4"><UserPlus className="w-8 h-8 text-gray-400" /></div>
                    <h3 className="text-lg font-bold text-[#0D2D5A] mb-1">Aucune candidature</h3>
                    <p>Aucun profil ne correspond à vos critères pour le moment.</p>
                </div>
            ) : view === "cards" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4">{pageItems.map(appCard)}</div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
                    <table className="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50/60 border-b border-gray-100 text-left text-[11px] uppercase tracking-wide text-gray-400">
                                <th className="px-5 py-3 font-bold">Candidat</th><th className="px-4 py-3 font-bold">Matières</th><th className="px-4 py-3 font-bold">Ville</th>
                                <th className="px-4 py-3 font-bold">Expérience</th><th className="px-4 py-3 font-bold">Dossier</th><th className="px-4 py-3 font-bold">Candidature</th>
                                <th className="px-4 py-3 font-bold">Statut</th><th className="px-4 py-3" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {pageItems.map(app => {
                                const t = tone(app.fullName), c = completeness(app);
                                return (
                                    <tr key={app.id} className="hover:bg-gray-50/60">
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: t.bg, color: t.fg }}>{initials(app.fullName)}</div>
                                                <div className="min-w-0"><p className="font-bold text-[#0D2D5A] truncate">{app.fullName}</p><p className="text-xs text-gray-500 truncate">{app.email}</p></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[200px] truncate">{app.subjects.join(", ")}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{app.city || "Non renseignée"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{experienceLabel(app)}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-[#0D2D5A]" title={c.missing.join(", ")}>{c.percent}%</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{formatDay(app.createdAt)}</td>
                                        <td className="px-4 py-3">{statusPill(app)}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetail(app)} className={cn(BTN, "h-8 px-3 text-xs border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}>Voir le profil</button>
                                                {menu(app)}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredApplications.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="text-xs text-gray-500 flex items-center gap-2">Éléments par page :
                        <select value={pageSize} onChange={e => setPageSize(Number(e.target.value))} className="h-8 border border-gray-200 rounded-lg px-2 text-xs bg-white">
                            {[9, 18, 36].map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </label>
                    <nav aria-label="Pagination des candidatures" className="flex items-center gap-1">
                        <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                            <button key={n} onClick={() => setPage(n)} aria-current={n === current ? "page" : undefined}
                                className={cn("w-9 h-9 rounded-lg text-xs font-bold", n === current ? "text-white" : "border border-gray-200 text-gray-500")} style={n === current ? { background: BLUE } : undefined}>{n}</button>
                        ))}
                        <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-9 h-9 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                    </nav>
                </div>
            )}

            {/* Profil détaillé du candidat */}
            <Dialog open={!!detail} onOpenChange={open => { if (!open) setDetail(null); }}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    {detail && (() => {
                        const c = completeness(detail);
                        return (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-3">{detail.fullName} {statusPill(detail)}</DialogTitle>
                                    <DialogDescription>Candidature du {formatDay(detail.createdAt)}{detail.reviewedBy ? ` · décision de ${detail.reviewedBy}` : ""}</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /> {detail.email}</p>
                                    <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /> {detail.phone || "Non renseigné"}</p>
                                    <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" /> {[detail.city, ...(detail.zones || [])].filter(Boolean).join(", ") || "Ville non renseignée"}</p>
                                    <p className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-gray-400" /> {experienceLabel(detail)}</p>
                                    <p className="flex items-center gap-2 sm:col-span-2"><GraduationCap className="w-4 h-4 text-gray-400" /> {detail.subjects.join(", ")}{(detail.levels || []).length ? ` · ${(detail.levels || []).join(", ")}` : ""}</p>
                                    <p className="flex items-center gap-2 sm:col-span-2"><Calendar className="w-4 h-4 text-gray-400" /> Disponibilités : {detail.availability || "Non précisées"}</p>
                                    {detail.interviewDate && <p className="flex items-center gap-2 sm:col-span-2"><CalendarDays className="w-4 h-4 text-gray-400" /> Entretien : {new Date(detail.interviewDate).toLocaleString("fr-FR")}{detail.interviewStatus ? ` (${detail.interviewStatus})` : ""}</p>}
                                </div>
                                <div className="text-sm">
                                    <p className="font-semibold text-[#0D2D5A] mb-1">Dossier complet à {c.percent} %</p>
                                    {c.missing.length > 0 && <p className="text-xs text-amber-700">Manque : {c.missing.join(", ")}</p>}
                                </div>
                                {detail.motivation && (
                                    <div className="text-sm">
                                        <p className="font-semibold text-[#0D2D5A] mb-1">Motivation</p>
                                        <p className="text-gray-600 whitespace-pre-line bg-gray-50 rounded-lg p-3">{detail.motivation}</p>
                                    </div>
                                )}
                                {detail.reviewNotes && (
                                    <div className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800">
                                        <span className="font-bold flex items-center gap-1 mb-1"><AlertCircle className="w-3 h-3" /> Note interne</span>{detail.reviewNotes}
                                    </div>
                                )}
                                <div className="flex flex-wrap justify-end gap-2 pt-2">
                                    {detail.cvUrl && <a href={detail.cvUrl} target="_blank" rel="noreferrer" className={cn(BTN, "border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}><FileText className="w-4 h-4" /> Voir le CV</a>}
                                    <button onClick={() => contact(detail)} className={cn(BTN, "border border-gray-200 text-[#0D2D5A] hover:bg-gray-50")}><Mail className="w-4 h-4" /> Contacter</button>
                                    {detail.status === "pending" && (
                                        <>
                                            <button onClick={() => { setDetail(null); openDecision(detail, "rejected"); }} className={cn(BTN, "border border-rose-200 text-rose-700 hover:bg-rose-50")}><XCircle className="w-4 h-4" /> Refuser</button>
                                            <button onClick={() => { setDetail(null); openDecision(detail, "approved"); }} className={cn(BTN, "text-white")} style={{ background: BLUE }}><CheckCircle2 className="w-4 h-4" /> Valider</button>
                                        </>
                                    )}
                                </div>
                            </>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={Boolean(decisionDialog)}
                onOpenChange={(open) => {
                    if (!open) setDecisionDialog(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la décision</AlertDialogTitle>
                        <AlertDialogDescription>
                            {decisionDialog?.status === "approved"
                                ? "Cette candidature sera validée et ajoutée à la base enseignants."
                                : "Cette candidature sera refusée et l'enseignant en sera informé."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="review-notes">Note interne (optionnel)</Label>
                            <Textarea
                                id="review-notes"
                                rows={3}
                                placeholder="Ajoutez un commentaire pour votre équipe..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </div>

                        {decisionDialog?.status === "approved" && (
                            <div className="space-y-3 border border-[#1A6CC8]/20 rounded-xl p-4 bg-[#1A6CC8]/5">
                                <p className="text-xs font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                    <DollarSign className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                    Tarification négociée
                                </p>

                                {/* Type de tarif */}
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRateType("hourly")}
                                        className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl transition-all ${
                                            rateType === "hourly"
                                                ? "border-[#1A6CC8] bg-white shadow-sm text-[#1A6CC8]"
                                                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                                        }`}
                                    >
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Par heure</span>
                                        {rateType === "hourly" && <div className="w-1.5 h-1.5 bg-[#1A6CC8] rounded-full" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRateType("monthly")}
                                        className={`flex flex-col items-center gap-1.5 p-3 border-2 rounded-xl transition-all ${
                                            rateType === "monthly"
                                                ? "border-[#1A6CC8] bg-white shadow-sm text-[#1A6CC8]"
                                                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
                                        }`}
                                    >
                                        <CalendarDays className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Forfait mensuel</span>
                                        {rateType === "monthly" && <div className="w-1.5 h-1.5 bg-[#1A6CC8] rounded-full" />}
                                    </button>
                                </div>

                                {/* Devise */}
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                        Devise
                                    </Label>
                                    <Select value={currency} onValueChange={setCurrency}>
                                        <SelectTrigger className="font-bold text-[#0D2D5A]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {SUPPORTED_CURRENCIES.map((c) => (
                                                <SelectItem key={c} value={c}>{c}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Montant */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-1">
                                        <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                            {rateType === "hourly" ? `Tarif (${currency})` : `Forfait mensuel (${currency})`}
                                        </Label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={negotiatedRate}
                                            onChange={(e) => setNegotiatedRate(e.target.value)}
                                            className="font-bold text-[#0D2D5A]"
                                            placeholder={rateType === "hourly" ? "Ex: 7500" : "Ex: 80000"}
                                        />
                                    </div>
                                    {rateType === "hourly" && (
                                        <div className="space-y-1">
                                            <Label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">
                                                Pour combien de minutes
                                            </Label>
                                            <Input
                                                type="number"
                                                min={1}
                                                value={rateUnitMinutes}
                                                onChange={(e) => setRateUnitMinutes(e.target.value)}
                                                className="font-bold text-[#0D2D5A]"
                                                placeholder="Ex: 60"
                                            />
                                        </div>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {rateType === "hourly"
                                        ? `Ce tarif sera appliqué par défaut : ${negotiatedRate || 0} ${currency} pour ${rateUnitMinutes || 60} minutes de cours.`
                                        : "Ce forfait sera appliqué par défaut pour les cours de cet enseignant."}
                                </p>
                            </div>
                        )}
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (decisionDialog) {
                                    mutation.mutate({
                                        id: decisionDialog.app.id,
                                        status: decisionDialog.status,
                                        reviewNotes: notes,
                                        rateType: decisionDialog.status === "approved" ? rateType : undefined,
                                        negotiatedRate: decisionDialog.status === "approved" ? parseFloat(negotiatedRate) || 7500 : undefined,
                                        currency: decisionDialog.status === "approved" ? currency : undefined,
                                        rateUnitMinutes: decisionDialog.status === "approved" ? parseInt(rateUnitMinutes, 10) || 60 : undefined,
                                    });
                                }
                            }}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Enregistrement..." : "Confirmer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal for Credentials Display */}
            <AlertDialog
                open={Boolean(newCredentials)}
                onOpenChange={(open) => {
                    if (!open) setNewCredentials(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Enseignant validé avec succès
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {newCredentials?.alreadyExists
                                ? "Cette adresse email possédait déjà un compte. Le rôle d'enseignant y a été rattaché."
                                : "Un nouveau compte de connexion a été généré automatiquement pour cet enseignant."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {newCredentials && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 my-4">
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase">Email de connexion</span>
                                <div className="font-medium text-[#0D2D5A] select-all">{newCredentials.email}</div>
                            </div>
                            {!newCredentials.alreadyExists && (
                                <div>
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Mot de passe temporaire</span>
                                    <div className="font-mono font-medium text-[#0D2D5A] select-all">{newCredentials.password}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setNewCredentials(null)}>Fermer</Button>
                        <Button onClick={copyCredentials} className="bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white">
                            <Copy className="w-4 h-4 mr-2" />
                            Copier pour envoyer
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
