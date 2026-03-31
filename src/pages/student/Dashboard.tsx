import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    Calendar, 
    BookOpen, 
    Star, 
    TrendingUp, 
    Target, 
    MessageSquare,
    Loader2,
    CheckCircle2,
    Trophy,
    FileQuestion,
    PlayCircle,
    Zap,
    ChevronRight,
    Award
} from "lucide-react";
import { fetchStudentOverview, fetchScheduleByRole } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function StudentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const overviewQuery = useQuery({
        queryKey: ["studentOverview", user?.id],
        queryFn: () => fetchStudentOverview(user!.id),
        enabled: Boolean(user?.id),
    });

    const scheduleQuery = useQuery({
        queryKey: ["studentSchedule", user?.id],
        queryFn: () => fetchScheduleByRole("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const stats = overviewQuery.data || {
        currentAvg: 14.5,
        previousAvg: 11.8,
        streak: 0,
        level: "N/A",
        subject: "Multi-matières",
        teacher: "Mon Tuteur",
        xp: 0,
        grade: "Novice",
        gradeColor: "#94a3b8",
        nextGrade: "Apprenti",
        progressToNext: 0,
        nextXP: 200,
        myRank: 1,
        leaderboard: [],
        sessionsThisMonth: 0,
        xpBreakdown: { sessionXP: 0, quizXP: 0, lessonXP: 0, bookmarkXP: 0 },
    };

    const upcomingSessions = useMemo(() => {
        return (scheduleQuery.data || [])
            .filter((s: any) => s.status !== "effectué")
            .slice(0, 3);
    }, [scheduleQuery.data]);

    const chartData = useMemo(() => {
        return [
            { name: "Jan", note: 12.5 },
            { name: "Fév", note: 13.8 },
            { name: "Mar", note: stats.currentAvg },
        ];
    }, [stats.currentAvg]);

    const formatXP = (xp: number) => xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`;

    if (overviewQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header / Brand Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none font-black px-3 py-1 uppercase tracking-tighter text-[10px]">
                            <Zap className="w-3.5 h-3.5 mr-1.5 fill-current" /> {stats.streak} Jours de Série
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-black text-[#0D2D5A] tracking-tight">Académie de Réussite</h1>
                    <p className="text-gray-500 font-medium">Content de te revoir, <span className="text-[#0D2D5A] font-bold">{user?.name.split(" ")[0]}</span>. Prêt pour ta mission ?</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/student/courses")} variant="outline" className="border-gray-200 h-12 px-6 rounded-xl font-bold">
                        Continuer ma leçon
                    </Button>
                    <Button onClick={() => navigate("/student/quizzes")} className="bg-[#0D2D5A] hover:bg-[#1a3d6e] h-12 px-6 rounded-xl font-bold shadow-lg shadow-blue-900/10">
                        Lancer un Quiz
                    </Button>
                </div>
            </div>

            {/* Level & XP Banner */}
            <Card className="border-none shadow-sm bg-[#0D2D5A] text-white p-8 rounded-[2.5rem] relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                        <Trophy className="w-12 h-12 text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                    </div>
                    <div className="flex-1 space-y-4 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <p className="text-blue-300 font-black uppercase tracking-widest text-[10px]">Grade Actuel</p>
                                <h2 className="text-3xl font-black tracking-tighter text-white" style={{ color: stats.gradeColor }}>{stats.grade}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-bold text-blue-200">{formatXP(stats.xp)} / {formatXP(stats.nextXP || 200)} XP</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Progress value={stats.progressToNext} className="h-3 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-blue-400 [&>div]:to-indigo-400" />
                            <p className="text-[10px] text-blue-200 font-bold uppercase tracking-widest text-center md:text-right">
                                Encore <span className="text-white">{(stats.nextXP || 200) - stats.xp} XP</span> pour le grade <span className="text-white">"{stats.nextGrade}"</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -ml-32 -mb-32" />
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Moyenne Générale", value: `${stats.currentAvg}/20`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Objectif Visé", value: "16.0/20", icon: Target, color: "text-amber-600", bg: "bg-amber-50" },
                    { label: "Niveau Scolaire", value: stats.level, icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
                    { label: "Sessions", value: `${stats.sessionsThisMonth ?? 0}`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((s, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            <div className={`w-12 h-12 rounded-2xl ${s.bg} ${s.color} flex items-center justify-center mb-4`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                            <h3 className="text-2xl font-black text-[#0D2D5A] mt-1">{s.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Evolution Chart */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-[#0D2D5A] flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#0D2D5A] rounded-full" />
                            Ta Courbe de Réussite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <div className="h-[280px] w-full mt-6">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorNote" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1A6CC8" stopOpacity={0.15}/>
                                            <stop offset="95%" stopColor="#1A6CC8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 700 }} dy={10} />
                                    <YAxis domain={[0, 20]} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }} />
                                    <Area type="monotone" dataKey="note" stroke="#1A6CC8" strokeWidth={4} fillOpacity={1} fill="url(#colorNote)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar - Prochains Cours */}
                <div className="space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-sm font-black text-[#0D2D5A] uppercase tracking-widest flex items-center justify-between">
                                Prochains Cours
                                <Calendar className="w-4 h-4 text-blue-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-4">
                            {upcomingSessions.length > 0 ? (
                                upcomingSessions.map((session: any) => (
                                    <div key={session.id} className="p-4 rounded-2xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all group">
                                        <div className="flex items-center justify-between mb-3">
                                            <Badge className="bg-white text-[#1A6CC8] border-blue-50 text-[9px] font-black px-2 uppercase">{session.subject}</Badge>
                                            <span className="text-[10px] font-bold text-gray-400">{session.time}</span>
                                        </div>
                                        <h4 className="font-black text-[#0D2D5A] text-sm group-hover:text-blue-600 transition-colors">{session.teacher}</h4>
                                        <div className="flex items-center justify-between mt-3">
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{session.day} {session.date}</span>
                                            <Button size="sm" onClick={() => navigate(`/virtual-class/${session.id}`)} className="h-8 w-8 rounded-lg bg-blue-600 hover:bg-[#0D2D5A] p-0 shadow-lg shadow-blue-200">
                                                <PlayCircle className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-gray-400 text-xs font-bold italic">Zone de calme... aucun cours prévu.</p>
                                </div>
                            )}
                            <Button variant="ghost" className="w-full text-xs font-black text-blue-600 hover:bg-blue-50 mt-2" onClick={() => navigate("/student/schedule")}>
                                Voir tout mon agenda <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quiz Quick Action */}
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-xl group overflow-hidden relative">
                        <div className="relative z-10 space-y-4">
                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                                <FileQuestion className="w-5 h-5 text-blue-200" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black tracking-tight">Challenge du Jour</h3>
                                <p className="text-blue-100 text-[10px] font-bold opacity-80 uppercase tracking-widest">Gagne +50 XP maintenant !</p>
                            </div>
                            <Button className="w-full bg-white text-indigo-600 hover:bg-blue-50 font-black h-11 rounded-xl shadow-lg group-hover:scale-[1.02] transition-transform">
                                Relever le défi
                            </Button>
                        </div>
                        <Zap className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </div>
                </div>
            </div>

            {/* Leaderboard & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-8">
                {/* Ranking */}
                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-sm font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            Classement des Champions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-2 space-y-4">
                        {(stats.leaderboard?.length > 0 ? stats.leaderboard : [
                            { name: "Fatou K.", xp: 3120, rank: 1 },
                            { name: "Salif B.", xp: 2850, rank: 2 },
                            { name: "Toi", xp: stats.xp, rank: stats.myRank || 3, isMe: true },
                        ]).map((player: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-3 rounded-2xl transition-all ${player.isMe ? 'bg-blue-50 border border-blue-100' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-4">
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-amber-100 text-amber-600' : i === 1 ? 'bg-slate-100 text-slate-500' : 'bg-orange-50 text-orange-600'}`}>
                                        {i + 1 === 1 ? "🥇" : i + 1 === 2 ? "🥈" : i + 1 === 3 ? "🥉" : i + 1}
                                    </span>
                                    <span className={`text-sm font-bold ${player.isMe ? 'text-blue-600' : 'text-[#0D2D5A]'}`}>{player.name}</span>
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{formatXP(player.xp)} XP</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Prof Feedback */}
                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-sm font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <Award className="w-4 h-4 text-emerald-500" />
                            Mot de ton Tuteur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-8 pb-8 pt-2">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-xl shadow-inner">
                                {stats.teacher?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-black text-[#0D2D5A] text-sm">{stats.teacher}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tuteur Référent</p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-2xl mb-6 relative group italic">
                            <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                "Tes efforts en mathématiques paient enfin ! Continue sur cette lancée, tu approches du grade supérieur."
                            </p>
                            <Star className="absolute -top-2 -right-2 w-5 h-5 text-amber-400 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <Button 
                            onClick={() => navigate("/student/messages")}
                            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-xl flex items-center gap-2"
                        >
                            <MessageSquare className="w-4 h-4" /> Message au Tuteur
                        </Button>
                    </CardContent>
                </Card>

                {/* Performance Summary */}
                <Card className="border-none shadow-sm bg-[#F5A623] text-white rounded-[2rem] p-8 space-y-4">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                        <Star className="w-5 h-5 text-white fill-current" />
                    </div>
                    <h3 className="text-xl font-black leading-tight">En route pour l'Excellence</h3>
                    <p className="text-sm font-medium opacity-90 leading-relaxed">
                        Tu as complété <span className="font-black text-white">85%</span> de tes objectifs ce mois-ci. Ta régularité est ta plus grande force !
                    </p>
                    <div className="pt-4">
                        <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-black h-11 rounded-xl">
                            Voir mon rapport
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
