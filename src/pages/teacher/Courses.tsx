import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen, Search, Plus, Loader2, FileText, Video, Settings2,
    ArrowLeft, Save, Trash2, Monitor, Users, Globe, MapPin, Clock,
    ChevronDown, ChevronUp, GripVertical, X, CheckCircle2
} from "lucide-react";
import {
    fetchCourses, createCourse, updateCourse, deleteCourse,
    createCourseLesson, updateCourseLesson, deleteCourseLesson, fetchTeacherProfile
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const SUBJECTS = ["Mathématiques", "Français", "Physique-Chimie", "SVT", "Histoire-Géo", "Anglais", "Philosophie", "Informatique", "Économie", "Autre"];
const LEVELS = ["CP", "CE1", "CE2", "CM1", "CM2", "6ème", "5ème", "4ème", "3ème", "Seconde", "Première", "Terminale", "BTS / Licence", "Tous niveaux"];
const MODES = [
    { value: "presentiel", label: "Présentiel", icon: MapPin, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
    { value: "online", label: "En ligne", icon: Monitor, color: "text-blue-600 bg-blue-50 border-blue-200" },
    { value: "hybride", label: "Hybride", icon: Globe, color: "text-purple-600 bg-purple-50 border-purple-200" },
] as const;

type LessonDraft = { id?: string; title: string; content: string; videoUrl: string; order: number; _tempId: string };

function newLesson(order: number): LessonDraft {
    return { title: "", content: "", videoUrl: "", order, _tempId: Math.random().toString(36).slice(2) };
}

export default function TeacherCourses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { id } = useParams();
    const { pathname } = useLocation();
    const queryClient = useQueryClient();

    // Build absolute courses base path from URL (works for /teacher/courses AND /tutor/enseignant/courses)
    const coursesBase = (() => {
        const parts = pathname.split("/");
        const idx = parts.lastIndexOf("courses");
        return idx >= 0 ? parts.slice(0, idx + 1).join("/") : pathname;
    })();

    const isCreating = id === "new";
    const isEditing = !!(id && id !== "new");

    const { data: courses = [], isLoading } = useQuery({
        queryKey: ["courses", "teacher", user?.id],
        queryFn: () => fetchCourses("teacher", user!.id),
        enabled: !!user?.id
    });

    const { data: teacherProfile } = useQuery({
        queryKey: ["teacherProfile", user?.id],
        queryFn: () => fetchTeacherProfile(user!.id),
        enabled: !!user?.id,
    });
    const teacherSubjects = teacherProfile?.subjects?.length ? teacherProfile.subjects : SUBJECTS;
    const teacherLevels = teacherProfile?.levels?.length ? teacherProfile.levels : LEVELS;

    // ─── Editor state ──────────────────────────────────────────────────────────
    const existingCourse = isEditing ? (courses as any[]).find((c: any) => c.id === id) : null;

    const [activeTab, setActiveTab] = useState<"infos" | "lessons">("infos");
    const [form, setForm] = useState({
        title: existingCourse?.title || "",
        subject: existingCourse?.subject || "",
        level: existingCourse?.level || "",
        mode: (existingCourse?.mode || "presentiel") as "presentiel" | "online" | "hybride",
        description: existingCourse?.description || "",
        price: existingCourse?.price?.toString() || "0",
        duration: existingCourse?.duration || "",
        status: (existingCourse?.status || "draft") as "draft" | "published",
    });
    const [lessons, setLessons] = useState<LessonDraft[]>(
        existingCourse?.lessons?.length
            ? existingCourse.lessons.map((l: any) => ({ ...l, videoUrl: l.videoUrl || "", _tempId: l.id }))
            : [newLesson(1)]
    );
    const [expandedLesson, setExpandedLesson] = useState<string | null>(lessons[0]?._tempId ?? null);
    const [saving, setSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    // ─── Mutations ─────────────────────────────────────────────────────────────
    const deleteCourseMutation = useMutation({
        mutationFn: (courseId: string) => deleteCourse(courseId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses", "teacher"] });
            toast.success("Cours supprimé");
            navigate("..", { relative: "path" });
        }
    });

    // ─── Save handler ──────────────────────────────────────────────────────────
    const handleSave = async (publishNow = false) => {
        if (!form.title.trim() || !form.subject || !form.level) {
            toast.error("Titre, matière et niveau sont obligatoires.");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                title: form.title.trim(),
                description: form.description.trim(),
                subject: form.subject,
                level: form.level,
                mode: form.mode,
                price: parseFloat(form.price) || 0,
                duration: form.duration.trim(),
                status: (publishNow ? "published" : form.status) as "draft" | "published",
                createdBy: user!.id,
            };

            let courseId: string;
            if (isCreating) {
                const created = await createCourse(payload) as any;
                courseId = created.id;
            } else {
                await updateCourse(id!, payload);
                courseId = id!;
            }

            // Sync lessons
            const currentIds = new Set(lessons.map(l => l.id).filter(Boolean));
            const existingLessons: any[] = existingCourse?.lessons || [];

            // Delete removed lessons
            for (const oldLesson of existingLessons) {
                if (oldLesson.id && !currentIds.has(oldLesson.id)) {
                    await deleteCourseLesson(courseId, oldLesson.id).catch(() => {});
                }
            }

            for (const lesson of lessons) {
                if (!lesson.title.trim()) continue;
                if (lesson.id && currentIds.has(lesson.id)) {
                    await updateCourseLesson(courseId, lesson.id, {
                        title: lesson.title,
                        content: lesson.content,
                        videoUrl: lesson.videoUrl || undefined,
                        order: lesson.order,
                    });
                } else {
                    const created = await createCourseLesson(courseId, {
                        title: lesson.title,
                        content: lesson.content,
                        videoUrl: lesson.videoUrl || undefined,
                        order: lesson.order,
                    }) as any;
                    if (created?.id) {
                        lesson.id = created.id;
                    }
                }
            }

            queryClient.invalidateQueries({ queryKey: ["courses", "teacher"] });
            toast.success(publishNow ? "Cours publié !" : "Cours enregistré");
            navigate("..", { relative: "path" });
        } catch (e: any) {
            toast.error(e.message || "Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    // ─── Lesson helpers ────────────────────────────────────────────────────────
    const addLesson = () => {
        const l = newLesson(lessons.length + 1);
        setLessons(prev => [...prev, l]);
        setExpandedLesson(l._tempId);
    };

    const removeLesson = (tempId: string) => {
        setLessons(prev => {
            const next = prev.filter(l => l._tempId !== tempId).map((l, i) => ({ ...l, order: i + 1 }));
            return next.length ? next : [newLesson(1)];
        });
        setExpandedLesson(null);
    };

    const updateLesson = (tempId: string, field: keyof LessonDraft, value: string) => {
        setLessons(prev => prev.map(l => l._tempId === tempId ? { ...l, [field]: value } : l));
    };

    // ─── Editor view (no loading block — we don't need the list to create) ─────
    if (isCreating || isEditing) {
        // If editing and course list not loaded yet, show spinner only for edit
        if (isEditing && isLoading) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
                </div>
            );
        }
        return (
            <div className="w-full p-3 space-y-3 bg-white min-h-screen">
                {/* Header */}
                <div className="border-b border-slate-100 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
                        <button
                            onClick={() => navigate("..", { relative: "path" })}
                            className="w-9 h-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400 hover:text-[#1A6CC8] hover:border-[#1A6CC8] hover:bg-blue-50/50 transition-all shrink-0"
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </button>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl md:text-2xl font-black text-[#0D2D5A] tracking-tight truncate max-w-full">
                                {isCreating ? "Créer un cours" : `Éditer : ${existingCourse?.title || "..."}`}
                            </h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                {isCreating ? "Nouveau module de cours" : "Modification du module de cours"}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 w-full md:w-auto justify-start md:justify-end overflow-x-auto py-1 scrollbar-none shrink-0">
                        {/* Status badge */}
                        <button
                            type="button"
                            onClick={() => setForm(f => ({ ...f, status: f.status === "draft" ? "published" : "draft" }))}
                            className={cn(
                                "h-9 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all shrink-0 flex items-center gap-1.5",
                                form.status === "published"
                                    ? "bg-[#0D2D5A] text-white border-[#0D2D5A] shadow-sm"
                                    : "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/30 hover:bg-[#F5A623]/20"
                            )}
                        >
                            {form.status === "published" ? "● Publié" : "○ Brouillon"}
                        </button>
                        <Button
                            onClick={() => handleSave(false)}
                            disabled={saving}
                            variant="outline"
                            className="h-9 px-4 rounded-xl border-slate-200 shadow-none font-bold text-[10px] uppercase tracking-widest text-slate-600 hover:bg-slate-50 gap-2 shrink-0"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-slate-400" />}
                            Enregistrer
                        </Button>
                        <Button
                            onClick={() => handleSave(true)}
                            disabled={saving}
                            className="h-9 px-5 rounded-xl shadow-md shadow-[#1A6CC8]/20 bg-[#1A6CC8] hover:bg-[#0D2D5A] font-black text-[10px] uppercase tracking-widest gap-2 shrink-0 transition-all"
                        >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            Publier
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200/80 gap-2">
                    {[
                        { id: "infos", label: "Informations générales", icon: BookOpen },
                        { id: "lessons", label: `Leçons (${lessons.length})`, icon: FileText },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={cn(
                                "flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all border-b-2 -mb-px rounded-t-xl",
                                activeTab === tab.id
                                    ? "border-[#1A6CC8] text-[#1A6CC8] bg-blue-50/30 font-extrabold"
                                    : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* ── Tab: Infos ─────────────────────────────────────────────── */}
                {activeTab === "infos" && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 md:p-7 shadow-sm space-y-6">
                        {/* Titre */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Titre du cours <span className="text-red-500">*</span></span>
                                <span className="text-[9px] font-normal text-slate-400">Ex: Révision Bac – Terminale Mathématiques</span>
                            </label>
                            <input
                                value={form.title}
                                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                                placeholder="Ex: Révision Bac – Terminale Mathématiques"
                                className="w-full h-11 bg-slate-50/70 rounded-xl px-4 border border-slate-200 font-semibold text-sm text-[#0D2D5A] placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all shadow-sm"
                            />
                        </div>

                        {/* Matière & Niveau */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Matière <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.subject}
                                    onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                                    className="w-full h-11 bg-slate-50/70 rounded-xl px-4 border border-slate-200 font-semibold text-xs text-[#0D2D5A] outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all shadow-sm"
                                >
                                    <option value="">— Sélectionner une matière —</option>
                                    {teacherSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Niveau scolaire <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.level}
                                    onChange={e => setForm(f => ({ ...f, level: e.target.value }))}
                                    className="w-full h-11 bg-slate-50/70 rounded-xl px-4 border border-slate-200 font-semibold text-xs text-[#0D2D5A] outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all shadow-sm"
                                >
                                    <option value="">— Sélectionner un niveau —</option>
                                    {teacherLevels.map(l => <option key={l} value={l}>{l}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Mode de session */}
                        <div className="space-y-2.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Mode de session <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {MODES.map(m => {
                                    const isSelected = form.mode === m.value;
                                    return (
                                        <button
                                            key={m.value}
                                            type="button"
                                            onClick={() => setForm(f => ({ ...f, mode: m.value }))}
                                            className={cn(
                                                "relative flex items-center gap-3.5 p-4 rounded-xl border-2 text-left transition-all group",
                                                isSelected
                                                    ? "border-[#1A6CC8] bg-blue-50/40 shadow-sm ring-2 ring-[#1A6CC8]/15"
                                                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:shadow-sm"
                                            )}
                                        >
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all",
                                                m.color
                                            )}>
                                                <m.icon className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span className={cn(
                                                    "text-xs font-black uppercase tracking-wider block",
                                                    isSelected ? "text-[#1A6CC8]" : "text-slate-700"
                                                )}>
                                                    {m.label}
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-medium block truncate">
                                                    {m.value === "presentiel" && "En face-à-face"}
                                                    {m.value === "online" && "Visioconférence Jitsi"}
                                                    {m.value === "hybride" && "Présentiel ou en ligne"}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <div className="w-2.5 h-2.5 bg-[#1A6CC8] rounded-full shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Info complémentaire mode */}
                            <div className="p-3 bg-slate-50/70 rounded-xl border border-slate-100 text-xs font-semibold text-slate-500 flex items-center gap-2">
                                {form.mode === "presentiel" && (
                                    <>
                                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                                        <span>Les séances se déroulent en face-à-face — lieu exact à convenir lors de la planification.</span>
                                    </>
                                )}
                                {form.mode === "online" && (
                                    <>
                                        <Monitor className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span>Les séances se déroulent en visioconférence avec salon Jitsi auto-généré.</span>
                                    </>
                                )}
                                {form.mode === "hybride" && (
                                    <>
                                        <Globe className="w-4 h-4 text-purple-500 shrink-0" />
                                        <span>Format mixte adaptable — séances en présentiel ou en ligne au choix.</span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Prix & Durée */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Tarif horaire indicatif (FCFA)
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={form.price}
                                        onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                                        placeholder="0"
                                        className="w-full h-11 bg-slate-50/70 rounded-xl pl-4 pr-16 border border-slate-200 font-bold text-xs text-[#0D2D5A] outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all shadow-sm"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">FCFA</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Durée indicative par séance
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input
                                        value={form.duration}
                                        onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
                                        placeholder="Ex: 1h30 / séance"
                                        className="w-full h-11 bg-slate-50/70 rounded-xl pl-10 pr-4 border border-slate-200 font-semibold text-xs text-[#0D2D5A] placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                                <span>Description du cours</span>
                                <span className="text-[9px] font-normal text-slate-400">{form.description.length} caractères</span>
                            </label>
                            <textarea
                                value={form.description}
                                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                                rows={5}
                                placeholder="Décrivez le contenu pédagogique, le programme, les objectifs et les prérequis de votre module..."
                                className="w-full bg-slate-50/70 rounded-xl p-4 border border-slate-200 font-medium text-xs text-[#0D2D5A] placeholder:text-slate-400 outline-none focus:bg-white focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15 transition-all resize-none shadow-sm"
                            />
                        </div>
                    </div>
                )}

                {/* ── Tab: Leçons ────────────────────────────────────────────── */}
                {activeTab === "lessons" && (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                {lessons.length} leçon{lessons.length > 1 ? "s" : ""} dans ce cours
                            </p>
                            <Button
                                onClick={addLesson}
                                className="h-8 px-3 rounded-none shadow-none bg-[#1A6CC8] hover:bg-[#0D2D5A] font-black text-[9px] uppercase tracking-widest gap-1.5"
                            >
                                <Plus className="w-3 h-3" /> Ajouter une leçon
                            </Button>
                        </div>

                        {lessons.map((lesson, idx) => (
                            <div key={lesson._tempId} className="border border-slate-200 bg-white overflow-hidden">
                                {/* Lesson header */}
                                <div
                                    className="flex items-center gap-3 px-3 py-2.5 bg-slate-50/50 cursor-pointer hover:bg-slate-100/50 transition-colors"
                                    onClick={() => setExpandedLesson(prev => prev === lesson._tempId ? null : lesson._tempId)}
                                >
                                    <GripVertical className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    <span className="w-5 h-5 bg-[#1A6CC8]/10 text-[#1A6CC8] text-[9px] font-black flex items-center justify-center shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className={cn(
                                        "flex-1 text-[11px] font-black uppercase tracking-tight",
                                        lesson.title ? "text-[#0D2D5A]" : "text-slate-300"
                                    )}>
                                        {lesson.title || "Leçon sans titre"}
                                    </span>
                                    {lesson.videoUrl && <Video className="w-3 h-3 text-[#1A6CC8] shrink-0" />}
                                    <button
                                        onClick={e => { e.stopPropagation(); removeLesson(lesson._tempId); }}
                                        className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-400 transition-colors shrink-0"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                    {expandedLesson === lesson._tempId
                                        ? <ChevronUp className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                        : <ChevronDown className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                                    }
                                </div>

                                {/* Lesson body */}
                                {expandedLesson === lesson._tempId && (
                                    <div className="p-3 space-y-3 border-t border-slate-100">
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Titre de la leçon *</label>
                                            <input
                                                value={lesson.title}
                                                onChange={e => updateLesson(lesson._tempId, "title", e.target.value)}
                                                placeholder="Ex: Introduction aux équations du second degré"
                                                className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contenu / Objectifs pédagogiques *</label>
                                            <textarea
                                                value={lesson.content}
                                                onChange={e => updateLesson(lesson._tempId, "content", e.target.value)}
                                                rows={4}
                                                placeholder="Décrivez ce que l'élève va apprendre, les exercices, les notions abordées..."
                                                className="w-full bg-slate-50/50 p-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all resize-none"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                <Video className="w-3 h-3" /> Lien vidéo (optionnel)
                                            </label>
                                            <input
                                                value={lesson.videoUrl}
                                                onChange={e => updateLesson(lesson._tempId, "videoUrl", e.target.value)}
                                                placeholder="https://youtube.com/watch?v=..."
                                                className="w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Empty hint */}
                        {lessons.every(l => !l.title) && (
                            <div className="py-6 text-center border border-dashed border-slate-200">
                                <FileText className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                    Ajoutez des leçons pour structurer votre cours
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Delete button (edit only) */}
                {isEditing && (
                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={() => {
                                if (confirm("Supprimer ce cours définitivement ?")) {
                                    deleteCourseMutation.mutate(id!);
                                }
                            }}
                            disabled={deleteCourseMutation.isPending}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Supprimer ce cours
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // ─── List view ─────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
            </div>
        );
    }

    const filteredCourses = (courses as any[]).filter((c: any) =>
        c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Mes Cours</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {filteredCourses.length} module{filteredCourses.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <Button
                    onClick={() => navigate("new")}
                    className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-4 rounded-none shadow-none font-black text-[9px] uppercase tracking-widest"
                >
                    <Plus className="mr-1.5 w-3.5 h-3.5" /> Créer un cours
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                <input
                    type="text"
                    placeholder="Rechercher un cours ou une matière..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-50/50 border border-slate-200 pl-9 pr-4 py-1.5 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                />
            </div>

            {/* Course grid */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredCourses.length === 0 ? (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-200">
                        <BookOpen className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4">
                            {searchTerm ? "Aucun résultat" : "Aucun cours créé"}
                        </p>
                        {!searchTerm && (
                            <Button
                                onClick={() => navigate("new")}
                                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-4 rounded-none shadow-none font-black text-[9px] uppercase tracking-widest"
                            >
                                <Plus className="mr-1.5 w-3 h-3" /> Créer mon premier cours
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredCourses.map((course: any) => {
                        const modeInfo = MODES.find(m => m.value === course.mode) || MODES[0];
                        return (
                            <div
                                key={course.id}
                                className="border border-slate-200 bg-white overflow-hidden flex flex-col cursor-pointer hover:border-[#1A6CC8]/40 transition-colors"
                                onClick={() => navigate(course.id)}
                            >
                                {/* Card top */}
                                <div className="h-28 bg-[#0D2D5A]/5 border-b border-slate-100 relative flex items-center justify-center p-4">
                                    <div className="w-12 h-12 border border-slate-200 bg-white flex items-center justify-center text-[#1A6CC8]/30">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    {/* Status badge */}
                                    <span className={`absolute top-2 right-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 ${
                                        course.status === "published" ? "bg-[#0D2D5A] text-white" : "bg-[#F5A623] text-white"
                                    }`}>
                                        {course.status === "published" ? "Publié" : "Brouillon"}
                                    </span>
                                    {/* Mode badge */}
                                    <span className={cn(
                                        "absolute bottom-2 left-2 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border flex items-center gap-1",
                                        modeInfo.color
                                    )}>
                                        <modeInfo.icon className="w-2.5 h-2.5" />
                                        {modeInfo.label}
                                    </span>
                                </div>

                                {/* Card body */}
                                <div className="p-3 space-y-2 flex-1 flex flex-col">
                                    <div>
                                        <p className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest">
                                            {course.subject} · {course.level}
                                        </p>
                                        <h3 className="text-[11px] font-black text-[#0D2D5A] uppercase tracking-tight leading-tight mt-0.5">
                                            {course.title}
                                        </h3>
                                    </div>

                                    <div className="flex gap-3 py-2 border-y border-slate-100">
                                        <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                            <FileText className="w-3 h-3" /> {course.lessons?.length || 0} leçon{course.lessons?.length !== 1 ? "s" : ""}
                                        </span>
                                        {course.price > 0 && (
                                            <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                                {course.price.toLocaleString()} FCFA/h
                                            </span>
                                        )}
                                        {course.duration && (
                                            <span className="flex items-center gap-1 text-[9px] text-slate-400 font-black uppercase">
                                                <Clock className="w-3 h-3" /> {course.duration}
                                            </span>
                                        )}
                                    </div>

                                    <Button
                                        onClick={(e) => { e.stopPropagation(); navigate(course.id); }}
                                        className="w-full bg-slate-50 hover:bg-[#1A6CC8] text-[#0D2D5A] hover:text-white font-black text-[9px] uppercase rounded-none h-7 shadow-none border border-slate-200 hover:border-[#1A6CC8] transition-all mt-auto gap-1.5"
                                    >
                                        Éditer <Settings2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
