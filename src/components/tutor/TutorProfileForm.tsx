import { useEffect, useState } from "react";
import { Loader2, Save, X, PlusCircle } from "lucide-react";
import { ALL_LEVELS, ALL_SUBJECTS } from "@/data/education";
import { SubjectBadgePicker } from "@/components/common/SubjectSelect";
import { CityAutocomplete } from "@/components/common/CityAutocomplete";
import { AvailabilityPicker, serializeAvailability, deserializeAvailability } from "@/components/common/AvailabilityPicker";
import { cn } from "@/lib/utils";

export type TutorProfile = {
    id?: string;
    name?: string;
    email?: string;
    subjects: string[];
    levels: string[];
    city: string;
    zones: string[];
    availability: Record<string, string[]>;
    rate: number;
    currency: string;
    completeness?: { percent: number; missing: string[] };
};

export const EMPTY_TUTOR_PROFILE: TutorProfile = { subjects: [], levels: [], city: "", zones: [], availability: {}, rate: 0, currency: "XAF" };

const LEVEL_OPTIONS = ["Tous niveaux", ...ALL_LEVELS];
const CURRENCIES = [
    { value: "XAF", label: "FCFA (XAF, Afrique centrale)" },
    { value: "XOF", label: "FCFA (XOF, Afrique de l'Ouest)" },
    { value: "MGA", label: "Ariary (MGA)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "USD", label: "Dollar (USD)" },
];

const LABEL = "text-xs font-semibold text-[#0D2D5A]";
const INPUT = "w-full h-10 border border-gray-200 rounded-lg px-3 text-sm text-[#0D2D5A] placeholder:text-gray-400 outline-none focus:border-[#0F9B8E] focus:ring-2 focus:ring-[#0F9B8E]/15 bg-white";

export function CompletenessBar({ completeness }: { completeness?: { percent: number; missing: string[] } }) {
    if (!completeness) return null;
    const { percent, missing } = completeness;
    const color = percent === 100 ? "#16A34A" : percent >= 60 ? "#D97706" : "#DC2626";
    return (
        <div>
            <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-semibold text-[#0D2D5A]">Profil complété à {percent} %</span>
                {missing.length > 0 && <span className="text-gray-500">Il manque : {missing.join(", ")}</span>}
            </div>
            <div className="h-1.5 rounded-full bg-gray-100" aria-hidden>
                <div className="h-full rounded-full transition-all" style={{ width: `${percent}%`, background: color }} />
            </div>
        </div>
    );
}

export function TutorProfileForm({ value, onSave, saving, allowRate = false }: {
    value: TutorProfile;
    onSave: (payload: Partial<TutorProfile>) => void;
    saving?: boolean;
    allowRate?: boolean;
}) {
    const [form, setForm] = useState<TutorProfile>(value);
    const [zoneDraft, setZoneDraft] = useState("");
    useEffect(() => { setForm(value); }, [value]);

    const set = <K extends keyof TutorProfile>(k: K, v: TutorProfile[K]) => setForm(prev => ({ ...prev, [k]: v }));
    const toggleLevel = (l: string) => set("levels", form.levels.includes(l) ? form.levels.filter(x => x !== l) : [...form.levels, l]);
    const addZone = () => {
        const z = zoneDraft.trim();
        if (z && !form.zones.includes(z)) set("zones", [...form.zones, z]);
        setZoneDraft("");
    };

    const submit = () => {
        const payload: Partial<TutorProfile> = {
            subjects: form.subjects,
            levels: form.levels,
            city: form.city,
            zones: form.zones,
            availability: form.availability,
        };
        if (allowRate) { payload.rate = Number(form.rate) || 0; payload.currency = form.currency; }
        onSave(payload);
    };

    return (
        <div className="space-y-5">
            <CompletenessBar completeness={value.completeness} />

            <div className="space-y-1.5">
                <p className={LABEL}>Matières enseignées</p>
                <SubjectBadgePicker selectedSubjects={form.subjects} onChange={v => set("subjects", v)} availableSubjects={ALL_SUBJECTS} />
            </div>

            <fieldset className="space-y-1.5">
                <legend className={LABEL}>Niveaux</legend>
                <div className="flex flex-wrap gap-1.5">
                    {LEVEL_OPTIONS.map(l => (
                        <button
                            key={l}
                            type="button"
                            aria-pressed={form.levels.includes(l)}
                            onClick={() => toggleLevel(l)}
                            className={cn(
                                "text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                                form.levels.includes(l) ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="tutor-city">Ville</label>
                    <CityAutocomplete id="tutor-city" value={form.city} onChange={v => set("city", v)} placeholder="Ex : Douala" />
                </div>
                <div className="space-y-1.5">
                    <label className={LABEL} htmlFor="tutor-zone">Zones d'intervention (quartiers, villes)</label>
                    <div className="flex gap-2">
                        <input
                            id="tutor-zone"
                            value={zoneDraft}
                            onChange={e => setZoneDraft(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addZone(); } }}
                            placeholder="Ex : Akwa, Bonapriso"
                            className={INPUT}
                        />
                        <button type="button" onClick={addZone} aria-label="Ajouter la zone" className="h-10 px-3 rounded-lg border border-gray-200 text-[#0F9B8E] hover:bg-gray-50">
                            <PlusCircle className="w-4 h-4" />
                        </button>
                    </div>
                    {form.zones.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {form.zones.map(z => (
                                <span key={z} className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-[#0F9B8E]/10 text-[#0F9B8E]">
                                    {z}
                                    <button type="button" aria-label={`Retirer ${z}`} onClick={() => set("zones", form.zones.filter(x => x !== z))}>
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-1.5">
                <p className={LABEL}>Disponibilités</p>
                <AvailabilityPicker
                    value={serializeAvailability(form.availability as any)}
                    onChange={v => set("availability", deserializeAvailability(v) as any)}
                />
            </div>

            {allowRate && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                        <label className={LABEL} htmlFor="tutor-rate">Tarif horaire</label>
                        <input id="tutor-rate" type="number" min={0} step={500} value={form.rate || ""} onChange={e => set("rate", Number(e.target.value))} className={INPUT} />
                    </div>
                    <div className="space-y-1.5">
                        <label className={LABEL} htmlFor="tutor-currency">Devise</label>
                        <select id="tutor-currency" value={form.currency} onChange={e => set("currency", e.target.value)} className={INPUT}>
                            {CURRENCIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    </div>
                </div>
            )}

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={submit}
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold bg-[#0D2D5A] text-white hover:bg-[#0D2D5A]/90 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Enregistrer
                </button>
            </div>
        </div>
    );
}

export default TutorProfileForm;
