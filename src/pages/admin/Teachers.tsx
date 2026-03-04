import { Star, CheckCircle, XCircle, MapPin } from "lucide-react";
import { adminTeachers } from "@/data/mock";

export default function AdminTeachers() {
    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Enseignants</h1>
                    <p className="text-gray-500 text-sm mt-1">{adminTeachers.length} enseignants enregistrés</p>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#1A6CC8] hover:bg-[#0D2D5A] transition-colors shadow-md">
                    + Ajouter un enseignant
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Enseignant</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Matières</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Niveaux</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Note</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Élèves</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Ville</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Statut</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {adminTeachers.map((t, i) => (
                                <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/15 flex items-center justify-center text-xs font-bold text-[#1A6CC8]">
                                                {t.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                                            </div>
                                            <span className="font-semibold text-[#0D2D5A]">{t.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{t.subjects.join(", ")}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">{t.level}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                                            <span className="font-bold text-[#0D2D5A]">{t.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-semibold text-[#1A6CC8]">{t.students}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1 text-gray-500 text-xs">
                                            <MapPin className="w-3 h-3" />{t.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${t.status === "actif" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                                            {t.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-xs text-[#1A6CC8] hover:underline font-medium">Voir</button>
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
