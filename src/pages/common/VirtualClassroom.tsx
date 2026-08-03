import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchScheduleByRole, fetchCourseDetails, uploadMessageAttachment, fetchPreviousWorkspace } from "@/api/backoffice";
import { jsPDF } from "jspdf";
import katex from "katex";
import "katex/dist/katex.min.css";
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
    CheckCircle2,
    Youtube,
    Plus,
    Trash2,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Paperclip,
    Heading3,
    Quote,
    Link2,
    History,
    Strikethrough,
    Highlighter,
    Code,
    Undo2,
    Redo2,
    RemoveFormatting,
    Maximize2,
    Minimize2,
    Sigma,
    ImagePlus,
    Presentation,
    ListTree,
    ClipboardList,
    ExternalLink,
    Minus,
    Square,
    Circle,
    Type,
    Grid3x3
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
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

type WhiteboardItem =
    | { id: string; type: "youtube"; videoId: string }
    | { id: string; type: "pdf"; url: string; name: string };

type DrawTool = "pen" | "eraser" | "line" | "rectangle" | "circle" | "text";
const SHAPE_TOOLS: DrawTool[] = ["line", "rectangle", "circle"];
const QUICK_COLORS = ["#1A6CC8", "#EF4444", "#22C55E", "#F59E0B", "#000000", "#8B5CF6"];

// Compat : les anciennes séances stockaient les items vidéo sans champ
// `type` ({ id, videoId } uniquement) — on les normalise à la lecture.
function normalizeWhiteboardItems(raw: any[]): WhiteboardItem[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((item) =>
        item?.type === "pdf"
            ? { id: item.id, type: "pdf" as const, url: item.url, name: item.name || "Document.pdf" }
            : { id: item.id, type: "youtube" as const, videoId: item.videoId }
    );
}

const getFullAttachmentUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const rootUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    return `${rootUrl}${url}`;
};

const escapeHtmlAttr = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const stripHtmlToText = (html: string) => {
    const container = document.createElement("div");
    container.innerHTML = html;
    return (container.textContent || "").trim();
};

function extractYouTubeId(url: string): string | null {
    try {
        const parsed = new URL(url.trim());
        const host = parsed.hostname.replace(/^www\./, "");
        if (host === "youtu.be") {
            return parsed.pathname.slice(1) || null;
        }
        if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
            if (parsed.pathname === "/watch") return parsed.searchParams.get("v");
            if (parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/embed/")[1] || null;
            if (parsed.pathname.startsWith("/shorts/")) return parsed.pathname.split("/shorts/")[1] || null;
        }
        return null;
    } catch {
        return null;
    }
}

export default function VirtualClassroom() {
    const { sessionId } = useParams();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const jitsiContainerRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Workspace state
    const [activeTab, setActiveTab] = useState(window.innerWidth < 768 ? "video" : "notes");
    const [showSidebar, setShowSidebar] = useState(window.innerWidth >= 768);

    // Sync state — les notes vivent directement dans le DOM contentEditable
    // (notesRef), il n'y a pas besoin d'un état React dupliqué pour ce champ.
    const notesRef = useRef<HTMLDivElement>(null);
    const [code, setCode] = useState("// Saisissez votre code ici...");
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const isEditingRef = useRef(false);

    // Whiteboard state
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawColor, setDrawColor] = useState("#1A6CC8");
    const [strokeWidth, setStrokeWidth] = useState(4);
    const [tool, setTool] = useState<DrawTool>("pen");
    const [showGrid, setShowGrid] = useState(false);
    const [history, setHistory] = useState<string[]>([]);
    const [redoStack, setRedoStack] = useState<string[]>([]);
    const shapeStartRef = useRef<{ x: number; y: number } | null>(null);
    const shapeSnapshotRef = useRef<ImageData | null>(null);
    const [whiteboardItems, setWhiteboardItems] = useState<WhiteboardItem[]>([]);
    const [showYoutubeInput, setShowYoutubeInput] = useState(false);
    const [youtubeUrl, setYoutubeUrl] = useState("");
    const previewYoutubeId = useMemo(() => extractYouTubeId(youtubeUrl), [youtubeUrl]);
    const pdfInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);
    const [pdfPreview, setPdfPreview] = useState<{ url: string; name: string } | null>(null);
    const [boardExpanded, setBoardExpanded] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(false);

    // Notes Live — images, table des matières, mode présentation
    const imageInputRef = useRef<HTMLInputElement>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [notesHeadings, setNotesHeadings] = useState<{ id: string; text: string }[]>([]);
    const [showToc, setShowToc] = useState(false);
    const [presentationMode, setPresentationMode] = useState(false);
    const [presentationHtml, setPresentationHtml] = useState("");

    // Session Management State
    const [isReportOpen, setIsReportOpen] = useState(false);
    const queryClient = useQueryClient();

    // Homework Assignment state
    const [showHomeworkForm, setShowHomeworkForm] = useState(false);
    const [homeworkPrefillDescription, setHomeworkPrefillDescription] = useState("");

    // Query Data
    const { data: schedule, refetch: refetchSession } = useQuery({
        queryKey: ["session-details", sessionId],
        queryFn: () => fetchScheduleByRole(user?.role as any, user?.id as any),
        enabled: Boolean(sessionId && user),
        refetchInterval: 5000, // Poll every 5s for collaboration
    });

    const currentSession = schedule?.find(s => s.id === sessionId);

    // Continuité entre séances : propose de reprendre le contenu de la
    // dernière séance (même prof + élève) si la séance courante est encore vierge.
    const [previousBannerDismissed, setPreviousBannerDismissed] = useState(false);
    const { data: previousWorkspace } = useQuery({
        queryKey: ["previous-workspace", sessionId],
        queryFn: () => fetchPreviousWorkspace(sessionId!),
        enabled: Boolean(sessionId),
        staleTime: Infinity,
    });

    const isCurrentWorkspaceEmpty = useMemo(() => {
        const notesEmpty = !currentSession?.notes || currentSession.notes.trim() === "" || currentSession.notes === "<br>";
        const whiteboardItemsEmpty = !Array.isArray(currentSession?.whiteboardItems) || currentSession.whiteboardItems.length === 0;
        const canvasEmpty = !currentSession?.whiteboardData;
        const codeEmpty = !currentSession?.codeData || currentSession.codeData === "// Saisissez votre code ici...";
        return notesEmpty && whiteboardItemsEmpty && canvasEmpty && codeEmpty;
    }, [currentSession]);

    const showResumeBanner = !previousBannerDismissed && isCurrentWorkspaceEmpty && Boolean(previousWorkspace);

    const handleResumePreviousSession = () => {
        if (!previousWorkspace) return;
        if (notesRef.current) {
            notesRef.current.innerHTML = previousWorkspace.notes || "";
            refreshNotesHeadings();
        }
        const resumedItems = normalizeWhiteboardItems(previousWorkspace.whiteboardItems || []);
        setWhiteboardItems(resumedItems);
        setCode(previousWorkspace.codeData || "// Saisissez votre code ici...");
        if (previousWorkspace.whiteboardData && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            const img = new Image();
            img.onload = () => ctx?.drawImage(img, 0, 0);
            img.src = previousWorkspace.whiteboardData;
        }
        syncWorkspace({
            notes: previousWorkspace.notes || "",
            codeData: previousWorkspace.codeData || "",
            whiteboardItems: resumedItems,
            whiteboardData: previousWorkspace.whiteboardData || undefined,
        });
        setPreviousBannerDismissed(true);
        toast.success("Contenu du cours précédent repris.");
    };

    // Sync incoming data
    useEffect(() => {
        if (!isEditingRef.current && currentSession) {
            if (currentSession.notes !== undefined) {
                const nextNotes = currentSession.notes || "";
                if (notesRef.current && notesRef.current.innerHTML !== nextNotes) {
                    notesRef.current.innerHTML = nextNotes;
                    refreshNotesHeadings();
                }
            }
            if (currentSession.codeData !== undefined) setCode(currentSession.codeData || "// Saisissez votre code ici...");
            if (Array.isArray(currentSession.whiteboardItems)) setWhiteboardItems(normalizeWhiteboardItems(currentSession.whiteboardItems));

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
    const handleWorkspaceUpdate = (type: 'notes' | 'code' | 'whiteboard' | 'whiteboardItems', value: any) => {
        isEditingRef.current = true;
        if (type === 'code') setCode(value);
        if (type === 'whiteboardItems') setWhiteboardItems(value);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            const payload: any = {};
            if (type === 'notes') payload.notes = value;
            if (type === 'code') payload.codeData = value;
            if (type === 'whiteboard') payload.whiteboardData = value;
            if (type === 'whiteboardItems') payload.whiteboardItems = value;

            syncWorkspace(payload).then(() => {
                setTimeout(() => { isEditingRef.current = false; }, 1000);
            });
        }, 1500);
    };

    const handleAddYoutubeVideo = () => {
        const videoId = previewYoutubeId;
        if (!videoId) {
            toast.error("Lien YouTube invalide. Collez un lien du type https://youtube.com/watch?v=... ou https://youtu.be/...");
            return;
        }
        const nextItems: WhiteboardItem[] = [...whiteboardItems, { id: crypto.randomUUID(), type: "youtube", videoId }];
        handleWorkspaceUpdate('whiteboardItems', nextItems);
        setYoutubeUrl("");
        setShowYoutubeInput(false);
    };

    const handleRemoveWhiteboardItem = (id: string) => {
        handleWorkspaceUpdate('whiteboardItems', whiteboardItems.filter(item => item.id !== id));
    };

    // Un import (PDF/image) échoue le plus souvent soit parce que le
    // fichier est refusé côté serveur, soit parce que le jeton de session
    // a expiré (12h) pendant une visio longue — dans ce cas, on informe
    // clairement l'utilisateur au lieu d'un message générique et on le
    // renvoie se reconnecter plutôt que de le laisser réessayer en vain.
    const handleUploadError = (err: unknown, fallbackMessage: string) => {
        const message = err instanceof Error ? err.message : "";
        if (message === "Authentification invalide." || message === "Jeton d'authentification manquant.") {
            toast.error("Votre session a expiré. Merci de vous reconnecter.");
            logout();
            navigate("/login");
            return;
        }
        toast.error(message || fallbackMessage);
    };

    const handlePdfSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (file.type !== "application/pdf") {
            toast.error("Seuls les fichiers PDF sont acceptés.");
            return;
        }
        setUploadingPdf(true);
        try {
            const formData = new FormData();
            formData.append("attachment", file);
            const { fileUrl } = await uploadMessageAttachment(formData);
            const nextItems: WhiteboardItem[] = [...whiteboardItems, { id: crypto.randomUUID(), type: "pdf", url: fileUrl, name: file.name }];
            handleWorkspaceUpdate('whiteboardItems', nextItems);
            toast.success("PDF ajouté au tableau partagé.");
        } catch (err) {
            handleUploadError(err, "Impossible d'importer le PDF.");
        } finally {
            setUploadingPdf(false);
        }
    };

    const applyNotesFormat = (command: string) => {
        notesRef.current?.focus();
        document.execCommand(command);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesBlock = (tag: "h3" | "blockquote") => {
        notesRef.current?.focus();
        document.execCommand("formatBlock", false, tag);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
        if (tag === "h3") refreshNotesHeadings();
    };

    const applyNotesLink = () => {
        const url = window.prompt("Adresse du lien (https://...)");
        if (!url) return;
        notesRef.current?.focus();
        document.execCommand("createLink", false, url);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesHighlight = () => {
        notesRef.current?.focus();
        document.execCommand("hiliteColor", false, "#FDE68A");
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesInlineCode = () => {
        notesRef.current?.focus();
        const text = window.getSelection()?.toString();
        if (!text) return;
        document.execCommand(
            "insertHTML",
            false,
            `<code style="background:#F1F5F9;color:#0D2D5A;padding:1px 5px;border-radius:6px;font-family:monospace;font-size:0.85em;">${text}</code>`
        );
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesHistory = (command: "undo" | "redo") => {
        notesRef.current?.focus();
        document.execCommand(command);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesClearFormat = () => {
        notesRef.current?.focus();
        document.execCommand("removeFormat");
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const applyNotesEquation = () => {
        const latex = window.prompt("Formule LaTeX (ex: x^2 + y^2 = r^2)");
        if (!latex) return;
        let renderedHtml: string;
        try {
            renderedHtml = katex.renderToString(latex, { throwOnError: false });
        } catch {
            toast.error("Formule LaTeX invalide.");
            return;
        }
        notesRef.current?.focus();
        const wrapped = `<span contenteditable="false" class="c4s-katex" data-latex="${escapeHtmlAttr(latex)}" style="display:inline-block;vertical-align:middle;">${renderedHtml}</span>&nbsp;`;
        document.execCommand("insertHTML", false, wrapped);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) {
            toast.error("Seuls les fichiers image sont acceptés.");
            return;
        }
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append("attachment", file);
            const { fileUrl } = await uploadMessageAttachment(formData);
            notesRef.current?.focus();
            const fullUrl = getFullAttachmentUrl(fileUrl);
            document.execCommand(
                "insertHTML",
                false,
                `<img src="${escapeHtmlAttr(fullUrl)}" alt="" style="max-width:100%;border-radius:12px;margin:8px 0;display:block;" />`
            );
            handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
            toast.success("Image insérée dans les notes.");
        } catch (err) {
            handleUploadError(err, "Impossible d'importer l'image.");
        } finally {
            setUploadingImage(false);
        }
    };

    // Reconstruit l'index des titres (H3) présents dans les notes pour la
    // table des matières — chaque titre reçoit un id stable pour permettre
    // le défilement direct au clic.
    const refreshNotesHeadings = () => {
        if (!notesRef.current) return;
        const headings = Array.from(notesRef.current.querySelectorAll("h3"));
        const next = headings.map((el, index) => {
            if (!el.id) el.id = `notes-heading-${index}-${crypto.randomUUID().slice(0, 8)}`;
            return { id: el.id, text: el.textContent || `Section ${index + 1}` };
        });
        setNotesHeadings(next);
    };

    const scrollToHeading = (id: string) => {
        notesRef.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        setShowToc(false);
    };

    const handleExportNoteToHomework = () => {
        const text = stripHtmlToText(notesRef.current?.innerHTML || "");
        if (!text) {
            toast.error("Les notes sont vides, rien à exporter.");
            return;
        }
        setHomeworkPrefillDescription(text);
        setShowHomeworkForm(true);
    };

    const togglePresentationMode = () => {
        setPresentationHtml(notesRef.current?.innerHTML || "");
        setPresentationMode(true);
    };

    // Si on colle uniquement un lien YouTube (rien d'autre autour), on
    // l'intègre directement en aperçu vidéo au lieu de l'URL en texte brut —
    // le bloc est non-éditable (contenteditable="false") pour rester un îlot
    // atomique dans la zone de texte enrichi, comme dans Notion/Slack.
    const handleNotesPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        const pasted = e.clipboardData.getData("text/plain").trim();
        const videoId = pasted ? extractYouTubeId(pasted) : null;
        if (!videoId) return;
        e.preventDefault();
        const embedHtml = `<div contenteditable="false" class="c4s-yt-embed" style="position:relative;width:100%;max-width:320px;aspect-ratio:16/9;margin:8px 0;border-radius:12px;overflow:hidden;background:#000;"><iframe src="https://www.youtube.com/embed/${videoId}" style="width:100%;height:100%;border:0;" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div><p><br></p>`;
        document.execCommand("insertHTML", false, embedHtml);
        handleWorkspaceUpdate('notes', notesRef.current?.innerHTML || "");
    };

    // Whiteboard Draw Logic
    // Le point du clic/toucher est en coordonnées CSS (taille affichée du
    // canvas) mais le canvas dessine dans sa résolution intrinsèque
    // (1200×1600) — sans cette mise à l'échelle, le trait se décale du
    // curseur dès que le canvas n'est pas affiché à sa taille réelle
    // (systématique avec `w-full h-full`, et flagrant une fois le tableau
    // agrandi).
    const getCanvasPoint = (e: any) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? e.changedTouches?.[0]?.clientX ?? 0;
        const clientY = e.clientY ?? e.touches?.[0]?.clientY ?? e.changedTouches?.[0]?.clientY ?? 0;
        return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
    };

    // Empile l'état courant du tableau avant chaque nouvelle action pour
    // permettre d'annuler — plafonné pour ne pas accumuler indéfiniment de
    // data URLs en mémoire sur une longue séance.
    const pushHistory = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const snapshot = canvas.toDataURL();
        setHistory(prev => {
            const next = [...prev, snapshot];
            return next.length > 30 ? next.slice(next.length - 30) : next;
        });
        setRedoStack([]);
    };

    const restoreCanvasFromDataUrl = (dataUrl: string) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            handleWorkspaceUpdate('whiteboard', canvas.toDataURL());
        };
        img.src = dataUrl;
    };

    const handleUndo = () => {
        const canvas = canvasRef.current;
        if (!canvas || history.length === 0) return;
        const previous = history[history.length - 1];
        setHistory(h => h.slice(0, -1));
        setRedoStack(r => [...r, canvas.toDataURL()]);
        restoreCanvasFromDataUrl(previous);
    };

    const handleRedo = () => {
        const canvas = canvasRef.current;
        if (!canvas || redoStack.length === 0) return;
        const next = redoStack[redoStack.length - 1];
        setRedoStack(r => r.slice(0, -1));
        setHistory(h => [...h, canvas.toDataURL()]);
        restoreCanvasFromDataUrl(next);
    };

    const handleClearBoard = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        pushHistory();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        handleWorkspaceUpdate('whiteboard', canvas.toDataURL());
    };

    const startDrawing = (e: any) => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        const point = getCanvasPoint(e);

        if (tool === 'text') {
            pushHistory();
            const text = window.prompt("Texte à écrire sur le tableau :");
            if (text && text.trim()) {
                ctx.fillStyle = drawColor;
                ctx.font = `${Math.max(16, strokeWidth * 6)}px sans-serif`;
                ctx.textBaseline = 'top';
                ctx.fillText(text.trim(), point.x, point.y);
                handleWorkspaceUpdate('whiteboard', canvas.toDataURL());
            } else {
                setHistory(h => h.slice(0, -1)); // rien écrit : pas la peine de garder ce snapshot
            }
            return;
        }

        if (SHAPE_TOOLS.includes(tool)) {
            pushHistory();
            shapeStartRef.current = point;
            shapeSnapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
            setIsDrawing(true);
            return;
        }

        pushHistory();
        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        shapeStartRef.current = null;
        shapeSnapshotRef.current = null;
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
        const point = getCanvasPoint(e);

        if (SHAPE_TOOLS.includes(tool)) {
            if (!shapeStartRef.current || !shapeSnapshotRef.current) return;
            ctx.putImageData(shapeSnapshotRef.current, 0, 0);
            ctx.strokeStyle = drawColor;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            const { x: sx, y: sy } = shapeStartRef.current;
            ctx.beginPath();
            if (tool === 'line') {
                ctx.moveTo(sx, sy);
                ctx.lineTo(point.x, point.y);
            } else if (tool === 'rectangle') {
                ctx.rect(sx, sy, point.x - sx, point.y - sy);
            } else if (tool === 'circle') {
                ctx.arc(sx, sy, Math.hypot(point.x - sx, point.y - sy), 0, Math.PI * 2);
            }
            ctx.stroke();
            return;
        }

        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
        ctx.lineWidth = tool === 'eraser' ? 24 : strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineTo(point.x, point.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
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
                    try { jitsiApiRef.current.dispose(); } catch { /* dispose failure on unmount is non-critical, ignore */ }
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
                try { jitsiApiRef.current.dispose(); } catch { /* dispose failure on unmount is non-critical, ignore */ }
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
                    !showSidebar && "w-0 md:w-0",
                    showSidebar && (
                        (boardExpanded && activeTab === 'whiteboard') || (notesExpanded && activeTab === 'notes')
                            ? "w-full md:w-[75vw] md:max-w-[1100px]"
                            : "w-full md:w-[450px]"
                    )
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
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-[#0D2D5A] mb-1 md:mb-1 uppercase tracking-tighter">Notes <span className="text-blue-600">Live</span></h2>
                                        <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mb-3">Compte-rendu partagé en temps réel</p>
                                    </div>
                                    <div className="flex items-center gap-1.5 shrink-0 relative">
                                        {notesHeadings.length > 0 && (
                                            <>
                                                <button
                                                    onClick={() => setShowToc(v => !v)}
                                                    className={`p-2 rounded-xl transition-all ${showToc ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                                                    title="Table des matières"
                                                >
                                                    <ListTree className="w-4 h-4" />
                                                </button>
                                                {showToc && (
                                                    <div className="absolute top-10 right-0 z-20 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 max-h-64 overflow-y-auto">
                                                        {notesHeadings.map((h) => (
                                                            <button
                                                                key={h.id}
                                                                onClick={() => scrollToHeading(h.id)}
                                                                className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors truncate"
                                                            >
                                                                {h.text}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        <button
                                            onClick={handleExportNoteToHomework}
                                            className="p-2 rounded-xl transition-all bg-slate-50 text-slate-400 hover:text-[#0D2D5A]"
                                            title="Exporter les notes en devoir"
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={togglePresentationMode}
                                            className="hidden md:flex p-2 rounded-xl transition-all bg-slate-50 text-slate-400 hover:text-[#0D2D5A]"
                                            title="Mode présentation"
                                        >
                                            <Presentation className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => setNotesExpanded(v => !v)}
                                            className={`hidden md:flex p-2 rounded-xl transition-all ${notesExpanded ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                                            title={notesExpanded ? "Réduire les notes" : "Agrandir les notes"}
                                        >
                                            {notesExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                                {showResumeBanner && (
                                    <div className="mb-3 p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-start gap-2.5">
                                        <History className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-[11px] font-black text-[#0D2D5A]">Reprendre le cours précédent ?</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Séance du {previousWorkspace?.sessionDate} — notes et ressources disponibles pour continuer.</p>
                                            <div className="flex gap-2 mt-2">
                                                <Button size="sm" onClick={handleResumePreviousSession} className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700">
                                                    Reprendre
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={() => setPreviousBannerDismissed(true)} className="h-7 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600">
                                                    Ignorer
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <div className="flex items-center flex-wrap gap-y-1 gap-x-1 mb-3 pb-3 border-b border-slate-100">
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('bold')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Gras"><Bold className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('italic')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Italique"><Italic className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('underline')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Souligné"><Underline className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('strikeThrough')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Barré"><Strikethrough className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyNotesHighlight} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Surligner"><Highlighter className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyNotesInlineCode} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Code"><Code className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyNotesEquation} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Équation (LaTeX)"><Sigma className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors disabled:opacity-50" title="Insérer une image">
                                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5" />}
                                    </button>
                                    <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
                                    <div className="w-px h-4 bg-slate-100 mx-1" />
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('insertUnorderedList')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Liste à puces"><List className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesFormat('insertOrderedList')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Liste numérotée"><ListOrdered className="w-3.5 h-3.5" /></button>
                                    <div className="w-px h-4 bg-slate-100 mx-1" />
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesBlock('h3')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Titre"><Heading3 className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesBlock('blockquote')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Citation"><Quote className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyNotesLink} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Insérer un lien"><Link2 className="w-3.5 h-3.5" /></button>
                                    <div className="w-px h-4 bg-slate-100 mx-1" />
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesHistory('undo')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Annuler"><Undo2 className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => applyNotesHistory('redo')} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Rétablir"><Redo2 className="w-3.5 h-3.5" /></button>
                                    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={applyNotesClearFormat} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#0D2D5A] transition-colors" title="Effacer la mise en forme"><RemoveFormatting className="w-3.5 h-3.5" /></button>
                                </div>
                                <div
                                    ref={notesRef}
                                    contentEditable
                                    suppressContentEditableWarning
                                    spellCheck
                                    lang="fr"
                                    onInput={(e) => { handleWorkspaceUpdate('notes', (e.target as HTMLDivElement).innerHTML); refreshNotesHeadings(); }}
                                    onPaste={handleNotesPaste}
                                    className="flex-1 w-full text-sm leading-relaxed text-slate-600 focus:outline-none overflow-y-auto [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h3]:text-base [&_h3]:font-black [&_h3]:text-[#0D2D5A] [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:mt-3 [&_h3]:mb-1 [&_blockquote]:border-l-2 [&_blockquote]:border-blue-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_a]:text-blue-600 [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:italic empty:before:text-slate-400"
                                    data-placeholder="Commencez à rédiger..."
                                />
                            </div>
                        </div>

                        {/* Whiteboard View */}
                        <div className={cn("flex-1 flex flex-col p-4 md:p-6 gap-4", activeTab !== 'whiteboard' && "hidden")}>
                            <div className="flex flex-col gap-2">
                                {/* Rangée 1 : outils de dessin + historique */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-1 flex-wrap">
                                        <button onClick={() => setTool('pen')} className={`p-2 rounded-xl transition-all ${tool === 'pen' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Stylo"><Palette className="w-4 h-4" /></button>
                                        <button onClick={() => setTool('eraser')} className={`p-2 rounded-xl transition-all ${tool === 'eraser' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Gomme"><Eraser className="w-4 h-4" /></button>
                                        <div className="w-px h-5 bg-slate-100 mx-1" />
                                        <button onClick={() => setTool('line')} className={`p-2 rounded-xl transition-all ${tool === 'line' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Ligne droite"><Minus className="w-4 h-4" /></button>
                                        <button onClick={() => setTool('rectangle')} className={`p-2 rounded-xl transition-all ${tool === 'rectangle' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Rectangle"><Square className="w-4 h-4" /></button>
                                        <button onClick={() => setTool('circle')} className={`p-2 rounded-xl transition-all ${tool === 'circle' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Cercle"><Circle className="w-4 h-4" /></button>
                                        <div className="w-px h-5 bg-slate-100 mx-1" />
                                        <button onClick={() => setTool('text')} className={`p-2 rounded-xl transition-all ${tool === 'text' ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Texte (idéal pour le vocabulaire, les corrections de langue)"><Type className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={handleUndo} disabled={!history.length} className="p-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 transition-all" title="Annuler"><Undo2 className="w-4 h-4" /></button>
                                        <button onClick={handleRedo} disabled={!redoStack.length} className="p-2 rounded-xl bg-slate-50 text-slate-400 disabled:opacity-30 transition-all" title="Rétablir"><Redo2 className="w-4 h-4" /></button>
                                        <button onClick={handleClearBoard} className="p-2 rounded-xl bg-slate-50 text-red-400 hover:bg-red-50 transition-all" title="Effacer tout le tableau"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                {/* Rangée 2 : couleurs, épaisseur, grille (maths/physique), import, agrandir */}
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50">
                                            {QUICK_COLORS.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => setDrawColor(c)}
                                                    className={cn("w-5 h-5 rounded-full transition-all", drawColor === c && "ring-2 ring-offset-1 ring-[#1A6CC8] scale-110")}
                                                    style={{ backgroundColor: c }}
                                                    title={c}
                                                />
                                            ))}
                                            <input type="color" value={drawColor} onChange={e => setDrawColor(e.target.value)} className="w-5 h-5 rounded-full cursor-pointer border-none bg-transparent" title="Couleur personnalisée" />
                                        </div>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <button className="flex items-center gap-1.5 px-2.5 h-8 rounded-xl bg-slate-50 text-slate-500 transition-all" title="Épaisseur du trait">
                                                    <span className="rounded-full bg-current shrink-0" style={{ width: Math.min(strokeWidth + 4, 16), height: Math.min(strokeWidth + 4, 16) }} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">{strokeWidth}px</span>
                                                </button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-48 p-3" align="start">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Épaisseur du trait</p>
                                                <Slider min={1} max={20} step={1} value={[strokeWidth]} onValueChange={(v) => setStrokeWidth(v[0])} />
                                            </PopoverContent>
                                        </Popover>
                                        <button
                                            onClick={() => setShowGrid(v => !v)}
                                            className={`p-2 rounded-xl transition-all ${showGrid ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                                            title="Fond quadrillé (maths, physique, géométrie)"
                                        >
                                            <Grid3x3 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setShowYoutubeInput(v => !v)} className={`p-2 rounded-xl transition-all ${showYoutubeInput ? 'bg-red-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`} title="Importer une vidéo YouTube"><Youtube className="w-4 h-4" /></button>
                                        <button onClick={() => pdfInputRef.current?.click()} disabled={uploadingPdf} className="p-2 rounded-xl transition-all bg-slate-50 text-slate-400 disabled:opacity-50" title="Importer un PDF">
                                            {uploadingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                        </button>
                                        <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={handlePdfSelected} className="hidden" />
                                        <button
                                            onClick={() => setBoardExpanded(v => !v)}
                                            className={`hidden md:flex p-2 rounded-xl transition-all ${boardExpanded ? 'bg-blue-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                                            title={boardExpanded ? "Réduire le tableau" : "Agrandir le tableau"}
                                        >
                                            {boardExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {showYoutubeInput && (
                                <div className="flex flex-col gap-2">
                                    <div className="flex gap-2">
                                        <Input
                                            autoFocus
                                            placeholder="Collez un lien YouTube (https://youtube.com/watch?v=...)"
                                            value={youtubeUrl}
                                            onChange={(e) => setYoutubeUrl(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddYoutubeVideo(); }}
                                            className="rounded-xl border-slate-100 bg-slate-50 text-sm"
                                        />
                                        <Button onClick={handleAddYoutubeVideo} disabled={!previewYoutubeId} className="rounded-xl bg-red-500 hover:bg-red-600 shrink-0">
                                            <Plus className="w-4 h-4 mr-1" /> Importer
                                        </Button>
                                    </div>
                                    {previewYoutubeId && (
                                        <div className="relative w-full max-w-xs aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-black">
                                            <iframe
                                                src={`https://www.youtube.com/embed/${previewYoutubeId}`}
                                                title="Aperçu de la vidéo"
                                                className="w-full h-full"
                                                allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            {whiteboardItems.length > 0 && (
                                <div className="flex gap-3 overflow-x-auto pb-1">
                                    {whiteboardItems.map((item) => (
                                        <div key={item.id} className="relative shrink-0 w-56 aspect-video rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-black group">
                                            {item.type === 'pdf' ? (
                                                <div className="relative w-full h-full bg-white">
                                                    <iframe
                                                        src={`${getFullAttachmentUrl(item.url)}#toolbar=0&navpanes=0`}
                                                        title={item.name}
                                                        className="w-full h-full border-0 pointer-events-none"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setPdfPreview({ url: item.url, name: item.name })}
                                                        className="absolute inset-0 w-full h-full cursor-zoom-in"
                                                        title="Agrandir l'aperçu"
                                                    />
                                                    <div className="absolute bottom-1 left-1 right-1 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                        <FileText className="w-3 h-3 text-red-400 shrink-0" />
                                                        <span className="text-[9px] font-bold truncate">{item.name}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <iframe
                                                    src={`https://www.youtube.com/embed/${item.videoId}`}
                                                    title={`Vidéo YouTube ${item.videoId}`}
                                                    className="w-full h-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            )}
                                            <button
                                                onClick={() => handleRemoveWhiteboardItem(item.id)}
                                                className="absolute top-1 right-1 p-1 rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                                title="Retirer"
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div
                                className="flex-1 bg-slate-50 rounded-[2rem] shadow-inner overflow-hidden border border-slate-100 relative"
                                style={showGrid ? {
                                    backgroundImage: "linear-gradient(to right, #e2e8f0 1px, transparent 1px), linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)",
                                    backgroundSize: "24px 24px",
                                } : undefined}
                            >
                                <canvas
                                    ref={canvasRef}
                                    width={1200}
                                    height={1600}
                                    className={cn("w-full h-full", tool === 'text' ? "cursor-text" : "cursor-crosshair")}
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

            {/* Mode présentation : affiche les notes en grand pour la lecture partagée */}
            {presentationMode && (
                <div className="fixed inset-0 z-[100] bg-white flex flex-col">
                    <div className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mode présentation</span>
                        <button
                            onClick={() => setPresentationMode(false)}
                            className="p-2 rounded-xl bg-slate-50 text-slate-500 hover:bg-slate-100 transition-colors"
                            title="Quitter le mode présentation"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div
                        className="flex-1 overflow-y-auto px-6 md:px-24 py-10 md:py-16 text-lg md:text-2xl leading-relaxed text-[#0D2D5A] max-w-4xl mx-auto w-full [&_ul]:list-disc [&_ul]:pl-8 [&_ol]:list-decimal [&_ol]:pl-8 [&_h3]:text-2xl md:[&_h3]:text-4xl [&_h3]:font-black [&_h3]:uppercase [&_h3]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-500 [&_a]:text-blue-600 [&_a]:underline"
                        dangerouslySetInnerHTML={{ __html: presentationHtml || "<p class='text-slate-300'>Aucune note à présenter pour le moment.</p>" }}
                    />
                </div>
            )}

            {/* Aperçu PDF agrandi — panneau large qui s'ouvre depuis la droite */}
            <Sheet open={!!pdfPreview} onOpenChange={(open) => !open && setPdfPreview(null)}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-none sm:w-[75vw] lg:w-[65vw] p-0 flex flex-col gap-0 bg-white"
                >
                    <div className="flex items-center justify-between gap-3 pl-4 pr-10 py-3 border-b border-slate-100 shrink-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-red-500 shrink-0" />
                            <SheetTitle className="text-sm font-black text-[#0D2D5A] truncate">{pdfPreview?.name}</SheetTitle>
                        </div>
                        {pdfPreview && (
                            <a
                                href={getFullAttachmentUrl(pdfPreview.url)}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#1A6CC8] hover:text-[#0D2D5A] shrink-0"
                            >
                                <ExternalLink className="w-3.5 h-3.5" /> Plein écran
                            </a>
                        )}
                    </div>
                    <div className="flex-1 bg-slate-100">
                        {pdfPreview && (
                            <iframe
                                src={`${getFullAttachmentUrl(pdfPreview.url)}#toolbar=1`}
                                title={pdfPreview.name}
                                className="w-full h-full border-0"
                            />
                        )}
                    </div>
                </SheetContent>
            </Sheet>

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
                onClose={() => { setShowHomeworkForm(false); setHomeworkPrefillDescription(""); }}
                sessionId={sessionId!}
                sessionDetails={currentSession}
                teacherId={user?.id ?? ''}
                initialDescription={homeworkPrefillDescription}
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
        queryFn: () => fetchCourseDetails(sessionDetails?.courseId ?? ''),
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
                                                {courseDetails.lessons?.map((lesson: any) => (
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

function HomeworkModal({ isOpen, onClose, sessionId, sessionDetails, teacherId, initialDescription }: { isOpen: boolean, onClose: () => void, sessionId: string, sessionDetails: any, teacherId: string, initialDescription?: string }) {
    const form = useForm<z.infer<typeof homeworkSchema>>({
        resolver: zodResolver(homeworkSchema),
        defaultValues: {
            title: "",
            description: "",
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0], // +7 days
        },
    });

    // Pré-remplit la description quand la modale s'ouvre suite à un export
    // de notes ("Exporter en devoir") — sinon repart sur un formulaire vierge.
    useEffect(() => {
        if (isOpen) {
            form.reset({
                title: "",
                description: initialDescription || "",
                dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialDescription]);

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
