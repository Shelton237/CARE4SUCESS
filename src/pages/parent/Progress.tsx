import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    Star,
    BookOpen,
    Award,
    Download,
    Calendar,
    PieChart as PieIcon,
    Zap,
    ArrowUpRight,
    CheckCircle2,
    Target,
    Activity,
    FileDown,
    Loader2
} from "lucide-react";
import { fetchParentOverview, fetchProgressReport, fetchScheduleByRole } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    AreaChart, Area
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

export default function ParentProgress() {
    const { user } = useAuth();

    const overviewQuery = useQuery({
        queryKey: ["parentOverview", user?.id],
        queryFn: () => fetchParentOverview(user!.id),
        enabled: Boolean(user?.id),
    });

    const reportQuery = useQuery({
        queryKey: ["progressReport", user?.id],
        queryFn: () => fetchProgressReport(user!.id),
        enabled: Boolean(user?.id),
    });

    const scheduleQuery = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const overview = overviewQuery.data;
    const report = reportQuery.data;
    const schedule = scheduleQuery.data ?? [];

    const progressData = useMemo(() => {
        // Simulation de données historiques si non fournies
        return [
            { name: 'Oct', score: 11.5, effort: 70 },
            { name: 'Nov', score: 12.2, effort: 75 },
            { name: 'Déc', score: 11.8, effort: 65 },
            { name: 'Jan', score: 13.5, effort: 85 },
            { name: 'Fév', score: 14.2, effort: 90 },
            { name: 'Mar', score: overview?.currentAvg || 14.5, effort: 95 },
        ];
    }, [overview?.currentAvg]);

    const radarData = useMemo(() => {
        if (!report?.grades) return [];
        return report.grades.map((g: any) => ({
            subject: g.subject,
            value: g.average,
            fullMark: 20
        }));
    }, [report]);

    const handleDownloadReport = () => {
        if (!report) return;

        try {
            const doc = new jsPDF();

            // Header
            doc.setFillColor(13, 45, 90); // Dark Blue
            doc.rect(0, 0, 210, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.text("BILAN DE PROGRESSION MENSUEL", 105, 20, { align: "center" });
            doc.setFontSize(12);
            doc.text(`Care4Success - Excellence Pédagogique`, 105, 30, { align: "center" });

            // Body Info
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(14);
            doc.text(`Élève : ${report.childName}`, 20, 55);
            doc.text(`Parent : ${report.parentName}`, 20, 65);
            doc.text(`Date du rapport : ${report.reportDate}`, 140, 55);

            // Grades Table Header
            doc.setFillColor(245, 245, 245);
            doc.rect(20, 80, 170, 10, 'F');
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("MATIÈRE", 25, 87);
            doc.text("MOYENNE", 90, 87, { align: "center" });
            doc.text("ÉXERCICES", 130, 87, { align: "center" });
            doc.text("APPRÉCIATION", 170, 87, { align: "center" });

            // Grades Data
            let y = 97;
            doc.setFont("helvetica", "normal");
            report.grades.forEach((g: any) => {
                doc.text(g.subject, 25, y);
                doc.text(`${g.average}/20`, 90, y, { align: "center" });
                doc.text(`${g.count}`, 130, y, { align: "center" });
                doc.text(g.average >= 14 ? "Excellent" : "Satisfaisant", 170, y, { align: "center" });
                y += 10;
            });

            // Stats Section
            doc.line(20, y + 5, 190, y + 5);
            y += 20;
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("RÉSUMÉ ANALYTIQUE", 20, y);
            doc.setFont("helvetica", "normal");
            doc.text(`Assiduité aux cours : ${report.attendance}%`, 20, y + 10);
            doc.text(`Progression globale : +${(overview?.currentAvg - 11.8).toFixed(1)} pts`, 20, y + 20);

            // Comments
            y += 40;
            doc.setFont("helvetica", "bold");
            doc.text("COMMENTAIRE DE L'ÉQUIPE PÉDAGOGIQUE :", 20, y);
            doc.setFont("helvetica", "italic");
            doc.setFontSize(10);
            doc.text(report.teacherComments, 20, y + 10, { maxWidth: 170 });

            // Footer
            doc.setFont("helvetica", "normal");
            doc.setFontSize(8);
            doc.text("Document généré automatiquement par la plateforme Care4Success. CM - 2026", 105, 285, { align: "center" });

            doc.save(`Rapport_${report.childName}_Mars_2026.pdf`);
            toast.success("Rapport téléchargé avec succès !");
        } catch (error) {
            console.error(error);
            toast.error("Erreur lors de la génération du PDF.");
        }
    };

    if (overviewQuery.isLoading || reportQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Analyses & Progression</h1>
                    <p className="text-gray-500 text-sm mt-1">Suivi détaillé de la performance académique de {overview?.childName}.</p>
                </div>
                <Button
                    onClick={handleDownloadReport}
                    className="bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white rounded-xl h-10 px-6 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                >
                    <FileDown className="w-4 h-4" />
                    Bilan PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Moyenne Actuelle", value: `${overview?.currentAvg}/20`, sub: `Précédent: ${overview?.previousAvg}/20`, icon: Award, color: "text-[#1A6CC8]", bg: "bg-[#1A6CC8]/5" },
                    { label: "Assiduité Live", value: "95%", sub: "98% sessions complétées", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Temps de travail", value: "14h", sub: "Étude et Quiz", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Objectif Trimestre", value: "15/20", sub: "Matière cible: Maths", icon: Target, color: "text-purple-600", bg: "bg-purple-50" }
                ].map((stat, i) => (
                    <Card key={i} className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden group">
                        <CardContent className="p-5 sm:p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                    <stat.icon className="w-6 h-6" />
                                </div>
                                <ArrowUpRight className="w-4 h-4 text-gray-200" />
                            </div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{stat.label}</h4>
                            <div className="text-2xl font-bold text-[#0D2D5A]">{stat.value}</div>
                            <p className="text-[10px] font-medium text-gray-400 mt-1">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <Card className="xl:col-span-2 border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 pb-0">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg font-bold text-[#0D2D5A]">Courbe d'évolution</CardTitle>
                                <p className="text-xs text-gray-400 mt-0.5">Moyenne pondérée des 6 derniers mois</p>
                            </div>
                            <Badge variant="outline" className="bg-[#1A6CC8]/5 text-[#1A6CC8] border-none font-bold text-[10px] px-3 py-1">Majeur : Maths</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[300px] w-full mt-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={progressData}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#1A6CC8" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#1A6CC8" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} dy={10} />
                                    <YAxis hide domain={[0, 20]} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#1A6CC8" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                    <Line type="monotone" dataKey="effort" stroke="#fbbf24" strokeWidth={2} strokeDasharray="5 5" opacity={0.3} dot={false} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border border-gray-100 shadow-sm rounded-2xl bg-white overflow-hidden">
                    <CardHeader className="p-6 pb-0">
                        <CardTitle className="text-lg font-bold text-[#0D2D5A]">Équilibre Acquis</CardTitle>
                        <p className="text-xs text-gray-400 mt-0.5">Répartition par pôle</p>
                    </CardHeader>
                    <CardContent className="p-6 flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                    <Radar name="Notes" dataKey="value" stroke="#1A6CC8" fill="#1A6CC8" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="w-full mt-4 space-y-2">
                            {radarData.map((d: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#1A6CC8]" />
                                        <span className="text-xs font-bold text-[#0D2D5A]">{d.subject}</span>
                                    </div>
                                    <span className="font-bold text-[#1A6CC8] text-xs">{d.value}/20</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm rounded-2xl bg-gradient-to-br from-[#0D2D5A] to-[#1A6CC8] text-white overflow-hidden">
                    <CardContent className="p-8 sm:p-10 relative">
                        <Zap className="absolute top-6 right-6 w-16 h-16 text-white/5" />
                        <h3 className="text-2xl font-bold mb-3 italic">Next Step: Mention Très Bien</h3>
                        <p className="text-blue-100/80 text-sm mb-6 max-w-md">
                            {overview?.childName} montre une forte appétence pour les modules scientifiques. En maintenant cet effort sur le Français, il peut viser l'excellence globale au prochain trimestre.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/5">
                                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Majeur Performance</div>
                                <div className="text-xl font-bold">Maths 17.5</div>
                            </div>
                            <div className="bg-white/10 backdrop-blur-md p-5 rounded-xl border border-white/5">
                                <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Effort Global</div>
                                <div className="text-xl font-bold">Intense</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#0D2D5A] px-1">Derniers Quiz Réussis</h3>
                    <div className="grid gap-3">
                        {(overview?.latestEvaluations || []).map((ev: any, i: number) => (
                            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-[#0D2D5A] text-sm">{ev.quizTitle || "Évaluation"}</h4>
                                        <p className="text-[10px] font-medium text-gray-400">{ev.subject} • {new Date(ev.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="text-lg font-bold text-emerald-600">{ev.score}/{ev.totalPoints || 20}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

