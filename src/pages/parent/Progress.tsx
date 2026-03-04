import { parentProgressData, parentStats, teacherStudents, formatFCFA } from "@/data/mock";
import { TrendingUp, Star, BookOpen, Award } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import {
    LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
    RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from "recharts";

const subjectData = [
    { subject: "Maths", A: 14.5, fullMark: 20 },
    { subject: "Français", A: 14, fullMark: 20 },
    { subject: "Anglais", A: 15, fullMark: 20 },
    { subject: "SVT", A: 12, fullMark: 20 },
    { subject: "Histoire", A: 13, fullMark: 20 },
    { subject: "Physique", A: 11, fullMark: 20 },
];

export default function ParentProgress() {
    const avgTrend = Math.round(((parentStats.currentAvg - parentStats.previousAvg) / parentStats.previousAvg) * 100);
    const koffi = teacherStudents[0];

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Progression scolaire</h1>
                <p className="text-gray-500 text-sm mt-1">Suivi détaillé de {parentStats.child} — {parentStats.level}</p>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                <StatCard label="Moyenne générale" value={`${parentStats.currentAvg}/20`} icon={TrendingUp} accentColor="#22c55e" trend={avgTrend} description="vs mois précédent" />
                <StatCard label="Séances effectuées" value={koffi.sessions} icon={BookOpen} accentColor="#1A6CC8" description="depuis le début" />
                <StatCard label="Note du mois" value={`${parentStats.currentAvg}/20`} icon={Star} accentColor="#F5A623" description="Mathématiques" />
                <StatCard label="Progression globale" value="+3,5 pts" icon={Award} accentColor="#a855f7" description="depuis Oct. 2025" />
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Graphe évolution */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-6">Évolution des notes par matière</h2>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={parentProgressData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 20]} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(v: number) => [`${v}/20`]} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Line type="monotone" dataKey="maths" name="Maths" stroke="#1A6CC8" strokeWidth={2.5} dot={{ r: 5, fill: "#1A6CC8" }} activeDot={{ r: 7 }} />
                            <Line type="monotone" dataKey="francais" name="Français" stroke="#F5A623" strokeWidth={2.5} dot={{ r: 5, fill: "#F5A623" }} activeDot={{ r: 7 }} />
                            <Line type="monotone" dataKey="anglais" name="Anglais" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 5, fill: "#22c55e" }} activeDot={{ r: 7 }} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Radar par matière */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h2 className="text-base font-bold text-[#0D2D5A] mb-4">Profil de compétences</h2>
                    <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={subjectData}>
                            <PolarGrid stroke="#f0f0f0" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                            <Radar name="Notes" dataKey="A" stroke="#1A6CC8" fill="#1A6CC8" fillOpacity={0.2} strokeWidth={2} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Tableau de notes */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="font-bold text-[#0D2D5A] text-sm">Détail des matières</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Matière</th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Note actuelle</th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Progression</th>
                                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Barre de niveau</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subjectData.map((s, i) => (
                                <tr key={s.subject} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4 font-medium text-[#0D2D5A]">{s.subject}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`font-bold text-lg ${s.A >= 14 ? "text-[#22c55e]" : s.A >= 10 ? "text-[#F5A623]" : "text-red-500"}`}>{s.A}/20</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="text-xs font-bold text-[#22c55e] bg-green-50 px-2 py-1 rounded-full">↑ +2 pts</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full transition-all"
                                                style={{
                                                    width: `${(s.A / 20) * 100}%`,
                                                    background: s.A >= 14 ? "#22c55e" : s.A >= 10 ? "#F5A623" : "#ef4444",
                                                }}
                                            />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
