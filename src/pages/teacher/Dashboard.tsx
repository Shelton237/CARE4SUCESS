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
        <div className="w-full p-3 space-y-3 animate-in fade-in duration-500 bg-white">
            {/* Header Sober & Pro */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="border-slate-200 text-[#0D2D5A] font-black px-2 py-0.5 rounded-none bg-white text-[10px] uppercase tracking-wider">
                            <Briefcase className="w-3 h-3 mr-1" /> Enseignant Certifié
                        </Badge>
                        {stats.activeStudents > 0 && (
                            <Badge className="bg-[#F5A623] text-white border-none font-black px-2 py-0.5 rounded-none text-[10px] uppercase tracking-wider">
                                Tuteur Actif
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-xl font-black text-[#0D2D5A] tracking-tight uppercase">Espace Mission</h1>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wide">Plateforme de suivi pédagogique — Bienvenue, {user?.name}.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button onClick={() => navigate("/teacher/schedule")} variant="outline" className="border-slate-200 hover:bg-slate-50 text-[#0D2D5A] font-black uppercase text-[10px] h-8 px-3 rounded-none shadow-none">
                        Mon Agenda
                    </Button>
                    <Button onClick={() => navigate("/teacher/homework")} className="bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white font-black uppercase text-[10px] h-8 px-3 rounded-none shadow-none">
                        <Plus className="w-3 h-3 mr-1" /> Nouveau Devoir
                    </Button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border border-slate-200 shadow-none bg-white rounded-none">
                        <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                                <div className={`p-2 ${kpi.bg} ${kpi.color}`}>
                                    <kpi.icon className="w-4 h-4" />
                                </div>
                                <TrendingUp className="w-3 h-3 text-[#1A6CC8]" />
                            </div>
                            <div className="mt-3">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className="text-lg font-black text-[#0D2D5A] mt-0.5 tracking-tight">{kpi.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Section Priorités - DYNAMIQUE */}
                <div className="lg:col-span-2 space-y-3">
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                        <div className="w-1 h-3 bg-[#F5A623] rounded-none" />
                        <h2 className="text-xs font-black text-[#0D2D5A] uppercase tracking-tight">Actions Prioritaires</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Devoirs à corriger */}
                        <div 
                            onClick={() => navigate("/teacher/homework")}
                            className={`p-3 border border-slate-200 rounded-none cursor-pointer shadow-none ${
                                stats.pendingHomework > 0 
                                ? "bg-orange-50/20" 
                                : "bg-slate-50/50 opacity-80"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-1.5 ${stats.pendingHomework > 0 ? "bg-[#F5A623]/10 text-[#F5A623]" : "bg-slate-100 text-slate-400"}`}>
                                    <AlertCircle className="w-4 h-4" />
                                </div>
                                {stats.pendingHomework > 0 && <Badge className="bg-[#F5A623] text-white font-black text-[10px] rounded-none px-1.5 border-none">{stats.pendingHomework}</Badge>}
                            </div>
                            <h3 className="font-black text-[#0D2D5A] text-[10px] uppercase mb-0.5 tracking-tight">Corrections en attente</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                {stats.pendingHomework > 0 
                                    ? `Vous avez ${stats.pendingHomework} devoir(s) à évaluer.` 
                                    : "Aucun nouveau rendu à corriger."}
                            </p>
                        </div>

                        {/* Rapports à rédiger */}
                        <div 
                            onClick={() => navigate("/teacher/schedule")}
                            className={`p-3 border border-slate-200 rounded-none cursor-pointer shadow-none ${
                                stats.pendingReports > 0 
                                ? "bg-blue-50/20" 
                                : "bg-slate-50/50 opacity-80"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className={`p-1.5 ${stats.pendingReports > 0 ? "bg-[#1A6CC8]/10 text-[#1A6CC8]" : "bg-slate-100 text-slate-400"}`}>
                                    <Clock className="w-4 h-4" />
                                </div>
                                {stats.pendingReports > 0 && <Badge className="bg-[#1A6CC8] text-white font-black text-[10px] rounded-none px-1.5 border-none">{stats.pendingReports}</Badge>}
                            </div>
                            <h3 className="font-black text-[#0D2D5A] text-[10px] uppercase mb-0.5 tracking-tight">Rapports de séance</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                {stats.pendingReports > 0 
                                    ? `Complétez ${stats.pendingReports} rapport(s) pour valider vos heures.` 
                                    : "Tous vos rapports sont à jour."}
                            </p>
                        </div>
                    </div>

                    {/* Prochaines séances */}
                    <div className="bg-white border border-slate-200 p-3 shadow-none space-y-3 rounded-none">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-tight">Séances imminentes</h3>
                            <Button variant="ghost" className="text-[#1A6CC8] font-black text-[10px] uppercase h-6 px-2 rounded-none hover:bg-slate-50" onClick={() => navigate("/teacher/schedule")}>Tout voir</Button>
                        </div>
                        
                        <div className="space-y-2">
                            {upcomingSessions.length === 0 ? (
                                <div className="py-6 text-center bg-slate-50/50 border border-slate-100 rounded-none">
                                    <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-wide">Votre planning est vide pour le moment</p>
                                </div>
                            ) : (
                                upcomingSessions.slice(0, 2).map((s: any) => (
                                    <div 
                                        key={s.id} 
                                        className="flex items-center gap-3 p-3 bg-white border border-slate-100 hover:border-[#1A6CC8] cursor-pointer shadow-none rounded-none"
                                        onClick={() => navigate("/teacher/schedule")}
                                    >
                                        <div className="w-10 h-10 bg-slate-50 border border-slate-100 flex flex-col items-center justify-center text-[#0D2D5A]">
                                            <span className="text-[8px] font-black uppercase text-slate-400">{s.day?.slice(0, 3)}</span>
                                            <span className="text-sm font-black">{s.date?.split('-')[2]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black text-[#0D2D5A] text-xs uppercase tracking-tight truncate">{s.student}</h4>
                                                <Badge variant="secondary" className="bg-slate-100 text-[#0D2D5A] text-[8px] font-black border-none uppercase px-1.5 py-0 rounded-none">
                                                    {s.subject}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold uppercase tracking-wide">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.time}</span>
                                                <span className="flex items-center gap-1 text-[#F5A623]"><CheckCircle2 className="w-3 h-3" /> Confirmé</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-4 h-4 text-[#1A6CC8]" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Performance & Liens */}
                <div className="space-y-3">
                    <div className="bg-[#0D2D5A] p-4 text-white shadow-none rounded-none border border-[#0D2D5A]">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                                <div className="p-1.5 bg-white/10">
                                    <BookOpen className="w-3 h-3 text-[#1A6CC8]" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-tight">Mes Apprenants</h3>
                            </div>
                            
                            <div className="space-y-2">
                                {students.slice(0, 3).map((st: any) => (
                                    <div key={st.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/10 cursor-pointer rounded-none hover:bg-white/10" onClick={() => navigate("/teacher/students")}>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 bg-[#1A6CC8]/20 flex items-center justify-center text-[8px] font-black uppercase text-[#1A6CC8]">
                                                {st.name?.split(' ').map((n:any)=>n[0]).join('')}
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-tight truncate max-w-[90px]">{st.name}</span>
                                        </div>
                                        <Badge className="bg-[#1A6CC8] text-white font-black text-[9px] rounded-none px-1.5 border-none">{st.avgGrade}/20</Badge>
                                    </div>
                                ))}
                                {students.length > 3 && (
                                    <button onClick={() => navigate("/teacher/students")} className="w-full text-center text-[10px] font-black uppercase text-[#1A6CC8] hover:text-white transition-colors">
                                        + {students.length - 3} autres élèves
                                    </button>
                                )}
                            </div>

                            <Button onClick={() => navigate("/teacher/courses")} className="w-full bg-[#1A6CC8] text-white hover:bg-[#F5A623] font-black uppercase text-[10px] h-8 rounded-none shadow-none mt-2">
                                Gérer mes Cours
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white p-3 border border-slate-200 shadow-none space-y-3 rounded-none">
                        <h4 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest border-b border-slate-100 pb-2">Ressources rapides</h4>
                        <div className="grid grid-cols-1 gap-1">
                            <Button variant="ghost" className="w-full justify-start font-black uppercase text-[10px] text-slate-400 hover:text-[#0D2D5A] hover:bg-slate-50 h-8 px-2 rounded-none" onClick={() => navigate("/teacher/profile")}>
                                <Users className="w-3 h-3 mr-2" /> Mon Profil Tuteur
                            </Button>
                            <Button variant="ghost" className="w-full justify-start font-black uppercase text-[10px] text-slate-400 hover:text-[#0D2D5A] hover:bg-slate-50 h-8 px-2 rounded-none" onClick={() => navigate("/teacher/earnings")}>
                                <Clock className="w-3 h-3 mr-2" /> Historique Gains
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
