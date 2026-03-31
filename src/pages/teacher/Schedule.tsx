import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchScheduleByRole, sessionCheckIn, sessionCheckOut } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, MapPin, RefreshCw, FileText, Clock, Play, Square, Video, Globe, BookOpen, Star, Send } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const STATUS_COLORS: Record<string, string> = {
    "effectué": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "completed": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "à venir": "bg-blue-50 text-blue-600 border-blue-200",
    "scheduled": "bg-blue-50 text-blue-600 border-blue-200",
    "planifié": "bg-gray-50 text-gray-400 border-gray-100",
    "in_progress": "bg-orange-50 text-orange-600 border-orange-200",
    "en cours": "bg-orange-50 text-orange-600 border-orange-200",
};

const COMPREHENSION_LABELS: Record<number, string> = {
    1: "😢 Très difficile",
    2: "😕 Difficile",
    3: "😐 Moyen",
    4: "🙂 Bien compris",
    5: "🌟 Excellent",
};

export default function TeacherSchedule() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [viewedNote, setViewedNote] = useState<any | null>(null);
    // Dialog clôture pédagogique
    const [closingSession, setClosingSession] = useState<any | null>(null);
    const [reportText, setReportText] = useState("");
    const [understandingScore, setUnderstandingScore] = useState(3);
    const [homeworkTitle, setHomeworkTitle] = useState("");
    const [homeworkDesc, setHomeworkDesc] = useState("");
    const [homeworkDue, setHomeworkDue] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: sessions = [], isLoading, isError, error, refetch } = useQuery({
        queryKey: ["teacherSchedule", user?.id],
        queryFn: () => fetchScheduleByRole("teacher", user!.id),
        enabled: Boolean(user?.id),
    });

    const checkInMutation = useMutation({
        mutationFn: sessionCheckIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            toast.success("Session démarrée ✅");
        },
        onError: () => toast.error("Erreur lors du démarrage de la session"),
    });

    const checkOutMutation = useMutation({
        mutationFn: (session: any) => sessionCheckOut(session.id),
        onSuccess: (_data, session) => {
            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            // Ouvrir le dialog de clôture pédagogique
            setClosingSession(session);
            setReportText("");
            setUnderstandingScore(3);
            setHomeworkTitle("");
            setHomeworkDesc("");
            setHomeworkDue("");
        },
        onError: () => toast.error("Erreur lors de la clôture"),
    });

    const handleSubmitReport = async () => {
        if (!reportText.trim()) {
            toast.error("Le rapport de cours est obligatoire.");
            return;
        }
        if (!closingSession) return;
        setIsSubmitting(true);
        try {
            const token = sessionStorage.getItem("c4s_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            // 1. Enregistrer le rapport de cours
            const rRes = await fetch(`${API_BASE}/sessions/${closingSession.id}/report`, {
                method: "POST",
                headers,
                body: JSON.stringify({ reportText, understandingScore }),
            });
            if (!rRes.ok) throw new Error("Rapport non enregistré");

            // 2. Devoir optionnel
            if (homeworkTitle.trim() && homeworkDue) {
                await fetch(`${API_BASE}/homework`, {
                    method: "POST",
                    headers,
                    body: JSON.stringify({
                        teacherId: user!.id,
                        studentId: closingSession.studentId,
                        sessionId: closingSession.id,
                        title: homeworkTitle,
                        description: homeworkDesc,
                        dueDate: homeworkDue,
                        subject: closingSession.subject,
                    }),
                });
            }

            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            queryClient.invalidateQueries({ queryKey: ["teacherHomework"] });
            toast.success("Clôture pédagogique enregistrée 🎉");
            setClosingSession(null);
        } catch (e) {
            toast.error("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const weekSessions = useMemo(() => {
        return WEEK_DAYS.map((day) => {
            const daySessions = sessions.filter((s: any) => s.day === day);
            const displayDate = daySessions[0]?.date ?? "--/--";
            return { dayLabel: day, date: displayDate, sessions: daySessions };
        });
    }, [sessions]);

    if (!user) {
        return <div className="p-8 text-sm text-gray-500">Connectez-vous pour consulter votre planning.</div>;
    }

    const getStatusStyle = (status: string) => STATUS_COLORS[status?.toLowerCase()] || STATUS_COLORS["planifié"];

    const renderStatusBadge = (status: string) => {
        let label = status;
        if (status === 'in_progress' || status === 'en cours') label = 'En cours';
        if (status === 'completed' || status === 'effectué') label = 'Terminé';
        if (status === 'scheduled' || status === 'planifié') label = 'Planifié';
        return (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getStatusStyle(status)}`}>
                {label}
            </span>
        );
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon Emploi du Temps</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez vos sessions de cours et gardez une trace de vos interventions.</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS["planifié"]}`}>Planifié</span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS["en cours"]}`}>En cours</span>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS["effectué"]}`}>Terminé</span>
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger le planning."}</span>
                    <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            )}

            {/* GRID 6 JOURS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {weekSessions.map(({ dayLabel, date, sessions: daySessions }) => (
                    <div key={dayLabel} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className={`px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${daySessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-gray-50 text-gray-400"}`}>
                            {dayLabel.slice(0, 3)}
                            <div className="text-[10px] font-normal opacity-80 mt-0.5 normal-case">{date}</div>
                        </div>
                        <div className="p-3 min-h-[120px] space-y-3 flex-1">
                            {daySessions.map((s: any) => (
                                <div key={s.id} className={`rounded-xl p-3 border transition-all ${s.status === 'completed' || s.status === 'effectué' ? 'bg-emerald-50/30 border-emerald-100' : (s.status === 'in_progress' || s.status === 'en cours') ? 'bg-orange-50/30 border-orange-100' : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-[10px] font-bold ${s.status === 'completed' || s.status === 'effectué' ? 'text-emerald-600' : (s.status === 'in_progress' || s.status === 'en cours') ? 'text-orange-600' : 'text-[#1A6CC8]'}`}>{s.time}</div>
                                        {(s.status === 'completed' || s.status === 'effectué') && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        {(s.status === 'in_progress' || s.status === 'en cours') && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                                    </div>
                                    <div className="text-xs font-bold text-[#0D2D5A]">{s.subject}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{s.student}</div>
                                </div>
                            ))}
                            {daySessions.length === 0 && (
                                <div className="flex items-center justify-center h-16 text-gray-200 text-[10px] italic">
                                    {isLoading ? "..." : "Libre"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* LISTE HISTORIQUE */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    <h2 className="font-bold text-[#0D2D5A] text-sm">Toutes les séances</h2>
                    <span className="ml-auto text-xs text-gray-400">{sessions.length ?? 0} séances</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {sessions.map((s: any) => (
                        <div key={s.id} className="flex flex-col sm:flex-row items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="w-12 text-center flex-shrink-0">
                                <div className="text-[10px] font-bold text-[#1A6CC8]">{s.day?.slice(0, 3).toUpperCase() || '---'}</div>
                                <div className="text-lg font-bold text-[#0D2D5A]">{s.date?.split(/[-\/]/)[0] || '??'}</div>
                            </div>
                            <div className="hidden sm:block w-px h-10 bg-gray-100" />
                            <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                                <div className="font-semibold text-[#0D2D5A] text-sm flex flex-col md:flex-row items-center gap-2">
                                    {s.subject}
                                    <span className="text-[10px] font-normal text-gray-400">— {s.student}</span>
                                </div>
                                <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        {s.location?.toLowerCase().includes('ligne') ? <Globe className="w-3 h-3 text-purple-400" /> : <MapPin className="w-3 h-3" />}
                                        {s.location || "Plateforme Eureka"}
                                    </span>
                                    {s.understandingScore && (
                                        <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                                            <Star className="w-3 h-3 fill-amber-400" /> {s.understandingScore}/5
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-center sm:text-right flex flex-col sm:items-end gap-1.5 mt-2 sm:mt-0">
                                <div className="text-sm font-semibold text-[#0D2D5A] flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {s.time}
                                </div>
                                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                                    {renderStatusBadge(s.status)}

                                    {/* ACTIONS PROFESSEUR */}
                                    {(s.status === 'scheduled' || s.status === 'planifié' || s.status === 'à venir') && (
                                        <Button size="sm" onClick={() => checkInMutation.mutate(s.id)} disabled={checkInMutation.isPending} className="h-6 text-[10px] bg-[#0D2D5A] hover:bg-emerald-600 gap-1 px-2 shadow-sm">
                                            <Play className="w-3 h-3 text-white" /> Démarrer
                                        </Button>
                                    )}
                                    {(s.status === 'in_progress' || s.status === 'en cours') && (
                                        <Button size="sm" onClick={() => checkOutMutation.mutate(s)} disabled={checkOutMutation.isPending} className="h-6 text-[10px] bg-orange-500 hover:bg-red-600 gap-1 px-2 shadow-sm text-white">
                                            <Square className="w-3 h-3 text-white" /> Clôturer
                                        </Button>
                                    )}
                                    {/* REJOINDRE EN LIGNE */}
                                    {s.virtualLink && (s.status === 'planifié' || s.status === 'à venir' || s.status === 'en cours' || s.status === 'scheduled' || s.status === 'in_progress') && (
                                        <a href={s.virtualLink} target="_blank" rel="noopener noreferrer">
                                            <Button size="sm" className="h-6 text-[10px] bg-purple-600 hover:bg-purple-700 gap-1 px-2 shadow-sm text-white">
                                                <Video className="w-3 h-3" /> Rejoindre
                                            </Button>
                                        </a>
                                    )}
                                    {(s.status === 'completed' || s.status === 'effectué') && s.notes && (
                                        <Button size="sm" variant="outline" onClick={() => setViewedNote(s)} className="h-6 text-[10px] gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/50 px-2 shadow-sm">
                                            <FileText className="w-3 h-3" /> Bilan
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && !isLoading && (
                        <div className="px-6 py-8 text-center text-xs text-gray-400 italic">Aucune séance enregistrée pour le moment.</div>
                    )}
                </div>
            </div>

            {/* DIALOG BILAN DE SÉANCE */}
            <Dialog open={!!viewedNote} onOpenChange={(open) => !open && setViewedNote(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A]">
                            <FileText className="w-5 h-5 text-[#1A6CC8]" /> Bilan de séance
                        </DialogTitle>
                        <DialogDescription>
                            Cours de {viewedNote?.subject} pour {viewedNote?.student} du {viewedNote?.date}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                            "{viewedNote?.notes}"
                        </div>
                    </div>
                    <div className="mt-6">
                        <Button onClick={() => setViewedNote(null)} className="w-full bg-[#1A6CC8]">Fermer</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ===== DIALOG CLÔTURE PÉDAGOGIQUE ===== */}
            <Dialog open={!!closingSession} onOpenChange={(open) => { if (!open && !isSubmitting) setClosingSession(null); }}>
                <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A] text-lg">
                            <BookOpen className="w-5 h-5 text-[#1A6CC8]" /> Clôture Pédagogique
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Cours de <strong>{closingSession?.subject}</strong> — {closingSession?.student} — {closingSession?.date}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-6">
                        {/* Rapport de cours - OBLIGATOIRE */}
                        <div>
                            <label className="text-sm font-bold text-[#0D2D5A] flex items-center gap-1 mb-2">
                                <FileText className="w-4 h-4 text-[#1A6CC8]" />
                                Rapport de cours <span className="text-red-500 ml-0.5">*</span>
                            </label>
                            <textarea
                                value={reportText}
                                onChange={(e) => setReportText(e.target.value)}
                                placeholder="Décrivez les notions abordées, la progression de l'élève, les points à retravailler..."
                                rows={5}
                                className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 resize-none bg-gray-50/50"
                            />
                            {!reportText.trim() && <p className="text-xs text-red-400 mt-1">Ce champ est obligatoire pour finaliser la séance.</p>}
                        </div>

                        {/* Note de compréhension */}
                        <div>
                            <label className="text-sm font-bold text-[#0D2D5A] flex items-center gap-1 mb-3">
                                <Star className="w-4 h-4 text-amber-400" />
                                Note de compréhension de l'élève
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {[1, 2, 3, 4, 5].map((score) => (
                                    <button
                                        key={score}
                                        onClick={() => setUnderstandingScore(score)}
                                        className={`flex-1 min-w-[80px] py-2 px-2 rounded-xl border-2 text-xs font-bold transition-all ${understandingScore === score ? 'border-[#1A6CC8] bg-[#1A6CC8]/10 text-[#1A6CC8]' : 'border-gray-100 bg-gray-50 text-gray-400 hover:border-gray-200'}`}
                                    >
                                        {COMPREHENSION_LABELS[score]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Devoir - OPTIONNEL */}
                        <div className="bg-blue-50/50 rounded-2xl p-4 border border-blue-100 space-y-3">
                            <h3 className="text-sm font-bold text-[#0D2D5A] flex items-center gap-1">
                                📚 Travail à faire <span className="text-gray-400 font-normal text-xs ml-1">(optionnel)</span>
                            </h3>
                            <input
                                type="text"
                                placeholder="Titre du devoir (ex: Exercices sur les fractions)"
                                value={homeworkTitle}
                                onChange={(e) => setHomeworkTitle(e.target.value)}
                                className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-white"
                            />
                            {homeworkTitle.trim() && (
                                <>
                                    <textarea
                                        value={homeworkDesc}
                                        onChange={(e) => setHomeworkDesc(e.target.value)}
                                        placeholder="Description détaillée du devoir..."
                                        rows={3}
                                        className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 resize-none bg-white"
                                    />
                                    <div>
                                        <label className="text-xs text-gray-500 font-semibold block mb-1">Date limite de rendu</label>
                                        <input
                                            type="date"
                                            value={homeworkDue}
                                            onChange={(e) => setHomeworkDue(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            className="w-full text-sm border border-gray-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 bg-white"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setClosingSession(null)}
                            disabled={isSubmitting}
                            className="flex-1 border-gray-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleSubmitReport}
                            disabled={isSubmitting || !reportText.trim()}
                            className="flex-1 bg-[#1A6CC8] hover:bg-blue-700 gap-2"
                        >
                            <Send className="w-4 h-4" />
                            {isSubmitting ? "Envoi..." : "Finaliser la séance"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
