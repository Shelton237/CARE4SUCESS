import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
    Users, MessageSquare, Star, Phone, Mail, 
    Loader2, CalendarCheck, Award, MoreHorizontal,
    ChevronRight, MessageCircle, UserCircle2
} from "lucide-react";
import { fetchTeachersByStudent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function StudentTeachers() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: teachers, isLoading } = useQuery({
        queryKey: ["studentTeachers", user?.id],
        queryFn: () => fetchTeachersByStudent(user!.id),
        enabled: Boolean(user?.id),
    });

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
                <p className="text-gray-400 text-sm mt-4">Chargement de tes tuteurs...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Style */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Tuteurs</h1>
                    <p className="text-gray-500 text-sm mt-1">L'équipe pédagogique qui t'accompagne dans ta réussite.</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#1A6CC8]" />
                        <span className="text-sm font-bold text-[#0D2D5A]">{teachers?.length || 0} Tuteurs</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {teachers && teachers.length > 0 ? (
                    teachers.map((teacher) => (
                        <div key={teacher.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
                            {/* Card Header */}
                            <div className="p-4 md:p-6 bg-gray-50/50 border-b border-gray-50 flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-[#0D2D5A] border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-xl">
                                    {teacher.avatarUrl ? (
                                        <img src={teacher.avatarUrl} alt={teacher.name} className="w-full h-full object-cover rounded-lg" />
                                    ) : (
                                        teacher.name?.charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-[#0D2D5A] truncate">{teacher.name}</h3>
                                    <Badge variant="outline" className="bg-white text-[#1A6CC8] border-blue-100 text-[9px] font-bold uppercase tracking-wider mt-0.5">
                                        Tuteur Référent
                                    </Badge>
                                </div>
                            </div>

                            {/* Card Stats */}
                            <div className="p-4 md:p-6 space-y-6 flex-1">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="bg-white border border-gray-100 p-3 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sessions</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <CalendarCheck className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="text-sm font-bold text-[#0D2D5A]">{teacher.sessionsCount ?? 0} cours</span>
                                        </div>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-3 rounded-xl text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Évaluation</p>
                                        <div className="flex items-center justify-center gap-1.5 mt-1">
                                            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                                            <span className="text-sm font-bold text-[#0D2D5A]">4.9/5</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Contact</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-[#0D2D5A] font-medium bg-gray-50/20 p-2.5 rounded-lg border border-gray-50">
                                            <Mail className="w-3.5 h-3.5 text-[#1A6CC8]" /> {teacher.email}
                                        </div>
                                        {teacher.phone && (
                                            <div className="flex items-center gap-3 text-xs text-[#0D2D5A] font-medium bg-gray-50/20 p-2.5 rounded-lg border border-gray-50">
                                                <Phone className="w-3.5 h-3.5 text-[#1A6CC8]" /> {teacher.phone}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 bg-gray-50/30 border-t border-gray-50 flex gap-3">
                                <Button 
                                    onClick={() => navigate("/student/messages", { state: { contactId: teacher.id, contactName: teacher.name, contactRole: 'teacher' } })}
                                    className="flex-1 bg-[#0D2D5A] hover:bg-[#153460] text-white font-bold h-10 rounded-xl text-[10px] uppercase tracking-widest shadow-sm gap-2"
                                >
                                    <MessageCircle className="w-3.5 h-3.5" /> Discuter
                                </Button>
                                <Button
                                    variant="outline"
                                    className="px-3 border-gray-200 text-gray-400 hover:text-[#0D2D5A] h-10 rounded-xl"
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-300">Aucun tuteur assigné</h3>
                        <p className="text-gray-400 text-xs mt-2 max-w-[240px] mx-auto leading-relaxed">
                            Tes tuteurs apparaîtront ici une fois tes premières sessions planifiées.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
