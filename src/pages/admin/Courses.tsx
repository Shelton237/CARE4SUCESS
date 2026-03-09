import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import type { CourseLesson, CourseStatus, CourseSummary } from "@/integrations/supabase/types";
import { BookOpen, ClipboardList, GraduationCap, Loader2, PlusCircle, Users, ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";

type CourseFormState = {
    title: string;
    description: string;
    subject: string;
    level: string;
    status: CourseStatus;
    coverUrl: string;
};

type LessonFormState = {
    title: string;
    content: string;
    videoUrl: string;
    order: number;
};

type QuizFormState = {
    title: string;
    instructions: string;
    totalPoints: number;
};

type QuestionChoiceForm = { id: string; label: string };

type QuestionFormState = {
    prompt: string;
    choices: QuestionChoiceForm[];
    correctAnswer: string;
    points: number;
};

type EnrollmentFormState = {
    studentId: string;
    studentName: string;
};

const STATUS_STYLES: Record<CourseStatus, { bg: string; text: string }> = {
    draft: { bg: "bg-amber-50", text: "text-amber-700" },
    published: { bg: "bg-emerald-50", text: "text-emerald-700" },
};

const INITIAL_COURSE_FORM: CourseFormState = {
    title: "",
    description: "",
    subject: "",
    level: "",
    status: "draft",
    coverUrl: "",
};

const INITIAL_LESSON_FORM: LessonFormState = {
    title: "",
    content: "",
    videoUrl: "",
    order: 1,
};

const INITIAL_QUIZ_FORM: QuizFormState = {
    title: "",
    instructions: "",
    totalPoints: 10,
};

const makeQuestionForm = (): QuestionFormState => ({
    prompt: "",
    choices: [
        { id: "A", label: "" },
        { id: "B", label: "" },
        { id: "C", label: "" },
    ],
    correctAnswer: "A",
    points: 2,
});

const INITIAL_ENROLLMENT_FORM: EnrollmentFormState = {
    studentId: "",
    studentName: "",
};

const nextChoiceId = (index: number) => String.fromCharCode(65 + index);

const upsertCourseList = (list: CourseSummary[] | undefined, course: CourseSummary): CourseSummary[] => {
    if (!list || list.length === 0) {
        return [course];
    }
    const idx = list.findIndex((item) => item.id === course.id);
    if (idx === -1) {
        return [course, ...list];
    }
    const clone = list.slice();
    clone[idx] = course;
    return clone;
};
export default function AdminCourses() {
    const { toast } = useToast();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
    const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 4;
    const [courseForm, setCourseForm] = useState<CourseFormState>(INITIAL_COURSE_FORM);
    const [lessonForm, setLessonForm] = useState<LessonFormState>(INITIAL_LESSON_FORM);
    const [quizForm, setQuizForm] = useState<QuizFormState>(INITIAL_QUIZ_FORM);
    const [questionForm, setQuestionForm] = useState<QuestionFormState>(makeQuestionForm);
    const [enrollmentForm, setEnrollmentForm] = useState<EnrollmentFormState>(INITIAL_ENROLLMENT_FORM);

    const {
        data: coursesData,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey: ["courses", "admin"],
        queryFn: () => fetchCourses("admin"),
        staleTime: 30_000,
    });

    const courses = useMemo(() => coursesData ?? [], [coursesData]);

    const paginatedCourses = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return courses.slice(start, start + itemsPerPage);
    }, [courses, currentPage]);

    const totalPages = Math.ceil(courses.length / itemsPerPage);

    const selectedCourse = useMemo(
        () => courses.find((course) => course.id === selectedCourseId) ?? null,
        [courses, selectedCourseId]
    );
    const selectedLesson: CourseLesson | null = useMemo(() => {
        if (!selectedCourse || !selectedLessonId) return null;
        return selectedCourse.lessons.find((lesson) => lesson.id === selectedLessonId) ?? null;
    }, [selectedCourse, selectedLessonId]);

    useEffect(() => {
        if (!selectedCourseId && courses.length > 0) {
            setSelectedCourseId(courses[0].id);
            return;
        }
        if (selectedCourseId && !courses.some((course) => course.id === selectedCourseId)) {
            setSelectedCourseId(courses[0]?.id ?? null);
        }
    }, [courses, selectedCourseId]);

    useEffect(() => {
        if (!selectedCourse) {
            if (selectedLessonId) {
                setSelectedLessonId(null);
            }
            return;
        }
        if (!selectedLessonId && selectedCourse.lessons.length > 0) {
            setSelectedLessonId(selectedCourse.lessons[0].id);
            return;
        }
        if (selectedLessonId && !selectedCourse.lessons.some((lesson) => lesson.id === selectedLessonId)) {
            setSelectedLessonId(selectedCourse.lessons[0]?.id ?? null);
        }
    }, [selectedCourse, selectedLessonId]);

    const syncCourse = (course: CourseSummary) => {
        queryClient.setQueryData<CourseSummary[]>(["courses", "admin"], (prev) => upsertCourseList(prev, course));
        queryClient.invalidateQueries({ queryKey: ["courses"], exact: false, refetchType: "active" });
    };

    const createCourseMutation = useMutation({
        mutationFn: createCourse,
        onSuccess: (course) => {
            syncCourse(course);
            setSelectedCourseId(course.id);
            setCourseForm(INITIAL_COURSE_FORM);
            toast({
                title: "Cours cree",
                description: "Ajoutez une premiere lecon pour publier du contenu.",
            });
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur creation",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const createLessonMutation = useMutation({
        mutationFn: ({
            courseId,
            payload,
        }: {
            courseId: string;
            payload: { title: string; content: string; videoUrl?: string; order: number };
        }) => createCourseLesson(courseId, payload),
        onSuccess: (course) => {
            syncCourse(course);
            setLessonForm(INITIAL_LESSON_FORM);
            toast({
                title: "Lecon ajoutee",
                description: "Vous pouvez maintenant associer un quiz.",
            });
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur lecon",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const createQuizMutation = useMutation({
        mutationFn: ({
            lessonId,
            payload,
        }: {
            lessonId: string;
            payload: { title: string; instructions?: string; totalPoints: number };
        }) => createLessonQuiz(lessonId, payload),
        onSuccess: ({ course }) => {
            syncCourse(course);
            setQuizForm(INITIAL_QUIZ_FORM);
            toast({
                title: "Quiz cree",
                description: "Ajoutez vos premieres questions.",
            });
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur quiz",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const createQuestionMutation = useMutation({
        mutationFn: ({
            quizId,
            payload,
        }: {
            quizId: string;
            payload: { prompt: string; choices: QuestionChoiceForm[]; correctAnswer: string; points: number };
        }) => createQuizQuestion(quizId, payload),
        onSuccess: (course) => {
            syncCourse(course);
            setQuestionForm(makeQuestionForm());
            toast({
                title: "Question ajoutee",
                description: "Continuez a completer le quiz.",
            });
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur question",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const assignStudentMutation = useMutation({
        mutationFn: ({
            courseId,
            payload,
        }: {
            courseId: string;
            payload: { studentId: string; studentName: string; assignedBy?: string };
        }) => assignCourseToStudent(courseId, payload),
        onSuccess: (course) => {
            syncCourse(course);
            setEnrollmentForm(INITIAL_ENROLLMENT_FORM);
            toast({
                title: "Eleve assigne",
                description: "Le cours est accessible cote eleve.",
            });
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur assignation",
                description: err.message,
                variant: "destructive",
            });
        },
    });
    const handleCreateCourse = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (
            !courseForm.title.trim() ||
            !courseForm.description.trim() ||
            !courseForm.subject.trim() ||
            !courseForm.level.trim()
        ) {
            toast({
                title: "Champs requis",
                description: "Titre, description, matiere et niveau sont obligatoires.",
                variant: "destructive",
            });
            return;
        }
        createCourseMutation.mutate({
            title: courseForm.title.trim(),
            description: courseForm.description.trim(),
            subject: courseForm.subject.trim(),
            level: courseForm.level.trim(),
            status: courseForm.status,
            coverUrl: courseForm.coverUrl.trim() || undefined,
            createdBy: user?.id ?? user?.name ?? undefined,
        });
    };

    const handleCreateLesson = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedCourseId) {
            toast({
                title: "Cours manquant",
                description: "Selectionnez un cours.",
                variant: "destructive",
            });
            return;
        }
        if (!lessonForm.title.trim() || !lessonForm.content.trim()) {
            toast({
                title: "Champs requis",
                description: "La lecon doit avoir un titre et un contenu.",
                variant: "destructive",
            });
            return;
        }
        const order = Number.isFinite(lessonForm.order) ? lessonForm.order : 1;
        createLessonMutation.mutate({
            courseId: selectedCourseId,
            payload: {
                title: lessonForm.title.trim(),
                content: lessonForm.content.trim(),
                videoUrl: lessonForm.videoUrl.trim() || undefined,
                order,
            },
        });
    };

    const handleCreateQuiz = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedLesson?.id) {
            toast({
                title: "Lecon manquante",
                description: "Choisissez une lecon.",
                variant: "destructive",
            });
            return;
        }
        if (!quizForm.title.trim()) {
            toast({
                title: "Titre requis",
                description: "Donnez un titre au quiz.",
                variant: "destructive",
            });
            return;
        }
        const points = Number(quizForm.totalPoints) || 0;
        createQuizMutation.mutate({
            lessonId: selectedLesson.id,
            payload: {
                title: quizForm.title.trim(),
                instructions: quizForm.instructions.trim() || undefined,
                totalPoints: points,
            },
        });
    };

    const handleCreateQuestion = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const quizId = selectedLesson?.quiz?.id;
        if (!quizId) {
            toast({
                title: "Quiz introuvable",
                description: "Creez un quiz pour cette lecon.",
                variant: "destructive",
            });
            return;
        }
        const choices = questionForm.choices
            .map((choice) => ({ ...choice, label: choice.label.trim() }))
            .filter((choice) => choice.label.length > 0);
        if (choices.length < 2) {
            toast({
                title: "Choix insuffisants",
                description: "Ajoutez au moins deux options.",
                variant: "destructive",
            });
            return;
        }
        if (!choices.some((choice) => choice.id === questionForm.correctAnswer)) {
            toast({
                title: "Bonne reponse invalide",
                description: "Choisissez une reponse parmi les options.",
                variant: "destructive",
            });
            return;
        }
        if (!questionForm.prompt.trim()) {
            toast({
                title: "Question manquante",
                description: "Renseignez l'intitule de la question.",
                variant: "destructive",
            });
            return;
        }
        const points = Number(questionForm.points) || 1;
        createQuestionMutation.mutate({
            quizId,
            payload: {
                prompt: questionForm.prompt.trim(),
                choices,
                correctAnswer: questionForm.correctAnswer,
                points,
            },
        });
    };

    const handleAssignStudent = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedCourseId) {
            toast({
                title: "Cours manquant",
                description: "Selectionnez un cours avant l'assignation.",
                variant: "destructive",
            });
            return;
        }
        if (!enrollmentForm.studentId.trim() || !enrollmentForm.studentName.trim()) {
            toast({
                title: "Informations incompletes",
                description: "Precisez l'identifiant et le nom de l'eleve.",
                variant: "destructive",
            });
            return;
        }
        assignStudentMutation.mutate({
            courseId: selectedCourseId,
            payload: {
                studentId: enrollmentForm.studentId.trim(),
                studentName: enrollmentForm.studentName.trim(),
                assignedBy: user?.name ?? "admin",
            },
        });
    };

    const addChoiceField = () => {
        setQuestionForm((prev) => {
            const newId = nextChoiceId(prev.choices.length);
            return {
                ...prev,
                choices: [...prev.choices, { id: newId, label: "" }],
                correctAnswer: prev.correctAnswer || newId,
            };
        });
    };

    const updateChoiceLabel = (index: number, label: string) => {
        setQuestionForm((prev) => {
            const updated = prev.choices.map((choice, idx) => (idx === index ? { ...choice, label } : choice));
            return { ...prev, choices: updated };
        });
    };
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Cours & quiz</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Construisez les parcours pedagogiques et activez les quiz interactifs pour tous les roles.
                </p>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-2xl p-4">
                    {error instanceof Error ? error.message : "Impossible de recuperer les cours."}
                </div>
            )}

            <div className="grid xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="space-y-6">
                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-4 h-4 text-[#1A6CC8]" />
                            <div>
                                <h2 className="text-sm font-semibold text-[#0D2D5A]">Cours configures</h2>
                                <p className="text-xs text-gray-400">Selectionnez un parcours pour le detailler.</p>
                            </div>
                        </div>
                        {isLoading ? (
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Chargement des cours...
                            </div>
                        ) : courses.length === 0 ? (
                            <p className="text-sm text-gray-400">Aucun cours pour le moment.</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {paginatedCourses.map((c) => {
                                        const badgeColor = STATUS_STYLES[c.status];
                                        const isSelected = selectedCourseId === c.id;
                                        return (
                                            <button
                                                key={c.id}
                                                onClick={() => setSelectedCourseId(c.id)}
                                                className={`flex flex-col text-left border rounded-2xl overflow-hidden transition h-full ${isSelected
                                                    ? "border-[#1A6CC8] ring-2 ring-[#1A6CC8]/10 shadow-md bg-blue-50/30"
                                                    : "border-gray-100 hover:border-[#1A6CC8]/40 hover:shadow-sm bg-white"
                                                    }`}
                                            >
                                                {c.coverUrl ? (
                                                    <div className="h-24 w-full overflow-hidden shrink-0">
                                                        <img src={c.coverUrl} className="w-full h-full object-cover" alt="" />
                                                    </div>
                                                ) : (
                                                    <div className="h-24 w-full bg-[#1A6CC8]/5 flex items-center justify-center shrink-0">
                                                        <LayoutGrid className="w-8 h-8 text-[#1A6CC8]/20" />
                                                    </div>
                                                )}
                                                <div className="p-4 space-y-2 flex-1 flex flex-col">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <h3 className="font-bold text-[#0D2D5A] text-sm line-clamp-1">{c.title}</h3>
                                                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${badgeColor.bg} ${badgeColor.text}`}>
                                                            {c.status === 'draft' ? 'Brouillon' : 'Public'}
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed flex-1">
                                                        {c.description}
                                                    </p>
                                                    <div className="pt-3 flex items-center justify-between border-t border-gray-50">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-semibold text-[#1A6CC8]">{c.subject}</span>
                                                            <span className="text-[9px] text-gray-400 capitalize">{c.level}</span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-[#0D2D5A] bg-gray-100 px-2 py-0.5 rounded-lg">
                                                            {c.lessons.length} leçons
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {totalPages > 1 && (
                                    <div className="flex items-center justify-center gap-2 pt-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full border-gray-200 hover:border-[#1A6CC8] hover:text-[#1A6CC8]"
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <div className="flex items-center gap-1">
                                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                                <button
                                                    key={page}
                                                    onClick={() => setCurrentPage(page)}
                                                    className={`w-8 h-8 rounded-full text-xs font-bold transition-all ${currentPage === page
                                                        ? "bg-[#1A6CC8] text-white shadow-lg shadow-blue-200"
                                                        : "text-gray-400 hover:bg-gray-100"
                                                        }`}
                                                >
                                                    {page}
                                                </button>
                                            ))}
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            className="h-8 w-8 rounded-full border-gray-200 hover:border-[#1A6CC8] hover:text-[#1A6CC8]"
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center gap-2 mb-4">
                            <ClipboardList className="w-4 h-4 text-[#1A6CC8]" />
                            <div>
                                <h2 className="text-sm font-semibold text-[#0D2D5A]">Lecons & quiz</h2>
                                <p className="text-xs text-gray-400">Visualisez la structure du cours selectionne.</p>
                            </div>
                        </div>
                        {selectedCourse ? (
                            selectedCourse.lessons.length === 0 ? (
                                <p className="text-sm text-gray-400">Ce cours n'a pas encore de leçons.</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedCourse.lessons.map((lesson) => {
                                        const hasQuiz = Boolean(lesson.quiz);
                                        const activeLesson = selectedLessonId === lesson.id;
                                        return (
                                            <button
                                                key={lesson.id}
                                                onClick={() => setSelectedLessonId(lesson.id)}
                                                className={`w-full text-left border rounded-2xl px-4 py-3 transition ${activeLesson
                                                    ? "border-[#1A6CC8] bg-[#1A6CC8]/5"
                                                    : "border-gray-100 hover:border-[#1A6CC8]/40"
                                                    }`}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="font-semibold text-[#0D2D5A] text-sm">{lesson.title}</div>
                                                        <div className="text-xs text-gray-400 mt-0.5">
                                                            Ordre {lesson.order} - {lesson.quiz ? "Quiz pret" : "Pas de quiz"}
                                                        </div>
                                                    </div>
                                                    {hasQuiz ? (
                                                        <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">
                                                            Quiz
                                                        </span>
                                                    ) : (
                                                        <span className="text-[11px] font-semibold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full uppercase">
                                                            Info
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lesson.content}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            )
                        ) : (
                            <p className="text-sm text-gray-400">Choisissez un cours pour voir ses lecons.</p>
                        )}
                    </div>

                    {selectedLesson && selectedLesson.quiz && (
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 mb-3">
                                <GraduationCap className="w-4 h-4 text-[#1A6CC8]" />
                                <div>
                                    <h2 className="text-sm font-semibold text-[#0D2D5A]">Quiz actif</h2>
                                    <p className="text-xs text-gray-400">
                                        {selectedLesson.quiz.questions?.length ?? 0} question(s) configuree(s)
                                    </p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                <div className="font-semibold text-[#0D2D5A]">{selectedLesson.quiz.title}</div>
                                {selectedLesson.quiz.instructions && (
                                    <p className="text-xs text-gray-500">{selectedLesson.quiz.instructions}</p>
                                )}
                                <div className="text-xs text-gray-500">
                                    Total: {selectedLesson.quiz.totalPoints} point(s)
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="space-y-6">
                    {user?.role === 'admin' ? (
                        <div className="bg-[#0D2D5A]/5 border border-[#0D2D5A]/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <BookOpen className="w-8 h-8 text-[#0D2D5A]" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-[#0D2D5A]">Mode Consultation</h2>
                                <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                                    En tant qu'administrateur, vous pouvez consulter les parcours pédagogiques.
                                    La création et la modification sont réservées aux responsables pédagogiques.
                                </p>
                            </div>
                            <div className="flex flex-col gap-2 w-full pt-4">
                                <div className="bg-white p-4 rounded-xl border border-gray-100 text-left">
                                    <h3 className="text-xs font-bold text-[#0D2D5A] uppercase tracking-wider mb-2">Détails de la sélection</h3>
                                    {selectedCourse ? (
                                        <div className="space-y-2">
                                            <div className="text-sm font-semibold text-[#0D2D5A]">{selectedCourse.title}</div>
                                            <div className="text-xs text-gray-500">{selectedCourse.description}</div>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded-full">{selectedCourse.subject}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 rounded-full">{selectedCourse.level}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-400 italic">Aucun parcours sélectionné</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <PlusCircle className="w-4 h-4 text-[#1A6CC8]" />
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#0D2D5A]">Nouveau cours</h2>
                                        <p className="text-xs text-gray-400">Structurez un parcours complet.</p>
                                    </div>
                                </div>
                                <form className="space-y-4" onSubmit={handleCreateCourse}>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <Label htmlFor="course-title">Titre</Label>
                                            <Input
                                                id="course-title"
                                                value={courseForm.title}
                                                onChange={(event) => setCourseForm((prev) => ({ ...prev, title: event.target.value }))}
                                                placeholder="Programme sciences college"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="course-subject">Matiere</Label>
                                            <Input
                                                id="course-subject"
                                                value={courseForm.subject}
                                                onChange={(event) =>
                                                    setCourseForm((prev) => ({ ...prev, subject: event.target.value }))
                                                }
                                                placeholder="Mathematiques"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="course-level">Niveau</Label>
                                            <Input
                                                id="course-level"
                                                value={courseForm.level}
                                                onChange={(event) =>
                                                    setCourseForm((prev) => ({ ...prev, level: event.target.value }))
                                                }
                                                placeholder="3e"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="course-status">Statut</Label>
                                            <select
                                                id="course-status"
                                                value={courseForm.status}
                                                onChange={(event) =>
                                                    setCourseForm((prev) => ({ ...prev, status: event.target.value as CourseStatus }))
                                                }
                                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]"
                                            >
                                                <option value="draft">Brouillon</option>
                                                <option value="published">Publie</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="course-description">Description</Label>
                                        <Textarea
                                            id="course-description"
                                            value={courseForm.description}
                                            onChange={(event) =>
                                                setCourseForm((prev) => ({ ...prev, description: event.target.value }))
                                            }
                                            rows={3}
                                            placeholder="Objectifs pedagogiques et contenu du parcours"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="course-cover">Image (optionnel)</Label>
                                        <Input
                                            id="course-cover"
                                            value={courseForm.coverUrl}
                                            onChange={(event) =>
                                                setCourseForm((prev) => ({ ...prev, coverUrl: event.target.value }))
                                            }
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button type="submit" disabled={createCourseMutation.isPending} className="w-full">
                                        {createCourseMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Creer le cours
                                    </Button>
                                </form>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <BookOpen className="w-4 h-4 text-[#1A6CC8]" />
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#0D2D5A]">Ajouter une lecon</h2>
                                        <p className="text-xs text-gray-400">Reliez-la a un cours existant.</p>
                                    </div>
                                </div>
                                <form className="space-y-4" onSubmit={handleCreateLesson}>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lesson-course">Cours cible</Label>
                                        <select
                                            id="lesson-course"
                                            value={selectedCourseId ?? ""}
                                            onChange={(event) =>
                                                setSelectedCourseId(event.target.value ? event.target.value : null)
                                            }
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]"
                                        >
                                            <option value="">Selectionner un cours</option>
                                            {courses.map((course) => (
                                                <option key={course.id} value={course.id}>
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lesson-title">Titre</Label>
                                        <Input
                                            id="lesson-title"
                                            value={lessonForm.title}
                                            onChange={(event) => setLessonForm((prev) => ({ ...prev, title: event.target.value }))}
                                            placeholder="Ex: Notion de pourcentage"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lesson-order">Ordre</Label>
                                        <Input
                                            id="lesson-order"
                                            type="number"
                                            min={1}
                                            value={lessonForm.order}
                                            onChange={(event) =>
                                                setLessonForm((prev) => ({ ...prev, order: Number(event.target.value) }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lesson-content">Contenu</Label>
                                        <Textarea
                                            id="lesson-content"
                                            value={lessonForm.content}
                                            onChange={(event) =>
                                                setLessonForm((prev) => ({ ...prev, content: event.target.value }))
                                            }
                                            rows={3}
                                            placeholder="Points abordes, activites, ressources..."
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="lesson-video">Lien video (optionnel)</Label>
                                        <Input
                                            id="lesson-video"
                                            value={lessonForm.videoUrl}
                                            onChange={(event) =>
                                                setLessonForm((prev) => ({ ...prev, videoUrl: event.target.value }))
                                            }
                                            placeholder="https://youtube..."
                                        />
                                    </div>
                                    <Button type="submit" disabled={createLessonMutation.isPending} className="w-full">
                                        {createLessonMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Ajouter la lecon
                                    </Button>
                                </form>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <ClipboardList className="w-4 h-4 text-[#1A6CC8]" />
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#0D2D5A]">Quiz</h2>
                                        <p className="text-xs text-gray-400">Creez le quiz puis ajoutez les questions.</p>
                                    </div>
                                </div>
                                <form className="space-y-4" onSubmit={handleCreateQuiz}>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-lesson">Lecon cible</Label>
                                        <select
                                            id="quiz-lesson"
                                            value={selectedLessonId ?? ""}
                                            disabled={!selectedCourse || (selectedCourse.lessons?.length ?? 0) === 0}
                                            onChange={(event) =>
                                                setSelectedLessonId(event.target.value ? event.target.value : null)
                                            }
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8] disabled:bg-gray-50 disabled:text-gray-400"
                                        >
                                            <option value="">Selectionner une lecon</option>
                                            {selectedCourse?.lessons.map((lesson) => (
                                                <option key={lesson.id} value={lesson.id}>
                                                    {lesson.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-title">Titre du quiz</Label>
                                        <Input
                                            id="quiz-title"
                                            value={quizForm.title}
                                            onChange={(event) => setQuizForm((prev) => ({ ...prev, title: event.target.value }))}
                                            placeholder="Evaluation chapitre 1"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-points">Total de points</Label>
                                        <Input
                                            id="quiz-points"
                                            type="number"
                                            min={0}
                                            value={quizForm.totalPoints}
                                            onChange={(event) =>
                                                setQuizForm((prev) => ({ ...prev, totalPoints: Number(event.target.value) }))
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="quiz-instructions">Consignes (optionnel)</Label>
                                        <Textarea
                                            id="quiz-instructions"
                                            value={quizForm.instructions}
                                            onChange={(event) =>
                                                setQuizForm((prev) => ({ ...prev, instructions: event.target.value }))
                                            }
                                            rows={3}
                                        />
                                    </div>
                                    <Button type="submit" disabled={createQuizMutation.isPending} className="w-full">
                                        {createQuizMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Valider le quiz
                                    </Button>
                                </form>

                                <div className="mt-6 border-t border-gray-100 pt-6">
                                    <form className="space-y-4" onSubmit={handleCreateQuestion}>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="question-prompt">Question</Label>
                                            <Textarea
                                                id="question-prompt"
                                                value={questionForm.prompt}
                                                onChange={(event) =>
                                                    setQuestionForm((prev) => ({ ...prev, prompt: event.target.value }))
                                                }
                                                rows={3}
                                                placeholder="Intitule de la question"
                                            />
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="question-points">Points</Label>
                                                <Input
                                                    id="question-points"
                                                    type="number"
                                                    min={1}
                                                    value={questionForm.points}
                                                    onChange={(event) =>
                                                        setQuestionForm((prev) => ({ ...prev, points: Number(event.target.value) }))
                                                    }
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="question-answer">Bonne reponse</Label>
                                                <select
                                                    id="question-answer"
                                                    value={questionForm.correctAnswer}
                                                    onChange={(event) =>
                                                        setQuestionForm((prev) => ({ ...prev, correctAnswer: event.target.value }))
                                                    }
                                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]"
                                                >
                                                    {questionForm.choices.map((choice) => (
                                                        <option key={choice.id} value={choice.id}>
                                                            Option {choice.id}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label>Options</Label>
                                                <button
                                                    type="button"
                                                    onClick={addChoiceField}
                                                    className="text-xs font-semibold text-[#1A6CC8] hover:underline"
                                                >
                                                    Ajouter une option
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {questionForm.choices.map((choice, index) => (
                                                    <Input
                                                        key={choice.id}
                                                        value={choice.label}
                                                        placeholder={`Option ${choice.id}`}
                                                        onChange={(event) => updateChoiceLabel(index, event.target.value)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <Button
                                            type="submit"
                                            disabled={createQuestionMutation.isPending || !selectedLesson?.quiz}
                                            className="w-full"
                                        >
                                            {createQuestionMutation.isPending && (
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            )}
                                            Ajouter la question
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Users className="w-4 h-4 text-[#1A6CC8]" />
                                    <div>
                                        <h2 className="text-sm font-semibold text-[#0D2D5A]">Assignation eleve</h2>
                                        <p className="text-xs text-gray-400">Inscrivez un eleve sur le parcours choisi.</p>
                                    </div>
                                </div>
                                <form className="space-y-4" onSubmit={handleAssignStudent}>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="enroll-course">Cours</Label>
                                        <select
                                            id="enroll-course"
                                            value={selectedCourseId ?? ""}
                                            onChange={(event) =>
                                                setSelectedCourseId(event.target.value ? event.target.value : null)
                                            }
                                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]"
                                        >
                                            <option value="">Selectionner un cours</option>
                                            {courses.map((course) => (
                                                <option key={course.id} value={course.id}>
                                                    {course.title}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="student-id">ID eleve</Label>
                                        <Input
                                            id="student-id"
                                            value={enrollmentForm.studentId}
                                            onChange={(event) =>
                                                setEnrollmentForm((prev) => ({ ...prev, studentId: event.target.value }))
                                            }
                                            placeholder="s1"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="student-name">Nom eleve</Label>
                                        <Input
                                            id="student-name"
                                            value={enrollmentForm.studentName}
                                            onChange={(event) =>
                                                setEnrollmentForm((prev) => ({ ...prev, studentName: event.target.value }))
                                            }
                                            placeholder="Nom et prenom"
                                        />
                                    </div>
                                    <Button type="submit" disabled={assignStudentMutation.isPending} className="w-full">
                                        {assignStudentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                        Assigner le cours
                                    </Button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div >
        </div >
    );
}
