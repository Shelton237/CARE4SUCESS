import { useMemo } from "react";
import { fetchRequests, updateRequestStatus } from "@/api/backoffice";
import type { RequestStatus, BackofficeRequest } from "@/integrations/supabase/types";
import { Phone, RefreshCw, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUSES: RequestStatus[] = ["reçu", "en traitement", "assigné", "clôturé"];
const STATUS_SET = new Set<RequestStatus>(STATUSES);
const STATUS_COLORS: Record<RequestStatus, { bg: string; text: string }> = {
    "reçu": { bg: "bg-yellow-50", text: "text-yellow-700" },
    "en traitement": { bg: "bg-blue-50", text: "text-blue-700" },
    "assigné": { bg: "bg-green-50", text: "text-green-700" },
    "clôturé": { bg: "bg-gray-100", text: "text-gray-500" },
};

const buildInitialGroups = () =>
    Object.fromEntries(STATUSES.map((status) => [status, [] as BackofficeRequest[]])) as Record<
        RequestStatus,
        BackofficeRequest[]
    >;

export default function AdminRequests() {
    const queryClient = useQueryClient();
    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["backoffice", "requests"],
        queryFn: fetchRequests,
        staleTime: 60_000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: RequestStatus }) => updateRequestStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            toast.success("Statut mis à jour");
        },
        onError: (err: Error) => {
            toast.error(`Erreur: ${err.message}`);
        }
    });

    const grouped = useMemo(() => {
        const base = buildInitialGroups();
        (data ?? []).forEach((request: BackofficeRequest) => {
            const status = STATUS_SET.has(request.status) ? request.status : "reçu";
            base[status].push(request);
        });
        return base;
    }, [data]);

    const handleDragStart = (e: React.DragEvent, id: string) => {
        e.dataTransfer.setData("requestId", id);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent, status: RequestStatus) => {
        e.preventDefault();
        const requestId = e.dataTransfer.getData("requestId");
        if (requestId) {
            updateStatusMutation.mutate({ id: requestId, status });
        }
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Demandes de bilan</h1>
                <p className="text-gray-500 text-sm mt-1">Suivi du pipeline de demandes de bilan gratuit</p>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger les demandes."}</span>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Réessayer
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                {STATUSES.map((status) => {
                    const items = grouped[status] ?? [];
                    const col = STATUS_COLORS[status];
                    return (
                        <div
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                            className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col ${updateStatusMutation.isPending ? "opacity-50 pointer-events-none" : ""}`}
                        >
                            <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/30">
                                <span className={`text-xs font-bold uppercase tracking-wider ${col.text}`}>{status}</span>
                                <span
                                    className={`${col.bg} ${col.text} text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center`}
                                >
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : items.length}
                                </span>
                            </div>
                            <div className="p-3 space-y-3 flex-1 min-h-[500px]">
                                {items.map((r) => (
                                    <div
                                        key={r.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, r.id)}
                                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#1A6CC8]/30 transition-all cursor-grab active:cursor-grabbing group relative"
                                    >
                                        <div className="font-semibold text-[#0D2D5A] text-sm group-hover:text-[#1A6CC8] transition-colors">{r.child}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {r.level} · {r.subject}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 border-t border-gray-50 pt-2 flex items-center gap-1">
                                            <span className="font-medium text-gray-600">{r.parent}</span>
                                        </div>
                                        <a
                                            href={`tel:${r.phone}`}
                                            className="flex items-center gap-1 text-[#1A6CC8] text-[10px] mt-1 hover:underline font-bold"
                                        >
                                            <Phone className="w-2.5 h-2.5" />
                                            {r.phone}
                                        </a>
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-300 font-medium">{r.date}</span>
                                            <div className={`w-1.5 h-1.5 rounded-full ${col.bg.replace('bg-', 'bg-opacity-50 bg-')}`} />
                                        </div>
                                    </div>
                                ))}
                                {items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-48 text-gray-300 text-xs border-2 border-dashed border-gray-50 rounded-xl m-1">
                                        <p>{isLoading ? "Chargement..." : "Déposer ici"}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
