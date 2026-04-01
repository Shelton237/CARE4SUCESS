import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    CalendarCheck, 
    BarChart3, 
    Layers, 
    Medal, 
    Timer,
    Wallet,
    ChevronRight,
    Loader2,
    ShieldCheck,
    Briefcase,
} from "lucide-react";
import { fetchScheduleByRole, fetchParentOverview, fetchParentProgress, fetchChildrenByParent } from "@/api/backoffice";
import type { ScheduleSession } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    Tooltip, 
    ResponsiveContainer, 
    CartesianGrid, 
} from "recharts";
import { formatFCFA } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function ParentDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [selectedStudentId, setSelectedStudentId] = useState<string | undefined>(undefined);

    const childrenQuery = useQuery({
        queryKey: ["parentChildren", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: Boolean(user?.id),
    });

    const children = childrenQuery.data ?? [];

    useEffect(() => {
        if (children.length > 0 && !selectedStudentId) {
            setSelectedStudentId(children[0].id);
        }
    }, [children, selectedStudentId]);

    const scheduleQuery = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const overviewQuery = useQuery({
        queryKey: ["parentOverview", user?.id, selectedStudentId],
        queryFn: () => fetchParentOverview(user!.id, selectedStudentId),
        enabled: Boolean(user?.id && !!selectedStudentId),
    });

    const progressQuery = useQuery({
        queryKey: ["parentProgress", user?.id, selectedStudentId],
        queryFn: () => fetchParentProgress(user!.id, selectedStudentId),
        enabled: Boolean(user?.id && !!selectedStudentId),
    });

    const schedule = useMemo(() => scheduleQuery.data ?? [], [scheduleQuery.data]);
    const overview = overviewQuery.data;
    const progressData = progressQuery.data ?? [];

    const planningPreview = useMemo<ScheduleSession[]>(() => schedule.slice(0, 3), [schedule]);

    if (!user) return null;

    if (overviewQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    const stats = [
        { label: "Moyenne", value: overview ? `${overview.currentAvg}/20` : "—", icon: BarChart3, color: "text-[#1A6CC8]", bg: "bg-[#1A6CC8]/5" },
        { label: "Séances", value: overview?.sessionsThisMonth ?? "0", icon: Layers, color: "text-[#0D2D5A]", bg: "bg-[#0D2D5A]/5" },
        { label: "Prochain", value: overview?.upcomingSession?.date?.split('-').slice(1).reverse().join('/') || "—", icon: CalendarCheck, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Budget", value: overview ? formatFCFA(overview.totalPaidThisMonth).split(' ')[0] : "0", icon: Wallet, color: "text-[#F5A623]", bg: "bg-[#F5A623]/5" },
    ];

    return (
        <div className="p-3 md:p-5 space-y-4 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Header - Brand Aligned */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] flex items-center gap-2">
                        TABLEAU DE BORD
                        <Badge className="bg-[#F5A623] hover:bg-[#F5A623] text-white text-[9px] font-black uppercase px-2 h-4 rounded-sm border-none">PREMIUM</Badge>
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Suivi académique en temps réel</p>
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate("/parent/children")} 
                        className="h-8 text-[11px] font-bold text-[#1A6CC8] hover:bg-[#1A6CC8]/10"
                    >
                        Gestion Family
                    </Button>
                    <Button 
                        size="sm" 
                        onClick={() => navigate("/parent/invoices")} 
                        className="h-8 text-[11px] font-black uppercase tracking-wider px-6 bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white rounded-none shadow-none transition-all"
                    >
                        Facturation
                    </Button>
                </div>
            </div>

            {/* Child Picker - No Shadows */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0">Étudiant slectionné :</span>
                {children.map((child) => (
                    <button 
                        key={child.id}
                        onClick={() => setSelectedStudentId(child.id)}
                        className={`px-4 py-1.5 text-[11px] font-black transition-all whitespace-nowrap border-b-2 ${
                            selectedStudentId === child.id 
                            ? "border-[#F5A623] text-[#0D2D5A]" 
                            : "border-transparent text-slate-400 hover:text-[#0D2D5A]"
                        }`}
                    >
                        {child.name.toUpperCase()}
                    </button>
                ))}
            </div>

            {/* Brand Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <div key={i} className={`border border-slate-100 rounded p-4 flex items-center gap-4 transition-all hover:bg-slate-50/50`}>
                        <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center shrink-0`}>
                            <s.icon className={`w-5 h-5 ${s.color}`} strokeWidth={2.5} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">{s.label}</p>
                            <h3 className="text-lg font-black tracking-tight">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 space-y-4">
                    {/* Performance Line Chart */}
                    <Card className="border-slate-100 shadow-none rounded-none bg-white">
                        <CardHeader className="p-4 border-b border-slate-50 flex flex-row items-center justify-between space-y-0">
                            <CardTitle className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 className="w-4 h-4 text-[#1A6CC8]" /> Évolution des Notes
                            </CardTitle>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-[#1A6CC8]" /> MATHS
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400">
                                    <div className="w-2 h-2 rounded-full bg-[#F5A623]" /> FRANÇAIS
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <div className="h-[220px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#fafafa" />
                                        <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#cbd5e1", fontWeight: 900 }} axisLine={false} tickLine={false} />
                                        <YAxis domain={[0, 20]} tick={{ fontSize: 9, fill: "#cbd5e1" }} axisLine={false} tickLine={false} />
                                        <Tooltip 
                                            contentStyle={{ 
                                                fontSize: '11px', 
                                                borderRadius: '0', 
                                                border: '1px solid #f1f5f9', 
                                                boxShadow: 'none',
                                                fontWeight: 900
                                            }} 
                                        />
                                        <Line type="monotone" dataKey="maths" stroke="#1A6CC8" strokeWidth={3} dot={{ r: 4, fill: '#1A6CC8' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="francais" stroke="#F5A623" strokeWidth={3} dot={{ r: 4, fill: '#F5A623' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Dense List */}
                    {overview?.latestEvaluations && overview.latestEvaluations.length > 0 && (
                        <div className="border border-slate-100 rounded-none bg-white">
                            <div className="p-3 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-2">
                                    <Medal className="w-3.5 h-3.5 text-[#F5A623]" /> Derniers Résultats
                                </h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2">
                                {overview.latestEvaluations.slice(0, 4).map((evalItem) => (
                                    <div key={evalItem.id} className="p-3 border-r border-b border-slate-100 flex items-center justify-between gap-4 last:border-r-0">
                                        <div className="min-w-0">
                                            <p className="text-[8px] font-black text-[#1A6CC8] uppercase mb-0.5">{evalItem.subject}</p>
                                            <h4 className="font-bold text-xs truncate leading-none uppercase">{evalItem.quizTitle}</h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xl font-black text-[#0D2D5A]">{evalItem.score}</span>
                                            <span className="text-[10px] font-bold text-slate-300 ml-1">/{evalItem.totalPoints}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar - Brand Accents */}
                <div className="space-y-4">
                    <div className="border border-slate-100 rounded-none p-4 bg-white">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                            <h4 className="text-[10px] font-black uppercase flex items-center gap-2">
                                <Timer className="w-4 h-4 text-[#F5A623]" /> Planning
                            </h4>
                            <button className="text-[9px] font-black text-[#1A6CC8] hover:underline uppercase" onClick={() => navigate("/parent/schedule")}>Tout</button>
                        </div>
                        <div className="space-y-2">
                            {planningPreview.map((s) => (
                                <div key={s.id} className="flex items-center gap-3 p-2 bg-slate-50/30 border-l-2 border-[#1A6CC8]">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-black uppercase truncate">{s.subject}</p>
                                        <p className="text-[11px] font-bold text-slate-400 truncate mt-0.5">
                                            {s.day} · <span className="text-[#0D2D5A]">{s.time}</span>
                                        </p>
                                    </div>
                                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Branding Billing Banner */}
                    {overview?.pendingInvoice && (
                        <div className="bg-[#0D2D5A] p-4 text-white relative overflow-hidden">
                           <div className="relative z-10 flex flex-col gap-3">
                                <div className="flex items-center gap-2 opacity-80">
                                    <Briefcase className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Facture en attente</span>
                                </div>
                                <div className="flex items-end justify-between">
                                    <h4 className="text-2xl font-black">{formatFCFA(overview.pendingInvoice.amount)}</h4>
                                    <Button size="sm" className="h-7 px-4 bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-black text-[10px] rounded-none shadow-none">RÉGLER</Button>
                                </div>
                           </div>
                        </div>
                    )}

                    <div className="p-4 bg-[#F5A623]/5 border-l-2 border-[#F5A623]">
                        <p className="text-[10px] text-[#0D2D5A] leading-relaxed font-black uppercase tracking-tight">Support Pédagogique</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-1">L'équipe Eureka est à votre écoute pour toute question sur la progression.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}



