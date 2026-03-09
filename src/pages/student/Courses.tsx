import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchCourses, fetchQuiz, submitQuizAttempt, fetchStudentQuizAttempts } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, BookOpen, ClipboardList } from "lucide-react";

export default function StudentCourses() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
    const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, string>>({});

    const coursesQuery = useQuery({
        queryKey: ["courses", "student", user?.id],
        enabled: Boolean(user?.id),
        queryFn: () => fetchCourses("student", user!.id),
    });

    const quizQuery = useQuery({
        queryKey: ["quiz", activeQuizId],
        enabled: Boolean(activeQuizId),
        queryFn: () => fetchQuiz(activeQuizId!),
    });

    const attemptsQuery = useQuery({
        queryKey: ["studentAttempts", user?.id],
        enabled: Boolean(user?.id),
        queryFn: () => fetchStudentQuizAttempts(user!.id),
    });

    const attemptMutation = useMutation({
        mutationFn: () =>
            submitQuizAttempt(activeQuizId!, {
                studentId: user!.id,
                studentName: user!.name,
                answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })),
            }),
        onSuccess: (data) => {
            toast({
                title: "Quiz soumis",
                description: `Score ${data.score}/${data.totalPoints}`,
            });
            setActiveQuizId(null);
            setAnswers({});
            queryClient.invalidateQueries({ queryKey: ["studentAttempts", user?.id] });
        },
        onError: (err: Error) => {
            toast({ title: "Erreur quiz", description: err.message, variant: "destructive" });
        },
    });

    const activeCourse = coursesQuery.data?.find((course) => course.id === selectedCourse) ?? null;

    const recentAttempts = useMemo(() => attemptsQuery.data?.slice(0, 5) ?? [], [attemptsQuery.data]);

    if (!user) {
        return <div className="p-8 text-sm text-gray-500">Connectez-vous pour accéder aux cours.</div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes cours interactifs</h1>
                <p className="text-gray-500 text-sm mt-1">Suivez vos leçons, regardez les ressources et validez les quiz.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <h2 className="text-sm font-semibold text-[#0D2D5A] flex items-center gap-2">
                        <BookOpen className="w-4 h-4" /> Mes cours
                    </h2>
                    {coursesQuery.isLoading ? (
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                        </div>
                    ) : coursesQuery.data && coursesQuery.data.length > 0 ? (
                        coursesQuery.data.map((course) => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourse(course.id)}
                                className={`w-full text-left border rounded-2xl px-4 py-3 transition ${
                                    selectedCourse === course.id ? "border-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-100"
                                }`}
                            >
                                <div className="font-semibold text-[#0D2D5A]">{course.title}</div>
                                <div className="text-xs text-gray-400">
                                    {course.subject} · {course.level}
                                </div>
                            </button>
                        ))
                    ) : (
                        <p className="text-sm text-gray-400">Aucun cours assigné.</p>
                    )}
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {activeCourse ? (
                        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                            <div>
                                <div className="font-semibold text-[#0D2D5A]">{activeCourse.title}</div>
                                <p className="text-xs text-gray-400">{activeCourse.description}</p>
                            </div>
                            {activeCourse.lessons.length === 0 ? (
                                <p className="text-sm text-gray-400">Le contenu arrive bientôt.</p>
                            ) : (
                                <div className="space-y-3">
                                    {activeCourse.lessons.map((lesson) => (
                                        <div key={lesson.id} className="border border-gray-100 rounded-xl p-4">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <div className="font-semibold text-[#0D2D5A]">{lesson.title}</div>
                                                    <p className="text-xs text-gray-400">Ordre {lesson.order}</p>
                                                </div>
                                                {lesson.quiz && (
                                                    <Button variant="outline" size="sm" onClick={() => setActiveQuizId(lesson.quiz!.id)}>
                                                        Répondre au quiz
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-600 mt-2">{lesson.content}</p>
                                            {lesson.videoUrl && (
                                                <a
                                                    href={lesson.videoUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-xs font-semibold text-[#1A6CC8] hover:underline inline-flex items-center gap-1 mt-2"
                                                >
                                                    Voir la vidéo
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-5 text-sm text-gray-400">
                            Sélectionnez un cours pour afficher les leçons.
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                        <h3 className="text-sm font-semibold text-[#0D2D5A] flex items-center gap-2 mb-3">
                            <ClipboardList className="w-4 h-4" /> Derniers résultats
                        </h3>
                        {attemptsQuery.isLoading ? (
                            <div className="text-sm text-gray-400 flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
                            </div>
                        ) : recentAttempts.length === 0 ? (
                            <p className="text-sm text-gray-400">Aucun quiz complété pour le moment.</p>
                        ) : (
                            <div className="space-y-2">
                                {recentAttempts.map((attempt) => (
                                    <div key={attempt.id} className="border border-gray-100 rounded-xl p-3 flex items-center justify-between">
                                        <div>
                                            <div className="font-semibold text-[#0D2D5A]">{attempt.quizTitle}</div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(attempt.createdAt).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="text-sm font-bold text-[#1A6CC8]">
                                            {attempt.score}/{attempt.totalPoints ?? 0}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {activeQuizId && quizQuery.data && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-[#0D2D5A]">{quizQuery.data.title}</h3>
                                <p className="text-xs text-gray-500">{quizQuery.data.instructions}</p>
                            </div>
                            <Button variant="ghost" onClick={() => setActiveQuizId(null)}>
                                Fermer
                            </Button>
                        </div>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                attemptMutation.mutate();
                            }}
                            className="space-y-4"
                        >
                            {quizQuery.data.questions?.map((question) => (
                                <div key={question.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="font-semibold text-[#0D2D5A]">{question.prompt}</div>
                                    <div className="mt-2 space-y-2">
                                        {question.choices.map((choice) => (
                                            <label key={choice.id} className="flex items-center gap-2 text-sm text-gray-600">
                                                <input
                                                    type="radio"
                                                    name={question.id}
                                                    value={choice.id}
                                                    checked={answers[question.id] === choice.id}
                                                    onChange={() =>
                                                        setAnswers((prev) => ({
                                                            ...prev,
                                                            [question.id]: choice.id,
                                                        }))
                                                    }
                                                    required
                                                />
                                                {choice.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setActiveQuizId(null)}>
                                    Annuler
                                </Button>
                                <Button type="submit" disabled={attemptMutation.isPending}>
                                    {attemptMutation.isPending ? "Envoi…" : "Envoyer mes réponses"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
