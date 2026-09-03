import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageCircle, Paperclip, Search, Loader2, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import {
    fetchAdvisorContacts,
    fetchMessages,
    sendMessage,
    markMessageAsRead,
    uploadMessageAttachment
} from "@/api/backoffice";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const ROLE_LABEL: Record<string, string> = {
    teacher: "Enseignant",
    advisor: "Conseiller",
    student: "Élève",
    parent: "Parent",
};

const getFullAttachmentUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const rootUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    return `${rootUrl}${url}`;
};

export default function AdvisorMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();
    const targetedContact = location.state as { contactId?: string; contactName?: string } | null;

    const userId = user?.id || "";
    const userName = user?.name || "";

    const [reply, setReply] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState<"all" | "teacher" | "parent">("all");
    const [isUploading, setIsUploading] = useState(false);

    const { data: contacts = [], isLoading: loadingContacts } = useQuery({
        queryKey: ["advisorContacts", userId],
        queryFn: () => fetchAdvisorContacts(userId),
        enabled: !!userId,
    });

    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: ["messages", userId],
        queryFn: () => fetchMessages(userId),
        enabled: !!userId,
        refetchInterval: 5000,
    });

    // Enrich contacts with unread count and last message
    const enrichedContacts = useMemo(() => {
        return contacts.map((c: any) => {
            const thread = messages.filter((m: any) =>
                (m.senderId === userId && m.receiverId === c.id) ||
                (m.receiverId === userId && m.senderId === c.id)
            );
            const lastMessage = thread[thread.length - 1] || null;
            const unread = thread.filter((m: any) => m.receiverId === userId && !m.isRead).length;
            return { ...c, lastMessage, unread };
        }).sort((a: any, b: any) => {
            if (!a.lastMessage && !b.lastMessage) return 0;
            if (!a.lastMessage) return 1;
            if (!b.lastMessage) return -1;
            return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
        });
    }, [contacts, messages, userId]);

    const filteredContacts = useMemo(() => {
        return enrichedContacts.filter((c: any) => {
            const matchesSearch = c.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRole = roleFilter === "all" || c.role === roleFilter;
            return matchesSearch && matchesRole;
        });
    }, [enrichedContacts, searchTerm, roleFilter]);

    const activeContact = enrichedContacts.find((c: any) => c.id === selectedContactId) || null;

    const threadMessages = useMemo(() => messages.filter((m: any) =>
        (m.senderId === userId && m.receiverId === selectedContactId) ||
        (m.receiverId === userId && m.senderId === selectedContactId)
    ), [messages, userId, selectedContactId]);

    // Auto-select from navigation state
    useEffect(() => {
        if (targetedContact?.contactId) {
            setSelectedContactId(targetedContact.contactId);
        }
    }, [targetedContact]);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [threadMessages]);

    // Mark messages as read
    useEffect(() => {
        const unread = threadMessages.filter((m: any) => m.receiverId === userId && !m.isRead);
        if (unread.length > 0) {
            queryClient.setQueryData(["messages", userId], (old: any[]) =>
                old?.map(m => unread.find(u => u.id === m.id) ? { ...m, isRead: true } : m) || old
            );
            unread.forEach((m: any) => markMessageAsRead(m.id));
        }
    }, [selectedContactId, threadMessages]);

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onMutate: async (payload: any) => {
            await queryClient.cancelQueries({ queryKey: ["messages", userId] });
            const prev = queryClient.getQueryData(["messages", userId]);
            const optimistic = {
                id: `temp-${Date.now()}`,
                senderId: userId,
                senderName: userName,
                senderRole: "advisor",
                receiverId: payload.receiverId,
                receiverName: payload.receiverName,
                receiverRole: payload.receiverRole,
                content: payload.content || "",
                attachmentUrl: payload.attachmentUrl,
                isRead: true,
                createdAt: new Date().toISOString(),
            };
            queryClient.setQueryData(["messages", userId], (old: any[]) => [...(old || []), optimistic]);
            return { prev };
        },
        onError: (_err, _vars, ctx) => {
            queryClient.setQueryData(["messages", userId], ctx?.prev);
            toast.error("Le message n'a pas pu être envoyé.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        },
    });

    const handleSend = (attachmentUrl?: string) => {
        if ((!reply.trim() && !attachmentUrl) || !activeContact) return;
        const content = reply.trim();
        setReply("");
        sendMutation.mutate({
            senderId: userId,
            senderName: userName,
            senderRole: "advisor",
            receiverId: activeContact.id,
            receiverName: activeContact.name,
            receiverRole: activeContact.role,
            content: attachmentUrl ? (content || "Pièce jointe") : content,
            attachmentUrl,
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !activeContact) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("attachment", file);
        try {
            const { fileUrl } = await uploadMessageAttachment(formData);
            handleSend(fileUrl);
        } catch {
            toast.error("Erreur lors de l'envoi du fichier.");
        } finally {
            setIsUploading(false);
            e.target.value = "";
        }
    };

    if (loadingContacts) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#a855f7]/40" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-160px)] flex md:gap-3 overflow-hidden p-3 bg-white">
            {/* Liste contacts */}
            <div className={`w-full md:w-72 border border-slate-200 bg-white overflow-hidden shrink-0 ${selectedContactId ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 space-y-2">
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Messagerie</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Rechercher un contact..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#a855f7] transition-all"
                        />
                    </div>
                    <div className="flex gap-1">
                        {(["all", "teacher", "parent"] as const).map(r => (
                            <button
                                key={r}
                                onClick={() => setRoleFilter(r)}
                                className={`flex-1 py-1 text-[8px] font-black uppercase tracking-widest transition-all ${
                                    roleFilter === r ? "bg-[#a855f7] text-white" : "text-slate-400 hover:bg-slate-100"
                                }`}
                            >
                                {r === "all" ? "Tous" : r === "teacher" ? "Profs" : "Parents"}
                            </button>
                        ))}
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y divide-slate-100">
                        {filteredContacts.length === 0 ? (
                            <div className="py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Aucun contact
                            </div>
                        ) : (
                            filteredContacts.map((c: any) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedContactId(c.id)}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all text-left ${
                                        selectedContactId === c.id
                                            ? "bg-[#a855f7] text-white"
                                            : "hover:bg-slate-50/50 text-[#0D2D5A]"
                                    }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-[11px] shrink-0 ${
                                        selectedContactId === c.id ? "bg-white/20 text-white" : "bg-[#0D2D5A] text-white"
                                    }`}>
                                        {c.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-1">
                                            <p className="font-black text-[11px] uppercase tracking-tight truncate">{c.name}</p>
                                            {c.unread > 0 && (
                                                <span className="w-4 h-4 rounded-full bg-[#a855f7] text-white text-[8px] font-black flex items-center justify-center shrink-0">
                                                    {c.unread}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${
                                            selectedContactId === c.id ? "text-purple-200" : "text-slate-400"
                                        }`}>
                                            {ROLE_LABEL[c.role] || c.role}
                                            {c.lastMessage && <span className="ml-1 normal-case">· {c.lastMessage.senderId === userId ? "Vous: " : ""}{c.lastMessage.content?.slice(0, 18)}{c.lastMessage.content?.length > 18 ? "…" : ""}</span>}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Zone de chat */}
            <div className={`border border-slate-200 bg-white overflow-hidden ${selectedContactId ? 'flex flex-col flex-1' : 'hidden md:flex md:flex-col md:flex-1'}`}>
                {activeContact ? (
                    <>
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden w-7 h-7 text-slate-400 shrink-0"
                                    onClick={() => setSelectedContactId("")}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </Button>
                                <div className="w-8 h-8 bg-[#a855f7] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                                    {activeContact.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-[#0D2D5A] text-[11px] uppercase tracking-tight">{activeContact.name}</h3>
                                    <p className="text-[9px] text-[#a855f7] uppercase tracking-widest font-black">{ROLE_LABEL[activeContact.role] || activeContact.role}</p>
                                </div>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3">
                            <div className="space-y-3">
                                {loadingMessages ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="animate-spin text-[#a855f7]/30 w-6 h-6" />
                                    </div>
                                ) : threadMessages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-3 py-16">
                                        <MessageCircle className="w-10 h-10 opacity-30" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">
                                            Démarrez la conversation avec {activeContact.name.split(" ")[0]}
                                        </p>
                                    </div>
                                ) : (
                                    threadMessages.map((m: any) => {
                                        const isMe = m.senderId === userId;
                                        return (
                                            <div key={m.id} className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse ml-auto" : ""}`}>
                                                <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-black shrink-0 ${
                                                    isMe ? "bg-[#a855f7] text-white" : "bg-slate-100 text-slate-500"
                                                }`}>
                                                    {(isMe ? userName : activeContact.name)?.charAt(0)}
                                                </div>
                                                <div className={`space-y-0.5 ${isMe ? "items-end flex flex-col" : ""}`}>
                                                    <div className={`px-3 py-2 text-[11px] font-bold ${
                                                        isMe
                                                            ? "bg-[#a855f7] text-white"
                                                            : "bg-slate-50 border border-slate-100 text-[#0D2D5A]"
                                                    }`}>
                                                        {m.content}
                                                        {m.attachmentUrl && (
                                                            <div className="mt-2 border border-black/10 bg-black/5 p-2 flex flex-col gap-2">
                                                                {/\.(jpg|jpeg|png|gif|webp)$/i.test(m.attachmentUrl) && (
                                                                    <img
                                                                        src={getFullAttachmentUrl(m.attachmentUrl)}
                                                                        alt="Pièce jointe"
                                                                        className="max-w-full h-auto max-h-[150px] object-cover"
                                                                    />
                                                                )}
                                                                <a
                                                                    href={getFullAttachmentUrl(m.attachmentUrl)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase hover:underline bg-white/20 hover:bg-white/30 text-current p-1.5 transition-all w-fit"
                                                                >
                                                                    <FolderOpen className="w-3 h-3" /> Ouvrir le fichier
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-slate-400 font-bold uppercase block">
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                            className="p-3 border-t border-slate-100 flex items-center gap-2"
                        >
                            <div className="flex-1 flex items-center gap-2 bg-slate-50/50 border border-slate-200 px-3 py-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 text-slate-400 hover:text-[#a855f7] shrink-0"
                                    disabled={isUploading}
                                    onClick={() => document.getElementById('advisor-chat-file')?.click()}
                                >
                                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                                    <input type="file" id="advisor-chat-file" className="hidden" onChange={handleFileUpload} />
                                </Button>
                                <input
                                    type="text"
                                    placeholder="Écrire un message..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-[#0D2D5A] py-1"
                                />
                            </div>
                            <Button
                                type="submit"
                                disabled={!reply.trim() || sendMutation.isPending}
                                className="h-9 px-3 bg-[#a855f7] hover:bg-purple-600 rounded-none shadow-none"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 space-y-3">
                        <MessageCircle className="w-10 h-10 opacity-30" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sélectionnez un contact</p>
                    </div>
                )}
            </div>
        </div>
    );
}
