import { useState } from "react";
import { advisorMatchingQueue } from "@/data/mock";
import { GitMerge, Star, Check, AlertCircle } from "lucide-react";

export default function AdvisorMatching() {
    const [selected, setSelected] = useState<Record<string, string | null>>({});

    const handleSelect = (matchId: string, teacherName: string) => {
        setSelected((prev) => ({
            ...prev,
            [matchId]: prev[matchId] === teacherName ? null : teacherName,
        }));
    };

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Matching enseignant ↔ élève</h1>
                <p className="text-gray-500 text-sm mt-1">{advisorMatchingQueue.length} élèves en attente d'un enseignant</p>
            </div>

            <div className="space-y-6">
                {advisorMatchingQueue.map((match) => (
                    <div key={match.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Élève header */}
                        <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#0D2D5A]/3 to-transparent">
                            <div className="w-12 h-12 rounded-2xl bg-[#1A6CC8]/10 flex items-center justify-center text-xl font-bold text-[#1A6CC8] flex-shrink-0">
                                {match.child[0]}
                            </div>
                            <div className="flex-1">
                                <div className="font-bold text-[#0D2D5A] text-base">{match.child}</div>
                                <div className="text-sm text-gray-500">{match.level} · {match.subject}</div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {match.needs.map((n) => (
                                        <span key={n} className="text-xs bg-[#1A6CC8]/10 text-[#1A6CC8] px-2.5 py-0.5 rounded-full font-medium">{n}</span>
                                    ))}
                                    <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">{match.schedule}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {selected[match.id] ? (
                                    <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
                                        <Check className="w-4 h-4 text-green-600" />
                                        <span className="text-sm font-bold text-green-700">{selected[match.id]}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-[#F5A623]/10 border border-[#F5A623]/20 rounded-xl px-4 py-2">
                                        <AlertCircle className="w-4 h-4 text-[#F5A623]" />
                                        <span className="text-sm font-bold text-[#F5A623]">En attente</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Candidats */}
                        <div className="p-6">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                                Enseignants compatibles ({match.candidates.length})
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-3">
                                {match.candidates.map((c) => {
                                    const isSelected = selected[match.id] === c.name;
                                    return (
                                        <div
                                            key={c.name}
                                            onClick={() => c.available && handleSelect(match.id, c.name)}
                                            className={`relative rounded-xl border p-4 transition-all ${!c.available ? "opacity-50 border-gray-100 bg-gray-50 cursor-not-allowed" :
                                                    isSelected ? "border-[#a855f7] bg-[#a855f7]/5 cursor-pointer shadow-sm" :
                                                        "border-gray-100 hover:border-[#a855f7]/30 hover:bg-[#a855f7]/3 cursor-pointer"
                                                }`}
                                        >
                                            {isSelected && (
                                                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#a855f7] flex items-center justify-center">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${isSelected ? "bg-[#a855f7] text-white" : "bg-[#0D2D5A]/10 text-[#0D2D5A]"}`}>
                                                    {c.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-[#0D2D5A] text-sm">{c.name}</div>
                                                    <div className="flex items-center gap-1 mt-0.5">
                                                        <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                                                        <span className="text-xs font-bold text-gray-600">{c.rating}</span>
                                                        <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-full ${c.available ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                                            {c.available ? "Disponible" : "Indisponible"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selected[match.id] && (
                                <div className="mt-4 flex justify-end">
                                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#a855f7] hover:bg-[#9333ea] transition-colors shadow-md">
                                        <GitMerge className="w-4 h-4" />
                                        Confirmer le matching
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
