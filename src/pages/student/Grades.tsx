import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchStudentGrades, fetchStudentProgress } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Award, ChevronDown } from "lucide-react";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const noteColor = (n: number) =>
    n >= 14 ? "#22c55e" : n >= 10 ? "#F5A623" : "#ef4444";

export default function StudentGrades() {
    const { user } = useAuth();
    const [expanded, setExpanded] = useState<string | null>(null);

    const gradesQuery = useQuery({
        queryKey: ["studentGrades", user?.id],
        queryFn: () => fetchStudentGrades(user!.id),
        enabled: Boolean(user?.id),
    });

    const progressQuery = useQuery({
        queryKey: ["studentProgress", user?.id],
        queryFn: () => fetchStudentProgress(user!.id),
        enabled: Boolean(user?.id),
    });

    const studentGrades = gradesQuery.data ?? [];
    const studentProgressData = progressQuery.data ?? [];

    const radarData = studentGrades.map((g: any) => ({
        subject: (g.subject || "").slice(0, 4),
        note: g.avg,
        max: 20
    }));

    // Moyenne pondérée calculée dynamiquement
    const weightedAvg = (() => {
        if (!studentGrades.length) return "0.00";
        const total = studentGrades.reduce((acc: number, g: any) => acc + (g.avg || 0) * (g.coefficient || 1), 0);
        const coefs = studentGrades.reduce((acc: number, g: any) => acc + (g.coefficient || 1), 0);
        return coefs ? (total / coefs).toFixed(2) : "0.00";
    })();

    if (!user) {
        return <div className="p-8 text-sm text-gray-500 text-center">Veuillez vous connecter pour accéder à vos notes.</div>;
    }

    if (gradesQuery.isLoading || progressQuery.isLoading) {
        return <div className="p-8 text-sm text-gray-400 text-center">Récupération de vos notes en cours...</div>;
    }

    if (gradesQuery.isError || progressQuery.isError) {
        return <div className="p-8 text-sm text-red-500 text-center">Erreur lors du chargement des notes.</div>;
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes notes</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Moyenne générale pondérée :{" "}
                    <span className="font-bold text-[#22c55e] text-base">{weightedAvg}/20</span>
                    {" "}· Année Scolaire 2025/2026
                </p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Graphe évolution multi-matières */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-5">Évolution des notes — Oct à Mars</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <LineChart data={studentProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: number) => [`${v}/20`]} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={2.5} dot={{ r: 4, fill: "#1A6CC8" }} activeDot={{ r: 6 }} />
                            <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="anglais" name="Anglais" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="histgeo" name="Hist-Géo" stroke="#a855f7" strokeWidth={2} dot={{ r: 3 }} />
                            <Line type="monotone" dataKey="svt" name="SVT" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Radar profil */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-2">Profil académique</h2>
                    <ResponsiveContainer width="100%" height={230}>
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#f0f0f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Radar name="Moyenne" dataKey="note" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <Award className="w-4 h-4 text-[#F5A623]" />
                        <span className="text-xs font-semibold text-gray-500">Moyenne pondérée : <strong className="text-[#22c55e]">{weightedAvg}/20</strong></span>
                    </div>
                </div>
            </div>

            {/* Détail par matière */}
            <div className="space-y-3">
                {studentGrades.map((g: any) => (
                    <div key={g.subject} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                            onClick={() => setExpanded(expanded === g.subject ? null : g.subject)}
                        >
                            <div
                                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
                                style={{ background: (g.color || "#ccc") }}
                            >
                                {(g.subject || "??").slice(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[#0D2D5A]">{g.subject}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{g.teacher} · Coeff. {g.coefficient}</div>
                            </div>

                            {/* Mini bar chart progression */}
                            <div className="hidden sm:flex items-end gap-0.5 h-8 w-20">
                                {g.history?.map((h: any, i: number) => (
                                    <div
                                        key={i}
                                        className="flex-1 rounded-sm transition-all"
                                        style={{
                                            height: `${(h.note / 20) * 100}%`,
                                            background: i === g.history.length - 1 ? g.color : (g.color + "40"),
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="text-right flex-shrink-0 ml-2">
                                <div className="text-xl font-bold" style={{ color: noteColor(g.avg) }}>
                                    {g.avg}/20
                                </div>
                                <div className="text-xs font-bold" style={{ color: "#22c55e" }}>{g.trend}</div>
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ml-1 ${expanded === g.subject ? "rotate-180" : ""}`}
                            />
                        </button>

                        {expanded === g.subject && (
                            <div className="px-6 pb-5 border-t border-gray-50">
                                <div className="mt-4">
                                    <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Détail des évaluations</div>
                                    <div className="space-y-2">
                                        {g.exams?.map((ex: any) => (
                                            <div key={ex.label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                                                <div className="flex-1">
                                                    <div className="text-sm font-semibold text-[#0D2D5A]">{ex.label}</div>
                                                    <div className="text-xs text-gray-400">{ex.date}</div>
                                                </div>
                                                <div className="text-right">
                                                    <span
                                                        className="text-lg font-bold"
                                                        style={{ color: noteColor(ex.note) }}
                                                    >
                                                        {ex.note}
                                                    </span>
                                                    <span className="text-xs text-gray-400">/{ex.max}</span>
                                                </div>
                                                <div className="w-24 bg-gray-100 rounded-full h-2">
                                                    <div
                                                        className="h-2 rounded-full"
                                                        style={{
                                                            width: `${(ex.note / ex.max) * 100}%`,
                                                            background: noteColor(ex.note),
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
