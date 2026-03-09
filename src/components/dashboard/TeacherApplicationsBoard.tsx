import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchTeacherApplications,
    reviewTeacherApplication,
} from "@/api/backoffice";
import type {
    TeacherApplication,
    TeacherApplicationStatus,
    ReviewerRole,
} from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    CheckCircle2,
    XCircle,
    UserPlus,
    Mail,
    FileText,
    Loader2,
    Copy,
    Search,
    Calendar,
    Briefcase,
    GraduationCap,
    AlertCircle,
    Phone,
} from "lucide-react";

const STATUS_FILTERS: Array<{
    value: TeacherApplicationStatus | "all";
    label: string;
}> = [
        { value: "pending", label: "En attente" },
        { value: "approved", label: "Validées" },
        { value: "rejected", label: "Refusées" },
        { value: "all", label: "Toutes" },
    ];

const STATUS_STYLES: Record<
    TeacherApplicationStatus,
    { bg: string; text: string; label: string }
> = {
    pending: {
        bg: "bg-amber-100",
        text: "text-amber-700",
        label: "En attente",
    },
    approved: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "Validée",
    },
    rejected: {
        bg: "bg-rose-100",
        text: "text-rose-700",
        label: "Refusée",
    },
};

interface TeacherApplicationsBoardProps {
    reviewerRole: ReviewerRole;
    title?: string;
    description?: string;
}

export default function TeacherApplicationsBoard({
    reviewerRole,
    title = "Candidatures enseignants",
    description = "Analysez les nouveaux profils et validez les meilleurs candidats.",
}: TeacherApplicationsBoardProps) {
    const [statusFilter, setStatusFilter] = useState<TeacherApplicationStatus | "all">("pending");
    const [decisionDialog, setDecisionDialog] = useState<{
        app: TeacherApplication;
        status: Exclude<TeacherApplicationStatus, "pending">;
    } | null>(null);
    const [notes, setNotes] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [newCredentials, setNewCredentials] = useState<{
        email: string;
        password?: string;
        name: string;
        alreadyExists?: boolean;
    } | null>(null);

    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const queryKey = ["teacherApplications", statusFilter];
    const {
        data,
        isLoading,
        isError,
        error,
    } = useQuery({
        queryKey,
        queryFn: () =>
            fetchTeacherApplications(statusFilter === "all" ? undefined : statusFilter),
        refetchOnWindowFocus: false,
    });

    const { data: pendingData } = useQuery({
        queryKey: ["teacherApplications", "pending"],
        queryFn: () => fetchTeacherApplications("pending"),
        enabled: statusFilter !== "pending",
        staleTime: 30_000,
        initialData: () =>
            queryClient.getQueryData<TeacherApplication[]>(["teacherApplications", "pending"]),
    });

    const mutation = useMutation({
        mutationFn: ({
            id,
            status,
            reviewNotes,
        }: {
            id: string;
            status: Exclude<TeacherApplicationStatus, "pending">;
            reviewNotes?: string;
        }) =>
            reviewTeacherApplication(id, {
                status,
                reviewNotes,
                reviewerName: user?.name ?? reviewerRole.toUpperCase(),
                reviewerRole,
            }),
        onSuccess: (data: any) => {
            if (data?.credentials) {
                setNewCredentials(data.credentials);
            } else {
                toast({
                    title: "Candidature mise à jour",
                    description: "La décision a été enregistrée.",
                });
            }
            queryClient.invalidateQueries({ queryKey: ["teacherApplications"] });
            setDecisionDialog(null);
        },
        onError: (err: Error) => {
            toast({
                title: "Impossible de mettre à jour",
                description: err.message,
                variant: "destructive",
            });
        },
    });

    const applications = data ?? [];
    const pendingApplications = statusFilter === "pending" ? applications : pendingData ?? [];
    const pendingCount = pendingApplications.filter((app) => app.status === "pending").length;

    const filteredApplications = applications.filter((app) => {
        const term = searchTerm.toLowerCase();
        return (
            app.fullName.toLowerCase().includes(term) ||
            app.email.toLowerCase().includes(term) ||
            app.subjects.some((s) => s.toLowerCase().includes(term))
        );
    });

    const openDecision = (
        app: TeacherApplication,
        status: Exclude<TeacherApplicationStatus, "pending">
    ) => {
        setNotes("");
        setDecisionDialog({ app, status });
    };

    const copyCredentials = () => {
        if (!newCredentials) return;
        const text = newCredentials.alreadyExists
            ? `Bonjour ${newCredentials.name},\nVotre candidature a été validée. Votre compte enseignant a été lié à votre email existant : ${newCredentials.email}`
            : `Bonjour ${newCredentials.name},\nVotre candidature a été validée.\nVoici vos identifiants temporaires de connexion à Care4Success :\nEmail : ${newCredentials.email}\nMot de passe : ${newCredentials.password}`;
        navigator.clipboard.writeText(text);
        toast({ title: "Copié !", description: "Identifiants copiés dans le presse-papier." });
    };

    return (
        <div className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[#0D2D5A]">{title}</h1>
                    <p className="text-gray-500 mt-1">{description}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex gap-2 w-full md:w-auto bg-gray-50/80 p-1.5 rounded-xl border border-gray-100">
                    {STATUS_FILTERS.map((filter) => (
                        <button
                            key={filter.value}
                            onClick={() => setStatusFilter(filter.value)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${statusFilter === filter.value
                                ? "bg-white text-[#0D2D5A] shadow-sm border border-gray-200"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                }`}
                        >
                            {filter.label}
                            {filter.value === "pending" && pendingCount > 0 && (
                                <span className={`inline-flex items-center justify-center text-[10px] font-bold w-5 h-5 rounded-full ${statusFilter === filter.value ? "bg-[#1A6CC8] text-white" : "bg-gray-200 text-gray-600"}`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all outline-none"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    {error instanceof Error ? error.message : "Impossible de charger les candidatures."}
                </div>
            )}

            {isLoading ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-400 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#1A6CC8]" />
                    <p className="font-medium text-gray-500">Chargement des candidatures…</p>
                </div>
            ) : filteredApplications.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center text-gray-500 shadow-sm flex flex-col items-center justify-center min-h-[300px]">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <UserPlus className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-[#0D2D5A] mb-1">Aucune candidature</h3>
                    <p>Aucun profil ne correspond à vos critères pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredApplications.map((app) => {
                        const statusUi = STATUS_STYLES[app.status];
                        const initials = app.fullName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

                        return (
                            <div
                                key={app.id}
                                className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col"
                            >
                                <div className="p-6 flex-1 flex flex-col">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-4 items-center">
                                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#1A6CC8] to-[#0D2D5A] text-white flex items-center justify-center font-bold text-lg shadow-inner">
                                                {initials}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-[#0D2D5A] line-clamp-1" title={app.fullName}>
                                                    {app.fullName}
                                                </h3>
                                                <Badge className={`${statusUi.bg} ${statusUi.text} font-medium mt-1`} variant="outline">
                                                    {statusUi.label}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="truncate" title={app.email}>{app.email}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span>{app.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span><strong>{app.experienceYears} ans</strong> d'expérience</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                            <span className="truncate" title={app.availability}>{app.availability}</span>
                                        </div>

                                        <div className="pt-3 border-t border-gray-50 flex items-start gap-2">
                                            <GraduationCap className="w-4 h-4 text-[#1A6CC8] shrink-0 mt-0.5" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {app.subjects.map((subject) => (
                                                    <span
                                                        key={subject}
                                                        className="px-2 py-0.5 bg-[#1A6CC8]/5 text-[#1A6CC8] text-xs font-semibold rounded-md border border-[#1A6CC8]/10"
                                                    >
                                                        {subject}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {app.cvUrl && (
                                        <div className="mt-5">
                                            <a
                                                href={app.cvUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="w-full flex items-center justify-center gap-2 text-sm text-white bg-gray-900 hover:bg-gray-800 transition-colors py-2.5 rounded-xl font-medium"
                                            >
                                                <FileText className="w-4 h-4" />
                                                Voir le Curriculum Vitae
                                            </a>
                                        </div>
                                    )}

                                    {app.reviewNotes && (
                                        <div className="mt-4 p-3 bg-amber-50/50 border border-amber-100 rounded-xl text-xs text-amber-800">
                                            <span className="font-bold flex items-center gap-1 mb-1">
                                                <AlertCircle className="w-3 h-3" /> Note interne
                                            </span>
                                            {app.reviewNotes}
                                        </div>
                                    )}
                                </div>

                                {app.status === "pending" && (
                                    <div className="p-4 border-t border-gray-100 bg-gray-50 grid grid-cols-2 gap-3 mt-auto">
                                        <Button
                                            variant="outline"
                                            onClick={() => openDecision(app, "rejected")}
                                            className="w-full border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                        >
                                            <XCircle className="w-4 h-4 mr-1.5" />
                                            Refuser
                                        </Button>
                                        <Button
                                            onClick={() => openDecision(app, "approved")}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            <CheckCircle2 className="w-4 h-4 mr-1.5" />
                                            Valider
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <AlertDialog
                open={Boolean(decisionDialog)}
                onOpenChange={(open) => {
                    if (!open) setDecisionDialog(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la décision</AlertDialogTitle>
                        <AlertDialogDescription>
                            {decisionDialog?.status === "approved"
                                ? "Cette candidature sera validée et ajoutée à la base enseignants."
                                : "Cette candidature sera refusée et l'enseignant en sera informé."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="review-notes">Note interne (optionnel)</Label>
                        <Textarea
                            id="review-notes"
                            rows={4}
                            placeholder="Ajoutez un commentaire pour votre équipe..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (decisionDialog) {
                                    mutation.mutate({
                                        id: decisionDialog.app.id,
                                        status: decisionDialog.status,
                                        reviewNotes: notes,
                                    });
                                }
                            }}
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Enregistrement..." : "Confirmer"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Modal for Credentials Display */}
            <AlertDialog
                open={Boolean(newCredentials)}
                onOpenChange={(open) => {
                    if (!open) setNewCredentials(null);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-emerald-700 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5" />
                            Enseignant validé avec succès
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {newCredentials?.alreadyExists
                                ? "Cette adresse email possédait déjà un compte. Le rôle d'enseignant y a été rattaché."
                                : "Un nouveau compte de connexion a été généré automatiquement pour cet enseignant."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {newCredentials && (
                        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 my-4">
                            <div>
                                <span className="text-xs text-gray-500 font-semibold uppercase">Email de connexion</span>
                                <div className="font-medium text-[#0D2D5A] select-all">{newCredentials.email}</div>
                            </div>
                            {!newCredentials.alreadyExists && (
                                <div>
                                    <span className="text-xs text-gray-500 font-semibold uppercase">Mot de passe temporaire</span>
                                    <div className="font-mono font-medium text-[#0D2D5A] select-all">{newCredentials.password}</div>
                                </div>
                            )}
                        </div>
                    )}

                    <AlertDialogFooter>
                        <Button variant="outline" onClick={() => setNewCredentials(null)}>Fermer</Button>
                        <Button onClick={copyCredentials} className="bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white">
                            <Copy className="w-4 h-4 mr-2" />
                            Copier pour envoyer
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

        </div>
    );
}
