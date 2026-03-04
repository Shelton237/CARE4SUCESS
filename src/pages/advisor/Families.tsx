import { advisorFamilies } from "@/data/mock";
import { Users, CalendarDays, GraduationCap, ChevronRight } from "lucide-react";

const STATUS_COLOR: Record<string, string> = {
    "suivi actif": "bg-green-50 text-green-600",
    "matching": "bg-blue-50 text-blue-600",
    "bilan planifié": "bg-[#F5A623]/10 text-[#F5A623]",
    "nouveau": "bg-purple-50 text-purple-600",
};

export default function AdvisorFamilies() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes familles</h1>
                    <p className="text-gray-500 text-sm mt-1">{advisorFamilies.length} familles assignées à votre portefeuille</p>
                </div>
                <div className="flex gap-2">
                    {Object.entries(STATUS_COLOR).map(([label, cls]) => (
                        <span key={label} className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{label}</span>
                    ))}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4">
                {advisorFamilies.map((f) => (
                    <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#a855f7]/20 transition-all p-5 flex items-start gap-4 group cursor-pointer">
                        <div className="w-12 h-12 rounded-2xl bg-[#a855f7]/10 flex items-center justify-center text-lg font-bold text-[#a855f7] flex-shrink-0">
                            {f.child[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <div className="font-bold text-[#0D2D5A]">{f.child}</div>
                                    <div className="text-xs text-gray-400 mt-0.5">{f.level}</div>
                                </div>
                                <span className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap flex-shrink-0 ${STATUS_COLOR[f.status] ?? "bg-gray-100 text-gray-500"}`}>
                                    {f.status}
                                </span>
                            </div>
                            <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Users className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="font-medium text-gray-600">Parent :</span> {f.parent}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <GraduationCap className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="font-medium text-gray-600">Enseignant :</span>
                                    {f.teacher !== "—" ? f.teacher : (
                                        <span className="text-[#F5A623] font-semibold">À assigner</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <CalendarDays className="w-3.5 h-3.5 text-gray-300" />
                                    <span className="font-medium text-gray-600">Prochain RDV :</span>
                                    {f.nextRdv !== "—" ? f.nextRdv : <span className="text-gray-400">Non planifié</span>}
                                </div>
                            </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-200 group-hover:text-[#a855f7] transition-colors mt-1 flex-shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
}
