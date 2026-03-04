import { Users, CalendarDays, Banknote, Star } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { teacherStats, teacherSchedule, teacherStudents, formatFCFA } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";

export default function TeacherDashboard() {
    const { user } = useAuth();
    const earningsTrend = Math.round(((teacherStats.monthlyEarnings - teacherStats.previousEarnings) / teacherStats.previousEarnings) * 100);
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Bonjour, {user?.name?.split(" ").pop()} 👋</h1>
                <p className="text-gray-500 text-sm mt-1">Votre tableau de bord — Mars 2026</p>
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Prochains cours" value={teacherStats.upcomingSessions} icon={CalendarDays} accentColor="#1A6CC8" description="cette semaine" />
                <StatCard label="Élèves actifs" value={teacherStats.activeStudents} icon={Users} accentColor="#22c55e" />
                <StatCard label="Revenus du mois" value={formatFCFA(teacherStats.monthlyEarnings)} icon={Banknote} accentColor="#F5A623" trend={earningsTrend} />
                <StatCard label="Note moyenne" value={`${teacherStats.avgRating}/5`} icon={Star} accentColor="#a855f7" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Planning semaine */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Planning de la semaine</h2>
                    <div className="space-y-3">
                        {teacherSchedule.map((s) => (
                            <div key={s.id} className="flex items-center gap-4 py-3 px-4 rounded-xl bg-gray-50 hover:bg-blue-50/40 transition-colors">
                                <div className="text-center min-w-[52px]">
                                    <div className="text-xs font-bold text-[#1A6CC8]">{s.day.slice(0, 3).toUpperCase()}</div>
                                    <div className="text-xs text-gray-400">{s.time}</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A] text-sm">{s.student}</div>
                                    <div className="text-xs text-gray-500">{s.subject} · {s.level}</div>
                                </div>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] font-medium whitespace-nowrap">{s.location}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Top élèves */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Mes élèves — progression</h2>
                    <div className="space-y-3">
                        {teacherStudents.map((e) => (
                            <div key={e.id} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8]">{e.name[0]}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A] text-sm">{e.name}</div>
                                    <div className="text-xs text-gray-400">{e.level} · {e.subject}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-[#0D2D5A] text-sm">{e.avgGrade}/20</div>
                                    <div className="text-xs text-green-600 font-bold">{e.trend}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
