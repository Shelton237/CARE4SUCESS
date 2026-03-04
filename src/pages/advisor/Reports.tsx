import { advisorFamilies, advisorRequests } from "@/data/mock";
import { ClipboardList, FileText, CheckCircle, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";

// Mock reports data (extended from families)
const REPORTS = advisorFamilies.filter((f) => f.status === "suivi actif").map((f, i) => ({
    id: `rep-${f.id}`,
    child: f.child,
    parent: f.parent,
    level: f.level,
    teacher: f.teacher,
    date: ["10/02/2026", "15/02/2026", "20/02/2026"][i % 3],
    type: ["Bilan mensuel", "Point de mi-parcours", "Fin de trimestre"][i % 3],
    status: i === 0 ? "rédigé" : "en cours",
    summary: `Progression régulière en Mathématiques. L'élève montre une bonne assiduité et des efforts soutenus. La note est passée de 11/20 à ${14 + i}/20 ce mois.`,
}));

const STATUS_COLOR: Record<string, string> = {
    "rédigé": "bg-green-50 text-green-600",
    "en cours": "bg-blue-50 text-blue-600",
    "à rédiger": "bg-[#F5A623]/10 text-[#F5A623]",
};

export default function AdvisorReports() {
    const [expanded, setExpanded] = useState<string | null>(null);

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Bilans pédagogiques</h1>
                    <p className="text-gray-500 text-sm mt-1">{REPORTS.length} bilans rédigés ce mois · {advisorRequests.filter((r) => r.status === "reçu").length} demandes à traiter</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#a855f7] hover:bg-[#9333ea] transition-colors shadow-md">
                    <FileText className="w-4 h-4" />
                    Nouveau bilan
                </button>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Bilans rédigés", value: REPORTS.filter((r) => r.status === "rédigé").length, icon: CheckCircle, color: "#22c55e" },
                    { label: "En cours", value: REPORTS.filter((r) => r.status === "en cours").length, icon: Clock, color: "#1A6CC8" },
                    { label: "À rédiger", value: advisorRequests.filter((r) => r.status === "assigné").length, icon: ClipboardList, color: "#F5A623" },
                ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: s.color + "15" }}>
                            <s.icon className="w-5 h-5" style={{ color: s.color }} />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-[#0D2D5A]">{s.value}</div>
                            <div className="text-xs text-gray-400">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Liste bilans */}
            <div className="space-y-3">
                {REPORTS.map((r) => (
                    <div key={r.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <button
                            className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        >
                            <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 flex items-center justify-center text-sm font-bold text-[#a855f7] flex-shrink-0">
                                {r.child[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-[#0D2D5A]">{r.child}</div>
                                <div className="text-xs text-gray-400 mt-0.5">{r.level} · {r.type} · {r.date}</div>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_COLOR[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                                {r.status}
                            </span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded === r.id ? "rotate-180" : ""}`} />
                        </button>

                        {expanded === r.id && (
                            <div className="px-6 pb-5 border-t border-gray-50">
                                <div className="grid sm:grid-cols-3 gap-4 mt-4 mb-4">
                                    <div>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parent</div>
                                        <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{r.parent}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enseignant</div>
                                        <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{r.teacher}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type de bilan</div>
                                        <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{r.type}</div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Synthèse</div>
                                    <p className="text-sm text-gray-700 leading-relaxed">{r.summary}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-4">
                                    <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#a855f7] text-white hover:bg-[#9333ea] transition-colors">
                                        <FileText className="w-3.5 h-3.5" />
                                        {r.status === "rédigé" ? "Modifier le bilan" : "Continuer la rédaction"}
                                    </button>
                                    {r.status === "rédigé" && (
                                        <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                                            Envoyer au parent
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Demandes en attente de bilan */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                        <ClipboardList className="w-4 h-4 text-[#F5A623]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Demandes de bilan à traiter</h2>
                        <p className="text-xs text-gray-400">{advisorRequests.filter((r) => r.status !== "clôturé").length} demandes actives</p>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {advisorRequests.filter((r) => r.status !== "clôturé").map((r) => (
                        <div key={r.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/40 transition-colors">
                            <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                                {r.child[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#0D2D5A] text-sm">{r.child}</div>
                                <div className="text-xs text-gray-400">{r.level} · {r.subject} · {r.date}</div>
                            </div>
                            <div className="text-xs text-gray-400">{r.phone}</div>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap
                                ${r.status === "reçu" ? "bg-yellow-50 text-yellow-600" :
                                    r.status === "en traitement" ? "bg-blue-50 text-blue-600" :
                                        "bg-green-50 text-green-600"}`}>
                                {r.status}
                            </span>
                            <button className="text-xs font-medium text-[#a855f7] hover:underline whitespace-nowrap">
                                Traiter
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
