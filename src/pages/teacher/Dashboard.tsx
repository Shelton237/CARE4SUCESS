import { useQuery } from "@tanstack/react-query";
import {
    Users,
    Calendar,
    ArrowUpRight,
    Clock,
    BookOpen,
    Target,
    Plus,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Briefcase,
    GraduationCap,
    TrendingUp
} from "lucide-react";
import { fetchTeacherDashboard } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: dashData, isLoading } = useQuery({
        queryKey: ["teacherDashboard", user?.id],
        queryFn: () => fetchTeacherDashboard(user!.id),
        enabled: !!user?.id,
    });

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]" />
            </div>
        );
    }

    const stats = dashData?.stats || {};
    const upcomingSessions = dashData?.schedule || [];
    const students = dashData?.students || [];

    const kpiCards = [
        { label: "Heures ce mois", value: `${stats.monthlyEarnings ? Math.round(stats.monthlyEarnings / 10000) : 0}h`, icon: Clock, color: "text-[#1A6CC8]", bg: "bg-blue-50/50" },
        { label: "Apprenants actifs", value: stats.activeStudents || 0, icon: Users, color: "text-[#0D2D5A]", bg: "bg-slate-50/50" },
        { label: "Moyenne globale", value: stats.avgGrade || "14.5", icon: Target, color: "text-[#1A6CC8]", bg: "bg-blue-50/50" },
        { label: "Satisfaction", value: `${stats.avgRating || "5.0"}/5`, icon: GraduationCap, color: "text-[#F5A623]", bg: "bg-orange-50/50" },
    ];

    return (
        <div className="w-full p-6 space-y-6 animate-in fade-in duration-500 bg-white min-h-screen">
            {/* Header / Brand Section */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-blue-50 text-[#1A6CC8] border-none font-black px-2 py-0.5 uppercase tracking-tighter text-[9px]">
                            <Briefcase className="w-2.5 h-2.5 mr-1" /> ENSEIGNANT CERTIFIÉ
                        </Badge>
                        {stats.activeStudents > 0 && (
                            <Badge className="bg-amber-50 text-[#F5A623] border-none font-black px-2 py-0.5 uppercase tracking-tighter text-[9px]">
                                <Zap className="w-2.5 h-2.5 mr-1 fill-current" /> TUTEUR ACTIF
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-[#0D2D5A] tracking-tighter uppercase">ESPACE MISSION</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                        Bienvenue, <span className="text-[#1A6CC8]">{user?.name}</span> • Prêt pour vos prochaines leçons ?
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate("/teacher/schedule")} variant="outline" className="border-slate-100 h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest">
                        Mon Agenda
                    </Button>
                    <Button onClick={() => navigate("/teacher/homework")} className="bg-[#0D2D5A] hover:bg-[#1a3d6e] h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-none">
                        <Plus className="w-3 h-3 mr-1" /> Nouveau Devoir
                    </Button>
                </div>
            </div>

            {/* Performance Banner */}
            <Card className="border border-slate-100 shadow-none bg-[#0D2D5A] text-white p-6 rounded-xl relative overflow-hidden group">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-none group-hover:rotate-3 transition-transform duration-500">
                        <GraduationCap className="w-10 h-10 text-[#F5A623] drop-shadow-[0_0_8px_rgba(245,166,35,0.4)]" />
                    </div>
                    <div className="flex-1 space-y-3 w-full text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                            <div>
                                <p className="text-blue-300 font-black uppercase tracking-widest text-[9px]">Impact Global</p>
                                <h2 className="text-2xl font-black tracking-tighter text-white uppercase">{stats.activeStudents || 0} Élèves Accompagnés</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Satisfaction {stats.avgRating || "5.0"}/5</p>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1A6CC8]" style={{ width: `${(parseFloat(stats.avgRating || "5.0") / 5) * 100}%` }} />
                            </div>
                            <p className="text-[9px] text-blue-200 font-black uppercase tracking-widest text-center md:text-right">
                                Votre excellence pédagogique est <span className="text-white">reconnue par la communauté</span>
                            </p>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Heures ce mois", value: `${stats.monthlyEarnings ? Math.round(stats.monthlyEarnings / 10000) : 0}h`, icon: Clock, color: "text-[#1A6CC8]" },
                    { label: "Apprenants Actifs", value: stats.activeStudents || 0, icon: Users, color: "text-[#0D2D5A]" },
                    { label: "Moyenne Globale", value: stats.avgGrade || "14.5", icon: Target, color: "text-[#F5A623]" },
                    { label: "Sessions Totales", value: stats.totalSessions || 0, icon: CheckCircle2, color: "text-[#10b981]" },
                ].map((s, i) => (
                    <Card key={i} className="border border-slate-100 shadow-none bg-white hover:bg-slate-50/50 transition-all duration-300 rounded-xl">
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
                {/* Section Priorités */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-2 border-b border-slate-50 pb-2">
                        <div className="w-1 h-3 bg-[#F5A623] rounded-full" />
                        <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Actions Prioritaires</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Devoirs à corriger */}
                        <div 
                            onClick={() => navigate("/teacher/homework")}
                            className={`p-4 border border-slate-100 rounded-xl cursor-pointer transition-all hover:bg-slate-50/80 ${
                                stats.pendingHomework > 0 ? "bg-amber-50/10" : "bg-white"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.pendingHomework > 0 ? "bg-amber-100 text-[#F5A623]" : "bg-slate-50 text-slate-400"}`}>
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                {stats.pendingHomework > 0 && <Badge className="bg-[#F5A623] text-white font-black text-[9px] px-1.5 border-none shadow-none">{stats.pendingHomework}</Badge>}
                            </div>
                            <h3 className="font-black text-[#0D2D5A] text-[11px] uppercase tracking-tight mb-1">Corrections en attente</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide opacity-70">
                                {stats.pendingHomework > 0 
                                    ? `Vous avez ${stats.pendingHomework} devoir(s) à évaluer.` 
                                    : "Aucun nouveau rendu à corriger."}
                            </p>
                        </div>

                        {/* Rapports à rédiger */}
                        <div 
                            onClick={() => navigate("/teacher/schedule")}
                            className={`p-4 border border-slate-100 rounded-xl cursor-pointer transition-all hover:bg-slate-50/80 ${
                                stats.pendingReports > 0 ? "bg-blue-50/10" : "bg-white"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stats.pendingReports > 0 ? "bg-blue-100 text-[#1A6CC8]" : "bg-slate-50 text-slate-400"}`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                {stats.pendingReports > 0 && <Badge className="bg-[#1A6CC8] text-white font-black text-[9px] px-1.5 border-none shadow-none">{stats.pendingReports}</Badge>}
                            </div>
                            <h3 className="font-black text-[#0D2D5A] text-[11px] uppercase tracking-tight mb-1">Rapports de séance</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide opacity-70">
                                {stats.pendingReports > 0 
                                    ? `Complétez ${stats.pendingReports} rapport(s) pour valider vos heures.` 
                                    : "Tous vos rapports sont à jour."}
                            </p>
                        </div>
                    </div>

                    {/* Prochaines séances */}
                    <Card className="bg-white border border-slate-100 shadow-none overflow-hidden rounded-xl">
                        <CardContent className="p-0">
                            <div className="p-4 border-b border-slate-50 flex items-center justify-between">
                                <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                    Séances Imminentes
                                </h3>
                                <Button variant="ghost" className="text-[#1A6CC8] font-black text-[9px] uppercase h-6 px-2" onClick={() => navigate("/teacher/schedule")}>Tout voir</Button>
                            </div>
                            
                            <div className="p-2 space-y-1">
                                {upcomingSessions.length === 0 ? (
                                    <div className="py-12 text-center">
                                        <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest opacity-50">Aucune séance prévue</p>
                                    </div>
                                ) : (
                                    upcomingSessions.slice(0, 3).map((s: any) => (
                                        <div 
                                            key={s.id} 
                                            className="flex items-center gap-3 p-3 bg-white hover:bg-slate-50/50 cursor-pointer rounded-lg transition-all group"
                                            onClick={() => navigate("/teacher/schedule")}
                                        >
                                            <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-lg flex flex-col items-center justify-center text-[#0D2D5A]">
                                                <span className="text-[8px] font-black uppercase text-slate-400 leading-none">{s.day?.slice(0, 3)}</span>
                                                <span className="text-sm font-black leading-tight">{s.date?.split('-')[2]}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <h4 className="font-black text-[#0D2D5A] text-xs uppercase tracking-tight truncate group-hover:text-[#1A6CC8] transition-colors">{s.student}</h4>
                                                    <Badge className="bg-blue-50 text-[#1A6CC8] text-[8px] font-black border-none uppercase px-1.5 py-0">
                                                        {s.subject}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                    <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> {s.time}</span>
                                                    <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 className="w-2.5 h-2.5" /> Planifié</span>
                                                </div>
                                            </div>
                                            <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-[#1A6CC8] transition-colors" />
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar - Apprenants & Liens */}
                <div className="space-y-4">
                    <Card className="bg-[#0D2D5A] p-5 text-white shadow-none rounded-xl border border-[#0D2D5A] relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <div className="p-1.5 bg-white/5 rounded-lg border border-white/10">
                                    <Users className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-200">Mes Apprenants</h3>
                            </div>
                            
                            <div className="space-y-2">
                                {students.slice(0, 4).map((st: any) => (
                                    <div key={st.id} className="flex items-center justify-between p-2.5 bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer rounded-lg transition-all" onClick={() => navigate("/teacher/students")}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-7 h-7 bg-blue-500/20 rounded-lg flex items-center justify-center text-[9px] font-black uppercase text-blue-300 border border-blue-500/20">
                                                {st.name?.split(' ').map((n:any)=>n[0]).join('')}
                                            </div>
                                            <span className="text-[11px] font-black uppercase tracking-tight truncate max-w-[100px]">{st.name}</span>
                                        </div>
                                        <Badge className="bg-[#1A6CC8] text-white font-black text-[8px] rounded-sm px-1.5 border-none shadow-none">{st.avgGrade}/20</Badge>
                                    </div>
                                ))}
                            </div>

                            <Button onClick={() => navigate("/teacher/courses")} className="w-full bg-[#1A6CC8] text-white hover:bg-blue-500 font-black uppercase text-[10px] h-8 rounded-lg shadow-none mt-2">
                                Gérer mes Cours
                            </Button>
                        </div>
                        <BookOpen className="absolute -bottom-4 -right-4 w-16 h-16 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                    </Card>

                    <div className="bg-white p-5 border border-slate-100 shadow-none space-y-4 rounded-xl">
                        <h4 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest border-b border-slate-50 pb-2">Ressources rapides</h4>
                        <div className="space-y-1">
                            <Button variant="ghost" className="w-full justify-start font-black uppercase text-[10px] text-slate-400 hover:text-[#0D2D5A] hover:bg-slate-50 h-8 px-2 rounded-lg" onClick={() => navigate("/teacher/profile")}>
                                <Users className="w-3.5 h-3.5 mr-3" /> Profil Tuteur
                            </Button>
                            <Button variant="ghost" className="w-full justify-start font-black uppercase text-[10px] text-slate-400 hover:text-[#0D2D5A] hover:bg-slate-50 h-8 px-2 rounded-lg" onClick={() => navigate("/teacher/earnings")}>
                                <TrendingUp className="w-3.5 h-3.5 mr-3" /> Statistiques Gains
                            </Button>
                        </div>
                    </div>

                    <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100/50 space-y-2">
                        <h4 className="text-[9px] font-black text-[#F5A623] uppercase tracking-widest">Conseil Pro</h4>
                        <p className="text-[10px] text-[#0D2D5A] font-bold leading-relaxed opacity-80 uppercase">
                            N'oubliez pas de valider vos rapports de séance pour accélérer votre facturation mensuelle.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}/div>
        </div>
    );
}
