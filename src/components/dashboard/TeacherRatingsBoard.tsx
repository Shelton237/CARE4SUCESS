import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchTeacherRatings, fetchTeacherFeedback } from "@/api/backoffice";
import type { TeacherFeedback } from "@/integrations/supabase/types";
import { Star, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TeacherRatingsBoardProps {
    title?: string;
    description?: string;
    highlightTeacherId?: string;
}

export function TeacherRatingsBoard({
    title = "Notes des enseignants",
    description = "Suivi de la satisfaction parents/eleves.",
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
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
                <div>
                    <h2 className="text-base font-bold text-[#0D2D5A]">{title}</h2>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
                {ratingsQuery.isFetching && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
            </div>

            {ratings.length === 0 ? (
                <p className="text-sm text-gray-500">Aucune evaluation pour le moment.</p>
            ) : (
                <div className="grid lg:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        {ratings.map((rating) => (
                            <button
                                key={rating.teacherId}
                                onClick={() => setSelectedTeacher(rating.teacherId)}
                                className={`w-full text-left border rounded-xl px-4 py-3 transition-all ${
                                    currentSelection === rating.teacherId
                                        ? "border-[#1A6CC8] bg-[#1A6CC8]/5"
                                        : "border-gray-100 hover:border-[#1A6CC8]/40"
                                }`}
                            >
                                <div className="flex items-center justify-between text-sm text-[#0D2D5A] font-semibold">
                                    <span>{rating.teacherName}</span>
                                    <Badge className="bg-[#1A6CC8]/10 text-[#1A6CC8]">{rating.reviewCount} avis</Badge>
                                </div>
                                <div className="flex items-center gap-1 mt-2 text-[#F5A623] font-bold">
                                    <Star className="w-4 h-4 fill-[#F5A623]" />
                                    {rating.averageRating.toFixed(1)}/5
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Dernier avis: {rating.lastReviewAt ? new Date(rating.lastReviewAt).toLocaleDateString() : "—"}
                                </p>
                            </button>
                        ))}
                    </div>
                    <div className="border border-gray-100 rounded-xl p-4 h-full">
                        <h3 className="text-sm font-semibold text-[#0D2D5A] mb-3">Derniers avis</h3>
                        {feedbackQuery.isLoading ? (
                            <div className="flex items-center justify-center text-gray-400 text-sm h-full">
                                Chargement…
                            </div>
                        ) : feedbackQuery.data && feedbackQuery.data.length > 0 ? (
                            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                                {feedbackQuery.data.slice(0, 5).map((feedback) => (
                                    <div
                                        key={feedback.id}
                                        className="border border-gray-100 rounded-lg p-3 text-sm"
                                    >
                                        <div className="flex items-center justify-between text-gray-600">
                                            <span className="font-semibold text-[#0D2D5A]">
                                                {feedback.reviewerName}
                                            </span>
                                            <span className="text-xs text-gray-400">
                                                {new Date(feedback.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1 text-[#F5A623] text-xs font-bold mt-1">
                                            <Star className="w-3 h-3 fill-[#F5A623]" />
                                            {feedback.rating}/5
                                        </div>
                                        {feedback.comment && (
                                            <p className="text-gray-500 text-xs mt-1">
                                                {feedback.comment}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-gray-400">Aucun avis sur ce professeur.</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
