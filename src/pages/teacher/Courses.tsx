import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    ClipboardList,
    GraduationCap,
    Loader2,
    PlusCircle,
    Users,
    GripVertical,
    Bold,
    Italic,
    List,
    Link as LinkIcon,
    Video,
    Trash2,
    CheckCircle2,
    MoreVertical
} from "lucide-react";
import {
    assignCourseToStudent,
    createCourse,
    createCourseLesson,
    createLessonQuiz,
    createQuizQuestion,
    fetchCourses,
} from "@/api/backoffice";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import type { CourseLesson, CourseStatus, CourseSummary } from "@/integrations/supabase/types";

// --- TYPES & CONSTANTS ---
const STATUS_STYLES: Record<CourseStatus, { bg: string; text: string; label: string }> = {
    draft: { bg: "bg-orange-50", text: "text-orange-600", label: "Brouillon" },
    published: { bg: "bg-green-50", text: "text-green-600", label: "Publié" },
};

// --- COMPONENTS ---

export default function TeacherCourses() {
    const { toast } = useToast();
    const { user } = useAuth();
    const teacherId = user?.id ?? "";
    const queryClient = useQueryClient();

    // Selection State
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);

    // Form States
    const [courseForm, setCourseForm] = useState({ title: "", description: "", subject: "", level: "", status: "draft" as CourseStatus, coverUrl: "" });
    const [lessonForm, setLessonForm] = useState({ title: "", content: "", videoUrl: "", order: 1 });
    const [quizForm, setQuizForm] = useState({ title: "", instructions: "", totalPoints: 10 });
    const [questionForm, setQuestionForm] = useState({ prompt: "", choices: [{ id: "A", label: "" }, { id: "B", label: "" }], correctAnswer: "A", points: 2 });
    const [enrollmentForm, setEnrollmentForm] = useState({ studentId: "", studentName: "" });

    // Drawer States
    const [drawers, setDrawers] = useState({ course: false, lesson: false, quiz: false, question: false, enroll: false });

    // Queries
    const { data: courses = [], isLoading } = useQuery({
        queryKey: ["courses", "teacher", teacherId],
        queryFn: () => fetchCourses("teacher", teacherId),
        enabled: !!teacherId
    });

    const selectedCourse = courses.find(c => c.id === selectedCourseId);
    const selectedLesson = selectedCourse?.lessons.find(l => l.id === selectedLessonId);

    // Reordering Logic
    const [reorderLessons, setReorderLessons] = useState<CourseLesson[]>([]);
    useEffect(() => {
        if (selectedCourse) setReorderLessons([...selectedCourse.lessons].sort((a, b) => a.order - b.order));
    }, [selectedCourse]);

    // Mutations
    const courseMutation = useMutation({
        mutationFn: createCourse,
        onSuccess: (course) => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setSelectedCourseId(course.id);
            setDrawers(p => ({ ...p, course: false }));
            toast({ title: "Cours créé avec succès" });
        }
    });

    const lessonMutation = useMutation({
        mutationFn: ({ courseId, payload }: any) => createCourseLesson(courseId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setDrawers(p => ({ ...p, lesson: false }));
            setLessonForm({ title: "", content: "", videoUrl: "", order: (selectedCourse?.lessons.length || 0) + 1 });
            toast({ title: "Leçon ajoutée" });
        }
    });

    const quizMutation = useMutation({
        mutationFn: ({ lessonId, payload }: any) => createLessonQuiz(lessonId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setDrawers(p => ({ ...p, quiz: false }));
            toast({ title: "Quiz créé" });
        }
    });

    const questionMutation = useMutation({
        mutationFn: ({ quizId, payload }: any) => createQuizQuestion(quizId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setDrawers(p => ({ ...p, question: false }));
            setQuestionForm({ prompt: "", choices: [{ id: "A", label: "" }, { id: "B", label: "" }], correctAnswer: "A", points: 2 });
            toast({ title: "Question ajoutée" });
        }
    });

    const assignStudentMutation = useMutation({
        mutationFn: ({ courseId, payload }: any) => assignCourseToStudent(courseId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courses"] });
            setDrawers(p => ({ ...p, enroll: false }));
            setEnrollmentForm({ studentId: "", studentName: "" });
            toast({ title: "Élève assigné avec succès" });
        }
    });

    // Helpers
    const handleFormat = (tag: string) => {
        const area = document.getElementById('lesson-content') as HTMLTextAreaElement;
        if (!area) return;
        const start = area.selectionStart;
        const end = area.selectionEnd;
        const text = area.value;
        const selected = text.substring(start, end);
        const before = text.substring(0, start);
        const after = text.substring(end);

        let formatted = "";
        if (tag === 'bold') formatted = `**${selected}**`;
        else if (tag === 'italic') formatted = `*${selected}*`;
        else if (tag === 'list') formatted = `\n- ${selected}`;

        setLessonForm(p => ({ ...p, content: before + formatted + after }));
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl shadow-blue-500/5">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-[#0D2D5A] tracking-tighter">
                        Content <span className="text-[#1A6CC8]">Studio</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Concevez des parcours pédagogiques immersifs pour vos élèves.</p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => setDrawers(p => ({ ...p, course: true }))} className="bg-[#1A6CC8] hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-bold shadow-lg shadow-blue-500/20">
                        <PlusCircle className="mr-2 h-5 w-5" /> Nouveau Parcours
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
                {/* Courses Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                            <h2 className="font-black text-[#0D2D5A] uppercase tracking-widest text-xs">Mes Catalogues</h2>
                            <Badge variant="outline" className="rounded-lg">{courses.length}</Badge>
                        </div>
                        <ScrollArea className="h-[calc(100vh-450px)]">
                            <div className="p-4 space-y-3">
                                {isLoading ? (
                                    <div className="text-center py-10 text-gray-400 font-bold animate-pulse">Chargement...</div>
                                ) : courses.length === 0 ? (
                                    <div className="text-center py-10 text-gray-400 font-medium">Aucun cours.</div>
                                ) : (
                                    courses.map(course => (
                                        <button
                                            key={course.id}
                                            onClick={() => setSelectedCourseId(course.id)}
                                            className={`w-full group text-left p-5 rounded-[1.5rem] transition-all duration-300 border ${selectedCourseId === course.id
                                                ? "bg-[#0D2D5A] border-[#0D2D5A] text-white shadow-xl shadow-blue-900/10"
                                                : "bg-white border-gray-100 hover:border-blue-200"
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <Badge className={`${selectedCourseId === course.id ? 'bg-white/20 text-white' : STATUS_STYLES[course.status].bg + ' ' + STATUS_STYLES[course.status].text} border-none font-black text-[9px] uppercase tracking-widest px-2`}>
                                                    {STATUS_STYLES[course.status].label}
                                                </Badge>
                                                <div className={`text-[10px] font-black uppercase tracking-widest ${selectedCourseId === course.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {course.level}
                                                </div>
                                            </div>
                                            <h3 className="font-black text-lg leading-tight mb-1 group-hover:translate-x-1 transition-transform">{course.title}</h3>
                                            <div className={`text-xs font-bold flex items-center gap-2 ${selectedCourseId === course.id ? 'text-blue-100/60' : 'text-gray-400'}`}>
                                                <BookOpen className="w-3 h-3" /> {course.lessons.length} Leçons
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {selectedCourse && (
                        <Card className="rounded-[2rem] border-none shadow-sm bg-[#1A6CC8] text-white p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Actions de gestion</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="secondary" className="rounded-xl h-12 font-bold text-xs" onClick={() => setDrawers(p => ({ ...p, lesson: true }))}>+ Leçon</Button>
                                <Button variant="secondary" className="rounded-xl h-12 font-bold text-xs" onClick={() => setDrawers(p => ({ ...p, enroll: true }))}>+ Élève</Button>
                            </div>
                        </Card>
                    )}
                </div>

                {/* Editor Space */}
                <div className="space-y-6">
                    {selectedCourse ? (
                        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm min-h-[600px] flex flex-col">
                            {/* Course Toolbar */}
                            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 rounded-2xl text-[#1A6CC8]">
                                        <GraduationCap className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-[#0D2D5A]">{selectedCourse.title}</h2>
                                        <p className="text-sm font-medium text-gray-400">{selectedCourse.description}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" className="rounded-xl font-bold h-11 border-gray-100">Modifier Infos</Button>
                                    <Button className="bg-green-600 hover:bg-green-700 rounded-xl font-bold h-11">Publier</Button>
                                </div>
                            </div>

                            <div className="flex-1 p-8">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Structure du Parcours (DND)</h3>

                                <Reorder.Group axis="y" values={reorderLessons} onReorder={setReorderLessons} className="space-y-4">
                                    {reorderLessons.map((lesson) => (
                                        <Reorder.Item
                                            key={lesson.id}
                                            value={lesson}
                                            className={`p-6 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-center gap-6 cursor-grab active:cursor-grabbing hover:bg-white hover:shadow-xl transition-all group ${selectedLessonId === lesson.id ? 'ring-2 ring-blue-500 bg-white' : ''}`}
                                            onClick={() => setSelectedLessonId(lesson.id)}
                                        >
                                            <GripVertical className="text-gray-300 group-hover:text-blue-500 transition-colors" />
                                            <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 flex items-center justify-center font-black text-[#1A6CC8]">
                                                {lesson.order}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-black text-[#0D2D5A] group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    {lesson.videoUrl && <Badge variant="outline" className="text-[9px] bg-blue-50 border-none flex items-center gap-1"><Video className="w-2 h-2" /> Vidéo</Badge>}
                                                    {lesson.quiz && <Badge variant="outline" className="text-[9px] bg-green-50 border-none flex items-center gap-1"><ClipboardList className="w-2 h-2" /> Quiz Pret</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!lesson.quiz && <Button size="sm" variant="ghost" className="text-orange-500 font-bold hover:bg-orange-50" onClick={(e) => { e.stopPropagation(); setDrawers(p => ({ ...p, quiz: true })); }}>Fix Quiz</Button>}
                                                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-600 rounded-full"><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>

                                {reorderLessons.length === 0 && (
                                    <div className="text-center py-20 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100 flex flex-col items-center gap-4">
                                        <BookOpen className="w-12 h-12 text-gray-200" />
                                        <p className="text-gray-400 font-bold">Commencez par ajouter votre première leçon.</p>
                                        <Button className="rounded-xl px-8" onClick={() => setDrawers(p => ({ ...p, lesson: true }))}>+ Ajouter Leçon</Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full min-h-[600px] border-2 border-dashed border-gray-100 rounded-[3rem] bg-white/30 backdrop-blur">
                            <img src="/logo/Care 4 Success-logo-Ok_compact.png" className="w-24 opacity-10 mb-6" />
                            <h2 className="text-2xl font-black text-gray-300 uppercase tracking-widest">Studio d'Edition</h2>
                            <p className="text-gray-400 font-medium mt-2">Sélectionnez un parcours dans la barre latérale pour commencer l'édition.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- DRAWERS (FORMS) --- */}

            {/* Course Drawer */}
            <Drawer open={drawers.course} onOpenChange={(o) => setDrawers(p => ({ ...p, course: o }))}>
                <DrawerContent className="max-h-[90vh]">
                    <div className="mx-auto w-full max-w-lg p-8 space-y-6">
                        <DrawerHeader className="p-0"><DrawerTitle className="text-3xl font-black tracking-tight">Nouveau Parcours</DrawerTitle></DrawerHeader>
                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); courseMutation.mutate(courseForm); }}>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Titre du parcours</Label><Input className="rounded-2xl h-12 border-gray-100 bg-gray-50/50" value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value }))} required /></div>
                            <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</Label><Textarea className="rounded-2xl border-gray-100 bg-gray-50/50 min-h-[100px]" value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Matière</Label><Input className="rounded-xl h-11" value={courseForm.subject} onChange={e => setCourseForm(p => ({ ...p, subject: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Niveau</Label><Input className="rounded-xl h-11" value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))} /></div>
                            </div>
                            <Button type="submit" className="w-full bg-[#1A6CC8] h-14 rounded-[1.5rem] font-black" disabled={courseMutation.isPending}>{courseMutation.isPending ? "Création..." : "Créer le catalogue"}</Button>
                        </form>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Lesson Drawer with Rich UI */}
            <Drawer open={drawers.lesson} onOpenChange={(o) => setDrawers(p => ({ ...p, lesson: o }))}>
                <DrawerContent className="max-h-[90vh]">
                    <div className="mx-auto w-full max-w-2xl p-8 space-y-6">
                        <DrawerHeader className="p-0"><DrawerTitle className="text-3xl font-black tracking-tight">Ajouter une Leçon</DrawerTitle></DrawerHeader>
                        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); if (selectedCourseId) lessonMutation.mutate({ courseId: selectedCourseId, payload: lessonForm }); }}>
                            <Input placeholder="Titre de la leçon..." className="rounded-2xl h-12 text-lg font-bold border-gray-100" value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} required />

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Contenu Pédagogique (Rich UI)</Label>
                                <div className="border border-gray-100 rounded-[2rem] overflow-hidden bg-white shadow-sm">
                                    <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-100">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleFormat('bold')}><Bold className="w-4 h-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleFormat('italic')}><Italic className="w-4 h-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleFormat('list')}><List className="w-4 h-4" /></Button>
                                    </div>
                                    <textarea id="lesson-content" className="w-full h-48 p-4 text-sm focus:outline-none resize-none" placeholder="Rédigez le cours ici..." value={lessonForm.content} onChange={e => setLessonForm(p => ({ ...p, content: e.target.value }))} required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Vidéo YouTube (Lien)</Label><Input className="rounded-xl h-11" placeholder="https://..." value={lessonForm.videoUrl} onChange={e => setLessonForm(p => ({ ...p, videoUrl: e.target.value }))} /></div>
                                <div className="space-y-1.5"><Label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Position</Label><Input type="number" className="rounded-xl h-11" value={lessonForm.order} onChange={e => setLessonForm(p => ({ ...p, order: Number(e.target.value) }))} /></div>
                            </div>
                            <Button type="submit" className="w-full bg-[#1A6CC8] h-14 rounded-[1.5rem] font-black" disabled={lessonMutation.isPending}>Finaliser la leçon</Button>
                        </form>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Quiz & Question Drawer would follow same pattern - truncated for brevity but functionality preserved */}
            <Drawer open={drawers.quiz} onOpenChange={(o) => setDrawers(p => ({ ...p, quiz: o }))}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-lg p-8 space-y-6">
                        <DrawerHeader className="p-0"><DrawerTitle className="text-2xl font-black">Créer un Quiz</DrawerTitle></DrawerHeader>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (selectedLessonId) quizMutation.mutate({ lessonId: selectedLessonId, payload: quizForm }) }}>
                            <div className="space-y-1.5"><Label>Titre du Quiz</Label><Input value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} required /></div>
                            <div className="space-y-1.5"><Label>Consignes</Label><Textarea value={quizForm.instructions} onChange={e => setQuizForm(p => ({ ...p, instructions: e.target.value }))} /></div>
                            <div className="space-y-1.5"><Label>Total de points</Label><Input type="number" value={quizForm.totalPoints} onChange={e => setQuizForm(p => ({ ...p, totalPoints: Number(e.target.value) }))} /></div>
                            <Button type="submit" className="w-full bg-[#1A6CC8]">Enregistrer le Quiz</Button>
                        </form>
                    </div>
                </DrawerContent>
            </Drawer>

            <Drawer open={drawers.question} onOpenChange={(o) => setDrawers(p => ({ ...p, question: o }))}>
                <DrawerContent className="max-h-[95vh]">
                    <div className="mx-auto w-full max-w-2xl p-8 space-y-6 flex flex-col">
                        <DrawerHeader className="p-0"><DrawerTitle className="text-2xl font-black">Question Bank Editor</DrawerTitle></DrawerHeader>
                        <div className="grid md:grid-cols-2 gap-8 flex-1">
                            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (selectedLesson?.quiz?.id) questionMutation.mutate({ quizId: selectedLesson.quiz.id, payload: questionForm }) }}>
                                <div className="space-y-1.5"><Label>Intitulé de la question</Label><Textarea className="h-32" value={questionForm.prompt} onChange={e => setQuestionForm(p => ({ ...p, prompt: e.target.value }))} required /></div>
                                <div className="space-y-2">
                                    <Label>Options (A, B, C...)</Label>
                                    {questionForm.choices.map((c, i) => (
                                        <div key={c.id} className="flex gap-2">
                                            <Input value={c.label} onChange={(e) => {
                                                const newChoices = [...questionForm.choices];
                                                newChoices[i].label = e.target.value;
                                                setQuestionForm(p => ({ ...p, choices: newChoices }));
                                            }} placeholder={`Réponse ${c.id}...`} />
                                            <Button type="button" variant={questionForm.correctAnswer === c.id ? "default" : "outline"} onClick={() => setQuestionForm(p => ({ ...p, correctAnswer: c.id }))}>
                                                {questionForm.correctAnswer === c.id ? "Bonne" : ""}
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="ghost" onClick={() => setQuestionForm(p => ({ ...p, choices: [...p.choices, { id: String.fromCharCode(65 + p.choices.length), label: "" }] }))}>+ Ajouter option</Button>
                                </div>
                                <Button type="submit" className="w-full bg-[#1A6CC8] h-12">Sauvegarder Question</Button>
                            </form>

                            <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100">
                                <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-4">Questions enregistrées</h4>
                                <ScrollArea className="h-[400px]">
                                    <div className="space-y-4">
                                        {selectedLesson?.quiz?.questions?.map((q: any, i: number) => (
                                            <div key={i} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                                                <Badge className="absolute -top-2 -left-2 bg-blue-500">{i + 1}</Badge>
                                                <p className="text-sm font-bold text-[#0D2D5A] pr-6">{q.prompt}</p>
                                                <div className="mt-2 text-[10px] font-bold text-green-600">Correct: {q.correctAnswer}</div>
                                            </div>
                                        ))}
                                        {(!selectedLesson?.quiz?.questions || selectedLesson.quiz.questions.length === 0) && <p className="text-gray-400 text-xs italic">Aucune question.</p>}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>

            <Drawer open={drawers.enroll} onOpenChange={(o) => setDrawers(p => ({ ...p, enroll: o }))}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-lg p-8 space-y-6">
                        <DrawerHeader className="p-0"><DrawerTitle className="text-2xl font-black">Assigner un Élève</DrawerTitle></DrawerHeader>
                        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (selectedCourseId) assignStudentMutation.mutate({ courseId: selectedCourseId, payload: enrollmentForm }) }}>
                            <div className="space-y-1.5"><Label>ID Élève</Label><Input value={enrollmentForm.studentId} onChange={e => setEnrollmentForm(p => ({ ...p, studentId: e.target.value }))} required /></div>
                            <div className="space-y-1.5"><Label>Nom Complet</Label><Input value={enrollmentForm.studentName} onChange={e => setEnrollmentForm(p => ({ ...p, studentName: e.target.value }))} required /></div>
                            <Button type="submit" className="w-full bg-[#1A6CC8]">Assigner au Parcours</Button>
                        </form>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}

function ScrollArea({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <div className={`overflow-y-auto ${className}`} style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {children}
        </div>
    );
}

function Card({ children, className, p }: { children: React.ReactNode, className?: string, p?: string }) {
    return (
        <div className={`rounded-2xl ${className}`}>
            {children}
        </div>
    );
}
