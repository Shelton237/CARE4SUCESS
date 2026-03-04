import { teacherStudents } from "@/data/mock";
import { Star } from "lucide-react";

export default function TeacherStudents() {
    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes élèves</h1>
                <p className="text-gray-500 text-sm mt-1">{teacherStudents.length} élèves actifs</p>
            </div>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                {teacherStudents.map((e) => (
                    <div key={e.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-lg font-bold text-[#1A6CC8]">{e.name[0]}</div>
                            <div>
                                <div className="font-bold text-[#0D2D5A]">{e.name}</div>
                                <div className="text-xs text-gray-400">{e.level} · {e.subject}</div>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-lg font-bold text-[#1A6CC8]">{e.sessions}</div>
                                <div className="text-xs text-gray-400">Séances</div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-lg font-bold text-[#0D2D5A]">{e.avgGrade}<span className="text-xs text-gray-400">/20</span></div>
                                <div className="text-xs text-gray-400">Moyenne</div>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3">
                                <div className="text-lg font-bold text-green-600">{e.trend}</div>
                                <div className="text-xs text-gray-400">Progrès</div>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-gray-400 text-right">Dernière séance : {e.lastSession}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
