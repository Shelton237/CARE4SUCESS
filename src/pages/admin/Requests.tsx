import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchRequests, updateRequestStatus, createRequest } from "@/api/backoffice";
import type { RequestStatus, BackofficeRequest } from "@/integrations/supabase/types";
import {
    Phone, RefreshCw, Loader2, GitMerge, Plus, Search,
    ClipboardList, CheckCircle2, Clock, XCircle, Filter, X
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const STATUSES: RequestStatus[] = ["reçu", "en traitement", "assigné", "clôturé"];
const STATUS_SET = new Set<RequestStatus>(STATUSES);

const STATUS_META: Record<RequestStatus, { bg: string; text: string; border: string; icon: React.ElementType; label: string }> = {
    "reçu":         { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200", icon: ClipboardList, label: "Reçu" },
    "en traitement":{ bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200",  icon: Clock,         label: "En traitement" },
    "assigné":      { bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200",icon: CheckCircle2,  label: "Assigné" },
    "clôturé":      { bg: "bg-gray-100",  text: "text-gray-500",   border: "border-gray-200",  icon: XCircle,       label: "Clôturé" },
};

const buildInitialGroups = () =>
    Object.fromEntries(STATUSES.map((s) => [s, [] as BackofficeRequest[]])) as Record<RequestStatus, BackofficeRequest[]>;

const EMPTY_FORM = { parentName: "", childName: "", level: "", subject: "", phone: "" };

export default function AdminRequests() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [filterStatus, setFilterStatus] = useState<RequestStatus | "">("");
    const [showAddModal, setShowAddModal] = useState(false);
    const [newForm, setNewForm] = useState(EMPTY_FORM);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["backoffice", "requests"],
        queryFn: fetchRequests,
        staleTime: 60_000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: RequestStatus }) =>
            updateRequestStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            toast.success("Statut mis à jour");
        },
        onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
    });

    const createMutation = useMutation({
        mutationFn: () => createRequest(newForm),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["backoffice", "requests"] });
            toast.success("Demande créée avec succès");
            setNewForm(EMPTY_FORM);
            setShowAddModal(false);
        },
        onError: (err: Error) => toast.error(`Erreur: ${err.message}`),
    });

    const allRequests = data ?? [];

    const filteredRequests = useMemo(() => {
        return allRequests.filter((r) => {
            const matchSearch =
                !search ||
                r.child.toLowerCase().includes(search.toLowerCase()) ||
                r.parent.toLowerCase().includes(search.toLowerCase()) ||
                r.subject?.toLowerCase().includes(search.toLowerCase());
            const matchStatus = !filterStatus || r.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [allRequests, search, filterStatus]);

    const grouped = useMemo(() => {
        const base = buildInitialGroups();
        filteredRequests.forEach((r) => {
            const status = STATUS_SET.has(r.status) ? r.status : "reçu";
            base[status].push(r);
        });
        return base;
    }, [filteredRequests]);

    // KPIs
    const total = allRequests.length;
    const newCount = allRequests.filter((r) => r.status === "reçu").length;
    const inProgress = allRequests.filter((r) => r.status === "en traitement").length;
    const assigned = allRequests.filter((r) => r.status === "assigné").length;

    const handleDragStart = (e: React.DragEvent, id: string) => e.dataTransfer.setData("requestId", id);
    const handleDragOver = (e: React.DragEvent) => e.preventDefault();
    const handleDrop = (e: React.DragEvent, status: RequestStatus) => {
        e.preventDefault();
        const requestId = e.dataTransfer.getData("requestId");
        if (requestId) updateStatusMutation.mutate({ id: requestId, status });
    };

    return (
        <div className="p-4 md:p-8 space-y-6" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            {/* Header */}
            <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                    <p className="text-xs uppercase tracking-[4px] text-gray-400 font-black mb-1">CRM • Pipeline</p>
                    <h1 className="text-2xl font-black text-[#0D2D5A]">Demandes de bilan</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Suivi du pipeline commercial — de la demande initiale à l'affectation du tuteur
                    </p>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-[#1A6CC8] hover:bg-[#0D2D5A] font-bold gap-2 h-11 px-5 rounded-xl shadow-md"
                >
                    <Plus className="w-4 h-4" /> Nouvelle demande
                </Button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Total demandes", value: total, color: "text-[#0D2D5A]", bg: "bg-[#0D2D5A]/5", icon: ClipboardList },
                    { label: "Nouvelles", value: newCount, color: "text-amber-700", bg: "bg-amber-50", icon: ClipboardList },
                    { label: "En traitement", value: inProgress, color: "text-blue-700", bg: "bg-blue-50", icon: Clock },
                    { label: "Assignées", value: assigned, color: "text-emerald-700", bg: "bg-emerald-50", icon: CheckCircle2 },
                ].map(({ label, value, color, bg, icon: Icon }) => (
                    <div key={label} className={`${bg} rounded-2xl p-5 flex items-center gap-4 border border-white shadow-sm`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${bg} border border-white`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                        </div>
                        <div>
                            <p className={`text-2xl font-black ${color}`}>{isLoading ? "—" : value}</p>
                            <p className="text-xs text-gray-500 font-semibold">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher un élève, parent..."
                        className="pl-9 rounded-xl border-gray-200 text-sm"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setFilterStatus("")}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${!filterStatus ? "bg-[#0D2D5A] text-white border-transparent" : "bg-white border-gray-200 text-gray-500 hover:border-[#1A6CC8]/40"}`}
                        >
                            Tous ({total})
                        </button>
                        {STATUSES.map((s) => {
                            const meta = STATUS_META[s];
                            const count = allRequests.filter((r) => r.status === s).length;
                            return (
                                <button
                                    key={s}
                                    onClick={() => setFilterStatus(filterStatus === s ? "" : s)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${filterStatus === s ? `${meta.bg} ${meta.text} ${meta.border}` : "bg-white border-gray-200 text-gray-500 hover:border-[#1A6CC8]/40"}`}
                                >
                                    {meta.label} ({count})
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Error */}
            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger les demandes."}</span>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" /> Réessayer
                    </button>
                </div>
            )}

            {/* Kanban */}
            <div className={`grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 ${updateStatusMutation.isPending ? "opacity-60 pointer-events-none" : ""}`}>
                {STATUSES.map((status) => {
                    const items = grouped[status] ?? [];
                    const meta = STATUS_META[status];
                    const Icon = meta.icon;
                    return (
                        <div
                            key={status}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status)}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
                        >
                            {/* Column header */}
                            <div className={`px-4 py-3 flex items-center justify-between border-b ${meta.border} ${meta.bg}`}>
                                <div className="flex items-center gap-2">
                                    <Icon className={`w-4 h-4 ${meta.text}`} />
                                    <span className={`text-xs font-black uppercase tracking-wider ${meta.text}`}>
                                        {meta.label}
                                    </span>
                                </div>
                                <span className={`${meta.bg} ${meta.text} border ${meta.border} text-xs font-black w-6 h-6 rounded-full flex items-center justify-center`}>
                                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : items.length}
                                </span>
                            </div>

                            {/* Cards */}
                            <div className="p-3 space-y-3 flex-1 min-h-[460px]">
                                {items.map((r) => (
                                    <div
                                        key={r.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, r.id)}
                                        className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md hover:border-[#1A6CC8]/30 transition-all cursor-grab active:cursor-grabbing group"
                                    >
                                        {/* Card top */}
                                        <div className="flex justify-between items-start gap-2">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-black text-[#0D2D5A] text-sm group-hover:text-[#1A6CC8] transition-colors truncate">
                                                    {r.child}
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {r.level}{r.subject ? ` · ${r.subject}` : ""}
                                                </div>
                                            </div>
                                            <select
                                                value={r.status}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) =>
                                                    updateStatusMutation.mutate({ id: r.id, status: e.target.value as RequestStatus })
                                                }
                                                className={`text-[9px] font-black border rounded-lg px-1.5 py-1 cursor-pointer focus:ring-0 focus:outline-none ${meta.bg} ${meta.text} ${meta.border} flex-shrink-0`}
                                            >
                                                {STATUSES.map((s) => (
                                                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Parent */}
                                        <div className="text-xs text-gray-400 mt-2 border-t border-gray-50 pt-2 flex items-center gap-1">
                                            <span className="font-bold text-gray-600 truncate">{r.parent}</span>
                                        </div>

                                        {/* Phone */}
                                        {r.phone && (
                                            <a
                                                href={`tel:${r.phone}`}
                                                className="flex items-center gap-1 text-[#1A6CC8] text-[10px] mt-1 hover:underline font-bold"
                                            >
                                                <Phone className="w-2.5 h-2.5 flex-shrink-0" />
                                                {r.phone}
                                            </a>
                                        )}

                                        {/* Matching CTA */}
                                        {r.status === "en traitement" && (
                                            <Button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate("/admin/matching", { state: { childName: r.child, level: r.level, subject: r.subject } });
                                                }}
                                                className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 bg-violet-50 text-violet-600 border border-violet-100 rounded-lg text-[10px] font-black hover:bg-violet-100 transition-colors shadow-none"
                                            >
                                                <GitMerge className="w-3 h-3" />
                                                Lancer le matching
                                            </Button>
                                        )}

                                        {/* Date */}
                                        <div className="flex items-center justify-between mt-2">
                                            <span className="text-[10px] text-gray-300 font-medium">{r.date}</span>
                                            <div className={`w-2 h-2 rounded-full ${meta.bg} border ${meta.border}`} />
                                        </div>
                                    </div>
                                ))}

                                {/* Empty drop zone */}
                                {items.length === 0 && (
                                    <div className="flex flex-col items-center justify-center h-40 text-gray-200 text-xs border-2 border-dashed border-gray-100 rounded-xl m-1 transition-colors">
                                        <p className="font-bold">{isLoading ? "Chargement..." : "Déposer ici"}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add Request Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-7 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-black text-[#0D2D5A]">Nouvelle demande</h2>
                                <p className="text-xs text-gray-500 mt-0.5">Enregistrer une demande de bilan manuelle</p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="w-8 h-8 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-400"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {[
                                { key: "parentName", label: "Nom du parent", placeholder: "Ex: Ngono Marie" },
                                { key: "childName",  label: "Nom de l'élève", placeholder: "Ex: Junior Ngono" },
                                { key: "level",      label: "Niveau scolaire", placeholder: "Ex: Terminale C" },
                                { key: "subject",    label: "Matière concernée", placeholder: "Ex: Mathématiques" },
                                { key: "phone",      label: "Téléphone", placeholder: "+237..." },
                            ].map(({ key, label, placeholder }) => (
                                <div key={key}>
                                    <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1 block">
                                        {label}
                                    </label>
                                    <Input
                                        value={newForm[key as keyof typeof newForm]}
                                        onChange={(e) => setNewForm((prev) => ({ ...prev, [key]: e.target.value }))}
                                        placeholder={placeholder}
                                        className="rounded-xl"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-xl"
                                onClick={() => setShowAddModal(false)}
                            >
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 bg-[#1A6CC8] hover:bg-[#0D2D5A] font-bold rounded-xl"
                                disabled={!newForm.parentName || !newForm.childName || !newForm.phone || createMutation.isPending}
                                onClick={() => createMutation.mutate()}
                            >
                                {createMutation.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Création...
                                    </span>
                                ) : "Créer la demande"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
