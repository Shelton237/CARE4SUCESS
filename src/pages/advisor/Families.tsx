import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    Users, Search, Filter, MoreVertical, Phone, Mail,
    MapPin, Calendar, Clock, BookOpen, GraduationCap,
    TrendingUp, MessageCircle, FileText, Loader2, ChevronRight,
    SearchCheck,
    Briefcase
} from "lucide-react";
import { fetchAdvisorFamilies } from "@/api/backoffice";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function AdvisorFamilies() {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFamily, setSelectedFamily] = useState<any>(null);

    const { data: families = [], isLoading } = useQuery({
        queryKey: ["advisorFamilies"],
        queryFn: fetchAdvisorFamilies,
    });

    const filteredFamilies = (Array.isArray(families) ? families : []).filter((f: any) =>
        f.parentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.childName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#1A6CC8] w-10 h-10" />
                <p className="text-gray-400 text-sm mt-4">Chargement des familles...</p>
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header Advisor Style */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Suivi des Familles</h1>
                    <p className="text-gray-500 text-sm mt-1">Gérez les relations parents-élèves et les affectations de tuteurs.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-[#1A6CC8]" />
                        <span className="text-sm font-bold text-[#0D2D5A]">{families.length} Familles</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Liste des Familles */}
                <div className="xl:col-span-8 flex flex-col gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300 w-3.5 h-3.5" />
                                <input
                                    type="text"
                                    placeholder="Rechercher un parent ou un élève..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white border border-gray-200 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {filteredFamilies.map((f: any) => (
                                <div
                                    key={f.id}
                                    onClick={() => setSelectedFamily(f)}
                                    className={cn(
                                        "flex flex-col md:flex-row items-center gap-5 px-6 py-4 hover:bg-gray-50/50 transition-colors cursor-pointer group",
                                        selectedFamily?.id === f.id ? "bg-blue-50/30 border-l-4 border-l-[#1A6CC8]" : ""
                                    )}
                                >
                                    <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-sm font-bold text-[#0D2D5A] shadow-inner group-hover:bg-white">
                                        {f.parentName?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row md:items-center gap-2">
                                            <span className="font-bold text-[#0D2D5A] text-sm">{f.parentName}</span>
                                            <Badge variant="outline" className="w-fit mx-auto md:mx-0 border-gray-100 text-gray-400 font-bold text-[8px] px-1.5 rounded-md uppercase tracking-widest">Parent</Badge>
                                        </div>
                                        <div className="flex items-center justify-center md:justify-start gap-4 mt-1 text-[11px] text-gray-400 font-medium">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Élève : {f.childName}</span>
                                            <span className="flex items-center gap-1 text-[#1A6CC8]"><Briefcase className="w-3 h-3" /> Tuteur : {f.teacherName || "Non assigné"}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-8">
                                        <div className="hidden lg:block text-right">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Dernier Bilan</p>
                                            <p className="text-xs font-bold text-[#0D2D5A]">{f.lastReportDate || "À planifier"}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-[#0D2D5A] group-hover:text-white transition-all shadow-sm">
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredFamilies.length === 0 && (
                                <div className="px-6 py-16 text-center">
                                    <SearchCheck className="w-12 h-12 text-gray-100 mx-auto mb-3" />
                                    <p className="text-sm text-gray-400 italic">Aucune famille ne correspond à votre recherche.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Focus Famille */}
                <div className="xl:col-span-4">
                    {selectedFamily ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-8 animate-in slide-in-from-right-4 duration-300">
                            <div className="p-8 text-center border-b border-gray-50 bg-gray-50/30">
                                <div className="mx-auto w-20 h-20 rounded-2xl bg-[#0D2D5A] border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-white mb-4">
                                    {selectedFamily.parentName?.charAt(0)}
                                </div>
                                <h2 className="text-lg font-bold text-[#0D2D5A]">{selectedFamily.parentName} & {selectedFamily.childName}</h2>
                                <p className="text-[10px] text-[#1A6CC8] font-bold uppercase tracking-[2px] mt-1">{selectedFamily.level || "Niveau non défini"}</p>
                            </div>

                            <div className="p-6 space-y-6">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Progression Académique</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Moyenne</p>
                                            <p className="text-sm font-bold text-[#0D2D5A]">{selectedFamily.average || "14.2"}/20</p>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-50 text-center">
                                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assiduité</p>
                                            <p className="text-sm font-bold text-emerald-600">{selectedFamily.attendance || "100%"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Tuteur Actuel</p>
                                    <div className="flex items-center gap-3 p-3 bg-[#0D2D5A]/5 rounded-xl border border-[#0D2D5A]/10">
                                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-[#1A6CC8]">
                                            <UserCircle2 className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-[#0D2D5A]">{selectedFamily.teacherName || "En attente d'affectation"}</p>
                                            <p className="text-[9px] text-gray-400 italic">Matière : {selectedFamily.subject || "Multi-disciplines"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-2">
                                    <Button className="w-full bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white font-bold h-11 rounded-xl shadow-sm gap-2">
                                        <MessageCircle className="w-4 h-4" /> Contacter la famille
                                    </Button>
                                    <Button variant="outline" className="w-full border-gray-200 text-gray-500 font-bold h-11 rounded-xl hover:bg-gray-50 gap-2">
                                        <FileText className="w-4 h-4" /> Bilan Conseil
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 p-12 text-center h-full min-h-[500px] flex flex-col items-center justify-center space-y-4">
                            <Users className="w-12 h-12 text-gray-100" />
                            <div>
                                <h3 className="text-lg font-bold text-gray-300 italic">Focus Famille</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-2 max-w-[220px] mx-auto leading-relaxed text-center">
                                    Sélectionnez une famille pour accéder au dossier détaillé et aux affectations de tuteurs.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
