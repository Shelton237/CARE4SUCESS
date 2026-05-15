import { useQuery } from "@tanstack/react-query";
import { BookOpen, Star, FileText, Calendar, User, Clock, Loader2, ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

const API = import.meta.env.VITE_API_URL || "/api";

export default function StudentHistory() {
    const { user, token } = useAuth();

    const { data: history = [], isLoading } = useQuery({
        queryKey: ["studentHistory", user?.id],
        queryFn: async () => {
            const res = await fetch(`${API}/students/${user!.id}/course-history`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) return [];
            return res.json();
        },
        enabled: !!user?.id && !!token,
    });

    const SCORE_COLORS = ["", "text-red-500", "text-[#F5A623]", "text-[#F5A623]", "text-emerald-500", "text-emerald-600"];
    const SCORE_LABELS = ["", "Difficile", "Moyen", "Bien", "Très bien", "Excellent"];

    if (isLoading) return (
        <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
        </div>
    );

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 bg-white min-h-screen font-sans text-[#0D2D5A]">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Historique des cours
                        <BookOpen className="w-5 h-5 text-[#1A6CC8]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {history.length} séance{history.length !== 1 ? "s" : ""} effectuée{history.length !== 1 ? "s" : ""}
                    </p>
                </div>
            </div>

            {history.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-slate-100">
                    <ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun cours effectué pour le moment</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {(history as any[]).map((session: any) => (
                        <div key={session.id} className="border border-slate-100 hover:border-[#1A6CC8]/30 transition-colors">
                            {/* Header séance */}
                            <div className="flex items-center gap-4 px-4 py-3 border-b border-slate-50 bg-slate-50/30">
                                <div className="flex items-center gap-2 flex-1">
                                    <Calendar className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                    <span className="text-[11px] font-black text-[#0D2D5A]">
                                        {new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                                    </span>
                                </div>
                                <Badge className="text-[8px] font-black uppercase px-2 h-4 rounded-none border-none bg-emerald-50 text-emerald-700">
                                    Effectué
                                </Badge>
                            </div>

                            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Infos cours */}
                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Séance</div>
                                    <div className="text-[13px] font-black text-[#0D2D5A] uppercase">{session.subject}</div>
                                    <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                        <User className="w-3 h-3 text-[#1A6CC8]" /> {session.teacherName}
                                    </div>
                                    {session.startTime && session.endTime && (
                                        <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                            <Clock className="w-3 h-3" />
                                            {new Date(session.startTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                            {" — "}
                                            {new Date(session.endTime).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                                        </div>
                                    )}
                                </div>

                                {/* Rapport prof */}
                                <div className="space-y-1.5">
                                    <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Rapport du professeur
                                    </div>
                                    {session.reportText ? (
                                        <p className="text-[10px] text-[#0D2D5A] font-medium italic leading-relaxed border-l-2 border-[#1A6CC8]/30 pl-2">
                                            "{session.reportText}"
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-slate-300 italic">Aucun rapport rédigé</p>
                                    )}
                                </div>

                                {/* Note de compréhension + devoir */}
                                <div className="space-y-3">
                                    {session.understandingScore && (
                                        <div>
                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-1 mb-1">
                                                <Star className="w-3 h-3" /> Compréhension
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <span key={n} className={`text-sm ${n <= session.understandingScore ? "text-[#F5A623]" : "text-slate-200"}`}>★</span>
                                                    ))}
                                                </div>
                                                <span className={`text-[11px] font-black ${SCORE_COLORS[session.understandingScore]}`}>
                                                    {SCORE_LABELS[session.understandingScore]}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    {session.homeworkTitle && (
                                        <div>
                                            <div className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Devoir associé</div>
                                            <div className="bg-[#1A6CC8]/5 border border-[#1A6CC8]/20 px-2 py-1.5">
                                                <div className="text-[10px] font-black text-[#0D2D5A]">{session.homeworkTitle}</div>
                                                {session.homeworkDue && (
                                                    <div className="text-[9px] text-slate-400 font-bold mt-0.5">
                                                        À rendre le {new Date(session.homeworkDue).toLocaleDateString("fr-FR")}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
