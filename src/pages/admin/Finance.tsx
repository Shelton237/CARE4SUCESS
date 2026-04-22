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
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
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
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-[#0D2D5A] tracking-tight">Gestion Financière</h1>
                    <p className="text-gray-500 font-medium">Suivez vos revenus et gérez les paiements enseignants</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="border-gray-200 h-11 px-6 rounded-xl font-bold" onClick={() => summaryQuery.refetch()}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${summaryQuery.isFetching ? 'animate-spin' : ''}`} /> Actualiser
                    </Button>
                    <Button 
                        disabled={isGenerating}
                        onClick={() => {
                            setIsGenerating(true);
                            generateMutation.mutate();
                        }}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] h-11 px-6 rounded-xl font-bold shadow-lg shadow-blue-500/20"
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Wallet className="w-4 h-4 mr-2" />}
                        Générer factures parents
                    </Button>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard 
                    label="Volume Facturé" 
                    value={formatFCFA(summary.totalBilled)} 
                    icon={TrendingUp} 
                    accentColor="#1A6CC8" 
                    description="Total toutes factures"
                />
                <StatCard 
                    label="Revenus Encaissés" 
                    value={formatFCFA(summary.totalPaid)} 
                    icon={CheckCircle2} 
                    accentColor="#10b981" 
                    description="Paiements confirmés"
                />
                <StatCard 
                    label="Dépenses Tuteurs" 
                    value={formatFCFA(summary.totalTeacherExpenses)} 
                    icon={GraduationCap} 
                    accentColor="#ef4444" 
                    description="Calculé sur séances/forfaits"
                />
                <StatCard 
                    label="Marge Brute" 
                    value={formatFCFA(summary.margin)} 
                    icon={DollarSign} 
                    accentColor={summary.margin >= 0 ? "#1A6CC8" : "#ef4444"} 
                    description="Solde de la plateforme"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Payroll Table */}
                <Card className="lg:col-span-2 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
                    <CardHeader className="p-8 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-[#0D2D5A] flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-[#1A6CC8] rounded-full" />
                                    Paie des Enseignants
                                </CardTitle>
                                <CardDescription className="mt-1 font-medium">Récapitulatif des gains par professeur</CardDescription>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#1A6CC8] font-bold">
                                <Download className="w-4 h-4 mr-2" /> Exporter PDF
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow className="hover:bg-transparent border-none">
                                    <TableHead className="pl-8 font-black text-[#0D2D5A] uppercase text-[10px] tracking-widest h-12">Enseignant</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[10px] tracking-widest h-12">Mode</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[10px] tracking-widest h-12">Mois en cours</TableHead>
                                    <TableHead className="font-black text-[#0D2D5A] uppercase text-[10px] tracking-widest h-12 text-right pr-8">Gain Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {payroll.map((t: any) => (
                                    <TableRow key={t.id} className="group hover:bg-gray-50/50 border-gray-100 transition-colors">
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A6CC8] flex items-center justify-center font-black">
                                                    {t.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-[#0D2D5A]">{t.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`rounded-lg border-none font-bold uppercase text-[9px] ${
                                                t.rateType === 'monthly' 
                                                ? 'bg-purple-50 text-purple-600' 
                                                : 'bg-blue-50 text-blue-600'
                                            }`}>
                                                {t.rateType === 'monthly' ? 'Forfait' : 'Horaire'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-black text-[#0D2D5A]">{formatFCFA(t.monthlyEarnings)}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <span className="font-black text-[#1A6CC8]">{formatFCFA(t.totalEarnings)}</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Distribution Chart */}
                <Card className="border-none shadow-sm bg-white rounded-[2rem]">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-base font-black text-[#0D2D5A] flex items-center gap-3">
                            <PieChartIcon className="w-5 h-5 text-emerald-500" />
                            Répartition Financière
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-2">
                        <div className="h-[240px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-4 mt-4">
                            {pieData.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-2xl bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                                        <span className="text-xs font-bold text-gray-500">{item.name}</span>
                                    </div>
                                    <span className="text-xs font-black text-[#0D2D5A]">{formatFCFA(item.value)}</span>
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-8 p-6 rounded-[1.5rem] bg-[#0D2D5A] text-white space-y-3 relative overflow-hidden group">
                           <History className="w-6 h-6 text-blue-400 mb-2 relative z-10" />
                           <h4 className="text-sm font-black relative z-10">Santé de la plateforme</h4>
                           <p className="text-[10px] text-blue-200 leading-relaxed relative z-10">
                               Votre marge brute actuelle est de <span className="text-white font-bold">{((summary.margin / summary.totalBilled) * 100).toFixed(1)}%</span>. 
                               Assurez-vous de relancer les factures en attente.
                           </p>
                           <TrendingUp className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 group-hover:scale-110 transition-transform duration-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
