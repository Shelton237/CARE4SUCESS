import { useMemo, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { BookOpen, ClipboardList, Star, Trophy, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherStudents } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";

type StudentCourse = {
    id: string;
    title: string;
    progress: number;
    status: "actif" | "en attente";
    nextLesson: string;
};

type StudentQuiz = {
    id: string;
    title: string;
    status: "done" | "scheduled" | "pending";
    score?: string;
    lastAttempt?: string;
};

type StudentHighlight = {
    label: string;
    value: string;
    sublabel?: string;
};

type StudentEvaluation = {
    id: string;
    author: string;
    role: string;
    rating: number;
    date: string;
    comment: string;
};

type StudentProfile = {
    highlights: StudentHighlight[];
    courses: StudentCourse[];
    quizzes: StudentQuiz[];
    evaluations: StudentEvaluation[];
};

const DEFAULT_PROFILE: StudentProfile = {
    highlights: [
        { label: "Suivi", value: "En attente", sublabel: "Ajoutez une évaluation" },
    ],
    courses: [],
    quizzes: [],
    evaluations: [],
};

export default function TeacherStudents() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [evaluationForm, setEvaluationForm] = useState({ rating: 5, comment: "" });
    const [evaluationsStore, setEvaluationsStore] = useState<Record<string, StudentEvaluation[]>>({});

    const { data: students, isLoading, error } = useQuery({
        queryKey: ["teacherStudents", user?.id],
        queryFn: () => fetchTeacherStudents(user!.id),
        enabled: !!user?.id,
    });

    const selectedStudent = useMemo(
        () => students?.find((student: any) => student.id === selectedStudentId) ?? null,
        [selectedStudentId, students]
    );

    const profile = useMemo(
        () => selectedStudent?.profile ?? DEFAULT_PROFILE,
        [selectedStudent]
    );

    const evaluations = useMemo(() => {
        const custom = selectedStudentId ? evaluationsStore[selectedStudentId] ?? [] : [];
        const base = profile.evaluations ?? [];
        return [...custom, ...base];
    }, [selectedStudentId, evaluationsStore, profile.evaluations]);

    const handleOpenDetails = (studentId: string) => {
        setSelectedStudentId(studentId);
        setEvaluationForm({ rating: 5, comment: "" });
        setDetailsOpen(true);
    };

    const handleEvaluationSubmit = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!selectedStudentId) return;
        if (!evaluationForm.comment.trim()) {
            toast({
                title: "Commentaire requis",
                description: "Ajoutez quelques mots pour contextualiser l'évaluation.",
                variant: "destructive",
            });
            return;
        }
        const rating = Math.max(1, Math.min(5, Number(evaluationForm.rating) || 1));
        const newEvaluation: StudentEvaluation = {
            id: `eval-${Date.now()}`,
            author: "Vous",
            role: "Enseignant",
            rating,
            date: new Date().toLocaleDateString("fr-FR"),
            comment: evaluationForm.comment.trim(),
        };
        setEvaluationsStore((prev) => {
            const current = prev[selectedStudentId] ?? [];
            return {
                ...prev,
                [selectedStudentId]: [newEvaluation, ...current],
            };
        });
        setEvaluationForm({ rating, comment: "" });
        toast({
            title: "Évaluation enregistrée",
            description: "Le retour est sauvegardé dans l'historique de l'élève.",
        });
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                <span className="ml-3 text-gray-500">Chargement de vos élèves...</span>
            </div>
        );
    }

    if (error || !students) {
        return (
            <div className="p-8 text-center text-red-500">
                Impossible de charger la liste des élèves.
            </div>
        );
    }

    return (
        <>
            <div className="p-8 space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes élèves</h1>
                    <p className="text-gray-500 text-sm mt-1">{students.length} élèves actifs</p>
                </div>

                {students.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                        <p className="text-gray-400">Vous n'avez pas encore d'élèves assignés.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                        {students.map((student: any) => (
                            <button
                                key={student.id}
                                type="button"
                                onClick={() => handleOpenDetails(student.id)}
                                className="bg-white rounded-2xl p-6 text-left shadow-sm border border-gray-100 hover:shadow-lg transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A6CC8]"
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-12 h-12 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-lg font-bold text-[#1A6CC8]">
                                        {student.name[0]}
                                    </div>
                                    <div>
                                        <div className="font-bold text-[#0D2D5A]">{student.name}</div>
                                        <div className="text-xs text-gray-400">
                                            {student.level} · {student.subject}
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-center">
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-[#1A6CC8]">{student.sessions ?? 0}</div>
                                        <div className="text-xs text-gray-400">Séances</div>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-[#0D2D5A]">
                                            {student.avgGrade}
                                            <span className="text-xs text-gray-400">/20</span>
                                        </div>
                                        <div className="text-xs text-gray-400">Moyenne</div>
                                    </div>
                                    <div className="bg-green-50 rounded-xl p-3">
                                        <div className="text-lg font-bold text-green-600">{student.trend}</div>
                                        <div className="text-xs text-gray-400">Progression</div>
                                    </div>
                                </div>
                                <div className="mt-3 text-xs text-gray-400 text-right">
                                    Dernière séance : {student.lastSession || "Non daté"}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    {selectedStudent && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-left text-[#0D2D5A]">{selectedStudent.name}</DialogTitle>
                                <DialogDescription className="text-left">
                                    {selectedStudent.level} · {selectedStudent.subject} — {selectedStudent.sessions ?? 0} séances suivies
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-2">
                                <section className="grid sm:grid-cols-3 gap-3">
                                    {profile.highlights.map((highlight, idx) => (
                                        <div
                                            key={`${highlight.label}-${idx}`}
                                            className="rounded-2xl border border-gray-100 bg-gray-50 p-4"
                                        >
                                            <p className="text-xs uppercase tracking-wide text-gray-500">{highlight.label}</p>
                                            <p className="text-lg font-bold text-[#0D2D5A]">{highlight.value}</p>
                                            {highlight.sublabel && (
                                                <p className="text-xs text-gray-500 mt-1">{highlight.sublabel}</p>
                                            )}
                                        </div>
                                    ))}
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-[#0D2D5A] flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-[#1A6CC8]" />
                                            Parcours suivis
                                        </h3>
                                        <span className="text-xs text-gray-400">
                                            {profile.courses?.length ? `${profile.courses.length} cours` : "Aucun cours"}
                                        </span>
                                    </div>
                                    {(!profile.courses || profile.courses.length === 0) ? (
                                        <p className="text-sm text-gray-400 italic">Aucun parcours pédagogique assigné.</p>
                                    ) : (
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            {profile.courses.map((course) => (
                                                <div key={course.id} className="border border-gray-100 rounded-2xl p-4">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <div>
                                                            <p className="font-semibold text-[#0D2D5A] text-sm">{course.title}</p>
                                                            <p className="text-xs text-gray-400">Prochaine séance : {course.nextLesson}</p>
                                                        </div>
                                                        <span
                                                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${course.status === "actif"
                                                                    ? "text-emerald-600 bg-emerald-50"
                                                                    : "text-amber-600 bg-amber-50"
                                                                }`}
                                                        >
                                                            {course.status === "actif" ? "Actif" : "En attente"}
                                                        </span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-gray-100">
                                                        <div
                                                            className="h-2 rounded-full bg-[#1A6CC8]"
                                                            style={{ width: `${course.progress}%` }}
                                                        />
                                                    </div>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Progression : {course.progress}%
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-3">
                                    <div className="flex items-center gap-2 text-[#0D2D5A]">
                                        <ClipboardList className="w-4 h-4 text-[#1A6CC8]" />
                                        <h3 className="text-sm font-semibold">Quiz & évaluations</h3>
                                    </div>
                                    {(!profile.quizzes || profile.quizzes.length === 0) ? (
                                        <p className="text-sm text-gray-400 italic">Aucun quiz disponible.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {profile.quizzes.map((quiz) => (
                                                <div
                                                    key={quiz.id}
                                                    className="border border-gray-100 rounded-2xl p-3 flex items-center justify-between gap-3"
                                                >
                                                    <div>
                                                        <p className="font-semibold text-[#0D2D5A] text-sm">{quiz.title}</p>
                                                        <p className="text-xs text-gray-400">
                                                            {quiz.status === "done"
                                                                ? `Dernier score : ${quiz.score}`
                                                                : quiz.lastAttempt || "À planifier"}
                                                        </p>
                                                    </div>
                                                    <span
                                                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase ${quiz.status === "done"
                                                                ? "text-emerald-600 bg-emerald-50"
                                                                : quiz.status === "scheduled"
                                                                    ? "text-blue-600 bg-blue-50"
                                                                    : "text-gray-500 bg-gray-100"
                                                            }`}
                                                    >
                                                        {quiz.status === "done"
                                                            ? "Terminé"
                                                            : quiz.status === "scheduled"
                                                                ? "Planifié"
                                                                : "À faire"}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 text-[#0D2D5A]">
                                        <Trophy className="w-4 h-4 text-[#1A6CC8]" />
                                        <h3 className="text-sm font-semibold">Évaluations & retours</h3>
                                    </div>
                                    {evaluations.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">Aucun retour enregistré.</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {evaluations.map((evaluation) => (
                                                <div key={evaluation.id} className="border border-gray-100 rounded-2xl p-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <div className="font-semibold text-[#0D2D5A] flex items-center gap-2">
                                                            <Star className="w-4 h-4 text-[#F5A623]" />
                                                            {evaluation.author}
                                                        </div>
                                                        <span className="text-xs text-gray-400">{evaluation.date}</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 mb-2">{evaluation.role}</p>
                                                    <p className="text-sm text-gray-600">{evaluation.comment}</p>
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Note attribuée : {evaluation.rating}/5
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Separator />

                                    <form className="space-y-3" onSubmit={handleEvaluationSubmit}>
                                        <p className="text-sm font-semibold text-[#0D2D5A]">
                                            Ajouter une nouvelle évaluation
                                        </p>
                                        <div className="grid sm:grid-cols-2 gap-3">
                                            <div>
                                                <label htmlFor="evaluation-rating" className="text-xs text-gray-500">
                                                    Note (1 à 5)
                                                </label>
                                                <Input
                                                    id="evaluation-rating"
                                                    type="number"
                                                    min={1}
                                                    max={5}
                                                    value={evaluationForm.rating}
                                                    onChange={(event) =>
                                                        setEvaluationForm((prev) => ({
                                                            ...prev,
                                                            rating: Number(event.target.value),
                                                        }))
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500">Élève</label>
                                                <div className="text-sm font-semibold text-[#0D2D5A]">
                                                    {selectedStudent.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label htmlFor="evaluation-comment" className="text-xs text-gray-500">
                                                Commentaire
                                            </label>
                                            <Textarea
                                                id="evaluation-comment"
                                                rows={3}
                                                value={evaluationForm.comment}
                                                onChange={(event) =>
                                                    setEvaluationForm((prev) => ({
                                                        ...prev,
                                                        comment: event.target.value,
                                                    }))
                                                }
                                                placeholder="Résumez la progression, les points à consolider..."
                                            />
                                        </div>
                                        <Button type="submit" className="w-full">
                                            Enregistrer l'évaluation
                                        </Button>
                                    </form>
                                </section>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
