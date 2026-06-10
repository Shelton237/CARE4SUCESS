import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MapPin, Check, X, Globe, Clock, ChevronRight } from "lucide-react";
import { fetchPendingGeoLocations, validateGeoLocation, type PendingGeoLocation, type GeoType } from "@/api/geo";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const TYPE_LABELS: Record<GeoType, string> = {
    country: "Pays",
    region: "Région",
    department: "Département",
    arrondissement: "Arrondissement",
    quartier: "Quartier",
};

const TYPE_COLORS: Record<GeoType, string> = {
    country: "bg-blue-50 text-blue-700 border-blue-100",
    region: "bg-purple-50 text-purple-700 border-purple-100",
    department: "bg-orange-50 text-orange-700 border-orange-100",
    arrondissement: "bg-teal-50 text-teal-700 border-teal-100",
    quartier: "bg-green-50 text-green-700 border-green-100",
};

export default function AdminGeography() {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [processingId, setProcessingId] = useState<number | null>(null);

    const { data: pending = [], isLoading } = useQuery({
        queryKey: ["geo", "pending"],
        queryFn: fetchPendingGeoLocations,
        refetchInterval: 30_000,
    });

    const actionMutation = useMutation({
        mutationFn: ({ id, action }: { id: number; action: "validate" | "reject" }) =>
            validateGeoLocation(id, action, user?.name ?? user?.email ?? "admin"),
        onSuccess: (_, { action }) => {
            queryClient.invalidateQueries({ queryKey: ["geo"] });
            toast({
                title: action === "validate" ? "Zone validée" : "Suggestion rejetée",
                description: action === "validate"
                    ? "La zone est maintenant disponible dans les listes déroulantes."
                    : "La suggestion a été supprimée.",
            });
            setProcessingId(null);
        },
        onError: (err: Error) => {
            toast({ title: "Erreur", description: err.message, variant: "destructive" });
            setProcessingId(null);
        },
    });

    const handle = (id: number, action: "validate" | "reject") => {
        setProcessingId(id);
        actionMutation.mutate({ id, action });
    };

    const formatDate = (iso: string) => {
        try { return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return iso; }
    };

    return (
        <div className="p-4 md:p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A] flex items-center gap-2">
                    <Globe className="w-6 h-6 text-[#1A6CC8]" />
                    Géographie & Zones
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Gérez les suggestions de nouvelles zones soumises par les utilisateurs.
                </p>
            </div>

            {/* Suggestions en attente */}
            <section className="space-y-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-[#0D2D5A]">Suggestions en attente</h2>
                    {pending.length > 0 && (
                        <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {pending.length}
                        </span>
                    )}
                </div>

                {isLoading && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
                        Chargement…
                    </div>
                )}

                {!isLoading && pending.length === 0 && (
                    <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
                        <Check className="w-10 h-10 text-green-400 mx-auto" />
                        <p className="text-sm text-gray-500 font-medium">Aucune suggestion en attente.</p>
                        <p className="text-xs text-gray-400">Les nouvelles zones suggérées par les utilisateurs apparaîtront ici.</p>
                    </div>
                )}

                <div className="space-y-3">
                    {pending.map((loc: PendingGeoLocation) => {
                        const isProcessing = processingId === loc.id;
                        return (
                            <div key={loc.id} className="bg-white rounded-2xl border border-amber-100 p-4 flex items-center gap-4">
                                <div className="flex-1 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-semibold text-[#0D2D5A]">{loc.name}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${TYPE_COLORS[loc.type]}`}>
                                            {TYPE_LABELS[loc.type]}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-amber-600">
                                            <Clock className="w-3 h-3" /> {formatDate(loc.created_at)}
                                        </span>
                                    </div>

                                    {loc.parent_name && (
                                        <div className="flex items-center gap-1 text-xs text-gray-400">
                                            <ChevronRight className="w-3 h-3" />
                                            <span>{loc.parent_type ? TYPE_LABELS[loc.parent_type] : ""} :</span>
                                            <span className="font-medium text-gray-600">{loc.parent_name}</span>
                                        </div>
                                    )}

                                    {loc.suggested_by && (
                                        <div className="text-xs text-gray-400">
                                            Suggéré par : <span className="font-medium text-gray-600">{loc.suggested_by}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 flex-shrink-0">
                                    <button
                                        onClick={() => handle(loc.id, "validate")}
                                        disabled={isProcessing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-100 transition-colors disabled:opacity-50"
                                    >
                                        <Check className="w-3.5 h-3.5" />
                                        Valider
                                    </button>
                                    <button
                                        onClick={() => handle(loc.id, "reject")}
                                        disabled={isProcessing}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-100 transition-colors disabled:opacity-50"
                                    >
                                        <X className="w-3.5 h-3.5" />
                                        Rejeter
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Info pédagogique */}
            <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5 space-y-2 text-sm text-blue-800">
                <p className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4" /> Comment fonctionne la géographie ?</p>
                <ul className="space-y-1 text-xs text-blue-700 list-disc list-inside">
                    <li>Hiérarchie : <strong>Pays → Région → Département → Arrondissement → Quartier</strong></li>
                    <li>Les enseignants et parents sélectionnent leur zone via des listes déroulantes.</li>
                    <li>Si une zone est introuvable, l'utilisateur peut la suggérer — elle apparaît ici en attente.</li>
                    <li>Une fois validée, elle est disponible pour tous les utilisateurs de la plateforme.</li>
                    <li>Le matching calcule un score de proximité : même quartier = 5, même arrondissement = 4, même département = 3, même région = 2, même pays = 1.</li>
                </ul>
            </section>
        </div>
    );
}
