import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleByRole, fetchCourseDetails } from "@/api/backoffice";
import { jsPDF } from "jspdf";
import {
    Loader2,
    X,
    MonitorPlay,
    VideoOff,
    Save,
    RefreshCw,
    FileText,
    ChevronRight,
    ChevronLeft,
    Download,
    Palette,
    Code2,
    Eraser,
    Share2,
    Video,
    CheckCircle2
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
    sessionCheckIn, 
    sessionCheckOut, 
    submitSessionReport,
    createHomework
} from "@/api/backoffice";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { StarIcon, BookOpen } from "lucide-react";

declare global {
    interface Window {
        JitsiMeetExternalAPI: any;
    }
}

export default function VirtualClassroom() {
    const { sessionId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Workspace state
    const [activeTab, setActiveTab] = useState(window.innerWidth < 768 ? "video" : "notes");
    const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

    // Sync state
    const [notes, setNotes] = useState("");
    const [code, setCode] = useState("// Saisissez votre code ici...");
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const isEditingRef = useRef(false);

    // Whiteboard state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState("#1A6CC8");
    const [tool, setTool] = useState<"pen" | "eraser">("pen");

    // Session Management State
    const [isReportOpen, setIsReportOpen] = useState(false);
    const queryClient = useQueryClient();

    // Homework Assignment state
    const [showHomeworkForm, setShowHomeworkForm] = useState(false);

    // Query Data
    const { data: schedule, refetch: refetchSession } = useQuery({
        queryKey: ["session-details", sessionId],
        queryFn: () => fetchScheduleByRole(user?.role as any, user?.id as any),
        enabled: Boolean(sessionId && user),
        refetchInterval: 5000, // Poll every 5s for collaboration
    });

    const currentSession = schedule?.find(s => s.id === sessionId);

    // Sync incoming data
    useEffect(() => {
        if (!isEditingRef.current && currentSession) {
            if (currentSession.notes !== undefined) setNotes(currentSession.notes || "");
            if (currentSession.codeData !== undefined) setCode(currentSession.codeData || "// Saisissez votre code ici...");

            if (currentSession.whiteboardData && canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                const img = new Image();
                img.onload = () => ctx?.drawImage(img, 0, 0);
                img.src = currentSession.whiteboardData;
            }
        }
    }, [currentSession]);

    // Mutations
    const checkInMutation = useMutation({
        mutationFn: sessionCheckIn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session-details", sessionId] });
            toast.success("Session démarrée (Check-in)");
        }
    });

    const checkOutMutation = useMutation({
        mutationFn: sessionCheckOut,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["session-details", sessionId] });
            toast.success("Session terminée (Check-out)");
            if (user?.role === 'teacher') {
                setIsReportOpen(true);
            }
        }
    });

    // Sync outgoing data
    const syncWorkspace = useCallback(async (payload: any) => {
        if (!sessionId) return;
        setIsSaving(true);
        try {
            await fetch(`${import.meta.env.VITE_API_URL || "/api"}/sessions/${sessionId}/sync`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            setLastSaved(new Date());
        } catch (err) {
            console.error("Sync error", err);
        } finally {
            setIsSaving(false);
        }
    }, [sessionId]);

    // Debounced sync for text-based fields
    const timerRef = useRef<any>(null);
    const handleWorkspaceUpdate = (type: 'notes' | 'code' | 'whiteboard', value: any) => {
        isEditingRef.current = true;
        if (type === 'notes') setNotes(value);
        if (type === 'code') setCode(value);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const payload: any = {};
            if (type === 'notes') payload.notes = value;
            if (type === 'code') payload.codeData = value;
            if (type === 'whiteboard') payload.whiteboardData = value;

            syncWorkspace(payload).then(() => {
                setTimeout(() => { isEditingRef.current = false; }, 1000);
            });
        }, 1500);
    };

    // Whiteboard Draw Logic
    const startDrawing = (e: any) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.getContext('2d')?.beginPath();
            handleWorkspaceUpdate('whiteboard', canvas.toDataURL());
        }
    };

    const draw = (e: any) => {
        if (!isDrawing || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0]?.clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0]?.clientY) - rect.top;

        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
        ctx.lineWidth = tool === 'eraser' ? 20 : 3;
        ctx.lineCap = 'round';
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    // Keep a ref to currentSession to avoid stale closures in Jitsi events
    const currentSessionRef = useRef<any>(null);
    useEffect(() => { currentSessionRef.current = currentSession; }, [currentSession]);

    // Jitsi Init — loads script dynamically then initializes, with timeout fallback
    const jitsiApiRef = useRef<any>(null);
    const hasJoinedRef = useRef(false);

    useEffect(() => {
        if (!sessionId || !user || !jitsiContainerRef.current) return;
        if (jitsiApiRef.current) return;

        const initJitsi = () => {
            if (!window.JitsiMeetExternalAPI || !jitsiContainerRef.current) return;
            if (jitsiApiRef.current) return;

            const sanitizedRoomName = `Care4Success-${sessionId?.replace(/[^a-zA-Z0-9]/g, '-')}`;
            const api = new window.JitsiMeetExternalAPI("meet.care4success.usra-care.com", {
                roomName: sanitizedRoomName,
                width: "100%",
                height: "100%",
                parentNode: jitsiContainerRef.current,
                userInfo: { displayName: user.name, email: user.email },
                interfaceConfigOverwrite: {
                    TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview', 'fullscreen', 'participants-pane']
                },
                configOverwrite: {
                    disableDeepLinking: true,
                    prejoinPageEnabled: false,
                    startWithAudioMuted: false,
                    startWithVideoMuted: false,
                    enableWelcomePage: false,
                    p2p: { enabled: true },
                    enableTcc: true,
                    enableRemb: true,
                    iceTransportPolicy: 'all',
                },
            });
            jitsiApiRef.current = api;
            setLoading(false);

            api.addEventListener('videoConferenceJoined', () => {
                hasJoinedRef.current = true;
                if (user.role === 'teacher' && !currentSessionRef.current?.actualStartTime) {
                    checkInMutation.mutate(sessionId);
                }
            });

            api.addEventListener('videoConferenceLeft', () => {
                if (!hasJoinedRef.current) return; // Don't handle if we never joined
                
                if (user.role === 'teacher' && !currentSessionRef.current?.actualEndTime) {
                    checkOutMutation.mutate(sessionId);
                } else {
                    navigate(-1);
                }
            });

            api.addEventListener('error', (err: any) => {
                console.error("Jitsi Error Event:", err);
                toast.error("Erreur de connexion à la classe virtuelle.");
            });
        };

        if (window.JitsiMeetExternalAPI) {
            initJitsi();
            return () => {
                if (jitsiApiRef.current) {
                    try { jitsiApiRef.current.dispose(); } catch {}
                    jitsiApiRef.current = null;
                }
            };
        }

        // Dynamically load the Jitsi script (not in index.html to avoid global DNS errors)
        const existingScript = document.getElementById('jitsi-api-script');
        if (!existingScript) {
            const script = document.createElement('script');
            script.id = 'jitsi-api-script';
            script.src = 'https://meet.care4success.usra-care.com/external_api.js';
            script.async = true;
            document.head.appendChild(script);
        }

        let attempts = 0;
        const maxAttempts = 50; // 15 seconds total (50 × 300ms)
        const timer = setInterval(() => {
            attempts++;
            if (window.JitsiMeetExternalAPI) {
                clearInterval(timer);
                initJitsi();
            } else if (attempts >= maxAttempts) {
                clearInterval(timer);
                setError("Impossible de charger le module de visioconférence. Vérifiez votre connexion réseau.");
                setLoading(false);
            }
        }, 300);

        return () => {
            clearInterval(timer);
            if (jitsiApiRef.current) {
                try { jitsiApiRef.current.dispose(); } catch {}
                jitsiApiRef.current = null;
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId, user?.id]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0D2D5A] flex flex-col h-screen w-screen overflow-hidden text-slate-900">
            {/* Minimal Glossy Header */}
            <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-4 md:px-6 shrink-0 z-[70]">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5">
                        <img src="/logo/Care 4 Success-logo-Ok_compact.png" className="w-full h-full object-contain" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">{currentSession?.subject || "Session Live"}</h1>
                        <p className="text-blue-300/40 text-[8px] font-bold uppercase tracking-widest">{user?.name}</p>
                    </div>
                    <div className="sm:hidden">
                        <h1 className="text-white font-black text-[9px] uppercase tracking-tight truncate max-w-[100px]">{currentSession?.subject}</h1>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="hidden md:flex bg-white/5 p-1 rounded-xl items-center gap-1 border border-white/5">
                        <Button variant={activeTab === 'notes' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('notes')} className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-3">
                            <FileText className="w-3 h-3 mr-1.5" /> Notes
                        </Button>
                        <Button variant={activeTab === 'whiteboard' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('whiteboard')} className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-3">
                            <Palette className="w-3 h-3 mr-1.5" /> Board
                        </Button>
                        <Button variant={activeTab === 'code' ? 'secondary' : 'ghost'} size="sm" onClick={() => setActiveTab('code')} className="h-8 rounded-lg text-[9px] font-black uppercase tracking-widest px-3 text-blue-200">
                            <Code2 className="w-3 h-3 mr-1.5" /> Code
                        </Button>
                    </div>

                    <div className="hidden md:block w-px h-6 bg-white/10 mx-2" />

                    <button 
                        onClick={() => setShowSidebar(!showSidebar)} 
                        className="hidden md:flex p-2 text-white hover:bg-white/10 rounded-xl transition-colors"
                    >
                        {showSidebar ? <ChevronRight /> : <ChevronLeft />}
                    </button>

                    <button onClick={() => navigate(-1)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <main className="flex-1 flex overflow-hidden relative">
                {/* Video Area */}
                <div className={cn(
                    "flex-1 bg-slate-950 relative overflow-hidden transition-all duration-300",
                    activeTab !== 'video' && "hidden md:block"
                )}>
                    {(loading || error) && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0D2D5A]">
                            {error ? (
                                <>
                                    <div className="w-12 h-12 bg-red-500/10 border border-red-400/30 flex items-center justify-center mb-4">
                                        <X className="w-6 h-6 text-red-400" />
                                    </div>
                                    <p className="text-white/70 font-black text-[10px] uppercase tracking-widest text-center max-w-xs px-4">{error}</p>
                                    <button onClick={() => navigate(-1)} className="mt-6 px-6 py-2 bg-white/10 text-white font-black text-[9px] uppercase tracking-widest hover:bg-white/20 transition-colors border border-white/10">
                                        Retour
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Loader2 className="w-10 h-10 text-white animate-spin opacity-20" />
                                    <p className="text-white/30 font-black text-[8px] uppercase tracking-[0.3em] mt-4">Initializing Security Engine...</p>
                                </>
                            )}
                        </div>
                    )}
                    <div ref={jitsiContainerRef} className="w-full h-full" />
                </div>

                {/* Sidebar / Tools Area */}
                <aside className={cn(
                    "bg-white shadow-2xl transition-all duration-500 flex flex-col relative overflow-hidden",
                    activeTab === 'video' ? "hidden md:flex" : "flex",
                    showSidebar ? "w-full md:w-[450px]" : "w-0 md:w-0"
                )}>
                    <div className="absolute top-4 right-4 z-10 hidden md:block">
                        {isSaving ? (
                            <Badge className="bg-blue-50 text-blue-500 border-none animate-pulse flex items-center gap-1.5 h-6 font-black text-[9px] uppercase tracking-widest">
                                <RefreshCw className="w-3 h-3 animate-spin" /> SYNC
                            </Badge>
                        ) : (
                            <Badge className="bg-emerald-500 text-white border-none flex items-center gap-1.5 h-6 font-black text-[9px] uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 className="w-3 h-3" /> SAUVEGARDÉ
                            </Badge>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col pt-4 md:pt-12">
                        {/* Notes View */}
                        <div className={cn("flex-1 flex flex-col", activeTab !== 'notes' && "hidden")}>
                            <div className="px-6 md:px-8 flex-1 flex flex-col">
                                <h2 className="text-xl md:text-2xl font-black text-[#0D2D5A] mb-1 md:mb-1 uppercase tracking-tighter">Notes <span className="text-blue-600">Live</span></h2>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-4 md:mb-8">Compte-rendu partagé en temps réel</p>
                                <textarea
                                    className="flex-1 w-full text-sm leading-relaxed text-slate-600 focus:outline-none resize-none border-none p-0 placeholder:italic bg-transparent"
                                    placeholder="Commencez à rédiger..."
                                    value={notes}
                                    onChange={(e) => handleWorkspaceUpdate('notes', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Whiteboard View */}
                        <div className={cn("flex-1 flex flex-col p-4 md:p-6 gap-4", activeTab !== 'whiteboard' && "hidden")}>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><Palette className="w-4 h-4" /></button>
                                    <button onClick={() => setTool('eraser')} className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><Eraser className="w-4 h-4" /></button>
                                </div>
                                <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-8 h-8 rounded-xl cursor-pointer shadow-sm border-2 border-slate-50" />
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-[2rem] shadow-inner overflow-hidden border border-slate-100 relative">
                                <canvas
                                    ref={canvasRef}
                                    width={1200}
                                    height={1600}
                                    className="w-full h-full cursor-crosshair"
                                    onMouseDown={startDrawing}
                                    onMouseUp={stopDrawing}
                                    onMouseMove={draw}
                                    onTouchStart={startDrawing}
                                    onTouchEnd={stopDrawing}
                                    onTouchMove={draw}
                                />
                            </div>
                        </div>

                        {/* Code View */}
                        <div className={cn("flex-1 flex flex-col", activeTab !== 'code' && "hidden")}>
                            <div className="flex-1 bg-slate-900 mx-3 md:mx-4 mb-3 md:mb-4 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                                <div className="p-3 md:p-4 flex items-center gap-2 border-b border-white/5">
                                    <div className="flex gap-1.5"><div className="w-2 h-2 rounded-full bg-red-400/20" /><div className="w-2 h-2 rounded-full bg-yellow-400/20" /><div className="w-2 h-2 rounded-full bg-green-400/20" /></div>
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Sandbox.js</span>
                                </div>
                                <textarea
                                    className="flex-1 w-full bg-transparent text-blue-200 font-mono text-[10px] md:text-xs p-4 md:p-8 focus:outline-none resize-none"
                                    value={code}
                                    onChange={(e) => handleWorkspaceUpdate('code', e.target.value)}
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        {/* Common Footer Actions */}
                        <div className="p-4 md:p-8 bg-white border-t border-slate-50 flex flex-col gap-3 pb-20 md:pb-8">
                            <div className="flex gap-3">
                                <Button onClick={() => {}} className="flex-1 h-11 rounded-xl bg-[#0D2D5A] hover:bg-[#153460] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-200 transition-all active:scale-95">
                                    <Download className="w-4 h-4 mr-2" /> EXPORT PDF
                                </Button>
                                {user?.role === 'teacher' && !currentSession?.actualEndTime && (
                                    <Button 
                                        variant="destructive" 
                                        onClick={() => checkOutMutation.mutate(sessionId!)}
                                        className="h-11 rounded-xl bg-[#E91E63] hover:bg-rose-600 font-black text-[10px] uppercase tracking-widest px-6 shadow-xl shadow-rose-100 transition-all active:scale-95 border-none"
                                        disabled={checkOutMutation.isPending}
                                    >
                                        TERMINER
                                    </Button>
                                )}
                            </div>
                            
                            {user?.role === 'teacher' && (
                                <Button 
                                    variant="outline" 
                                    onClick={() => setShowHomeworkForm(true)}
                                    className="h-10 rounded-xl font-black text-[10px] uppercase tracking-[0.15em] border-blue-100 text-blue-600 bg-blue-50/10 hover:bg-blue-50 transition-all"
                                >
                                    ASSIGNER UN DEVOIR
                                </Button>
                            )}
                        </div>
                    </div>
                </aside>
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-100 flex items-center justify-around z-[80] px-2 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={() => { setActiveTab('video'); setShowSidebar(false); }}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all flex-1 py-2",
                        activeTab === 'video' ? "text-blue-600 scale-110" : "text-slate-400"
                    )}
                >
                    <Video className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Visio</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('notes'); setShowSidebar(true); }}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all flex-1 py-2",
                        activeTab === 'notes' ? "text-blue-600 scale-110" : "text-slate-400"
                    )}
                >
                    <FileText className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Notes</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('whiteboard'); setShowSidebar(true); }}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all flex-1 py-2",
                        activeTab === 'whiteboard' ? "text-blue-600 scale-110" : "text-slate-400"
                    )}
                >
                    <Palette className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Board</span>
                </button>
                <button 
                    onClick={() => { setActiveTab('code'); setShowSidebar(true); }}
                    className={cn(
                        "flex flex-col items-center gap-1 transition-all flex-1 py-2",
                        activeTab === 'code' ? "text-blue-600 scale-110" : "text-slate-400"
                    )}
                >
                    <Code2 className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase tracking-tighter">Code</span>
                </button>
            </nav>

            {/* Session Report Modal */}
            <SessionReportModal 
                isOpen={isReportOpen} 
                onClose={() => {
                    setIsReportOpen(false);
                    navigate(-1);
                }}
                sessionId={sessionId!}
                sessionDetails={currentSession}
            />

            {/* Homework Assignment Modal */}
            <HomeworkModal 
                isOpen={showHomeworkForm} 
                onClose={() => setShowHomeworkForm(false)}
                sessionId={sessionId!}
                sessionDetails={currentSession}
                teacherId={user?.id!}
            />
        </div>
    );
}

const reportSchema = z.object({
    reportText: z.string().min(10, "Veuillez fournir un rapport détaillé."),
    understandingScore: z.number().min(1).max(20),
    rating: z.number().min(1).max(5),
    comment: z.string().optional(),
    lessonId: z.string().optional(),
});

function SessionReportModal({ isOpen, onClose, sessionId, sessionDetails }: { isOpen: boolean, onClose: () => void, sessionId: string, sessionDetails: any }) {
    const { data: courseDetails } = useQuery({
        queryKey: ["course-details", sessionDetails?.courseId],
        queryFn: () => fetchCourseDetails(sessionDetails?.courseId!),
        enabled: Boolean(isOpen && sessionDetails?.courseId),
    });

    const form = useForm<z.infer<typeof reportSchema>>({
        resolver: zodResolver(reportSchema),
        defaultValues: {
            reportText: "",
            understandingScore: 12,
            rating: 5,
            comment: "",
            lessonId: sessionDetails?.lessonId || "",
        },
    });

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof reportSchema>) => submitSessionReport(sessionId, {
            reportText: values.reportText,
            understandingScore: values.understandingScore,
            rating: values.rating,
            comment: values.comment,
            lessonId: values.lessonId,
        }),
        onSuccess: () => {
            toast.success("Rapport enregistré avec succès !");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Erreur lors de l'enregistrement du rapport.");
        }
    });

    const onSubmit = (values: z.infer<typeof reportSchema>) => {
        mutation.mutate(values);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-[#0D2D5A] p-4 md:p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight">Rapport de Session</DialogTitle>
                        <DialogDescription className="text-blue-200/60 text-xs font-bold uppercase tracking-widest">
                            {sessionDetails?.studentName} • {sessionDetails?.subject}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 md:p-8 space-y-6">
                        {courseDetails && (
                            <FormField
                                control={form.control}
                                name="lessonId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Leçon dispensée</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-xl bg-slate-50 border-slate-100">
                                                    <SelectValue placeholder="Sélectionner la leçon" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent className="rounded-xl border-slate-100">
                                                {courseDetails.lessons?.filter((lesson: any, index: number, self: any[]) =>
                                                    index === self.findIndex((l: any) => l.title?.trim().toLowerCase() === lesson.title?.trim().toLowerCase())
                                                ).map((lesson: any) => (
                                                    <SelectItem key={lesson.id} value={lesson.id}>
                                                        {lesson.title}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <FormField
                            control={form.control}
                            name="reportText"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rapport de cours</FormLabel>
                                    <FormControl>
                                        <Textarea 
                                            placeholder="Quels concepts ont été abordés ? Quelles sont les difficultés rencontrées ?" 
                                            className="min-h-[120px] rounded-2xl border-slate-100 bg-slate-50 focus:ring-blue-500/20"
                                            {...field} 
                                        />
                                    </FormControl>
                                    <FormMessage className="text-[10px]" />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <FormField
                                control={form.control}
                                name="understandingScore"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compréhension (/20)</FormLabel>
                                        <FormControl>
                                            <div className="space-y-4 pt-2">
                                                <Slider 
                                                    min={0} 
                                                    max={20} 
                                                    step={1} 
                                                    value={[field.value]} 
                                                    onValueChange={(val) => field.onChange(val[0])}
                                                    className="[&_[role=slider]]:bg-blue-600"
                                                />
                                                <div className="text-center font-black text-[#0D2D5A] text-xl">{field.value}</div>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="rating"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assiduité Élève</FormLabel>
                                        <FormControl>
                                            <div className="flex gap-1 pt-2">
                                                {[1, 2, 3, 4, 5].map((s) => (
                                                    <button
                                                        key={s}
                                                        type="button"
                                                        onClick={() => field.onChange(s)}
                                                        className={`p-1.5 transition-all ${field.value >= s ? "text-orange-400 scale-110" : "text-slate-200 hover:text-orange-200"}`}
                                                    >
                                                        <StarIcon className={`w-5 h-5 ${field.value >= s ? "fill-current" : ""}`} />
                                                    </button>
                                                ))}
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <Button 
                            type="submit" 
                            className="w-full h-14 rounded-2xl bg-[#0D2D5A] hover:bg-[#153460] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-900/10"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Enregistrement..." : "Soumettre le rapport"}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

const homeworkSchema = z.object({
    title: z.string().min(3, "Le titre est trop court"),
    description: z.string().optional(),
    dueDate: z.string().min(1, "Date requise"),
});

function HomeworkModal({ isOpen, onClose, sessionId, sessionDetails, teacherId }: { isOpen: boolean, onClose: () => void, sessionId: string, sessionDetails: any, teacherId: string }) {
    const form = useForm<z.infer<typeof homeworkSchema>>({
        resolver: zodResolver(homeworkSchema),
        defaultValues: {
            title: "",
            description: "",
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // +7 days
        },
    });

    const mutation = useMutation({
        mutationFn: (values: z.infer<typeof homeworkSchema>) => createHomework({
            title: values.title,
            description: values.description,
            dueDate: values.dueDate,
            teacherId,
            studentId: sessionDetails?.studentId,
            sessionId,
            subject: sessionDetails?.subject || "Général",
        }),
        onSuccess: () => {
            toast.success("Devoir assigné !");
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.message || "Erreur lors de l'assignation.");
        }
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[450px] rounded-[2rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-blue-600 p-4 md:p-8 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Assigner un devoir</DialogTitle>
                        <DialogDescription className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1">
                            À l'attention de {sessionDetails?.studentName}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="p-4 md:p-8 space-y-6">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Titre du devoir</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Révisions des fonctions" className="rounded-xl bg-slate-50 border-slate-100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Instructions (Optionnel)</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Décrivez les exercices..." className="rounded-xl bg-slate-50 border-slate-100 min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="dueDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400">Date d'échéance</FormLabel>
                                    <FormControl>
                                        <Input type="date" className="rounded-xl bg-slate-50 border-slate-100" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex gap-4 pt-4">
                            <Button type="button" variant="ghost" onClick={onClose} className="flex-1 rounded-xl font-bold uppercase tracking-widest text-xs">Annuler</Button>
                            <Button type="submit" className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest text-xs" disabled={mutation.isPending}>
                                {mutation.isPending ? "..." : "Assigner"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
