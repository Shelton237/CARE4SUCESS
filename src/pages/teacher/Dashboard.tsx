import {
    Users,
    CalendarDays,
    Star,
    Loader2,
    TrendingUp,
    ArrowUpRight,
    Clock,
    Zap,
    BookOpen,
    Target,
    UserCheck
} from "lucide-react";
import { formatFCFA } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherDashboard } from "@/api/backoffice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Cell } from "recharts";

export default function TeacherDashboard() {
    const { user } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ["teacherDashboard", user?.id],
        queryFn: () => fetchTeacherDashboard(user!.id),
        enabled: !!user?.id,
    });

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#0D2D5A]" />
            </div>
        );
    }

    const stats = data?.stats || {
        upcomingSessions: 0,
        activeStudents: 0,
        monthlyEarnings: 0,
        previousEarnings: 0,
        avgRating: 5.0
    };

    const chartData = [
        { name: 'Lun', hours: 4 },
        { name: 'Mar', hours: 3 },
        { name: 'Mer', hours: 6 },
        { name: 'Jeu', hours: 2 },
        { name: 'Ven', hours: 5 },
        { name: 'Sam', hours: 8 },
        { name: 'Dim', hours: 0 },
    ];

    const studentsList: any[] = data?.students || [];
    const topPerformer = studentsList.length > 0
        ? [...studentsList].sort((a, b) => parseFloat(b.avgGrade) - parseFloat(a.avgGrade))[0]
        : null;

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-1000">
            {/* HEADER */}
            <div className="relative overflow-hidden bg-[#0D2D5A] p-10 rounded-[3rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] -mr-40 -mt-40" />
                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex items-center justify-center p-5 border border-white/10 shadow-inner">
                        {user?.avatar ? <span className="text-2xl font-black text-white">{user.avatar}</span> : <Users className="w-full h-full text-blue-400" />}
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase whitespace-nowrap">
                            Hello, <span className="text-blue-400">{user?.name?.split(" ").pop()}</span>
                        </h1>
                        <p className="text-blue-100/60 font-bold text-sm mt-1 uppercase tracking-widest">
                            Prêt pour vos sessions de la journée ?
                        </p>
                    </div>
                </div>
                <div className="relative z-10 hidden lg:flex gap-4">
                    <div className="bg-white/5 backdrop-blur-xl p-6 rounded-[2rem] border border-white/5 flex items-center gap-4 shadow-2xl">
                        <div className="text-right">
                            <div className="text-3xl font-black text-white leading-none tracking-tighter">{formatFCFA(stats.monthlyEarnings)}</div>
                            <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mt-1">Revenus Mars</div>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Prochaines Sessions", value: stats.upcomingSessions, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-50", sub: "Cette semaine" },
                    { label: "Élèves Actifs", value: stats.activeStudents, icon: Users, color: "text-green-500", bg: "bg-green-50", sub: "Suivi personnalisé" },
                    { label: "Note Globale", value: `${stats.avgRating}/5`, icon: Star, color: "text-purple-500", bg: "bg-purple-50", sub: "Satisfaction parents" },
                    { label: "Taux de Réussite", value: "92%", icon: Target, color: "text-orange-500", bg: "bg-orange-50", sub: "Objectifs atteints" }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-white group overflow-hidden">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-500`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-gray-200 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                            <div className="text-3xl font-black text-[#0D2D5A] tracking-tighter">{stat.value}</div>
                            <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-wide">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* WEEKLY WORKLOAD */}
                <Card className="lg:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-0 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-[#0D2D5A] uppercase tracking-tighter">Charge de Travail</CardTitle>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Heures de cours / jour</p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest px-4 py-2">Semaine Actuelle</Badge>
                    </CardHeader>
                    <CardContent className="p-10 pt-4">
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#cbd5e1' }} dy={10} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#0D2D5A', borderRadius: '16px', border: 'none', color: '#fff' }} />
                                    <Bar dataKey="hours" radius={[8, 8, 0, 0]} barSize={35}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.hours > 5 ? '#3b82f6' : '#94a3b8'} opacity={0.3} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* UPCOMING SESSIONS */}
                <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden flex flex-col">
                    <CardHeader className="p-10 pb-2">
                        <CardTitle className="text-2xl font-black text-[#0D2D5A] uppercase tracking-tighter">Top Agenda</CardTitle>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Vos 4 prochains cours</p>
                    </CardHeader>
                    <CardContent className="p-8 flex-1 space-y-4">
                        {(!data?.schedule || data.schedule.length === 0) ? (
                            <div className="text-center py-20 flex flex-col items-center gap-4">
                                <Clock className="w-12 h-12 text-gray-100" />
                                <p className="text-gray-400 font-bold italic text-sm">Libre comme l'air !</p>
                            </div>
                        ) : (
                            data.schedule.slice(0, 4).map((s: any) => (
                                <div key={s.id} className="group p-4 rounded-3xl bg-gray-50/50 hover:bg-blue-50 transition-all duration-300 border border-transparent hover:border-blue-100 flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex flex-col items-center justify-center text-[#1A6CC8] border border-gray-100">
                                        <div className="text-[10px] font-black uppercase leading-none">{s.day?.slice(0, 3) || "?"}</div>
                                        <div className="text-lg font-black leading-none mt-1">{s.time?.split(':')[0] || "?"}h</div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-[#0D2D5A] uppercase tracking-tight truncate">{s.student}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.subject} · 1h30</p>
                                    </div>
                                    <Button size="icon" variant="ghost" className="rounded-2xl group-hover:bg-white group-hover:text-blue-600">
                                        <ArrowUpRight className="w-5 h-5" />
                                    </Button>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* MES ÉLÈVES + TOP PERFORMER */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* MES ÉLÈVES - DONNÉES RÉELLES */}
                <Card className="border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                        <div>
                            <CardTitle className="text-2xl font-black text-[#0D2D5A] uppercase tracking-tighter">Mes Élèves</CardTitle>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{studentsList.length} élève(s) suivi(s)</p>
                        </div>
                        <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-green-500" />
                        </div>
                    </CardHeader>
                    <CardContent className="px-10 pb-10 space-y-4">
                        {studentsList.length === 0 ? (
                            <div className="text-center py-10 text-gray-400 font-bold text-sm italic">
                                Aucun élève assigné pour l'instant
                            </div>
                        ) : (
                            studentsList.map((s: any) => (
                                <div key={s.id} className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50 hover:bg-blue-50 transition-all duration-300">
                                    <div className="w-12 h-12 rounded-2xl bg-[#0D2D5A] text-white flex items-center justify-center font-black text-sm">
                                        {s.name?.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-black text-[#0D2D5A] uppercase tracking-tight text-sm">{s.name}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{s.subject} · {s.level}</p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xl font-black text-[#0D2D5A]">
                                            {parseFloat(s.avgGrade).toFixed(1)}<span className="text-xs text-gray-400">/20</span>
                                        </div>
                                        <Badge className={`text-[9px] font-black border-none ${parseFloat(s.avgGrade) >= 14 ? 'bg-green-50 text-green-600' : parseFloat(s.avgGrade) >= 10 ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                                            {parseFloat(s.avgGrade) >= 14 ? '✓ Bon niveau' : parseFloat(s.avgGrade) >= 10 ? '~ Moyen' : '✗ En difficulté'}
                                        </Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* PRO INSIGHT */}
                    <Card className="border-none shadow-xl rounded-[3rem] bg-gradient-to-br from-indigo-800 to-blue-600 text-white overflow-hidden p-10 relative">
                        <Zap className="absolute top-10 right-10 w-24 h-24 text-white/10" />
                        <div className="relative z-10">
                            <Badge className="bg-white/10 text-white border-none px-3 py-1 font-black text-[9px] uppercase tracking-[0.2em] mb-6">Expert Insights</Badge>
                            <h3 className="text-4xl font-black uppercase tracking-tighter italic mb-4 leading-[0.9]">Boost your <br />Impact Score</h3>
                            <p className="text-blue-100/70 font-bold text-sm max-w-md mb-8">
                                Partager des fiches de révisions personnalisées augmente l'engagement de vos élèves de 40%.
                            </p>
                            <Button className="rounded-2xl h-14 px-8 bg-white text-[#0D2D5A] font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-2xl">
                                Créer une fiche ressource
                            </Button>
                        </div>
                    </Card>

                    {/* TOP PERFORMER - DONNÉES RÉELLES */}
                    {topPerformer && (
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 rounded-[2rem] bg-green-50 text-green-600 flex items-center justify-center p-5 shadow-inner">
                                    <BookOpen className="w-full h-full" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Top Performer</p>
                                    <h4 className="text-2xl font-black text-[#0D2D5A] uppercase tracking-tighter">{topPerformer.name}</h4>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{topPerformer.subject} · {topPerformer.level}</p>
                                    <div className="flex gap-2 mt-4">
                                        <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px] uppercase tracking-widest">{topPerformer.trend || '+1.2 pts'}</Badge>
                                        <Badge className="bg-green-50 text-green-600 border-none font-black text-[9px] uppercase tracking-widest">Major</Badge>
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-4xl font-black text-[#0D2D5A]">
                                    {parseFloat(topPerformer.avgGrade).toFixed(1)}<span className="text-sm font-bold text-gray-400">/20</span>
                                </div>
                                <p className="text-[10px] font-black text-blue-500 uppercase mt-1">Moyenne Quiz</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
