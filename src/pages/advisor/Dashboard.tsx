import { Users, GitMerge, ClipboardList, Clock, Loader2, UserCheck, Inbox } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdvisorDashboard, updateRequestStatus } from "@/api/backoffice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const STATUS_COLOR: Record<string, string> = {
    "suivi actif": "bg-green-50 text-green-600",
    "matching": "bg-blue-50 text-blue-600",
    "bilan planifié": "bg-[#F5A623]/10 text-[#F5A623]",
    "nouveau": "bg-blue-50 text-[#1A6CC8]",
};



export default function AdvisorDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["advisorDashboard", user?.id],
        queryFn: () => fetchAdvisorDashboard(user!.id),
        enabled: !!user?.id,
    });

    const takeOverMutation = useMutation({
        mutationFn: (id: string) => updateRequestStatus(id, "en traitement"),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["advisorDashboard", user?.id] });
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            toast.success("Demande prise en charge !");
        },
        onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
    });

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                <span className="ml-3 text-gray-500">Chargement du tableau de bord...</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="p-4 md:p-8 text-center text-red-500">
                Erreur lors du chargement des données conseiller.
            </div>
        );
    }

    const { stats, families, requests } = data;

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">
                    Bonjour, {user?.name?.split(" ").pop()} 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">Tableau de bord conseiller pédagogique · Mars 2026</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard
                    label="Familles assignées"
                    value={stats.assignedFamilies}
                    icon={Users}
                    accentColor="#1A6CC8"
                />
                <StatCard
                    label="Demandes en attente"
                    value={stats.pendingRequests}
                    icon={ClipboardList}
                    accentColor="#F5A623"
                    description="À prendre en charge"
                />
                <StatCard
                    label="Matchings en cours"
                    value={stats.matchingInProgress}
                    icon={GitMerge}
                    accentColor="#1A6CC8"
                    description="Enseignant en recherche"
                />
                <StatCard
                    label="Bilans ce mois"
                    value={stats.reportsThisMonth}
                    icon={ClipboardList}
                    accentColor="#22c55e"
                    trend={8}
                    description="vs mois précédent"
                />
            </div>

            {/* Temps moyen réponse */}
            <div className="flex items-center gap-4 p-5 bg-[#1A6CC8]/5 border border-[#1A6CC8]/20 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-[#1A6CC8]/15 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-[#1A6CC8]" />
                </div>
                <div>
                    <div className="font-bold text-[#0D2D5A] text-sm">Temps moyen de réponse aux familles</div>
                    <div className="text-2xl font-bold text-[#1A6CC8] mt-0.5">{stats.avgResponseTime}</div>
                </div>
                <div className="ml-auto text-right">
                    <div className="text-xs text-gray-400">Objectif plateforme</div>
                    <div className="font-bold text-[#0D2D5A]">≤ 24h</div>
                </div>
            </div>

            <div className="grid lg:grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Mes familles récentes */}
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Mes familles · aperçu</h2>
                    <div className="space-y-3">
                        {families.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-4 text-center">Aucune famille assignée.</p>
                        ) : (
                            families.map((f: any, idx: number) => (
                                <div
                                    key={f.id || `fam-${idx}`}
                                    onClick={() => navigate("/advisor/families", { state: { familyId: f.id, childName: f.child } })}
                                    className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl border-b border-gray-50 last:border-0 hover:bg-gray-50/80 cursor-pointer transition-colors"
                                >
                                    <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                                        {f.child?.[0] || "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[#0D2D5A] text-sm">{f.child || "Élève non spécifié"}</div>
                                        <div className="text-xs text-gray-400">{f.level || "-"} · {f.teacher || "Enseignant à assigner"}</div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${STATUS_COLOR[f.status] ?? "bg-gray-100 text-gray-500"}`}>{f.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Demandes récentes */}
                <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-base font-bold text-[#0D2D5A]">Dernières demandes reçues</h2>
                        <button
                            onClick={() => navigate("/advisor/requests")}
                            className="flex items-center gap-1 text-[#1A6CC8] text-xs font-bold hover:underline"
                        >
                            <Inbox className="w-3.5 h-3.5" /> Voir toutes
                        </button>
                    </div>
                    <div className="space-y-3">
                        {requests.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-4 text-center">Aucune demande récente.</p>
                        ) : (
                            requests.map((r: any, idx: number) => (
                                <div key={r.id || `req-${idx}`} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                                    <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0 mt-0.5">
                                        {r.parent ? r.parent[0] : "?"}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[#0D2D5A] text-sm">{r.child || "Élève non spécifié"}</div>
                                        <div className="text-xs text-gray-400">{r.level} · {r.subject} · {r.date}</div>
                                        {/* Boutons contextuels selon le statut */}
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {r.status === "reçu" && (
                                                <button
                                                    disabled={takeOverMutation.isPending}
                                                    onClick={() => takeOverMutation.mutate(r.id)}
                                                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-white bg-[#1A6CC8] hover:bg-[#0D2D5A] rounded-lg px-2.5 py-1 transition-colors"
                                                >
                                                    <UserCheck className="w-3 h-3" /> Prendre en charge
                                                </button>
                                            )}
                                            {r.status === "en traitement" && (
                                                <>
                                                    <button
                                                        onClick={() => navigate("/advisor/families", { state: { requestId: r.id, defaultPanel: "diagnostic" } })}
                                                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-lg px-2 py-1 transition-colors"
                                                    >
                                                        <ClipboardList className="w-3 h-3" /> Diagnostic & Bilan
                                                    </button>
                                                    <button
                                                        onClick={() => navigate("/advisor/matching", { state: { childName: r.child, level: r.level, subject: r.subject } })}
                                                        className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-black text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 rounded-lg px-2 py-1 transition-colors"
                                                    >
                                                        <GitMerge className="w-3 h-3" /> Lancer le matching
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
                                        r.status === "reçu" ? "bg-amber-50 text-amber-700" :
                                        r.status === "en traitement" ? "bg-blue-50 text-blue-700" :
                                        r.status === "assigné" ? "bg-emerald-50 text-emerald-700" :
                                        "bg-gray-100 text-gray-500"
                                    }`}>{r.status}</span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
