import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users, Search, Filter, MoreVertical, TrendingUp, Clock,
    Target, Zap, MessageCircle, FileText, Loader2, BookOpen,
    GraduationCap, ChevronRight, Star, Mail, Phone, Calendar
} from "lucide-react";
import { fetchTeacherStudents } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
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
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#1A6CC8]" />
                <p className="text-gray-400 text-sm">Chargement de vos apprenants...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header - Aligné sur Schedule.tsx */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Apprenants</h1>
                    <p className="text-gray-500 text-sm mt-1">Suivez la progression et gérez les dossiers de vos élèves.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                        <Users className="w-4 h-4 text-[#1A6CC8]" />
                        <span className="text-sm font-bold text-[#0D2D5A]">{students.length} Élèves</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Liste des élèves - Style Liste Historique */}
                <div className="lg:col-span-12 xl:col-span-8 space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un apprenant..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 transition-all"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {filteredStudents.map((s: any) => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedStudent(s)}
                                    className={cn(
                                        "flex flex-col sm:flex-row items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group",
                                        selectedStudent?.id === s.id ? "bg-blue-50/30 border-l-4 border-l-[#1A6CC8]" : ""
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-[#0D2D5A] shadow-inner group-hover:bg-white transition-colors">
                                        {s.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0 w-full text-center sm:text-left">
                                        <div className="font-bold text-[#0D2D5A] text-base group-hover:text-[#1A6CC8] transition-colors">
                                            {s.name}
                                        </div>
                                        <div className="flex items-center justify-center sm:justify-start gap-3 mt-1 text-xs text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" /> {s.level || "Non défini"}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" /> {s.average || "14.5"}/20
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-center sm:text-right flex items-center gap-4">
                                        <div className="hidden md:block">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dernière séance</p>
                                            <p className="text-xs font-bold text-[#0D2D5A]">{s.lastSessionDate || "Récemment"}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#0D2D5A] group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredStudents.length === 0 && (
                                <div className="px-6 py-12 text-center">
                                    <Users className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 italic">Aucun apprenant trouvé.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Détail - Style Schedule + Sobriété */}
                <div className="lg:col-span-12 xl:col-span-4">
                    {selectedStudent ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8">
                            <div className="p-8 text-center border-b border-gray-50 bg-gray-50/30">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-[#0D2D5A] border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white mb-4">
                                    {selectedStudent.name?.charAt(0)}
                                </div>
                                <h2 className="text-xl font-bold text-[#0D2D5A]">{selectedStudent.name}</h2>
                                <p className="text-xs text-[#1A6CC8] font-bold uppercase tracking-widest mt-1">{selectedStudent.level}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assiduité</p>
                                        <p className="text-sm font-bold text-[#0D2D5A]">{selectedStudent.attendance || "95%"}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Devoirs Rendus</p>
                                        <p className="text-sm font-bold text-emerald-600">{selectedStudent.homeworkCount || "8/10"}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Coordonnées</p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3 text-xs text-[#0D2D5A] font-medium bg-gray-50/50 p-2.5 rounded-lg border border-gray-50">
                                            <Mail className="w-3.5 h-3.5 text-[#1A6CC8]" /> {selectedStudent.email || "Non communiqué"}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-[#0D2D5A] font-medium bg-gray-50/50 p-2.5 rounded-lg border border-gray-50">
                                            <Phone className="w-3.5 h-3.5 text-[#1A6CC8]" /> {selectedStudent.phone || "+237 --- --- ---"}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 flex flex-col gap-2">
                                    <Button className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white font-bold h-11 rounded-xl shadow-sm gap-2">
                                        <MessageCircle className="w-4 h-4" /> Envoyer un message
                                    </Button>
                                    <Button variant="outline" className="w-full border-gray-200 text-gray-500 font-bold h-11 rounded-xl hover:bg-gray-50 gap-2">
                                        <FileText className="w-4 h-4" /> Voir le dossier complet
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
                            <Users className="w-12 h-12 text-gray-100" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-300 italic">Détails de l'apprenant</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[200px] mx-auto leading-relaxed">
                                    Sélectionnez un élève dans la liste pour voir ses performances.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
