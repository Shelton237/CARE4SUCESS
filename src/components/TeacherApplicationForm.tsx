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
import { CheckCircle2, Mail, Phone, GraduationCap } from "lucide-react";
import { springPresets } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { GeoSelector } from "@/components/GeoSelector";

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

import { ALL_SUBJECTS, ALL_LEVELS } from "@/lib/education";

const AVAILABLE_SUBJECTS = ALL_SUBJECTS.filter(s => s !== "Autre");
const AVAILABLE_LEVELS = ALL_LEVELS;

export function TeacherApplicationForm({ className }: TeacherApplicationFormProps) {
    const { toast } = useToast();
    const [completed, setCompleted] = useState(false);
    const [cvFile, setCvFile] = useState<File | null>(null);
    const [primaryGeoId, setPrimaryGeoId] = useState<number | null>(null);
    const [primaryGeoPath, setPrimaryGeoPath] = useState("");
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
                    "bg-white border border-green-100 rounded-2xl p-10 text-center shadow-lg",
                    className
                )}
            >
                <CheckCircle2 className="w-14 h-14 mx-auto text-green-500 mb-4" />
                <h3 className="text-2xl font-bold text-[#0D2D5A] mb-2">
                    Merci pour votre candidature !
                </h3>
                <p className="text-gray-500 max-w-xl mx-auto">
                    Notre équipe recrutement va analyser votre dossier. Vous recevrez une réponse par email sous
                    48 heures.
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
                "bg-white border border-gray-100 rounded-2xl shadow-xl p-8 space-y-6",
                className
            )}
        >
            <div className="space-y-2 text-center">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-[#1A6CC8]/10 rounded-full text-[#1A6CC8] font-semibold text-sm">
                    <GraduationCap className="w-4 h-4" />
                    Rejoignez notre communauté d'enseignants
                </div>
                <h3 className="text-3xl font-bold text-[#0D2D5A]">
                    Devenez professeur Care4Success
                </h3>
                <p className="text-gray-500">
                    Remplissez le formulaire et nous vous recontacterons rapidement pour un entretien.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label htmlFor="fullName">Nom complet *</Label>
                    <Input
                        id="fullName"
                        placeholder="Dr. Clémentine Abanda"
                        {...form.register("fullName")}
                    />
                    {form.formState.errors.fullName && (
                        <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            id="email"
                            type="email"
                            className="pl-9"
                            placeholder="vous@email.com"
                            {...form.register("email")}
                        />
                    </div>
                    {form.formState.errors.email && (
                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone *</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                            id="phone"
                            placeholder="+237 6XX XXX XXX"
                            className="pl-9"
                            {...form.register("phone")}
                        />
                    </div>
                    {form.formState.errors.phone && (
                        <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
                    )}
                </div>
                <div className="md:col-span-2">
                    <GeoSelector
                        label="Zone d'intervention"
                        required
                        suggestedByEmail={form.watch("email")}
                        onChange={(geoId, path) => {
                            setPrimaryGeoId(geoId);
                            setPrimaryGeoPath(path);
                            if (geoId) setGeoError("");
                        }}
                        hint="Sélectionnez jusqu'au niveau le plus précis disponible."
                    />
                    {geoError && <p className="text-sm text-destructive mt-1">{geoError}</p>}
                </div>
                <div className="space-y-3">
                    <Label>Matières enseignées *</Label>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_SUBJECTS.map((sub) => {
                            const isSelected = subjectsWatch?.includes(sub);
                            return (
                                <button
                                    key={sub}
                                    type="button"
                                    onClick={() => toggleSelection(subjectsWatch, sub, "subjectsText")}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-semibold rounded-full border transition-all",
                                        isSelected
                                            ? "bg-[#1A6CC8] text-white border-[#1A6CC8] shadow-md"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#1A6CC8]/50 hover:bg-blue-50"
                                    )}
                                >
                                    {sub}
                                </button>
                            );
                        })}
                    </div>
                    {form.formState.errors.subjectsText && (
                        <p className="text-sm text-destructive">{form.formState.errors.subjectsText.message}</p>
                    )}
                </div>

                <div className="space-y-3">
                    <Label>Niveaux scolaires ciblés *</Label>
                    <div className="flex flex-wrap gap-2">
                        {AVAILABLE_LEVELS.map((lvl) => {
                            const isSelected = levelsWatch?.includes(lvl);
                            return (
                                <button
                                    key={lvl}
                                    type="button"
                                    onClick={() => toggleSelection(levelsWatch, lvl, "levelsText")}
                                    className={cn(
                                        "px-3 py-1.5 text-sm font-semibold rounded-full border transition-all",
                                        isSelected
                                            ? "bg-[#F5A623] text-white border-[#F5A623] shadow-md"
                                            : "bg-slate-50 text-slate-600 border-slate-200 hover:border-[#F5A623]/50 hover:bg-orange-50"
                                    )}
                                >
                                    {lvl}
                                </button>
                            );
                        })}
                    </div>
                    {form.formState.errors.levelsText && (
                        <p className="text-sm text-destructive">{form.formState.errors.levelsText.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="experienceYears">Années d'expérience *</Label>
                    <Input
                        id="experienceYears"
                        type="number"
                        min={0}
                        {...form.register("experienceYears", { valueAsNumber: true })}
                    />
                    {form.formState.errors.experienceYears && (
                        <p className="text-sm text-destructive">
                            {form.formState.errors.experienceYears.message}
                        </p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="availability">Disponibilités *</Label>
                    <Input
                        id="availability"
                        placeholder="Ex: Soirs 17h-21h + Week-end"
                        {...form.register("availability")}
                    />
                    {form.formState.errors.availability && (
                        <p className="text-sm text-destructive">{form.formState.errors.availability.message}</p>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="motivation">Présentation & motivation *</Label>
                    <Textarea
                        id="motivation"
                        rows={5}
                        placeholder="Décrivez votre parcours, vos forces pédagogiques et les profils d'élèves que vous accompagnez le mieux..."
                        {...form.register("motivation")}
                    />
                    {form.formState.errors.motivation && (
                        <p className="text-sm text-destructive">{form.formState.errors.motivation.message}</p>
                    )}
                </div>
                <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="cvFile">Curriculum Vitae (PDF, Word, etc.)</Label>
                    <Input
                        id="cvFile"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                                setCvFile(e.target.files[0]);
                            } else {
                                setCvFile(null);
                            }
                        }}
                        className="cursor-pointer file:text-[#1A6CC8] file:font-semibold file:border-0 file:bg-transparent"
                    />
                    {cvFile && <p className="text-sm text-green-600 font-medium">Fichier joint : {cvFile.name}</p>}
                </div>
            </div>

            <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white h-12 text-base font-semibold"
            >
                {mutation.isPending ? "Envoi en cours..." : "Envoyer ma candidature"}
            </Button>
        </motion.form>
    );
}
