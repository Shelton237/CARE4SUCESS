import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, TrendingUp, Receipt, BookOpen, Award } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { fetchScheduleByRole, fetchParentOverview, fetchParentProgress } from "@/api/backoffice";
import type { ScheduleSession } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { formatFCFA } from "@/data/mock";

export default function ParentDashboard() {
    const { user } = useAuth();

    const scheduleQuery = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const overviewQuery = useQuery({
        queryKey: ["parentOverview", user?.id],
        queryFn: () => fetchParentOverview(user!.id),
        enabled: Boolean(user?.id),
    });

    const progressQuery = useQuery({
        queryKey: ["parentProgress", user?.id],
        queryFn: () => fetchParentProgress(user!.id),
        enabled: Boolean(user?.id),
    });

    const schedule = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);
    const overview = overviewQuery.data;
    const progressData = progressQuery.data ?? [];

    const planningPreview = useMemo<ScheduleSession[]>(() => schedule.slice(0, 6), [schedule]);

    const avgTrend =
        overview && overview.previousAvg > 0
            ? Math.round(((overview.currentAvg - overview.previousAvg) / overview.previousAvg) * 100)
            : 0;

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500 font-medium italic">
                Connectez-vous pour accéder au suivi parent.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Bonjour, {user.name.split(" ")[0]} 👋</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {overview
                            ? (
                                <>
                                    Suivi de <span className="font-semibold text-[#0D2D5A]">{overview.childName}</span> – {overview.childLevel}
                                </>
                            )
                            : "Suivi académique en temps réel pour votre famille."}
                    </p>
                </div>
            </div>

            {(overviewQuery.isError || progressQuery.isError || scheduleQuery.isError) && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    Impossible de charger toutes les données. Merci de réessayer plus tard.
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Prochain cours"
                    value={overview?.upcomingSession?.date ?? "—"}
                    icon={CalendarDays}
                    accentColor="#1A6CC8"
                    description={overview?.upcomingSession?.time ?? (overviewQuery.isLoading ? "Chargement..." : "Planning à jour")}
                />
                <StatCard
                    label="Séances ce mois"
                    value={overview?.sessionsThisMonth ?? "—"}
                    icon={BookOpen}
                    accentColor="#22c55e"
                    description={overview?.focusSubject ?? "Séances pedagogiques"}
                />
                <StatCard
                    label="Moyenne actuelle"
                    value={overview ? `${overview.currentAvg}/20` : "—"}
                    icon={TrendingUp}
                    accentColor="#F5A623"
                    trend={overview ? avgTrend : undefined}
                    description="vs mois dernier"
                />
                <StatCard
                    label="Règlements"
                    value={overview ? formatFCFA(overview.totalPaidThisMonth) : "—"}
                    icon={Receipt}
                    accentColor="#a855f7"
                    description={overview?.pendingInvoice ? "Attention : facture en attente" : "Compte à jour ✔︎"}
                />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-base font-bold text-[#0D2D5A]">Évolution académique</h2>
                            <p className="text-xs text-gray-400 mt-0.5">Parcours pluridisciplinaire</p>
                        </div>
                    </div>
                    {progressQuery.isLoading ? (
                        <div className="flex-1 flex items-center justify-center py-20 text-gray-300">
                            <TrendingUp className="w-8 h-8 animate-pulse" />
                        </div>
                    ) : progressData.length === 0 ? (
                        <div className="flex-1 flex items-center justify-center py-20 text-sm text-gray-400 italic">Aucune donnée disponible.</div>
                    ) : (
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 600, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                                    <YAxis domain={[0, 20]} hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '12px', color: '#fff' }}
                                        formatter={(v: number) => [`${v}/20`]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700, paddingTop: 20 }} iconType="circle" />
                                    <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={3} dot={{ r: 4, fill: "#1A6CC8", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={3} dot={{ r: 4, fill: "#F5A623", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="anglais" name="Anglais" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-base font-bold text-[#0D2D5A]">Planning récent</h2>
                        <CalendarDays className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    {scheduleQuery.isLoading ? (
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-50 rounded-xl animate-pulse" />)}
                        </div>
                    ) : planningPreview.length === 0 ? (
                        <div className="text-sm text-gray-400 text-center py-10 italic">Aucune séance.</div>
                    ) : (
                        <div className="space-y-3">
                            {planningPreview.map((s) => (
                                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div
                                        className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "effectué" ? "bg-emerald-500" : s.status === "à venir" ? "bg-[#1A6CC8]" : "bg-gray-200"
                                            }`}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold text-[#0D2D5A] truncate">
                                            {s.day} {s.date}
                                        </div>
                                        <div className="text-[10px] text-gray-400 font-medium">
                                            {s.time} · {s.subject}
                                        </div>
                                    </div>
                                    <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${s.status === "effectué"
                                                ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                : s.status === "à venir"
                                                    ? "bg-blue-50 text-blue-600 border-blue-100"
                                                    : "bg-gray-50 text-gray-400 border-gray-100"
                                            }`}
                                    >
                                        {s.status}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {overview?.pendingInvoice && (
                <div className="bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-2xl p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-[#F5A623]/10 flex items-center justify-center shadow-sm">
                            <Receipt className="w-6 h-6 text-[#F5A623]" />
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-sm">Facture en attente</div>
                            <div className="text-xs text-gray-500 font-medium">
                                {overview.pendingInvoice.description} · <span className="text-[#0D2D5A] font-bold">{formatFCFA(overview.pendingInvoice.amount)}</span>
                            </div>
                        </div>
                    </div>
                    <button className="px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-[#F5A623] hover:bg-[#e09612] transition-all shadow-md active:scale-95">
                        Régler maintenant
                    </button>
                </div>
            )}

            {overview?.latestEvaluations && overview.latestEvaluations.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6 flex items-center gap-2">
                        <Award className="w-5 h-5 text-[#F5A623]" />
                        Dernières évaluations de l'élève
                    </h2>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {overview.latestEvaluations.map((evaluation) => (
                            <div key={evaluation.id} className="border border-gray-50 bg-gray-50/30 rounded-2xl p-4 flex items-center justify-between group hover:bg-white hover:border-gray-100 hover:shadow-sm transition-all">
                                <div className="min-w-0">
                                    <div className="font-bold text-[#0D2D5A] text-sm truncate">{evaluation.quizTitle}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">
                                        {evaluation.subject} · {new Date(evaluation.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-lg font-black text-[#1A6CC8] ml-4">
                                    {evaluation.score}/{evaluation.totalPoints}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
