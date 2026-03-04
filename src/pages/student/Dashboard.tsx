import { CalendarDays, TrendingUp, BookOpen, Flame, MessageCircle } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    studentStats, studentSchedule, studentHomework, studentGrades,
    studentMessages, studentProgressData,
} from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

const gradeColor = (n: number) =>
    n >= 14 ? "#22c55e" : n >= 10 ? "#F5A623" : "#ef4444";

export default function StudentDashboard() {
    const { user } = useAuth();
    const avgTrend = Math.round(
        ((studentStats.generalAvg - studentStats.previousAvg) / studentStats.previousAvg) * 100
    );
    const nextSession = studentSchedule.find((s) => s.status === "à venir");
    const pendingHw = studentHomework.filter((h) => h.status === "à faire");
    const unreadMsg = studentMessages.filter((m) => !m.read);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">
                        Bonjour, {user?.name?.split(" ")[0]} 👋
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {studentStats.level} · Suivi par{" "}
                        <span className="font-semibold text-[#0D2D5A]">{studentStats.teacher}</span>
                        {" "}— Mars 2026
                    </p>
                </div>
                {unreadMsg.length > 0 && (
                    <div className="flex items-center gap-2 bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl px-4 py-2">
                        <MessageCircle className="w-4 h-4 text-[#22c55e]" />
                        <span className="text-sm font-bold text-[#22c55e]">
                            {unreadMsg.length} nouveau{unreadMsg.length > 1 ? "x" : ""} message{unreadMsg.length > 1 ? "s" : ""}
                        </span>
                    </div>
                )}
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Prochain cours"
                    value={nextSession ? nextSession.date : "—"}
                    icon={CalendarDays}
                    accentColor="#1A6CC8"
                    description={nextSession ? `${nextSession.time} · ${nextSession.location}` : "Pas de cours planifié"}
                />
                <StatCard
                    label="Moyenne générale"
                    value={`${studentStats.generalAvg}/20`}
                    icon={TrendingUp}
                    accentColor="#22c55e"
                    trend={avgTrend}
                    description="vs mois précédent"
                />
                <StatCard
                    label="Devoirs à rendre"
                    value={pendingHw.length}
                    icon={BookOpen}
                    accentColor="#F5A623"
                    description={pendingHw.length > 0 ? `Prochain : ${pendingHw[0].dueDateLabel}` : "Tout à jour 🎉"}
                />
                <StatCard
                    label="Séries sans absence"
                    value={`${studentStats.streak} séances`}
                    icon={Flame}
                    accentColor="#ef4444"
                    description="Continue comme ça ! 🔥"
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Graphe évolution */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6">Mon évolution — Oct à Mars</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={studentProgressData}>
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

                {/* Mes notes rapides */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Mes matières</h2>
                    <div className="space-y-3">
                        {studentGrades.map((g) => (
                            <div key={g.subject} className="flex items-center gap-3">
                                <div
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ background: g.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A] truncate">{g.subject}</div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                                        <div
                                            className="h-1.5 rounded-full transition-all"
                                            style={{
                                                width: `${(g.avg / 20) * 100}%`,
                                                background: g.color,
                                            }}
                                        />
                                    </div>
                                </div>
                                <span
                                    className="text-sm font-bold flex-shrink-0"
                                    style={{ color: gradeColor(g.avg) }}
                                >
                                    {g.avg}/20
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Devoirs à venir */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Devoirs à rendre</h2>
                    <div className="space-y-3">
                        {pendingHw.length === 0 ? (
                            <div className="text-center py-6 text-gray-300 text-sm">Aucun devoir en attente 🎉</div>
                        ) : (
                            pendingHw.map((hw) => (
                                <div
                                    key={hw.id}
                                    className="flex items-start gap-3 p-3 rounded-xl border transition-colors hover:bg-gray-50/50"
                                    style={{ borderColor: hw.color + "25", background: hw.color + "05" }}
                                >
                                    <div
                                        className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                                        style={{ background: hw.color }}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[#0D2D5A] text-sm">{hw.title}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{hw.subject} · {hw.dueDateLabel}</div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${hw.priority === "haute"
                                            ? "bg-red-50 text-red-500"
                                            : "bg-gray-100 text-gray-400"
                                        }`}>
                                        {hw.priority}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Prochain cours + message récent */}
                <div className="space-y-4">
                    {nextSession && (
                        <div className="bg-gradient-to-br from-[#1A6CC8] to-[#0D2D5A] rounded-2xl p-6 text-white shadow-lg">
                            <div className="flex items-center gap-2 mb-3">
                                <CalendarDays className="w-4 h-4 opacity-70" />
                                <span className="text-xs font-semibold opacity-70 uppercase tracking-wider">Prochain cours</span>
                            </div>
                            <div className="text-xl font-bold">{nextSession.day} {nextSession.date}</div>
                            <div className="text-blue-200 text-sm mt-1">{nextSession.time}</div>
                            <div className="mt-3 flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">CA</div>
                                <div>
                                    <div className="text-sm font-semibold">{nextSession.teacher}</div>
                                    <div className="text-xs text-blue-200">{nextSession.subject} · {nextSession.location}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                        <h2 className="text-sm font-bold text-[#0D2D5A] mb-3">Dernier message</h2>
                        {studentMessages.slice(0, 1).map((msg) => (
                            <div key={msg.id} className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                                    {msg.avatar}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A]">{msg.from}</div>
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{msg.text}</p>
                                    <div className="text-xs text-gray-300 mt-1">{msg.date} · {msg.time}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
