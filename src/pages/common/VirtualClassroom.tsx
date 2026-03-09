import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleByRole } from "@/api/backoffice";
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
    Video
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

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
    const [activeTab, setActiveTab] = useState("notes");
    const [showSidebar, setShowSidebar] = useState(true);

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

    // Jitsi Init
    useEffect(() => {
        if (!sessionId || !user) return;
        const timer = setInterval(() => {
            if (window.JitsiMeetExternalAPI) {
                clearInterval(timer);
                const api = new window.JitsiMeetExternalAPI("meet.jit.si", {
                    roomName: `Care4Success-${sessionId}`,
                    width: "100%",
                    height: "100%",
                    parentNode: jitsiContainerRef.current,
                    userInfo: { displayName: user.name, email: user.email },
                    interfaceConfigOverwrite: { TOOLBAR_BUTTONS: ['microphone', 'camera', 'desktop', 'chat', 'raisehand', 'tileview'] }
                });
                setLoading(false);
                api.addEventListener('videoConferenceLeft', () => navigate(-1));
            }
        }, 500);
        return () => clearInterval(timer);
    }, [sessionId, user]);

    return (
        <div className="fixed inset-0 z-50 bg-[#0D2D5A] flex flex-col h-screen w-screen overflow-hidden text-slate-900">
            {/* Minimal Glossy Header */}
            <header className="h-14 bg-white/5 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-xl shadow-blue-500/10">
                        <img src="/logo/Care 4 Success-logo-Ok_compact.png" className="w-full h-full object-contain" />
                    </div>
                    <div className="hidden sm:block">
                        <h1 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">{currentSession?.subject || "Session Live"}</h1>
                        <p className="text-blue-300/40 text-[8px] font-bold uppercase tracking-widest">{user?.name}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1 border border-white/5">
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

                    <div className="w-px h-6 bg-white/10 mx-2" />

                    <button onClick={() => setShowSidebar(!showSidebar)} className="p-2 text-white hover:bg-white/10 rounded-xl transition-colors">
                        {showSidebar ? <ChevronRight /> : <ChevronLeft />}
                    </button>

                    <button onClick={() => navigate(-1)} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-xl transition-all">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Video Feed (Major Area) */}
                <div className="flex-1 bg-slate-950 relative overflow-hidden">
                    {loading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[#0D2D5A]">
                            <Loader2 className="w-10 h-10 text-white animate-spin opacity-20" />
                            <p className="text-white/30 font-black text-[8px] uppercase tracking-[0.3em] mt-4">Initializing Security Engine...</p>
                        </div>
                    )}
                    <div ref={jitsiContainerRef} className="w-full h-full" />
                </div>

                {/* Interactive Sidebar */}
                <aside className={`bg-white shadow-2xl transition-all duration-500 flex flex-col relative overflow-hidden ${showSidebar ? "w-[450px]" : "w-0"}`}>
                    <div className="absolute top-4 right-4 z-10">
                        {isSaving ? (
                            <Badge className="bg-blue-50 text-blue-500 border-none animate-pulse flex items-center gap-1.5 h-6">
                                <RefreshCw className="w-3 h-3 animate-spin" /> SYNC
                            </Badge>
                        ) : (
                            <Badge className="bg-green-50 text-green-500 border-none flex items-center gap-1.5 h-6">
                                <Save className="w-3 h-3" /> SAUVEGARDÉ
                            </Badge>
                        )}
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col pt-12">
                        <Tabs value={activeTab} className="flex-1 flex flex-col">

                            <TabsContent value="notes" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
                                <div className="px-8 flex-1 flex flex-col">
                                    <h2 className="text-2xl font-black text-[#0D2D5A] mb-2 uppercase tracking-tight">Notes <span className="text-blue-500">Live</span></h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">Compte-rendu partagé en temps réel</p>
                                    <textarea
                                        className="flex-1 w-full text-sm leading-relaxed text-slate-600 focus:outline-none resize-none border-none p-0 placeholder:italic"
                                        placeholder="Commencez à rédiger..."
                                        value={notes}
                                        onChange={(e) => handleWorkspaceUpdate('notes', e.target.value)}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="whiteboard" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden p-6 gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-2">
                                        <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><Palette className="w-4 h-4" /></button>
                                        <button onClick={() => setTool('eraser')} className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}><Eraser className="w-4 h-4" /></button>
                                    </div>
                                    <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-10 h-10 rounded-xl cursor-pointer shadow-sm border-2 border-slate-50" />
                                </div>
                                <div className="flex-1 bg-slate-50 rounded-[3rem] shadow-inner overflow-hidden border border-slate-100 p-0 relative">
                                    <canvas
                                        ref={canvasRef}
                                        width={402}
                                        height={550}
                                        className="w-full h-full cursor-crosshair"
                                        onMouseDown={startDrawing}
                                        onMouseUp={stopDrawing}
                                        onMouseMove={draw}
                                        onTouchStart={startDrawing}
                                        onTouchEnd={stopDrawing}
                                        onTouchMove={draw}
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="code" className="flex-1 flex flex-col m-0 data-[state=inactive]:hidden">
                                <div className="flex-1 bg-slate-900 mx-4 mb-4 rounded-[2rem] shadow-2xl overflow-hidden flex flex-col">
                                    <div className="p-4 flex items-center gap-2 border-b border-white/5">
                                        <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400/20" /><div className="w-2.5 h-2.5 rounded-full bg-yellow-400/20" /><div className="w-2.5 h-2.5 rounded-full bg-green-400/20" /></div>
                                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Sandbox.js</span>
                                    </div>
                                    <textarea
                                        className="flex-1 w-full bg-transparent text-blue-200 font-mono text-xs p-8 focus:outline-none resize-none"
                                        value={code}
                                        onChange={(e) => handleWorkspaceUpdate('code', e.target.value)}
                                        spellCheck={false}
                                    />
                                </div>
                            </TabsContent>

                        </Tabs>

                        <div className="p-8 bg-slate-50 border-t border-white flex gap-4">
                            <Button className="flex-1 h-12 rounded-2xl bg-[#0D2D5A] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-900/10">
                                <Download className="w-4 h-4 mr-2" /> Export PDF
                            </Button>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
}

function ChevronLeft() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>; }
function ChevronRight() { return <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>; }
