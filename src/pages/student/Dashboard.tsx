import { CalendarDays, TrendingUp, BookOpen, Flame, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
    fetchStudentOverview, fetchStudentProgress, fetchStudentGrades, fetchScheduleByRole
} from "@/api/backoffice";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const gradeColor = (n: number) =>
    n >= 14 ? "#22c55e" : n >= 10 ? "#F5A623" : "#ef4444";

export default function StudentDashboard() {
    const { user } = useAuth();

    const overviewQuery = useQuery({
        queryKey: ["studentOverview", user?.id],
        queryFn: () => fetchStudentOverview(user!.id),
        enabled: Boolean(user?.id),
    });

    const progressQuery = useQuery({
        queryKey: ["studentProgress", user?.id],
        queryFn: () => fetchStudentProgress(user!.id),
        enabled: Boolean(user?.id),
    });

    const gradesQuery = useQuery({
        queryKey: ["studentGrades", user?.id],
        queryFn: () => fetchStudentGrades(user!.id),
        enabled: Boolean(user?.id),
    });

    const scheduleQuery = useQuery({
        queryKey: ["studentSchedule", user?.id],
        queryFn: () => fetchScheduleByRole("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const stats = overviewQuery.data || { generalAvg: 14.5, previousAvg: 11.8, level: "3e", teacher: "—", streak: 6, currentAvg: 14.5 };
    const progressData = progressQuery.data || [];
    const studentGrades = gradesQuery.data || [];
    const studentSchedule: any[] = scheduleQuery.data || [];

    const avgTrend = stats.previousAvg > 0
        ? Math.round(((stats.currentAvg || stats.generalAvg - stats.previousAvg) / stats.previousAvg) * 100)
        : 0;

    const upcomingSessions = studentSchedule.filter((s) => s.status === "à venir" || s.status === "planifié");
    const nextSession = upcomingSessions[0] || null;

    if (!user) {
        return <div className="p-8 text-sm text-gray-500 text-center">Veuillez vous connecter.</div>;
    }

    if (overviewQuery.isLoading || progressQuery.isLoading) {
        return <div className="p-8 text-sm text-gray-400 text-center animate-pulse">Chargement de votre tableau de bord...</div>;
    }

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">
                        Bonjour, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {stats.level} · Suivi par{" "}
                        <span className="font-semibold text-[#0D2D5A]">{stats.teacher || "votre professeur"}</span>
                        {" "}— Année 2025/2026
                    </p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Prochain cours"
                    value={nextSession ? nextSession.date : "—"}
                    icon={CalendarDays}
                    accentColor="#1A6CC8"
                    description={nextSession ? `${nextSession.time} · ${nextSession.location || "En ligne"}` : "Pas de cours planifié"}
                />
                <StatCard
                    label="Moyenne générale"
                    value={`${stats.currentAvg || stats.generalAvg}/20`}
                    icon={TrendingUp}
                    accentColor="#22c55e"
                    trend={avgTrend}
                    description="vs mois précédent"
                />
                <StatCard
                    label="Devoirs à travailler"
                    value={studentGrades.length}
                    icon={BookOpen}
                    accentColor="#F5A623"
                    description={`${studentGrades.length} matières suivies`}
                />
                <StatCard
                    label="Séries sans absence"
                    value={`${stats.streak} séances`}
                    icon={Flame}
                    accentColor="#ef4444"
                    description="Progression constante 🔥"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Chart évolution */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6">Mon évolution — Oct à Mars</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={progressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: number) => [`${v}/20`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={2.5} dot={{ r: 4, fill: "#1A6CC8" }} />
                            <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={2} dot={{ r: 3, fill: "#F5A623" }} />
                            <Line type="monotone" dataKey="anglais" name="Anglais" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Mes notes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Mes matières</h2>
                    <div className="space-y-3">
                        {studentGrades.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6 italic">Aucune note enregistrée</p>
                        ) : studentGrades.slice(0, 5).map((g: any) => (
                            <div key={g.subject} className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: g.color || "#ccc" }} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A] truncate">{g.subject}</div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                        <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{ width: `${(g.avg / 20) * 100}%`, background: g.color || "#ccc" }}
                                        />
                                    </div>
                                </div>
                                <span className="text-sm font-bold flex-shrink-0" style={{ color: gradeColor(g.avg) }}>
                                    {g.avg}/20
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Prochains cours + planning */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Prochain cours */}
                {nextSession ? (
                    <div className="bg-gradient-to-br from-[#1A6CC8] to-[#0D2D5A] rounded-2xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarDays className="w-4 h-4 opacity-70" />
                            <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Prochain cours</span>
                        </div>
                        <div className="text-xl font-bold">{nextSession.day} {nextSession.date}</div>
                        <div className="text-blue-200 text-sm mt-1">{nextSession.time}</div>
                        <div className="mt-3 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
                                {nextSession.teacher?.slice(0, 2).toUpperCase() || "P"}
                            </div>
                            <div>
                                <div className="text-sm font-semibold">{nextSession.teacher}</div>
                                <div className="text-xs text-blue-200">{nextSession.subject} · {nextSession.location || "En ligne"}</div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-gray-50 rounded-2xl p-6 border border-dashed border-gray-200 flex flex-col items-center justify-center gap-3 text-center">
                        <Clock className="w-10 h-10 text-gray-300" />
                        <div>
                            <p className="font-semibold text-gray-500">Aucun cours planifié</p>
                            <p className="text-xs text-gray-400 mt-1">Votre prochain cours apparaîtra ici</p>
                        </div>
                    </div>
                )}

                {/* Planning des prochains cours */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Planning à venir</h2>
                    <div className="space-y-3">
                        {upcomingSessions.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-6 italic">Aucun cours à venir</p>
                        ) : upcomingSessions.slice(0, 4).map((s: any) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 transition-colors">
                                <div className="w-10 h-10 rounded-xl bg-[#1A6CC8]/10 text-[#1A6CC8] flex flex-col items-center justify-center text-[10px] font-black">
                                    <span>{s.day?.slice(0, 3) || "?"}</span>
                                    <span className="text-sm">{s.time?.split(':')[0] || "?"}h</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A] truncate">{s.subject}</div>
                                    <div className="text-xs text-gray-400">{s.teacher} · {s.location || "En ligne"}</div>
                                </div>
                                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
