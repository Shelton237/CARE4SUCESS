import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
    FileQuestion, 
    Star, 
    Clock, 
    PlayCircle, 
    Loader2,
    Search,
    ChevronRight,
    Trophy,
    History,
    MoreHorizontal
} from "lucide-react";
import { fetchCourses, fetchStudentQuizAttempts } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import QuizPlayer from "@/components/quizzes/QuizPlayer";

export default function StudentQuizzes() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [playingQuizId, setPlayingQuizId] = useState<string | null>(null);

    const coursesQuery = useQuery({
        queryKey: ["studentCourses", user?.id],
        queryFn: () => fetchCourses("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const attemptsQuery = useQuery({
        queryKey: ["studentAttempts", user?.id],
        queryFn: () => fetchStudentQuizAttempts(user!.id),
        enabled: Boolean(user?.id),
    });

    const allQuizzes = (coursesQuery.data || []).flatMap(course => 
        (course.lessons || [])
            .filter(lesson => lesson.quiz)
            .map(lesson => ({
                ...lesson.quiz,
                courseTitle: course.title,
                subject: course.subject,
                lessonTitle: lesson.title
            }))
    );

    const filteredQuizzes = allQuizzes.filter(q => 
        q.title.toLowerCase().includes(search.toLowerCase()) ||
        q.subject.toLowerCase().includes(search.toLowerCase())
    );

    const isLoading = coursesQuery.isLoading || attemptsQuery.isLoading;

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {playingQuizId && (
                <QuizPlayer 
                    quizId={playingQuizId} 
                    studentId={user!.id}
                    studentName={user!.name}
                    onClose={() => setPlayingQuizId(null)}
                    onComplete={() => {
                        queryClient.invalidateQueries({ queryKey: ["studentAttempts", user?.id] });
                    }}
                />
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Tests & Quiz</h1>
                    <p className="text-gray-500 text-sm mt-1">Évalue tes connaissances et gagne des points d'expérience.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/5 focus:border-[#1A6CC8] transition-all w-64 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-3 space-y-8">
                    {/* Active Quizzes */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-[#0D2D5A] uppercase tracking-widest">Quiz disponibles</h3>
                            <button className="text-[10px] font-bold text-[#1A6CC8] hover:underline uppercase tracking-widest">Voir tout</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredQuizzes.length > 0 ? (
                                filteredQuizzes.map((quiz) => (
                                    <QuizCard 
                                        key={quiz.id} 
                                        quiz={quiz} 
                                        attempts={attemptsQuery.data || []} 
                                        onPlay={() => setPlayingQuizId(quiz.id)}
                                    />
                                ))
                            ) : (
                                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                                    <FileQuestion className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-400 text-sm font-medium">Aucun quiz disponible.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Attempts */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-[#0D2D5A] uppercase tracking-widest">Derniers résultats</h3>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                            {attemptsQuery.data && attemptsQuery.data.length > 0 ? (
                                attemptsQuery.data.slice(0, 5).map((attempt) => (
                                    <div key={attempt.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                                attempt.score >= (attempt.totalPoints || 20) * 0.7 
                                                    ? "bg-green-50 text-green-600 border border-green-100" 
                                                    : "bg-orange-50 text-orange-600 border border-orange-100"
                                            )}>
                                                {attempt.score}
                                            </div>
                                            <div>
                                                <h4 className="text-xs font-bold text-[#0D2D5A] group-hover:text-[#1A6CC8] transition-colors">{attempt.quizTitle}</h4>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{attempt.subject} • {new Date(attempt.createdAt).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#1A6CC8] transition-colors" />
                                    </div>
                                ))
                            ) : (
                                <div className="p-12 text-center text-gray-400 text-sm font-medium italic">
                                    Aucune tentative récente.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 text-center">
                        <div className="w-14 h-14 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center mx-auto mb-4 text-orange-500">
                            <Trophy className="w-7 h-7" />
                        </div>
                        <h3 className="text-sm font-bold text-[#0D2D5A]">Maître des Quiz</h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Niveau -- • -- XP</p>
                        
                        <div className="mt-8 space-y-3">
                            <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase">
                                <span>Progression Niveau</span>
                                <span className="text-[#1A6CC8]">--%</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1A6CC8] w-0" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#0D2D5A] rounded-2xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2 opacity-80">
                                <Star className="w-3.5 h-3.5 text-orange-400 fill-current" />
                                Hub XP Hebdo
                            </h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-bold">--</span>
                                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-tighter">XP cette semaine</span>
                            </div>
                        </div>
                        <History className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuizCard({ quiz, attempts, onPlay }: { quiz: any, attempts: any[], onPlay: () => void }) {
    const quizAttempts = attempts.filter(a => a.quizId === quiz.id);
    const hasAttempt = quizAttempts.length > 0;
    const bestScore = hasAttempt ? Math.max(...quizAttempts.map(a => a.score)) : 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 transition-all group hover:border-[#1A6CC8]/20 relative overflow-hidden">
            <div className="relative z-10 flex flex-col h-full gap-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-bold text-[#1A6CC8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                        {quiz.subject}
                    </span>
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tight">
                        <Clock className="w-3 h-3 text-gray-300" />
                        15 minutes
                    </div>
                </div>

                <div className="space-y-1">
                    <h4 className="font-bold text-[#0D2D5A] group-hover:text-[#1A6CC8] transition-colors">{quiz.title}</h4>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest line-clamp-1 italic">{quiz.courseTitle}</p>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Meilleur score</span>
                        <span className={cn(
                            "text-sm font-bold",
                            hasAttempt ? "text-[#0D2D5A]" : "text-gray-200"
                        )}>
                            {hasAttempt ? `${bestScore} / ${quiz.totalPoints || 20}` : "-- / --"}
                        </span>
                    </div>
                    
                    <button 
                        onClick={onPlay}
                        className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm",
                            hasAttempt 
                                ? "bg-gray-50 text-gray-400 hover:bg-gray-100" 
                                : "bg-[#1A6CC8] text-white hover:bg-[#15549a]"
                        )}
                    >
                        {hasAttempt ? <MoreHorizontal className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                    </button>
                </div>
            </div>
            
            <FileQuestion className="absolute -bottom-6 -right-6 w-20 h-20 text-gray-50 group-hover:text-blue-50 group-hover:scale-110 transition-all duration-700 -rotate-12" />
        </div>
    );
}
