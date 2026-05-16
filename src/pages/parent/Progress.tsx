import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
    TrendingUp,
    Award,
    Calendar,
    Activity,
    Target,
    FileDown,
    Loader2,
    BarChart3,
    CheckCircle2,
    Star,
    Layers
} from "lucide-react";
import { fetchParentOverview, fetchProgressReport, fetchChildrenByParent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
    RadarChart, PolarGrid, PolarAngleAxis, Radar
} from "recharts";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ParentProgress() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const studentIdParam = searchParams.get("studentId");

    const { data: children = [] } = useQuery({
        queryKey: ["parent-children", user?.id],
        queryFn: () => fetchChildrenByParent(user?.id || ""),
        enabled: Boolean(user?.id)
    });

    // Use specific studentId if provided, else let the API handle the default (first child)
    const activeStudentId = studentIdParam || undefined;

    const overviewQuery = useQuery({
        queryKey: ["parentOverview", user?.id, activeStudentId],
        queryFn: () => fetchParentOverview(user!.id, activeStudentId),
        enabled: Boolean(user?.id),
    });

    const reportQuery = useQuery({
        queryKey: ["progressReport", user?.id, activeStudentId],
        queryFn: () => fetchProgressReport(user!.id), // The API might need updating to accept studentId, but for now we fetch global
        enabled: Boolean(user?.id),
    });

    const overview = overviewQuery.data;
    const report = reportQuery.data;

    const progressData = useMemo(() => {
        return overview?.history || [];
    }, [overview]);

    const radarData = useMemo(() => {
        if (!report?.grades) return [];
        return report.grades.map((g: any) => ({
            subject: g.subject.toUpperCase(),
            value: g.average,
            fullMark: 20
        }));
    }, [report]);

    const handleDownloadReport = () => {
        if (!report) return;
        try {
            const doc = new jsPDF();
            doc.setFillColor(13, 45, 90); doc.rect(0, 0, 210, 40, 'F');
            doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("BILAN DE PROGRESSION MENSUEL", 105, 20, { align: "center" });
            doc.setFontSize(12); doc.text(`Care4Success - Excellence Pédagogique`, 105, 30, { align: "center" });
            doc.setTextColor(0, 0, 0); doc.setFontSize(14); doc.text(`Élève : ${report.childName}`, 20, 55);
            doc.text(`Parent : ${report.parentName}`, 20, 65); doc.text(`Date du rapport : ${report.reportDate}`, 140, 55);
            doc.setFillColor(245, 245, 245); doc.rect(20, 80, 170, 10, 'F'); doc.setFontSize(10); doc.setFont("helvetica", "bold");
            doc.text("MATIÈRE", 25, 87); doc.text("MOYENNE", 90, 87, { align: "center" }); doc.text("ÉXERCICES", 130, 87, { align: "center" }); doc.text("APPRÉCIATION", 170, 87, { align: "center" });
            let y = 97; doc.setFont("helvetica", "normal");
            report.grades.forEach((g: any) => { doc.text(g.subject, 25, y); doc.text(`${g.average}/20`, 90, y, { align: "center" }); doc.text(`${g.count}`, 130, y, { align: "center" }); doc.text(g.average >= 14 ? "Excellent" : "Satisfaisant", 170, y, { align: "center" }); y += 10; });
            y += 10; doc.setFontSize(12); doc.setFont("helvetica", "bold"); doc.text("RÉSUMÉ ANALYTIQUE", 20, y); doc.setFont("helvetica", "normal"); doc.text(`Assiduité aux cours : ${report.attendance}%`, 20, y + 10);
            y += 40; doc.setFont("helvetica", "bold"); doc.text("COMMENTAIRE DE L'ÉQUIPE PÉDAGOGIQUE :", 20, y); doc.setFont("helvetica", "italic"); doc.setFontSize(10); doc.text(report.teacherComments, 20, y + 10, { maxWidth: 170 });
            doc.save(`Rapport_${report.childName}_Mars_2026.pdf`);
            toast.success("Rapport téléchargé avec succès !");
        } catch (error) { toast.error("Erreur lors de la génération du PDF."); }
    };

    const handleStudentChange = (id: string) => {
        setSearchParams({ studentId: id });
    };

    if (!user) return null;

    if (overviewQuery.isLoading || reportQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Analyses & Progression
                        <TrendingUp className="w-5 h-5 text-[#1A6CC8]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Suivi de la performance académique de {overview?.childName}</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Student Selector */}
                    {children.length > 1 && (
                        <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-100 h-9">
                            {children.map(child => (
                                <Button
                                    key={child.id}
                                    variant="ghost"
                                    onClick={() => handleStudentChange(child.id)}
                                    className={`h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-none shadow-none ${activeStudentId === child.id || (!studentIdParam && children[0].id === child.id) ? "bg-white text-[#1A6CC8] border border-slate-100" : "text-slate-400"}`}
                                >
                                    {child.name.split(' ')[0]}
                                </Button>
                            ))}
                        </div>
                    )}
                    
                    <Button 
                        onClick={handleDownloadReport}
                        className="h-9 bg-[#0D2D5A] text-white font-black text-[10px] uppercase tracking-widest rounded-none px-4"
                    >
                        <FileDown className="w-4 h-4 mr-2" /> Bilan PDF
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Moyenne Globale", value: overview?.currentAvg ? `${overview.currentAvg}/20` : "--/20", sub: overview?.previousAvg ? `PREV: ${overview.previousAvg}/20` : "PREV: --/20", icon: Award, color: "text-[#1A6CC8]", bg: "bg-slate-50/50" },
                    { label: "Assiduité", value: overview?.attendance ? `${overview.attendance}%` : "--%", sub: `${overview?.sessionsThisMonth || 0} SESSIONS OK`, icon: Activity, color: "text-emerald-600", bg: "bg-slate-50/50" },
                    { label: "Heures de cours", value: overview?.studyTime ? `${overview.studyTime}H` : "--H", sub: "CE MOIS-CI", icon: Calendar, color: "text-[#F5A623]", bg: "bg-slate-50/50" },
                    { label: "Progression", value: overview?.progression || "+0%", sub: report?.weakPoints ? "A RENFORCER" : "STABLE", icon: Target, color: "text-purple-600", bg: "bg-slate-50/50" }
                ].map((stat, i) => (
                    <div key={i} className={`p-4 border border-slate-100 rounded-none shadow-none flex flex-col ${stat.bg}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</h4>
                        </div>
                        <div className="text-2xl font-black text-[#0D2D5A] tracking-tight leading-none mb-2">{stat.value}</div>
                        <div className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{stat.sub}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <div className="lg:col-span-2 border border-slate-100 bg-white rounded-none shadow-none">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5 text-[#1A6CC8]" />
                            Courbe de performance temporelle
                        </h2>
                    </div>
                    <div className="p-4">
                        <div className="h-[280px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={progressData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} dy={10} />
                                    <YAxis domain={[0, 20]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#cbd5e1' }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '0', color: '#fff', fontSize: '11px', fontWeight: 900 }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="score" stroke="#1A6CC8" strokeWidth={3} dot={{ r: 4, fill: '#1A6CC8' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Radar Chart */}
                <div className="border border-slate-100 bg-white rounded-none shadow-none flex flex-col">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[#1A6CC8]" />
                            Équilibre des compétences
                        </h2>
                    </div>
                    <div className="p-4 flex-1 flex flex-col items-center justify-center">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                    <PolarGrid stroke="#f1f5f9" />
                                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontWeight: 900, fill: '#94a3b8' }} />
                                    <Radar name="Points" dataKey="value" stroke="#1A6CC8" fill="#1A6CC8" fillOpacity={0.2} strokeWidth={2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rapport Mensuel Automatique (Commentaires & Recommandations) */}
            {report && (
                <div className="border border-slate-100 bg-[#0D2D5A] shadow-none p-4 md:p-6 text-white">
                    <h2 className="text-[10px] font-black text-blue-200 uppercase tracking-widest flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                        <BarChart3 className="w-4 h-4 text-[#F5A623]" /> Bilan Mensuel Automatique
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-[11px] font-black uppercase text-white mb-1">Évaluation Globale</h3>
                            <p className="text-sm font-medium text-slate-300 leading-relaxed">{report.teacherComments}</p>
                        </div>
                        {report.weakPoints && (
                            <div className="bg-white/5 p-3 border border-white/10">
                                <h3 className="text-[10px] font-black uppercase text-[#F5A623] mb-1">Points Faibles Identifiés</h3>
                                <p className="text-xs font-medium text-slate-300">{report.weakPoints}</p>
                            </div>
                        )}
                        <div>
                            <h3 className="text-[11px] font-black uppercase text-white mb-1">Recommandations Pédagogiques</h3>
                            <p className="text-sm font-medium text-emerald-400 leading-relaxed">{report.recommendations}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Strengths & Improvements */}
            <div className="border border-slate-100 bg-white shadow-none">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-[#F5A623]/5">
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                        <Star className="w-3.5 h-3.5 text-[#F5A623]" /> Points de force & axes de renforcement
                    </h2>
                </div>

                <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                    <div className="p-4 sm:p-4 md:p-6">
                        <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Matières Maîtrisées
                        </h3>
                        <div className="space-y-2">
                            {report?.grades.filter((g: any) => g.average >= 14).map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/30">
                                    <span className="text-[11px] font-black text-[#0D2D5A] uppercase">{g.subject}</span>
                                    <Badge variant="outline" className="text-[10px] font-black bg-emerald-50 text-emerald-700 border-none rounded-none">{g.average}/20</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-4 sm:p-4 md:p-6">
                        <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                            <Target className="w-3.5 h-3.5 text-[#F5A623]" /> Objectifs de Progression
                        </h3>
                        <div className="space-y-2">
                            {report?.grades.filter((g: any) => g.average < 14).map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-3 border border-slate-100 bg-slate-50/30">
                                    <span className="text-[11px] font-black text-[#0D2D5A] uppercase">{g.subject}</span>
                                    <Badge variant="outline" className="text-[10px] font-black bg-orange-50 text-orange-700 border-none rounded-none">{g.average}/20</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
