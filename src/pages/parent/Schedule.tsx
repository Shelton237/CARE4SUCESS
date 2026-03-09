import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleByRole } from "@/api/backoffice";
import type { SessionStatus } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, MapPin, GraduationCap, RefreshCw, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const STATUS_COLORS: Record<SessionStatus, string> = {
    "effectué": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "à venir": "bg-blue-50 text-blue-600 border-blue-200",
    "planifié": "bg-gray-50 text-gray-400 border-gray-100",
};

export default function ParentSchedule() {
    const { user } = useAuth();
    const [viewedNote, setViewedNote] = useState<any | null>(null);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const weekSessions = useMemo(() => {
        const sessions = data ?? [];
        return WEEK_DAYS.map((day) => {
            const daySessions = sessions.filter((s) => s.day === day);
            const displayDate = daySessions[0]?.date ?? "--/--";
            return {
                dayLabel: day,
                date: displayDate,
                sessions: daySessions,
            };
        });
    }, [data]);

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour consulter le planning de votre famille.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Planning des cours</h1>
                    <p className="text-gray-500 text-sm mt-1">Suivez les interventions pédagogiques auprès de vos enfants.</p>
                </div>
                <div className="hidden md:flex gap-2">
                    {(Object.keys(STATUS_COLORS) as SessionStatus[]).map((status) => (
                        <span key={status} className={`text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider ${STATUS_COLORS[status]}`}>
                            {status}
                        </span>
                    ))}
                </div>
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {weekSessions.map(({ dayLabel, date, sessions }) => (
                    <div key={dayLabel} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div
                            className={`px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${sessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-gray-50 text-gray-400"
                                }`}
                        >
                            {dayLabel.slice(0, 3)}
                            <div className="text-[10px] font-normal opacity-80 mt-0.5 normal-case">{date}</div>
                        </div>
                        <div className="p-3 min-h-[120px] space-y-3 flex-1">
                            {sessions.map((s) => (
                                <div key={s.id} className={`rounded-xl p-3 border transition-all ${s.status === 'effectué' ? 'bg-emerald-50/30 border-emerald-100' : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10'}`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-[10px] font-bold ${s.status === 'effectué' ? 'text-emerald-600' : 'text-[#1A6CC8]'}`}>{s.time}</div>
                                        {s.status === 'effectué' && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                    </div>
                                    <div className="text-xs font-bold text-[#0D2D5A]">{s.subject}</div>
                                    <div className="text-[10px] text-gray-500 mt-0.5">{s.student}</div>

                                    {s.status === 'effectué' && s.notes && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setViewedNote(s)}
                                            className="w-full h-6 mt-2 text-[10px] gap-1 text-emerald-700 hover:bg-emerald-100/50 p-0"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Voir bilan
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="flex items-center justify-center h-16 text-gray-200 text-[10px] italic">
                                    {isLoading ? "..." : "Libre"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    <h2 className="font-bold text-[#0D2D5A] text-sm">Historique des cours</h2>
                    <span className="ml-auto text-xs text-gray-400">{data?.length ?? 0} séances</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {(data ?? []).map((s) => (
                        <div key={s.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="w-12 text-center flex-shrink-0">
                                <div className="text-[10px] font-bold text-[#1A6CC8]">{s.day.slice(0, 3).toUpperCase()}</div>
                                <div className="text-lg font-bold text-[#0D2D5A]">{s.date.split("/")[0]}</div>
                            </div>
                            <div className="w-px h-10 bg-gray-100" />
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#0D2D5A] text-sm flex items-center gap-2">
                                    {s.subject}
                                    <span className="text-[10px] font-normal text-gray-400">— {s.student}</span>
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <GraduationCap className="w-3 h-3" />
                                        {s.teacher}
                                    </span>
                                    <span className="flex items-center gap-1 text-xs text-gray-400">
                                        <MapPin className="w-3 h-3" />
                                        {s.location}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <div className="text-sm font-semibold text-[#0D2D5A]">{s.time}</div>
                                <div className="flex items-center gap-2">
                                    {s.status === 'effectué' && s.notes && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setViewedNote(s)}
                                            className="h-6 text-[10px] gap-1 border-emerald-200 text-emerald-700 bg-emerald-50/50"
                                        >
                                            <FileText className="w-3 h-3" />
                                            Bilan
                                        </Button>
                                    )}
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STATUS_COLORS[s.status]}`}>
                                        {s.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data?.length === 0 && !isLoading && (
                        <div className="px-6 py-8 text-center text-xs text-gray-400 italic">Aucune séance enregistrée pour le moment.</div>
                    )}
                </div>
            </div>

            <Dialog open={!!viewedNote} onOpenChange={(open) => !open && setViewedNote(null)}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A]">
                            <FileText className="w-5 h-5 text-[#1A6CC8]" />
                            Bilan de séance
                        </DialogTitle>
                        <DialogDescription>
                            Cours de {viewedNote?.subject} pour {viewedNote?.student} du {viewedNote?.date}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                            "{viewedNote?.notes}"
                        </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Professeur : {viewedNote?.teacher}</span>
                        <span>Statut : Validé par le conseiller</span>
                    </div>
                    <div className="mt-6">
                        <Button onClick={() => setViewedNote(null)} className="w-full bg-[#1A6CC8]">
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
