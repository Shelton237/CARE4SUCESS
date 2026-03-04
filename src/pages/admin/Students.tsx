import { adminFamilies } from "@/data/mock";
import { CalendarDays } from "lucide-react";

export default function AdminStudents() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Élèves & Familles</h1>
                    <p className="text-gray-500 text-sm mt-1">{adminFamilies.length} familles actives</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Famille</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Élève</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Niveau</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Matière</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Enseignant</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Prochain cours</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminFamilies.map((f, i) => (
                                <tr key={f.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                                                {f.parent[0]}
                                            </div>
                                            <span className="font-semibold text-[#0D2D5A]">{f.parent}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-700">{f.child}</td>
                                    <td className="px-6 py-4"><span className="px-2 py-0.5 bg-[#1A6CC8]/10 text-[#1A6CC8] rounded-full text-xs font-bold">{f.level}</span></td>
                                    <td className="px-6 py-4 text-gray-600">{f.subject}</td>
                                    <td className="px-6 py-4 text-gray-700 font-medium">{f.teacher}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                                            <CalendarDays className="w-3.5 h-3.5 text-[#F5A623]" />
                                            {f.nextSession}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${f.status === "actif" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                                            {f.status}
                                        </span>
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
