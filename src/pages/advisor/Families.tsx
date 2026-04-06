import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Users, Search, Phone, Mail,
    TrendingUp, MessageCircle, FileText, Loader2, ChevronRight,
    SearchCheck, Briefcase, PlusCircle, AlertTriangle,
    ThumbsUp, Lightbulb, Eye, UserCircle2,
    ClipboardCheck, CalendarRange, ChevronDown, ChevronUp, Trash2
} from "lucide-react";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const API = import.meta.env.VITE_API_URL || "/api";
const NOTE_TYPES = [
    { value: "observation", label: "Observation", icon: Eye, color: "text-slate-500" },
    { value: "recommandation", label: "Recommandation", icon: Lightbulb, color: "text-[#1A6CC8]" },
    { value: "alerte", label: "Alerte", icon: AlertTriangle, color: "text-[#F5A623]" },
    { value: "positif", label: "Positif", icon: ThumbsUp, color: "text-emerald-600" },
];

export default function AdvisorFamilies() {
    const { user, token } = useAuth();
    const qc = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<any>(null);
    const [noteContent, setNoteContent] = useState("");
    const [noteType, setNoteType] = useState("observation");
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [activePanel, setActivePanel] = useState<"notes"|"diagnostic"|"plan">("notes");

    // Diagnostic form state
    const SUBJECTS_DIAG = ["Mathématiques","Français","Anglais","Physique","SVT","Histoire-Géo"];
    const [diagScores, setDiagScores] = useState<Record<string,number>>({});
    const [diagStrengths, setDiagStrengths] = useState("");
    const [diagWeaknesses, setDiagWeaknesses] = useState("");

    // Plan form state
    const [planTitle, setPlanTitle] = useState("");
    const [planStart, setPlanStart] = useState("");
    const [planWeeks, setPlanWeeks] = useState([{ objective: "", subjects: [] as string[], done: false }]);

    const { data: families = [], isLoading } = useQuery({
        queryKey: ["advisorFamilies"],
        queryFn: fetchAdvisorFamilies,
    });

    const studentId = selectedFamily?.studentId || selectedFamily?.childId;

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

    // Diagnostic query & mutation
    const { data: diagnostic } = useQuery({
        queryKey: ["diagnostic", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/diagnostic`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!studentId && !!token,
    });

    const diagMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/diagnostic`, {
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
            if (!res.ok) throw new Error();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["diagnostic", studentId] });
            setDiagScores({});
            setDiagStrengths("");
            setDiagWeaknesses("");
        }
    });

    // Plan query & mutation
    const { data: activePlan } = useQuery({
        queryKey: ["academicPlan", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/academic-plan`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.json();
        },
        enabled: !!studentId && !!token,
    });

    const planMutation = useMutation({
        mutationFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/academic-plan`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    studentName: selectedFamily?.childName,
                    createdBy: user?.id,
                    title: planTitle,
                    weeks: planWeeks,
                    startDate: planStart,
                })
            });
            if (!res.ok) throw new Error();
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["academicPlan", studentId] });
            setPlanTitle("");
            setPlanStart("");
            setPlanWeeks([{ objective: "", subjects: [], done: false }]);
        }
    });

    const filteredFamilies = (Array.isArray(families) ? families : []).filter((f: any) =>
        f.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.childName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#1A6CC8] w-10 h-10" />
                <p className="text-gray-400 text-sm mt-4">Chargement des familles...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Advisor Style */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Suivi des Familles</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez les relations parents-élèves et les affectations de tuteurs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#1A6CC8]" />
                        <span className="text-sm font-bold text-[#0D2D5A]">{families.length} Familles</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Liste des Familles */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un parent ou un élève..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {filteredFamilies.map((f: any) => (
                                <div
                                    key={f.id}
                                    onClick={() => setSelectedFamily(f)}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group",
                                        selectedFamily?.id === f.id ? "bg-blue-50/30 border-l-4 border-l-[#1A6CC8]" : ""
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-[#0D2D5A] shadow-inner group-hover:bg-white">
                                        {f.parentName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <span className="font-bold text-[#0D2D5A] text-sm">{f.parentName}</span>
                                            <Badge variant="outline" className="w-fit mx-auto md:mx-0 border-gray-100 text-gray-400 font-bold text-[8px] px-1.5 rounded-md uppercase tracking-widest">Parent</Badge>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-[11px] text-gray-400 font-medium">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Élève : {f.childName}</span>
                                            <span className="flex items-center gap-1 text-[#1A6CC8]"><Briefcase className="w-3 h-3" /> Tuteur : {f.teacherName || "Non assigné"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="hidden lg:block text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Dernier Bilan</p>
                                            <p className="text-xs font-bold text-[#0D2D5A]">{f.lastReportDate || "À planifier"}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#0D2D5A] group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredFamilies.length === 0 && (
                                <div className="px-6 py-16 text-center">
                                    <SearchCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 italic">Aucune famille ne correspond à votre recherche.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Focus Famille */}
                <div className="xl:col-span-4">
                    {selectedFamily ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-8 text-center border-b border-gray-50 bg-gray-50/30">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-[#0D2D5A] border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white mb-4">
                                    {selectedFamily.parentName?.charAt(0)}
                                </div>
                                <h2 className="text-lg font-bold text-[#0D2D5A]">{selectedFamily.parentName} & {selectedFamily.childName}</h2>
                                <p className="text-[10px] text-[#1A6CC8] font-bold uppercase tracking-[2px] mt-1">{selectedFamily.level || "Niveau non défini"}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Progression Académique</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Moyenne</p>
                                            <p className="text-sm font-bold text-[#0D2D5A]">{selectedFamily.average || "14.2"}/20</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assiduité</p>
                                            <p className="text-sm font-bold text-emerald-600">{selectedFamily.attendance || "100%"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tuteur Actuel</p>
                                    <div className="flex items-center gap-3 p-3 bg-[#0D2D5A]/5 rounded-xl border border-[#0D2D5A]/10">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#1A6CC8]">
                                            <UserCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#0D2D5A]">{selectedFamily.teacherName || "En attente d'affectation"}</p>
                                            <p className="text-[9px] text-gray-400 italic">Matière : {selectedFamily.subject || "Multi-disciplines"}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs navigation */}
                                <div className="flex border border-gray-100 rounded-xl overflow-hidden">
                                    {([
                                        { key: "notes", label: "Notes", icon: FileText },
                                        { key: "diagnostic", label: "Diagnostic", icon: ClipboardCheck },
                                        { key: "plan", label: "Plan", icon: CalendarRange },
                                    ] as const).map(({ key, label, icon: Icon }) => (
                                        <button
                                            key={key}
                                            onClick={() => setActivePanel(key)}
                                            className={`flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-black uppercase tracking-widest transition-colors ${
                                                activePanel === key ? "bg-[#0D2D5A] text-white" : "text-gray-400 hover:bg-gray-50"
                                            }`}
                                        >
                                            <Icon className="w-3 h-3" /> {label}
                                        </button>
                                    ))}
                                </div>

                                {/* Panel Notes */}
                                {activePanel === "notes" && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">
                                                Observations ({(advisorNotes as any[]).length})
                                            </p>
                                            <button
                                                onClick={() => setShowNoteForm(!showNoteForm)}
                                                className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest flex items-center gap-1"
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
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-[11px] outline-none focus:border-[#1A6CC8] resize-none"
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
                                    </div>
                                )}

                                {/* Panel Diagnostic */}
                                {activePanel === "diagnostic" && (
                                    <div className="space-y-3">
                                        {diagnostic && (diagnostic as any).id ? (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                                                    Dernier diagnostic — {new Date((diagnostic as any).created_at).toLocaleDateString("fr-FR")}
                                                </p>
                                                {Object.entries((diagnostic as any).scores || {}).map(([subj, score]: any) => (
                                                    <div key={subj}>
                                                        <div className="flex justify-between mb-0.5">
                                                            <span className="text-[10px] font-bold text-[#0D2D5A]">{subj}</span>
                                                            <span className="text-[10px] font-black text-[#1A6CC8]">{score}/10</span>
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
                                                <button
                                                    onClick={() => qc.setQueryData(["diagnostic", studentId], null)}
                                                    className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest"
                                                >
                                                    + Nouveau diagnostic
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Notes par matière (0–10)</p>
                                                {SUBJECTS_DIAG.map(subj => (
                                                    <div key={subj} className="flex items-center gap-2">
                                                        <span className="text-[10px] font-bold text-[#0D2D5A] w-24 flex-shrink-0">{subj}</span>
                                                        <input
                                                            type="range"
                                                            min={0}
                                                            max={10}
                                                            value={diagScores[subj] ?? 5}
                                                            onChange={e => setDiagScores(prev => ({ ...prev, [subj]: +e.target.value }))}
                                                            className="flex-1 accent-[#1A6CC8]"
                                                        />
                                                        <span className="text-[10px] font-black text-[#1A6CC8] w-5 text-right">{diagScores[subj] ?? 5}</span>
                                                    </div>
                                                ))}
                                                <textarea
                                                    value={diagStrengths}
                                                    onChange={e => setDiagStrengths(e.target.value)}
                                                    rows={2}
                                                    placeholder="Points forts..."
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-emerald-400 resize-none"
                                                />
                                                <textarea
                                                    value={diagWeaknesses}
                                                    onChange={e => setDiagWeaknesses(e.target.value)}
                                                    rows={2}
                                                    placeholder="Points à renforcer..."
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[10px] outline-none focus:border-red-400 resize-none"
                                                />
                                                <button
                                                    disabled={diagMutation.isPending}
                                                    onClick={() => diagMutation.mutate()}
                                                    className="w-full h-8 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-lg disabled:opacity-50"
                                                >
                                                    {diagMutation.isPending ? "..." : "Enregistrer le diagnostic"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Panel Plan Pédagogique */}
                                {activePanel === "plan" && (
                                    <div className="space-y-3">
                                        {activePlan && (activePlan as any).id ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-[11px] font-black text-[#0D2D5A]">{(activePlan as any).title}</p>
                                                    <span className="text-[8px] font-bold text-[#1A6CC8] bg-blue-50 px-1.5 py-0.5 rounded">Actif</span>
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
                                                                            <span key={s} className="text-[8px] bg-[#1A6CC8]/10 text-[#1A6CC8] px-1 rounded font-bold">{s}</span>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <button
                                                    onClick={() => qc.setQueryData(["academicPlan", studentId], null)}
                                                    className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest"
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
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[#1A6CC8]"
                                                />
                                                <input
                                                    type="date"
                                                    value={planStart}
                                                    onChange={e => setPlanStart(e.target.value)}
                                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-[#1A6CC8]"
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
                                                                className="w-full border border-gray-200 rounded px-2 py-1 text-[10px] outline-none focus:border-[#1A6CC8]"
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
                                                    className="w-full h-7 border border-dashed border-[#1A6CC8]/40 text-[#1A6CC8] text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-[#1A6CC8]/5 transition-colors flex items-center justify-center gap-1"
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

                                <div className="pt-2 space-y-2">
                                    <Button className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white font-bold h-11 rounded-xl shadow-sm gap-2">
                                        <MessageCircle className="w-4 h-4" /> Contacter la famille
                                    </Button>
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
