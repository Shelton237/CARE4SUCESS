
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
    CheckCircle2, 
    XCircle, 
    ArrowRight, 
    ArrowLeft, 
    Loader2, 
    Trophy,
    AlertCircle,
    RotateCcw,
    X,
    Star
} from "lucide-react";
import { fetchQuiz, submitQuizAttempt } from "@/api/backoffice";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QuizPlayerProps {
    quizId: string;
    studentId: string;
    studentName: string;
    onClose: () => void;
    onComplete?: (score: number, total: number) => void;
}

export default function QuizPlayer({ quizId, studentId, studentName, onClose, onComplete }: QuizPlayerProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isFinished, setIsFinished] = useState(false);
    const [result, setResult] = useState<{ score: number; totalPoints: number } | null>(null);

    const quizQuery = useQuery({
        queryKey: ["quiz", quizId],
        queryFn: () => fetchQuiz(quizId),
        enabled: Boolean(quizId),
    });

    const submitMutation = useMutation({
        mutationFn: (payload: any) => submitQuizAttempt(quizId, payload),
        onSuccess: (data) => {
            setResult(data);
            setIsFinished(true);
            onComplete?.(data.score, data.totalPoints);
            toast.success("Quiz terminé ! Bien joué.");
        },
        onError: (err: any) => {
            toast.error("Erreur lors de l'envoi : " + err.message);
        }
    });

    const quiz = quizQuery.data;
    const questions = quiz?.questions || [];
    const currentQuestion = questions[currentQuestionIndex];

    const handleSelectOption = (optionId: string) => {
        setAnswers(prev => ({
            ...prev,
            [currentQuestion.id]: optionId
        }));
    };

    const handleNext = () => {
        if (currentQuestionIndex < questions.length - 1) {
            setCurrentQuestionIndex(prev => prev + 1);
        } else {
            handleSubmit();
        }
    };

    const handlePrev = () => {
        if (currentQuestionIndex > 0) {
            setCurrentQuestionIndex(prev => prev - 1);
        }
    };

    const handleSubmit = () => {
        if (Object.keys(answers).length < questions.length) {
            if (!confirm("Tu n'as pas répondu à toutes les questions. Veux-tu vraiment terminer ?")) {
                return;
            }
        }

        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
        }));

        submitMutation.mutate({
            studentId,
            studentName,
            answers: formattedAnswers
        });
    };

    if (quizQuery.isLoading) {
        return (
            <div className="fixed inset-0 z-[110] bg-white flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 animate-spin text-[#9333ea] mx-auto" />
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs animate-pulse">Chargement de ton quiz...</p>
                </div>
            </div>
        );
    }

    if (isFinished && result) {
        const percentage = Math.round((result.score / result.totalPoints) * 100);
        return (
            <div className="fixed inset-0 z-[110] bg-white overflow-y-auto">
                <div className="max-w-2xl mx-auto py-16 px-8 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[40px] bg-orange-100 flex items-center justify-center mx-auto text-orange-500 shadow-xl shadow-orange-500/10">
                            <Trophy className="w-16 h-16 fill-current" />
                        </div>
                        <div className="absolute -top-4 -right-4 bg-[#9333ea] text-white w-12 h-12 rounded-full flex items-center justify-center font-black shadow-lg">
                            {percentage}%
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-black text-[#0D2D5A]">Excellent travail !</h2>
                        <p className="text-gray-500 font-medium italic">Tu as obtenu un score de {result.score} / {result.totalPoints}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">XP Gagné</div>
                            <div className="text-2xl font-black text-[#9333ea]">+{percentage * 2} XP</div>
                        </div>
                        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Précision</div>
                            <div className="text-2xl font-black text-green-500">{percentage}%</div>
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col gap-4">
                        <button 
                            onClick={onClose}
                            className="w-full bg-[#0D2D5A] text-white py-4 rounded-2xl font-black text-sm hover:bg-[#153460] transition-all shadow-xl shadow-[#0D2D5A]/20"
                        >
                            Retour à l'espace Quiz
                        </button>
                        <button 
                            onClick={() => {
                                setIsFinished(false);
                                setResult(null);
                                setCurrentQuestionIndex(0);
                                setAnswers({});
                            }}
                            className="w-full py-4 text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Refaire le quiz
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const progress = Math.round(((currentQuestionIndex + 1) / questions.length) * 100);

    return (
        <div className="fixed inset-0 z-[110] bg-white flex flex-col animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <header className="p-6 flex items-center justify-between border-b border-gray-50">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#9333ea]">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-black text-[#0D2D5A]">{quiz?.title}</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question {currentQuestionIndex + 1} sur {questions.length}</p>
                    </div>
                </div>
                <button 
                    onClick={() => confirm("Quitter ce quiz ? Ta progression actuelle sera perdue.") && onClose()}
                    className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </header>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-50 px-0">
                <div 
                    className="h-full bg-gradient-to-r from-[#9333ea] to-blue-500 transition-all duration-500 rounded-r-full" 
                    style={{ width: `${progress}%` }} 
                />
            </div>

            {/* Question Body */}
            <main className="flex-1 overflow-y-auto px-6 py-12 md:px-12 max-w-4xl mx-auto w-full">
                <div className="space-y-12">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-[10px] font-black text-[#9333ea] uppercase tracking-[0.2em] bg-purple-50 w-max px-3 py-1 rounded-full">
                            <Star className="w-3 h-3 fill-current" />
                            {currentQuestion?.points || 1} Points
                        </div>
                        <h2 className="text-2xl md:text-4xl font-black text-[#0D2D5A] leading-tight">
                            {currentQuestion?.prompt}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {currentQuestion?.choices.map((choice: any) => (
                            <button
                                key={choice.id}
                                onClick={() => handleSelectOption(choice.id)}
                                className={cn(
                                    "p-6 rounded-[28px] border-2 text-left transition-all relative group",
                                    answers[currentQuestion.id] === choice.id 
                                        ? "border-[#9333ea] bg-purple-50/50 shadow-lg shadow-purple-500/10" 
                                        : "border-gray-100 hover:border-gray-200 bg-white"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm border-2 transition-all",
                                        answers[currentQuestion.id] === choice.id
                                            ? "bg-[#9333ea] border-[#9333ea] text-white rotate-[360deg]"
                                            : "bg-gray-50 border-gray-100 text-gray-400 group-hover:bg-white"
                                    )}>
                                        {choice.id}
                                    </div>
                                    <span className={cn(
                                        "font-bold transition-colors",
                                        answers[currentQuestion.id] === choice.id ? "text-[#9333ea]" : "text-[#0D2D5A]"
                                    )}>
                                        {choice.label}
                                    </span>
                                </div>
                                {answers[currentQuestion.id] === choice.id && (
                                    <div className="absolute top-1/2 -translate-y-1/2 right-6">
                                        <div className="w-6 h-6 rounded-full bg-[#9333ea] flex items-center justify-center animate-in zoom-in duration-300">
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </main>

            {/* Footer Navigation */}
            <footer className="p-6 md:px-12 flex items-center justify-between border-t border-gray-50 bg-white">
                <button 
                    onClick={handlePrev}
                    disabled={currentQuestionIndex === 0}
                    className={cn(
                        "flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black transition-all",
                        currentQuestionIndex === 0 
                            ? "text-gray-200 cursor-not-allowed" 
                            : "text-[#0D2D5A] hover:bg-gray-50"
                    )}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Précédent
                </button>

                <button 
                    onClick={handleNext}
                    disabled={!answers[currentQuestion?.id] || submitMutation.isPending}
                    className={cn(
                        "flex items-center gap-2 px-8 py-3.5 rounded-2xl text-xs font-black transition-all shadow-xl",
                        !answers[currentQuestion?.id]
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                            : currentQuestionIndex === questions.length - 1
                                ? "bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20"
                                : "bg-[#9333ea] text-white hover:bg-[#7e22ce] shadow-[#9333ea]/20"
                    )}
                >
                    {submitMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                            {currentQuestionIndex === questions.length - 1 ? "Terminer le Quiz" : "Question suivante"}
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </footer>

            {/* Alert if not answered */}
            {!answers[currentQuestion?.id] && currentQuestion && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 animate-in slide-in-from-bottom duration-300">
                    <div className="bg-gray-900/90 text-white px-4 py-2 rounded-full flex items-center gap-2 text-[10px] font-black uppercase tracking-widest backdrop-blur-md">
                        <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                        Choisis une réponse pour continuer
                    </div>
                </div>
            )}
        </div>
    );
}
