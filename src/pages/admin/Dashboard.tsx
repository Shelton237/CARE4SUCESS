import { Users, GraduationCap, ClipboardList, TrendingUp, Star, UserPlus } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { adminStats, adminRequests, monthlyRevenueData, formatFCFA } from "@/data/mock";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminDashboard() {
    const revTrend = Math.round(((adminStats.monthlyRevenue - adminStats.previousRevenue) / adminStats.previousRevenue) * 100);
    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Tableau de bord</h1>
                <p className="text-gray-500 text-sm mt-1">Vue d'ensemble de la plateforme — Mars 2026</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Enseignants actifs" value={adminStats.totalTeachers} icon={GraduationCap} accentColor="#1A6CC8" trend={8} description="vs mois précédent" />
                <StatCard label="Élèves suivis" value={adminStats.activeStudents} icon={Users} accentColor="#22c55e" trend={12} description="vs mois précédent" />
                <StatCard label="Demandes en attente" value={adminStats.pendingRequests} icon={ClipboardList} accentColor="#F5A623" description="À traiter" />
                <StatCard label="CA du mois" value={formatFCFA(adminStats.monthlyRevenue)} icon={TrendingUp} accentColor="#a855f7" trend={revTrend} description="vs mois précédent" />
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-2 gap-5">
                <StatCard label="Satisfaction moyenne" value={`${adminStats.satisfactionRate}/5`} icon={Star} accentColor="#F5A623" />
                <StatCard label="Nouvelles familles" value={adminStats.newFamiliesThisMonth} icon={UserPlus} accentColor="#1A6CC8" trend={15} description="ce mois" />
            </div>

            {/* Graphs + dernières demandes */}
            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6">Chiffre d'affaires mensuel (FCFA)</h2>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={monthlyRevenueData} barSize={32}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: number) => [formatFCFA(v), "CA"]} />
                            <Bar dataKey="amount" fill="#1A6CC8" radius={[6, 6, 0, 0]}
                                label={{ position: "top", formatter: (v: number) => `${(v / 1_000_000).toFixed(1)}M`, fontSize: 10, fill: "#9ca3af" }} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Dernières demandes</h2>
                    <div className="space-y-3">
                        {adminRequests.slice(0, 4).map((r) => (
                            <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-8 h-8 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                                    {r.parent[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A] truncate">{r.child}</div>
                                    <div className="text-xs text-gray-400">{r.level} · {r.subject}</div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${r.status === "reçu" ? "bg-yellow-50 text-yellow-600" :
                                        r.status === "en traitement" ? "bg-blue-50 text-blue-600" :
                                            r.status === "assigné" ? "bg-green-50 text-green-600" :
                                                "bg-gray-100 text-gray-500"
                                    }`}>{r.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
