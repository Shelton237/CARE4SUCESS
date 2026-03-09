import { useQuery } from "@tanstack/react-query";
import { fetchTeacherRatings, fetchTeacherFeedback } from "@/api/backoffice";
import { Star, Loader2 } from "lucide-react";

interface TeacherRatingSummaryProps {
    teacherId: string;
    teacherName: string;
}

export function TeacherRatingSummary({ teacherId, teacherName }: TeacherRatingSummaryProps) {
    const ratingsQuery = useQuery({
        queryKey: ["teacherRatings"],
        queryFn: fetchTeacherRatings,
    });

    const feedbackQuery = useQuery({
        queryKey: ["teacherFeedback", teacherId],
        queryFn: () => fetchTeacherFeedback(teacherId),
    });

    const rating = ratingsQuery.data?.find((r) => r.teacherId === teacherId);

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className="text-base font-bold text-[#0D2D5A]">Retour des familles</h3>
                    <p className="text-xs text-gray-500">Professeur: {teacherName}</p>
                </div>
                {(ratingsQuery.isFetching || feedbackQuery.isFetching) && (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                )}
            </div>

            {rating ? (
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-[#F5A623] text-2xl font-bold">
                            <Star className="w-6 h-6 fill-[#F5A623]" />
                            {rating.averageRating.toFixed(1)}
                        </div>
                        <p className="text-xs text-gray-500">{rating.reviewCount} avis</p>
                    </div>
                    <div className="flex-1 text-sm text-gray-600">
                        Les parents notent votre accompagnement en moyenne {rating.averageRating.toFixed(1)}/5. Continuez a encourager vos eleves !
                    </div>
                </div>
            ) : (
                <p className="text-sm text-gray-500">
                    Pas encore d'avis. Invite les familles a laisser un commentaire apres chaque bilan.
                </p>
            )}

            {feedbackQuery.data && feedbackQuery.data.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4 space-y-3 max-h-56 overflow-y-auto pr-1">
                    {feedbackQuery.data.slice(0, 4).map((item) => (
                        <div key={item.id} className="text-sm border border-gray-100 rounded-lg p-3">
                            <div className="flex items-center justify-between text-gray-600 text-xs">
                                <span className="font-semibold text-[#0D2D5A]">{item.reviewerName}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[#F5A623] text-xs font-bold mt-1">
                                <Star className="w-3 h-3 fill-[#F5A623]" />
                                {item.rating}/5
                            </div>
                            {item.comment && <p className="text-gray-500 text-xs mt-1">{item.comment}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
