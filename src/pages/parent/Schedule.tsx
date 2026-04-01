import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { fetchScheduleByRole } from "@/api/backoffice";
import type { SessionStatus } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, MapPin, GraduationCap, RefreshCw, FileText, ChevronLeft } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

const WEEK_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

const STATUS_COLORS: Record<SessionStatus, string> = {
    "effectué": "bg-emerald-50 text-emerald-600 border-emerald-100",
    "à venir": "bg-[#1A6CC8]/10 text-[#1A6CC8] border-[#1A6CC8]/20",
    "planifié": "bg-slate-50 text-slate-400 border-slate-100",
};

export default function ParentSchedule() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const studentIdFilter = searchParams.get("studentId");
    const [viewedNote, setViewedNote] = useState<any | null>(null);

    const { data, isLoading, isError, error, refetch } = useQuery({
        queryKey: ["schedule", "parent", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const filteredSessions = useMemo(() => {
        let sessions = data ?? [];
        if (studentIdFilter) {
            sessions = sessions.filter((s: any) => String(s.studentId) === studentIdFilter);
        }
        return sessions;
    }, [data, studentIdFilter]);

    const weekSessions = useMemo(() => {
        const sessions = filteredSessions;
        return WEEK_DAYS.map((day) => {
            const daySessions = sessions.filter((s) => s.day === day);
            const displayDate = daySessions[0]?.date ?? "--/--";
            return {
                dayLabel: day,
                date: displayDate,
                sessions: daySessions,
            };
        });
    }, [filteredSessions]);

    if (!user) return null;

    const studentName = studentIdFilter && filteredSessions.length > 0 
        ? filteredSessions[0].student 
        : (studentIdFilter ? "de l'élève" : "de la famille");

    return (
        <div className="p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-4">
                    {studentIdFilter && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(-1)}
                            className="h-8 px-2 hover:bg-slate-50 text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                    )}
                    <div>
                        <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                            Planning {studentName}
                            <CalendarDays className="w-5 h-5 text-[#1A6CC8]" />
                        </h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Calendrier des interventions pédagogiques</p>
                    </div>
                </div>
                <div className="hidden md:flex gap-2">
                    {(Object.keys(STATUS_COLORS) as SessionStatus[]).map((status) => (
                        <span key={status} className={`text-[9px] font-black px-2 py-0.5 border rounded-none uppercase tracking-widest ${STATUS_COLORS[status]}`}>
                            {status}
                        </span>
                    ))}
                </div>
            </div>

            {isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-xs p-3 flex items-center justify-between rounded-none">
                    <span>{error instanceof Error ? error.message : "Impossible de charger le planning."}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => refetch()}
                        className="h-7 text-[10px] font-black uppercase text-red-700 hover:bg-red-100"
                    >
                        <RefreshCw className="w-3 h-3 mr-1" /> Réessayer
                    </Button>
                </div>
            )}

            {/* Weekly Grid - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {weekSessions.map(({ dayLabel, date, sessions }) => (
                    <div key={dayLabel} className="border border-slate-100 bg-white shadow-none flex flex-col">
                        <div className={`px-2 py-1.5 text-center border-b border-slate-100 ${
                            sessions.length > 0 ? "bg-[#0D2D5A] text-white" : "bg-slate-50 text-slate-300"
                        }`}>
                            <div className="text-[10px] font-black uppercase tracking-widest">{dayLabel.slice(0, 3)}</div>
                            <div className="text-[9px] font-bold opacity-70">{date}</div>
                        </div>
                        <div className="p-2 min-h-[100px] space-y-2 flex-1 bg-slate-50/20">
                            {sessions.map((s) => (
                                <div key={s.id} className={`p-2 border rounded-none transition-all ${
                                    s.status === 'effectué' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-slate-200'
                                }`}>
                                    <div className="flex items-center justify-between mb-1">
                                        <div className={`text-[9px] font-black ${s.status === 'effectué' ? 'text-emerald-600' : 'text-[#1A6CC8]'}`}>
                                            {s.time}
                                        </div>
                                        {s.status === 'à venir' && <div className="w-1.5 h-1.5 rounded-full bg-[#F5A623] animate-pulse" />}
                                    </div>
                                    <div className="text-[11px] font-black text-[#0D2D5A] leading-tight uppercase truncate">{s.subject}</div>
                                    <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{s.student}</div>

                                    {s.status === 'effectué' && s.notes && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => setViewedNote(s)}
                                            className="w-full h-5 mt-2 text-[8px] font-black uppercase text-emerald-700 hover:bg-emerald-100 p-0 rounded-none bg-emerald-50"
                                        >
                                            <FileText className="w-2.5 h-2.5 mr-1" /> Rapport
                                        </Button>
                                    )}
                                </div>
                            ))}
                            {sessions.length === 0 && (
                                <div className="flex items-center justify-center h-full text-slate-200 text-[9px] font-black uppercase tracking-widest">
                                    {isLoading ? "..." : "Libre"}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* List View - Dense */}
            <div className="border border-slate-100 bg-white shadow-none">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                        <CalendarDays className="w-3.5 h-3.5 text-[#1A6CC8]" />
                        {studentIdFilter ? `Historique de l'élève` : 'Vue d\'ensemble familiale'}
                    </h2>
                    <Badge variant="outline" className="ml-auto text-[9px] font-black uppercase border-slate-200 text-slate-400 rounded-none h-5">
                        {filteredSessions.length} Séances
                    </Badge>
                </div>
                <div className="divide-y divide-slate-50">
                    {filteredSessions.map((s: any) => (
                        <div key={s.id} className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 transition-colors group">
                            <div className="w-10 text-center flex-shrink-0">
                                <div className="text-[9px] font-black text-[#1A6CC8] tracking-tighter">{s.day.slice(0, 3).toUpperCase()}</div>
                                <div className="text-sm font-black text-[#0D2D5A] leading-none">{s.date.split("/")[0]}</div>
                            </div>
                            <div className="w-px h-6 bg-slate-100" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-black text-[#0D2D5A] text-[11px] uppercase truncate">{s.subject}</h4>
                                    {!studentIdFilter && (
                                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-1">{s.student}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5">
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                        <GraduationCap className="w-3 h-3 text-[#1A6CC8]" />
                                        {s.teacher}
                                    </span>
                                    <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold truncate">
                                        <MapPin className="w-3 h-3" />
                                        {s.location}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-1.5">
                                <div className="text-[11px] font-black text-[#0D2D5A]">{s.time}</div>
                                <div className="flex items-center gap-2">
                                    {s.status === 'effectué' && s.notes && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setViewedNote(s)}
                                            className="h-5 text-[8px] font-black uppercase text-emerald-700 border-emerald-100 bg-emerald-50 rounded-none px-2"
                                        >
                                            <FileText className="w-2.5 h-2.5 mr-1" /> Rapport
                                        </Button>
                                    )}
                                    <Badge className={`text-[8px] font-black uppercase px-2 h-4 rounded-none border ${STATUS_COLORS[s.status as SessionStatus]}`}>
                                        {s.status}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredSessions.length === 0 && !isLoading && (
                        <div className="px-6 py-10 text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">Aucune séance enregistrée</div>
                    )}
                </div>
            </div>

            {/* Bilan Modal */}
            <Dialog open={!!viewedNote} onOpenChange={(open) => !open && setViewedNote(null)}>
                <DialogContent className="sm:max-w-[450px] rounded-none border-t-4 border-t-[#1A6CC8] p-6 shadow-none">
                    <DialogHeader>
                        <DialogTitle className="text-sm font-black uppercase tracking-widest text-[#0D2D5A] flex items-center gap-2">
                            <FileText className="w-4 h-4 text-[#1A6CC8]" /> Bilan de séance
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                            {viewedNote?.subject} • {viewedNote?.student} • {viewedNote?.date}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4 p-4 bg-slate-50/50 border border-slate-100 rounded-none relative">
                        <div className="text-xs text-[#0D2D5A] whitespace-pre-wrap leading-relaxed font-medium italic">
                            "{viewedNote?.notes}"
                        </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-widest">
                        <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> {viewedNote?.teacher}</span>
                        <span className="text-emerald-600">Validé par conseiller</span>
                    </div>
                    <div className="mt-6">
                        <Button 
                            onClick={() => setViewedNote(null)} 
                            className="w-full bg-[#0D2D5A] text-white font-black text-[10px] uppercase tracking-widest h-10 rounded-none"
                        >
                            Fermer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
