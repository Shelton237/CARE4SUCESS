import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdvisorFamilies, fetchRequests } from "@/api/backoffice";
import { ClipboardList, FileText, CheckCircle, Clock, ChevronDown, Loader2, RefreshCw } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  "rédigé": "bg-green-50 text-green-600",
  "en cours": "bg-blue-50 text-blue-600",
  "à rédiger": "bg-[#F5A623]/10 text-[#F5A623]",
};

const REPORT_TYPES = ["Bilan mensuel", "Point de mi-parcours", "Fin de trimestre"];

const mapFamilyStatusToReport = (status: string) => {
  switch (status) {
    case "suivi actif":
      return "rédigé";
    case "matching":
      return "en cours";
    default:
      return "à rédiger";
  }
};

export default function AdvisorReports() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const familiesQuery = useQuery({
    queryKey: ["advisorFamilies"],
    queryFn: fetchAdvisorFamilies,
  });

  const requestsQuery = useQuery({
    queryKey: ["requests"],
    queryFn: fetchRequests,
  });

  const loading = familiesQuery.isLoading || requestsQuery.isLoading;
  const errored = familiesQuery.isError || requestsQuery.isError;

  const reports = useMemo(() => {
    const families = familiesQuery.data ?? [];
    return families.map((family, index) => {
      const type = REPORT_TYPES[index % REPORT_TYPES.length];
      const reportStatus = mapFamilyStatusToReport(family.status);
      const subject = family.subject ?? "les objectifs pédagogiques";
      const summary = `${family.child} progresse sur ${subject}. La famille ${family.parent} dispose d'un suivi ${family.status}.`;
      return {
        id: `report-${family.id}`,
        child: family.child,
        parent: family.parent,
        level: family.level,
        teacher: family.teacher || "À confirmer",
        date: family.nextRdv || "Planification en cours",
        type,
        status: reportStatus,
        summary,
      };
    });
  }, [familiesQuery.data]);

  const advisorRequests = useMemo(() => requestsQuery.data ?? [], [requestsQuery.data]);

  const treatedReports = reports.filter((r) => r.status === "rédigé").length;
  const ongoingReports = reports.filter((r) => r.status === "en cours").length;
  const pendingReports = reports.filter((r) => r.status === "à rédiger").length;

  const activeRequests = advisorRequests.filter((r) => r.status !== "clôturé");
  const awaitingIntake = advisorRequests.filter((r) => r.status === "reçu").length;
  const assignedCount = advisorRequests.filter((r) => r.status === "assigné").length;

  if (loading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
      </div>
    );
  }

  if (errored) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 text-sm text-red-700 flex items-center justify-between">
          <span>Impossible de charger les données conseillers.</span>
          <button
            onClick={() => {
              familiesQuery.refetch();
              requestsQuery.refetch();
            }}
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
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2D5A]">Bilans pédagogiques</h1>
          <p className="text-gray-500 text-sm mt-1">
            {reports.length} bilans créés · {awaitingIntake} demandes à qualifier
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#a855f7] hover:bg-[#9333ea] transition-colors shadow-md">
          <FileText className="w-4 h-4" />
          Nouveau bilan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Bilans rédigés", value: treatedReports, icon: CheckCircle, color: "#22c55e" },
          { label: "En cours", value: ongoingReports, icon: Clock, color: "#1A6CC8" },
          { label: "À rédiger", value: pendingReports + assignedCount, icon: ClipboardList, color: "#F5A623" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${stat.color}20` }}>
              <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
            </div>
            <div>
              <div className="text-2xl font-bold text-[#0D2D5A]">{stat.value}</div>
              <div className="text-xs text-gray-400">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <button
              className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-gray-50/50 transition-colors"
              onClick={() => setExpanded(expanded === report.id ? null : report.id)}
            >
              <div className="w-10 h-10 rounded-xl bg-[#a855f7]/10 flex items-center justify-center text-sm font-bold text-[#a855f7] flex-shrink-0">
                {report.child?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-[#0D2D5A]">{report.child}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  {report.level} · {report.type} · {report.date}
                </div>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[report.status] ?? "bg-gray-100 text-gray-500"}`}>
                {report.status}
              </span>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${expanded === report.id ? "rotate-180" : ""}`} />
            </button>

            {expanded === report.id && (
              <div className="px-6 pb-5 border-t border-gray-50">
                <div className="grid sm:grid-cols-3 gap-4 mt-4 mb-4">
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Parent</div>
                    <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{report.parent}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Enseignant</div>
                    <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{report.teacher}</div>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Type de bilan</div>
                    <div className="text-sm font-semibold text-[#0D2D5A] mt-1">{report.type}</div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Synthèse</div>
                  <p className="text-sm text-gray-700 leading-relaxed">{report.summary}</p>
                </div>
                <div className="flex items-center gap-3 mt-4">
                  <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg bg-[#a855f7] text-white hover:bg-[#9333ea] transition-colors">
                    <FileText className="w-3.5 h-3.5" />
                    {report.status === "rédigé" ? "Modifier le bilan" : "Continuer la rédaction"}
                  </button>
                  {report.status === "rédigé" && (
                    <button className="flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                      Envoyer au parent
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {reports.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 text-center text-sm text-gray-400">
            Aucune famille suivie pour l&apos;instant.
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
            <ClipboardList className="w-4 h-4 text-[#F5A623]" />
          </div>
          <div>
            <h2 className="font-bold text-[#0D2D5A] text-sm">Demandes de bilan à traiter</h2>
            <p className="text-xs text-gray-400">{activeRequests.length} demandes actives</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {activeRequests.map((request) => (
            <div key={request.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/40 transition-colors">
              <div className="w-9 h-9 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-xs font-bold text-[#1A6CC8] flex-shrink-0">
                {request.child?.[0] ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[#0D2D5A] text-sm">{request.child}</div>
                <div className="text-xs text-gray-400">
                  {request.level} · {request.subject} · {request.date}
                </div>
              </div>
              <div className="text-xs text-gray-400">{request.phone}</div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                  request.status === "reçu"
                    ? "bg-yellow-50 text-yellow-600"
                    : request.status === "en traitement"
                    ? "bg-blue-50 text-blue-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {request.status}
              </span>
              <button className="text-xs font-medium text-[#a855f7] hover:underline whitespace-nowrap">Traiter</button>
            </div>
          ))}
          {activeRequests.length === 0 && (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Toutes les demandes ont été traitées.</div>
          )}
        </div>
      </div>
    </div>
  );
}
