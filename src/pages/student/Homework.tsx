import { useState } from "react";
import { studentHomework } from "@/data/mock";
import { BookOpen, CheckCircle2, Clock, AlertTriangle, ChevronDown } from "lucide-react";

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; color: string; Icon: typeof Clock }> = {
    haute: { label: "Urgent", bg: "bg-red-50", color: "text-red-500", Icon: AlertTriangle },
    normale: { label: "Normal", bg: "bg-gray-100", color: "text-gray-500", Icon: Clock },
};
const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
    "à faire": { label: "À faire", bg: "bg-[#F5A623]/10", color: "text-[#F5A623]" },
    "rendu": { label: "Rendu ✓", bg: "bg-green-50", color: "text-green-600" },
};

export default function StudentHomework() {
    const [expanded, setExpanded] = useState<string | null>(null);
    const [filter, setFilter] = useState<"tous" | "à faire" | "rendu">("tous");

    const pending = studentHomework.filter((h) => h.status === "à faire");
    const done = studentHomework.filter((h) => h.status === "rendu");
    const visible = filter === "tous" ? studentHomework : studentHomework.filter((h) => h.status === filter);

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes devoirs</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {pending.length} à rendre · {done.length} rendus
                    </p>
                </div>
                <div className="flex gap-2 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                    {(["tous", "à faire", "rendu"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f
                                    ? "bg-[#0D2D5A] text-white shadow-md"
                                    : "text-gray-500 hover:text-[#0D2D5A]"
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats rapides */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F5A623]/10 flex items-center justify-center flex-shrink-0">
                        <Clock className="w-5 h-5 text-[#F5A623]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#0D2D5A]">{pending.length}</div>
                        <div className="text-xs text-gray-400">À rendre</div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#0D2D5A]">{done.length}</div>
                        <div className="text-xs text-gray-400">Rendus</div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                        <div className="text-2xl font-bold text-[#0D2D5A]">
                            {pending.filter((h) => h.priority === "haute").length}
                        </div>
                        <div className="text-xs text-gray-400">Urgents</div>
                    </div>
                </div>
            </div>

            {/* Liste des devoirs */}
            <div className="space-y-3">
                {visible.length === 0 && (
                    <div className="text-center py-12 text-gray-300 text-sm">
                        <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                        Aucun devoir dans cette catégorie
                    </div>
                )}
                {visible.map((hw) => {
                    const pCfg = PRIORITY_CONFIG[hw.priority];
                    const sCfg = STATUS_CONFIG[hw.status];
                    const isExpanded = expanded === hw.id;
                    return (
                        <div
                            key={hw.id}
                            className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition-all ${hw.status === "rendu" ? "opacity-70" : ""
                                }`}
                            style={{ borderColor: hw.color + (hw.status === "à faire" ? "30" : "15") }}
                        >
                            <button
                                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
                                onClick={() => setExpanded(isExpanded ? null : hw.id)}
                            >
                                {/* Couleur matière */}
                                <div
                                    className="w-1 h-12 rounded-full flex-shrink-0"
                                    style={{ background: hw.color }}
                                />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-2">
                                        <div>
                                            <div className="font-bold text-[#0D2D5A] text-sm">{hw.title}</div>
                                            <div className="text-xs text-gray-400 mt-0.5">
                                                {hw.subject} · {hw.teacher}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${pCfg.bg} ${pCfg.color}`}>
                                        <pCfg.Icon className="w-3 h-3" />{pCfg.label}
                                    </span>
                                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sCfg.bg} ${sCfg.color}`}>
                                        {sCfg.label}
                                    </span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">
                                        {hw.dueDateLabel}
                                    </span>
                                </div>
                                <ChevronDown
                                    className={`w-4 h-4 text-gray-300 transition-transform flex-shrink-0 ml-1 ${isExpanded ? "rotate-180" : ""}`}
                                />
                            </button>

                            {isExpanded && (
                                <div className="px-6 pb-5 border-t border-gray-50">
                                    <div className="mt-4 bg-gray-50 rounded-xl p-4">
                                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Consignes</div>
                                        <p className="text-sm text-gray-700 leading-relaxed">{hw.description}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <Clock className="w-3.5 h-3.5" />
                                            À rendre le <strong className="text-[#0D2D5A] ml-1">{hw.dueDateLabel}</strong>
                                        </div>
                                        {hw.status === "à faire" && (
                                            <button
                                                className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg text-white transition-colors"
                                                style={{ background: hw.color }}
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Marquer comme rendu
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
