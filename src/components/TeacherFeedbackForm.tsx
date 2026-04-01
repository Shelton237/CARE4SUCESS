import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitTeacherFeedback } from "@/api/backoffice";
import type { TeacherFeedbackReviewer } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";

const schema = z.object({
    teacherId: z.string().min(1, "Séléctionnez un enseignant"),
    rating: z.coerce.number().min(1).max(5),
    comment: z.string().max(500).optional(),
});

type FormValues = z.infer<typeof schema>;

interface TeacherOption {
    id: string;
    name: string;
}

interface TeacherFeedbackFormProps {
    teachers: TeacherOption[];
    defaultTeacherId?: string;
    reviewerName: string;
    reviewerType: TeacherFeedbackReviewer;
    sessionId?: string;
    className?: string;
    title?: string;
    description?: string;
    isLoading?: boolean;
}

export function TeacherFeedbackForm({
    teachers,
    defaultTeacherId,
    reviewerName,
    reviewerType,
    sessionId,
    className,
    title = "Évaluer un professeur",
    description = "Partagez vos retours pour aider la plateforme à suivre la qualité des cours.",
    isLoading = false,
}: TeacherFeedbackFormProps) {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    const [submitted, setSubmitted] = useState(false);
    const defaultSelection = defaultTeacherId || teachers[0]?.id || "";
    const hasTeachers = teachers.length > 0;

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            teacherId: defaultSelection,
            rating: 5,
            comment: "",
        },
    });

    useEffect(() => {
        if (defaultSelection) {
            form.setValue("teacherId", defaultSelection);
        }
    }, [defaultSelection, form]);

    const mutation = useMutation({
        mutationFn: submitTeacherFeedback,
        onSuccess: () => {
            toast({
                title: "Merci pour votre évaluation",
                description: "Votre retour a bien été enregistré.",
            });
            setSubmitted(true);
            queryClient.invalidateQueries({ queryKey: ["teacherRatings"] });
            if (form.getValues("teacherId")) {
                queryClient.invalidateQueries({
                    queryKey: ["teacherFeedback", form.getValues("teacherId")],
                });
            }
            form.reset({
                teacherId: defaultSelection,
                rating: 5,
                comment: "",
            });
            setTimeout(() => setSubmitted(false), 2500);
        },
        onError: (err: Error) => {
            toast({
                title: "Erreur",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const onSubmit = (values: FormValues) => {
        const teacher = teachers.find((t) => t.id === values.teacherId);
        if (!teacher) {
            toast({
                title: "Enseignant introuvable",
                description: "Veuillez sélectionner un professeur valide.",
                variant: "destructive",
            });
            return;
        }
        mutation.mutate({
            teacherId: teacher.id,
            teacherName: teacher.name,
            reviewerName,
            reviewerType,
            rating: values.rating,
            comment: values.comment,
            sessionId,
        });
    };

    if (!hasTeachers) {
        return (
            <div className={className}>
                <div className="mb-4">
                    <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">{title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{description}</p>
                </div>
                <div className="bg-white border border-slate-100 p-6 rounded-none shadow-none text-xs text-slate-400 font-medium italic">
                    {isLoading ? "Chargement des enseignants assignés..." : "Aucun professeur n'est encore planifié pour votre famille. Des avis seront possibles dès que vos premiers cours seront confirmés."}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            {title && (
                <div className="mb-4">
                    <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">{title}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{description}</p>
                </div>
            )}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-white border border-slate-100 p-6 rounded-none shadow-none">
                <div className="space-y-2">
                    <Label htmlFor="teacher" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enseignant Visé</Label>
                    <select
                        id="teacher"
                        className="w-full border border-slate-200 rounded-none px-3 h-10 text-[11px] font-bold text-[#0D2D5A] focus:ring-0 focus:border-[#1A6CC8] bg-slate-50/30 uppercase"
                        {...form.register("teacherId")}
                    >
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score d'Appréciation</Label>
                    <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                type="button"
                                onClick={() => form.setValue("rating", score)}
                                className={`w-10 h-10 border transition-all flex items-center justify-center rounded-none font-black text-xs ${
                                    form.watch("rating") >= score
                                        ? "bg-[#1A6CC8] text-white border-[#1A6CC8]"
                                        : "bg-white text-slate-300 border-slate-100 hover:border-slate-300"
                                }`}
                            >
                                <Star className={`w-4 h-4 ${form.watch("rating") >= score ? 'fill-white' : ''}`} />
                            </button>
                        ))}
                    </div>
                    {form.formState.errors.rating && (
                        <p className="text-[9px] font-bold text-destructive uppercase">{form.formState.errors.rating.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="comment" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Feedback Détaillé</Label>
                    <Textarea
                        id="comment"
                        rows={4}
                        className="rounded-none border-slate-200 focus:ring-0 focus:border-[#1A6CC8] text-xs font-medium placeholder:text-slate-300 bg-slate-50/30 lg:resize-none"
                        placeholder="Ex: Pédagogie active, excellente maîtrise du sujet..."
                        {...form.register("comment")}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white font-black text-[10px] uppercase tracking-widest h-11 rounded-none shadow-none transition-all"
                >
                    {mutation.isPending ? "Transmission en cours..." : submitted ? "Témoignage Transmis !" : "Soumettre mon évaluation"}
                </Button>
            </form>
        </div>
    );
}
