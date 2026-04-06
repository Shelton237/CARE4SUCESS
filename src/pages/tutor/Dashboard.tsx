import { useQuery } from "@tanstack/react-query";
import {
    ClipboardList, UserCheck, Calendar, Star, Users, TrendingUp,
    Loader2, CheckCircle, Clock, AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const API = import.meta.env.VITE_API_URL || "/api";

async function fetchTutorDashboard(token: string) {
    const res = await fetch(`${API}/tutor/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) throw new Error("Erreur chargement");
    return res.json();
}

export default function TutorDashboard() {
    const { user, token } = useAuth();

    const { data, isLoading } = useQuery({
        queryKey: ["tutorDashboard"],
        queryFn: () => fetchTutorDashboard(token!),
        enabled: !!token,
    });

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
        </div>
    );

    const stats = data?.stats || {};
    const apps = data?.recentApplications || [];

    const statCards = [
        { label: "En attente", value: stats.pendingCount ?? 0, icon: Clock, color: "text-[#F5A623]", bg: "bg-[#F5A623]/5" },
        { label: "Entretiens planifiés", value: stats.interviewCount ?? 0, icon: Calendar, color: "text-[#1A6CC8]", bg: "bg-[#1A6CC8]/5" },
        { label: "Approuvés", value: stats.approvedCount ?? 0, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Évaluations réalisées", value: stats.evalCount ?? 0, icon: Star, color: "text-purple-600", bg: "bg-purple-50" },
    ];

    const STATUS_UI: Record<string, { label: string; color: string }> = {
        pending: { label: "En attente", color: "text-[#F5A623] bg-[#F5A623]/10" },
        interview_scheduled: { label: "Entretien planifié", color: "text-[#1A6CC8] bg-[#1A6CC8]/10" },
        approved: { label: "Approuvé", color: "text-emerald-700 bg-emerald-50" },
        rejected: { label: "Refusé", color: "text-red-600 bg-red-50" },
    };

    return (
        <div className="p-4 md:p-6 space-y-6 bg-white min-h-screen font-sans text-[#0D2D5A]">
            <div className="border-b border-slate-100 pb-4">
                <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">
                    Tableau de bord Tuteur
                </h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                    Bienvenue, {user?.name} — Évaluation & qualification des enseignants
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <div key={i} className={`p-4 border border-slate-100 flex flex-col gap-2 ${s.bg}`}>
                        <div className="flex items-center gap-2">
                            <s.icon className={`w-4 h-4 ${s.color}`} />
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="border border-slate-100">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5 text-[#1A6CC8]" />
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">
                        Candidatures récentes
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                {["Candidat", "Matières", "Expérience", "Statut", "Date candidature"].map(h => (
                                    <th key={h} className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {apps.length === 0 ? (
                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[10px] text-slate-300 font-black uppercase">Aucune candidature</td></tr>
                            ) : apps.map((a: any) => {
                                const ui = STATUS_UI[a.status] || { label: a.status, color: "text-slate-500 bg-slate-100" };
                                return (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 text-[11px] font-black text-[#0D2D5A]">{a.full_name}</td>
                                        <td className="px-4 py-3 text-[10px] text-slate-500 font-bold">
                                            {(a.subjects || []).join(", ")}
                                        </td>
                                        <td className="px-4 py-3 text-[10px] text-slate-500 font-bold">{a.experience_years} ans</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-none ${ui.color}`}>
                                                {ui.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[10px] text-slate-400 font-bold">
                                            {new Date(a.created_at).toLocaleDateString("fr-FR")}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
