import { useQuery } from "@tanstack/react-query";
import { 
    Users, UserCircle2, GraduationCap, Calendar, 
    BookOpen, ChevronRight, Star, Clock, 
    TrendingUp, MessageCircle, FileText, Loader2,
    CheckCircle2
} from "lucide-react";
import { fetchChildrenByParent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export default function ParentChildren() {
    const { user } = useAuth();

    const { data: children = [], isLoading } = useQuery({
        queryKey: ["children", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: !!user?.id,
    });

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#1A6CC8] w-10 h-10" />
                <p className="text-gray-400 text-sm mt-4">Chargement de la fratrie...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Parent Style */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Enfants</h1>
                    <p className="text-gray-500 text-sm mt-1">Suivez le parcours académique et les tuteurs de vos enfants.</p>
                </div>
                <div className="hidden sm:flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#1A6CC8]" />
                        <span className="text-sm font-bold text-[#0D2D5A]">{children.length} {children.length > 1 ? 'Enfants' : 'Enfant'}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {children.map((child: any) => (
                    <div key={child.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                        {/* Status / Level Header */}
                        <div className="p-6 bg-gray-50/50 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-[#0D2D5A] border-4 border-white shadow-sm flex items-center justify-center text-white font-bold text-lg">
                                    {child.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#0D2D5A]">{child.name}</h3>
                                    <p className="text-[10px] text-[#1A6CC8] font-bold uppercase tracking-widest">{child.level || 'Terminal'}</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-white text-emerald-600 border-emerald-100 text-[9px] font-bold uppercase tracking-wider">
                                Actif
                            </Badge>
                        </div>

                        {/* Stats / Progress */}
                        <div className="p-6 space-y-6 flex-1">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white border border-gray-100 p-3 rounded-xl text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Moyenne Générale</p>
                                    <p className="text-sm font-bold text-[#0D2D5A] mt-1">{child.average || "15.2"} / 20</p>
                                </div>
                                <div className="bg-white border border-gray-100 p-3 rounded-xl text-center">
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Heures Effectuées</p>
                                    <p className="text-sm font-bold text-[#1A6CC8] mt-1">{child.sessionCount || "24"}h</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 flex items-center justify-between">
                                    Assiduité 🧑‍🎓
                                    <span className="text-[#0D2D5A]">{child.attendance || "98"}%</span>
                                </p>
                                <Progress value={parseInt(child.attendance) || 98} className="h-1.5 bg-gray-50" />
                            </div>

                            <div className="space-y-3 pt-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tuteur Assigné</p>
                                <div className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100 group cursor-default">
                                    <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#1A6CC8]">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[#0D2D5A] truncate">{child.teacherName || "Chargement..."}</p>
                                        <p className="text-[10px] text-gray-400 lowercase">{child.subject || "Multi-matières"}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white text-[#1A6CC8]">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-gray-50/30 border-t border-gray-50 grid grid-cols-2 gap-3">
                            <Button variant="outline" className="border-gray-200 text-gray-500 font-bold h-10 rounded-xl text-xs gap-2">
                                <Calendar className="w-3.5 h-3.5" /> Planning
                            </Button>
                            <Button className="bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white font-bold h-10 rounded-xl text-xs gap-2 shadow-sm">
                                <FileText className="w-3.5 h-3.5" /> Bilan
                            </Button>
                        </div>
                    </div>
                ))}

                {children.length === 0 && (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                        <Users className="w-12 h-12 text-gray-100 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-300">Aucun enfant listé</h3>
                        <p className="text-gray-400 text-xs mt-2 max-w-[240px] mx-auto">
                            Si vos enfants n'apparaissent pas, veuillez contacter votre conseiller pédagogique.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
