import { studentSchedule, studentStats } from "@/data/mock";
import { CalendarDays, MapPin, GraduationCap, CheckCircle2, Clock, Circle } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
    "effectué": { label: "Effectué", color: "text-gray-400", bg: "bg-gray-100", Icon: CheckCircle2 },
    "à venir": { label: "À venir", color: "text-[#1A6CC8]", bg: "bg-blue-50", Icon: Clock },
    "planifié": { label: "Planifié", color: "text-gray-400", bg: "bg-gray-50", Icon: Circle },
};

const DAYS_OF_WEEK = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function StudentSchedule() {
    const sessionsByDay = DAYS_OF_WEEK.map((day) => ({
        day,
        sessions: studentSchedule.filter((s) => s.day === day),
    }));

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon planning</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Semaine du 2 au 8 mars 2026 · {studentStats.subject} avec {studentStats.teacher}
                    </p>
                </div>
                <div className="flex gap-2">
                    {Object.entries(STATUS_CONFIG).map(([key, { label, color, bg }]) => (
                        <span key={key} className={`text-xs font-bold px-2.5 py-1 rounded-full ${bg} ${color}`}>{label}</span>
                    ))}
                </div>
            </div>

            {/* Vue semaine */}
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
                {sessionsByDay.map(({ day, sessions }) => (
                    <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div
                            className={`px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${sessions.length > 0 ? "bg-[#22c55e] text-white" : "bg-gray-50 text-gray-400"
                                }`}
                        >
                            {day.slice(0, 3)}
                        </div>
                        <div className="p-3 min-h-[100px] space-y-2">
                            {sessions.map((s) => {
                                const cfg = STATUS_CONFIG[s.status];
                                return (
                                    <div
                                        key={s.id}
                                        className="rounded-xl p-2.5 border"
                                        style={{
                                            background: s.status === "à venir" ? "#1A6CC8" + "10" : "#f9fafb",
                                            borderColor: s.status === "à venir" ? "#1A6CC820" : "#f3f4f6",
                                        }}
                                    >
                                        <div className={`text-xs font-bold ${s.status === "à venir" ? "text-[#1A6CC8]" : "text-gray-400"}`}>
                                            {s.time.split("–")[0]}
                                        </div>
                                        <div className="text-xs font-semibold text-[#0D2D5A] mt-0.5 truncate">{s.subject}</div>
                                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                                            <MapPin className="w-2.5 h-2.5" />{s.location}
                                        </div>
                                        <span className={`mt-1.5 inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.color}`}>
                                            <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
                                        </span>
                                    </div>
                                );
                            })}
                            {sessions.length === 0 && (
                                <div className="flex items-center justify-center h-16 text-gray-200 text-xs">Libre</div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Liste complète */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <h2 className="font-bold text-[#0D2D5A] text-sm">
                        Tous mes cours planifiés
                    </h2>
                    <span className="ml-auto text-xs text-gray-400">{studentSchedule.length} séances</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {studentSchedule.map((s) => {
                        const cfg = STATUS_CONFIG[s.status];
                        return (
                            <div key={s.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-14 text-center flex-shrink-0">
                                    <div className="text-xs font-bold text-[#1A6CC8]">{s.day.slice(0, 3).toUpperCase()}</div>
                                    <div className="text-2xl font-bold text-[#0D2D5A]">{s.date.split("/")[0]}</div>
                                    <div className="text-xs text-gray-400">/{s.date.split("/")[1]}</div>
                                </div>
                                <div className="w-px h-12 bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A]">{s.subject}</div>
                                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <GraduationCap className="w-3 h-3" />{s.teacher}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <MapPin className="w-3 h-3" />{s.location}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <div className="text-sm font-semibold text-[#0D2D5A]">{s.time}</div>
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full mt-1 ${cfg.bg} ${cfg.color}`}>
                                        <cfg.Icon className="w-3 h-3" />{cfg.label}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
