import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchScheduleByRole, updateSessionNotes, updateSessionStatus } from "@/api/backoffice";
import type { ScheduleSession } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { RefreshCw, Video, CheckCircle, FileText, Loader2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";

const DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function TeacherSchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [selectedSession, setSelectedSession] = useState<ScheduleSession | null>(null);
    const [reportText, setReportText] = useState("");

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["schedule", "teacher", user?.id],
        queryFn: () => fetchScheduleByRole("teacher", user!.id),
        enabled: Boolean(user?.id),
    });

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) => updateSessionStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule"] });
            toast({ title: "Statut mis à jour", description: "La séance a été marquée comme effectuée." });
        }
    });

    const reportMutation = useMutation({
        mutationFn: ({ id, notes }: { id: string; notes: string }) => updateSessionNotes(id, notes),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["schedule"] });
            setSelectedSession(null);
            setReportText("");
            toast({ title: "Compte-rendu enregistré", description: "Le bilan a été transmis au conseiller et aux parents." });
        }
    });

    const grouped = useMemo(() => {
        const map = new Map<string, ScheduleSession[]>();
        (data ?? []).forEach((session) => {
            const list = map.get(session.day) ?? [];
            list.push(session);
            map.set(session.day, list);
        });
        return map;
    }, [data]);

    const handleOpenReport = (session: ScheduleSession) => {
        setSelectedSession(session);
        setReportText(session.notes || "");
    };

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour voir le planning enseignant.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon planning</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez vos séances et rédigez vos bilans.</p>
                </div>
                {isLoading && <Loader2 className="w-5 h-5 animate-spin text-[#1A6CC8]" />}
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>{error instanceof Error ? error.message : "Impossible de charger le planning."}</span>
                    <button
                        onClick={() => refetch()}
                        className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Réessayer
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {DAYS.map((day) => {
                    const sessions = grouped.get(day) ?? [];
                    return (
                        <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                            <div
                                className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider ${sessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-gray-50 text-gray-400"
                                    }`}
                            >
                                {day.slice(0, 3)}
                            </div>
                            <div className="p-3 space-y-3 flex-1 min-h-[150px]">
                                {sessions.map((s) => (
                                    <div key={s.id} className={`rounded-xl p-3 border transition-all ${s.status === 'effectué' ? 'bg-gray-50 border-gray-100 opacity-75' : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10 shadow-sm'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs font-bold text-[#1A6CC8]">{s.time}</div>
                                            {s.status === 'effectué' && <CheckCircle className="w-3 h-3 text-emerald-500" />}
                                        </div>
                                        <div className="text-xs font-bold text-[#0D2D5A] mt-1">{s.student}</div>
                                        <div className="text-[10px] text-gray-500">{s.subject}</div>

                                        <div className="mt-3 space-y-1.5 pt-2 border-t border-gray-100">
                                            {s.status !== 'effectué' ? (
                                                <>
                                                    {(s.virtualLink || s.location.toLowerCase().includes("ligne")) && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => navigate(`/virtual-class/${s.id}`)}
                                                            className="w-full h-7 text-[10px] gap-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            <Video className="w-3 h-3" />
                                                            Lancer
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={() => statusMutation.mutate({ id: s.id, status: 'effectué' })}
                                                        disabled={statusMutation.isPending}
                                                        className="w-full h-7 text-[10px] gap-1 bg-[#1A6CC8]"
                                                    >
                                                        {statusMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                                                        Terminé
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleOpenReport(s)}
                                                    className="w-full h-7 text-[10px] gap-1 text-[#1A6CC8] hover:bg-[#1A6CC8]/10"
                                                >
                                                    <FileText className="w-3 h-3" />
                                                    {s.notes ? "Voir bilan" : "Rédiger bilan"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {sessions.length === 0 && (
                                    <div className="flex items-center justify-center h-16 text-gray-200 text-[10px] font-medium italic">
                                        {isLoading ? "..." : "Aucun cours"}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            <Drawer open={!!selectedSession} onOpenChange={(open) => !open && setSelectedSession(null)}>
                <DrawerContent>
                    <div className="mx-auto w-full max-w-lg">
                        <DrawerHeader>
                            <DrawerTitle>Bilan de séance</DrawerTitle>
                            <DrawerDescription>
                                Séance de {selectedSession?.subject} avec {selectedSession?.student} du {selectedSession?.date}.
                            </DrawerDescription>
                        </DrawerHeader>
                        <div className="p-4 pb-8 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Progression, points forts et axes d'amélioration :</label>
                                <Textarea
                                    value={reportText}
                                    onChange={(e) => setReportText(e.target.value)}
                                    placeholder="L'élève a bien compris le concept de... Il doit encore travailler sur..."
                                    className="min-h-[150px] text-sm"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => selectedSession && reportMutation.mutate({ id: selectedSession.id, notes: reportText })}
                                    disabled={reportMutation.isPending || !reportText.trim()}
                                    className="flex-1 bg-[#1A6CC8]"
                                >
                                    {reportMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />}
                                    Enregistrer le bilan
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => navigate(`/teacher/homework?studentId=${selectedSession?.studentId}&subject=${selectedSession?.subject}&sessionId=${selectedSession?.id}`)}
                                    className="border-blue-200 text-blue-600"
                                >
                                    <ClipboardList className="w-4 h-4 mr-2" />
                                    Donner un devoir
                                </Button>
                            </div>
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>
    );
}
