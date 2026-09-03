import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchScheduleByRole, sessionCheckIn, sessionCheckOut, fetchTeacherStudents, createSession, fetchCourses,
    fetchTeacherSlotsManage, createTeacherSlot, deleteTeacherSlot,
} from "@/api/backoffice";
import type { CreateSessionPayload } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, MapPin, RefreshCw, FileText, Clock, Play, Square, Video, Globe, BookOpen, Star, Send, Plus, Home, Wifi, Trash2 } from "lucide-react";
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

/** Add 1 hour to a "HH:MM" string */
const addHour = (time: string): string => {
    if (!time) return "17:00";
    const [h, m] = time.split(":").map(Number);
    const newH = (h + 1) % 24;
    return `${String(newH).padStart(2, "0")}:${String(m || 0).padStart(2, "00")}`;
};

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const SUBJECTS = [
    "Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT",
    "Histoire-Géographie", "Philosophie", "Informatique", "Espagnol", "Arabe",
];

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

const defaultForm = (): CreateSessionPayload => ({
    studentIds: [],
    subject: "",
    sessionDate: "",
    sessionTime: "16:00",
    sessionEndTime: "17:00",
    locationType: "presentiel",
    location: "",
    recurrence: "none",
    sessionCount: 1,
    courseId: "",
});

export default function TeacherSchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [viewedNote, setViewedNote] = useState<any | null>(null);

    const availableSubjects = useMemo(() => {
        if (Array.isArray(user?.teacherSubjects) && user.teacherSubjects.length > 0) {
            return user.teacherSubjects;
        }
        return SUBJECTS;
    }, [user?.teacherSubjects]);

    // --- Dialog création de séance ---
    const [showCreate, setShowCreate] = useState(false);
    const [form, setForm] = useState<CreateSessionPayload>(defaultForm());

    // --- Dialog clôture pédagogique ---
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

    const { data: students = [] } = useQuery({
        queryKey: ["teacherStudents", user?.id],
        queryFn: () => fetchTeacherStudents(user!.id),
        enabled: Boolean(user?.id),
    });

    const { data: allCourses = [] } = useQuery({
        queryKey: ["teacherCourses", user?.id],
        queryFn: () => fetchCourses("teacher", user!.id),
        enabled: Boolean(user?.id),
    });

    const filteredCourses = useMemo(() => {
        if (!form.subject) return [];
        return allCourses.filter(c => c.subject === form.subject);
    }, [allCourses, form.subject]);

    const createMutation = useMutation({
        mutationFn: createSession,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            toast.success(
                data.count > 1
                    ? `${data.count} séances créées avec succès !`
                    : "Séance créée avec succès !"
            );
            setShowCreate(false);
            setForm(defaultForm());
        },
        onError: (err: any) => {
            toast.error(err?.message || "Erreur lors de la création de la séance.");
        },
    });

    // ─── Geolocation & Justification Dialog State ────────────────────────────────
    const [justificationModal, setJustificationModal] = useState<{
        open: boolean;
        type: "late_start" | "early_end";
        session: any;
        lat?: number;
        lng?: number;
        justification: string;
    }>({ open: false, type: "late_start", session: null, justification: "" });

    const getCoordinates = (): Promise<{ lat?: number; lng?: number }> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) return resolve({});
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    console.warn("Geolocation warning:", err.message);
                    resolve({});
                },
                { timeout: 8000, enableHighAccuracy: true }
            );
        });
    };

    const checkInMutation = useMutation({
        mutationFn: ({ sessionId, payload }: { sessionId: string; payload?: any }) => sessionCheckIn(sessionId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            toast.success("Session démarrée avec succès ✅");
            setJustificationModal({ open: false, type: "late_start", session: null, justification: "" });
        },
        onError: () => toast.error("Erreur lors du démarrage de la session"),
    });

    const checkOutMutation = useMutation({
        mutationFn: ({ session, payload }: { session: any; payload?: any }) => sessionCheckOut(session.id, payload),
        onSuccess: (_data, { session }) => {
            queryClient.invalidateQueries({ queryKey: ["teacherSchedule"] });
            setJustificationModal({ open: false, type: "early_end", session: null, justification: "" });
            setClosingSession(session);
            setReportText("");
            setUnderstandingScore(3);
            setHomeworkTitle("");
            setHomeworkDesc("");
            setHomeworkDue("");
        },
        onError: () => toast.error("Erreur lors de la clôture"),
    });

    const handleStartSession = async (s: any) => {
        const coords = await getCoordinates();
        let isLate = false;
        if (s.sessionDate && s.sessionTime) {
            const timeParts = String(s.sessionTime).split(":");
            const scheduledStart = new Date(s.sessionDate);
            if (timeParts.length >= 2) {
                scheduledStart.setHours(parseInt(timeParts[0], 10), parseInt(timeParts[1], 10), 0);
            }
            const now = new Date();
            const diffMinutes = (now.getTime() - scheduledStart.getTime()) / (1000 * 60);
            if (diffMinutes > 10) {
                isLate = true;
            }
        }

        if (isLate) {
            setJustificationModal({
                open: true,
                type: "late_start",
                session: s,
                lat: coords.lat,
                lng: coords.lng,
                justification: "",
            });
        } else {
            checkInMutation.mutate({ sessionId: s.id, payload: { lat: coords.lat, lng: coords.lng } });
        }
    };

    const handleEndSession = async (s: any) => {
        const coords = await getCoordinates();
        let isEarly = false;
        if (s.actualStartTime) {
            const start = new Date(s.actualStartTime);
            const now = new Date();
            const elapsedMinutes = (now.getTime() - start.getTime()) / (1000 * 60);
            if (elapsedMinutes < 90) {
                isEarly = true;
            }
        }

        if (isEarly) {
            setJustificationModal({
                open: true,
                type: "early_end",
                session: s,
                lat: coords.lat,
                lng: coords.lng,
                justification: "",
            });
        } else {
            checkOutMutation.mutate({ session: s, payload: { lat: coords.lat, lng: coords.lng } });
        }
    };

    const handleSubmitReport = async () => {
        if (!reportText.trim()) {
            toast.error("Le rapport de cours est obligatoire.");
            return;
        }
        if (!closingSession) return;
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("c4s_token");
            const headers: Record<string, string> = { "Content-Type": "application/json" };
            if (token) headers["Authorization"] = `Bearer ${token}`;

            const rRes = await fetch(`${API_BASE}/sessions/${closingSession.id}/report`, {
                method: "POST",
                headers,
                body: JSON.stringify({ reportText, understandingScore }),
            });
            if (!rRes.ok) throw new Error("Rapport non enregistré");

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
        } catch {
            toast.error("Une erreur est survenue. Veuillez réessayer.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateSubmit = () => {
        if (!form.studentIds?.length || !form.subject || !form.sessionDate || !form.sessionTime || !form.sessionEndTime) {
            toast.error("Veuillez remplir tous les champs obligatoires (Élèves, Matière, Date, Heure début, Heure fin).");
            return;
        }
        if (form.sessionEndTime <= form.sessionTime) {
            toast.error("L'heure de fin doit être postérieure à l'heure de début.");
            return;
        }
        createMutation.mutate(form);
    };

    const weekSessions = useMemo(() => {
        return WEEK_DAYS.map((day) => {
            const daySessions = sessions.filter((s: any) => s.day === day);
            const displayDate = daySessions[0]?.date ?? "--/--";
            return { dayLabel: day, date: displayDate, sessions: daySessions };
        });
    }, [sessions]);

    if (!user) {
        return <div className="p-4 md:p-8 text-sm text-gray-500">Connectez-vous pour consulter votre planning.</div>;
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
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Mon Emploi du Temps</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Gérez vos sessions de cours et suivez vos interventions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex gap-2">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS["planifié"]}`}>Planifié</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS["en cours"]}`}>En cours</span>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase tracking-wider ${STATUS_COLORS["effectué"]}`}>Terminé</span>
                    </div>
                    <Button
                        onClick={() => setShowCreate(true)}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-3 rounded-none shadow-none font-black text-[10px] uppercase gap-1.5"
                    >
                        <Plus className="w-3.5 h-3.5" /> Nouvelle séance
                    </Button>
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold p-3 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger le planning."}</span>
                    <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-red-700 font-black text-[9px] uppercase border border-red-200 px-2 py-1 hover:bg-red-100 transition-colors">
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            )}

            {user?.id && <TeacherSlotsManager teacherId={user.id} />}

            {/* GRID 6 JOURS */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {weekSessions.map(({ dayLabel, date, sessions: daySessions }) => (
                    <div key={dayLabel} className="bg-white border border-slate-200 overflow-hidden flex flex-col">
                        <div className={`px-2 py-2 text-center text-[10px] font-black uppercase tracking-wide ${daySessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-slate-50 text-slate-400"}`}>
                            {dayLabel.slice(0, 3)}
                            <div className="text-[9px] font-normal opacity-80 mt-0.5 normal-case">{date}</div>
                        </div>
                        <div className="p-2 min-h-[100px] space-y-2 flex-1">
                            {daySessions.map((s: any) => (
                                <div key={s.id} className={`p-2 border transition-all ${
                                    s.status === 'completed' || s.status === 'effectué'
                                        ? 'bg-emerald-50/30 border-emerald-100'
                                        : (s.status === 'in_progress' || s.status === 'en cours')
                                        ? 'bg-orange-50/30 border-orange-100'
                                        : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10'
                                }`}>
                                    <div className="flex items-center justify-between mb-0.5">
                                        <div className={`text-[9px] font-black ${
                                            s.status === 'completed' || s.status === 'effectué' ? 'text-emerald-600'
                                            : (s.status === 'in_progress' || s.status === 'en cours') ? 'text-orange-600'
                                            : 'text-[#1A6CC8]'
                                        }`}>{s.time}</div>
                                        {(s.status === 'completed' || s.status === 'effectué') && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                        {(s.status === 'in_progress' || s.status === 'en cours') && <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />}
                                    </div>
                                    <div className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-tight">{s.subject}</div>
                                    <div className="text-[9px] text-slate-500 font-bold mt-0.5 truncate">{s.student}</div>
                                </div>
                            ))}
                            {daySessions.length === 0 && (
                                <div className="flex items-center justify-center h-14 text-slate-200 text-[9px] font-black uppercase tracking-widest">
                                    {isLoading ? "..." : "Libre"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* LISTE HISTORIQUE */}
            <div className="border border-slate-200 bg-white overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                    <div className="p-1.5 bg-[#1A6CC8]/10">
                        <CalendarDays className="w-3.5 h-3.5 text-[#1A6CC8]" />
                    </div>
                    <h2 className="font-black text-[#0D2D5A] text-[10px] uppercase tracking-widest">Toutes les séances</h2>
                    <span className="ml-auto text-[9px] font-bold text-slate-400 uppercase">{sessions.length ?? 0} séances</span>
                </div>
                <div className="divide-y divide-slate-100">
                    {sessions.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50/50 transition-colors">
                            <div className="w-10 text-center flex-shrink-0">
                                <div className="text-[9px] font-black text-[#1A6CC8] uppercase">{s.day?.slice(0, 3).toUpperCase() || '---'}</div>
                                <div className="text-base font-black text-[#0D2D5A]">{s.date?.split(/[-/]/)[0] || '??'}</div>
                            </div>
                            <div className="hidden sm:block w-px h-8 bg-slate-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-black text-[#0D2D5A] text-[10px] uppercase tracking-tight flex items-center gap-2">
                                    {s.subject}
                                    <span className="text-[9px] font-bold text-slate-400 normal-case">— {s.student}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase">
                                        {s.location?.toLowerCase().includes('ligne') ? <Globe className="w-3 h-3 text-purple-400" /> : <MapPin className="w-3 h-3" />}
                                        {s.location || "Plateforme Eureka"}
                                    </span>
                                    {s.understandingScore && (
                                        <span className="flex items-center gap-1 text-[9px] text-[#F5A623] font-black uppercase">
                                            <Star className="w-3 h-3 fill-[#F5A623]" /> {s.understandingScore}/5
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <div className="text-[10px] font-black text-[#0D2D5A] flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {s.time}
                                </div>
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                    {renderStatusBadge(s.status)}

                                    {(s.status === 'planifié' || s.status === 'à venir' || s.status === 'scheduled') && (
                                        <Button size="sm" onClick={() => handleStartSession(s)} disabled={checkInMutation.isPending} className="h-6 text-[9px] bg-[#0D2D5A] hover:bg-emerald-600 gap-1 px-2 rounded-none shadow-none font-black uppercase">
                                            <Play className="w-3 h-3" /> Démarrer
                                        </Button>
                                    )}
                                    {(s.status === 'in_progress' || s.status === 'en cours') && (
                                        <Button size="sm" onClick={() => handleEndSession(s)} disabled={checkOutMutation.isPending} className="h-6 text-[9px] bg-orange-500 hover:bg-red-600 gap-1 px-2 rounded-none shadow-none text-white font-black uppercase">
                                            <Square className="w-3 h-3" /> Clôturer
                                        </Button>
                                    )}
                                    {s.virtualLink && (s.status === 'planifié' || s.status === 'à venir' || s.status === 'en cours' || s.status === 'scheduled' || s.status === 'in_progress') && (
                                        <Button 
                                            size="sm" 
                                            onClick={() => navigate(`/virtual-class/${s.id}`)}
                                            className="h-6 text-[9px] bg-purple-600 hover:bg-purple-700 gap-1 px-2 rounded-none shadow-none text-white font-black uppercase"
                                        >
                                            <Video className="w-3 h-3" /> Rejoindre
                                        </Button>
                                    )}
                                    {(s.status === 'completed' || s.status === 'effectué') && s.notes && (
                                        <Button size="sm" variant="outline" onClick={() => setViewedNote(s)} className="h-6 text-[9px] gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/50 px-2 rounded-none shadow-none font-black uppercase">
                                            <FileText className="w-3 h-3" /> Bilan
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {sessions.length === 0 && !isLoading && (
                        <div className="px-3 py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Aucune séance enregistrée pour le moment.
                        </div>
                    )}
                </div>
            </div>

            {/* ===== DIALOG CRÉATION DE SÉANCE ===== */}
            <Dialog open={showCreate} onOpenChange={(open) => { if (!open) { setShowCreate(false); setForm(defaultForm()); } }}>
                <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A] text-lg">
                            <CalendarDays className="w-5 h-5 text-[#1A6CC8]" /> Planifier une séance
                        </DialogTitle>
                        <DialogDescription className="text-xs">
                            Créez une ou plusieurs séances avec l'un de vos élèves.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="mt-4 space-y-5">
                        {/* Élèves (Multi-sélection) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex justify-between items-center">
                                <span>Élèves concernés <span className="text-red-400">*</span></span>
                                <span className="text-[9px] lowercase font-normal italic">
                                    {form.studentIds?.length ?? 0} sélectionné(s)
                                </span>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[120px] overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50/50">
                                {(Array.isArray(students) ? students : []).map((s: any) => (
                                    <label key={s.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-gray-100">
                                        <input
                                            type="checkbox"
                                            checked={form.studentIds?.includes(s.id)}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setForm(f => ({
                                                    ...f,
                                                    studentIds: checked
                                                        ? [...(f.studentIds || []), s.id]
                                                        : (f.studentIds || []).filter(id => id !== s.id)
                                                }));
                                            }}
                                            className="w-4 h-4 rounded border-gray-300 text-[#1A6CC8] focus:ring-[#1A6CC8]"
                                        />
                                        <span className="text-xs font-medium text-[#0D2D5A] truncate">{s.name}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Matière & Cours */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Matière <span className="text-red-400">*</span></label>
                                <select
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value, courseId: "" }))}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm"
                                >
                                    <option value="">— Matière —</option>
                                    {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Lier à un cours</label>
                                <select
                                    value={form.courseId}
                                    onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))}
                                    disabled={!form.subject}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm disabled:opacity-50"
                                >
                                    <option value="">— Aucun cours —</option>
                                    {filteredCourses.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.title}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Date + Heure début + Heure fin */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date <span className="text-red-400">*</span></label>
                                <input
                                    type="date"
                                    value={form.sessionDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={e => setForm(f => ({ ...f, sessionDate: e.target.value }))}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Heure début <span className="text-red-400">*</span></label>
                                <input
                                    type="time"
                                    value={form.sessionTime}
                                    onChange={e => setForm(f => ({
                                        ...f,
                                        sessionTime: e.target.value,
                                        // Auto-compute end time +1h if not manually set
                                        sessionEndTime: f.sessionEndTime === addHour(form.sessionTime) ? addHour(e.target.value) : f.sessionEndTime,
                                    }))}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Heure fin <span className="text-red-400">*</span></label>
                                <input
                                    type="time"
                                    value={form.sessionEndTime || ""}
                                    min={form.sessionTime}
                                    onChange={e => setForm(f => ({ ...f, sessionEndTime: e.target.value }))}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Type : Présentiel / En ligne */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Type de séance <span className="text-red-400">*</span></label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setForm(f => ({ ...f, locationType: "presentiel", location: "" }))}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${form.locationType === "presentiel" ? "border-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-100 hover:border-gray-200 bg-gray-50"}`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.locationType === "presentiel" ? "bg-[#1A6CC8] text-white" : "bg-gray-100 text-gray-400"}`}>
                                        <Home className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold ${form.locationType === "presentiel" ? "text-[#1A6CC8]" : "text-gray-500"}`}>Présentiel</p>
                                        <p className="text-[10px] text-gray-400">Domicile / École</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setForm(f => ({ ...f, locationType: "online", location: "" }))}
                                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${form.locationType === "online" ? "border-purple-500 bg-purple-50" : "border-gray-100 hover:border-gray-200 bg-gray-50"}`}
                                >
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${form.locationType === "online" ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                                        <Wifi className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={`text-xs font-bold ${form.locationType === "online" ? "text-purple-600" : "text-gray-500"}`}>En ligne</p>
                                        <p className="text-[10px] text-gray-400">Lien Jitsi auto-généré</p>
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Adresse (présentiel uniquement) */}
                        {form.locationType === "presentiel" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adresse / Lieu</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Domicile de l'élève, Lycée Général Leclerc..."
                                    value={form.location || ""}
                                    onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
                                    className="w-full h-11 bg-gray-50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all text-sm"
                                />
                            </div>
                        )}

                        {form.locationType === "online" && (
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 flex items-start gap-2">
                                <Wifi className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-purple-700 font-medium">
                                    Un lien de visioconférence Jitsi sera généré automatiquement et accessible depuis votre planning le jour J.
                                </p>
                            </div>
                        )}

                        {/* Récurrence */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Récurrence</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button
                                    onClick={() => setForm(f => ({ ...f, recurrence: "none", sessionCount: 1 }))}
                                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${form.recurrence === "none" ? "border-[#1A6CC8] bg-[#1A6CC8]/5 text-[#1A6CC8]" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                >
                                    Séance unique
                                </button>
                                <button
                                    onClick={() => setForm(f => ({ ...f, recurrence: "weekly", sessionCount: 4 }))}
                                    className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${form.recurrence === "weekly" ? "border-[#1A6CC8] bg-[#1A6CC8]/5 text-[#1A6CC8]" : "border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                >
                                    Hebdomadaire
                                </button>
                            </div>
                        </div>

                        {form.recurrence === "weekly" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Nombre de séances <span className="text-gray-300 font-normal">(max 12)</span>
                                </label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min={1}
                                        max={12}
                                        value={form.sessionCount || 4}
                                        onChange={e => setForm(f => ({ ...f, sessionCount: parseInt(e.target.value) }))}
                                        className="flex-1 accent-[#1A6CC8]"
                                    />
                                    <span className="text-sm font-bold text-[#1A6CC8] w-8 text-center">{form.sessionCount}</span>
                                </div>
                                <p className="text-[10px] text-gray-400">
                                    {form.sessionCount} séance{(form.sessionCount || 1) > 1 ? "s" : ""} créée{(form.sessionCount || 1) > 1 ? "s" : ""} à partir du {form.sessionDate ? new Date(form.sessionDate).toLocaleDateString("fr-FR") : "..."}, chaque semaine.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => { setShowCreate(false); setForm(defaultForm()); }}
                            disabled={createMutation.isPending}
                            className="flex-1 border-gray-200"
                        >
                            Annuler
                        </Button>
                        <Button
                            onClick={handleCreateSubmit}
                            disabled={createMutation.isPending || !form.studentIds?.length || !form.subject || !form.sessionDate}
                            className="flex-1 bg-[#1A6CC8] hover:bg-[#0D2D5A] gap-2 font-bold"
                        >
                            <Plus className="w-4 h-4" />
                            {createMutation.isPending
                                ? "Création..."
                                : form.recurrence === "weekly"
                                    ? `Créer ${form.sessionCount} séance${(form.sessionCount || 1) > 1 ? "s" : ""}`
                                    : "Créer la séance"
                            }
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

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

            {/* Modal de Justification Retard / Fin Anticipée */}
            <Dialog open={justificationModal.open} onOpenChange={(open) => !open && setJustificationModal(m => ({ ...m, open: false }))}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A] text-base">
                            <Clock className="w-5 h-5 text-amber-500" />
                            {justificationModal.type === "late_start" ? "Démarrage en retard de la séance" : "Fin anticipée de la séance"}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-slate-500 mt-1">
                            {justificationModal.type === "late_start"
                                ? "Cette séance démarre plus de 10 minutes après l'horaire prévu. Veuillez saisir une justification qui sera enregistrée et transmise à l'administration :"
                                : "La séance se termine avant l'heure prévue. Veuillez indiquer le motif de cette fin anticipée :"
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-3 py-2">
                        <textarea
                            value={justificationModal.justification}
                            onChange={(e) => setJustificationModal(m => ({ ...m, justification: e.target.value }))}
                            placeholder={justificationModal.type === "late_start" ? "Ex: Embouteillage imprévu / Retard de l'élève..." : "Ex: Contenu du cours entièrement couvert / Impératif de l'élève..."}
                            rows={3}
                            className="w-full text-xs p-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 resize-none bg-white"
                        />
                        {justificationModal.lat && (
                            <p className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5" /> Position GPS capturée ({justificationModal.lat.toFixed(4)}, {justificationModal.lng?.toFixed(4)})
                            </p>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setJustificationModal(m => ({ ...m, open: false }))}
                            className="h-8 text-xs"
                        >
                            Annuler
                        </Button>
                        <Button
                            disabled={!justificationModal.justification.trim() || checkInMutation.isPending || checkOutMutation.isPending}
                            onClick={() => {
                                const { type, session, lat, lng, justification } = justificationModal;
                                if (type === "late_start") {
                                    checkInMutation.mutate({ sessionId: session.id, payload: { lat, lng, justification } });
                                } else {
                                    checkOutMutation.mutate({ session, payload: { lat, lng, justification } });
                                }
                            }}
                            className="h-8 bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white text-xs font-bold"
                        >
                            Valider et Transmettre
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function TeacherSlotsManager({ teacherId }: { teacherId: string }) {
    const queryClient = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [date, setDate] = useState("");
    const [startHour, setStartHour] = useState("14:00");
    const [endHour, setEndHour] = useState("15:00");
    const [subject, setSubject] = useState("");

    const { data: slots = [], isLoading } = useQuery({
        queryKey: ["teacherSlotsManage", teacherId],
        queryFn: () => fetchTeacherSlotsManage(teacherId),
    });

    const createMutation = useMutation({
        mutationFn: () => createTeacherSlot(teacherId, {
            startTime: `${date}T${startHour}:00`,
            endTime: `${date}T${endHour}:00`,
            subject: subject || undefined,
        }),
        onSuccess: () => {
            toast.success("Créneau ajouté — visible sur votre page publique.");
            queryClient.invalidateQueries({ queryKey: ["teacherSlotsManage", teacherId] });
            setShowAdd(false);
            setDate(""); setSubject("");
        },
        onError: (err: Error) => toast.error(err.message || "Impossible d'ajouter le créneau."),
    });

    const deleteMutation = useMutation({
        mutationFn: (slotId: string) => deleteTeacherSlot(teacherId, slotId),
        onSuccess: () => {
            toast.success("Créneau supprimé.");
            queryClient.invalidateQueries({ queryKey: ["teacherSlotsManage", teacherId] });
        },
        onError: (err: Error) => toast.error(err.message || "Impossible de supprimer le créneau."),
    });

    const upcomingSlots = slots
        .filter(s => new Date(s.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const STATUS_LABEL: Record<string, string> = { open: "Disponible", booked: "Réservé", cancelled: "Annulé" };
    const STATUS_STYLE: Record<string, string> = {
        open: "bg-emerald-50 text-emerald-600 border-emerald-100",
        booked: "bg-blue-50 text-blue-600 border-blue-200",
        cancelled: "bg-gray-50 text-gray-400 border-gray-100",
    };

    return (
        <div className="border border-slate-200 bg-white">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-[11px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-[#1A6CC8]" /> Créneaux réservables en ligne
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Visibles et réservables depuis votre fiche publique</p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowAdd(v => !v)}
                    className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-7 px-2.5 rounded-none shadow-none font-black text-[9px] uppercase gap-1"
                >
                    <Plus className="w-3 h-3" /> Ajouter
                </Button>
            </div>

            {showAdd && (
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-end gap-2">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Début</label>
                        <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Fin</label>
                        <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Matière (optionnel)</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Mathématiques" className="h-8 text-xs border border-slate-200 px-2 w-full" />
                    </div>
                    <Button
                        size="sm"
                        disabled={!date || createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 rounded-none shadow-none font-black text-[9px] uppercase"
                    >
                        {createMutation.isPending ? "..." : "Créer"}
                    </Button>
                </div>
            )}

            <div className="p-3">
                {isLoading ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">Chargement...</p>
                ) : upcomingSlots.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">Aucun créneau à venir. Ajoutez-en pour être réservable sur votre fiche publique.</p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {upcomingSlots.map(slot => (
                            <div key={slot.id} className="p-2.5 border border-slate-100 flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-black text-[#0D2D5A]">
                                        {new Date(slot.startTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                    </p>
                                    <p className="text-[9px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(slot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        {" – "}
                                        {new Date(slot.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <span className={`inline-block mt-1 text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase ${STATUS_STYLE[slot.status]}`}>
                                        {STATUS_LABEL[slot.status]}
                                    </span>
                                </div>
                                {slot.status === "open" && (
                                    <button
                                        onClick={() => deleteMutation.mutate(slot.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function TeacherSlotsManager({ teacherId }: { teacherId: string }) {
    const queryClient = useQueryClient();
    const [showAdd, setShowAdd] = useState(false);
    const [date, setDate] = useState("");
    const [startHour, setStartHour] = useState("14:00");
    const [endHour, setEndHour] = useState("15:00");
    const [subject, setSubject] = useState("");

    const { data: slots = [], isLoading } = useQuery({
        queryKey: ["teacherSlotsManage", teacherId],
        queryFn: () => fetchTeacherSlotsManage(teacherId),
    });

    const createMutation = useMutation({
        mutationFn: () => createTeacherSlot(teacherId, {
            startTime: `${date}T${startHour}:00`,
            endTime: `${date}T${endHour}:00`,
            subject: subject || undefined,
        }),
        onSuccess: () => {
            toast.success("Créneau ajouté — visible sur votre page publique.");
            queryClient.invalidateQueries({ queryKey: ["teacherSlotsManage", teacherId] });
            setShowAdd(false);
            setDate(""); setSubject("");
        },
        onError: (err: Error) => toast.error(err.message || "Impossible d'ajouter le créneau."),
    });

    const deleteMutation = useMutation({
        mutationFn: (slotId: string) => deleteTeacherSlot(teacherId, slotId),
        onSuccess: () => {
            toast.success("Créneau supprimé.");
            queryClient.invalidateQueries({ queryKey: ["teacherSlotsManage", teacherId] });
        },
        onError: (err: Error) => toast.error(err.message || "Impossible de supprimer le créneau."),
    });

    const upcomingSlots = slots
        .filter(s => new Date(s.startTime) > new Date())
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    const STATUS_LABEL: Record<string, string> = { open: "Disponible", booked: "Réservé", cancelled: "Annulé" };
    const STATUS_STYLE: Record<string, string> = {
        open: "bg-emerald-50 text-emerald-600 border-emerald-100",
        booked: "bg-blue-50 text-blue-600 border-blue-200",
        cancelled: "bg-gray-50 text-gray-400 border-gray-100",
    };

    return (
        <div className="border border-slate-200 bg-white">
            <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-[11px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-[#1A6CC8]" /> Créneaux réservables en ligne
                    </h2>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">Visibles et réservables depuis votre fiche publique</p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowAdd(v => !v)}
                    className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-7 px-2.5 rounded-none shadow-none font-black text-[9px] uppercase gap-1"
                >
                    <Plus className="w-3 h-3" /> Ajouter
                </Button>
            </div>

            {showAdd && (
                <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-end gap-2">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Début</label>
                        <input type="time" value={startHour} onChange={e => setStartHour(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Fin</label>
                        <input type="time" value={endHour} onChange={e => setEndHour(e.target.value)} className="h-8 text-xs border border-slate-200 px-2" />
                    </div>
                    <div className="flex-1 min-w-[140px]">
                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Matière (optionnel)</label>
                        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Mathématiques" className="h-8 text-xs border border-slate-200 px-2 w-full" />
                    </div>
                    <Button
                        size="sm"
                        disabled={!date || createMutation.isPending}
                        onClick={() => createMutation.mutate()}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 rounded-none shadow-none font-black text-[9px] uppercase"
                    >
                        {createMutation.isPending ? "..." : "Créer"}
                    </Button>
                </div>
            )}

            <div className="p-3">
                {isLoading ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">Chargement...</p>
                ) : upcomingSlots.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-4">Aucun créneau à venir. Ajoutez-en pour être réservable sur votre fiche publique.</p>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {upcomingSlots.map(slot => (
                            <div key={slot.id} className="p-2.5 border border-slate-100 flex items-center justify-between gap-2">
                                <div>
                                    <p className="text-[10px] font-black text-[#0D2D5A]">
                                        {new Date(slot.startTime).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                                    </p>
                                    <p className="text-[9px] text-slate-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(slot.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        {" – "}
                                        {new Date(slot.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                    </p>
                                    <span className={`inline-block mt-1 text-[8px] font-black px-1.5 py-0.5 rounded-full border uppercase ${STATUS_STYLE[slot.status]}`}>
                                        {STATUS_LABEL[slot.status]}
                                    </span>
                                </div>
                                {slot.status === "open" && (
                                    <button
                                        onClick={() => deleteMutation.mutate(slot.id)}
                                        className="p-1.5 text-slate-300 hover:text-red-500 transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
