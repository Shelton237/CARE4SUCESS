import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitTeacherApplication } from "@/api/backoffice";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Mail, Phone, FileText } from "lucide-react";
import { springPresets } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GeoSelector } from "@/components/GeoSelector";
import { ALL_SUBJECTS, ALL_LEVELS } from "@/lib/education";

const formSchema = z.object({
    fullName: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
    email: z.string().email("Adresse email invalide"),
    phone: z.string().min(8, "Numéro de téléphone invalide"),
    subjectsText: z.string().min(2, "Indiquez au moins une matière"),
    levelsText: z.string().min(2, "Indiquez au moins un niveau scolaire"),
    experienceYears: z.coerce.number().min(0, "Expérience invalide"),
    availability: z.string().min(3, "Précisez vos disponibilités"),
    motivation: z.string().min(20, "Parlez-nous davantage de votre motivation"),
});

type FormData = z.infer<typeof formSchema>;

interface TeacherApplicationFormProps {
    className?: string;
}

const AVAILABLE_SUBJECTS = ALL_SUBJECTS.filter(s => s !== "Autre");
const AVAILABLE_LEVELS = ALL_LEVELS;

function SectionHeader({ children }: { children: string }) {
    return (
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">{children}</p>
            <div className="flex-1 h-px bg-slate-100" />
        </div>
    );
}

export function TeacherApplicationForm({ className }: TeacherApplicationFormProps) {
    const { toast } = useToast();
    const [completed, setCompleted] = useState(false);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [primaryGeoId, setPrimaryGeoId] = useState<number | null>(null);
    const [geoError, setGeoError] = useState("");

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            phone: "",
            subjectsText: "",
            levelsText: "",
            experienceYears: 3,
            availability: "",
            motivation: "",
        },
    });

    const mutation = useMutation({
        mutationFn: submitTeacherApplication,
        onSuccess: () => {
            setCompleted(true);
            toast({
                title: "Candidature envoyée",
                description: "Notre équipe analysera votre profil sous 48h.",
            });
            form.reset();
            setTimeout(() => setCompleted(false), 3500);
        },
        onError: (error: Error) => {
            toast({
                title: "Erreur lors de l'envoi",
                description: error.message,
                variant: "destructive",
            });
        },
    });

    const subjectsWatch = form.watch("subjectsText");
    const levelsWatch = form.watch("levelsText");

    const toggleSelection = (currentString: string, item: string, fieldName: "subjectsText" | "levelsText") => {
        const currentList = currentString ? currentString.split(",").map(s => s.trim()).filter(Boolean) : [];
        if (currentList.includes(item)) {
            form.setValue(fieldName, currentList.filter(s => s !== item).join(", "), { shouldValidate: true });
        } else {
            form.setValue(fieldName, [...currentList, item].join(", "), { shouldValidate: true });
        }
    };

    const onSubmit = (data: FormData) => {
        if (!primaryGeoId) {
            setGeoError("Veuillez sélectionner votre zone d'intervention principale.");
            return;
        }
        setGeoError("");
        const formData = new window.FormData();
        formData.append("fullName", data.fullName);
        formData.append("email", data.email);
        formData.append("phone", data.phone);
        formData.append("geoLocationId", String(primaryGeoId));
        formData.append("subjects", data.subjectsText);
        formData.append("levels", data.levelsText);
        formData.append("experienceYears", data.experienceYears.toString());
        formData.append("availability", data.availability);
        formData.append("motivation", data.motivation);
        if (cvFile) formData.append("cv", cvFile);
        mutation.mutate(formData as any);
    };

    if (completed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springPresets.gentle}
                className={cn(
                    "bg-white border-t-[3px] border-[#F5A623] p-10 text-center shadow-xl",
                    className
                )}
            >
                <div className="w-14 h-14 bg-[#0D2D5A] flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-7 h-7 text-[#F5A623]" />
                </div>
                <h3 className="text-xl font-black text-[#0D2D5A] mb-2">Candidature envoyée !</h3>
                <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                    Notre équipe recrutement va analyser votre dossier. Vous recevrez une réponse par email sous 48 heures.
                </p>
            </motion.div>
        );
    }

    return (
        <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springPresets.gentle}
            onSubmit={form.handleSubmit(onSubmit)}
            className={cn(
                "bg-white border-t-[3px] border-[#F5A623] shadow-xl divide-y divide-slate-100",
                className
            )}
        >
            {/* ── COORDONNÉES ── */}
            <div className="p-6 space-y-4">
                <SectionHeader>Coordonnées personnelles</SectionHeader>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Nom complet *
                        </Label>
                        <Input
                            id="fullName"
                            className="h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                            placeholder="Dr. Clémentine Abanda"
                            {...form.register("fullName")}
                        />
                        {form.formState.errors.fullName && (
                            <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Téléphone *
                        </Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <Input
                                id="phone"
                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                placeholder="+237 6XX XXX XXX"
                                {...form.register("phone")}
                            />
                        </div>
                        {form.formState.errors.phone && (
                            <p className="text-xs text-destructive">{form.formState.errors.phone.message}</p>
                        )}
                    </div>

                    <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Adresse email *
                        </Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            <Input
                                id="email"
                                type="email"
                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                placeholder="vous@email.com"
                                {...form.register("email")}
                            />
                        </div>
                        {form.formState.errors.email && (
                            <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── ZONE & MATIÈRES ── */}
            <div className="p-6 space-y-5">
                <SectionHeader>Zone d'intervention & Matières</SectionHeader>

                <div>
                    <GeoSelector
                        label="Zone d'intervention principale"
                        required
                        suggestedByEmail={form.watch("email")}
                        onChange={(geoId) => {
                            setPrimaryGeoId(geoId);
                            if (geoId) setGeoError("");
                        }}
                        hint="Sélectionnez jusqu'au niveau le plus précis disponible."
                    />
                    {geoError && <p className="text-xs text-destructive mt-1.5">{geoError}</p>}
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Matières enseignées *
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_SUBJECTS.map((sub) => {
                                const isSelected = subjectsWatch?.includes(sub);
                                return (
                                    <button
                                        key={sub}
                                        type="button"
                                        onClick={() => toggleSelection(subjectsWatch, sub, "subjectsText")}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-[#1A6CC8] text-white border-[#1A6CC8]"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-[#1A6CC8] hover:text-[#1A6CC8]"
                                        )}
                                    >
                                        {sub}
                                    </button>
                                );
                            })}
                        </div>
                        {form.formState.errors.subjectsText && (
                            <p className="text-xs text-destructive">{form.formState.errors.subjectsText.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Niveaux scolaires ciblés *
                        </Label>
                        <div className="flex flex-wrap gap-1.5">
                            {AVAILABLE_LEVELS.map((lvl) => {
                                const isSelected = levelsWatch?.includes(lvl);
                                return (
                                    <button
                                        key={lvl}
                                        type="button"
                                        onClick={() => toggleSelection(levelsWatch, lvl, "levelsText")}
                                        className={cn(
                                            "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer",
                                            isSelected
                                                ? "bg-[#F5A623] text-[#0D2D5A] border-[#F5A623]"
                                                : "bg-slate-50 text-slate-500 border-slate-200 hover:border-[#F5A623] hover:text-[#0D2D5A]"
                                        )}
                                    >
                                        {lvl}
                                    </button>
                                );
                            })}
                        </div>
                        {form.formState.errors.levelsText && (
                            <p className="text-xs text-destructive">{form.formState.errors.levelsText.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── EXPÉRIENCE ── */}
            <div className="p-6 space-y-4">
                <SectionHeader>Expérience & Disponibilités</SectionHeader>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <Label htmlFor="experienceYears" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Années d'expérience *
                        </Label>
                        <Input
                            id="experienceYears"
                            type="number"
                            min={0}
                            className="h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                            {...form.register("experienceYears", { valueAsNumber: true })}
                        />
                        {form.formState.errors.experienceYears && (
                            <p className="text-xs text-destructive">{form.formState.errors.experienceYears.message}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label htmlFor="availability" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Disponibilités *
                        </Label>
                        <Input
                            id="availability"
                            className="h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                            placeholder="Ex: Soirs 17h-21h + Week-end"
                            {...form.register("availability")}
                        />
                        {form.formState.errors.availability && (
                            <p className="text-xs text-destructive">{form.formState.errors.availability.message}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── CANDIDATURE ── */}
            <div className="p-6 space-y-4">
                <SectionHeader>Présentation & Candidature</SectionHeader>

                <div className="space-y-1.5">
                    <Label htmlFor="motivation" className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Présentation & motivation *
                    </Label>
                    <Textarea
                        id="motivation"
                        rows={5}
                        className="rounded-none border-slate-200 focus-visible:ring-[#1A6CC8] resize-none"
                        placeholder="Décrivez votre parcours, vos forces pédagogiques et les profils d'élèves que vous accompagnez le mieux..."
                        {...form.register("motivation")}
                    />
                    {form.formState.errors.motivation && (
                        <p className="text-xs text-destructive">{form.formState.errors.motivation.message}</p>
                    )}
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Curriculum Vitae (PDF, Word)
                    </Label>
                    <label
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 border-2 border-dashed p-6 cursor-pointer transition-colors",
                            cvFile
                                ? "border-[#1A6CC8] bg-blue-50/40"
                                : "border-slate-200 hover:border-[#1A6CC8] hover:bg-slate-50"
                        )}
                    >
                        <FileText className={cn("w-6 h-6", cvFile ? "text-[#1A6CC8]" : "text-slate-300")} />
                        {cvFile ? (
                            <p className="text-xs font-bold text-[#1A6CC8]">{cvFile.name}</p>
                        ) : (
                            <div className="text-center">
                                <p className="text-xs font-bold text-slate-500">Cliquez pour joindre votre CV</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">PDF, DOC ou DOCX</p>
                            </div>
                        )}
                        <input
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="sr-only"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                    setCvFile(e.target.files[0]);
                                } else {
                                    setCvFile(null);
                                }
                            }}
                        />
                    </label>
                </div>
            </div>

            {/* ── SUBMIT ── */}
            <div className="p-6">
                <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white h-12 rounded-none font-black text-[10px] tracking-widest uppercase transition-colors"
                >
                    {mutation.isPending ? "Envoi en cours…" : "Envoyer ma candidature →"}
                </Button>
                <p className="text-center text-[10px] text-slate-400 mt-3">
                    Notre équipe examine chaque dossier et vous répond sous 48 heures
                </p>
            </div>
        </motion.form>
    );
}
