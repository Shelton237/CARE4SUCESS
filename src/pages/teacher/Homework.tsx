import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    ClipboardList,
    Plus,
    Search,
    Filter,
    Clock,
    CheckCircle2,
    Download,
    FileText,
    MoreVertical,
    Send,
    User,
    Link as LinkIcon,
    Trash2,
    FileUp,
    ChevronRight,
    GraduationCap,
    BookOpen,
    MessageSquare,
    Save,
    Calendar,
    LayoutGrid,
    ListFilter
} from "lucide-react";
import {
    fetchHomework,
    createHomework,
    updateHomework,
    fetchLessonResources,
    createLessonResource,
    deleteLessonResource,
    fetchStudentsByTeacher
} from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
    DrawerFooter
} from "@/components/ui/drawer";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherHomework() {
    const { user } = useAuth();
    const [searchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [drawers, setDrawers] = useState({ homework: false, resource: false, feedback: false });
    const [selectedHw, setSelectedHw] = useState<any>(null);

    // Form states
    const [newHw, setNewHw] = useState({ studentId: "", studentName: "", title: "", description: "", dueDate: "", subject: "", fileUrl: "", sessionId: "" });
    const [newRes, setNewRes] = useState({ studentId: "", title: "", fileUrl: "", fileType: "link", subject: "" });
    const [feedback, setFeedback] = useState("");

    // Queries
    const { data: homework = [], isLoading: loadingHw } = useQuery({
        queryKey: ["homework", "teacher", user?.id],
        queryFn: () => fetchHomework("teacher", user?.id || ""),
        enabled: !!user?.id
    });

    const { data: resources = [], isLoading: loadingRes } = useQuery({
        queryKey: ["lesson-resources", "teacher", user?.id],
        queryFn: () => fetchLessonResources("teacher", user?.id || ""),
        enabled: !!user?.id
    });

    const { data: students = [] } = useQuery({
        queryKey: ["teacher-students", user?.id],
        queryFn: () => fetchStudentsByTeacher(user?.id || ""),
        enabled: !!user?.id
    });

    useEffect(() => {
        const studentId = searchParams.get("studentId");
        const subject = searchParams.get("subject");
        const sessionId = searchParams.get("sessionId");
        if (studentId || subject || sessionId) {
            setNewHw(prev => ({
                ...prev,
                studentId: studentId || prev.studentId,
                subject: subject || prev.subject,
                sessionId: sessionId || prev.sessionId
            }));
            setDrawers(p => ({ ...p, homework: true }));
        }
    }, [searchParams]);

    // Mutations
    const createHwMutation = useMutation({
        mutationFn: createHomework,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["homework"] });
            setDrawers(p => ({ ...p, homework: false }));
            setNewHw({ studentId: "", studentName: "", title: "", description: "", dueDate: "", subject: "", fileUrl: "", sessionId: "" });
            toast.success("Devoir été assigné avec succès.");
        }
    });

    const createResMutation = useMutation({
        mutationFn: createLessonResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lesson-resources"] });
            setDrawers(p => ({ ...p, resource: false }));
            setNewRes({ studentId: "", title: "", fileUrl: "", fileType: "link", subject: "" });
            toast.success("Ressource partagée.");
        }
    });

    const updateHwMutation = useMutation({
        mutationFn: ({ id, payload }: { id: string, payload: any }) => updateHomework(id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["homework"] });
            setDrawers(p => ({ ...p, feedback: false }));
            toast.success("Devoir mis à jour.");
        }
    });

    const deleteResMutation = useMutation({
        mutationFn: deleteLessonResource,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["lesson-resources"] });
            toast.success("Ressource supprimée.");
        }
    });

    const filteredHomework = homework.filter(hw => {
        const matchesSearch = hw.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            hw.studentName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || hw.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const filteredResources = resources.filter(res =>
        res.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-1000">
            {/* --- PREMIUM HEADER --- */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/40 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/20 shadow-2xl shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="space-y-1 z-10">
                    <h1 className="text-4xl font-black text-[#0D2D5A] tracking-tighter">
                        Homework <span className="text-[#1A6CC8]">Vault</span>
                    </h1>
                    <p className="text-gray-500 font-medium">Contrôlez la progression et partagez vos savoirs.</p>
                </div>
                <div className="flex gap-3 z-10">
                    <Button onClick={() => setDrawers(p => ({ ...p, homework: true }))} className="bg-[#1A6CC8] hover:bg-blue-700 text-white rounded-2xl h-14 px-8 font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                        <Plus className="mr-2 h-5 w-5" /> Nouveau Devoir
                    </Button>
                    <Button onClick={() => setDrawers(p => ({ ...p, resource: true }))} variant="outline" className="bg-white/80 hover:bg-white text-[#1A6CC8] border-blue-100 rounded-2xl h-14 px-8 font-bold shadow-sm transition-all hover:scale-105">
                        <FileUp className="mr-2 h-5 w-5" /> Partager Fiche
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="homework" className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <TabsList className="bg-white/50 backdrop-blur-xl p-1.5 rounded-[1.5rem] border border-gray-100 shadow-sm self-start">
                        <TabsTrigger value="homework" className="rounded-xl px-8 py-3 data-[state=active]:bg-[#0D2D5A] data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                            <ClipboardList className="w-4 h-4 mr-2" /> Devoirs
                        </TabsTrigger>
                        <TabsTrigger value="resources" className="rounded-xl px-8 py-3 data-[state=active]:bg-[#0D2D5A] data-[state=active]:text-white font-black text-xs uppercase tracking-widest transition-all">
                            <BookOpen className="w-4 h-4 mr-2" /> Bibliothèque
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex gap-4 flex-1 max-w-2xl justify-end">
                        <div className="relative flex-1 group max-w-sm">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#1A6CC8] transition-colors" />
                            <Input placeholder="Rechercher un élève ou un titre..." className="pl-11 rounded-2xl border-none bg-white/50 backdrop-blur h-12 shadow-sm focus:ring-2 focus:ring-blue-500/20" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] rounded-2xl h-12 border-none bg-white/50 backdrop-blur shadow-sm">
                                <ListFilter className="w-4 h-4 mr-2 text-blue-500" /><SelectValue placeholder="Tous les statuts" />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl">
                                <SelectItem value="all">Tous</SelectItem>
                                <SelectItem value="à faire">À faire</SelectItem>
                                <SelectItem value="rendu">Rendus</SelectItem>
                                <SelectItem value="corrigé">Corrigés</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <TabsContent value="homework" className="m-0 outline-none">
                    <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {loadingHw ? (
                            <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500 opacity-20" /></div>
                        ) : filteredHomework.map((hw, idx) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                key={hw.id}
                            >
                                <Card className="group relative bg-white border-none shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 rounded-[2.5rem] overflow-hidden">
                                    <CardContent className="p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="bg-blue-50/50 p-3 rounded-2xl text-[#1A6CC8]">
                                                <ClipboardList className="w-6 h-6" />
                                            </div>
                                            <Badge className={`rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none ${hw.status === 'à faire' ? 'bg-orange-100 text-orange-600' :
                                                hw.status === 'rendu' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-green-100 text-green-600'
                                                }`}>
                                                {hw.status}
                                            </Badge>
                                        </div>

                                        <h3 className="text-xl font-black text-[#0D2D5A] mb-2 leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{hw.title}</h3>
                                        <div className="flex items-center gap-2 mb-6">
                                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border border-white shadow-sm">{hw.studentName.charAt(0)}</div>
                                            <span className="text-sm font-bold text-gray-500">{hw.studentName}</span>
                                            <span className="text-gray-300 mx-1">•</span>
                                            <span className="text-xs font-black text-blue-400 uppercase tracking-widest">{hw.subject}</span>
                                        </div>

                                        <div className="space-y-4 pt-6 border-t border-gray-50">
                                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> Pour le {hw.dueDate}</div>
                                            </div>

                                            <div className="flex gap-2">
                                                {hw.status === 'rendu' && (
                                                    <Button onClick={() => { setSelectedHw(hw); setDrawers(p => ({ ...p, feedback: true })); setFeedback(hw.feedback || ""); }} className="flex-1 bg-[#0D2D5A] hover:bg-black text-white rounded-xl h-12 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-900/10">
                                                        Corriger le travail
                                                    </Button>
                                                )}
                                                {hw.status === 'corrigé' && (
                                                    <Button onClick={() => { setSelectedHw(hw); setDrawers(p => ({ ...p, feedback: true })); setFeedback(hw.feedback || ""); }} variant="outline" className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase tracking-widest border-gray-100">
                                                        Voir Feedback
                                                    </Button>
                                                )}
                                                {hw.status === 'à faire' && (
                                                    <Button variant="ghost" className="flex-1 rounded-xl h-12 font-black text-[10px] uppercase tracking-widest text-gray-400 cursor-default">
                                                        En attente de l'élève
                                                    </Button>
                                                )}

                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 hover:bg-gray-50"><MoreVertical className="w-5 h-5 text-gray-400" /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl p-2 min-w-[180px]">
                                                        <DropdownMenuItem onClick={() => updateHwMutation.mutate({ id: hw.id, payload: { status: 'à faire' } })} className="rounded-xl font-bold text-xs py-3">Réinitialiser statut</DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-xl font-bold text-xs py-3 text-red-500">Supprimer Devoir</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="resources" className="m-0 outline-none">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                        {loadingRes ? (
                            <div className="col-span-full py-20 text-center"><Loader2 className="w-10 h-10 animate-spin mx-auto text-blue-500 opacity-20" /></div>
                        ) : filteredResources.map((res, idx) => (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={res.id}
                            >
                                <Card className="group bg-white border-2 border-transparent hover:border-blue-50 shadow-sm hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col h-full">
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-3 rounded-2xl ${res.fileType === 'pdf' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>
                                                {res.fileType === 'pdf' ? <FileText className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                                            </div>
                                            <button onClick={() => deleteResMutation.mutate(res.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                        <h4 className="font-black text-[#0D2D5A] text-lg mb-2 leading-tight uppercase tracking-tight">{res.title}</h4>
                                        <div className="flex items-center gap-2 mb-6">
                                            <Badge variant="outline" className="border-blue-50 text-[9px] font-black uppercase tracking-widest text-blue-400">{res.subject}</Badge>
                                            {res.studentName && <span className="text-[10px] font-bold text-gray-400">Pour: {res.studentName}</span>}
                                        </div>
                                        <div className="mt-auto">
                                            <Button variant="secondary" className="w-full rounded-xl font-black text-[10px] uppercase tracking-widest h-12 bg-gray-50 hover:bg-[#1A6CC8] hover:text-white transition-all shadow-sm" asChild>
                                                <a href={res.fileUrl} target="_blank" rel="noopener noreferrer">Ouvrir la ressource</a>
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>

            {/* --- DRAWERS --- */}

            {/* New Homework Drawer */}
            <Drawer open={drawers.homework} onOpenChange={(o) => setDrawers(p => ({ ...p, homework: o }))}>
                <DrawerContent className="max-h-[85vh]">
                    <div className="mx-auto w-full max-w-lg p-8 space-y-8">
                        <DrawerHeader className="p-0">
                            <DrawerTitle className="text-3xl font-black text-[#0D2D5A] tracking-tighter uppercase">Nouveau Devoir</DrawerTitle>
                            <DrawerDescription>Assignez une tâche spécifique à un élève.</DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Élève concerné</Label>
                                <Select value={newHw.studentId} onValueChange={(val) => {
                                    const student = students.find(s => s.id === val);
                                    setNewHw(p => ({ ...p, studentId: val, studentName: student?.name || "" }));
                                }}>
                                    <SelectTrigger className="rounded-2xl h-14 border-gray-100 bg-gray-50/50">
                                        <SelectValue placeholder="Sélectionner un élève" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        {students.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Titre du devoir</Label>
                                <Input className="rounded-2xl h-14 border-gray-100 bg-gray-50/50" placeholder="Ex: Exercices Suites Numériques" value={newHw.title} onChange={e => setNewHw(p => ({ ...p, title: e.target.value }))} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Matière</Label>
                                    <Input className="rounded-xl h-12 border-gray-100 bg-gray-50/50" value={newHw.subject} onChange={e => setNewHw(p => ({ ...p, subject: e.target.value }))} />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Date d'échéance</Label>
                                    <Input type="date" className="rounded-xl h-12 border-gray-100 bg-gray-50/50" value={newHw.dueDate} onChange={e => setNewHw(p => ({ ...p, dueDate: e.target.value }))} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Consignes détaillées</Label>
                                <Textarea className="rounded-2xl min-h-[120px] border-gray-100 bg-gray-50/50" placeholder="Décrivez ce que l'élève doit faire..." value={newHw.description} onChange={e => setNewHw(p => ({ ...p, description: e.target.value }))} />
                            </div>
                        </div>

                        <Button onClick={() => user?.id && createHwMutation.mutate({ ...newHw, teacherId: user.id })} disabled={createHwMutation.isPending} className="w-full bg-[#1A6CC8] hover:bg-blue-700 h-16 rounded-[2rem] font-black text-white text-lg shadow-xl shadow-blue-500/20">
                            {createHwMutation.isPending ? "Assignation en cours..." : "Assigner le devoir"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* New Resource Drawer */}
            <Drawer open={drawers.resource} onOpenChange={(o) => setDrawers(p => ({ ...p, resource: o }))}>
                <DrawerContent className="max-h-[85vh]">
                    <div className="mx-auto w-full max-w-lg p-8 space-y-8">
                        <DrawerHeader className="p-0">
                            <DrawerTitle className="text-3xl font-black text-[#0D2D5A] tracking-tighter uppercase text-center">Partage Documentaire</DrawerTitle>
                            <DrawerDescription className="text-center font-medium">Mettez à disposition des fiches de cours ou liens utiles.</DrawerDescription>
                        </DrawerHeader>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Titre de la fiche</Label>
                                <Input className="rounded-2xl h-14 border-gray-100 bg-gray-50/50" value={newRes.title} onChange={e => setNewRes(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Matière concernée</Label>
                                <Input className="rounded-2xl h-14 border-gray-100 bg-gray-50/50" value={newRes.subject} onChange={e => setNewRes(p => ({ ...p, subject: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Lien du document (Drive, PDF, etc)</Label>
                                <Input className="rounded-2xl h-14 border-gray-100 bg-gray-50/50" value={newRes.fileUrl} onChange={e => setNewRes(p => ({ ...p, fileUrl: e.target.value }))} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">Type de ressource</Label>
                                <Select value={newRes.fileType} onValueChange={v => setNewRes(p => ({ ...p, fileType: v }))}>
                                    <SelectTrigger className="rounded-2xl h-14 border-gray-100 bg-gray-50/50"><SelectValue /></SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="link">Lien interactif / Vidéo</SelectItem>
                                        <SelectItem value="pdf">Document PDF</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Button onClick={() => user?.id && createResMutation.mutate({ ...newRes, teacherId: user.id })} disabled={createResMutation.isPending} className="w-full bg-[#1A6CC8] hover:bg-blue-700 h-16 rounded-[2rem] font-black text-white text-lg shadow-xl shadow-blue-500/20">
                            {createResMutation.isPending ? "Partage..." : "Pousser en bibliothèque"}
                        </Button>
                    </div>
                </DrawerContent>
            </Drawer>

            {/* Feedback & Correction Drawer */}
            <Drawer open={drawers.feedback} onOpenChange={(o) => setDrawers(p => ({ ...p, feedback: o }))}>
                <DrawerContent className="max-h-[90vh]">
                    {selectedHw && (
                        <div className="mx-auto w-full max-w-4xl p-8 grid grid-cols-1 md:grid-cols-[1fr_350px] gap-10">
                            <div className="space-y-8">
                                <DrawerHeader className="p-0">
                                    <div className="flex items-center gap-4 mb-2">
                                        <Badge className="bg-blue-50 text-blue-500 border-none font-black text-[10px] tracking-widest uppercase rounded-lg">Studio de Correction</Badge>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-sm font-bold text-gray-400">{selectedHw.studentName}</span>
                                    </div>
                                    <DrawerTitle className="text-4xl font-black text-[#0D2D5A] tracking-tighter uppercase">{selectedHw.title}</DrawerTitle>
                                </DrawerHeader>

                                <div className="bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-100 space-y-6">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#1A6CC8] uppercase tracking-[0.2em]">Travail rendu par l'élève</h4>
                                        {selectedHw.submissionUrl ? (
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><FileText className="w-6 h-6" /></div>
                                                    <div>
                                                        <p className="font-bold text-[#0D2D5A]">Document de réponse</p>
                                                        <p className="text-xs text-gray-400">Cliquez pour consulter le travail</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" className="rounded-xl font-black text-[10px] uppercase tracking-widest border-blue-100 text-blue-600 px-6" asChild>
                                                    <a href={selectedHw.submissionUrl} target="_blank" rel="noopener noreferrer">Consulter</a>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center text-gray-400 italic bg-white/50 rounded-3xl border border-dashed border-gray-200 font-medium">Aucun fichier joint à la réponse.</div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-[#1A6CC8] uppercase tracking-[0.2em]">Votre feedback pédagogique</h4>
                                        <Textarea
                                            className="min-h-[250px] rounded-3xl border-none bg-white p-6 text-sm leading-relaxed focus:ring-4 focus:ring-blue-500/10 shadow-inner"
                                            placeholder="Bravo pour ton travail ! Voici quelques pistes d'amélioration..."
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6 flex flex-col justify-end pb-8">
                                <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h5 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Résumé de la tâche</h5>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Matière</span><span className="text-[#0D2D5A]">{selectedHw.subject}</span></div>
                                        <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Assigné le</span><span className="text-[#0D2D5A]">{selectedHw.createdAt}</span></div>
                                        <div className="flex justify-between text-xs font-bold"><span className="text-gray-400">Statut</span><Badge className="bg-blue-100 text-blue-600 rounded-lg">{selectedHw.status}</Badge></div>
                                    </div>
                                </div>

                                <Button
                                    onClick={() => updateHwMutation.mutate({ id: selectedHw.id, payload: { feedback, status: 'corrigé' } })}
                                    className="w-full bg-[#1A6CC8] hover:bg-blue-700 text-white rounded-[2rem] h-16 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/20"
                                >
                                    Valider & Envoyer la correction
                                </Button>
                                <Button variant="ghost" onClick={() => setDrawers(p => ({ ...p, feedback: false }))} className="w-full rounded-2xl h-12 font-bold text-xs text-gray-400">Plus tard</Button>
                            </div>
                        </div>
                    )}
                </DrawerContent>
            </Drawer>

        </div>
    );
}

function Loader2(props: any) { return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-loader-2 animate-spin"><path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" /><path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" /><path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" /></svg>; }
