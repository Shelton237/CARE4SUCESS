import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    Wallet, TrendingUp, Users, GraduationCap, 
    Download, RefreshCw, Loader2, CheckCircle2,
    ArrowUpRight, ArrowDownRight, Printer, Mail,
    History, DollarSign, PieChart as PieChartIcon
} from "lucide-react";
import { fetchFinanceSummary, fetchTeacherPayroll, generateManualInvoices } from "@/api/backoffice";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatFCFA } from "@/lib/money";
import { toast } from "sonner";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer, Cell, PieChart, Pie 
} from "recharts";

export default function AdminFinance() {
    const queryClient = useQueryClient();
    const [isGenerating, setIsGenerating] = useState(false);

    const summaryQuery = useQuery({
        queryKey: ["financeSummary"],
        queryFn: fetchFinanceSummary
    });

    const payrollQuery = useQuery({
        queryKey: ["teacherPayroll"],
        queryFn: fetchTeacherPayroll
    });

    const generateMutation = useMutation({
        mutationFn: generateManualInvoices,
        onSuccess: (data) => {
            toast.success(`Facturation terminée : ${data.generated} nouvelles factures générées pour ${data.month}`);
            queryClient.invalidateQueries({ queryKey: ["financeSummary"] });
            setIsGenerating(false);
        },
        onError: () => {
            toast.error("Erreur lors de la génération des factures");
            setIsGenerating(false);
        }
    });

    if (summaryQuery.isLoading || payrollQuery.isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    const summary = summaryQuery.data || { totalBilled: 0, totalPaid: 0, totalTeacherExpenses: 0, margin: 0 };
    const payroll = payrollQuery.data || [];

    const pieData = [
        { name: "Dépenses Profs", value: summary.totalTeacherExpenses, color: "#ef4444" },
        { name: "Marge Nette", value: Math.max(0, summary.margin), color: "#10b981" }
    ];

    return (
        <div className="w-full p-4 md:p-6 space-y-6 animate-in fade-in duration-500 bg-white min-h-screen">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-[#0D2D5A] tracking-tighter">FINANCE & PAIE</h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">Gestion des actifs et rémunérations enseignants</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-slate-200 h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest" onClick={() => summaryQuery.refetch()}>
                        <RefreshCw className={`w-3 h-3 mr-2 ${summaryQuery.isFetching ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    <Button 
                        disabled={isGenerating}
                        onClick={() => {
                            setIsGenerating(true);
                            generateMutation.mutate();
                        }}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-8 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-none"
                    >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Wallet className="w-3 h-3 mr-2" />}
                        Générer factures
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard 
                    label="Volume Facturé" 
                    value={formatFCFA(summary.totalBilled)} 
                    icon={TrendingUp} 
                    accentColor="#1A6CC8" 
                    description="Total brut"
                />
                <StatCard 
                    label="Revenus Encaissés" 
                    value={formatFCFA(summary.totalPaid)} 
                    icon={CheckCircle2} 
                    accentColor="#10b981" 
                    description="Confirmés"
                />
                <StatCard 
                    label="Dépenses Tuteurs" 
                    value={formatFCFA(summary.totalTeacherExpenses)} 
                    icon={GraduationCap} 
                    accentColor="#0D2D5A" 
                    description="Payroll estimé"
                />
                <StatCard 
                    label="Marge Brute" 
                    value={formatFCFA(summary.margin)} 
                    icon={DollarSign} 
                    accentColor="#F5A623" 
                    description="Solde opérationnel"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Payroll Table */}
                <Card className="lg:col-span-2 border border-slate-100 shadow-none bg-white rounded-xl overflow-hidden">
                    <CardHeader className="p-5 pb-3 border-b border-slate-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xs font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                    <div className="w-1 h-4 bg-[#1A6CC8] rounded-full" />
                                    Paie des Enseignants
                                </CardTitle>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#1A6CC8] font-black text-[10px] uppercase tracking-widest h-7">
                                <Download className="w-3 h-3 mr-2" /> Exporter
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-slate-50/50">
                                <TableRow className="hover:bg-transparent border-slate-100">
                                    <TableHead className="pl-6 font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Enseignant</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Mode</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Ce mois</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10 text-right pr-6">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.map((t: any) => (
                                    <TableRow key={t.id} className="group hover:bg-slate-50/30 border-slate-50 transition-colors">
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-lg bg-slate-100 text-[#0D2D5A] flex items-center justify-center font-black text-[10px]">
                                                    {t.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-[13px] text-[#0D2D5A]">{t.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded border-none font-black uppercase text-[8px] px-1.5 h-4 ${
                                                t.rateType === 'monthly' 
                                                ? 'bg-amber-100 text-[#F5A623]' 
                                                : 'bg-blue-100 text-[#1A6CC8]'
                                            }`}>
                                                {t.rateType === 'monthly' ? 'Forfait' : 'Horaire'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-[13px] text-[#0D2D5A] tracking-tight">{formatFCFA(t.monthlyEarnings)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <span className="font-black text-[13px] text-[#1A6CC8] tracking-tight">{formatFCFA(t.totalEarnings)}</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <div className="space-y-4">
                    <Card className="border border-slate-100 shadow-none bg-white rounded-xl">
                        <CardHeader className="p-5 pb-2">
                            <CardTitle className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                <PieChartIcon className="w-4 h-4 text-[#F5A623]" />
                                Répartition
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 pt-0">
                            <div className="h-[180px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={3}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.name === "Marge Nette" ? "#1A6CC8" : "#0D2D5A"} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="space-y-2 mt-2">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: item.name === "Marge Nette" ? "#1A6CC8" : "#0D2D5A" }} />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">{item.name}</span>
                                        </div>
                                        <span className="text-[11px] font-black text-[#0D2D5A] tracking-tight">{formatFCFA(item.value)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    
                    <div className="p-5 rounded-xl bg-[#0D2D5A] text-white space-y-2 relative overflow-hidden group">
                       <History className="w-5 h-5 text-[#F5A623] mb-1 relative z-10" />
                       <h4 className="text-[11px] font-black uppercase tracking-widest relative z-10">Santé Plateforme</h4>
                       <p className="text-[10px] font-bold text-slate-300 leading-normal relative z-10">
                           Marge brute : <span className="text-white font-black">{((summary.margin / summary.totalBilled) * 100).toFixed(1)}%</span>. 
                           Niveau optimal de rentabilité détecté.
                       </p>
                       <TrendingUp className="absolute -bottom-4 -right-4 w-12 h-12 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
