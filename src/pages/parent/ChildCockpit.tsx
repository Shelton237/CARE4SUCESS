import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
    ChevronLeft, 
    BarChart3, 
    BookOpen, 
    Medal, 
    TrendingUp, 
    Clock, 
    Calendar,
    GraduationCap,
    Download,
    Star,
    ShieldCheck,
    Loader2,
    Timer
} from "lucide-react";
import { 
    fetchUserProfile, 
    fetchParentProgress, 
    fetchStudentQuizAttempts, 
    fetchStudentHomework, 
    fetchChildrenByParent,
    fetchParentOverview,
    fetchStudentEvaluations
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid 
} from "recharts";

export default function ChildCockpit() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const navigate = useNavigate();

    const childrenQuery = useQuery({
        queryKey: ["children", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: !!user?.id,
    });

    const childQuery = useQuery({
        queryKey: ["childProfile", id],
        queryFn: () => fetchUserProfile(id!),
        enabled: !!id,
        retry: false,
    });

    const overviewQuery = useQuery({
        queryKey: ["childOverview", user?.id, id],
        queryFn: () => fetchParentOverview(user!.id, id!),
        enabled: !!user?.id && !!id,
    });

    const progressQuery = useQuery({
        queryKey: ["childProgress", id],
        queryFn: () => fetchParentProgress(user!.id, id),
        enabled: !!user?.id && !!id,
    });

    const gradesQuery = useQuery({
        queryKey: ["childGrades", id],
        queryFn: () => fetchStudentQuizAttempts(id!),
        enabled: !!id,
    });

    const homeworkQuery = useQuery({
        queryKey: ["childHomework", id],
        queryFn: () => fetchStudentHomework(id!),
        enabled: !!id,
    });

    const evaluationsQuery = useQuery({
        queryKey: ["childEvaluations", id],
        queryFn: () => fetchStudentEvaluations(id!),
        enabled: !!id,
    });

    const childInList = childrenQuery.data?.find((c: any) => c.id === id);
    const child = (childQuery.data || childInList) as any;
    const overview = overviewQuery.data as any;
    const progressData = progressQuery.data ?? [];
    const grades = gradesQuery.data ?? [];
    const homework = homeworkQuery.data ?? [];
    const evaluations = evaluationsQuery.data ?? [];

    if (childQuery.isLoading || overviewQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Navigation Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate("/parent/children")}
                        className="h-8 px-2 hover:bg-slate-50 text-slate-400"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-2">
                            Profil de {child?.name}
                            <Badge className="bg-[#1A6CC8] text-white text-[9px] font-black uppercase px-2 h-4 border-none rounded-none">
                                {overview?.childLevel || child?.level || "Élève"}
                            </Badge>
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Cockpit de suivi individuel</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-none">
                        <Download className="w-3.5 h-3.5 mr-2" /> Bilan PDF
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Stats Summary Column */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="border border-slate-100 p-5 bg-slate-50/30 space-y-6">
                         {/* Avatar / Identity */}
                         <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-20 h-20 bg-[#0D2D5A] text-white flex items-center justify-center font-black text-2xl border-4 border-white shadow-none">
                                {child?.name?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="font-black text-[#0D2D5A] uppercase">{child?.name}</h2>
                                <p className="text-[10px] text-[#1A6CC8] font-black uppercase tracking-widest leading-none mt-1">{child?.email}</p>
                            </div>
                         </div>

                         <div className="space-y-3 pt-4 border-t border-slate-100">
                             <div className="flex justify-between items-center text-[11px]">
                                 <span className="font-bold text-slate-400 uppercase tracking-tighter">Moyenne</span>
                                 <span className="font-black text-[#0D2D5A]">{overview?.currentAvg || "N/A"}/20</span>
                             </div>
                             <div className="flex justify-between items-center text-[11px]">
                                 <span className="font-bold text-slate-400 uppercase tracking-tighter">Sessions</span>
                                 <span className="font-black text-[#0D2D5A]">{overview?.sessionsThisMonth || 0} ce mois</span>
                             </div>
                             <div className="flex justify-between items-center text-[11px]">
                                 <span className="font-bold text-slate-400 uppercase tracking-tighter">Focus</span>
                                 <span className="font-black text-[#1A6CC8] truncate ml-2">{overview?.focusSubject || "N/A"}</span>
                             </div>
                         </div>

                         <div className="space-y-2 mt-2">
                             <Button className="w-full h-9 bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none">
                                 Contacter Tuteur
                             </Button>
                             <Button 
                                onClick={() => navigate(`/parent/academic-file?studentId=${id}`)}
                                className="w-full h-9 bg-white border border-[#1A6CC8] text-[#1A6CC8] hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest rounded-none shadow-none"
                             >
                                 Dossier Académique Complet
                             </Button>
                         </div>
                    </div>

                    {/* Quick Info Box */}
                    <div className="p-4 bg-[#F5A623]/5 border-l-2 border-[#F5A623]">
                        <p className="text-[10px] text-[#0D2D5A] leading-relaxed font-black uppercase tracking-tight">Prochaine Échéance</p>
                        <div className="flex items-center gap-2 mt-2">
                             <Timer className="w-3.5 h-3.5 text-[#F5A623]" />
                             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Examen Maths - 12 Avril</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Charts Row */}
                    <Card className="border-slate-100 shadow-none rounded-none bg-white">
                        <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-[#1A6CC8]" /> Progression Scolaire
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 md:p-6">
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafafa" />
                                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#cbd5e1", fontWeight: 900 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 20]} tick={{ fontSize: 9, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                fontSize: '11px', 
                                                borderRadius: '0', 
                                                border: '1px solid #f1f5f9', 
                                                boxShadow: 'none',
                                                fontWeight: 900
                                            }} 
                                        />
                                        <Line type="monotone" dataKey="maths" stroke="#1A6CC8" strokeWidth={3} dot={{ r: 4, fill: '#1A6CC8' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="francais" stroke="#F5A623" strokeWidth={3} dot={{ r: 4, fill: '#F5A623' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Secondary Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Latest Grades */}
                        <div className="border border-slate-100 rounded-none bg-white">
                            <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                    <Medal className="w-3.5 h-3.5 text-[#F5A623]" /> Bulletin de Notes
                                </h2>
                                <Button variant="ghost" className="h-6 text-[9px] font-black text-[#1A6CC8] uppercase">Tout voir</Button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {grades.slice(0, 5).map((grade: any) => (
                                    <div key={grade.id} className="p-3 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-[#1A6CC8] uppercase mb-0.5">{grade.subject || "Quizz"}</p>
                                            <h4 className="font-bold text-xs truncate uppercase">{grade.quizTitle || "Évaluation"}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-black text-[#0D2D5A]">{grade.score}</span>
                                            <span className="text-[10px] font-bold text-slate-300 ml-1">/{grade.totalPoints}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Homework Tracker */}
                        <div className="border border-slate-100 rounded-none bg-white">
                            <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                    <BookOpen className="w-3.5 h-3.5 text-[#1A6CC8]" /> Devoirs & Travaux
                                </h2>
                                <Button variant="ghost" className="h-6 text-[9px] font-black text-[#1A6CC8] uppercase">Planning</Button>
                            </div>
                            <div className="divide-y divide-slate-50">
                                {homework.slice(0, 5).map((task: any) => (
                                    <div key={task.id} className="p-3 flex items-center justify-between gap-4">
                                        <div className="min-w-0">
                                            <h4 className="font-bold text-xs truncate uppercase">{task.title}</h4>
                                            <p className="text-[9px] text-slate-400 mt-0.5 font-bold">Échéance: {task.dueDate}</p>
                                        </div>
                                        <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 h-4 rounded-none ${
                                            task.status === "completed" ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                        }`}>
                                            {task.status === "completed" ? "FAIT" : "À FAIRE"}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Teacher Recommendations - Eureka Style */}
                    <div className="border border-slate-100 bg-slate-50/20 p-4 rounded-none">
                        <h2 className="text-[11px] font-black uppercase tracking-widest text-[#0D2D5A] flex items-center gap-2 mb-4">
                            <Star className="w-4 h-4 text-[#F5A623]" /> Conseils & Observations Pédagogiques
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 gap-4">
                            {evaluations.map((ev: any) => (
                                <div key={ev.id} className="bg-white border border-slate-100 p-4 relative shadow-none">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-none bg-[#1A6CC8]/10 flex items-center justify-center">
                                            <GraduationCap className="w-4 h-4 text-[#1A6CC8]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-[#0D2D5A] uppercase">{ev.teacherName}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                                                {new Date(ev.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </p>
                                        </div>
                                        <div className="ml-auto flex items-center">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-2.5 h-2.5 ${i < ev.rating ? 'text-[#F5A623] fill-[#F5A623]' : 'text-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>
                                    <p className="text-xs text-[#0D2D5A] leading-relaxed italic font-medium">
                                        "{ev.comment}"
                                    </p>
                                </div>
                            ))}
                            {evaluations.length === 0 && (
                                <div className="md:col-span-2 text-center py-8 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    Aucune observation enregistrée pour le moment
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
