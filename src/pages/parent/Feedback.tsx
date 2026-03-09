import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchScheduleByRole, fetchTeacherRatings } from "@/api/backoffice";
import { TeacherFeedbackForm } from "@/components/TeacherFeedbackForm";
import { TeacherRatingsBoard } from "@/components/dashboard/TeacherRatingsBoard";

export default function ParentFeedback() {
    const { user } = useAuth();

    const scheduleQuery = useQuery({
        queryKey: ["parentSchedule", user?.id],
        queryFn: () => fetchScheduleByRole("parent", user!.id),
        enabled: Boolean(user?.id),
    });

    const ratingsQuery = useQuery({
        queryKey: ["teacherRatings"],
        queryFn: fetchTeacherRatings,
    });

    const teacherOptions = useMemo(() => {
        const sessions = scheduleQuery.data ?? [];
        const map = new Map<string, string>();
        sessions.forEach((session) => {
            if (!map.has(session.teacherId)) {
                map.set(session.teacherId, session.teacher);
            }
        });
        return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
    }, [scheduleQuery.data]);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Évaluer mes enseignants</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Partagez vos retours pour améliorer en continu la qualité du suivi pédagogique.
                    </p>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <TeacherFeedbackForm
                        teachers={teacherOptions}
                        reviewerName={user?.name ?? "Parent"}
                        reviewerType="parent"
                        defaultTeacherId={teacherOptions[0]?.id}
                        isLoading={scheduleQuery.isLoading}
                        className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col gap-4"
                        title="Laisser un avis"
                        description="Votre évaluation est anonyme et nous aide à maintenir l'excellence."
                    />

                    {ratingsQuery.data && ratingsQuery.data.length === 0 && (
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                            <p className="text-xs text-gray-400 italic">
                                Aucune évaluation présente. Soyez le premier à laisser un feedback !
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm overflow-hidden">
                    <TeacherRatingsBoard
                        title="Classement des professeurs"
                        description="Basé sur les avis certifiés des parents Eureka."
                        highlightTeacherId={teacherOptions[0]?.id}
                    />
                </div>
            </div>
        </div>
    );
}
