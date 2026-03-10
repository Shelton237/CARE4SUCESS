import {
    Users,
    CalendarDays,
    Star,
    Loader2,
    TrendingUp,
    ArrowUpRight,
    Clock,
    BookOpen,
    Target,
    UserCheck,
    CheckCircle,
    Video,
    RefreshCw
} from "lucide-react";
import { formatFCFA } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherDashboard } from "@/api/backoffice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function TeacherDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["teacherDashboard", user?.id],
        queryFn: () => fetchTeacherDashboard(user!.id),
        enabled: !!user?.id,
    });

    if (!user) {
        return <div className="p-8 text-sm text-gray-500">Connectez-vous pour voir votre tableau de bord.</div>;
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-8">
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>Impossible de charger le tableau de bord.</span>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Réessayer
                    </button>
                </div>
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

    const studentsList: any[] = data?.students || [];
    const upcomingSessions: any[] = (data?.schedule || []).filter((s: any) => s.status !== "effectué");
    const topPerformer = studentsList.length > 0
        ? [...studentsList].sort((a, b) => parseFloat(b.avgGrade) - parseFloat(a.avgGrade))[0]
        : null;

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">
                        Bonjour, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Voici un récapitulatif de votre activité — Année 2025/2026
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate("/teacher/schedule")}
                    className="hidden md:flex items-center gap-2 border-[#1A6CC8]/20 text-[#1A6CC8] hover:bg-[#1A6CC8]/5"
                >
                    <CalendarDays className="w-4 h-4" />
                    Voir mon planning
                </Button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    {
                        label: "Sessions à venir",
                        value: stats.upcomingSessions,
                        icon: CalendarDays,
                        color: "text-[#1A6CC8]",
                        bg: "bg-[#1A6CC8]/5",
                        sub: "Cette semaine"
                    },
                    {
                        label: "Élèves actifs",
                        value: stats.activeStudents,
                        icon: Users,
                        color: "text-emerald-600",
                        bg: "bg-emerald-50",
                        sub: "Suivis personnellement"
                    },
                    {
                        label: "Note moyenne",
                        value: `${stats.avgRating}/5`,
                        icon: Star,
                        color: "text-amber-500",
                        bg: "bg-amber-50",
                        sub: "Satisfaction parents"
                    },
                    {
                        label: "Revenus (mars)",
                        value: formatFCFA(stats.monthlyEarnings),
                        icon: TrendingUp,
                        color: "text-purple-600",
                        bg: "bg-purple-50",
                        sub: "Mois en cours"
                    },
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center flex-shrink-0`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{stat.label}</p>
                            <div className="text-xl font-bold text-[#0D2D5A] mt-0.5 truncate">{stat.value}</div>
                            <p className="text-[10px] text-gray-400 mt-0.5">{stat.sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Prochaines sessions */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#0D2D5A]">Prochaines sessions</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Vos cours à venir cette semaine</p>
                        </div>
                        <button
                            onClick={() => navigate("/teacher/schedule")}
                            className="text-xs font-semibold text-[#1A6CC8] hover:underline"
                        >
                            Voir tout →
                        </button>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {upcomingSessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <Clock className="w-10 h-10 text-gray-200" />
                                <p className="text-sm text-gray-400 font-medium">Aucune session planifiée</p>
                                <p className="text-xs text-gray-300">Vos prochains cours apparaîtront ici</p>
                            </div>
                        ) : (
                            upcomingSessions.slice(0, 5).map((s: any) => (
                                <div key={s.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                                    {/* Day badge */}
                                    <div className="w-12 h-12 rounded-xl bg-[#1A6CC8] text-white flex flex-col items-center justify-center text-center flex-shrink-0">
                                        <span className="text-[9px] font-bold uppercase leading-none">{s.day?.slice(0, 3) || "?"}</span>
                                        <span className="text-sm font-bold leading-none mt-0.5">{s.time?.split(':')[0] || "?"}h</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-sm font-bold text-[#0D2D5A] truncate">{s.student}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{s.subject} · {s.location || "À domicile"}</div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {(s.virtualLink || s.location?.toLowerCase().includes("ligne")) && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/virtual-class/${s.id}`)}
                                                className="h-8 text-[10px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                            >
                                                <Video className="w-3 h-3" />
                                                Rejoindre
                                            </Button>
                                        )}
                                        <Badge className="bg-[#1A6CC8]/10 text-[#1A6CC8] border-none text-[10px] font-bold">Planifié</Badge>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Mes élèves */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-[#0D2D5A]">Mes élèves</h2>
                            <p className="text-xs text-gray-400 mt-0.5">{studentsList.length} élève(s) suivi(s)</p>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <UserCheck className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {studentsList.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                                <Users className="w-10 h-10 text-gray-200" />
                                <p className="text-sm text-gray-400 font-medium">Aucun élève assigné</p>
                            </div>
                        ) : (
                            studentsList.map((s: any) => {
                                const grade = parseFloat(s.avgGrade);
                                return (
                                    <div key={s.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-[#0D2D5A] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                                            {s.name?.slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-[#0D2D5A] truncate">{s.name}</div>
                                            <div className="text-[10px] text-gray-400 mt-0.5">{s.subject} · {s.level}</div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <div
                                                className="text-base font-bold"
                                                style={{ color: grade >= 14 ? "#22c55e" : grade >= 10 ? "#F5A623" : "#ef4444" }}
                                            >
                                                {grade.toFixed(1)}
                                            </div>
                                            <div className="text-[9px] text-gray-400">/20</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Top performer */}
            {topPerformer && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-[#1A6CC8]/5 text-[#1A6CC8] flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-7 h-7" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">🏆 Top Performer ce mois</p>
                        <h3 className="text-lg font-bold text-[#0D2D5A] mt-1">{topPerformer.name}</h3>
                        <p className="text-xs text-gray-500">{topPerformer.subject} · {topPerformer.level}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge className="bg-emerald-50 text-emerald-700 border-none font-bold text-sm px-4 py-2">
                            {parseFloat(topPerformer.avgGrade).toFixed(1)}/20
                        </Badge>
                        <Badge className="bg-blue-50 text-[#1A6CC8] border-none font-bold text-xs">
                            {topPerformer.trend || "+1.2 pts"}
                        </Badge>
                    </div>
                </div>
            )}
        </div>
    );
}
