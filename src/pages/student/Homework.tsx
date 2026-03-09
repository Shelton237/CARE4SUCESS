import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BookOpen,
    CheckCircle2,
    Clock,
    ChevronDown,
    Download,
    Upload,
    ExternalLink,
    FileText,
    MessageSquare,
    ClipboardList,
    Link as LinkIcon,
    FileUp,
    Bookmark,
    Terminal,
    Sparkles,
    Search,
    Filter,
    Calendar,
    ArrowRight
} from "lucide-react";
import { fetchHomework, updateHomework, fetchLessonResources } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
    "à faire": { label: "À faire", bg: "bg-orange-50/50 text-orange-600", color: "border-orange-200", Icon: Clock },
    "rendu": { label: "Rendu", bg: "bg-blue-50/50 text-blue-600", color: "border-blue-200", Icon: CheckCircle2 },
    "corrigé": { label: "Corrigé", bg: "bg-green-600 text-white", color: "border-transparent", Icon: FileText },
};

export default function StudentHomework() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState<"tous" | "à faire" | "rendu" | "corrigé">("tous");
    const [selectedHw, setSelectedHw] = useState<string | null>(null);

    const { data: homework = [], isLoading: loadingHw } = useQuery({
        queryKey: ["homework", "student", user?.id],
        queryFn: () => fetchHomework("student", user?.id || ""),
        enabled: !!user?.id
    });

    const { data: resources = [], isLoading: loadingRes } = useQuery({
        queryKey: ["lesson-resources", "student", user?.id],
        queryFn: () => fetchLessonResources("student", user?.id || ""),
        enabled: !!user?.id
    });

    const submitMutation = useMutation({
        mutationFn: ({ id, submissionUrl }: { id: string, submissionUrl: string }) =>
            updateHomework(id, { status: 'rendu', submissionUrl }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["homework"] });
            toast.success("Bravo ! Ton travail a été envoyé au professeur.");
        }
    });

    const pendingCount = homework.filter((h) => h.status === "à faire").length;
    const visibleHw = filter === "tous" ? homework : homework.filter((h) => h.status === filter);

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header simple et épuré */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Devoirs & Ressources</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Consulte tes exercices à faire et télécharge tes supports de cours.
                    </p>
                </div>
                {pendingCount > 0 && (
                    <div className="flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-xl border border-orange-100">
                        <Sparkles className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-bold text-orange-700">{pendingCount} devoir{pendingCount > 1 ? 's' : ''} à faire</span>
                    </div>
                )}
            </div>

            <Tabs defaultValue="homework" className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <TabsList className="bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                        <TabsTrigger value="homework" className="rounded-lg px-8 py-2 data-[state=active]:bg-[#0D2D5A] data-[state=active]:text-white font-bold text-sm transition-all">
                            Mes Devoirs
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-lg px-8 py-2 data-[state=active]:bg-[#0D2D5A] data-[state=active]:text-white font-bold text-sm transition-all">
                            Bibliothèque
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 shadow-sm overflow-x-auto max-w-full">
                        {(["tous", "à faire", "rendu", "corrigé"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 whitespace-nowrap ${filter === f
                                    ? "bg-gray-100 text-[#0D2D5A]"
                                    : "text-gray-400 hover:text-[#0D2D5A] hover:bg-gray-50"
                                    }`}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <TabsContent value="homework" className="m-0 outline-none">
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {loadingHw ? (
                            <div className="col-span-full py-12 text-center text-gray-400 italic font-medium">Chargement de tes devoirs...</div>
                        ) : visibleHw.length === 0 ? (
                            <div className="col-span-full py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
                                <ClipboardList className="w-10 h-10 text-gray-200 mx-auto" />
                                <p className="text-gray-400 font-medium italic">Aucun devoir ne correspond à ce filtre.</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {visibleHw.map((hw, idx) => {
                                    const cfg = STATUS_CONFIG[hw.status] || STATUS_CONFIG["à faire"];
                                    const isSelected = selectedHw === hw.id;
                                    return (
                                        <motion.div
                                            key={hw.id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                        >
                                            <Card className={`group bg-white border border-gray-100 transition-all duration-300 rounded-2xl overflow-hidden ${isSelected ? "shadow-md ring-1 ring-[#1A6CC8]/20" : "shadow-sm hover:shadow-md hover:border-gray-200"}`}>
                                                <CardContent className="p-0">
                                                    <div className="p-6 flex items-center gap-5">
                                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${cfg.bg} ${cfg.color}`}>
                                                            <cfg.Icon className="w-6 h-6" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-0.5">
                                                                <h3 className="text-lg font-bold text-[#0D2D5A] truncate">{hw.title}</h3>
                                                                {hw.status === 'corrigé' && <Badge className="bg-emerald-500 text-white rounded-md text-[10px] uppercase font-bold border-none px-1.5 py-0">Corrigé</Badge>}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
                                                                <span className="text-[#1A6CC8]">{hw.subject}</span>
                                                                <span>•</span>
                                                                <span className="truncate">{hw.teacherName}</span>
                                                            </div>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => setSelectedHw(isSelected ? null : hw.id)}
                                                            className={`rounded-xl h-10 w-10 transition-all ${isSelected ? "bg-blue-50 text-[#1A6CC8] rotate-180" : "text-gray-300 hover:text-gray-500 hover:bg-gray-50"}`}
                                                        >
                                                            <ChevronDown className="w-5 h-5" />
                                                        </Button>
                                                    </div>

                                                    <AnimatePresence>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
                                                            >
                                                                <div className="p-6 grid md:grid-cols-[1fr_2fr] gap-6">
                                                                    <div className="space-y-5">
                                                                        <div className="space-y-2">
                                                                            <h4 className="text-[11px] font-bold text-[#1A6CC8] uppercase tracking-wider flex items-center gap-2">
                                                                                <Calendar className="w-3.5 h-3.5" /> À rendre pour le
                                                                            </h4>
                                                                            <p className="text-xl font-bold text-[#0D2D5A]">{hw.dueDate}</p>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <h4 className="text-[11px] font-bold text-[#1A6CC8] uppercase tracking-wider">Supports partagés</h4>
                                                                            {hw.fileUrl ? (
                                                                                <Button variant="outline" className="w-full h-12 rounded-xl bg-white border-gray-200 text-[#0D2D5A] font-bold shadow-sm hover:bg-[#0D2D5A] hover:text-white transition-all active:scale-95" asChild>
                                                                                    <a href={hw.fileUrl} target="_blank"><Download className="w-4 h-4 mr-2" /> Télécharger</a>
                                                                                </Button>
                                                                            ) : <p className="text-xs text-gray-400 italic">Aucune consigne en fichier joint.</p>}
                                                                        </div>
                                                                    </div>

                                                                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center">
                                                                        {hw.status === 'à faire' ? (
                                                                            <div className="space-y-5 text-center">
                                                                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-[#1A6CC8]">
                                                                                    <FileUp className="w-6 h-6" />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-base font-bold text-[#0D2D5A]">Envoyer mon travail</h5>
                                                                                    <p className="text-[11px] font-medium text-gray-400 mt-1">Colle le lien Drive, Notion ou l'URL de ton document</p>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <Input id={`sub-${hw.id}`} placeholder="Lien vers mon travail..." className="h-12 rounded-xl border-gray-200 bg-gray-50/30 focus:bg-white text-sm" />
                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            const input = document.getElementById(`sub-${hw.id}`) as HTMLInputElement;
                                                                                            if (input.value) submitMutation.mutate({ id: hw.id, submissionUrl: input.value });
                                                                                        }}
                                                                                        disabled={submitMutation.isPending}
                                                                                        className="h-12 w-12 rounded-xl bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white shrink-0 shadow-sm transition-all active:scale-95"
                                                                                    >
                                                                                        {submitMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        ) : hw.status === 'corrigé' ? (
                                                                            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                                                                <div className="flex items-center gap-3 mb-3">
                                                                                    <div className="p-2 bg-emerald-500 rounded-lg text-white"><MessageSquare className="w-4 h-4" /></div>
                                                                                    <h5 className="font-bold text-emerald-800 text-sm uppercase tracking-tight">Feedback Enseignant</h5>
                                                                                </div>
                                                                                <p className="text-emerald-900 font-medium italic leading-relaxed text-xs">
                                                                                    "{hw.feedback || "Excellent travail, continue ainsi !"}"
                                                                                </p>
                                                                            </div>
                                                                        ) : (
                                                                            <div className="text-center py-4 space-y-4">
                                                                                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-emerald-600">
                                                                                    <CheckCircle2 className="w-7 h-7" />
                                                                                </div>
                                                                                <div>
                                                                                    <h5 className="text-base font-bold text-[#0D2D5A]">C'est envoyé !</h5>
                                                                                    <p className="text-[11px] font-medium text-gray-400 mt-1">Ton travail est prêt pour la correction.</p>
                                                                                </div>
                                                                                <Button variant="ghost" className="text-[#1A6CC8] font-bold text-xs hover:bg-blue-50" asChild>
                                                                                    <a href={hw.submissionUrl || "#"} target="_blank"><LinkIcon className="w-4 h-4 mr-2" /> Voir mon envoi</a>
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="resources" className="m-0 outline-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {loadingRes ? (
                            <div className="col-span-full py-12 text-center text-gray-400 italic">Chargement des ressources...</div>
                        ) : resources.length === 0 ? (
                            <div className="col-span-full py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center space-y-3">
                                <BookOpen className="w-10 h-10 text-gray-200 mx-auto" />
                                <p className="text-gray-400 font-medium italic">Aucune ressource partagée pour le moment.</p>
                            </div>
                        ) : (
                            resources.map((res, idx) => (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    key={res.id}
                                    className="group"
                                >
                                    <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full">
                                        <div className="p-6 flex flex-col flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className={`p-3 rounded-xl shadow-sm transition-all group-hover:scale-110 ${res.fileType === 'pdf' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                                    {res.fileType === 'pdf' ? <FileText className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                                </div>
                                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-wider text-gray-400 border-gray-100">{res.subject}</Badge>
                                            </div>
                                            <h4 className="text-base font-bold text-[#0D2D5A] leading-tight mb-2 group-hover:text-[#1A6CC8] transition-colors line-clamp-2">{res.title}</h4>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Par <span className="text-[#0D2D5A]">{res.teacherName}</span></p>
                                            <div className="mt-auto">
                                                <Button className="w-full h-10 rounded-xl bg-gray-50 hover:bg-[#0D2D5A] text-[#0D2D5A] hover:text-white font-bold text-xs transition-all active:scale-95" asChild>
                                                    <a href={res.fileUrl} target="_blank">Consulter</a>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            )
                            ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function Loader2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>; }
