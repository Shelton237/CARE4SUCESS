import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { TutorProfileForm, EMPTY_TUTOR_PROFILE, type TutorProfile } from "./TutorProfileForm";

const API = import.meta.env.VITE_API_URL || "/api";

// Onglet du profil enseignant : ce que le tuteur renseigne pour être proposé aux bons élèves.
export default function MyMatchingProfile() {
    const { token } = useAuth();
    const qc = useQueryClient();
    const { data, isLoading, isError } = useQuery<TutorProfile>({
        queryKey: ["myMatchingProfile"],
        queryFn: async () => {
            const res = await fetch(`${API}/teachers/me/matching-profile`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Impossible de charger le profil");
            return res.json();
        },
        enabled: !!token,
    });
    const save = useMutation({
        mutationFn: async (payload: Partial<TutorProfile>) => {
            const res = await fetch(`${API}/teachers/me/matching-profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Enregistrement impossible");
            return body as TutorProfile;
        },
        onSuccess: (profile) => {
            qc.setQueryData(["myMatchingProfile"], profile);
            toast.success("Profil de matching enregistré");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    if (isLoading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-[#0F9B8E]" /></div>;
    if (isError) return <p className="text-sm text-red-600">Impossible de charger votre profil de matching.</p>;

    return (
        <div className="space-y-4">
            <p className="text-sm text-gray-500">
                Ces informations servent au conseiller pédagogique pour vous proposer des élèves adaptés à vos matières, vos niveaux, votre zone et vos disponibilités.
                Votre tarif est fixé avec l'équipe Care4Success.
            </p>
            <TutorProfileForm value={data ?? EMPTY_TUTOR_PROFILE} onSave={p => save.mutate(p)} saving={save.isPending} />
        </div>
    );
}
