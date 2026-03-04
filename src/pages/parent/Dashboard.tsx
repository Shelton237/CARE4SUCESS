import { CalendarDays, TrendingUp, Receipt, BookOpen } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { parentStats, parentSchedule, parentProgressData, parentInvoices, formatFCFA } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export default function ParentDashboard() {
    const { user } = useAuth();
    const avgTrend = Math.round(((parentStats.currentAvg - parentStats.previousAvg) / parentStats.previousAvg) * 100);
    const pendingInvoice = parentInvoices.find((i) => i.status === "en attente");
    const upcomingSession = parentSchedule.find((s) => s.status === "à venir");

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Bonjour, {user?.name?.split(" ")[0]} 👋</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Suivi de <span className="font-semibold text-[#0D2D5A]">{parentStats.child}</span> — {parentStats.level} · Mars 2026
                </p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Prochain cours"
                    value={upcomingSession ? upcomingSession.date : "—"}
                    icon={CalendarDays}
                    accentColor="#1A6CC8"
                    description={upcomingSession?.time}
                />
                <StatCard
                    label="Séances ce mois"
                    value={parentStats.sessionsThisMonth}
                    icon={BookOpen}
                    accentColor="#22c55e"
                    description="Mathématiques"
                />
                <StatCard
                    label="Moyenne actuelle"
                    value={`${parentStats.currentAvg}/20`}
                    icon={TrendingUp}
                    accentColor="#F5A623"
                    trend={avgTrend}
                    description="vs mois précédent"
                />
                <StatCard
                    label="Payé ce mois"
                    value={formatFCFA(parentStats.totalPaidThisMonth)}
                    icon={Receipt}
                    accentColor="#a855f7"
                    description={pendingInvoice ? "1 facture en attente" : "Tout à jour ✓"}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Graphe de progression */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6">Évolution des notes — Oct à Mars</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={parentProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: number) => [`${v}/20`]} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={2.5} dot={{ r: 4, fill: "#1A6CC8" }} />
                            <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={2.5} dot={{ r: 4, fill: "#F5A623" }} />
                            <Line type="monotone" dataKey="anglais" name="Anglais" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 4, fill: "#22c55e" }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Prochains cours */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Planning récent</h2>
                    <div className="space-y-3">
                        {parentSchedule.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "effectué" ? "bg-gray-300" : s.status === "à venir" ? "bg-[#1A6CC8]" : "bg-gray-200"}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A]">{s.day} {s.date}</div>
                                    <div className="text-xs text-gray-400">{s.time} · {s.location}</div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${s.status === "effectué" ? "bg-gray-100 text-gray-400" :
                                        s.status === "à venir" ? "bg-blue-50 text-blue-600" :
                                            "bg-gray-50 text-gray-400"
                                    }`}>{s.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Facture en attente */}
            {pendingInvoice && (
                <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 flex items-center justify-center">
                            <Receipt className="w-5 h-5 text-[#F5A623]" />
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-sm">Facture en attente de paiement</div>
                            <div className="text-xs text-gray-500">{pendingInvoice.description} · {formatFCFA(pendingInvoice.amount)}</div>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#F5A623] hover:bg-[#e09612] transition-colors shadow-sm whitespace-nowrap">
                        Payer maintenant
                    </button>
                </div>
            )}
        </div>
    );
}
