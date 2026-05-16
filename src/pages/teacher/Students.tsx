import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users, Search, Loader2, GraduationCap,
    ChevronRight, Star, Mail, Phone, MessageCircle, FileText
} from "lucide-react";
import { fetchTeacherStudents } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function TeacherStudents() {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    const { data: students = [], isLoading } = useQuery({
        queryKey: ["teacherStudents", user?.id],
        queryFn: () => fetchTeacherStudents(user!.id),
        enabled: !!user?.id,
    });

    const filteredStudents = useMemo(() => {
        return (Array.isArray(students) ? students : []).filter((s: any) =>
            s.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [students, searchTerm]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
            </div>
        );
    }

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Mes Apprenants</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Suivez la progression et gérez les dossiers de vos élèves.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white">
                    <Users className="w-3.5 h-3.5 text-[#1A6CC8]" />
                    <span className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-wide">
                        {students.length} Élève{students.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                {/* Liste des élèves */}
                <div className="xl:col-span-8 border border-slate-200 bg-white">
                    <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="Rechercher un apprenant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-200 pl-9 pr-4 py-1.5 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                            />
                        </div>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {filteredStudents.map((s: any) => (
                            <div
                                key={s.id}
                                onClick={() => setSelectedStudent(s)}
                                className={cn(
                                    "flex items-center gap-4 px-3 py-2.5 hover:bg-slate-50/50 transition-colors cursor-pointer",
                                    selectedStudent?.id === s.id ? "bg-[#1A6CC8]/5 border-l-2 border-l-[#1A6CC8]" : ""
                                )}
                            >
                                <div className="w-8 h-8 bg-[#0D2D5A] flex items-center justify-center text-[11px] font-black text-white shrink-0">
                                    {s.name?.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="font-black text-[#0D2D5A] text-[11px] uppercase tracking-tight truncate">
                                        {s.name}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5 text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                        <span className="flex items-center gap-1">
                                            <GraduationCap className="w-3 h-3" /> {s.level || "Non défini"}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Star className="w-3 h-3 text-[#F5A623]" /> {s.average || "--"}/20
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 hidden sm:block">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dernière séance</p>
                                    <p className="text-[10px] font-black text-[#0D2D5A]">{s.lastSessionDate || "Récemment"}</p>
                                </div>
                                <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            </div>
                        ))}
                        {filteredStudents.length === 0 && (
                            <div className="px-3 py-10 text-center">
                                <Users className="w-8 h-8 text-slate-100 mx-auto mb-2" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun apprenant trouvé</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Détail */}
                <div className="xl:col-span-4">
                    {selectedStudent ? (
                        <div className="border border-slate-200 bg-white">
                            <div className="px-3 py-3 text-center border-b border-slate-100 bg-slate-50/50">
                                <div className="mx-auto w-14 h-14 bg-[#0D2D5A] flex items-center justify-center text-2xl font-black text-white mb-2">
                                    {selectedStudent.name?.charAt(0)}
                                </div>
                                <h2 className="text-[12px] font-black text-[#0D2D5A] uppercase tracking-tight">
                                    {selectedStudent.name}
                                </h2>
                                <p className="text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest mt-0.5">
                                    {selectedStudent.level}
                                </p>
                            </div>

                            <div className="p-3 space-y-3">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div className="bg-slate-50/50 p-2.5 border border-slate-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Assiduité</p>
                                        <p className="text-[11px] font-black text-[#0D2D5A]">{selectedStudent.attendance || "--%"}</p>
                                    </div>
                                    <div className="bg-slate-50/50 p-2.5 border border-slate-100 text-center">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Devoirs</p>
                                        <p className="text-[11px] font-black text-[#0D2D5A]">{selectedStudent.homeworkCount || "--"}</p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Coordonnées</p>
                                    <div className="flex items-center gap-2 text-[10px] text-[#0D2D5A] font-bold bg-slate-50/50 px-2.5 py-2 border border-slate-100">
                                        <Mail className="w-3 h-3 text-[#1A6CC8] shrink-0" />
                                        <span className="truncate">{selectedStudent.email || "Non communiqué"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-[#0D2D5A] font-bold bg-slate-50/50 px-2.5 py-2 border border-slate-100">
                                        <Phone className="w-3 h-3 text-[#1A6CC8] shrink-0" />
                                        <span>{selectedStudent.phone || "+237 --- --- ---"}</span>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 pt-1">
                                    <Button className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white font-black h-8 rounded-none shadow-none text-[10px] uppercase tracking-widest gap-2">
                                        <MessageCircle className="w-3.5 h-3.5" /> Envoyer un message
                                    </Button>
                                    <Button variant="outline" className="w-full border-slate-200 text-slate-500 font-black h-8 rounded-none shadow-none text-[10px] uppercase tracking-widest gap-2 hover:bg-slate-50">
                                        <FileText className="w-3.5 h-3.5" /> Voir le dossier
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-slate-200 min-h-[300px] flex flex-col items-center justify-center text-center p-4 md:p-6 space-y-3">
                            <Users className="w-8 h-8 text-slate-200" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest max-w-[160px] leading-relaxed">
                                Sélectionnez un élève pour voir ses performances.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
