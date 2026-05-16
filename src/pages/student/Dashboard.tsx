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
        currentAvg: null,
        previousAvg: null,
        streak: 0,
        level: "N/A",
        subject: "Multi-matières",
        teacher: "Non assigné",
        xp: 0,
        grade: "Débutant",
        gradeColor: "#94a3b8",
        nextGrade: "Apprenti",
        progressToNext: 0,
        nextXP: 200,
        myRank: 0,
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
        return stats.history || [];
    }, [stats]);

    const formatXP = (xp: number) => xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`;

    if (overviewQuery.isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]" />
            </div>
        );
    }

    return (
        <div className="w-full p-4 md:p-6 space-y-6 animate-in fade-in duration-500 bg-white min-h-screen">
            {/* Header / Brand Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-amber-50 text-[#F5A623] border-none font-black px-2 py-0.5 uppercase tracking-tighter text-[9px]">
                            <Zap className="w-2.5 h-2.5 mr-1 fill-current" /> {stats.streak} JOURS DE SÉRIE
                        </Badge>
                    </div>
                    <h1 className="text-2xl font-black text-[#0D2D5A] tracking-tighter uppercase">ACADÉMIE DE RÉUSSITE</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                        Ravi de te revoir, <span className="text-[#1A6CC8]">{user?.name.split(" ")[0]}</span> • Prêt pour ta mission ?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate("/student/courses")} variant="outline" className="border-slate-100 h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest">
                        Ma leçon
                    </Button>
                    <Button onClick={() => navigate("/student/quizzes")} className="bg-[#0D2D5A] hover:bg-[#1a3d6e] h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-none">
                        Lancer un Quiz
                    </Button>
                </div>
            </div>

            {/* Level & XP Banner */}
            <Card className="border border-slate-100 shadow-none bg-[#0D2D5A] text-white p-4 md:p-6 rounded-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-none group-hover:rotate-3 transition-transform duration-500">
                        <Trophy className="w-10 h-10 text-[#F5A623] drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]" />
                    </div>
                    <div className="flex-1 space-y-3 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                            <div>
                                <p className="text-blue-300 font-black uppercase tracking-widest text-[9px]">Grade Actuel</p>
                                <h2 className="text-2xl font-black tracking-tighter text-white uppercase" style={{ color: stats.gradeColor }}>{stats.grade}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">{formatXP(stats.xp)} / {formatXP(stats.nextXP || 200)} XP</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Progress value={stats.progressToNext} className="h-2 bg-white/5 [&>div]:bg-[#1A6CC8]" />
                            <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest text-center md:text-right">
                                Encore <span className="text-white">{(stats.nextXP || 200) - stats.xp} XP</span> pour le grade <span className="text-white">"{stats.nextGrade}"</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Moyenne Générale", value: stats.currentAvg ? `${stats.currentAvg}/20` : "--/20", icon: TrendingUp, color: "text-[#1A6CC8]" },
                    { label: "Objectif Visé", value: stats.targetAvg ? `${stats.targetAvg}/20` : "--/20", icon: Target, color: "text-[#F5A623]" },
                    { label: "Niveau Scolaire", value: stats.level, icon: BookOpen, color: "text-[#0D2D5A]" },
                    { label: "Sessions", value: `${stats.sessionsThisMonth ?? 0}`, icon: CheckCircle2, color: "text-[#10b981]" },
                ].map((s, i) => (
                    <Card key={i} className="border border-slate-100 shadow-none bg-white hover:bg-slate-50/50 transition-all duration-300">
                        <CardContent className="p-5">
                            <div className={`w-9 h-9 rounded-lg bg-slate-50 ${s.color} flex items-center justify-center mb-3`}>
                                <s.icon className="w-5 h-5" />
                            </div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                            <h3 className="text-xl font-black text-[#0D2D5A] mt-0.5 tracking-tight">{s.value}</h3>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <Card className="lg:col-span-2 border border-slate-100 shadow-none bg-white rounded-xl">
                    <CardHeader className="p-4 md:p-6 pb-2">
                        <CardTitle className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1 h-3 bg-[#0D2D5A] rounded-full" />
                            Courbe de Réussite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 pt-0">
                        <div className="h-[220px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorNote" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1A6CC8" stopOpacity={0.05}/>
                                            <stop offset="95%" stopColor="#1A6CC8" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} dy={10} />
                                    <YAxis domain={[0, 20]} hide />
                                    <Tooltip contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px', fontWeight: '900' }} />
                                    <Area type="monotone" dataKey="note" stroke="#1A6CC8" strokeWidth={3} fillOpacity={1} fill="url(#colorNote)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar - Prochains Cours */}
                <div className="space-y-4">
                    <Card className="border border-slate-100 shadow-none bg-white rounded-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center justify-between">
                                Prochains Cours
                                <Calendar className="w-3.5 h-3.5 text-[#1A6CC8]" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-1 space-y-3">
                            {upcomingSessions.length > 0 ? (
                                upcomingSessions.map((session: any) => (
                                    <div key={session.id} className="p-3 rounded-lg bg-slate-50/50 border border-transparent hover:border-slate-100 hover:bg-white transition-all group">
                                        <div className="flex items-center justify-between mb-2">
                                            <Badge className="bg-white text-[#1A6CC8] border border-slate-100 text-[8px] font-black px-1.5 uppercase tracking-tighter">{session.subject}</Badge>
                                            <span className="text-[9px] font-black text-slate-400">{session.time}</span>
                                        </div>
                                        <h4 className="font-black text-[#0D2D5A] text-xs group-hover:text-[#1A6CC8] transition-colors uppercase">{session.teacher}</h4>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{session.day} {session.date}</span>
                                            <Button size="sm" onClick={() => navigate(`/virtual-class/${session.id}`)} className="h-6 w-6 rounded-lg bg-[#1A6CC8] hover:bg-[#0D2D5A] p-0 shadow-none">
                                                <PlayCircle className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-50">Aucun cours prévu</p>
                                </div>
                            )}
                            <Button variant="ghost" className="w-full text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest h-7" onClick={() => navigate("/student/schedule")}>
                                Agenda complet <ChevronRight className="w-3 h-3 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quiz Quick Action */}
                    <div className="bg-[#0D2D5A] rounded-xl p-5 text-white shadow-none group overflow-hidden relative border border-slate-800">
                        <div className="relative z-10 space-y-3">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                                <FileQuestion className="w-4 h-4 text-blue-200" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">Challenge</h3>
                                <p className="text-blue-200 text-[9px] font-black uppercase tracking-widest opacity-60">Gagne +50 XP</p>
                            </div>
                            <Button className="w-full bg-[#1A6CC8] text-white hover:bg-blue-500 font-black h-8 rounded-lg text-[10px] uppercase tracking-widest transition-transform shadow-none">
                                Commencer
                            </Button>
                        </div>
                        <Zap className="absolute -bottom-2 -right-2 w-16 h-16 text-white/5 -rotate-12" />
                    </div>
                </div>
            </div>

            {/* Ranking & Tuteur */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
                <Card className="border border-slate-100 shadow-none bg-white rounded-xl">
                    <CardHeader className="p-4 md:p-6 pb-2">
                        <CardTitle className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="w-3.5 h-3.5 text-[#F5A623]" />
                            Champions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2 space-y-3">
                        {(stats.leaderboard?.length > 0 ? stats.leaderboard : []).map((player: any, i: number) => (
                            <div key={i} className={`flex items-center justify-between p-2 rounded-lg transition-all ${player.isMe ? 'bg-slate-50 border border-slate-100' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black ${i === 0 ? 'bg-amber-100 text-[#F5A623]' : 'bg-slate-100 text-slate-500'}`}>
                                        {i + 1}
                                    </span>
                                    <span className={`text-xs font-bold uppercase ${player.isMe ? 'text-[#1A6CC8]' : 'text-[#0D2D5A]'}`}>{player.name}</span>
                                </div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{formatXP(player.xp)} XP</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="border border-slate-100 shadow-none bg-white rounded-xl">
                    <CardHeader className="p-4 md:p-6 pb-2">
                        <CardTitle className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <Award className="w-3.5 h-3.5 text-emerald-500" />
                            Mot du Tuteur
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 text-[#0D2D5A] flex items-center justify-center font-black text-sm">
                                {stats.teacher?.charAt(0)}
                            </div>
                            <div>
                                <h4 className="font-black text-[#0D2D5A] text-xs uppercase tracking-tight">{stats.teacher}</h4>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tuteur Référent</p>
                            </div>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-lg mb-4 italic border-l-2 border-[#1A6CC8]">
                            <p className="text-[11px] text-slate-500 font-bold leading-relaxed">
                                "Continue sur cette lancée, tu approches du grade supérieur."
                            </p>
                        </div>
                        <Button 
                            onClick={() => navigate("/student/messages")}
                            className="w-full h-8 bg-[#0D2D5A] hover:bg-[#1A6CC8] font-black text-[10px] uppercase tracking-widest text-white rounded-lg flex items-center gap-2"
                        >
                            <MessageSquare className="w-3 h-3" /> Message
                        </Button>
                    </CardContent>
                </Card>

                <div className="bg-[#F5A623] text-white rounded-xl p-4 md:p-6 space-y-3 relative overflow-hidden border border-amber-600">
                    <Star className="w-8 h-8 text-white/20 fill-current mb-1" />
                    <h3 className="text-lg font-black leading-tight uppercase tracking-tight">Objectifs</h3>
                    <p className="text-[11px] font-black opacity-90 leading-normal uppercase">
                        Garde le rythme pour atteindre tes objectifs de ce mois-ci.
                    </p>
                    <div className="pt-2">
                        <Button variant="outline" className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white font-black h-8 rounded-lg text-[9px] uppercase tracking-widest shadow-none">
                            Rapport complet
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
