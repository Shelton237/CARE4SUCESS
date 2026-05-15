import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchScheduleByRole, fetchTeacherRatings } from "@/api/backoffice";
import { TeacherFeedbackForm } from "@/components/TeacherFeedbackForm";
import { TeacherRatingsBoard } from "@/components/dashboard/TeacherRatingsBoard";
import { Star, MessageSquare, Award, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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

    if (scheduleQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Avis & Satisfaction 
                        <Star className="w-5 h-5 text-[#F5A623]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Évaluation continue de la qualité pédagogique
                    </p>
                </div>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] font-black px-2 h-5 rounded-none uppercase tracking-widest bg-emerald-50 text-emerald-600 border-none">
                        98% SATISFACTION
                    </Badge>
                </div>
            </div>

            <div className="grid lg:grid-cols-5 gap-6">
                {/* Form Side - 2/5 */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="border border-slate-100 bg-slate-50/30 p-4 rounded-none">
                         <div className="flex items-center gap-2 mb-4">
                            <MessageSquare className="w-4 h-4 text-[#1A6CC8]" />
                            <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">
                                Déposer un témoignage
                            </h2>
                         </div>
                         
                         <TeacherFeedbackForm
                            teachers={teacherOptions}
                            reviewerName={user?.name ?? "Parent"}
                            reviewerType="parent"
                            defaultTeacherId={teacherOptions[0]?.id}
                            isLoading={scheduleQuery.isLoading}
                            className="bg-white border border-slate-100 p-4 md:p-6 shadow-none flex flex-col gap-4 rounded-none"
                            title=""
                            description="Votre retour nous aide à garantir l'excellence et le succès de vos enfants."
                        />
                    </div>

                    {ratingsQuery.data && ratingsQuery.data.length === 0 && (
                        <div className="p-4 md:p-8 border border-dashed border-slate-200 text-center bg-slate-50/50">
                            <Sparkles className="w-6 h-6 text-slate-200 mx-auto mb-2" />
                            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                                Soyez le premier parent à évaluer l'équipe !
                            </p>
                        </div>
                    )}
                </div>

                {/* Ratings Side - 3/5 */}
                <div className="lg:col-span-3">
                    <div className="border border-slate-100 bg-white p-4 md:p-6 shadow-none rounded-none h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <Award className="w-32 h-32 text-[#1A6CC8]" />
                        </div>
                        
                        <div className="relative z-10">
                            <TeacherRatingsBoard
                                title="Palmarès de l'Équipe"
                                description="Classement certifié basé sur les avis parents de la communauté Eureka."
                                highlightTeacherId={teacherOptions[0]?.id}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
