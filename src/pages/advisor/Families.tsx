import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users, Search, Phone,
    MessageCircle, FileText, Loader2, ChevronRight,
    SearchCheck, Briefcase, PlusCircle, AlertTriangle,
    ThumbsUp, Lightbulb, Eye, UserCircle2,
    ClipboardCheck, CalendarRange, Trash2,
    Zap, Star, RefreshCw, UserPlus, GitMerge, CheckCircle2,
    CalendarDays, TrendingUp, ArrowUpDown, Check, ChevronDown,
} from "lucide-react";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AcademicFile from "../common/AcademicFile";
import { useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "/api";
const SUBJECTS_DIAG = ["Mathématiques", "Français", "Anglais", "Physique", "SVT", "Histoire-Géo"];
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
    { key: "parents",     label: "Parents" },
    { key: "a-qualifier", label: "À qualifier" },
] as const;

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
    const isProspect = (f: any) => !f?.studentId && !f?.childId;
    const requestId  = selectedFamily?.id && !selectedFamily.id.startsWith("no-request-")
        ? selectedFamily.id
        : null;
    const studentId  = selectedFamily?.studentId || selectedFamily?.childId || null;

    // Clé unifiée pour les queries (request ou student)
    const diagQueryKey  = isProspect(selectedFamily) ? ["reqDiagnostic",  requestId]  : ["diagnostic",   studentId];
    const planQueryKey  = isProspect(selectedFamily) ? ["reqPlan",         requestId]  : ["academicPlan", studentId];

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
    const { data: advisorNotes = [] } = useQuery({
        queryKey: ["advisorNotes", studentId],
        queryFn: async () => {
            if (!studentId) return [];
            const res = await fetch(`${API}/advisor-notes/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
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
            if (!res.ok) throw new Error();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["advisorNotes", studentId] });
            setNoteContent("");
            setShowNoteForm(false);
        }
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (noteId: string) => {
            await fetch(`${API}/advisor-notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ["advisorNotes", studentId] })
    });

    // ──────────────────────────────────────────────────────────────────────
    // Diagnostic — adapte l'endpoint selon prospect ou élève
    // ──────────────────────────────────────────────────────────────────────
    const diagUrl = isProspect(selectedFamily)
        ? `${API}/requests/${requestId}/diagnostic`
        : `${API}/students/${studentId}/diagnostic`;

    const { data: diagnostic } = useQuery({
        queryKey: diagQueryKey,
        queryFn: async () => {
            const url = isProspect(selectedFamily)
                ? `${API}/requests/${requestId}/diagnostic`
                : `${API}/students/${studentId}/diagnostic`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.status === 404) return null;
            return res.json();
        },
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
                    scores: diagScores,
                    strengths: diagStrengths || null,
                    weaknesses: diagWeaknesses || null,
                })
            });
            if (!res.ok) throw new Error("Echec sauvegarde diagnostic");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: diagQueryKey });
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
    const planUrl = isProspect(selectedFamily)
        ? `${API}/requests/${requestId}/plan`
        : `${API}/students/${studentId}/academic-plan`;

    const { data: activePlan } = useQuery({
        queryKey: planQueryKey,
        queryFn: async () => {
            const url = isProspect(selectedFamily)
                ? `${API}/requests/${requestId}/plan`
                : `${API}/students/${studentId}/academic-plan`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            if (res.status === 404) return null;
            return res.json();
        },
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
    const { data: matching, isFetching: matchFetching } = useQuery({
        queryKey: ["matching", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/advisor/match/${studentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
            const data = await res.json();
            if (!res.ok) {
                // 409 = compte déjà existant
                if (res.status === 409) throw new Error(data.message);
                throw new Error(data.message || "Erreur lors de la conversion");
            }
            return data;
        },
        onSuccess: (data) => {
            toast.success(`✅ Compte élève créé ! Email temporaire : ${data.studentEmail}`);
            qc.invalidateQueries({ queryKey: ["advisorFamilies"] });
            setSelectedFamily(null);
        },
        onError: (err: Error) => toast.error(err.message),
    });

    // ──────────────────────────────────────────────────────────────────────
    // Filtre (recherche + onglets)
    // ──────────────────────────────────────────────────────────────────────
    const filteredFamilies = (Array.isArray(families) ? families : []).filter((f: any) => {
        const pName = (f.parentName || f.parent || "").toLowerCase();
        const cName = (f.childName || f.child || "").toLowerCase();
        const term = searchTerm.trim().toLowerCase();
        if (term && !pName.includes(term) && !cName.includes(term)) return false;

        const fp = isProspect(f);
        if (filterTab === "prospects" && !fp) return false;
        if (filterTab === "parents" && fp) return false;
        if (filterTab === "a-qualifier" && !fp) return false;
        return true;
    });

    const stats = useMemo(() => {
        const list = Array.isArray(families) ? families : [];
        return {
            total: list.length,
            toQualify: list.filter((f: any) => isProspect(f)).length,
            activeFollowups: list.filter((f: any) => !isProspect(f) && f.status === "suivi actif").length,
        };
    }, [families]);

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#0F9B8E] w-10 h-10" />
                <p className="text-gray-400 text-sm mt-4">Chargement des familles...</p>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4 md:p-8">
                <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between text-sm text-red-700">
                    <span>Impossible de charger les familles. Service temporairement indisponible.</span>
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
        !!selectedFamily.nextRdv && selectedFamily.nextRdv !== "—",
        !!(diagnostic as any)?.id,
        !!(activePlan as any)?.id,
        !prospect && !!selectedFamily.teacherName && !["—", "Non assigné"].includes(selectedFamily.teacherName),
    ] : [false, false, false, false, false];
    const currentStepIdx = stepDone.findIndex(d => !d);
    const activeStepIdx = currentStepIdx === -1 ? STEPS.length - 1 : currentStepIdx;

    const STATUS_LABEL: Record<string, string> = {
        "nouveau": "Nouveau",
        "matching": "Matching",
        "bilan planifié": "Bilan planifié",
        "suivi actif": "Suivi actif",
    };

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-[28px] font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>Suivi des familles</h1>
                <p className="text-gray-500 text-sm mt-1">Gérez les relations parents-élèves et les affectations de tuteurs.</p>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                {/* Colonne gauche : stats + liste */}
                <div className="xl:col-span-8 flex flex-col gap-5">
                    {/* Cartes statistiques */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard icon={Users} value={stats.total} label="Familles" desc="Total des familles enregistrées" bg="#0D2D5A" />
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
                                    placeholder="Rechercher un parent, un élève ou une famille..."
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
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/60 text-left">
                                        <th className="px-6 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            <span className="inline-flex items-center gap-1">Famille / Contact <ArrowUpDown className="w-3 h-3" /></span>
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            <span className="inline-flex items-center gap-1">Lien avec l'élève <ArrowUpDown className="w-3 h-3" /></span>
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">Tuteur assigné</th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide">
                                            <span className="inline-flex items-center gap-1">Statut <ArrowUpDown className="w-3 h-3" /></span>
                                        </th>
                                        <th className="px-4 py-3 font-bold text-gray-400 text-[11px] uppercase tracking-wide text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredFamilies.map((f: any) => {
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
                                                <td className="px-6 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-xs font-bold text-[#0D2D5A] shrink-0">
                                                            {(f.parentName || f.parent || "?").charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-bold text-[#0D2D5A] truncate">{f.parentName || f.parent}</span>
                                                                {fp ? (
                                                                    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[9px] px-1.5 rounded-md uppercase tracking-wide font-bold">Prospect</Badge>
                                                                ) : (
                                                                    <Badge variant="outline" className="border-gray-200 text-gray-400 font-bold text-[9px] px-1.5 rounded-md uppercase tracking-wide">Parent</Badge>
                                                                )}
                                                            </div>
                                                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                                                <MessageCircle className="w-3 h-3" /> {f.parentEmail || f.email || "—"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                        <Users className="w-3.5 h-3.5 text-gray-300" /> {f.childName || f.child || "—"}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">Niveau : {f.level || "—"}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                                                        <UserCircle2 className="w-3.5 h-3.5 text-gray-300" />
                                                        {fp ? "Pas encore assigné" : (f.teacherName || f.teacher || "Non assigné")}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 mt-0.5">{fp ? "—" : "Tuteur"}</div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-bold text-[#0D2D5A]">
                                                        {fp ? "À qualifier" : (STATUS_LABEL[f.status] || f.status || "—")}
                                                    </span>
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
                                    <p className="text-sm text-gray-400 italic">Aucune famille ne correspond à votre recherche.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Colonne droite : fiche détaillée */}
                <div className="xl:col-span-4">
                    {selectedFamily ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 animate-in slide-in-from-right-4 duration-300">
                            {/* Header fiche */}
                            <div className="p-5 border-b border-gray-50 flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={cn(
                                        "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0",
                                        prospect ? "bg-[#F5A623]" : "bg-[#0D2D5A]"
                                    )}>
                                        {(selectedFamily.parentName || selectedFamily.parent || "?").charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-sm font-bold text-[#0D2D5A] uppercase truncate">
                                            {selectedFamily.parentName || selectedFamily.parent} & {selectedFamily.childName || selectedFamily.child}
                                        </h2>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {selectedFamily.level || "Niveau non défini"}{selectedFamily.subject ? ` · ${selectedFamily.subject}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <span className={cn(
                                    "shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide",
                                    prospect ? "bg-amber-100 text-amber-700" : "bg-[#0F9B8E]/10 text-[#0F9B8E]"
                                )}>
                                    {prospect && <AlertTriangle className="w-3 h-3" />}
                                    {prospect ? "Prospect" : "Parent"}
                                    <ChevronDown className="w-3 h-3" />
                                </span>
                            </div>

                            {/* Infos rapides : élève / tuteur / date */}
                            <div className="grid grid-cols-3 divide-x divide-gray-50 border-b border-gray-50">
                                <div className="p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Élève · {selectedFamily.level ? selectedFamily.level.match(/\d/) ? "" : "" : ""}</p>
                                    <p className="text-xs font-bold text-[#0D2D5A] mt-0.5 truncate">{selectedFamily.childName || selectedFamily.child || "—"}</p>
                                </div>
                                <div className="p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Tuteur assigné</p>
                                    <p className="text-xs font-bold text-[#0D2D5A] mt-0.5 truncate">{prospect ? "—" : (selectedFamily.teacherName || selectedFamily.teacher || "—")}</p>
                                </div>
                                <div className="p-3 text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">Date de la demande</p>
                                    <p className="text-xs font-bold text-[#0D2D5A] mt-0.5 truncate">{selectedFamily.requestDate || "—"}</p>
                                </div>
                            </div>

                            {/* Stepper de progression */}
                            <div className="px-5 pt-5">
                                <div className="flex items-center">
                                    {STEPS.map((s, i) => (
                                        <div key={s.key} className="flex-1 flex items-center last:flex-none">
                                            <div className="flex flex-col items-center gap-1.5">
                                                <div className={cn(
                                                    "w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                                                    stepDone[i] ? "bg-[#0F9B8E] text-white" :
                                                    i === activeStepIdx ? "bg-[#0D2D5A] text-white" :
                                                    "bg-gray-100 text-gray-400"
                                                )}>
                                                    {stepDone[i] ? <Check className="w-3.5 h-3.5" /> : i + 1}
                                                </div>
                                                <span className="text-[9px] font-bold text-gray-400 text-center leading-tight max-w-[56px]">{s.label}</span>
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
                                    <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 flex gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-black text-amber-700">Étape {activeStepIdx + 1} · {STEPS[activeStepIdx].label}</p>
                                            <p className="text-[11px] text-amber-600 leading-relaxed mt-0.5">
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
                                                        Observations ({(advisorNotes as any[]).length})
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
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {(advisorNotes as any[]).map((note: any) => {
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
                                                                    className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 text-[8px] font-black transition-opacity"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        );
                                                    })}
                                                    {(advisorNotes as any[]).length === 0 && !showNoteForm && (
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
                                                <p className="text-[9px] text-amber-700 font-semibold">Diagnostic prospect — sera migré vers le compte élève lors de la conversion.</p>
                                            </div>
                                        )}
                                        {diagnostic && (diagnostic as any).id ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                        Diagnostic enregistré · {new Date((diagnostic as any).created_at).toLocaleDateString("fr-FR")}
                                                    </p>
                                                </div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest pt-1">Niveau des matières</p>
                                                {Object.entries((diagnostic as any).scores || {}).map(([subj, score]: any) => (
                                                    <div key={subj}>
                                                        <div className="flex justify-between mb-0.5">
                                                            <span className="text-[11px] font-bold text-[#0D2D5A]">{subj}</span>
                                                            <span className="text-[11px] font-black text-[#0F9B8E]">{score}/10</span>
                                                        </div>
                                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${score >= 7 ? "bg-emerald-500" : score >= 4 ? "bg-[#F5A623]" : "bg-red-400"}`}
                                                                style={{ width: `${score * 10}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                                {(diagnostic as any).strengths && (
                                                    <div className="mt-2 p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                                        <p className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Points forts</p>
                                                        <p className="text-[10px] text-emerald-800">{(diagnostic as any).strengths}</p>
                                                    </div>
                                                )}
                                                {(diagnostic as any).weaknesses && (
                                                    <div className="p-2 bg-red-50 rounded-lg border border-red-100">
                                                        <p className="text-[8px] font-black text-red-500 uppercase tracking-widest mb-0.5">Points à renforcer</p>
                                                        <p className="text-[10px] text-red-800">{(diagnostic as any).weaknesses}</p>
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
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Niveau des matières</p>
                                                {SUBJECTS_DIAG.map(subj => (
                                                    <div key={subj}>
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="text-xs font-bold text-[#0D2D5A]">{subj}</span>
                                                            <span className="text-xs font-black text-[#0F9B8E]">{diagScores[subj] ?? 5}/10</span>
                                                        </div>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={10}
                                                            value={diagScores[subj] ?? 5}
                                                            onChange={e => setDiagScores(prev => ({ ...prev, [subj]: +e.target.value }))}
                                                            className="w-full accent-[#0F9B8E]"
                                                        />
                                                    </div>
                                                ))}
                                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest pt-1">Points forts et à renforcer</p>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="relative">
                                                        <textarea
                                                            value={diagStrengths}
                                                            onChange={e => setDiagStrengths(e.target.value.slice(0, 200))}
                                                            rows={3}
                                                            maxLength={200}
                                                            placeholder="Ex : bonne compréhension, rigueur..."
                                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[10px] outline-none focus:border-emerald-400 resize-none"
                                                        />
                                                        <span className="absolute bottom-1.5 right-2 text-[8px] text-gray-300">{diagStrengths.length}/200</span>
                                                    </div>
                                                    <div className="relative">
                                                        <textarea
                                                            value={diagWeaknesses}
                                                            onChange={e => setDiagWeaknesses(e.target.value.slice(0, 200))}
                                                            rows={3}
                                                            maxLength={200}
                                                            placeholder="Ex : exercices, expression écrite..."
                                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-[10px] outline-none focus:border-red-400 resize-none"
                                                        />
                                                        <span className="absolute bottom-1.5 right-2 text-[8px] text-gray-300">{diagWeaknesses.length}/200</span>
                                                    </div>
                                                </div>
                                                <button
                                                    disabled={diagMutation.isPending}
                                                    onClick={() => diagMutation.mutate()}
                                                    className="w-full h-10 bg-[#0D2D5A] text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    {diagMutation.isPending ? "..." : "Enregistrer le diagnostic"}
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
                                                <p className="text-[9px] text-amber-700 font-semibold">Plan prospect — sera migré vers le compte élève lors de la conversion.</p>
                                            </div>
                                        )}
                                        {activePlan && (activePlan as any).id ? (
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
                                                                {SUBJECTS_DIAG.map(s => (
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
                                            onClick={() => navigate("/advisor/messages")}
                                            className="w-full bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white font-bold h-11 rounded-xl shadow-sm gap-2"
                                        >
                                            <MessageCircle className="w-4 h-4" /> Contacter la famille
                                        </Button>
                                    )}
                                    <Button variant="outline" className="w-full border-gray-200 text-gray-500 font-bold h-11 rounded-xl hover:bg-gray-50 gap-2">
                                        <FileText className="w-4 h-4" /> Bilan Conseil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center h-full min-h-[500px] flex flex-col items-center justify-center space-y-4">
                            <Users className="w-12 h-12 text-gray-100" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-300 italic">Focus Famille</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[220px] mx-auto leading-relaxed text-center">
                                    Sélectionnez une famille pour accéder au dossier détaillé et aux affectations de tuteurs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
