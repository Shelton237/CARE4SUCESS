import { teacherEarnings, teacherStats, formatFCFA } from "@/data/mock";
import { CheckCircle, Clock } from "lucide-react";

export default function TeacherEarnings() {
    const total = teacherEarnings.reduce((s, e) => s + e.amount, 0);
    const paid = teacherEarnings.filter((e) => e.status === "payé").reduce((s, e) => s + e.amount, 0);
    return (
        <div className="p-8 space-y-6">
            <div><h1 className="text-2xl font-bold text-[#0D2D5A]">Mes revenus</h1><p className="text-gray-500 text-sm mt-1">Février – Mars 2026</p></div>
            <div className="grid grid-cols-3 gap-5">
                {[
                    { label: "Total facturé", value: formatFCFA(total), bg: "bg-[#1A6CC8]" },
                    { label: "Total reçu", value: formatFCFA(paid), bg: "bg-green-600" },
                    { label: "En attente", value: formatFCFA(total - paid), bg: "bg-[#F5A623]" },
                ].map(({ label, value, bg }) => (
                    <div key={label} className={`${bg} text-white rounded-2xl p-6`}>
                        <div className="text-2xl font-bold">{value}</div>
                        <div className="text-sm opacity-80 mt-1">{label}</div>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-sm">
                    <thead><tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-6 py-4 font-semibold text-gray-600">Date</th>
                        <th className="text-left px-6 py-4 font-semibold text-gray-600">Élève</th>
                        <th className="text-center px-6 py-4 font-semibold text-gray-600">Durée</th>
                        <th className="text-center px-6 py-4 font-semibold text-gray-600">Tarif/h</th>
                        <th className="text-right px-6 py-4 font-semibold text-gray-600">Montant</th>
                        <th className="text-center px-6 py-4 font-semibold text-gray-600">Statut</th>
                    </tr></thead>
                    <tbody>
                        {teacherEarnings.map((e, i) => (
                            <tr key={e.id} className={`border-b border-gray-50 hover:bg-gray-50/50 ${i % 2 === 1 ? "bg-gray-50/30" : ""}`}>
                                <td className="px-6 py-4 text-gray-500">{e.date}</td>
                                <td className="px-6 py-4 font-semibold text-[#0D2D5A]">{e.student}</td>
                                <td className="px-6 py-4 text-center text-gray-600">{e.hours}h</td>
                                <td className="px-6 py-4 text-center text-gray-600">{formatFCFA(e.rate)}</td>
                                <td className="px-6 py-4 text-right font-bold text-[#0D2D5A]">{formatFCFA(e.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full ${e.status === "payé" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"}`}>
                                        {e.status === "payé" ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                        {e.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
