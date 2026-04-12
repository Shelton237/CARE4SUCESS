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
        { label: "En attente", value: stats.pendingCount ?? 0, icon: Clock, color: "text-[#F5A623]", bg: "bg-[#F5A623]/10" },
        { label: "Entretiens planifiés", value: stats.interviewCount ?? 0, icon: Calendar, color: "text-[#1A6CC8]", bg: "bg-blue-50/50" },
        { label: "Approuvés", value: stats.approvedCount ?? 0, icon: CheckCircle, color: "text-[#0D2D5A]", bg: "bg-slate-50/50" },
        { label: "Évaluations", value: stats.evalCount ?? 0, icon: Star, color: "text-[#1A6CC8]", bg: "bg-blue-50/50" },
    ];

    const STATUS_UI: Record<string, { label: string; color: string }> = {
        pending: { label: "En attente", color: "text-[#F5A623] bg-[#F5A623]/10" },
        interview_scheduled: { label: "Entretien planifié", color: "text-[#1A6CC8] bg-blue-50" },
        approved: { label: "Approuvé", color: "text-[#0D2D5A] bg-slate-100" },
        rejected: { label: "Refusé", color: "text-red-600 bg-red-50" },
    };

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3">
                <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">
                    Tableau de bord Tuteur
                </h1>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                    Bienvenue, {user?.name} — Évaluation & qualification des enseignants
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statCards.map((s, i) => (
                    <div key={i} className={`p-3 border border-slate-200 flex flex-col gap-2 rounded-none bg-white`}>
                        <div className="flex items-center gap-2">
                            <div className={`p-1.5 ${s.bg}`}>
                                <s.icon className={`w-3 h-3 ${s.color}`} />
                            </div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.label}</span>
                        </div>
                        <div className={`text-lg font-black text-[#0D2D5A] tracking-tight`}>{s.value}</div>
                    </div>
                ))}
            </div>

            <div className="border border-slate-200 shadow-none rounded-none bg-white">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
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
                                    <th key={h} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {apps.length === 0 ? (
                                <tr><td colSpan={5} className="px-3 py-8 text-center text-[10px] text-slate-300 font-black uppercase">Aucune candidature</td></tr>
                            ) : apps.map((a: any) => {
                                const ui = STATUS_UI[a.status] || { label: a.status, color: "text-slate-500 bg-slate-100" };
                                return (
                                    <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-3 py-2 text-[10px] font-black text-[#0D2D5A] uppercase tracking-tight">{a.full_name}</td>
                                        <td className="px-3 py-2 text-[9px] text-[#1A6CC8] font-black uppercase">
                                            {(a.subjects || []).join(", ")}
                                        </td>
                                        <td className="px-3 py-2 text-[9px] text-slate-500 font-bold uppercase">{a.experience_years} ans</td>
                                        <td className="px-3 py-2">
                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-none ${ui.color}`}>
                                                {ui.label}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
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
