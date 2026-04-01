import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherRatings, fetchTeacherFeedback } from "@/api/backoffice";
import type { TeacherFeedback } from "@/integrations/supabase/types";
import { Star, Loader2, Award, History, Users, MessageSquare, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeacherRatingsBoardProps {
    title?: string;
    description?: string;
    highlightTeacherId?: string;
}

export function TeacherRatingsBoard({
    title = "Notes des enseignants",
    description = "Suivi de la satisfaction parents/élèves.",
    highlightTeacherId,
}: TeacherRatingsBoardProps) {
    const [selectedTeacher, setSelectedTeacher] = useState<string | undefined>(highlightTeacherId);

    const ratingsQuery = useQuery({
        queryKey: ["teacherRatings"],
        queryFn: fetchTeacherRatings,
    });

    const feedbackQuery = useQuery({
        queryKey: ["teacherFeedback", selectedTeacher],
        queryFn: () => (selectedTeacher ? fetchTeacherFeedback(selectedTeacher) : Promise.resolve<TeacherFeedback[]>([])),
        enabled: Boolean(selectedTeacher),
    });

    const ratings = ratingsQuery.data ?? [];
    const currentSelection =
        selectedTeacher && ratings.find((rating) => rating.teacherId === selectedTeacher)
            ? selectedTeacher
            : ratings[0]?.teacherId;

    return (
        <div className="bg-white border border-slate-100 p-0 shadow-none rounded-none">
            <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                <div>
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#F5A623]" /> {title}
                    </h2>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">{description}</p>
                </div>
                {ratingsQuery.isFetching && <Loader2 className="w-3 h-3 animate-spin text-slate-300" />}
            </div>

            {ratings.length === 0 ? (
                <div className="p-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                    Audit de satisfaction non disponible pour le moment
                </div>
            ) : (
                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-100 min-h-[400px]">
                    {/* Teacher List */}
                    <div className="lg:w-[45%] p-4 space-y-2 max-h-[500px] overflow-y-auto">
                        {ratings.map((rating) => (
                            <button
                                key={rating.teacherId}
                                onClick={() => setSelectedTeacher(rating.teacherId)}
                                className={`w-full text-left border px-4 py-3 transition-all rounded-none group ${
                                    currentSelection === rating.teacherId
                                        ? "border-[#1A6CC8] bg-[#1A6CC8]/5"
                                        : "border-slate-50 hover:bg-slate-50/50"
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[11px] font-black text-[#0D2D5A] uppercase truncate tracking-tight">
                                        {rating.teacherName}
                                    </span>
                                    <Badge className="text-[8px] font-black h-4 rounded-none border-none bg-[#1A6CC8]/10 text-[#1A6CC8] px-1.5 shadow-none">
                                        {rating.reviewCount} AVIS
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 text-[#F5A623] text-[10px] font-black">
                                        <Star className="w-3 h-3 fill-[#F5A623]" />
                                        {rating.averageRating.toFixed(1)}/5
                                    </div>
                                    <div className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                        Mis à jour le {rating.lastReviewAt ? new Date(rating.lastReviewAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }).toUpperCase() : "—"}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Feedback Details */}
                    <div className="flex-1 p-4 bg-slate-50/20">
                        <div className="flex items-center gap-2 mb-4">
                            <History className="w-3.5 h-3.5 text-slate-300" />
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chronologie des appréciations</h3>
                        </div>

                        {feedbackQuery.isLoading ? (
                            <div className="flex flex-col items-center justify-center text-slate-300 gap-2 h-40">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Synchronisation...</span>
                            </div>
                        ) : feedbackQuery.data && feedbackQuery.data.length > 0 ? (
                            <div className="space-y-3">
                                {feedbackQuery.data.slice(0, 5).map((feedback) => (
                                    <div
                                        key={feedback.id}
                                        className="bg-white border border-slate-100 p-3 rounded-none relative overflow-hidden group hover:border-[#1A6CC8]/30 transition-colors"
                                    >
                                        <div className="flex items-center justify-between mb-1.5 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 bg-slate-50 flex items-center justify-center border border-slate-100">
                                                    <Users className="w-2.5 h-2.5 text-slate-400" />
                                                </div>
                                                <span className="text-[10px] font-black text-[#0D2D5A] uppercase">
                                                    {feedback.reviewerName}
                                                </span>
                                            </div>
                                            <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter">
                                                {new Date(feedback.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-0.5 text-[#F5A623] mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} className={`w-2 h-2 ${i < feedback.rating ? 'fill-[#F5A623]' : 'fill-slate-100 text-slate-100'}`} />
                                            ))}
                                        </div>
                                        {feedback.comment && (
                                            <p className="text-[11px] text-slate-600 leading-relaxed font-bold border-l-2 border-slate-100 pl-3 italic">
                                                "{feedback.comment}"
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center text-slate-200 py-12 gap-2">
                                <MessageSquare className="w-8 h-8 opacity-20" />
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-300">Aucun témoignage déposé</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
