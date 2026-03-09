import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleByRole } from "@/api/backoffice";
import type { SessionStatus } from "@/integrations/supabase/types";
import { studentStats } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, MapPin, GraduationCap, CheckCircle2, Clock, Circle, RefreshCw, Video, MonitorPlay, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; Icon: typeof Clock }> = {
    "effectué": { label: "Effectué", color: "text-emerald-600", bg: "bg-emerald-50", Icon: CheckCircle2 },
    "à venir": { label: "À venir", color: "text-[#1A6CC8]", bg: "bg-blue-50", Icon: Clock },
    "planifié": { label: "Planifié", color: "text-gray-400", bg: "bg-gray-50", Icon: Circle },
};

const DAYS_OF_WEEK = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

export default function StudentSchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [viewedNote, setViewedNote] = useState<any | null>(null);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["schedule", "student", user?.id],
        queryFn: () => fetchScheduleByRole("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const schedule = useMemo(() => data ?? [], [data]);

    const sessionsByDay = useMemo(
        () =>
            DAYS_OF_WEEK.map((day) => ({
                day,
                sessions: schedule.filter((s) => s.day === day),
            })),
        [schedule]
    );

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour visualiser votre planning.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon planning</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Consultez vos cours à venir et vos bilans de séance.
                    </p>
                </div>
                <div className="hidden md:flex gap-2">
                    {(Object.keys(STATUS_CONFIG) as SessionStatus[]).map((key) => {
                        const { label, color, bg } = STATUS_CONFIG[key];
                        return (
                            <span key={key} className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-transparent ${bg} ${color}`}>
                                {label}
                            </span>
                        );
                    })}
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
                {sessionsByDay.map(({ day, sessions }) => (
                    <div key={day} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div
                            className={`px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wide ${sessions.length > 0 ? "bg-[#1A6CC8] text-white" : "bg-gray-50 text-gray-400"
                                }`}
                        >
                            {day.slice(0, 3)}
                        </div>
                        <div className="p-3 min-h-[120px] space-y-3 flex-1">
                            {sessions.map((s) => {
                                const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["planifié"];
                                const highlight = s.status === "à venir";
                                const timeStart = (s.time || "").split("-")[0]?.trim() || s.time;
                                return (
                                    <div
                                        key={s.id}
                                        className={`rounded-xl p-3 border transition-all ${s.status === 'effectué' ? 'bg-emerald-50/20 border-emerald-100 opacity-80' : highlight ? 'bg-[#1A6CC8]/5 border-[#1A6CC8]/20 shadow-sm' : 'bg-gray-50/50 border-gray-100'}`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <div className={`text-[10px] font-bold ${highlight ? "text-[#1A6CC8]" : "text-gray-400"}`}>{timeStart}</div>
                                            {s.status === 'effectué' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                                        </div>
                                        <div className="text-xs font-bold text-[#0D2D5A] truncate">{s.subject}</div>
                                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1">
                                            <MapPin className="w-2.5 h-2.5" />
                                            {s.location}
                                        </div>

                                        {(s.virtualLink || s.location.toLowerCase().includes("ligne")) && s.status !== "effectué" && (
                                            <Button
                                                size="sm"
                                                onClick={() => navigate(`/virtual-class/${s.id}`)}
                                                className="w-full h-7 mt-3 text-[10px] font-bold bg-[#1A6CC8] hover:bg-[#0D2D5A]"
                                            >
                                                <Video className="w-3 h-3 mr-1" />
                                                Rejoindre
                                            </Button>
                                        )}

                                        {s.status === 'effectué' && s.notes && (
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setViewedNote(s)}
                                                className="w-full h-7 mt-2 text-[10px] gap-1 text-emerald-700 hover:bg-emerald-100/50"
                                            >
                                                <FileText className="w-3 h-3" />
                                                Bilan
                                            </Button>
                                        )}
                                    </div>
                                );
                            })}
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
                    <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                        <CalendarDays className="w-4 h-4 text-[#22c55e]" />
                    </div>
                    <h2 className="font-bold text-[#0D2D5A] text-sm">Historique de mes cours</h2>
                    <span className="ml-auto text-xs text-gray-400">{schedule.length} séances</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {schedule.map((s) => {
                        const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG["planifié"];
                        const dateParts = (s.date || "").split("/");
                        return (
                            <div key={s.id} className="flex items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="w-14 text-center flex-shrink-0">
                                    <div className="text-[10px] font-bold text-[#1A6CC8]">{s.day.slice(0, 3).toUpperCase()}</div>
                                    <div className="text-2xl font-bold text-[#0D2D5A]">{dateParts[0] || "????"}</div>
                                    <div className="text-[10px] text-gray-400">/{dateParts[1] || "??"}</div>
                                </div>
                                <div className="w-px h-12 bg-gray-100" />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0D2D5A]">{s.subject}</div>
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
                                <div className="text-right flex-shrink-0 flex flex-col items-end gap-2 text-right">
                                    <div className="text-sm font-semibold text-[#0D2D5A]">{s.time}</div>
                                    <div className="flex items-center gap-2">
                                        {(s.virtualLink || s.location.includes("ligne")) && s.status !== "effectué" && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => navigate(`/virtual-class/${s.id}`)}
                                                className="h-7 px-3 text-[10px] font-bold rounded-full border-[#1A6CC8]/20 text-[#1A6CC8]"
                                            >
                                                <MonitorPlay className="w-3 h-3 mr-1" />
                                                Lien Visio
                                            </Button>
                                        )}
                                        {s.status === 'effectué' && s.notes && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setViewedNote(s)}
                                                className="h-7 px-3 text-[10px] font-bold rounded-full border-emerald-200 text-emerald-700 bg-emerald-50/50"
                                            >
                                                <FileText className="w-3 h-3 mr-1" />
                                                Bilan
                                            </Button>
                                        )}
                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${cfg.bg} ${cfg.color}`}>
                                            <cfg.Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {schedule.length === 0 && !isLoading && (
                        <div className="px-6 py-8 text-center text-xs text-gray-400 italic">Aucun cours planifié pour le moment.</div>
                    )}
                </div>
            </div>

            <Dialog open={!!viewedNote} onOpenChange={(open) => !open && setViewedNote(null)}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-[#0D2D5A]">
                            <FileText className="w-5 h-5 text-[#1A6CC8]" />
                            Bilan de ta séance
                        </DialogTitle>
                        <DialogDescription>
                            Cours de {viewedNote?.subject} avec {viewedNote?.teacher} du {viewedNote?.date}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-5 bg-[#1A6CC8]/5 rounded-2xl border border-[#1A6CC8]/10">
                        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed italic">
                            "{viewedNote?.notes}"
                        </div>
                    </div>
                    <div className="mt-4 text-[11px] text-center text-gray-400">
                        Continue tes efforts ! Ta progression est suivie par l'équipe Care4Success.
                    </div>
                    <div className="mt-6">
                        <Button onClick={() => setViewedNote(null)} className="w-full bg-[#1A6CC8]">
                            Compris !
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
