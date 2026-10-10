import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Mail, UserRound, Users, GraduationCap, Search, Filter, Phone, AtSign, MoreVertical, Paperclip, Smile, Send, Loader2,
    Download, FileText, ChevronLeft, ChevronRight, ArrowLeft, Check, CheckCheck, MessageCircle, FolderOpen, Copy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { fetchAdvisorContacts, fetchMessages, sendMessage, markMessageAsRead, uploadMessageAttachment } from "@/api/backoffice";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type Category = "teacher" | "parent" | "student" | "staff";
type Contact = {
    id: string; name: string; role: string; category: Category; email?: string | null; phone?: string | null;
    subjects?: string[]; students?: string[]; children?: string[]; parentName?: string | null; teachers?: string[];
};
type Msg = {
    id: string; senderId: string; senderName: string; senderRole: string; receiverId: string; receiverName: string;
    receiverRole: string; content: string; attachmentUrl?: string | null; isRead: boolean; createdAt: string;
};

const BLUE = "#1A6CC8";
const PAGE_SIZE = 8;
const CATEGORY: Record<Category, { label: string; plural: string; badge: string }> = {
    teacher: { label: "Professeur", plural: "Professeurs", badge: "bg-blue-50 text-blue-700" },
    parent: { label: "Parent", plural: "Parents", badge: "bg-emerald-50 text-emerald-700" },
    student: { label: "Élève", plural: "Élèves", badge: "bg-violet-50 text-violet-700" },
    staff: { label: "Équipe", plural: "Équipe", badge: "bg-gray-100 text-gray-600" },
};
const PALETTE = ["#DBEAFE:#1D4ED8", "#DCFCE7:#15803D", "#F3E8FF:#7C3AED", "#FCE7F3:#BE185D", "#FEF3C7:#B45309", "#E0F2FE:#0369A1"];
const EMOJIS = ["🙂", "😊", "👍", "🙏", "👏", "🎉", "✅", "📚", "📅", "📎", "💪", "⭐"];

const initials = (n = "") => n.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? "").join("") || "?";
const tone = (n = "") => { const [bg, fg] = PALETTE[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length].split(":"); return { bg, fg }; };
const norm = (v: unknown) => String(v ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const hm = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const dayTitle = (d: Date) => {
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (sameDay(d, new Date())) return "Aujourd'hui";
    if (sameDay(d, y)) return "Hier";
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
};
// Horodatage de la liste : heure aujourd'hui, « Hier », jour de la semaine, puis date
const listStamp = (iso: string) => {
    const d = new Date(iso), now = new Date();
    if (sameDay(d, now)) return hm(d);
    const y = new Date(); y.setDate(y.getDate() - 1);
    if (sameDay(d, y)) return "Hier";
    if (now.getTime() - d.getTime() < 6 * 86_400_000) return d.toLocaleDateString("fr-FR", { weekday: "long" }).replace(/^./, c => c.toUpperCase());
    return d.toLocaleDateString("fr-FR");
};
const fileUrl = (url: string) => /^https?:\/\//.test(url) ? url : `${(import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "")}${url}`;
const fileExt = (url: string) => (url.split("?")[0].split(".").pop() || "").toUpperCase();
// Le serveur renomme les fichiers : le nom d'origine est envoyé comme texte du message.
const isFileLabel = (m: { content?: string; attachmentUrl?: string | null }) => {
    const c = (m.content || "").trim();
    return !c || c === "Pièce jointe" || (!!m.attachmentUrl && c.toLowerCase().endsWith(`.${fileExt(m.attachmentUrl).toLowerCase()}`));
};
const fileTitle = (m: Msg) => (isFileLabel(m) && m.content && m.content !== "Pièce jointe" ? m.content : `Fichier ${fileExt(m.attachmentUrl || "")}`);
const contactDetail = (c: Contact) => {
    if (c.category === "teacher") return [c.subjects?.length ? `Enseignant de ${c.subjects.join(", ")}` : "Enseignant", c.students?.length ? c.students.join(", ") : null];
    if (c.category === "parent") return [c.children?.length ? `Parent de ${c.children.join(", ")}` : "Parent", null];
    if (c.category === "student") return ["Élève", c.parentName ? `Parent : ${c.parentName}` : null];
    return [c.role === "admin" ? "Administration" : "Conseiller", null];
};

export default function AdvisorMessages() {
    const { user } = useAuth();
    const userId = user?.id || "";
    const qc = useQueryClient();
    const location = useLocation();
    const navigate = useNavigate();
    const fileRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const [tab, setTab] = useState<"all" | Category>("all");
    const [search, setSearch] = useState("");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [withThreadOnly, setWithThreadOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [selectedId, setSelectedId] = useState("");
    const [mobileThread, setMobileThread] = useState(false);
    const [draft, setDraft] = useState("");
    const [uploading, setUploading] = useState(false);
    // Premier message non lu au moment de l'ouverture : repère « Nouveau message »
    const [firstUnreadId, setFirstUnreadId] = useState<string | null>(null);

    const contactsQuery = useQuery<Contact[]>({ queryKey: ["advisorContacts", userId], queryFn: () => fetchAdvisorContacts(userId), enabled: !!userId });
    const messagesQuery = useQuery<Msg[]>({ queryKey: ["messages", userId], queryFn: () => fetchMessages(userId), enabled: !!userId, refetchInterval: 5000 });
    const messages = useMemo(() => messagesQuery.data ?? [], [messagesQuery.data]);

    // Contacts de l'annuaire + correspondants de l'historique absents de l'annuaire
    const contacts = useMemo(() => {
        const map = new Map<string, Contact>((contactsQuery.data ?? []).map(c => [c.id, c]));
        for (const m of messages) {
            const mine = m.senderId === userId;
            const id = mine ? m.receiverId : m.senderId;
            if (!map.has(id)) {
                const role = mine ? m.receiverRole : m.senderRole;
                const category: Category = role === "teacher" || role === "tutor" ? "teacher" : role === "parent" ? "parent" : role === "student" ? "student" : "staff";
                map.set(id, { id, name: mine ? m.receiverName : m.senderName, role, category });
            }
        }
        return [...map.values()];
    }, [contactsQuery.data, messages, userId]);

    const threads = useMemo(() => {
        const by = new Map<string, Msg[]>();
        for (const m of messages) {
            const other = m.senderId === userId ? m.receiverId : m.senderId;
            by.set(other, [...(by.get(other) || []), m]);
        }
        return by;
    }, [messages, userId]);

    const rows = useMemo(() => contacts.map(c => {
        const thread = threads.get(c.id) || [];
        return { c, last: thread[thread.length - 1] || null, unread: thread.filter(m => m.receiverId === userId && !m.isRead).length };
    }).sort((a, b) => {
        if (a.last && b.last) return new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime();
        if (a.last || b.last) return a.last ? -1 : 1;
        return a.c.name.localeCompare(b.c.name, "fr");
    }), [contacts, threads, userId]);

    const base = useMemo(() => {
        const q = norm(search);
        return rows.filter(r => {
            if (unreadOnly && !r.unread) return false;
            if (withThreadOnly && !r.last) return false;
            if (q && !norm([r.c.name, r.c.email, ...(r.c.subjects || []), ...(r.c.students || []), ...(r.c.children || []), r.c.parentName].join(" ")).includes(q)) return false;
            return true;
        });
    }, [rows, search, unreadOnly, withThreadOnly]);
    const counts = useMemo(() => ({
        all: base.length,
        teacher: base.filter(r => r.c.category === "teacher").length,
        parent: base.filter(r => r.c.category === "parent").length,
        student: base.filter(r => r.c.category === "student").length,
        staff: base.filter(r => r.c.category === "staff").length,
    }), [base]);
    const filtered = useMemo(() => base.filter(r => tab === "all" || r.c.category === tab), [base, tab]);

    useEffect(() => { setPage(1); }, [tab, search, unreadOnly, withThreadOnly]);
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    const current = Math.min(page, totalPages);
    const start = (current - 1) * PAGE_SIZE;
    const pageRows = filtered.slice(start, start + PAGE_SIZE);

    const totalUnread = messages.filter(m => m.receiverId === userId && !m.isRead).length;
    const directory = useMemo(() => ({
        teacher: contacts.filter(c => c.category === "teacher").length,
        parent: contacts.filter(c => c.category === "parent").length,
        student: contacts.filter(c => c.category === "student").length,
    }), [contacts]);

    // Sélection : contact demandé par une autre page, sinon la conversation la plus récente
    const target = (location.state as { contactId?: string } | null)?.contactId;
    useEffect(() => {
        if (target && contacts.some(c => c.id === target)) { open(target); return; }
        // Sur mobile, l'ouverture par défaut laisse la liste affichée
        if (!selectedId && rows.length && !contactsQuery.isLoading && !messagesQuery.isLoading) open(rows[0].c.id, false);
    }, [target, contacts, rows, contactsQuery.isLoading, messagesQuery.isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

    const active = contacts.find(c => c.id === selectedId) || null;
    const thread = useMemo(() => threads.get(selectedId) || [], [threads, selectedId]);

    function open(id: string, showThread = true) {
        const t = threads.get(id) || [];
        setFirstUnreadId(t.find(m => m.receiverId === userId && !m.isRead)?.id ?? null);
        setSelectedId(id);
        if (showThread) setMobileThread(true);
        setDraft("");
    }

    // Lecture : marque les messages reçus comme lus à l'ouverture de la conversation
    useEffect(() => {
        const unread = thread.filter(m => m.receiverId === userId && !m.isRead);
        if (!unread.length) return;
        qc.setQueryData<Msg[]>(["messages", userId], old => old?.map(m => (unread.some(u => u.id === m.id) ? { ...m, isRead: true } : m)) ?? old);
        unread.forEach(m => { markMessageAsRead(m.id).catch((): void => undefined); });
    }, [thread, userId, qc]);

    useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [thread.length, selectedId]);

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onMutate: async (payload: any) => {
            await qc.cancelQueries({ queryKey: ["messages", userId] });
            const prev = qc.getQueryData<Msg[]>(["messages", userId]);
            const optimistic: Msg = {
                id: `temp-${Date.now()}`, senderId: userId, senderName: user?.name || "", senderRole: "advisor",
                receiverId: payload.receiverId, receiverName: payload.receiverName, receiverRole: payload.receiverRole,
                content: payload.content, attachmentUrl: payload.attachmentUrl, isRead: false, createdAt: new Date().toISOString(),
            };
            qc.setQueryData<Msg[]>(["messages", userId], old => [...(old || []), optimistic]);
            return { prev };
        },
        onError: (_e, _v, ctx) => { qc.setQueryData(["messages", userId], ctx?.prev); toast.error("Le message n'a pas pu être envoyé."); },
        onSettled: () => qc.invalidateQueries({ queryKey: ["messages", userId] }),
    });

    const send = (attachmentUrl?: string, attachmentName?: string) => {
        const content = draft.trim();
        if (!active || (!content && !attachmentUrl)) return;
        setDraft("");
        setFirstUnreadId(null);
        sendMutation.mutate({
            senderId: userId, senderName: user?.name, senderRole: "advisor",
            receiverId: active.id, receiverName: active.name, receiverRole: active.role,
            content: attachmentUrl ? content || attachmentName || "Pièce jointe" : content, attachmentUrl,
        });
    };

    const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file || !active) return;
        if (file.size > 10 * 1024 * 1024) { toast.error("Fichier trop volumineux (10 Mo maximum)."); return; }
        setUploading(true);
        const fd = new FormData();
        fd.append("attachment", file);
        try { send((await uploadMessageAttachment(fd)).fileUrl, file.name); } catch { toast.error("Erreur lors de l'envoi du fichier."); } finally { setUploading(false); }
    };

    const avatar = (name: string, size = "w-11 h-11 text-sm") => {
        const t = tone(name);
        return <div className={cn(size, "rounded-full flex items-center justify-center font-bold shrink-0")} style={{ background: t.bg, color: t.fg }}>{initials(name)}</div>;
    };
    const badge = (c: Contact) => <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0", CATEGORY[c.category].badge)}>{CATEGORY[c.category].label}</span>;

    const kpis = [
        { label: "Messages non lus", value: totalUnread, icon: Mail, cls: "bg-rose-50 text-rose-500", num: "text-rose-600" },
        { label: "Professeurs", value: directory.teacher, icon: UserRound, cls: "bg-blue-50 text-[#1A6CC8]", num: "text-[#0D2D5A]" },
        { label: "Parents", value: directory.parent, icon: Users, cls: "bg-emerald-50 text-emerald-600", num: "text-[#0D2D5A]" },
        { label: "Élèves", value: directory.student, icon: GraduationCap, cls: "bg-violet-50 text-violet-600", num: "text-[#0D2D5A]" },
    ];
    const tabs: ["all" | Category, string, number][] = [
        ["all", "Tous", counts.all], ["teacher", "Professeurs", counts.teacher], ["parent", "Parents", counts.parent], ["student", "Élèves", counts.student],
        ...(counts.staff ? [["staff", "Équipe", counts.staff] as ["staff", string, number]] : []),
    ];
    const loading = contactsQuery.isLoading || messagesQuery.isLoading;
    const [detail, detail2] = active ? contactDetail(active) : [null, null];

    return (
        <div className="w-full p-4 md:px-8 md:pb-8 md:pt-0 space-y-5">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
                <div>
                    <h1 className="text-[28px] font-bold text-[#0D2D5A] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>Messagerie</h1>
                    <p className="text-gray-500 text-sm mt-0.5">Échangez avec vos élèves, parents et enseignants.</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {kpis.map(k => (
                        <div key={k.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 flex items-center gap-3 min-w-[150px]">
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center shrink-0", k.cls)}><k.icon className="w-5 h-5" /></div>
                            <div><p className={cn("text-lg font-bold leading-tight", k.num)}>{loading ? "…" : k.value}</p><p className="text-xs text-gray-500">{k.label}</p></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[400px_minmax(0,1fr)] gap-5 lg:h-[calc(100vh-230px)] lg:min-h-[560px]">
                {/* Conversations */}
                <section className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0", mobileThread && "hidden lg:flex")}>
                    <div className="p-4 pb-0 space-y-3">
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input aria-label="Rechercher" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un contact, un élève, un parent..."
                                    className="w-full h-10 pl-9 pr-3 text-sm border border-gray-200 rounded-lg outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15" />
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button aria-label="Filtrer les conversations" className={cn("w-10 h-10 rounded-lg border flex items-center justify-center", unreadOnly || withThreadOnly ? "border-[#1A6CC8] text-[#1A6CC8] bg-[#1A6CC8]/5" : "border-gray-200 text-gray-500")}>
                                        <Filter className="w-4 h-4" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Afficher</DropdownMenuLabel>
                                    <DropdownMenuCheckboxItem checked={unreadOnly} onCheckedChange={v => setUnreadOnly(!!v)}>Non lus uniquement</DropdownMenuCheckboxItem>
                                    <DropdownMenuCheckboxItem checked={withThreadOnly} onCheckedChange={v => setWithThreadOnly(!!v)}>Conversations existantes</DropdownMenuCheckboxItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div role="tablist" className="flex gap-4 border-b border-gray-100 overflow-x-auto">
                            {tabs.map(([key, label, n]) => (
                                <button key={key} role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
                                    className={cn("flex items-center gap-1.5 pb-2.5 text-sm whitespace-nowrap border-b-2 -mb-px", tab === key ? "border-[#1A6CC8] text-[#0D2D5A] font-bold" : "border-transparent text-gray-500")}>
                                    {label}
                                    <span className={cn("min-w-[20px] h-5 px-1.5 rounded-full text-[11px] flex items-center justify-center", tab === key ? "text-white" : "bg-gray-100 text-gray-500")} style={tab === key ? { background: BLUE } : undefined}>{n}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto min-h-[240px]">
                        {loading ? (
                            <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-[#1A6CC8]" /></div>
                        ) : contactsQuery.isError ? (
                            <p className="p-6 text-sm text-center text-red-600">Impossible de charger les contacts.</p>
                        ) : pageRows.length === 0 ? (
                            <p className="p-6 text-sm text-center text-gray-400">Aucun contact ne correspond.</p>
                        ) : pageRows.map(({ c, last, unread }) => (
                            <button key={c.id} onClick={() => open(c.id)} aria-current={c.id === selectedId ? "true" : undefined}
                                className={cn("w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-50 border-l-[3px]", c.id === selectedId ? "bg-[#1A6CC8]/5 border-l-[#1A6CC8]" : "border-l-transparent hover:bg-gray-50")}>
                                {avatar(c.name)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 min-w-0"><span className="text-sm font-bold text-[#0D2D5A] truncate">{c.name}</span>{badge(c)}</div>
                                    <p className={cn("text-xs truncate mt-0.5", unread ? "text-[#0D2D5A] font-semibold" : "text-gray-500")}>
                                        {last ? `${last.senderId === userId ? "Vous : " : ""}${last.attachmentUrl && isFileLabel(last) ? `Pièce jointe : ${fileTitle(last)}` : last.content}` : contactDetail(c)[0]}
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5 shrink-0">
                                    <span className="text-[11px] text-gray-400">{last ? listStamp(last.createdAt) : ""}</span>
                                    {unread > 0 ? <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-bold text-white flex items-center justify-center" style={{ background: BLUE }}>{unread}</span>
                                        : last?.senderId === userId ? (last.isRead ? <CheckCheck className="w-4 h-4 text-[#1A6CC8]" aria-label="Lu" /> : <Check className="w-4 h-4 text-gray-400" aria-label="Envoyé" />) : <span className="h-5" />}
                                </div>
                            </button>
                        ))}
                    </div>
                    {filtered.length > 0 && (
                        <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">{start + 1}-{Math.min(start + PAGE_SIZE, filtered.length)} sur {filtered.length} contacts</span>
                            <nav aria-label="Pagination des conversations" className="flex items-center gap-1">
                                <button onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Page précédente" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
                                <span className="text-xs font-semibold text-[#0D2D5A] px-2">{current} / {totalPages}</span>
                                <button onClick={() => setPage(current + 1)} disabled={current === totalPages} aria-label="Page suivante" className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
                            </nav>
                        </div>
                    )}
                </section>

                {/* Conversation */}
                <section className={cn("bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-[520px] lg:min-h-0", !mobileThread && "hidden lg:flex")}>
                    {!active ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2 p-8 text-sm">
                            <MessageCircle className="w-10 h-10 opacity-40" /> Choisissez un contact pour démarrer une conversation.
                        </div>
                    ) : (
                        <>
                            <header className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
                                <button onClick={() => setMobileThread(false)} aria-label="Retour aux conversations" className="lg:hidden w-8 h-8 rounded-lg flex items-center justify-center text-gray-500"><ArrowLeft className="w-4 h-4" /></button>
                                {avatar(active.name, "w-12 h-12 text-base")}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2"><h2 className="text-base font-bold text-[#0D2D5A] truncate">{active.name}</h2>{badge(active)}</div>
                                    <p className="text-xs text-gray-500 truncate">{[detail, detail2].filter(Boolean).join(" • ")}</p>
                                </div>
                                {active.phone && (
                                    <a href={`tel:${active.phone.replace(/\s/g, "")}`} title={`Appeler ${active.phone}`} aria-label="Appeler" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0D2D5A] hover:bg-gray-50"><Phone className="w-4 h-4" /></a>
                                )}
                                {active.email && (
                                    <a href={`mailto:${active.email}`} title={active.email} aria-label="Écrire un email" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0D2D5A] hover:bg-gray-50"><AtSign className="w-4 h-4" /></a>
                                )}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <button aria-label="Plus d'actions" className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-[#0D2D5A] hover:bg-gray-50"><MoreVertical className="w-4 h-4" /></button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56">
                                        {active.category === "teacher" && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate(`/advisor/tutors?id=${active.id}`)}><FolderOpen className="w-4 h-4" /> Voir le profil tuteur</DropdownMenuItem>}
                                        {active.category === "student" && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/families", { state: { familyId: active.id } })}><FolderOpen className="w-4 h-4" /> Ouvrir la fiche élève</DropdownMenuItem>}
                                        {active.email && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { navigator.clipboard?.writeText(active.email!); toast.success("Email copié"); }}><Copy className="w-4 h-4" /> Copier l'email</DropdownMenuItem>}
                                        {active.phone && <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => { navigator.clipboard?.writeText(active.phone!); toast.success("Numéro copié"); }}><Copy className="w-4 h-4" /> Copier le numéro</DropdownMenuItem>}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => navigate("/advisor/schedule", { state: { type: `Rendez-vous avec ${active.name}` } })}><MessageCircle className="w-4 h-4" /> Planifier un rendez-vous</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </header>

                            <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/40">
                                {thread.length === 0 && (
                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
                                        <MessageCircle className="w-9 h-9 opacity-40" /> Aucun message avec {active.name}. Écrivez le premier.
                                    </div>
                                )}
                                {thread.map((m, i) => {
                                    const d = new Date(m.createdAt), mine = m.senderId === userId;
                                    const newDay = i === 0 || !sameDay(d, new Date(thread[i - 1].createdAt));
                                    const onlyFile = !!m.attachmentUrl && isFileLabel(m);
                                    return (
                                        <Fragment key={m.id}>
                                            {newDay && <div className="flex justify-center"><span className="text-[11px] font-semibold text-[#0D2D5A] bg-white border border-gray-100 rounded-full px-3 py-1 capitalize">{dayTitle(d)}</span></div>}
                                            {m.id === firstUnreadId && (
                                                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200" /><span className="text-[11px] font-semibold text-[#1A6CC8] bg-[#1A6CC8]/5 rounded-full px-3 py-1">Nouveau message</span><div className="flex-1 h-px bg-gray-200" /></div>
                                            )}
                                            <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
                                                {mine ? <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 bg-[#0F9B8E]">{initials(user?.name)}</div> : avatar(active.name, "w-9 h-9 text-xs")}
                                                <div className={cn("max-w-[75%] space-y-1.5", mine && "items-end flex flex-col")}>
                                                    {!onlyFile && (
                                                        <div className={cn("rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap break-words", mine ? "bg-[#1A6CC8]/10 text-[#0D2D5A] rounded-br-md" : "bg-white border border-gray-100 text-gray-700 rounded-bl-md")}>
                                                            {m.content}
                                                        </div>
                                                    )}
                                                    {m.attachmentUrl && (
                                                        <a href={fileUrl(m.attachmentUrl)} target="_blank" rel="noreferrer" className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3 py-2.5 hover:border-[#1A6CC8]/40 max-w-xs">
                                                            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0"><FileText className="w-5 h-5" /></div>
                                                            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-[#0D2D5A] truncate">{fileTitle(m)}</span><span className="block text-[11px] text-gray-400">{fileExt(m.attachmentUrl)} · Ouvrir ou télécharger</span></span>
                                                            <Download className="w-4 h-4 text-gray-400 shrink-0" />
                                                        </a>
                                                    )}
                                                    <p className={cn("text-[10px] text-gray-400 flex items-center gap-1", mine && "justify-end")}>
                                                        {hm(d)}{mine && (m.isRead ? <CheckCheck className="w-3.5 h-3.5 text-[#1A6CC8]" aria-label="Lu" /> : <Check className="w-3.5 h-3.5" aria-label="Envoyé" />)}
                                                    </p>
                                                </div>
                                            </div>
                                        </Fragment>
                                    );
                                })}
                            </div>

                            <form onSubmit={e => { e.preventDefault(); send(); }} className="px-5 py-3 border-t border-gray-100">
                                <div className="flex items-end gap-2">
                                    <input ref={fileRef} type="file" className="hidden" onChange={upload} aria-label="Joindre un fichier" />
                                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} aria-label="Joindre un fichier" title="Joindre un fichier (10 Mo max.)"
                                        className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0 disabled:opacity-50">
                                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                    </button>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <button type="button" aria-label="Insérer un emoji" className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 shrink-0"><Smile className="w-4 h-4" /></button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-2 grid grid-cols-6 gap-1" align="start">
                                            {EMOJIS.map(em => <button key={em} type="button" onClick={() => setDraft(t => t + em)} className="w-8 h-8 rounded hover:bg-gray-100 text-lg">{em}</button>)}
                                        </PopoverContent>
                                    </Popover>
                                    <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={1} aria-label="Votre message" placeholder="Écrivez votre message..."
                                        onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                                        className="flex-1 min-h-[44px] max-h-32 resize-none border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#1A6CC8] focus:ring-2 focus:ring-[#1A6CC8]/15" />
                                    <button type="submit" aria-label="Envoyer" disabled={!draft.trim() || sendMutation.isPending}
                                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-40" style={{ background: BLUE }}>
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-400 mt-1.5 ml-[104px]">Entrée pour envoyer, Maj + Entrée pour aller à la ligne</p>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}
