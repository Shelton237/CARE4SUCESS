import { Users, GitMerge, ClipboardList, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { advisorStats, advisorFamilies, advisorRequests } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLOR: Record<string, string> = {
    "suivi actif": "bg-green-50 text-green-600",
    "matching": "bg-blue-50 text-blue-600",
    "bilan planifié": "bg-[#F5A623]/10 text-[#F5A623]",
    "nouveau": "bg-purple-50 text-purple-600",
};

const REQUEST_STATUS_COLOR: Record<string, string> = {
    "reçu": "bg-yellow-50 text-yellow-600",
    "en traitement": "bg-blue-50 text-blue-600",
    "assigné": "bg-green-50 text-green-600",
    "clôturé": "bg-gray-100 text-gray-500",
};

export default function AdvisorDashboard() {
    const { user } = useAuth();

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Bonjour, {user?.name?.split(" ").pop()} 👋</h1>
                <p className="text-gray-500 text-sm mt-1">Tableau de bord conseiller pédagogique — Mars 2026</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Familles assignées" value={advisorStats.assignedFamilies} icon={Users} accentColor="#a855f7" />
                <StatCard label="Demandes en attente" value={advisorStats.pendingRequests} icon={ClipboardList} accentColor="#F5A623" description="À prendre en charge" />
                <StatCard label="Matchings en cours" value={advisorStats.matchingInProgress} icon={GitMerge} accentColor="#1A6CC8" description="Enseignant en recherche" />
                <StatCard label="Bilans ce mois" value={advisorStats.reportsThisMonth} icon={ClipboardList} accentColor="#22c55e" trend={8} description="vs mois précédent" />
            </div>

            {/* Temps moyen réponse */}
            <div className="flex items-center gap-4 p-5 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#a855f7]/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#a855f7]" />
                </div>
                <div>
                    <div className="font-bold text-[#0D2D5A] text-sm">Temps moyen de réponse aux familles</div>
                    <div className="text-2xl font-bold text-[#a855f7] mt-0.5">{advisorStats.avgResponseTime}</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-gray-400">Objectif plateforme</div>
                    <div className="font-bold text-[#0D2D5A]">≤ 24h</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Mes familles récentes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Mes familles — aperçu</h2>
                    <div className="space-y-3">
                        {advisorFamilies.slice(0, 5).map((f) => (
                            <div key={f.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-9 h-9 rounded-full bg-[#a855f7]/10 flex items-center justify-center text-xs font-bold text-[#a855f7] flex-shrink-0">
                                    {f.child[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A] text-sm">{f.child}</div>
                                    <div className="text-xs text-gray-400">{f.level} · {f.teacher !== "—" ? f.teacher : "Enseignant à assigner"}</div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[f.status] ?? "bg-gray-100 text-gray-500"}`}>{f.status}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Demandes récentes */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Dernières demandes reçues</h2>
                    <div className="space-y-3">
                        {advisorRequests.slice(0, 5).map((r) => (
                            <div key={r.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                                    {r.parent[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A] text-sm">{r.child}</div>
                                    <div className="text-xs text-gray-400">{r.level} · {r.subject} · {r.date}</div>
                                </div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${REQUEST_STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-500"}`}>{r.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
