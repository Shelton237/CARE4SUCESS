import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Users, GraduationCap, ClipboardList, TrendingUp, Star,
  UserPlus, Loader2, RefreshCw, Activity, Lightbulb, Target
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TeacherRatingsBoard } from "@/components/dashboard/TeacherRatingsBoard";
import { fetchAdminDashboard } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { formatFCFA } from "@/lib/money";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend
} from "recharts";

const SUBJECT_COLORS = ["#1A6CC8", "#0D2D5A", "#F5A623", "#10b981", "#8b5cf6", "#ef4444", "#ec4899", "#06b6d4"];

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: fetchAdminDashboard,
    enabled: user?.role === "admin",
  });

  const stats = data?.stats ?? {
    totalTeachers: 0, activeStudents: 0, pendingRequests: 0,
    monthlyRevenue: 0, previousRevenue: 0, satisfactionRate: 0,
    newFamiliesThisMonth: 0, occupancyRate: 0,
    activeTeachersThisMonth: 0, leadsThisMonth: 0,
  };

  const monthlyRevenueData = data?.monthlyRevenue ?? [];
  const revenueBySubject = (data?.revenueBySubject ?? []).map((r: any) => ({
    ...r,
    amount: Number(r.amount) || 0,
  }));
  const latestRequests = data?.latestRequests ?? [];

  const revenueTrend = useMemo(() => {
    if (!stats.previousRevenue || stats.previousRevenue === 0)
      return stats.monthlyRevenue > 0 ? 100 : 0;
    return Math.round(((stats.monthlyRevenue - stats.previousRevenue) / stats.previousRevenue) * 100);
  }, [stats.monthlyRevenue, stats.previousRevenue]);

  if (!user) return null;

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-100 p-4 md:p-6 rounded-2xl flex items-center justify-between text-sm text-red-700">
          <span>Impossible de récupérer les statistiques.</span>
          <button onClick={() => refetch()} className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition-colors">
            <RefreshCw className="w-3 h-3" /> Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0D2D5A]">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-1">Vue consolidée des performances Care4Success</p>
      </div>

      {/* Row 1 — KPIs principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard label="Enseignants actifs" value={stats.totalTeachers} icon={GraduationCap} accentColor="#1A6CC8" trend={8} description="vs mois précédent" />
        <StatCard label="Élèves suivis" value={stats.activeStudents} icon={Users} accentColor="#0D2D5A" trend={12} description="Actuellement" />
        <StatCard label="Demandes en attente" value={stats.pendingRequests} icon={ClipboardList} accentColor="#F5A623" description="À traiter" />
        <StatCard label="CA du mois" value={formatFCFA(stats.monthlyRevenue)} icon={TrendingUp} accentColor="#1A6CC8" trend={revenueTrend} description="vs mois précédent" />
      </div>

      {/* Row 2 — KPIs opérationnels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Taux d'occupation</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#0D2D5A]">{stats.occupancyRate}%</span>
            <Activity className="w-5 h-5 text-[#1A6CC8] mb-1" />
          </div>
          <div className="mt-3 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[#1A6CC8] rounded-full transition-all" style={{ width: `${stats.occupancyRate}%` }} />
          </div>
          <p className="text-[9px] text-gray-400 mt-1">Sessions effectuées ce mois</p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Profs mobilisés</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#0D2D5A]">{stats.activeTeachersThisMonth}</span>
            <GraduationCap className="w-5 h-5 text-emerald-500 mb-1" />
          </div>
          <p className="text-[9px] text-gray-400 mt-3">Avec séances ce mois</p>
        </div>

        <StatCard label="Satisfaction moyenne" value={`${stats.satisfactionRate.toFixed(1)}/5`} icon={Star} accentColor="#F5A623" />

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Nouveaux leads</p>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-black text-[#0D2D5A]">{stats.leadsThisMonth}</span>
            <Lightbulb className="w-5 h-5 text-[#F5A623] mb-1" />
          </div>
          <p className="text-[9px] text-gray-400 mt-3">Demandes de bilan ce mois</p>
        </div>
      </div>

      {/* Row 3 — Graphiques */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* CA mensuel */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#0D2D5A]">Chiffre d'affaires mensuel</h2>
            <p className="text-xs text-gray-400">Six derniers mois</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyRevenueData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => [formatFCFA(v), "CA"]} />
              <Bar dataKey="amount" fill="#1A6CC8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Dernières demandes */}
        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
          <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Dernières demandes</h2>
          <div className="space-y-3">
            {latestRequests.length === 0 && <div className="text-sm text-gray-400 text-center py-6">Aucune demande récente.</div>}
            {latestRequests.slice(0, 5).map((request: any) => (
              <div key={request.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <div className="w-8 h-8 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                  {request.parent?.[0] ?? "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#0D2D5A] truncate">{request.child}</div>
                  <div className="text-xs text-gray-400">{request.level} · {request.subject}</div>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                  request.status === "reçu" ? "bg-yellow-50 text-yellow-600"
                  : request.status === "en traitement" ? "bg-blue-50 text-blue-600"
                  : request.status === "assigné" ? "bg-green-50 text-green-600"
                  : "bg-gray-100 text-gray-500"
                }`}>{request.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 4 — CA par matière + Ratings */}
      <div className="grid lg:grid-cols-1 sm:grid-cols-2 gap-6">
        {revenueBySubject.length > 0 && (
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#0D2D5A]">CA par matière</h2>
              <p className="text-xs text-gray-400">Ce mois-ci</p>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revenueBySubject} dataKey="amount" nameKey="subject" cx="50%" cy="50%" outerRadius={80} label={({ subject, percent }) => `${subject} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {revenueBySubject.map((_: any, i: number) => (
                    <Cell key={i} fill={SUBJECT_COLORS[i % SUBJECT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatFCFA(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {revenueBySubject.map((r: any, i: number) => (
                <div key={r.subject} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: SUBJECT_COLORS[i % SUBJECT_COLORS.length] }} />
                    <span className="text-gray-600 font-medium">{r.subject}</span>
                  </div>
                  <span className="font-bold text-[#0D2D5A]">{formatFCFA(r.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={revenueBySubject.length > 0 ? "" : "lg:col-span-2"}>
          <TeacherRatingsBoard />
        </div>
      </div>
    </div>
  );
}
