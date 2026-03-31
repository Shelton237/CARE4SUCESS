import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";

export default function AdminStudents() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["advisorFamilies"],
    queryFn: fetchAdvisorFamilies,
  });

  const families = useMemo(() => data ?? [], [data]);

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between text-sm text-red-700">
          <span>Impossible de charger les familles depuis la base.</span>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2D5A]">Élèves & Familles</h1>
          <p className="text-gray-500 text-sm mt-1">{families.length} familles actives recensées</p>
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
              {families.map((family, index) => (
                <tr key={family.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index % 2 !== 0 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                        {family.parent?.[0] ?? "?"}
                      </div>
                      <span className="font-semibold text-[#0D2D5A]">{family.parent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">{family.child}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-[#1A6CC8]/10 text-[#1A6CC8] rounded-full text-xs font-bold">{family.level}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{family.subject || "—"}</td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{family.teacher || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <CalendarDays className="w-3.5 h-3.5 text-[#F5A623]" />
                      {family.nextRdv || "À planifier"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        family.status === "suivi actif"
                          ? "bg-green-50 text-green-600"
                          : family.status === "matching"
                          ? "bg-blue-50 text-blue-600"
                          : family.status === "bilan planifié"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {family.status}
                    </span>
                  </td>
                </tr>
              ))}
              {families.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucune famille n&apos;est encore suivie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
