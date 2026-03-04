import { adminRequests } from "@/data/mock";
import { Phone } from "lucide-react";

const STATUSES = ["reçu", "en traitement", "assigné", "clôturé"] as const;
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
    "reçu": { bg: "bg-yellow-50", text: "text-yellow-700" },
    "en traitement": { bg: "bg-blue-50", text: "text-blue-700" },
    "assigné": { bg: "bg-green-50", text: "text-green-700" },
    "clôturé": { bg: "bg-gray-100", text: "text-gray-500" },
};

export default function AdminRequests() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Demandes de bilan</h1>
                <p className="text-gray-500 text-sm mt-1">Suivi du pipeline de demandes de bilan gratuit</p>
            </div>

            {/* Kanban */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                {STATUSES.map((status) => {
                    const items = adminRequests.filter((r) => r.status === status);
                    const col = STATUS_COLORS[status];
                    return (
                        <div key={status} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className={`px-4 py-3 flex items-center justify-between border-b border-gray-100`}>
                                <span className={`text-xs font-bold uppercase tracking-wider ${col.text}`}>{status}</span>
                                <span className={`${col.bg} ${col.text} text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`}>{items.length}</span>
                            </div>
                            <div className="p-3 space-y-3 min-h-[200px]">
                                {items.map((r) => (
                                    <div key={r.id} className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                                        <div className="font-semibold text-[#0D2D5A] text-sm">{r.child}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{r.level} · {r.subject}</div>
                                        <div className="text-xs text-gray-400 mt-1 border-t border-gray-100 pt-2">{r.parent}</div>
                                        <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-[#1A6CC8] text-xs mt-1 hover:underline font-medium">
                                            <Phone className="w-3 h-3" />{r.phone}
                                        </a>
                                        <div className="text-xs text-gray-300 mt-2">{r.date}</div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="flex items-center justify-center h-24 text-gray-300 text-xs">Aucune demande</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
