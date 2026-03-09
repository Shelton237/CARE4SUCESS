import { useMemo } from "react";
import { formatFCFA } from "@/data/mock";
import {
    CheckCircle,
    Clock,
    Loader2,
    TrendingUp,
    DollarSign,
    ArrowUpRight,
    Calendar,
    User,
    MoreHorizontal,
    Briefcase,
    Zap,
    Download
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchEarningsHistory, fetchTeacherEarnings } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    Cell, ComposedChart, Line, Area
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function TeacherEarnings() {
    const { user } = useAuth();

    const { data: teacherEarnings = [], isLoading: loadingEarnings } = useQuery({
        queryKey: ["teacherEarnings", user?.id],
        queryFn: () => fetchTeacherEarnings(user!.id),
        enabled: !!user?.id,
    });

    const { data: earningsHistory = [], isLoading: loadingHistory } = useQuery({
        queryKey: ["earningsHistory", user?.id],
        queryFn: () => fetchEarningsHistory(user!.id),
        enabled: !!user?.id,
    });

    const total = useMemo(() => teacherEarnings.reduce((s, e) => s + e.amount, 0), [teacherEarnings]);
    const paid = useMemo(() => teacherEarnings.filter((e) => e.status === "payé").reduce((s, e) => s + e.amount, 0), [teacherEarnings]);

    // Formater l'historique pour les mois en français
    const chartData = useMemo(() => {
        const months: Record<string, string> = {
            "2025-10": "Oct", "2025-11": "Nov", "2025-12": "Déc",
            "2026-01": "Jan", "2026-02": "Fév", "2026-03": "Mar"
        };
        return earningsHistory.map(h => ({
            ...h,
            month: months[h.month] || h.month,
            revenue: h.amount
        }));
    }, [earningsHistory]);

    if (loadingEarnings || loadingHistory) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-10 animate-in fade-in duration-1000">
            {/* --- PREMIUM TEACHER REVENUE HEADER --- */}
            <div className="relative overflow-hidden bg-[#0D2D5A] p-10 rounded-[3rem] shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-10 border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-[120px] -mr-32 -mt-32" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] -ml-24 -mb-24" />

                <div className="relative z-10 flex items-center gap-8">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-3xl rounded-3xl flex items-center justify-center p-5 border border-white/10 shadow-inner">
                        <DollarSign className="w-full h-full text-green-400" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
                                Mes <span className="text-green-400">Revenus</span>
                            </h1>
                            <Badge className="bg-green-500 text-white border-none font-black text-[9px] uppercase tracking-widest px-3 py-1 animate-pulse">SAISON 25/26</Badge>
                        </div>
                        <p className="text-blue-100/60 font-bold text-sm mt-2 uppercase tracking-widest leading-none">
                            Tableau de bord financier & rapports analytiques
                        </p>
                    </div>
                </div>

                <div className="relative z-10 hidden lg:flex gap-6 items-center">
                    <div className="text-right">
                        <div className="text-4xl font-black text-white leading-none tracking-tighter">{formatFCFA(paid)}</div>
                        <p className="text-[10px] font-black text-green-400/80 uppercase tracking-widest mt-1">Total encaissé ce trimestre</p>
                    </div>
                    <Button variant="ghost" className="w-14 h-14 rounded-2xl bg-white/5 text-white hover:bg-white/10 border border-white/5">
                        <Download className="w-6 h-6" />
                    </Button>
                </div>
            </div>

            {/* --- KEY FINANCIAL CARS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { label: "Total Facturé", value: formatFCFA(total), trend: "+8.5%", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-50" },
                    { label: "Total Reçu", value: formatFCFA(paid), trend: "Verified", icon: CheckCircle, color: "text-green-500", bg: "bg-green-50" },
                    { label: "En Attente", value: formatFCFA(total - paid), trend: "Pending", icon: Clock, color: "text-orange-500", bg: "bg-orange-50" }
                ].map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-white group select-none">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shadow-inner group-hover:rotate-12 transition-all`}>
                                    <stat.icon className="w-7 h-7" />
                                </div>
                                <ArrowUpRight className="w-5 h-5 text-gray-200 group-hover:text-green-500 transition-colors" />
                            </div>
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                            <div className="text-2xl font-black text-[#0D2D5A] truncate">{stat.value}</div>
                            <div className="flex items-center gap-2 mt-3">
                                <div className="p-1 bg-green-100 rounded text-green-600"><TrendingUp className="w-3 h-3" /></div>
                                <span className="text-[9px] font-black uppercase text-green-600 tracking-widest">{stat.trend}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* --- REVENUE HISTORY CHART --- */}
                <Card className="xl:col-span-2 border-none shadow-xl rounded-[3rem] bg-white overflow-hidden">
                    <CardHeader className="p-10 pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-[#0D2D5A] uppercase tracking-tighter">Analyse Mensuelle</CardTitle>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Revenus par mois en FCFA</p>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="border-gray-100 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 h-auto">Mois</Badge>
                                <Badge variant="outline" className="border-gray-100 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 h-auto">Année</Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pb-4">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} tickFormatter={(val) => `${val / 1000}k`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0D2D5A', borderRadius: '16px', border: 'none', color: '#fff' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Area type="monotone" dataKey="revenue" fill="url(#revenueGrad)" stroke="none" />
                                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0D2D5A' : '#10b981'} opacity={0.8} />
                                        ))}
                                    </Bar>
                                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={3} dot={{ stroke: '#3b82f6', strokeWidth: 2, r: 4, fill: '#fff' }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* --- ACTIVITY SUMMARY --- */}
                <Card className="border-none shadow-xl rounded-[3rem] bg-gradient-to-br from-[#0D2D5A] to-blue-900 text-white overflow-hidden flex flex-col">
                    <CardHeader className="p-10">
                        <Zap className="w-12 h-12 text-yellow-400 mb-6 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                        <CardTitle className="text-3xl font-black uppercase tracking-tighter leading-tight italic">Performance Teacher</CardTitle>
                        <p className="text-blue-100/60 font-bold text-xs uppercase tracking-[0.2em] mt-2">Résumé d'activité global</p>
                    </CardHeader>
                    <CardContent className="p-10 pt-0 flex-1 flex flex-col justify-end gap-6 text-center lg:text-left">
                        <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/5 backdrop-blur-xl">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h5 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Total Heures</h5>
                                    <div className="text-3xl font-black">42h</div>
                                </div>
                                <div>
                                    <h5 className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-1">Missions</h5>
                                    <div className="text-3xl font-black">18</div>
                                </div>
                            </div>
                        </div>
                        <Button className="w-full h-16 rounded-2xl bg-white text-[#0D2D5A] hover:bg-green-400 hover:text-white font-black uppercase tracking-widest text-xs transition-all shadow-2xl">
                            Voir Détails Mensuels
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* --- REVENUE TABLE SECTION --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-4">
                    <h3 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tighter flex items-center gap-3">
                        <Calendar className="w-6 h-6 text-blue-500" />
                        Détails des Sessions
                    </h3>
                    <div className="flex gap-4">
                        {/* Barre de recherche ou filtres ici */}
                    </div>
                </div>

                <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100/50 overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="text-left px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-widest">Date</th>
                                <th className="text-left px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-widest">Élève</th>
                                <th className="text-center px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-widest">Volume</th>
                                <th className="text-right px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-widest">Montant</th>
                                <th className="text-center px-8 py-6 font-black text-[10px] text-gray-400 uppercase tracking-widest">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {teacherEarnings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center text-gray-400 italic font-bold">
                                        Aucune transaction enregistrée pour le moment.
                                    </td>
                                </tr>
                            ) : (
                                teacherEarnings.map((e: any, i: number) => (
                                    <tr key={e.id} className="group border-b border-gray-50 hover:bg-blue-50/30 transition-all duration-300">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-white transition-all shadow-sm">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="font-bold text-gray-500">{new Date(e.date).toLocaleDateString()}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-xs">
                                                    {e.student.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-black text-[#0D2D5A] uppercase tracking-tight">{e.student}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center font-bold text-gray-500">{e.hours}h • {formatFCFA(e.rate)}/h</td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="font-black text-lg text-[#0D2D5A] tracking-tighter">{formatFCFA(e.amount)}</div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <Badge className={`rounded-xl px-4 py-1.5 border-none font-black text-[9px] uppercase tracking-widest shadow-sm ${e.status === "payé" ? "bg-green-500 text-white" : "bg-orange-500 text-white"}`}>
                                                {e.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

