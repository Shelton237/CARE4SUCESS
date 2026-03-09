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

const schema = z.object({
    teacherId: z.string().min(1, "Selectionnez un enseignant"),
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
    title = "Evaluer un professeur",
    description = "Partagez vos retours pour aider la plateforme a suivre la qualite des cours.",
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
                title: "Merci pour votre evaluation",
                description: "Votre retour a bien ete enregistre.",
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
                description: "Veuillez selectionner un professeur valide.",
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
                    <h3 className="text-xl font-semibold text-[#0D2D5A]">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm text-sm text-gray-500">
                    {isLoading ? "Chargement des enseignants assignes..." : "Aucun professeur n'est encore planifie pour votre famille. Des avis seront possibles des que vos premiers cours seront confirmes."}
                </div>
            </div>
        );
    }

    return (
        <div className={className}>
            <div className="mb-4">
                <h3 className="text-xl font-semibold text-[#0D2D5A]">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
                <div className="space-y-2">
                    <Label htmlFor="teacher">Enseignant</Label>
                    <select
                        id="teacher"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8]"
                        {...form.register("teacherId")}
                    >
                        {teachers.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                                {teacher.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <Label>Note</Label>
                    <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((score) => (
                            <button
                                key={score}
                                type="button"
                                onClick={() => form.setValue("rating", score)}
                                className={`w-10 h-10 rounded-full border transition-all ${
                                    form.watch("rating") >= score
                                        ? "bg-[#F5A623] text-white border-[#F5A623]"
                                        : "bg-white text-gray-400 border-gray-200"
                                }`}
                            >
                                {score}
                            </button>
                        ))}
                    </div>
                    {form.formState.errors.rating && (
                        <p className="text-sm text-destructive">{form.formState.errors.rating.message}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <Label htmlFor="comment">Commentaire (optionnel)</Label>
                    <Textarea
                        id="comment"
                        rows={4}
                        placeholder="Ex: progression rapide, tres a l'ecoute, ponctuel..."
                        {...form.register("comment")}
                    />
                </div>

                <Button
                    type="submit"
                    disabled={mutation.isPending}
                    className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A]"
                >
                    {mutation.isPending ? "Envoi en cours..." : submitted ? "Merci !" : "Envoyer mon evaluation"}
                </Button>
            </form>
        </div>
    );
}
