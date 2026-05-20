import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    BookOpen, 
    Search, 
    PlayCircle, 
    CheckCircle2, 
    Clock, 
    Loader2,
    ArrowRight,
    ArrowLeft,
    TrendingUp,
    Bookmark,
    Video,
    FileText,
    HelpCircle
} from "lucide-react";
import { 
    fetchCourses, 
    fetchCourseBookmarks, 
    addCourseBookmark, 
    removeCourseBookmark, 
    fetchActiveCourse,
    updateCourseProgress,
    fetchCourseDetails
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
    Drawer, 
    DrawerContent, 
    DrawerHeader, 
    DrawerTitle 
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function StudentCourses() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'completed' | 'favorites'>('all');
    const [viewingCourseId, setViewingCourseId] = useState<string | null>(null);

    const { data: courses, isLoading: coursesLoading } = useQuery({
        queryKey: ["studentCourses", user?.id],
        queryFn: () => fetchCourses("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const { data: bookmarks, isLoading: bookmarksLoading } = useQuery({
        queryKey: ["courseBookmarks", user?.id],
        queryFn: () => fetchCourseBookmarks(user!.id),
        enabled: Boolean(user?.id),
    });

    const { data: activeCourse } = useQuery({
        queryKey: ["activeCourse", user?.id],
        queryFn: () => fetchActiveCourse(user!.id),
        enabled: Boolean(user?.id),
    });

    const bookmarkIds = new Set(bookmarks || []);

    const toggleBookmarkMutation = useMutation({
        mutationFn: ({ courseId, isBookmarked }: { courseId: string; isBookmarked: boolean }) => 
            isBookmarked ? removeCourseBookmark(user!.id, courseId) : addCourseBookmark(user!.id, courseId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["courseBookmarks", user?.id] });
            toast.success(variables.isBookmarked ? "Cours retiré des favoris" : "Cours ajouté aux favoris");
        },
        onError: () => {
            toast.error("Une erreur est survenue");
        }
    });

    const filteredCourses = (courses || []).filter(course => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
                            course.subject.toLowerCase().includes(search.toLowerCase());
        
        const isCompleted = course.progress === 100;
        const isInProgress = (course.progress || 0) > 0 && (course.progress || 0) < 100;
        const isBookmarked = bookmarkIds.has(course.id);

        if (activeTab === 'in_progress') return matchesSearch && isInProgress;
        if (activeTab === 'completed') return matchesSearch && isCompleted;
        if (activeTab === 'favorites') return matchesSearch && isBookmarked;
        return matchesSearch;
    });

    if (coursesLoading || bookmarksLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Cours</h1>
                    <p className="text-gray-500 text-sm mt-1">Accède à tes ressources pédagogiques et suis ton avancement.</p>
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

            {/* Tabs */}
            <div className="flex items-center gap-2 bg-gray-100/50 p-1.5 rounded-xl w-fit">
                <TabButton active={activeTab === 'all'} onClick={() => setActiveTab('all')} label="Tous" />
                <TabButton active={activeTab === 'in_progress'} onClick={() => setActiveTab('in_progress')} label="En cours" />
                <TabButton active={activeTab === 'completed'} onClick={() => setActiveTab('completed')} label="Terminés" />
                <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} label="Favoris" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <CourseCard 
                            key={course.id} 
                            course={course} 
                            isBookmarked={bookmarkIds.has(course.id)}
                            onToggleBookmark={() => toggleBookmarkMutation.mutate({ 
                                courseId: course.id, 
                                isBookmarked: bookmarkIds.has(course.id) 
                            })}
                            onView={() => setViewingCourseId(course.id)}
                        />
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 text-sm font-medium">Aucun cours trouvé.</p>
                    </div>
                )}
            </div>

            {/* Resume Section */}
            {activeCourse && (
                <div className="mt-12 bg-[#0D2D5A] rounded-2xl p-4 md:p-8 text-white relative overflow-hidden group border border-blue-500/20 shadow-2xl shadow-blue-500/10 active:scale-[0.99] transition-all cursor-pointer" onClick={() => setViewingCourseId(activeCourse.courseId)}>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 rounded-xl bg-white/10 flex items-center justify-center">
                            <TrendingUp className="w-8 h-8 text-[#1A6CC8]" />
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <div className="text-[10px] font-bold text-[#1A6CC8] uppercase tracking-[0.2em] mb-1">Dernière activité</div>
                            <h3 className="text-xl font-bold mb-1">Reprendre : {activeCourse.courseTitle}</h3>
                            <p className="text-blue-200 text-xs opacity-70">
                                {activeCourse.lessonTitle ? `Leçon : ${activeCourse.lessonTitle}` : "Commencez votre première leçon."}
                            </p>
                        </div>
                        <button className="bg-white text-[#0D2D5A] px-6 py-3 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all flex items-center gap-2 uppercase tracking-widest">
                            Continuer
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                </div>
            )}

            <CourseViewer 
                courseId={viewingCourseId} 
                onClose={() => {
                    setViewingCourseId(null);
                    queryClient.invalidateQueries({ queryKey: ["studentCourses"] });
                    queryClient.invalidateQueries({ queryKey: ["activeCourse"] });
                }} 
            />
        </div>
    );
}

function TabButton({ active, onClick, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                active 
                    ? "bg-white text-[#0D2D5A] shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
            )}
        >
            {label}
        </button>
    );
}

function CourseCard({ course, isBookmarked, onToggleBookmark, onView }: { course: any; isBookmarked: boolean; onToggleBookmark: () => void; onView: () => void }) {
    const isCompleted = course.progress === 100;
    
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:border-[#1A6CC8]/20 transition-all flex flex-col h-full">
            <div className="h-44 bg-gray-50 relative overflow-hidden cursor-pointer" onClick={onView}>
                {course.coverUrl ? (
                    <img src={course.coverUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full bg-[#1A6CC8]/5 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-[#1A6CC8]/20" />
                    </div>
                )}
                <div className="absolute top-3 right-3">
                    <button 
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleBookmark();
                        }}
                        className={cn(
                            "p-2 rounded-lg backdrop-blur shadow-sm transition-all active:scale-90",
                            isBookmarked 
                                ? "bg-[#1A6CC8] text-white" 
                                : "bg-white/80 text-gray-400 hover:text-[#1A6CC8]"
                        )}
                    >
                        <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
                    </button>
                </div>
                <div className="absolute bottom-3 left-3">
                    <span className="text-[9px] font-bold uppercase bg-white border border-gray-100 px-2 py-0.5 rounded-lg text-[#0D2D5A]">
                        {course.subject}
                    </span>
                </div>
            </div>

            <div className="p-4 md:p-6 flex-1 flex flex-col gap-6">
                <div className="flex-1 space-y-2 cursor-pointer" onClick={onView}>
                    <h4 className="text-base font-bold text-[#0D2D5A] leading-tight group-hover:text-[#1A6CC8] transition-colors line-clamp-2">
                        {course.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 leading-relaxed opacity-80">
                        {course.description}
                    </p>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                        <span>Progression</span>
                        <span className={isCompleted ? "text-green-600" : "text-[#1A6CC8]"}>{course.progress || 0}%</span>
                    </div>
                    <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                            className={cn(
                                "h-full transition-all duration-700",
                                isCompleted ? "bg-green-500" : "bg-[#1A6CC8]"
                            )} 
                            style={{ width: `${course.progress || 0}%` }} 
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <Clock className="w-3.5 h-3.5 text-gray-300" />
                        {course.lessons?.length || 0} leçons
                    </div>
                    {isCompleted ? (
                        <div className="text-green-600 flex items-center gap-1.5 text-[10px] font-bold uppercase transition-all" onClick={onView}>
                            <CheckCircle2 className="w-4 h-4" />
                            Réussi
                        </div>
                    ) : (
                        <button onClick={onView} className="p-2 text-[#1A6CC8] hover:bg-blue-50 rounded-xl transition-all active:scale-95">
                            <PlayCircle className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CourseViewer({ courseId, onClose }: { courseId: string | null; onClose: () => void }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [mobileView, setMobileView] = useState<'list' | 'content'>('list');

    const { data: course, isLoading } = useQuery({
        queryKey: ["courseDetails", courseId],
        queryFn: () => fetchCourseDetails(courseId!),
        enabled: !!courseId,
    });

    const progressMutation = useMutation({
        mutationFn: (payload: { lessonId: string; completed?: boolean }) => 
            updateCourseProgress(user!.id, courseId!, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["courseDetails", courseId] });
        }
    });

    const lessons = course?.lessons || [];
    const activeLesson = lessons.find(l => l.id === (activeLessonId || course?.lastLessonId)) || lessons[0];

    useEffect(() => {
        if (courseId) {
            setMobileView('list');
        }
    }, [courseId]);

    if (!courseId) return null;

    const handleLessonClick = (lessonId: string) => {
        setActiveLessonId(lessonId);
        progressMutation.mutate({ lessonId });
        setMobileView('content');
    };

    const handleComplete = (lessonId: string) => {
        progressMutation.mutate({ lessonId, completed: true });
        toast.success("Leçon marquée comme terminée !");
    };

    return (
        <Drawer open={!!courseId} onOpenChange={(o) => !o && onClose()}>
            <DrawerContent className="h-[95vh] rounded-t-[2.5rem] bg-gray-50 border-none shadow-2xl">
                <div className="flex h-full overflow-hidden">
                    {/* Sidebar Lessons */}
                    <div className={cn(
                        "w-full md:w-80 bg-white border-r border-gray-100 flex flex-col p-4 md:p-6 overflow-hidden shrink-0",
                        mobileView === 'list' ? "flex" : "hidden md:flex"
                    )}>
                        <div className="mb-8">
                            <h2 className="text-xl font-black text-[#0D2D5A] leading-tight mb-2">{course?.title}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{course?.subject}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300" />
                                <span className="text-[10px] font-bold text-[#1A6CC8] uppercase tracking-widest">{course?.progress}% Complété</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-none">
                            {lessons.map((lesson, idx) => {
                                const isActive = activeLesson?.id === lesson.id;
                                const isCompleted = course?.completedLessons?.includes(lesson.id);
                                return (
                                    <button 
                                        key={lesson.id}
                                        onClick={() => handleLessonClick(lesson.id)}
                                        className={cn(
                                            "w-full text-left p-4 rounded-2xl border transition-all flex items-center gap-4 group",
                                            isActive 
                                                ? "bg-[#0D2D5A] border-[#0D2D5A] text-white shadow-lg shadow-blue-900/10"
                                                : "bg-white border-gray-100 hover:border-blue-100"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs shrink-0",
                                            isActive ? "bg-white/20 text-white" : "bg-gray-100 text-[#1A6CC8]"
                                        )}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <div className={cn("text-xs font-bold leading-tight", isActive ? "text-white" : "text-[#0D2D5A]")}>
                                                {lesson.title}
                                            </div>
                                            <div className={cn("text-[9px] font-medium mt-1 uppercase tracking-wider", isActive ? "text-blue-200" : "text-gray-400")}>
                                                {lesson.videoUrl ? "Vidéo" : "Texte"}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <Button variant="ghost" className="mt-6 rounded-xl text-gray-400 hover:text-red-500 font-bold shrink-0" onClick={onClose}>
                            Quitter le cours
                        </Button>
                    </div>

                    {/* Content Area */}
                    <div className={cn(
                        "flex-1 flex flex-col overflow-hidden bg-gray-50",
                        mobileView === 'content' ? "flex" : "hidden md:flex"
                    )}>
                        {isLoading ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
                            </div>
                        ) : activeLesson ? (
                            <>
                                {/* Mobile Header */}
                                <div className="md:hidden flex items-center gap-3 px-4 py-3.5 bg-white border-b border-gray-100 shrink-0">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-9 px-3 rounded-xl text-[#0D2D5A] font-bold text-xs flex items-center gap-1.5 hover:bg-gray-50 border border-gray-100 bg-white shadow-sm"
                                        onClick={() => setMobileView('list')}
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        Retour
                                    </Button>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-xs font-black text-[#0D2D5A] truncate">{course?.title}</h3>
                                        <p className="text-[10px] text-[#1A6CC8] font-bold uppercase tracking-wider">{course?.progress || 0}% Complété</p>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-12 space-y-6 md:space-y-12">
                                    <div className="max-w-3xl mx-auto space-y-8">
                                        <div className="space-y-4">
                                            <Badge className="bg-blue-100 text-[#1A6CC8] border-none font-black text-[10px] px-3 py-1 rounded-full w-fit block">
                                                Leçon {lessons.findIndex(l => l.id === activeLesson.id) + 1} sur {lessons.length}
                                            </Badge>
                                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#0D2D5A] tracking-tight">{activeLesson.title}</h1>
                                        </div>

                                        {activeLesson.videoUrl && (
                                            <div className="aspect-video bg-black rounded-2xl md:rounded-[2.5rem] overflow-hidden shadow-2xl relative group">
                                                <iframe 
                                                    src={activeLesson.videoUrl.replace("watch?v=", "embed/")} 
                                                    className="w-full h-full"
                                                    allowFullScreen
                                                />
                                            </div>
                                        )}

                                        <div className="prose prose-slate max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-headings:text-[#0D2D5A] prose-headings:font-black pb-20">
                                            {activeLesson.content.split('\n').map((para, i) => (
                                                <p key={i}>{para}</p>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Bottom bar */}
                                <div className="p-4 md:p-6 bg-white border-t border-gray-100 flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-3 w-full shrink-0">
                                    <Button 
                                        onClick={() => handleComplete(activeLesson.id)}
                                        className={cn(
                                            "h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 w-full sm:w-auto",
                                            course?.completedLessons?.includes(activeLesson.id)
                                                ? "bg-green-500 hover:bg-green-600 text-white shadow-green-500/20"
                                                : "bg-[#1A6CC8] hover:bg-blue-700 text-white shadow-blue-500/20"
                                        )}
                                    >
                                        {course?.completedLessons?.includes(activeLesson.id) ? (
                                            <><CheckCircle2 className="mr-2 w-4 h-4" /> Terminée</>
                                        ) : (
                                            "Marquer comme terminée"
                                        )}
                                    </Button>
                                    
                                    {activeLesson.quiz && (
                                        <Button 
                                            variant="outline"
                                            className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-orange-100 text-[#F5A623] hover:bg-orange-50 transition-all w-full sm:w-auto"
                                        >
                                            <HelpCircle className="mr-2 w-4 h-4" /> Passer le Test
                                        </Button>
                                    )}

                                    {course?.mode === 'online' && (
                                        <Button 
                                            onClick={() => navigate(`/virtual-class/${course.id}`)}
                                            className="h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-widest bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all w-full sm:w-auto"
                                        >
                                            <Video className="mr-2 w-4 h-4" /> Rejoindre la Classe
                                        </Button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-4">
                                <BookOpen className="w-16 h-16 opacity-10" />
                                <p className="font-bold">Sélectionnez une leçon pour commencer.</p>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
    return (
        <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold", className)}>
            {children}
        </span>
    );
}
