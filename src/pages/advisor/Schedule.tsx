import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { CalendarDays, AlertCircle, Check, Loader2, Plus, Clock, Users, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createAdvisorAppointment, fetchAdvisorAppointments } from "@/api/backoffice";
import { useToast } from "@/hooks/use-toast";

interface Appointment {
    id: string;
    family: string;
    type: string;
    date: string;
    time: string;
    status: "planifié" | "réalisé" | "annulé";
}

export default function AdvisorSchedule() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Si on vient du bouton "Planifier RDV" de Mes Familles
    const targeted = location.state as { familyName?: string; } | null;
    const targetFamily = targeted?.familyName ?? null;

    // Formulaire
    const [familySelect, setFamilySelect] = useState(targetFamily || "");
    const [typeSelect, setTypeSelect] = useState("Suivi régulier");
    const [dateSelect, setDateSelect] = useState("");
    const [timeSelect, setTimeSelect] = useState("");

    const { data: appointments = [], isLoading } = useQuery({
        queryKey: ["advisorAppointments", user?.id],
        queryFn: () => fetchAdvisorAppointments(user!.id),
        enabled: !!user?.id,
    });

    const mutation = useMutation({
        mutationFn: (payload: any) => createAdvisorAppointment(user!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["advisorAppointments", user?.id] });
            toast({
                title: "Rendez-vous planifié",
                description: `Le rendez-vous avec ${familySelect} a été enregistré.`,
            });
            // Reset state
            if (!targetFamily) setFamilySelect("");
            setTypeSelect("Suivi régulier");
            setDateSelect("");
            setTimeSelect("");
        },
        onError: () => {
            toast({
                variant: "destructive",
                title: "Erreur",
                description: "Impossible de planifier le rendez-vous.",
            });
        }
    });

    const handleSchedule = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate({
            family: familySelect,
            type: typeSelect,
            date: dateSelect,
            time: timeSelect,
        });
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Planificateur & Rendez-vous</h1>
                <p className="text-gray-500 text-sm mt-1">Gérez vos rendez-vous avec les familles et enseignants</p>
            </div>

            {targetFamily && (
                <div className="flex items-center gap-3 bg-[#1A6CC8]/10 border border-[#1A6CC8]/20 rounded-xl px-5 py-3">
                    <CalendarDays className="w-5 h-5 text-[#1A6CC8] flex-shrink-0" />
                    <div className="flex-1 text-sm">
                        <span className="font-bold text-[#0D2D5A]">Planification de rendez-vous</span>
                        <span className="text-gray-500 ml-2">pour la famille <span className="font-semibold text-[#1A6CC8]">{targetFamily}</span></span>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1 text-xs font-bold text-[#1A6CC8] hover:underline"
                    >
                        <ArrowLeft className="w-3 h-3" /> Retour
                    </button>
                </div>
            )}

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Formulaire de planification */}
                <div className="lg:col-span-1 border border-gray-100 bg-white rounded-2xl shadow-sm p-6 space-y-6 h-fit">
                    <div className="flex items-center gap-2 text-[#0D2D5A] font-bold pb-4 border-b border-gray-100">
                        <Plus className="w-5 h-5 text-[#1A6CC8]" />
                        <h2>Nouveau rendez-vous</h2>
                    </div>

                    <form onSubmit={handleSchedule} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase">Famille / Contact</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    required
                                    value={familySelect}
                                    onChange={e => setFamilySelect(e.target.value)}
                                    placeholder="Nom de la famille"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-9 pr-3 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase">Type de RDV</label>
                            <select
                                value={typeSelect}
                                onChange={e => setTypeSelect(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none"
                            >
                                <option>Bilan initial</option>
                                <option>Suivi régulier</option>
                                <option>Rencontre prof</option>
                                <option>Résolution de problème</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Date</label>
                                <input
                                    type="date"
                                    required
                                    value={dateSelect}
                                    onChange={e => setDateSelect(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-400 uppercase">Heure</label>
                                <input
                                    type="time"
                                    required
                                    value={timeSelect}
                                    onChange={e => setTimeSelect(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 px-3 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={mutation.isPending}
                            className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-[#1A6CC8] text-white rounded-xl font-bold text-sm hover:bg-[#1557A3] transition-colors disabled:opacity-70"
                        >
                            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            Confirmer le rendez-vous
                        </button>
                    </form>
                </div>

                {/* Liste des rendez-vous */}
                <div className="lg:col-span-2 space-y-4">
                    <h2 className="text-lg font-bold text-[#0D2D5A] mb-4">Mes prochains rendez-vous</h2>

                    {isLoading ? (
                        <div className="flex justify-center p-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8] opacity-50" />
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="border border-gray-100 bg-white rounded-2xl p-8 text-center text-gray-400 text-sm">
                            Aucun rendez-vous planifié.
                        </div>
                    ) : (
                        appointments.map((appt: any) => (
                            <div key={appt.id} className="group bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:border-[#1A6CC8]/30 transition-all flex items-center gap-5">
                                <div className="bg-[#1A6CC8]/10 text-[#1A6CC8] w-14 h-14 rounded-2xl flex flex-col items-center justify-center flex-shrink-0">
                                    <Clock className="w-5 h-5 mb-0.5" />
                                    <span className="text-[10px] font-bold">{appt.time}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold text-[#0D2D5A] truncate">{appt.family}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${appt.status === 'réalisé' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                                            }`}>
                                            {appt.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" /> {appt.date}</span>
                                        <span className="flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5" /> {appt.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
