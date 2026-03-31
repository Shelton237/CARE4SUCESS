import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    FileText, Search, Plus, Clock, CheckCircle2, Calendar,
    Loader2, BookOpen, Users, AlertCircle, X, Send,
    Filter, ChevronRight, Info, GraduationCap, LayoutPanelLeft,
    Layers, ArrowUpRight, BarChart3, CalendarDays
} from "lucide-react";
import { fetchHomework, fetchStudentsByTeacher } from "@/api/backoffice";
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
};

const SUBJECTS = ["Mathématiques", "Français", "Anglais", "Histoire-Géo", "Sciences", "Physique", "Informatique", "Autre"];

export default function TeacherHomework() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showForm, setShowForm] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState<any | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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
            const token = sessionStorage.getItem("c4s_token");
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
            const token = sessionStorage.getItem("c4s_token");
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

    const renderStatusBadge = (status: string) => {
        const label = status === "à faire" ? "À faire" : status === "rendu" ? "Rendu" : "En retard";
        const colorStyle = STATUS_COLORS[status?.toLowerCase()] || "bg-gray-50 text-gray-400 border-gray-100";
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${colorStyle}`}>
                {label}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
                <p className="text-gray-400 text-sm">Chargement des devoirs...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header - Aligné sur Schedule.tsx */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Gestion des Devoirs</h1>
                    <p className="text-gray-500 text-sm mt-1">Assignez et suivez le travail personnel de vos élèves.</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => setShowForm(true)} className="bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white gap-2 shadow-sm">
                        <Plus className="w-4 h-4" /> Nouveau Devoir
                    </Button>
                </div>
            </div>

            {/* Stats Cards - Style Bento Sobre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Assignés", value: stats.total, color: "text-[#1A6CC8]", bg: "bg-blue-50/30", border: "border-blue-100" },
                    { label: "À faire", value: stats.aFaire, color: "text-blue-600", bg: "bg-blue-50/50", border: "border-blue-200" },
                    { label: "Rendus / À corriger", value: stats.rendu, color: "text-emerald-600", bg: "bg-emerald-50/50", border: "border-emerald-200" },
                    { label: "En retard", value: stats.enRetard, color: "text-red-600", bg: "bg-red-50/50", border: "border-red-200" },
                ].map((stat, i) => (
                    <div key={i} className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between`}>
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-2">{stat.label}</p>
                            <p className={cn("text-3xl font-bold", stat.color)}>{stat.value}</p>
                        </div>
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg, stat.border, "border")}>
                            {i === 0 ? <Layers className={stat.color} /> : i === 1 ? <Clock className={stat.color} /> : i === 2 ? <CheckCircle2 className={stat.color} /> : <AlertCircle className={stat.color} />}
                        </div>
                    </div>
                ))}
            </div>

            {/* Liste des devoirs - Style "Toutes les séances" */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Rechercher un devoir, un élève..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-xs outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 transition-all"
                        />
                    </div>
                    <div className="hidden sm:flex gap-1">
                        {["all", "à faire", "rendu", "en retard"].map((s) => (
                            <button
                                key={s}
                                onClick={() => setStatusFilter(s)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                                    statusFilter === s ? "bg-[#1A6CC8] text-white shadow-sm" : "text-gray-400 hover:bg-gray-100"
                                )}
                            >
                                {s === "all" ? "Tous" : s}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filteredHomework.map((h: any) => (
                        <div key={h.id} onClick={() => setSelectedHomework(h)} className="flex flex-col sm:flex-row items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group">
                            <div className="w-12 text-center flex-shrink-0">
                                <div className="text-[10px] font-bold text-[#1A6CC8]">ECHEANCE</div>
                                <div className="text-lg font-bold text-[#0D2D5A]">{new Date(h.dueDate).getDate()}</div>
                                <div className="text-[10px] text-gray-400 font-medium uppercase">{new Date(h.dueDate).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                            </div>
                            <div className="hidden sm:block w-px h-10 bg-gray-100" />
                            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                                <div className="font-semibold text-[#0D2D5A] text-sm flex items-center justify-center sm:justify-start gap-2">
                                    {h.title}
                                    <Badge variant="outline" className="text-[9px] font-normal text-gray-400 border-gray-100 py-0 px-1.5">{h.subject}</Badge>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 text-xs text-gray-400">
                                    <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-500">
                                        {h.studentName?.[0] || 'S'}
                                    </div>
                                    <span>{h.studentName || "N/A"}</span>
                                    {h.sessionId && (
                                        <span className="flex items-center gap-1 text-[10px] text-blue-400 font-medium ml-2">
                                            <ArrowUpRight className="w-3 h-3" /> Lié au cours
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center sm:text-right flex flex-col sm:items-end gap-2 mt-2 sm:mt-0">
                                <div className="flex items-center justify-center sm:justify-end gap-3">
                                    {renderStatusBadge(h.status)}
                                    {h.status === "à faire" && (
                                        <Button 
                                            size="sm" 
                                            onClick={(e) => handleMarkDone(h.id, e)} 
                                            className="h-6 text-[10px] bg-emerald-500 hover:bg-emerald-600 gap-1 px-2 shadow-sm text-white"
                                        >
                                            <CheckCircle2 className="w-3 h-3" /> Rendu
                                        </Button>
                                    )}
                                    <div className="w-6 h-6 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#0D2D5A] group-hover:text-white transition-all">
                                        <ChevronRight className="w-3.5 h-3.5" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredHomework.length === 0 && (
                        <div className="px-6 py-12 text-center">
                            <BookOpen className="w-8 h-8 text-gray-100 mx-auto mb-3" />
                            <p className="text-xs text-gray-400 italic">Aucun devoir trouvé correspondant à vos critères.</p>
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
                        <div className="grid grid-cols-2 gap-4">
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
            <Dialog open={!!selectedHomework} onOpenChange={(open) => !open && setSelectedHomework(null)}>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Élève</p>
                                    <p className="text-xs font-bold text-[#0D2D5A]">{selectedHomework.studentName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date limite</p>
                                    <p className="text-xs font-bold text-red-500">{new Date(selectedHomework.dueDate).toLocaleDateString("fr-FR")}</p>
                                </div>
                            </div>

                            {selectedHomework.sessionId && (
                                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-3">
                                    <ArrowUpRight className="w-4 h-4 text-[#1A6CC8]" />
                                    <span className="text-[10px] font-semibold text-[#1A6CC8]">Ce devoir a été créé lors d'une séance en direct.</span>
                                </div>
                            )}

                            <div className="mt-6 flex gap-3">
                                <Button onClick={() => setSelectedHomework(null)} className="flex-1 bg-gray-100 text-[#0D2D5A] hover:bg-gray-200">Fermer</Button>
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
