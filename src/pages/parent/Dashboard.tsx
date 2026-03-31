import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
    CalendarDays, 
    TrendingUp, 
    Receipt, 
    BookOpen, 
    Award, 
    ArrowUpRight, 
    Clock,
    CreditCard,
    ChevronRight,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { fetchScheduleByRole, fetchParentOverview, fetchParentProgress, fetchChildrenByParent } from "@/api/backoffice";
import type { ScheduleSession } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
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

    const planningPreview = useMemo<ScheduleSession[]>(() => schedule.slice(0, 4), [schedule]);

    if (!user) return null;

    if (overviewQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]" />
            </div>
        );
    }

    const stats = [
        { label: "Moyenne Actuelle", value: overview ? `${overview.currentAvg}/20` : "—", icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Séances ce mois", value: overview?.sessionsThisMonth ?? "0", icon: BookOpen, color: "text-emerald-600", bg: "bg-emerald-50" },
        { label: "Prochain Cours", value: overview?.upcomingSession?.date?.split('-').slice(1).reverse().join('/') || "—", icon: CalendarDays, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Total Investi", value: overview ? formatFCFA(overview.totalPaidThisMonth).split(' ')[0] : "0", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
            {/* Header Sober & Pro */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-[#0D2D5A] text-[#0D2D5A] font-black px-3 py-1 bg-white uppercase tracking-tighter text-[10px]">
                            <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Compte Parent Premium
                        </Badge>
                    </div>
                    <h1 className="text-3xl font-black text-[#0D2D5A] tracking-tight">Centre de Pilotage</h1>
                    
                    {/* Family Context Selector */}
                    <div className="flex flex-col space-y-2">
                        <p className="text-gray-500 font-medium text-sm">Sélectionner un enfant pour voir son suivi :</p>
                        <div className="flex flex-wrap gap-2">
                            {children.length > 0 ? (
                                children.map((child) => (
                                    <Button 
                                        key={child.id}
                                        size="sm"
                                        variant={selectedStudentId === child.id ? "default" : "outline"}
                                        onClick={() => setSelectedStudentId(child.id)}
                                        className={`rounded-full px-4 font-bold text-xs ${
                                            selectedStudentId === child.id 
                                            ? "bg-[#0D2D5A] text-white hover:bg-[#0D2D5A]" 
                                            : "text-gray-500 border-gray-200"
                                        }`}
                                    >
                                        {child.name}
                                    </Button>
                                ))
                            ) : (
                                <Badge variant="secondary" className="bg-gray-100 text-gray-400">Chargement de la famille...</Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button onClick={() => navigate("/parent/children")} variant="outline" className="border-gray-200 hover:bg-gray-50 font-bold h-12 px-6 rounded-xl">
                        Mes Enfants
                    </Button>
                    <Button onClick={() => navigate("/parent/invoices")} className="bg-[#0D2D5A] hover:bg-[#1a3d6e] font-bold h-12 px-6 rounded-xl shadow-lg shadow-blue-900/10">
                        Mes Factures
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white overflow-hidden group hover:shadow-md transition-all duration-300">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className={`p-3 rounded-2xl ${s.bg} ${s.color} transition-transform group-hover:scale-110 duration-300`}>
                                    <s.icon className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</p>
                                <h3 className="text-2xl font-black text-[#0D2D5A] mt-1">{s.value}</h3>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black text-[#0D2D5A] flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#0D2D5A] rounded-full" />
                            Évolution Académique
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        {progressData.length > 0 ? (
                            <div className="h-[300px] w-full mt-6">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={progressData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" tick={{ fontSize: 11, fontWeight: 700, fill: "#94a3b8" }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis domain={[0, 20]} hide />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: 'bold' }}
                                            itemStyle={{ color: '#fff' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: 20, fontSize: 12, fontWeight: 800 }} iconType="circle" />
                                        <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={4} dot={{ r: 4, fill: "#1A6CC8", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={4} dot={{ r: 4, fill: "#F5A623", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div className="h-[300px] flex items-center justify-center text-gray-400 font-medium italic">
                                Données en cours de synchronisation...
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Right Sidebar - Planning & Evaluations */}
                <div className="space-y-6">
                    {/* Planning Card */}
                    <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                        <CardHeader className="p-6 pb-2">
                            <CardTitle className="text-sm font-black text-[#0D2D5A] uppercase tracking-widest flex items-center justify-between">
                                Planning Récent
                                <CalendarDays className="w-4 h-4 text-blue-500" />
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 space-y-3">
                            {planningPreview.map((s) => (
                                <div key={s.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100 group">
                                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-[#0D2D5A] group-hover:text-white transition-colors duration-300">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-black text-[#0D2D5A] truncate">{s.day} {s.date}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">{s.subject} · {s.time}</p>
                                    </div>
                                    <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 font-black text-[9px] border-none uppercase px-2">
                                        Ok
                                    </Badge>
                                </div>
                            ))}
                            <Button variant="ghost" className="w-full text-xs font-black text-blue-600 hover:bg-blue-50 mt-2" onClick={() => navigate("/parent/schedule")}>
                                Consulter l'agenda complet <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Alert Facture */}
                    {overview?.pendingInvoice && (
                        <div className="bg-[#0D2D5A] rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden group">
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Receipt className="w-4 h-4 text-blue-300" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-blue-200">Facturation</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold opacity-80">Règlement en attente</p>
                                    <h4 className="text-2xl font-black mt-1">{formatFCFA(overview.pendingInvoice.amount)}</h4>
                                </div>
                                <Button className="w-full bg-white text-[#0D2D5A] hover:bg-blue-50 font-black h-11 rounded-xl shadow-lg group-hover:scale-[1.02] transition-transform">
                                    Régler maintenant
                                </Button>
                            </div>
                            <CreditCard className="absolute -bottom-4 -right-4 w-24 h-24 text-white/5 -rotate-12 group-hover:scale-110 transition-transform duration-700" />
                        </div>
                    )}
                </div>
            </div>

            {/* Evaluations Section */}
            {overview?.latestEvaluations && overview.latestEvaluations.length > 0 && (
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                        <h2 className="text-xl font-black text-[#0D2D5A]">Derniers Succès Académiques</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {overview.latestEvaluations.slice(0, 4).map((evalItem) => (
                            <div key={evalItem.id} className="p-5 rounded-3xl bg-gray-50 border border-transparent hover:border-blue-100 hover:bg-white transition-all shadow-sm group">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="p-2.5 rounded-xl bg-white shadow-sm group-hover:bg-amber-50 transition-colors">
                                        <Award className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <span className="text-lg font-black text-[#0D2D5A]">{evalItem.score}/{evalItem.totalPoints}</span>
                                </div>
                                <h4 className="font-bold text-[#0D2D5A] text-sm truncate">{evalItem.quizTitle}</h4>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{evalItem.subject}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
