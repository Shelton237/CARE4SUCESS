import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, Send, Pencil, ChevronUp, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { TutorProfileForm, CompletenessBar, type TutorProfile } from "@/components/tutor/TutorProfileForm";

const API = import.meta.env.VITE_API_URL || "/api";
const BTN = "inline-flex items-center justify-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50";

const formatRate = (t: TutorProfile) =>
    t.rate >= 500
        ? `${new Intl.NumberFormat("fr-FR").format(t.rate)} ${["XAF", "XOF"].includes(t.currency) ? "FCFA" : t.currency}/h${t.currency === "XOF" ? " (XOF)" : ""}`
        : null;

export default function AdvisorTutors() {
    const { token } = useAuth();
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState("");
    const [onlyIncomplete, setOnlyIncomplete] = useState(false);
    const openId = searchParams.get("id");

    const { data: tutors = [], isLoading, isError, refetch } = useQuery<TutorProfile[]>({
        queryKey: ["advisorTutors"],
        queryFn: async () => {
            const res = await fetch(`${API}/advisor/tutors`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) throw new Error("Impossible de charger les tuteurs");
            return res.json();
        },
        enabled: !!token,
    });

    useEffect(() => {
        if (openId) document.getElementById(`tutor-${openId}`)?.scrollIntoView({ block: "center" });
    }, [openId, tutors.length]);

    const save = useMutation({
        mutationFn: async ({ id, payload }: { id: string; payload: Partial<TutorProfile> }) => {
            const res = await fetch(`${API}/advisor/tutors/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload),
            });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Enregistrement impossible");
            return body as TutorProfile;
        },
        onSuccess: (tutor) => {
            qc.setQueryData<TutorProfile[]>(["advisorTutors"], prev => (prev || []).map(t => (t.id === tutor.id ? tutor : t)));
            qc.invalidateQueries({ queryKey: ["matching"] });
            toast.success(`Profil de ${tutor.name} enregistré`);
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const remind = useMutation({
        mutationFn: async (t: TutorProfile) => {
            const res = await fetch(`${API}/advisor/tutors/${t.id}/remind`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
            const body = await res.json().catch(() => null);
            if (!res.ok) throw new Error(body?.message || "Relance impossible");
            return t;
        },
        onSuccess: (t) => toast.success(`Relance envoyée à ${t.name}`),
        onError: (e: Error) => toast.error(e.message),
    });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return tutors.filter(t =>
            (!q || (t.name || "").toLowerCase().includes(q) || t.subjects.some(s => s.toLowerCase().includes(q))) &&
            (!onlyIncomplete || (t.completeness?.percent ?? 0) < 100)
        );
    }, [tutors, search, onlyIncomplete]);

    const incomplete = tutors.filter(t => (t.completeness?.percent ?? 0) < 100).length;

    return (
        <div className="p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            <div>
                <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Tuteurs</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                    Complétez les profils pour un matching fiable : matières, niveaux, zone, disponibilités et tarif.
                    {tutors.length > 0 && <> {incomplete} profil{incomplete > 1 ? "s" : ""} sur {tutors.length} à compléter.</>}
                </p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center gap-3 px-5 py-4 border-b border-gray-100">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-4 h-4" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un tuteur ou une matière..."
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#0F9B8E]/20 focus:border-[#0F9B8E]"
                        />
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-600">
                        <input type="checkbox" checked={onlyIncomplete} onChange={e => setOnlyIncomplete(e.target.checked)} className="accent-[#0F9B8E]" />
                        Profils incomplets uniquement
                    </label>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#0F9B8E]" /></div>
                ) : isError ? (
                    <div className="p-5 flex items-center justify-between text-sm text-red-700 bg-red-50">
                        Impossible de charger les tuteurs.
                        <button onClick={() => refetch()} className="inline-flex items-center gap-1 text-xs font-semibold"><RefreshCw className="w-3 h-3" /> Réessayer</button>
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-12">Aucun tuteur ne correspond.</p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {filtered.map(t => {
                            const open = openId === t.id;
                            const rate = formatRate(t);
                            return (
                                <li key={t.id} id={`tutor-${t.id}`} className={cn("px-5 py-4", open && "bg-[#0F9B8E]/[0.03]")}>
                                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                                        <div className="min-w-0 lg:w-56">
                                            <p className="font-bold text-[#0D2D5A] truncate">{t.name}</p>
                                            <p className="text-xs text-gray-400 truncate">{t.subjects.length ? t.subjects.join(", ") : "Aucune matière"}</p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <CompletenessBar completeness={t.completeness} />
                                        </div>
                                        <div className="lg:w-36 text-sm">
                                            {rate ? <span className="text-[#0D2D5A]">{rate}</span> : <span className="font-semibold text-amber-600">Tarif à vérifier</span>}
                                        </div>
                                        <div className="flex gap-2 shrink-0">
                                            {(t.completeness?.percent ?? 0) < 100 && (
                                                <button
                                                    onClick={() => remind.mutate(t)}
                                                    disabled={remind.isPending && remind.variables?.id === t.id}
                                                    className={`${BTN} border border-gray-200 bg-white text-[#0D2D5A] hover:bg-gray-50`}
                                                >
                                                    {remind.isPending && remind.variables?.id === t.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Relancer
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setSearchParams(open ? {} : { id: t.id! })}
                                                aria-expanded={open}
                                                className={`${BTN} ${open ? "bg-gray-100 text-[#0D2D5A]" : "bg-[#0D2D5A] text-white hover:bg-[#0D2D5A]/90"}`}
                                            >
                                                {open ? <><ChevronUp className="w-4 h-4" /> Fermer</> : <><Pencil className="w-4 h-4" /> Compléter</>}
                                            </button>
                                        </div>
                                    </div>
                                    {open && (
                                        <div className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
                                            <TutorProfileForm
                                                value={t}
                                                allowRate
                                                saving={save.isPending}
                                                onSave={payload => save.mutate({ id: t.id!, payload })}
                                            />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </div>
        </div>
    );
}
