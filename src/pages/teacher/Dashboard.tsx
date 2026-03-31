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
        { label: "Heures ce mois", value: `${stats.monthlyEarnings ? Math.round(stats.monthlyEarnings / 10000) : 0}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Apprenants actifs", value: stats.activeStudents || 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        { label: "Moyenne globale", value: stats.avgGrade || "14.5", icon: Target, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Satisfaction", value: `${stats.avgRating || "5.0"}/5`, icon: GraduationCap, color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header Sober & Pro */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-[#0D2D5A] text-[#0D2D5A] font-bold px-3 py-1 bg-white">
                            <Briefcase className="w-3 h-3 mr-1.5" /> Enseignant Certifié
                        </Badge>
                        {stats.activeStudents > 0 && (
                            <Badge className="bg-emerald-500 text-white border-none font-bold px-3 py-1">
                                Tuteur Actif
                            </Badge>
                        )}
                    </div>
                    <h1 className="text-3xl font-black text-[#0D2D5A] tracking-tight">Espace Mission</h1>
                    <p className="text-gray-500 font-medium mt-1">Plateforme de suivi pédagogique — Bienvenue, {user?.name}.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/teacher/schedule")} variant="outline" className="border-gray-200 hover:bg-gray-50 font-bold h-12 px-6 rounded-xl">
                        Mon Agenda
                    </Button>
                    <Button onClick={() => navigate("/teacher/homework")} className="bg-[#0D2D5A] hover:bg-[#1a3d6e] font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-900/10">
                        <Plus className="w-4 h-4 mr-2" /> Nouveau Devoir
                    </Button>
                </div>
            </div>

            {/* KPIs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className={`p-3 rounded-2xl ${kpi.bg} ${kpi.color} transition-transform group-hover:scale-110 duration-300`}>
                                    <kpi.icon className="w-6 h-6" />
                                </div>
                                <TrendingUp className="w-4 h-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
                                <h3 className="text-2xl font-black text-[#0D2D5A] mt-1">{kpi.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Section Priorités - DYNAMIQUE */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-[#0D2D5A] rounded-full" />
                        <h2 className="text-xl font-black text-[#0D2D5A]">Actions Prioritaires</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Devoirs à corriger */}
                        <div 
                            onClick={() => navigate("/teacher/homework")}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                                stats.pendingHomework > 0 
                                ? "bg-amber-50 border-amber-100 hover:bg-amber-100 shadow-sm" 
                                : "bg-gray-50 border-gray-100 opacity-60"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stats.pendingHomework > 0 ? "bg-white text-amber-600" : "bg-white text-gray-400"}`}>
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                {stats.pendingHomework > 0 && <Badge className="bg-amber-600 text-white font-black">{stats.pendingHomework}</Badge>}
                            </div>
                            <h3 className="font-bold text-[#0D2D5A] mb-1">Corrections en attente</h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {stats.pendingHomework > 0 
                                    ? `Vous avez ${stats.pendingHomework} devoir(s) à évaluer.` 
                                    : "Aucun nouveau rendu à corriger."}
                            </p>
                        </div>

                        {/* Rapports à rédiger */}
                        <div 
                            onClick={() => navigate("/teacher/schedule")}
                            className={`p-6 rounded-3xl border cursor-pointer transition-all ${
                                stats.pendingReports > 0 
                                ? "bg-rose-50 border-rose-100 hover:bg-rose-100 shadow-sm" 
                                : "bg-gray-50 border-gray-100 opacity-60"
                            }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-2xl ${stats.pendingReports > 0 ? "bg-white text-rose-600" : "bg-white text-gray-400"}`}>
                                    <Clock className="w-5 h-5" />
                                </div>
                                {stats.pendingReports > 0 && <Badge className="bg-rose-600 text-white font-black">{stats.pendingReports}</Badge>}
                            </div>
                            <h3 className="font-bold text-[#0D2D5A] mb-1">Rapports de séance</h3>
                            <p className="text-xs text-gray-500 font-medium">
                                {stats.pendingReports > 0 
                                    ? `Complétez ${stats.pendingReports} rapport(s) pour valider vos heures.` 
                                    : "Tous vos rapports sont à jour."}
                            </p>
                        </div>
                    </div>

                    {/* Prochaines séances */}
                    <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-[#0D2D5A]">Séances imminentes</h3>
                            <Button variant="ghost" className="text-blue-600 font-bold text-sm" onClick={() => navigate("/teacher/schedule")}>Tout voir</Button>
                        </div>
                        
                        <div className="space-y-4">
                            {upcomingSessions.length === 0 ? (
                                <div className="py-12 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                    <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-400 font-bold text-sm">Votre planning est vide pour le moment</p>
                                </div>
                            ) : (
                                upcomingSessions.slice(0, 2).map((s: any) => (
                                    <div 
                                        key={s.id} 
                                        className="flex items-center gap-6 p-5 rounded-2xl bg-gray-50 hover:bg-white border border-transparent hover:border-blue-100 transition-all cursor-pointer group shadow-sm"
                                        onClick={() => navigate("/teacher/schedule")}
                                    >
                                        <div className="w-14 h-14 rounded-xl bg-white border border-gray-100 flex flex-col items-center justify-center text-[#0D2D5A] group-hover:bg-[#0D2D5A] group-hover:text-white transition-all duration-300">
                                            <span className="text-[10px] font-black group-hover:text-white/70 uppercase">{s.day?.slice(0, 3)}</span>
                                            <span className="text-lg font-black">{s.date?.split('-')[2]}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-[#0D2D5A] text-base truncate">{s.student}</h4>
                                                <Badge variant="secondary" className="bg-white text-[#0D2D5A] text-[9px] font-black border-gray-200 uppercase px-2 py-0.5">
                                                    {s.subject}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-500 font-bold">
                                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {s.time}</span>
                                                <span className="flex items-center gap-1.5 text-emerald-600"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmé</span>
                                            </div>
                                        </div>
                                        <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-[#0D2D5A] group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar - Performance & Liens */}
                <div className="space-y-6">
                    <div className="bg-[#0D2D5A] rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-300" />
                                </div>
                                <h3 className="text-lg font-black">Mes Apprenants</h3>
                            </div>
                            
                            <div className="space-y-4">
                                {students.slice(0, 3).map((st: any) => (
                                    <div key={st.id} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => navigate("/teacher/students")}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-400/20 flex items-center justify-center text-[10px] font-black">
                                                {st.name?.split(' ').map((n:any)=>n[0]).join('')}
                                            </div>
                                            <span className="text-sm font-bold truncate max-w-[100px]">{st.name}</span>
                                        </div>
                                        <Badge className="bg-emerald-400 text-slate-900 font-bold text-[9px]">{st.avgGrade}/20</Badge>
                                    </div>
                                ))}
                                {students.length > 3 && (
                                    <button onClick={() => navigate("/teacher/students")} className="w-full text-center text-xs font-bold text-blue-300 hover:text-white transition-colors">
                                        + {students.length - 3} autres élèves
                                    </button>
                                )}
                            </div>

                            <Button onClick={() => navigate("/teacher/courses")} className="w-full bg-white text-[#0D2D5A] hover:bg-blue-50 font-black h-12 rounded-2xl shadow-lg mt-4">
                                Gérer mes Cours
                            </Button>
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                        <h4 className="text-xs font-black text-[#0D2D5A] uppercase tracking-widest border-b border-gray-50 pb-3">Ressources rapides</h4>
                        <div className="grid grid-cols-1 gap-2">
                            <Button variant="ghost" className="w-full justify-start font-bold text-gray-500 hover:text-[#0D2D5A] hover:bg-gray-50" onClick={() => navigate("/teacher/profile")}>
                                <Users className="w-4 h-4 mr-3" /> Mon Profil Tuteur
                            </Button>
                            <Button variant="ghost" className="w-full justify-start font-bold text-gray-500 hover:text-[#0D2D5A] hover:bg-gray-50" onClick={() => navigate("/teacher/earnings")}>
                                <Clock className="w-4 h-4 mr-3" /> Historique Gains
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
