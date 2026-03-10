import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp,
    Award,
    Calendar,
    Activity,
    Target,
    FileDown,
    Loader2,
    BarChart3,
    CheckCircle2
} from "lucide-react";
import { fetchParentOverview, fetchProgressReport, fetchScheduleByRole } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
    AreaChart, Area
} from "recharts";
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

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour consulter la progression.
            </div>
        );
    }

    if (overviewQuery.isLoading || reportQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Analyses & Progression</h1>
                    <p className="text-gray-500 text-sm mt-1">Suivi détaillé de la performance académique de {overview?.childName}.</p>
                </div>
                <button
                    onClick={handleDownloadReport}
                    className="flex items-center gap-2 bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white rounded-lg px-5 py-2.5 font-bold text-xs transition-colors shadow-sm w-fit"
                >
                    <FileDown className="w-4 h-4" />
                    Bilan PDF
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Moyenne Actuelle", value: `${overview?.currentAvg}/20`, sub: `Précédent: ${overview?.previousAvg}/20`, icon: Award, color: "text-[#1A6CC8]", bg: "bg-[#1A6CC8]/5" },
                    { label: "Assiduité Live", value: "95%", sub: "98% sessions complétées", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                    { label: "Temps de travail", value: "14h", sub: "Étude et Quiz", icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
                    { label: "Objectif Trimestre", value: "15/20", sub: "Matière cible: Maths", icon: Target, color: "text-purple-600", bg: "bg-purple-50" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col p-5">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                                <stat.icon className="w-5 h-5" />
                            </div>
                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{stat.label}</h4>
                        </div>
                        <div className="text-2xl font-bold text-[#0D2D5A]">{stat.value}</div>
                        <p className="text-[10px] font-medium text-gray-400 mt-1">{stat.sub}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                            <TrendingUp className="w-4 h-4 text-[#1A6CC8]" />
                        </div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Courbe d'évolution</h2>
                    </div>
                    <div className="p-6">
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
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4 text-[#1A6CC8]" />
                        </div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Équilibre Acquis</h2>
                    </div>
                    <div className="p-6 flex-1 flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                                    <Radar name="Notes" dataKey="value" stroke="#1A6CC8" fill="#1A6CC8" fillOpacity={0.3} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-orange-50/50">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Award className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Points de force & Axes d'amélioration</h2>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    <div className="p-6">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            Matières Fortes
                        </h3>
                        <div className="space-y-4">
                            {report?.grades.filter((g: any) => g.average >= 14).map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                                    <span className="text-sm font-semibold text-[#0D2D5A]">{g.subject}</span>
                                    <span className="text-sm font-bold text-emerald-600">{g.average}/20</span>
                                </div>
                            ))}
                            {report?.grades.filter((g: any) => g.average >= 14).length === 0 && (
                                <div className="text-sm text-gray-400 italic p-3 text-center">Aucune matière forte pour l'instant.</div>
                            )}
                        </div>
                    </div>
                    <div className="p-6">
                        <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                            <Target className="w-4 h-4 text-orange-500" />
                            À renforcer
                        </h3>
                        <div className="space-y-4">
                            {report?.grades.filter((g: any) => g.average < 14).map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
                                    <span className="text-sm font-semibold text-[#0D2D5A]">{g.subject}</span>
                                    <span className="text-sm font-bold text-orange-600">{g.average}/20</span>
                                </div>
                            ))}
                            {report?.grades.filter((g: any) => g.average < 14).length === 0 && (
                                <div className="text-sm text-gray-400 italic p-3 text-center">Aucune difficulté majeure constatée.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
