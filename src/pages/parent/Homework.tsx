import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    ChevronDown,
    FileText,
    Eye,
    BookOpen,
    Link as LinkIcon,
    RefreshCw,
    GraduationCap,
    Download
} from "lucide-react";
import { fetchHomework, fetchLessonResources } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
    "à faire": "bg-orange-50 text-orange-600 border-orange-100",
    "rendu": "bg-[#1A6CC8]/10 text-[#1A6CC8] border-[#1A6CC8]/20",
    "corrigé": "bg-emerald-50 text-emerald-600 border-emerald-100",
};

export default function ParentHomework() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<"homework" | "resources">("homework");
    const [selectedHw, setSelectedHw] = useState<string | null>(null);

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

    const pendingCount = (homework ?? []).filter(h => h.status === 'à faire').length;

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour consulter le suivi pédagogique.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Suivi Pédagogique</h1>
                    <p className="text-gray-500 text-sm mt-1">Consultez les devoirs et ressources partagés par les enseignants.</p>
                </div>
                <div className="hidden md:flex gap-2">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider bg-orange-50 text-orange-600 border-orange-100">
                        {pendingCount} À FAIRE
                    </span>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100">
                        {(homework ?? []).filter(h => h.status === 'corrigé').length} CORRIGÉS
                    </span>
                </div>
            </div>

            {(isErrorHw || isErrorRes) && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4 flex items-center justify-between">
                    <span>Impossible de charger certaines données pédagogiques.</span>
                    <button
                        onClick={() => { refetchHw(); refetchRes(); }}
                        className="inline-flex items-center gap-1 text-red-700 font-semibold text-xs border border-red-200 rounded-lg px-3 py-1 hover:bg-red-100 transition-colors"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Réessayer
                    </button>
                </div>
            )}

            {/* Onglets (style simple sans shadcn Tabs) */}
            <div className="flex gap-2 border-b border-gray-100 pb-px">
                <button
                    onClick={() => setActiveTab("homework")}
                    className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "homework" ? "border-[#1A6CC8] text-[#1A6CC8]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    Travaux de l'élève
                </button>
                <button
                    onClick={() => setActiveTab("resources")}
                    className={`px-5 py-2.5 text-sm font-bold border-b-2 transition-colors ${activeTab === "resources" ? "border-[#1A6CC8] text-[#1A6CC8]" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                >
                    Fiches & Supports
                </button>
            </div>

            {activeTab === "homework" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                            <ClipboardList className="w-4 h-4 text-[#1A6CC8]" />
                        </div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Liste des devoirs</h2>
                        <span className="ml-auto text-xs text-gray-400">{(homework ?? []).length} devoirs</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {(homework ?? []).map((hw) => {
                            const isSelected = selectedHw === hw.id;
                            const statusColor = STATUS_COLORS[hw.status] || STATUS_COLORS["à faire"];

                            return (
                                <div key={hw.id} className="flex flex-col hover:bg-gray-50/50 transition-colors">
                                    {/* En-tête de la ligne */}
                                    <button
                                        onClick={() => setSelectedHw(isSelected ? null : hw.id)}
                                        className="flex items-center gap-5 px-6 py-4 w-full text-left"
                                    >
                                        <div className="w-12 text-center flex-shrink-0">
                                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border inline-block uppercase ${statusColor}`}>
                                                {hw.status}
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-gray-100 hidden sm:block" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-semibold text-[#0D2D5A] text-sm flex items-center gap-2">
                                                {hw.title}
                                                <span className="text-[10px] font-normal text-gray-400">— {hw.dueDate}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                                                <span className="flex items-center gap-1 text-xs text-gray-400">
                                                    <GraduationCap className="w-3 h-3" />
                                                    {hw.subject} ({hw.teacherName})
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0 text-gray-300">
                                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isSelected ? "rotate-180 text-[#1A6CC8]" : ""}`} />
                                        </div>
                                    </button>

                                    {/* Contenu déroulant */}
                                    {isSelected && (
                                        <div className="bg-gray-50/50 px-6 py-5 border-t border-gray-50 text-sm">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                {/* Détails du travail */}
                                                <div className="bg-white rounded-xl border border-gray-100 p-4">
                                                    <h4 className="flex items-center gap-2 font-bold text-[#0D2D5A] mb-3 text-xs uppercase tracking-wide">
                                                        <FileText className="w-4 h-4 text-[#1A6CC8]" />
                                                        Consignes & Appréciation
                                                    </h4>
                                                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                                                        {hw.description || "Aucune consigne détaillée."}
                                                    </p>

                                                    {hw.feedback && (
                                                        <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                                            <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-1">Feedback Professeur</div>
                                                            <p className="text-emerald-800 italic">{hw.feedback}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action / Rendu */}
                                                <div className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col justify-center items-center text-center space-y-3">
                                                    {hw.submissionUrl ? (
                                                        <>
                                                            <div className="w-10 h-10 bg-[#1A6CC8]/10 text-[#1A6CC8] rounded-full flex items-center justify-center">
                                                                <Eye className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-[#0D2D5A]">Travail rendu en ligne</p>
                                                                <p className="text-xs text-gray-400 mt-1">Vous pouvez consulter le document envoyé par votre enfant.</p>
                                                            </div>
                                                            <Button asChild size="sm" className="bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white rounded-lg mt-2">
                                                                <a href={hw.submissionUrl} target="_blank" rel="noopener noreferrer">Visualiser le fichier</a>
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="w-10 h-10 bg-orange-50 text-orange-400 rounded-full flex items-center justify-center">
                                                                <Clock className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-500">Aucun fichier transmis</p>
                                                                <p className="text-xs text-gray-400 mt-1">Votre enfant n'a pas encore rendu ce devoir via la plateforme.</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {(homework ?? []).length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                                <ClipboardList className="w-8 h-8 text-gray-200" />
                                <span className="text-gray-400 text-sm">{loadingHw ? "Chargement..." : "Aucun devoir pour le moment."}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "resources" && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-[#1A6CC8]" />
                        </div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Bibliothèque de ressources</h2>
                        <span className="ml-auto text-xs text-gray-400">{(resources ?? []).length} fiches</span>
                    </div>

                    <div className="divide-y divide-gray-50">
                        {(resources ?? []).map((res) => (
                            <div key={res.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${res.fileType === 'pdf' ? 'bg-orange-50 border-orange-100 text-orange-500' : 'bg-[#1A6CC8]/5 border-[#1A6CC8]/10 text-[#1A6CC8]'}`}>
                                        {res.fileType === 'pdf' ? <FileText className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-[#0D2D5A] text-sm">{res.title}</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 bg-white text-gray-500">{res.subject}</span>
                                            <span className="text-xs text-gray-400">Par {res.teacherName}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" variant="ghost" className="text-[#1A6CC8] hover:bg-[#1A6CC8]/10" asChild>
                                    <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">
                                        <Download className="w-4 h-4 mr-2" /> Ouvrir
                                    </a>
                                </Button>
                            </div>
                        ))}
                        {(resources ?? []).length === 0 && (
                            <div className="py-12 flex flex-col items-center justify-center text-center gap-2">
                                <BookOpen className="w-8 h-8 text-gray-200" />
                                <span className="text-gray-400 text-sm">{loadingRes ? "Chargement..." : "Aucune ressource partagée."}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}


