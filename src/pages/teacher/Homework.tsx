import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText, Search, Plus, Clock, CheckCircle2, Calendar,
    Loader2, BookOpen, Users, AlertCircle, X, Send,
    Filter, ChevronRight, Info, GraduationCap, LayoutPanelLeft,
    Layers, ArrowUpRight, BarChart3, CalendarDays
} from "lucide-react";
import { fetchHomework, fetchStudentsByTeacher } from "@/api/backoffice";
import { FilePreview } from "@/components/ui/FilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const STATUS_COLORS: Record<string, string> = {
    "rendu": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "à faire": "bg-blue-50 text-blue-600 border-blue-200",
    "en retard": "bg-red-50 text-red-600 border-red-100",
    "corrigé": "bg-green-50 text-green-600 border-green-100",
};

const SUBJECTS = ["Mathématiques", "Français", "Anglais", "Histoire-Géo", "Sciences", "Physique", "Informatique", "Autre"];

const parseHomeworkDate = (dateStr: string) => {
    if (!dateStr) return { day: "—", month: "—", full: "—" };
    if (dateStr.includes("/")) {
        const [day, m] = dateStr.split("/");
        const months: Record<string, string> = {
            "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Juin",
            "07": "Juil", "08": "Août", "09": "Sept", "10": "Oct", "11": "Nov", "12": "Déc"
        };
        return {
            day,
            month: months[m] || m,
            full: dateStr
        };
    }
    try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            const day = String(d.getDate()).padStart(2, "0");
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const months: Record<string, string> = {
                "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr", "05": "Mai", "06": "Juin",
                "07": "Juil", "08": "Août", "09": "Sept", "10": "Oct", "11": "Nov", "12": "Déc"
            };
            return {
                day,
                month: months[m] || m,
                full: `${day}/${m}`
            };
        }
    } catch {}
    return { day: "—", month: "—", full: dateStr };
};

export default function TeacherHomework() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedbackText, setFeedbackText] = useState("");
    const [isCorrecting, setIsCorrecting] = useState(false);

    // Formulaire
    const [formStudentId, setFormStudentId] = useState("");
    const [formTitle, setFormTitle] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formDue, setFormDue] = useState("");
    const [formSubject, setFormSubject] = useState(SUBJECTS[0]);

    const { data: homework = [], isLoading } = useQuery({
        queryKey: ["teacherHomework", user?.id],
        queryFn: () => fetchHomework("teacher", user!.id),
        enabled: !!user?.id,
    });

    const { data: students = [] } = useQuery({
        queryKey: ["teacherStudents", user?.id],
        queryFn: () => fetchStudentsByTeacher(user!.id),
        enabled: !!user?.id,
    });

    const filteredHomework = useMemo(() => {
        let list = Array.isArray(homework) ? homework : [];
        if (statusFilter !== "all") {
            list = list.filter((h: any) => h.status === statusFilter);
        }
        return list.filter((h: any) =>
            h.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.subject?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [homework, searchTerm, statusFilter]);

    // Stats
    const stats = useMemo(() => {
        const list = Array.isArray(homework) ? homework : [];
        return {
            total: list.length,
            aFaire: list.filter((h: any) => h.status === "à faire").length,
            rendu: list.filter((h: any) => h.status === "rendu").length,
            enRetard: list.filter((h: any) => h.status === "en retard").length,
        };
    }, [homework]);

    const handleSubmit = async () => {
        if (!formStudentId || !formTitle.trim() || !formDue || !formSubject) {
            toast.error("Veuillez remplir tous les champs obligatoires.");
            return;
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("c4s_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/homework`, {
                method: "POST",
                headers,
                body: JSON.stringify({
                    teacherId: user!.id,
                    studentId: formStudentId,
                    title: formTitle,
                    description: formDesc,
                    dueDate: formDue,
                    subject: formSubject,
                }),
            });
            if (!res.ok) throw new Error("Échec");
            toast.success("Devoir créé avec succès 📚");
            queryClient.invalidateQueries({ queryKey: ["teacherHomework"] });
            setShowForm(false);
            setFormTitle(""); setFormDesc(""); setFormDue(""); setFormStudentId("");
        } catch {
            toast.error("Impossible de créer le devoir.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkDone = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const token = localStorage.getItem("c4s_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            await fetch(`${API_BASE}/homework/${id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status: "rendu" }),
            });
            toast.success("Devoir marqué comme terminé ✅");
            queryClient.invalidateQueries({ queryKey: ["teacherHomework"] });
            if (selectedHomework?.id === id) {
                setSelectedHomework({ ...selectedHomework, status: "rendu" });
            }
        } catch {
            toast.error("Erreur lors de la mise à jour.");
        }
    };

    const handleSelectHomework = (hw: any) => {
        setSelectedHomework(hw);
        setFeedbackText(hw?.feedback || "");
    };

    const handleCorrectHomework = async (id: string) => {
        if (!feedbackText.trim()) {
            toast.error("Veuillez saisir un commentaire de correction.");
            return;
        }
        setIsCorrecting(true);
        try {
            const token = localStorage.getItem("c4s_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/homework/${id}`, {
                method: "PATCH",
                headers,
                body: JSON.stringify({ status: "corrigé", feedback: feedbackText }),
            });
            if (!res.ok) throw new Error("Échec");
            toast.success("Devoir corrigé et envoyé à l'élève ! 🎓");
            queryClient.invalidateQueries({ queryKey: ["teacherHomework"] });
            setSelectedHomework(null);
            setFeedbackText("");
        } catch {
            toast.error("Erreur lors de la correction.");
        } finally {
            setIsCorrecting(false);
        }
    };

    const renderStatusBadge = (status: string) => {
        const label = status === "à faire" ? "À faire" : status === "rendu" ? "Rendu" : status === "corrigé" ? "Corrigé" : "En retard";
        const colorStyle = STATUS_COLORS[status?.toLowerCase()] || "bg-gray-50 text-gray-400 border-gray-100";
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colorStyle}`}>
                {label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
                <p className="text-gray-400 text-sm">Chargement des devoirs...</p>
            </div>
        );
    }

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Gestion des Devoirs</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Assignez et suivez le travail personnel de vos élèves.
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white gap-1.5 rounded-none shadow-none h-8 font-black text-[10px] uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5" /> Nouveau Devoir
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                    { label: "Total Assignés", value: stats.total, color: "text-[#1A6CC8]", bg: "bg-blue-50/30" },
                    { label: "À faire", value: stats.aFaire, color: "text-[#1A6CC8]", bg: "bg-blue-50/50" },
                    { label: "Rendus", value: stats.rendu, color: "text-[#0D2D5A]", bg: "bg-slate-50/50" },
                    { label: "En retard", value: stats.enRetard, color: "text-red-600", bg: "bg-red-50/30" },
                ].map((stat, i) => (
                    <div key={i} className="border border-slate-200 bg-white p-3 flex items-center justify-between">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                            <p className={cn("text-lg font-black tracking-tight", stat.color)}>{stat.value}</p>
                        </div>
                        <div className={cn("p-2", stat.bg)}>
                            {i === 0 ? <Layers className={cn("w-4 h-4", stat.color)} /> : i === 1 ? <Clock className={cn("w-4 h-4", stat.color)} /> : i === 2 ? <CheckCircle2 className={cn("w-4 h-4", stat.color)} /> : <AlertCircle className={cn("w-4 h-4", stat.color)} />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Liste des devoirs */}
            <div className="border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Rechercher un devoir, un élève..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-9 pr-4 py-1.5 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                        />
                    </div>
                    <div className="hidden sm:flex gap-1">
                        {["all", "à faire", "rendu", "en retard"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-2 py-1 text-[9px] font-black uppercase tracking-widest transition-all",
                                    statusFilter === s ? "bg-[#1A6CC8] text-white" : "text-slate-400 hover:bg-slate-100"
                                )}
                            >
                                {s === "all" ? "Tous" : s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-slate-100">
                    {filteredHomework.map((h: any) => (
                        <div key={h.id} onClick={() => handleSelectHomework(h)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                            <div className="w-10 text-center flex-shrink-0">
                                <div className="text-[9px] font-black text-[#1A6CC8] uppercase">Échéance</div>
                                <div className="text-base font-black text-[#0D2D5A]">{parseHomeworkDate(h.dueDate).day}</div>
                                <div className="text-[9px] text-slate-400 font-black uppercase">{parseHomeworkDate(h.dueDate).month}</div>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-slate-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-[#0D2D5A] text-[10px] uppercase tracking-tight flex items-center gap-2">
                                    {h.title}
                                    <span className="text-[9px] font-bold text-[#1A6CC8] normal-case">{h.subject}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-bold uppercase">
                                    <div className="w-4 h-4 bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-500">
                                        {h.studentName?.[0] || 'S'}
                                    </div>
                                    <span>{h.studentName || "N/A"}</span>
                                    {h.sessionId && (
                                        <span className="flex items-center gap-1 text-[9px] text-[#1A6CC8] font-black uppercase">
                                            <ArrowUpRight className="w-3 h-3" /> Lié au cours
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {renderStatusBadge(h.status)}
                                {h.status === "à faire" && (
                                    <Button
                                        size="sm"
                                        onClick={(e) => handleMarkDone(h.id, e)}
                                        className="h-6 text-[9px] bg-emerald-500 hover:bg-emerald-600 gap-1 px-2 rounded-none shadow-none text-white font-black uppercase"
                                    >
                                        <CheckCircle2 className="w-3 h-3" /> Rendu
                                    </Button>
                                )}
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                        </div>
                    ))}
                    {filteredHomework.length === 0 && (
                        <div className="px-3 py-10 text-center">
                            <BookOpen className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Aucun devoir trouvé correspondant à vos critères.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Nouveau Devoir - Style Schedule.tsx */}
            <Dialog open={showForm} onOpenChange={setShowForm}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A]">
                            <BookOpen className="w-5 h-5 text-[#1A6CC8]" /> Assigner un Devoir
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Créez un travail personnel pour vos élèves.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#0D2D5A]">Élève</label>
                                <select
                                    value={formStudentId}
                                    onChange={(e) => setFormStudentId(e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-gray-50/50"
                                >
                                    <option value="">Sélectionner...</option>
                                    {(Array.isArray(students) ? students : []).map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-[#0D2D5A]">Matière</label>
                                <select
                                    value={formSubject}
                                    onChange={(e) => setFormSubject(e.target.value)}
                                    className="w-full text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-gray-50/50"
                                >
                                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0D2D5A]">Titre</label>
                            <input
                                type="text"
                                value={formTitle}
                                onChange={(e) => setFormTitle(e.target.value)}
                                placeholder="Ex: Exercices sur les fractions"
                                className="w-full text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-gray-50/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0D2D5A]">Description</label>
                            <textarea
                                value={formDesc}
                                onChange={(e) => setFormDesc(e.target.value)}
                                placeholder="Instructions détaillées..."
                                rows={3}
                                className="w-full text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 resize-none bg-gray-50/50"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-[#0D2D5A]">Date limite</label>
                            <input
                                type="date"
                                value={formDue}
                                onChange={(e) => setFormDue(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                className="w-full text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-gray-50/50"
                            />
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button variant="outline" onClick={() => setShowForm(false)} disabled={isSubmitting} className="flex-1 border-gray-200">
                            Annuler
                        </Button>
                        <Button onClick={handleSubmit} disabled={isSubmitting || !formTitle.trim()} className="flex-1 bg-[#1A6CC8] hover:bg-blue-700 gap-2">
                           <Send className="w-4 h-4" /> {isSubmitting ? "Envoi..." : "Assigner"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Détail Devoir - Style Schedule.tsx */}
            <Dialog open={!!selectedHomework} onOpenChange={(open) => !open && handleSelectHomework(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A]">
                            <FileText className="w-5 h-5 text-[#1A6CC8]" /> Détails du Devoir
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Suivi du travail personnel de <strong>{selectedHomework?.studentName}</strong>.
                        </DialogDescription>
                    </DialogHeader>

                    {selectedHomework && (
                        <div className="mt-4 space-y-6">
                            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold text-[#0D2D5A]">{selectedHomework.title}</h3>
                                        <p className="text-xs text-brand-blue font-medium">{selectedHomework.subject}</p>
                                    </div>
                                    {renderStatusBadge(selectedHomework.status)}
                                </div>
                                <div className="text-xs text-gray-600 leading-relaxed italic border-t border-gray-100 pt-3">
                                    "{selectedHomework.description || "Aucune consigne spécifique."}"
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Élève</p>
                                    <p className="text-xs font-bold text-[#0D2D5A]">{selectedHomework.studentName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date limite</p>
                                    <p className="text-xs font-bold text-red-500">{parseHomeworkDate(selectedHomework.dueDate).full}</p>
                                </div>
                            </div>

                            {/* Fichier Rendu par l'Élève */}
                            {selectedHomework.submissionUrl ? (
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Travail Rendu</p>
                                    <FilePreview url={selectedHomework.submissionUrl} label="Fichier de l'élève" />
                                </div>
                            ) : selectedHomework.status === "rendu" && (
                                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-center gap-2 text-amber-600">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span className="text-[10px] font-bold uppercase">Aucun fichier joint par l'élève.</span>
                                </div>
                            )}

                            {/* Espace Correction pour l'enseignant */}
                            {selectedHomework.status === "rendu" && (
                                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
                                    <label className="text-xs font-bold text-[#0D2D5A] flex items-center gap-1">
                                        <GraduationCap className="w-4 h-4 text-[#1A6CC8]" /> Commentaire de correction
                                    </label>
                                    <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Saisissez vos remarques, corrections ou conseils pour l'élève..."
                                        rows={3}
                                        className="w-full text-xs border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 resize-none bg-gray-50/50 animate-in fade-in duration-300"
                                    />
                                    <Button
                                        onClick={() => handleCorrectHomework(selectedHomework.id)}
                                        disabled={isCorrecting || !feedbackText.trim()}
                                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold uppercase h-9 rounded-xl transition-all"
                                    >
                                        {isCorrecting ? "Envoi..." : "Valider la correction"}
                                    </Button>
                                </div>
                            )}

                            {/* Correction déjà envoyée */}
                            {selectedHomework.status === "corrigé" && (
                                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Correction Envoyée
                                    </p>
                                    <p className="text-xs font-medium text-gray-600 italic">
                                        "{selectedHomework.feedback || "Félicitations pour ton travail !"}"
                                    </p>
                                </div>
                            )}

                            {selectedHomework.sessionId && (
                                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                                    <ArrowUpRight className="w-4 h-4 text-[#1A6CC8]" />
                                    <span className="text-[10px] font-semibold text-[#1A6CC8]">Ce devoir a été créé lors d'une séance en direct.</span>
                                </div>
                            )}

                            <div className="mt-6 flex gap-3">
                                <Button onClick={() => handleSelectHomework(null)} className="flex-1 bg-gray-100 text-[#0D2D5A] hover:bg-gray-200">Fermer</Button>
                                {selectedHomework.status === "à faire" && (
                                    <Button 
                                        onClick={(e) => handleMarkDone(selectedHomework.id, e)} 
                                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white gap-2"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Marquer rendu
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
