import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { 
    Users, 
    GraduationCap, 
    Calendar, 
    MessageCircle, 
    FileText, 
    Loader2,
    ShieldCheck,
    TrendingUp,
    Timer,
    Star,
    LayoutDashboard
} from "lucide-react";
import { fetchChildrenByParent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function ParentChildren() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const { data: children = [], isLoading } = useQuery({
        queryKey: ["children", user?.id],
        queryFn: () => fetchChildrenByParent(user!.id),
        enabled: !!user?.id,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[40vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Professional Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] flex items-center gap-2">
                        GESTION DE LA FRATRIE
                        <div className="h-1.5 w-1.5 rounded-full bg-[#F5A623]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-0.5">Suivi centralisé des tuteurs et parcours</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded flex items-center gap-2.5">
                        <Users className="w-3.5 h-3.5 text-[#1A6CC8]" />
                        <span className="text-[11px] font-black uppercase text-[#0D2D5A]">{children.length} {children.length > 1 ? 'Étudiants' : 'Étudiant'} Actifs</span>
                    </div>
                </div>
            </div>

            {/* Children Grid - Slim & Pro */}
            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {children.map((child: any) => (
                    <div key={child.id} className="bg-white border border-slate-200 rounded-none overflow-hidden flex flex-col transition-all hover:border-[#1A6CC8]/30">
                        {/* Kid Header - High Density */}
                        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 bg-[#0D2D5A] text-white flex items-center justify-center font-black text-sm shrink-0 border border-whiteShadow">
                                    {child.name?.charAt(0)}
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-sm text-[#0D2D5A] truncate uppercase tracking-tight">{child.name}</h3>
                                    <p className="text-[10px] text-[#1A6CC8] font-black uppercase tracking-widest leading-none mt-0.5">{child.level || 'Terminal'}</p>
                                </div>
                            </div>
                            <Badge className="bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20 text-[8px] font-black uppercase tracking-widest px-2 h-4">
                                ACTIF
                            </Badge>
                        </div>

                        {/* Core Stats - Flat Design */}
                        <div className="p-4 space-y-4 flex-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-slate-100 border border-slate-100 overflow-hidden rounded">
                                <div className="bg-white p-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Moyenne</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-black text-[#0D2D5A]">{child.average || "--"}</span>
                                        <span className="text-[10px] text-slate-300 font-bold">/20</span>
                                    </div>
                                </div>
                                <div className="bg-white p-3">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-1">Total Heures</p>
                                    <div className="flex items-center gap-1.5">
                                        <Timer className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                        <span className="text-lg font-black text-[#1A6CC8]">{child.sessionCount || "0"}h</span>
                                    </div>
                                </div>
                            </div>

                            {/* Attendance Progress - Slim */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.1em]">Assiduité Académique</p>
                                    <span className="text-[10px] font-black text-[#0D2D5A]">{child.attendance || "--"}%</span>
                                </div>
                                <Progress value={parseInt(child.attendance) || 98} className="h-1 bg-slate-50 border-none" />
                            </div>

                            {/* Assigned Tutor - Focus & Direct */}
                            <div className="pt-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Enseignant Principal</p>
                                <div className="flex items-center gap-3 p-3 bg-white border border-slate-100 group">
                                    <div className="w-8 h-8 rounded-full bg-[#1A6CC8]/5 flex items-center justify-center text-[#1A6CC8] border border-[#1A6CC8]/10">
                                        <GraduationCap className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-[#0D2D5A] truncate uppercase">{child.teacherName || "Chargement..."}</p>
                                        <p className="text-[9px] text-[#1A6CC8] font-bold uppercase mt-0.5">{child.subject || "Multi-matières"}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-[#1A6CC8]/5 text-[#1A6CC8]">
                                        <MessageCircle className="w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Actions - Brand Aligned */}
                        <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => navigate(`/parent/schedule?studentId=${child.id}`)}
                                className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-white rounded-none"
                            >
                                <Calendar className="w-3 h-3 mr-1.5" /> Planning
                            </Button>
                            <Button 
                                onClick={() => navigate(`/parent/children/${child.id}`)}
                                className="flex-1 h-8 text-[10px] font-black uppercase tracking-widest bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white rounded-none shadow-none"
                            >
                                <LayoutDashboard className="w-3 h-3 mr-1.5" /> Cockpit
                            </Button>
                        </div>
                    </div>
                ))}

                {children.length === 0 && (
                    <div className="col-span-full py-16 text-center border-2 border-dashed border-slate-100">
                        <Users className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Aucun enseignement en cours</h3>
                        <p className="text-[10px] text-slate-300 mt-1 max-w-[280px] mx-auto font-bold">
                            Veuillez contacter le support pédagogique pour l'activation d'un nouveau profil.
                        </p>
                    </div>
                )}
            </div>

            {/* Professional Footer Info */}
            <div className="pt-8 border-t border-slate-50">
                <div className="p-4 bg-[#0D2D5A] text-white flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded">
                            <ShieldCheck className="w-5 h-5 text-[#F5A623]" />
                        </div>
                        <div>
                             <p className="text-[10px] font-black uppercase tracking-widest">Garantie Excellence Eureka</p>
                             <p className="text-[10px] opacity-70">Accompagnement certifié par nos experts pédagogiques régis par la charte qualité.</p>
                        </div>
                    </div>
                    <Button size="sm" className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-white font-black text-[10px] uppercase tracking-widest px-6 h-8 rounded-none">Contacter un conseiller</Button>
                </div>
            </div>
        </div>
    );
}
