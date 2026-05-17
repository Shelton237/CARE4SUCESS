import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
    TrendingUp, Award, Calendar, Activity,
    ClipboardCheck, FileText, CheckCircle2,
    Star, BookOpen, AlertTriangle, Loader2
} from "lucide-react";
import {
    fetchParentOverview,
    fetchStudentSessions,
    fetchStudentProgressData,
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL || "/api";

import { fetchChildrenByParent } from "@/api/backoffice";

function parseRobustDate(dateStr: any): Date | null {
    if (!dateStr) return null;
    if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
    
    if (typeof dateStr === "number" || /^\d+$/.test(dateStr)) {
        const d = new Date(Number(dateStr));
        return isNaN(d.getTime()) ? null : d;
    }
    
    let str = String(dateStr).trim();
    if (!str || str.toLowerCase() === "invalid date") return null;

    if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
        str = str.replace(/-/g, "/");
    }
    
    if (/^\d{2}\/\d{2}\/\d{4}/.test(str)) {
        const parts = str.split(/[T ]/)[0].split("/");
        const d = new Date(`${parts[2]}/${parts[1]}/${parts[0]}`);
        if (!isNaN(d.getTime())) return d;
    }

    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) return parsed;

    return null;
}

function formatRobustDate(dateStr: any, options?: Intl.DateTimeFormatOptions): string {
    const d = parseRobustDate(dateStr);
    if (!d) return "—";
    return d.toLocaleDateString("fr-FR", options || { day: "2-digit", month: "short", year: "numeric" });
}

interface AcademicFileProps {
    studentId: string;
    parentId?: string; // Si fourni, on utilise la vue parent; sinon admin
}

export default function AcademicFile({ studentId: propStudentId, parentId }: AcademicFileProps) {
    const { token, user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<"overview" | "diagnostic" | "plan" | "history">("overview");

    // Récupérer les enfants si l'utilisateur est un parent
    const childrenQuery = useQuery({
        queryKey: ["children", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: user?.role === "parent",
    });

    const children = childrenQuery.data ?? [];

    // Résoudre le studentId : Prop > Query Param > Premier enfant du parent
    const studentId = useMemo(() => {
        if (propStudentId && propStudentId !== user?.id) return propStudentId;
        
        const urlId = searchParams.get("studentId");
        if (urlId) return urlId;

        if (user?.role === "parent" && children.length > 0) {
            return children[0].id;
        }

        return propStudentId;
    }, [propStudentId, searchParams, user, children]);

    // Résoudre l'ID à utiliser pour l'endpoint parent overview
    const resolvedParentId = parentId || (user?.role === "parent" ? user.id : "admin");

    // ── OVERVIEW ── données réelles de l'élève via parent_overviews
    const overviewQuery = useQuery({
        queryKey: ["academicOverview", resolvedParentId, studentId],
        queryFn: () => fetchParentOverview(resolvedParentId, studentId),
        enabled: Boolean(studentId),
        retry: false,
    });

    // ── SESSIONS ── historique des cours de l'élève
    const sessionsQuery = useQuery({
        queryKey: ["studentSessions", studentId],
        queryFn: () => fetchStudentSessions(studentId),
        enabled: Boolean(studentId),
        retry: false,
    });

    // ── DIAGNOSTIC ── évaluation initiale
    const diagnosticQuery = useQuery({
        queryKey: ["studentDiagnostic", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/diagnostic`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: Boolean(studentId && token),
        retry: false,
    });

    // ── PLAN ── plan pédagogique actif
    const planQuery = useQuery({
        queryKey: ["studentPlan", studentId],
        queryFn: async () => {
            const res = await fetch(`${API}/students/${studentId}/academic-plan`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return null;
            return res.json();
        },
        enabled: Boolean(studentId && token),
        retry: false,
    });

    // ── PROGRESSION ── points de progression mensuels
    const progressQuery = useQuery({
        queryKey: ["studentProgress", studentId],
        queryFn: () => fetchStudentProgressData(studentId),
        enabled: Boolean(studentId),
        retry: false,
    });

    const overview = overviewQuery.data;
    const sessions = sessionsQuery.data ?? [];
    const diagnostic = diagnosticQuery.data;
    const plan = planQuery.data;
    const progressPoints = progressQuery.data ?? [];

    // Calcul du graphique de progression depuis la BDN
    const progressData = useMemo(() => {
        if (overview?.history && overview.history.length > 0) return overview.history;
        if (progressPoints.length > 0) {
            return progressPoints.map((p: any) => ({
                name: p.month,
                score: p.maths || p.score || 0,
            }));
        }
        return [];
    }, [overview, progressPoints]);

    // Sessions terminées pour l'historique
    const completedSessions = useMemo(() => {
        return sessions
            .filter((s: any) => s.status === "effectué")
            .sort((a: any, b: any) => {
                const dateA = parseRobustDate(a.date || a.session_date);
                const dateB = parseRobustDate(b.date || b.session_date);
                return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
            })
            .slice(0, 20);
    }, [sessions]);

    const isLoading = overviewQuery.isLoading;

    return (
        <div className="bg-white border border-slate-100 rounded-none w-full animate-in fade-in duration-500">
            {/* Header always visible to allow selection */}
            <div className="p-4 md:p-6 border-b border-slate-100 bg-[#0D2D5A] text-white">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            {user?.role === "parent" && children.length > 0 ? (
                                <select 
                                    value={studentId || ""}
                                    onChange={(e) => setSearchParams({ studentId: e.target.value })}
                                    className="bg-transparent text-xl font-black uppercase tracking-tight border-none focus:ring-0 p-0 cursor-pointer hover:text-blue-200 transition-colors"
                                >
                                    <option value="" disabled className="bg-[#0D2D5A] text-white">Sélectionner un enfant...</option>
                                    {children.map((c: any) => (
                                        <option key={c.id} value={c.id} className="bg-[#0D2D5A] text-white">{c.name}</option>
                                    ))}
                                </select>
                            ) : (
                                <h2 className="text-xl font-black uppercase tracking-tight">
                                    {overview?.childName || "Dossier Académique"}
                                </h2>
                            )}
                            <Badge className="bg-[#1A6CC8] text-white border-none text-[10px] font-black uppercase rounded-sm">Premium</Badge>
                        </div>
                        {studentId && (
                            <p className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">
                                Niveau: {overview?.childLevel || "Non défini"} · Matière : {overview?.focusSubject || "—"}
                            </p>
                        )}
                    </div>
                    {studentId && (
                        <div className="flex gap-2 flex-wrap">
                            {(["overview", "diagnostic", "plan", "history"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-colors ${
                                        activeTab === tab ? "border-white text-white" : "border-transparent text-white/50 hover:text-white/80"
                                    }`}
                                >
                                    {tab === "overview" && "Aperçu"}
                                    {tab === "diagnostic" && "Diagnostic"}
                                    {tab === "plan" && "Plan"}
                                    {tab === "history" && `Historique (${completedSessions.length})`}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 md:p-6 bg-slate-50/50 min-h-[400px]">
                {!studentId ? (
                    <div className="flex flex-col items-center justify-center h-48 text-center bg-white border border-slate-100">
                        <BookOpen className="w-8 h-8 text-slate-200 mb-3" />
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                            Sélectionnez un élève pour accéder à son dossier
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="flex items-center justify-center h-48 bg-white border border-slate-100">
                        <Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]/30" />
                    </div>
                ) : activeTab === "overview" && (
                    <div className="space-y-6">
                        {overviewQuery.isError && (
                            <div className="p-4 bg-amber-50 border border-amber-100 text-[11px] text-amber-700 font-bold">
                                Données de la BDN non disponibles pour cet élève. Vérifiez que la table parent_overviews est alimentée.
                            </div>
                        )}

                        {/* Quick Stats from DB */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                {
                                    label: "Moyenne Globale",
                                    value: overview?.currentAvg != null ? `${Number(overview.currentAvg).toFixed(1)}/20` : "--/20",
                                    icon: Award,
                                    color: "text-[#1A6CC8]",
                                    sub: overview?.previousAvg != null
                                        ? `Préc. : ${Number(overview.previousAvg).toFixed(1)}/20`
                                        : null,
                                },
                                {
                                    label: "Cours ce mois",
                                    value: overview?.sessionsThisMonth != null ? `${overview.sessionsThisMonth}` : "--",
                                    icon: Calendar,
                                    color: "text-[#F5A623]",
                                    sub: sessions.length > 0 ? `${sessions.length} total` : null,
                                },
                                {
                                    label: "Matière focus",
                                    value: overview?.focusSubject || "--",
                                    icon: BookOpen,
                                    color: "text-purple-600",
                                    sub: null,
                                },
                                {
                                    label: "Tendance",
                                    value: overview?.currentAvg != null && overview?.previousAvg != null
                                        ? (Number(overview.currentAvg) - Number(overview.previousAvg) >= 0 ? "↑ Hausse" : "↓ Baisse")
                                        : "--",
                                    icon: TrendingUp,
                                    color: overview?.currentAvg != null && overview?.previousAvg != null
                                        ? (Number(overview.currentAvg) >= Number(overview.previousAvg) ? "text-emerald-600" : "text-red-500")
                                        : "text-slate-400",
                                    sub: null,
                                },
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-4 border border-slate-100 flex flex-col gap-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className={`w-4 h-4 ${stat.color}`} />
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</h4>
                                    </div>
                                    <div className="text-xl font-black text-[#0D2D5A] tracking-tight">{stat.value}</div>
                                    {stat.sub && <p className="text-[9px] text-slate-300 font-bold uppercase">{stat.sub}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Chart & Evaluations */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <div className="lg:col-span-2 bg-white border border-slate-100 p-4">
                                <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest mb-4">
                                    Courbe de progression (BDN)
                                </h3>
                                {progressData.length > 0 ? (
                                    <div className="h-[220px] w-full">
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
                                ) : (
                                    <div className="h-[220px] flex items-center justify-center text-slate-300">
                                        <div className="text-center">
                                            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Aucune donnée de progression</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dernières évaluations réelles */}
                            <div className="bg-[#0D2D5A] border border-slate-100 p-4 text-white flex flex-col">
                                <h3 className="text-[10px] font-black text-[#F5A623] uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Star className="w-4 h-4" /> Dernières évaluations
                                </h3>
                                {overview?.latestEvaluations && overview.latestEvaluations.length > 0 ? (
                                    <div className="flex-1 space-y-3">
                                        {overview.latestEvaluations.map((ev: any, i: number) => (
                                            <div key={i} className="bg-white/5 border border-white/10 p-3">
                                                <div className="flex justify-between items-start mb-1">
                                                    <p className="text-[10px] font-black text-white uppercase">{ev.quizTitle || ev.courseTitle}</p>
                                                    <span className="text-[11px] font-black text-[#F5A623]">{ev.score}/{ev.totalPoints || 20}</span>
                                                </div>
                                                <p className="text-[9px] text-blue-300 font-bold uppercase">{ev.subject}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex-1 flex items-center justify-center text-white/30">
                                        <p className="text-[10px] font-black uppercase text-center">Aucune évaluation encore réalisée</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── TAB: DIAGNOSTIC ─── */}
                {activeTab === "diagnostic" && (
                    <div className="bg-white border border-slate-100 p-6">
                        {diagnosticQuery.isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]/30" /></div>
                        ) : diagnostic ? (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <h3 className="text-[14px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                        <ClipboardCheck className="w-5 h-5 text-[#1A6CC8]" />
                                        Bilan de compétences initial
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Fait le {formatRobustDate(diagnostic.created_at)}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scores par matière</p>
                                        {Object.entries(diagnostic.scores || {}).map(([subject, score]: any) => (
                                            <div key={subject} className="space-y-1.5">
                                                <div className="flex justify-between text-[11px] font-bold text-[#0D2D5A] uppercase">
                                                    <span>{subject}</span>
                                                    <span className={score >= 7 ? "text-emerald-600" : score >= 5 ? "text-[#F5A623]" : "text-red-500"}>
                                                        {score}/10
                                                    </span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-none overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${score >= 7 ? "bg-emerald-500" : score >= 5 ? "bg-[#F5A623]" : "bg-red-400"}`}
                                                        style={{ width: `${score * 10}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="space-y-6">
                                        {diagnostic.strengths && (
                                            <div className="p-4 bg-emerald-50/50 border border-emerald-100">
                                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <CheckCircle2 className="w-3 h-3" /> Points forts
                                                </p>
                                                <p className="text-xs text-slate-700 leading-relaxed">{diagnostic.strengths}</p>
                                            </div>
                                        )}
                                        {diagnostic.weaknesses && (
                                            <div className="p-4 bg-red-50/50 border border-red-100">
                                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <AlertTriangle className="w-3 h-3" /> Points à travailler
                                                </p>
                                                <p className="text-xs text-slate-700 leading-relaxed">{diagnostic.weaknesses}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <ClipboardCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-[#0D2D5A] mb-2">Aucun diagnostic disponible</h3>
                                <p className="text-sm text-slate-500">Un conseiller pédagogique doit réaliser l'évaluation initiale.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: PLAN ─── */}
                {activeTab === "plan" && (
                    <div className="bg-white border border-slate-100 p-6">
                        {planQuery.isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]/30" /></div>
                        ) : plan ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                    <div>
                                        <h3 className="text-[14px] font-black text-[#0D2D5A] uppercase tracking-widest mb-1">{plan.title}</h3>
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 uppercase tracking-widest border border-emerald-100">Actif</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Début: {formatRobustDate(plan.start_date)}
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {(plan.weeks || []).map((week: any, i: number) => (
                                        <div key={i} className="flex items-start gap-4 p-4 border border-slate-100 hover:bg-slate-50 transition-colors">
                                            <div className={`mt-0.5 w-5 h-5 flex items-center justify-center flex-shrink-0 border-2 ${week.done ? "border-emerald-500 bg-emerald-50" : "border-slate-300 bg-white"}`}>
                                                {week.done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Semaine {i + 1}</p>
                                                <p className="text-[12px] font-bold text-[#0D2D5A] leading-snug">{week.objective}</p>
                                                {week.subjects && week.subjects.length > 0 && (
                                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                                        {week.subjects.map((s: string) => (
                                                            <span key={s} className="text-[8px] font-black uppercase tracking-widest bg-[#1A6CC8]/10 text-[#1A6CC8] px-1.5 py-0.5 border border-[#1A6CC8]/20">{s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <h3 className="text-lg font-black text-[#0D2D5A] mb-2">Aucun plan pédagogique</h3>
                                <p className="text-sm text-slate-500">La stratégie de travail n'a pas encore été définie par le conseiller.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── TAB: HISTORY (données réelles BDN) ─── */}
                {activeTab === "history" && (
                    <div className="bg-white border border-slate-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                            <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#1A6CC8]" />
                                Historique des cours ({completedSessions.length} effectués)
                            </h3>
                        </div>
                        {sessionsQuery.isLoading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]/30" /></div>
                        ) : completedSessions.length > 0 ? (
                            <div className="w-full overflow-x-auto scrollbar-thin">
                                <table className="w-full text-left border-collapse min-w-[500px]">
                                    <thead className="bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <tr>
                                            <th className="px-6 py-3 border-b border-slate-100">Date</th>
                                            <th className="px-6 py-3 border-b border-slate-100">Matière / Tuteur</th>
                                            <th className="px-6 py-3 border-b border-slate-100 text-center">Heure</th>
                                            <th className="px-6 py-3 border-b border-slate-100">Observation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {completedSessions.map((s: any, i: number) => {
                                            const rawDate = s.date || s.session_date || "";
                                            const displayDate = formatRobustDate(rawDate);
                                            return (
                                                <tr key={s.id || i} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase">{displayDate}</td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-[11px] font-black text-[#0D2D5A] uppercase">{s.subject}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold">{s.teacher || s.teacherName || "—"}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center text-[11px] font-black text-[#1A6CC8]">
                                                        {s.time || s.session_time || "—"}
                                                    </td>
                                                    <td className="px-6 py-4 text-[11px] text-slate-500 italic">
                                                        {s.notes || s.reportText || "Aucune observation"}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <FileText className="w-10 h-10 text-slate-100 mb-3" />
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest">Aucun cours effectué</p>
                                <p className="text-[10px] text-slate-200 mt-1">L'historique s'alimentera automatiquement après chaque séance.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
