import { parentSchedule } from "@/data/mock";
import { CalendarDays, MapPin, GraduationCap } from "lucide-react";

const WEEK_SESSIONS = [
    { day: "Lundi 02/03", sessions: parentSchedule.filter((s) => s.day === "Lundi") },
    { day: "Mardi 03/03", sessions: [] },
    { day: "Mercredi 05/03", sessions: parentSchedule.filter((s) => s.day === "Mercredi" && s.date === "05/03") },
    { day: "Jeudi 06/03", sessions: [] },
    { day: "Vendredi 07/03", sessions: [] },
    { day: "Samedi 08/03", sessions: [] },
];

const STATUS_COLORS: Record<string, string> = {
    "effectué": "bg-gray-100 text-gray-500 border-gray-200",
    "à venir": "bg-blue-50 text-blue-600 border-blue-200",
    "planifié": "bg-gray-50 text-gray-400 border-gray-100",
};

export default function ParentSchedule() {
    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Planning des cours</h1>
                    <p className="text-gray-500 text-sm mt-1">Semaine du 2 au 8 mars 2026 — Koffi Diallo</p>
                </div>
                <div className="flex gap-2">
                    {["effectué", "à venir", "planifié"].map((s) => (
                        <span key={s} className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[s]}`}>{s}</span>
                    ))}
                </div>
            </div>

            {/* Calendar week view */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
                {WEEK_SESSIONS.map(({ day, sessions }) => (
                    <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className={`px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${sessions.length > 0 ? "bg-[#22c55e] text-white" : "bg-gray-50 text-gray-400"}`}>
                            {day.split(" ")[0].slice(0, 3)}
                            <div className="text-xs font-normal opacity-80 mt-0.5 normal-case">{day.split(" ")[1]}</div>
                        </div>
                        <div className="p-3 min-h-[100px] space-y-2">
                            {sessions.map((s) => (
                                <div key={s.id} className="bg-[#22c55e]/8 border border-[#22c55e]/20 rounded-xl p-2.5">
                                    <div className="text-xs font-bold text-[#22c55e]">{s.time}</div>
                                    <div className="text-xs font-semibold text-[#0D2D5A] mt-0.5">{s.subject}</div>
                                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                        <MapPin className="w-2.5 h-2.5" />{s.location}
                                    </div>
                                    <span className={`mt-1.5 inline-block text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="flex items-center justify-center h-16 text-gray-200 text-xs">Libre</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* All upcoming sessions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    <h2 className="font-bold text-[#0D2D5A] text-sm">Tous les cours planifiés</h2>
                </div>
                <div className="divide-y divide-gray-50">
                    {parentSchedule.map((s) => (
                        <div key={s.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="w-12 text-center flex-shrink-0">
                                <div className="text-xs font-bold text-[#1A6CC8]">{s.day.slice(0, 3).toUpperCase()}</div>
                                <div className="text-lg font-bold text-[#0D2D5A]">{s.date.split("/")[0]}</div>
                            </div>
                            <div className="w-px h-10 bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#0D2D5A] text-sm">{s.subject}</div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <GraduationCap className="w-3 h-3" />{s.teacher}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />{s.location}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-semibold text-[#0D2D5A]">{s.time}</div>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
