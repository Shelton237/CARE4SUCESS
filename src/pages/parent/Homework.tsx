import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
    ClipboardList,
    Clock,
    CheckCircle2,
    ChevronDown,
    FileText,
    Eye,
    Bookmark,
    Sparkles,
    Search,
    Filter,
    Calendar,
    ArrowRight,
    User,
    BookOpen,
    Link as LinkIcon
} from "lucide-react";
import { fetchHomework, fetchLessonResources } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; Icon: any }> = {
    "à faire": { label: "À faire", bg: "bg-orange-50/50 text-orange-600", color: "border-orange-100", Icon: Clock },
    "rendu": { label: "Transmis", bg: "bg-blue-50/50 text-blue-600", color: "border-blue-100", Icon: CheckCircle2 },
    "corrigé": { label: "Corrigé", bg: "bg-green-600 text-white", color: "border-transparent", Icon: FileText },
};

export default function ParentHomework() {
    const { user } = useAuth();
    const [selectedHw, setSelectedHw] = useState<string | null>(null);

    const { data: homework = [], isLoading: loadingHw } = useQuery({
        queryKey: ["homework", "parent", user?.id],
        queryFn: () => fetchHomework("parent", user?.id || ""),
        enabled: !!user?.id
    });

    const { data: resources = [], isLoading: loadingRes } = useQuery({
        queryKey: ["lesson-resources", "parent", user?.id],
        queryFn: () => fetchLessonResources("parent", user?.id || ""),
        enabled: !!user?.id
    });

    const pendingCount = homework.filter(h => h.status === 'à faire').length;

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Suivi Pédagogique</h1>
                    <p className="text-gray-500 text-sm mt-1">Consultez les devoirs et ressources partagés par les enseignants.</p>
                </div>
                <div className="hidden md:flex gap-4">
                    <div className="bg-white rounded-xl border border-gray-100 p-3 flex items-center gap-3 shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-lg font-bold text-[#0D2D5A] leading-none">{pendingCount}</div>
                            <div className="text-[10px] text-gray-400 font-medium mt-1">Devoirs à faire</div>
                        </div>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="homework" className="space-y-6">
                <TabsList className="bg-gray-100/50 p-1 rounded-xl border border-gray-100">
                    <TabsTrigger value="homework" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1A6CC8] data-[state=active]:shadow-sm font-semibold text-xs transition-all">
                        Travaux de l'élève
                    </TabsTrigger>
                    <TabsTrigger value="resources" className="rounded-lg px-6 py-2 data-[state=active]:bg-white data-[state=active]:text-[#1A6CC8] data-[state=active]:shadow-sm font-semibold text-xs transition-all">
                        Fiches & Supports
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="homework" className="m-0 outline-none">
                    <div className="grid grid-cols-1 gap-4">
                        <AnimatePresence mode="popLayout">
                            {homework.map((hw, idx) => {
                                const cfg = STATUS_CONFIG[hw.status] || STATUS_CONFIG["à faire"];
                                const isSelected = selectedHw === hw.id;
                                return (
                                    <motion.div
                                        key={hw.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className={`group relative bg-white border border-gray-100 transition-all duration-300 rounded-2xl overflow-hidden ${isSelected ? "ring-2 ring-[#1A6CC8]/20 shadow-md" : "shadow-sm hover:shadow-md"}`}>
                                            <CardContent className="p-0">
                                                <button
                                                    onClick={() => setSelectedHw(isSelected ? null : hw.id)}
                                                    className="w-full p-5 sm:p-6 flex items-center gap-4 sm:gap-6 text-left"
                                                >
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${cfg.bg} ${cfg.color}`}>
                                                        <cfg.Icon className="w-6 h-6" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="text-base font-bold text-[#0D2D5A] truncate group-hover:text-[#1A6CC8] transition-colors">{hw.title}</h3>
                                                            <Badge variant="outline" className={`${cfg.bg} ${cfg.color} border-none font-bold text-[9px] uppercase px-2 py-0.5 rounded-full`}>{cfg.label}</Badge>
                                                        </div>
                                                        <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400">
                                                            <span className="text-[#1A6CC8] font-bold">{hw.subject}</span>
                                                            <span className="opacity-30">•</span>
                                                            <div className="flex items-center gap-1.5"><User className="w-3 h-3" /> {hw.teacherName}</div>
                                                        </div>
                                                    </div>

                                                    <div className="hidden sm:flex flex-col items-end shrink-0 mr-4">
                                                        <span className="text-[10px] text-gray-400 uppercase font-semibold mb-0.5">Échéance</span>
                                                        <span className="text-xs font-bold text-[#0D2D5A]">{hw.dueDate}</span>
                                                    </div>

                                                    <div className={`w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center transition-all ${isSelected ? "rotate-180 bg-[#1A6CC8]/10 text-[#1A6CC8]" : "text-gray-300"}`}>
                                                        <ChevronDown className="w-4 h-4" />
                                                    </div>
                                                </button>

                                                <AnimatePresence>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: "auto", opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden bg-gray-50/30 border-t border-gray-100"
                                                        >
                                                            <div className="p-6 sm:p-8 space-y-6">
                                                                <div className="grid md:grid-cols-[1.5fr_1fr] gap-8">
                                                                    <div className="space-y-6">
                                                                        <div className="space-y-3">
                                                                            <h4 className="text-[11px] font-bold text-[#1A6CC8] uppercase tracking-wider">Consignes de l'enseignant</h4>
                                                                            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                                                <p className="text-sm text-[#0D2D5A] leading-relaxed">
                                                                                    {hw.description || "L'enseignant n'a pas laissé de consignes spécifiques."}
                                                                                </p>
                                                                            </div>
                                                                        </div>

                                                                        {hw.feedback && (
                                                                            <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-3">
                                                                                <div className="flex items-center gap-2">
                                                                                    <div className="p-1.5 bg-emerald-500 rounded-lg text-white"><Sparkles className="w-3.5 h-3.5" /></div>
                                                                                    <h5 className="font-bold text-emerald-700 text-sm">Appréciation</h5>
                                                                                </div>
                                                                                <p className="text-emerald-800 text-sm italic leading-relaxed">
                                                                                    "{hw.feedback}"
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Travail rendu</h4>
                                                                        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm text-center">
                                                                            {hw.submissionUrl ? (
                                                                                <div className="space-y-4">
                                                                                    <div className="w-16 h-16 bg-[#1A6CC8]/10 rounded-xl flex items-center justify-center mx-auto text-[#1A6CC8]">
                                                                                        <FileText className="w-8 h-8" />
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="text-sm font-bold text-[#0D2D5A]">Document en ligne</p>
                                                                                        <p className="text-[11px] text-gray-400 mt-1">Consultable par l'équipe.</p>
                                                                                    </div>
                                                                                    <Button className="w-full bg-[#1A6CC8] hover:bg-[#1A6CC8]/90 text-white h-10 rounded-xl font-bold text-xs" asChild>
                                                                                        <a href={hw.submissionUrl} target="_blank"><Eye className="w-4 h-4 mr-2" /> Visualiser</a>
                                                                                    </Button>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="py-4">
                                                                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-200">
                                                                                        <Clock className="w-6 h-6" />
                                                                                    </div>
                                                                                    <p className="text-xs font-medium text-gray-400 italic">Pas de document transmis</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
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
                    </div>
                </TabsContent>

                <TabsContent value="resources" className="m-0 outline-none">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {resources.map((res, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={res.id}
                            >
                                <Card className="bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full">
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-xl shadow-sm ${res.fileType === 'pdf' ? 'bg-orange-50 text-orange-500' : 'bg-[#1A6CC8]/5 text-[#1A6CC8]'}`}>
                                                {res.fileType === 'pdf' ? <FileText className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                            </div>
                                            <Badge variant="outline" className="text-[10px] font-bold border-gray-100 bg-gray-50/50 text-gray-500">{res.subject}</Badge>
                                        </div>
                                        <h4 className="text-base font-bold text-[#0D2D5A] leading-tight mb-2 group-hover:text-[#1A6CC8] transition-colors">{res.title}</h4>
                                        <p className="text-[11px] text-gray-400 mb-6">Par <span className="text-gray-600 font-medium">{res.teacherName}</span></p>
                                        <div className="mt-auto">
                                            <Button variant="outline" className="w-full h-9 rounded-lg border-gray-200 text-[#1A6CC8] font-bold text-xs hover:bg-[#1A6CC8]/5 transition-all" asChild>
                                                <a href={res.fileUrl} target="_blank">Ouvrir</a>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                        {resources.length === 0 && !loadingRes && (
                            <div className="col-span-full py-16 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 text-center flex flex-col items-center gap-3">
                                <BookOpen className="w-10 h-10 text-gray-200" />
                                <p className="text-gray-400 font-medium text-sm italic">Aucune ressource partagée pour le moment.</p>
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
