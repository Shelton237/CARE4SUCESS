import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MapPin, Clock, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchGeoLocations, suggestGeoLocation, type GeoType, type GeoLocation } from "@/api/geo";

interface SelectedLevel { id: number; name: string; status: "active" | "pending"; }

interface GeoSelectorProps {
    label?: string;
    required?: boolean;
    value?: number | null;
    onChange: (geoId: number | null, displayPath: string) => void;
    suggestedByEmail?: string;
    hint?: string;
    className?: string;
}

const LEVELS: { type: GeoType; label: string; singular: string; placeholder: string }[] = [
    { type: "country",       label: "Pays",                  singular: "pays",          placeholder: "Sélectionner un pays" },
    { type: "region",        label: "Région",                singular: "région",        placeholder: "Sélectionner une région" },
    { type: "department",    label: "Département",           singular: "département",   placeholder: "Sélectionner un département" },
    { type: "arrondissement",label: "Arrondissement / Ville",singular: "arrondissement",placeholder: "Sélectionner un arrondissement" },
    { type: "quartier",      label: "Quartier",              singular: "quartier",      placeholder: "Sélectionner un quartier" },
];

const LEVEL_ORDER: GeoType[] = ["country", "region", "department", "arrondissement", "quartier"];

export function GeoSelector({ label, required, onChange, suggestedByEmail, hint, className }: GeoSelectorProps) {
    const [selected, setSelected] = useState<Partial<Record<GeoType, SelectedLevel>>>({});
    const [suggestionLevel, setSuggestionLevel] = useState<GeoType | null>(null);
    const [suggestionText, setSuggestionText] = useState("");

    const getParentId = (type: GeoType): number | undefined => {
        const idx = LEVEL_ORDER.indexOf(type);
        if (idx === 0) return undefined;
        return selected[LEVEL_ORDER[idx - 1]]?.id;
    };

    const isEnabled = (type: GeoType) => {
        const idx = LEVEL_ORDER.indexOf(type);
        if (idx === 0) return true;
        return !!selected[LEVEL_ORDER[idx - 1]];
    };

    const countryQ  = useQuery({ queryKey: ["geo", "country"],             queryFn: () => fetchGeoLocations("country") });
    const regionQ   = useQuery({ queryKey: ["geo", "region",   selected.country?.id],       queryFn: () => fetchGeoLocations("region",       selected.country!.id),       enabled: !!selected.country });
    const deptQ     = useQuery({ queryKey: ["geo", "department",selected.region?.id],        queryFn: () => fetchGeoLocations("department",   selected.region!.id),        enabled: !!selected.region });
    const arrQ      = useQuery({ queryKey: ["geo", "arrondissement", selected.department?.id], queryFn: () => fetchGeoLocations("arrondissement", selected.department!.id), enabled: !!selected.department });
    const quartierQ = useQuery({ queryKey: ["geo", "quartier", selected.arrondissement?.id], queryFn: () => fetchGeoLocations("quartier",    selected.arrondissement!.id), enabled: !!selected.arrondissement });

    const queries: Record<GeoType, { data?: GeoLocation[]; isLoading: boolean }> = {
        country: countryQ, region: regionQ, department: deptQ, arrondissement: arrQ, quartier: quartierQ,
    };

    const suggestMut = useMutation({
        mutationFn: (vars: { name: string; type: GeoType; parent_id?: number | null }) =>
            suggestGeoLocation({ ...vars, suggested_by: suggestedByEmail }),
        onSuccess: (loc, vars) => {
            handleSelect(vars.type, { id: loc.id, name: loc.name, status: loc.status ?? "pending" });
            setSuggestionLevel(null);
            setSuggestionText("");
        },
    });

    const handleSelect = (type: GeoType, option: SelectedLevel | null) => {
        const idx = LEVEL_ORDER.indexOf(type);
        const next: Partial<Record<GeoType, SelectedLevel>> = {};
        // Keep levels above, clear this level + below
        for (let i = 0; i < idx; i++) {
            const t = LEVEL_ORDER[i];
            if (selected[t]) next[t] = selected[t]!;
        }
        if (option) next[type] = option;

        setSelected(next);
        setSuggestionLevel(null);
        setSuggestionText("");

        // Emit deepest selection
        const deepest = [...LEVEL_ORDER].reverse().find(l => next[l]);
        if (deepest && next[deepest]) {
            const path = LEVEL_ORDER.filter(l => next[l]).map(l => next[l]!.name).join(" › ");
            onChange(next[deepest]!.id, path);
        } else {
            onChange(null, "");
        }
    };

    const pathParts = LEVEL_ORDER.filter(l => selected[l]).map(l => selected[l]!.name);

    return (
        <div className={cn("space-y-3", className)}>
            {label && (
                <Label className="text-sm font-medium">
                    {label}{required && <span className="text-destructive ml-1">*</span>}
                </Label>
            )}

            <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                {LEVELS.map(({ type, label: lvlLabel, singular, placeholder }) => {
                    const enabled = isEnabled(type);
                    const q = queries[type];
                    const options = q.data ?? [];
                    const current = selected[type];

                    return (
                        <div key={type} className={cn("transition-opacity", !enabled && "opacity-35 pointer-events-none")}>
                            <div className="flex items-center gap-1.5">
                                <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                                <span className="text-xs text-gray-400 w-28 flex-shrink-0">{lvlLabel}</span>
                                <select
                                    className="flex-1 h-8 rounded-md border border-input bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 min-w-0"
                                    value={current?.id ?? ""}
                                    disabled={!enabled || q.isLoading}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "") { handleSelect(type, null); return; }
                                        if (val === "__suggest__") { setSuggestionLevel(type); setSuggestionText(""); return; }
                                        const opt = options.find(o => String(o.id) === val);
                                        if (opt) handleSelect(type, { id: opt.id, name: opt.name, status: opt.status as "active" | "pending" });
                                    }}
                                >
                                    <option value="">{q.isLoading ? "Chargement…" : placeholder}</option>
                                    {options.map(o => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}{o.status === "pending" ? " ⏳" : ""}
                                        </option>
                                    ))}
                                    {enabled && (
                                        <option value="__suggest__">— {lvlLabel} introuvable ? Suggérer</option>
                                    )}
                                </select>
                            </div>

                            {suggestionLevel === type && (
                                <div className="ml-[4.5rem] mt-1 flex gap-1.5">
                                    <Input
                                        value={suggestionText}
                                        onChange={(e) => setSuggestionText(e.target.value)}
                                        placeholder={`Nom du/de la ${singular}`}
                                        className="h-7 text-xs"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                suggestMut.mutate({ name: suggestionText.trim(), type, parent_id: getParentId(type) });
                                            }
                                        }}
                                    />
                                    <Button type="button" size="sm" variant="outline" className="h-7 px-2 text-xs"
                                        onClick={() => suggestMut.mutate({ name: suggestionText.trim(), type, parent_id: getParentId(type) })}
                                        disabled={!suggestionText.trim() || suggestMut.isPending}
                                    >
                                        {suggestMut.isPending ? "…" : "Suggérer"}
                                    </Button>
                                    <Button type="button" size="sm" variant="ghost" className="h-7 px-2 text-xs text-gray-400"
                                        onClick={() => setSuggestionLevel(null)}
                                    >✕</Button>
                                </div>
                            )}

                            {current?.status === "pending" && (
                                <div className="ml-[4.5rem] flex items-center gap-1 text-xs text-amber-600 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    En attente de validation admin
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {pathParts.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">{pathParts.join(" › ")}</span>
                </div>
            )}

            {hint && <p className="text-xs text-gray-400">{hint}</p>}
        </div>
    );
}
