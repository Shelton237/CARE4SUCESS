import { teacherSchedule } from "@/data/mock";
const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function TeacherSchedule() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon planning</h1>
                <p className="text-gray-500 text-sm mt-1">Semaine du 3 au 8 mars 2026</p>
            </div>
            <div className="grid grid-cols-3 xl:grid-cols-6 gap-4">
                {DAYS.map((day) => {
                    const sessions = teacherSchedule.filter((s) => s.day === day);
                    return (
                        <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${sessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-gray-50 text-gray-400"}`}>
                                {day.slice(0, 3)}
                            </div>
                            <div className="p-3 space-y-2 min-h-[120px]">
                                {sessions.map((s) => (
                                    <div key={s.id} className="bg-[#1A6CC8]/8 border border-[#1A6CC8]/20 rounded-lg p-2">
                                        <div className="text-xs font-bold text-[#1A6CC8]">{s.time}</div>
                                        <div className="text-xs font-semibold text-[#0D2D5A] mt-0.5">{s.student}</div>
                                        <div className="text-xs text-gray-400">{s.subject}</div>
                                        <div className="text-xs text-gray-300 mt-1">{s.location}</div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="flex items-center justify-center h-16 text-gray-200 text-xs">Libre</div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
