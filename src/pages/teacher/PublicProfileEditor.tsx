import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Plus, X, ExternalLink, Info } from "lucide-react";
import {
    fetchMyPublicProfile,
    updateMyPublicProfile,
    type TeacherPublicProfileForm,
} from "@/api/backoffice";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FALLBACK_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Natif"];
const FALLBACK_FORMATS = ["En ligne", "Présentiel", "Hybride"];
const FALLBACK_QUALITIES = ["Patient", "Dynamique", "Orienté objectifs", "Adaptable", "Rigoureux", "Bienveillant", "Créatif", "Pédagogue"];
const MAX_QUALITIES = 6;

const inputCls = "w-full h-9 bg-slate-50/50 px-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all";
const labelCls = "text-[9px] font-black text-slate-400 uppercase tracking-widest";

const emptyForm: TeacherPublicProfileForm = {
    headline: "", bio: "", specialties: [], formats: [], languages: [], yearsExperience: null,
    videoIntroUrl: "", educations: [], certificates: [], qualities: [],
};

function Chip({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "px-3 h-8 border text-[10px] font-black uppercase tracking-wider transition-all",
                active ? "bg-[#1A6CC8] border-[#1A6CC8] text-white" : "bg-white border-slate-200 text-slate-400 hover:border-[#1A6CC8]/40"
            )}
        >
            {children}
        </button>
    );
}

export default function PublicProfileEditor() {
    const queryClient = useQueryClient();
    const { data, isLoading, error } = useQuery({
        queryKey: ["teacherPublicProfile"],
        queryFn: fetchMyPublicProfile,
        retry: false,
    });

    const [form, setForm] = useState<TeacherPublicProfileForm>(emptyForm);
    const [specialtyDraft, setSpecialtyDraft] = useState("");

    useEffect(() => {
        if (!data) return;
        setForm({
            headline: data.headline, bio: data.bio, specialties: data.specialties, formats: data.formats,
            languages: data.languages, yearsExperience: data.yearsExperience, videoIntroUrl: data.videoIntroUrl,
            educations: data.educations, certificates: data.certificates, qualities: data.qualities,
        });
    }, [data]);

    const saveMutation = useMutation({
        mutationFn: updateMyPublicProfile,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teacherPublicProfile"] });
            queryClient.invalidateQueries({ queryKey: ["public-teacher"] });
            toast.success("Fiche publique mise à jour");
        },
        onError: (err: Error) => toast.error(err.message || "Impossible d'enregistrer la fiche publique."),
    });

    const set = <K extends keyof TeacherPublicProfileForm>(key: K, value: TeacherPublicProfileForm[K]) =>
        setForm(f => ({ ...f, [key]: value }));

    const toggleIn = (key: "formats" | "qualities", value: string, max = 99) => {
        setForm(f => {
            const list = f[key];
            if (list.includes(value)) return { ...f, [key]: list.filter(v => v !== value) };
            if (list.length >= max) {
                toast.error(`${max} choix maximum.`);
                return f;
            }
            return { ...f, [key]: [...list, value] };
        });
    };

    const addSpecialty = () => {
        const v = specialtyDraft.trim();
        if (!v) return;
        if (form.specialties.length >= 12) { toast.error("12 spécialités maximum."); return; }
        if (!form.specialties.some(s => s.toLowerCase() === v.toLowerCase())) set("specialties", [...form.specialties, v]);
        setSpecialtyDraft("");
    };

    if (isLoading) {
        return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#1A6CC8] w-8 h-8" /></div>;
    }
    if (error || !data) {
        return (
            <div className="p-3 bg-amber-50 border border-amber-200 flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                    {(error as Error | null)?.message || "Votre fiche coach n'est pas encore disponible."} Contactez l'administration si le problème persiste.
                </p>
            </div>
        );
    }

    const levels = data.options?.languageLevels ?? FALLBACK_LEVELS;
    const formats = data.options?.formats ?? FALLBACK_FORMATS;
    const qualities = data.options?.qualities ?? FALLBACK_QUALITIES;

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="p-3 bg-[#1A6CC8]/5 border border-[#1A6CC8]/20 flex items-start gap-3 flex-1 min-w-64">
                    <Info className="w-4 h-4 text-[#1A6CC8] mt-0.5 shrink-0" />
                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        Ces informations s'affichent sur votre page publique. Vos matières ({data.subjects.join(", ") || "aucune"}), votre niveau et votre tarif sont gérés par l'administration.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <a
                        href={`/professeurs/${data.publicId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-8 px-3 border border-slate-200 text-slate-500 hover:text-[#1A6CC8] flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest"
                    >
                        <ExternalLink className="w-3.5 h-3.5" /> Voir ma page
                    </a>
                    <Button
                        onClick={() => saveMutation.mutate(form)}
                        disabled={saveMutation.isPending}
                        className="bg-[#1A6CC8] hover:bg-[#0D2D5A] font-black h-8 px-4 rounded-none shadow-none text-[10px] uppercase tracking-widest gap-2"
                    >
                        {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Enregistrer
                    </Button>
                </div>
            </div>

            {/* Accroche + bio */}
            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className={labelCls}>Accroche ({form.headline.length}/160)</label>
                    <input
                        value={form.headline}
                        maxLength={160}
                        onChange={e => set("headline", e.target.value)}
                        placeholder="Ex : Professeur d'anglais certifié | Préparation TOEFL et IELTS"
                        className={inputCls}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className={labelCls}>À propos ({form.bio.length}/4000)</label>
                    <textarea
                        value={form.bio}
                        maxLength={4000}
                        rows={8}
                        onChange={e => set("bio", e.target.value)}
                        placeholder={"Présentez votre parcours, votre méthode et ce que vos élèves obtiennent.\n\n### Ma méthode\nAstuce : une ligne commençant par ### devient un sous-titre."}
                        className="w-full bg-slate-50/50 p-3 border border-slate-200 font-bold text-[11px] text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all resize-y"
                    />
                </div>
            </div>

            {/* Vidéo + expérience */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                    <label className={labelCls}>Vidéo de présentation (lien YouTube ou Vimeo)</label>
                    <input
                        value={form.videoIntroUrl}
                        onChange={e => set("videoIntroUrl", e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={inputCls}
                    />
                </div>
                <div className="space-y-1.5">
                    <label className={labelCls}>Années d'expérience</label>
                    <input
                        type="number" min={0} max={60}
                        value={form.yearsExperience ?? ""}
                        onChange={e => set("yearsExperience", e.target.value === "" ? null : Number(e.target.value))}
                        className={inputCls}
                    />
                </div>
            </div>

            {/* Langues parlées */}
            <div className="space-y-2">
                <label className={labelCls}>Langues parlées</label>
                {form.languages.map((l, i) => (
                    <div key={i} className="flex gap-2">
                        <input
                            value={l.name}
                            onChange={e => set("languages", form.languages.map((x, j) => j === i ? { ...x, name: e.target.value } : x))}
                            placeholder="Langue (ex : Français)"
                            className={inputCls}
                        />
                        <select
                            value={l.level}
                            onChange={e => set("languages", form.languages.map((x, j) => j === i ? { ...x, level: e.target.value } : x))}
                            className={cn(inputCls, "w-32 shrink-0")}
                        >
                            <option value="">Niveau</option>
                            {levels.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                        </select>
                        <button type="button" onClick={() => set("languages", form.languages.filter((_, j) => j !== i))} className="w-9 h-9 shrink-0 border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center" title="Retirer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
                {form.languages.length < 8 && (
                    <button type="button" onClick={() => set("languages", [...form.languages, { name: "", level: "" }])} className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8] flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter une langue</button>
                )}
            </div>

            {/* Spécialités */}
            <div className="space-y-2">
                <label className={labelCls}>Spécialités (Entrée pour ajouter)</label>
                <div className="flex gap-2">
                    <input
                        value={specialtyDraft}
                        onChange={e => setSpecialtyDraft(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSpecialty(); } }}
                        placeholder="Ex : TOEFL, Business English, Conversation"
                        className={inputCls}
                    />
                    <Button type="button" onClick={addSpecialty} variant="outline" className="h-9 rounded-none shadow-none border-slate-200 text-[10px] font-black uppercase">Ajouter</Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {form.specialties.map(s => (
                        <span key={s} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 h-7 bg-slate-100 text-[10px] font-bold text-[#0D2D5A]">
                            {s}
                            <button type="button" onClick={() => set("specialties", form.specialties.filter(x => x !== s))} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                    ))}
                </div>
            </div>

            {/* Formats + qualités */}
            <div className="space-y-2">
                <label className={labelCls}>Formats proposés</label>
                <div className="flex flex-wrap gap-1.5">
                    {formats.map(f => <Chip key={f} active={form.formats.includes(f)} onClick={() => toggleIn("formats", f)}>{f}</Chip>)}
                </div>
            </div>
            <div className="space-y-2">
                <label className={labelCls}>Style d'enseignement ({form.qualities.length}/{MAX_QUALITIES})</label>
                <div className="flex flex-wrap gap-1.5">
                    {qualities.map(q => <Chip key={q} active={form.qualities.includes(q)} onClick={() => toggleIn("qualities", q, MAX_QUALITIES)}>{q}</Chip>)}
                </div>
            </div>

            {/* Formations */}
            <div className="space-y-2">
                <label className={labelCls}>Formations</label>
                {form.educations.map((ed, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_130px_36px] gap-2">
                        <input value={ed.institution} onChange={e => set("educations", form.educations.map((x, j) => j === i ? { ...x, institution: e.target.value } : x))} placeholder="Établissement" className={inputCls} />
                        <input value={ed.degree} onChange={e => set("educations", form.educations.map((x, j) => j === i ? { ...x, degree: e.target.value } : x))} placeholder="Diplôme" className={inputCls} />
                        <input value={ed.dates} onChange={e => set("educations", form.educations.map((x, j) => j === i ? { ...x, dates: e.target.value } : x))} placeholder="2017 - 2020" className={inputCls} />
                        <button type="button" onClick={() => set("educations", form.educations.filter((_, j) => j !== i))} className="h-9 border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center" title="Retirer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
                {form.educations.length < 6 && (
                    <button type="button" onClick={() => set("educations", [...form.educations, { institution: "", degree: "", dates: "" }])} className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8] flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter une formation</button>
                )}
            </div>

            {/* Certificats */}
            <div className="space-y-2">
                <label className={labelCls}>Certificats</label>
                {form.certificates.map((c, i) => (
                    <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_130px_36px] gap-2">
                        <input value={c.name} onChange={e => set("certificates", form.certificates.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Intitulé du certificat" className={inputCls} />
                        <input value={c.dates} onChange={e => set("certificates", form.certificates.map((x, j) => j === i ? { ...x, dates: e.target.value } : x))} placeholder="2026" className={inputCls} />
                        <button type="button" onClick={() => set("certificates", form.certificates.filter((_, j) => j !== i))} className="h-9 border border-slate-200 text-slate-400 hover:text-red-500 flex items-center justify-center" title="Retirer"><X className="w-3.5 h-3.5" /></button>
                    </div>
                ))}
                {form.certificates.length < 8 && (
                    <button type="button" onClick={() => set("certificates", [...form.certificates, { name: "", dates: "" }])} className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8] flex items-center gap-1"><Plus className="w-3 h-3" /> Ajouter un certificat</button>
                )}
            </div>
        </div>
    );
}
