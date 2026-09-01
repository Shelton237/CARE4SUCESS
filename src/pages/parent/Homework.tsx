import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    ChevronDown,
    BookOpen,
    Link as LinkIcon,
    RefreshCw,
    GraduationCap,
    Download,
    Star,
    LayoutDashboard,
    Library,
    UserCircle,
} from "lucide-react";
import { fetchHomework, fetchLessonResources, fetchChildrenByParent } from "@/api/backoffice";
import { FilePreview } from "@/components/ui/FilePreview";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
    "à faire": "bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20",
    "rendu": "bg-[#1A6CC8]/10 text-[#1A6CC8] border-[#1A6CC8]/20",
    "corrigé": "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export default function ParentHomework() {
    const { user } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const studentIdParam = searchParams.get("studentId");
    
    const [activeTab, setActiveTab] = useState<"homework" | "resources">("homework");
    const [selectedHw, setSelectedHw] = useState<string | null>(null);

    const { data: children = [] } = useQuery({
        queryKey: ["parent-children", user?.id],
        queryFn: () => fetchChildrenByParent(user?.id || ""),
        enabled: Boolean(user?.id)
    });

    const { data: homework, isLoading: loadingHw, isError: isErrorHw, refetch: refetchHw } = useQuery({
        queryKey: ["homework", "parent", user?.id],
        queryFn: () => fetchHomework("parent", user?.id || ""),
        enabled: Boolean(user?.id)
    });

    const { data: resources, isLoading: loadingRes, isError: isErrorRes, refetch: refetchRes } = useQuery({
        queryKey: ["lesson-resources", "parent", user?.id],
        queryFn: () => fetchLessonResources("parent", user?.id || ""),
        enabled: Boolean(user?.id)
    });

    const filteredHomework = useMemo(() => {
        if (!homework) return [];
        if (!studentIdParam) return homework;
        return homework.filter(h => h.studentId === studentIdParam);
    }, [homework, studentIdParam]);

    const filteredResources = useMemo(() => {
        if (!resources) return [];
        if (!studentIdParam) return resources;
        return resources.filter(r => r.studentId === studentIdParam);
    }, [resources, studentIdParam]);

    const pendingCount = filteredHomework.filter(h => h.status === 'à faire').length;

    const handleStudentChange = (id: string | null) => {
        if (id) {
            setSearchParams({ studentId: id });
        } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("studentId");
            setSearchParams(newParams);
        }
    };

    if (!user) return null;

    return (
        <div className="p-4 md:p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-slate-100 pb-4 gap-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Suivi Pédagogique
                        <ClipboardList className="w-5 h-5 text-[#1A6CC8]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Devoirs, fiches et supports de cours</p>
                </div>

                {/* Multi-student selector in Eureka Style */}
                {children.length > 1 && (
                    <div className="flex items-center gap-1 bg-slate-50 p-1 border border-slate-100 h-9">
                        <Button
                            variant="ghost"
                            onClick={() => handleStudentChange(null)}
                            className={`h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-none shadow-none ${!studentIdParam ? "bg-white text-[#1A6CC8] border border-slate-100" : "text-slate-400"}`}
                        >
                            Tous
                        </Button>
                        {children.map(child => (
                            <Button
                                key={child.id}
                                variant="ghost"
                                onClick={() => handleStudentChange(child.id)}
                                className={`h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-none shadow-none ${studentIdParam === child.id ? "bg-white text-[#1A6CC8] border border-slate-100" : "text-slate-400"}`}
                            >
                                {child.name.split(' ')[0]}
                            </Button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[9px] font-black px-2 h-5 rounded-none uppercase tracking-widest bg-[#F5A623]/10 text-[#F5A623] border-[#F5A623]/20">
                        {pendingCount} À FAIRE
                    </Badge>
                    <Badge variant="outline" className="text-[9px] font-black px-2 h-5 rounded-none uppercase tracking-widest bg-emerald-50 text-emerald-600 border-emerald-100">
                        {filteredHomework.filter(h => h.status === 'corrigé').length} CORRIGÉS
                    </Badge>
                </div>
            </div>

            {(isErrorHw || isErrorRes) && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-[10px] font-bold uppercase p-3 flex items-center justify-between rounded-none">
                    <span>Erreur de chargement des données</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => { refetchHw(); refetchRes(); }}
                        className="h-6 text-[9px] font-black uppercase text-red-700 hover:bg-red-100"
                    >
                        <RefreshCw className="w-3 h-3 mr-1" /> Réessayer
                    </Button>
                </div>
            )}

            {/* Eureka Tabs */}
            <div className="flex gap-1 border-b border-slate-100 pb-px">
                <button
                    onClick={() => setActiveTab("homework")}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "homework" 
                        ? "border-[#1A6CC8] text-[#1A6CC8] bg-slate-50/50" 
                        : "border-transparent text-slate-300 hover:text-slate-500 hover:bg-slate-50/30"
                    }`}
                >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Travaux de l'élève
                </button>
                <button
                    onClick={() => setActiveTab("resources")}
                    className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all flex items-center gap-2 ${
                        activeTab === "resources" 
                        ? "border-[#1A6CC8] text-[#1A6CC8] bg-slate-50/50" 
                        : "border-transparent text-slate-300 hover:text-slate-500 hover:bg-slate-50/30"
                    }`}
                >
                    <Library className="w-3.5 h-3.5" />
                    Fiches & Supports
                </button>
            </div>

            {activeTab === "homework" && (
                <div className="border border-slate-100 bg-white shadow-none overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <ClipboardList className="w-3.5 h-3.5 text-[#1A6CC8]" />
                            {studentIdParam ? `Devoirs : ${children.find(c => c.id === studentIdParam)?.name}` : "Liste des devoirs assignés"}
                        </h2>
                        <Badge variant="outline" className="ml-auto text-[9px] font-black uppercase border-slate-200 text-slate-400 rounded-none h-5">
                            {filteredHomework.length} Items
                        </Badge>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {filteredHomework.map((hw) => {
                            const isSelected = selectedHw === hw.id;
                            const statusColor = STATUS_COLORS[hw.status] || STATUS_COLORS["à faire"];

                            return (
                                <div key={hw.id} className="flex flex-col hover:bg-slate-50/30 transition-colors group">
                                    {/* Header Row */}
                                    <button
                                        onClick={() => setSelectedHw(isSelected ? null : hw.id)}
                                        className="flex items-center gap-4 px-4 py-3 w-full text-left"
                                    >
                                        <div className="w-12 text-center flex-shrink-0">
                                            <Badge className={`text-[8px] font-black uppercase px-2 h-4 rounded-none border ${statusColor}`}>
                                                {hw.status}
                                            </Badge>
                                        </div>
                                        <div className="w-px h-6 bg-slate-100" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="font-black text-[#0D2D5A] text-[11px] uppercase truncate">{hw.title}</h4>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">— {hw.dueDate}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="flex items-center gap-1 text-[9px] text-[#1A6CC8] font-black uppercase tracking-tight">
                                                    <GraduationCap className="w-3 h-3" />
                                                    {hw.subject} <span className="text-slate-400 ml-1">({hw.teacherName})</span>
                                                </span>
                                                {!studentIdParam && children.length > 1 && (
                                                    <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 bg-slate-50 px-1 border border-slate-100 uppercase tracking-widest">
                                                        <UserCircle className="w-2.5 h-2.5" />
                                                        {hw.studentName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-slate-200 group-hover:text-[#1A6CC8]">
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSelected ? "rotate-180" : ""}`} />
                                        </div>
                                    </button>

                                    {/* Content Area */}
                                    {isSelected && (
                                        <div className="bg-slate-50/50 px-4 py-4 border-t border-slate-50">
                                            <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Details Card */}
                                                <div className="bg-white border border-slate-100 p-4">
                                                    <h5 className="text-[9px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2 mb-3">
                                                        <FileText className="w-3 h-3 text-[#1A6CC8]" /> Consignes & Appréciation
                                                    </h5>
                                                    <p className="text-[11px] text-slate-600 mb-4 leading-relaxed font-medium">
                                                        {hw.description || "Aucune consigne détaillée."}
                                                    </p>

                                                    {hw.feedback && (
                                                        <div className="bg-emerald-50/50 border border-emerald-100 p-3 relative">
                                                            <div className="text-[8px] font-black text-emerald-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                                                                <Star className="w-2.5 h-2.5 fill-emerald-700" /> Note du Professeur
                                                            </div>
                                                            <p className="text-[10px] text-emerald-800 italic font-bold">"{hw.feedback}"</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Status / Submission Card */}
                                                <div className="bg-white border border-slate-100 p-4">
                                                    {hw.submissionUrl ? (
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="h-8 w-8 bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-tight">Travail rendu</p>
                                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Fichier disponible</p>
                                                                </div>
                                                            </div>
                                                            <FilePreview url={hw.submissionUrl} />
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col justify-center items-center text-center space-y-3 py-4">
                                                            <div className="h-10 w-10 bg-slate-50 text-slate-300 flex items-center justify-center">
                                                                <Clock className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">En attente de retour</p>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Le fichier n'a pas encore été transmis</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {filteredHomework.length === 0 && (
                            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                                <ClipboardList className="w-8 h-8 text-slate-100" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {loadingHw ? "Synchronisation..." : "Aucun devoir à suivre"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "resources" && (
                <div className="border border-slate-100 bg-white shadow-none">
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                        <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-[#1A6CC8]" />
                            {studentIdParam ? `Fiches : ${children.find(c => c.id === studentIdParam)?.name}` : "Bibliothèque de ressources pédagogiques"}
                        </h2>
                        <Badge variant="outline" className="ml-auto text-[9px] font-black uppercase border-slate-200 text-slate-400 rounded-none h-5">
                            {filteredResources.length} Fiches
                        </Badge>
                    </div>

                    <div className="divide-y divide-slate-50">
                        {filteredResources.map((res) => (
                            <div key={res.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/30 transition-colors group">
                                <div className="flex items-center gap-4 min-w-0">
                                    <div className={`w-10 h-10 flex items-center justify-center border ${
                                        res.fileType === 'pdf' 
                                        ? 'bg-orange-50 border-orange-100 text-orange-500' 
                                        : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10 text-[#1A6CC8]'
                                    }`}>
                                        {res.fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black text-[#0D2D5A] text-[11px] uppercase truncate">{res.title}</div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                            <span className="text-[8px] font-black px-2 py-0.5 border border-slate-200 bg-white text-slate-400 uppercase tracking-tighter">
                                                {res.subject}
                                            </span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                <GraduationCap className="w-3 h-3" /> {res.teacherName}
                                            </span>
                                            {!studentIdParam && children.length > 1 && (
                                                <span className="flex items-center gap-1 text-[8px] font-black text-slate-400 bg-slate-50 px-1 border border-slate-100 uppercase tracking-widest">
                                                    <UserCircle className="w-2.5 h-2.5" />
                                                    {children.find(c => c.id === res.studentId)?.name || "Élève"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="h-8 text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest hover:bg-[#1A6CC8]/10 rounded-none" asChild>
                                    <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-3.5 h-3.5 mr-2" /> Ouvrir
                                    </a>
                                </Button>
                            </div>
                        ))}
                        {filteredResources.length === 0 && (
                            <div className="py-16 flex flex-col items-center justify-center text-center gap-3">
                                <Library className="w-8 h-8 text-slate-100" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                    {loadingRes ? "Synchronisation..." : "Bibliothèque vide pour le moment"}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


