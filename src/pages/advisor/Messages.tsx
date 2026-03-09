import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageCircle, Paperclip, Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { fetchMessages, sendMessage, markMessageAsRead } from "@/api/backoffice";

const ROLE_COLOR: Record<string, string> = {
    teacher: "#1A6CC8",
    advisor: "#a855f7",
    student: "#22c55e",
    parent: "#F5A623",
};

const ROLE_LABEL: Record<string, string> = {
    teacher: "Enseignant",
    advisor: "Moi",
    student: "Élève",
    parent: "Parent",
};

interface Message {
    id: string;
    senderId: string;
    senderName: string;
    senderRole: string;
    receiverId: string;
    receiverName: string;
    receiverRole: string;
    content: string;
    attachmentUrl?: string;
    isRead: boolean;
    createdAt: string;
}

const DEFAULT_CONTACTS = [
    { id: "parent-1", name: "Aminata Diallo", role: "parent", avatar: "AD", color: "#F5A623" },
    { id: "teacher-1", name: "Dr. Clémentine Abanda", role: "teacher", avatar: "CA", color: "#1A6CC8" },
    { id: "student-1", name: "Koffi Diallo", role: "student", avatar: "KD", color: "#22c55e" },
];

export default function AdvisorMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const location = useLocation();

    const targetedContact = location.state as { contactName?: string; defaultRole?: string } | null;

    const userId = user?.id || "";
    const userName = user?.name || "";

    const [reply, setReply] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [contactFilter, setContactFilter] = useState<"all" | "student" | "parent" | "teacher">("all");
    const [isUploading, setIsUploading] = useState(false);

    const { data: messages = [], isLoading } = useQuery<Message[]>({
        queryKey: ["messages", userId],
        queryFn: () => fetchMessages(userId),
        enabled: !!userId,
        refetchInterval: 5000,
    });

    const sendMessageMutation = useMutation({
        mutationFn: sendMessage,
        onMutate: async (newMessage) => {
            await queryClient.cancelQueries({ queryKey: ["messages", userId] });
            const previousMessages = queryClient.getQueryData<Message[]>(["messages", userId]);

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                senderId: userId,
                senderName: userName,
                senderRole: "advisor",
                receiverId: selectedContactId,
                receiverName: activeContact?.name || "",
                receiverRole: activeContact?.role || "",
                content: newMessage.content || "",
                attachmentUrl: newMessage.attachmentUrl,
                isRead: true,
                createdAt: new Date().toISOString(),
            };

            queryClient.setQueryData<Message[]>(["messages", userId], (old) => [...(old || []), optimisticMessage]);
            return { previousMessages };
        },
        onError: (_err, _newMsg, context) => {
            queryClient.setQueryData(["messages", userId], context?.previousMessages);
            toast.error("Le message n'a pas pu être envoyé.");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        },
    });

    const markReadMutation = useMutation({
        mutationFn: markMessageAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        }
    });

    const contacts = useMemo(() => {
        const contactMap = new Map<string, any>();

        DEFAULT_CONTACTS.forEach(c => contactMap.set(c.id, { ...c, unread: 0 }));

        if (targetedContact?.contactName) {
            const targetId = `target-${targetedContact.contactName.replace(/\s+/g, '-').toLowerCase()}`;
            if (!contactMap.has(targetId)) {
                contactMap.set(targetId, {
                    id: targetId,
                    name: targetedContact.contactName,
                    role: targetedContact.defaultRole || "parent",
                    avatar: targetedContact.contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
                    color: ROLE_COLOR[targetedContact.defaultRole || "parent"] || "#9ca3af",
                    unread: 0,
                });
            }
        }

        messages.forEach(msg => {
            const isMe = msg.senderId === userId;
            const contactId = isMe ? msg.receiverId : msg.senderId;
            const contactName = isMe ? msg.receiverName : msg.senderName;
            const contactRole = isMe ? msg.receiverRole : msg.senderRole;

            if (!contactMap.has(contactId)) {
                contactMap.set(contactId, {
                    id: contactId,
                    name: contactName,
                    role: contactRole,
                    avatar: contactName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
                    color: ROLE_COLOR[contactRole] || "#9ca3af",
                    unread: 0,
                });
            }

            const c = contactMap.get(contactId)!;
            c.lastMessage = msg;
            if (!isMe && !msg.isRead) {
                c.unread += 1;
            }
        });

        return Array.from(contactMap.values());
    }, [messages, userId, targetedContact]);

    useEffect(() => {
        if (targetedContact?.contactName) {
            const targetId = `target-${targetedContact.contactName.replace(/\s+/g, '-').toLowerCase()}`;
            setSelectedContactId(targetId);
        } else if (!selectedContactId && contacts.length > 0) {
            setSelectedContactId(contacts[0].id);
        }
    }, [targetedContact, contacts, selectedContactId]);

    const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

    const threadMessages = useMemo(() => messages.filter(m =>
        (m.senderId === userId && m.receiverId === selectedContactId) ||
        (m.receiverId === userId && m.senderId === selectedContactId)
    ), [messages, userId, selectedContactId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [threadMessages]);

    useEffect(() => {
        const unreadMessages = threadMessages.filter(m => m.receiverId === userId && !m.isRead);
        if (unreadMessages.length > 0) {
            unreadMessages.forEach(m => markReadMutation.mutate(m.id));
        }
    }, [selectedContactId, threadMessages]);

    const handleSend = async (attachmentUrl?: string) => {
        if ((!reply.trim() && !attachmentUrl) || !activeContact) return;
        const content = reply.trim();
        setReply("");
        sendMessageMutation.mutate({
            senderId: userId,
            senderName: userName,
            senderRole: "advisor",
            receiverId: activeContact.id,
            receiverName: activeContact.name,
            receiverRole: activeContact.role,
            content: attachmentUrl ? (content || "Pièce jointe") : content,
            attachmentUrl
        });
    };

    return (
        <div className="p-4 md:p-8 space-y-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Messages</h1>
                <p className="text-gray-500 text-sm mt-1">Échangez avec les familles et les enseignants</p>
            </div>

            <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-[#a855f7]/20 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoading && contacts.length === 0 ? (
                            <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                        ) : (
                            contacts.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedContactId(c.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedContactId === c.id ? "bg-[#a855f7]/5 border border-[#a855f7]/20" : "border border-transparent hover:bg-gray-50"}`}
                                >
                                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: c.color }}>{c.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className="font-semibold text-[#0D2D5A] text-sm truncate">{c.name}</div>
                                            {c.lastMessage && <div className="text-[10px] text-gray-400">{new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate flex items-center justify-between">
                                            <span className="truncate pr-2">{c.lastMessage ? (c.lastMessage.senderId === userId ? `Vous: ${c.lastMessage.content}` : c.lastMessage.content) : c.role}</span>
                                            {c.unread > 0 && <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{c.unread}</div>}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
                    {activeContact && (
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: activeContact.color }}>{activeContact.avatar}</div>
                            <div>
                                <div className="font-bold text-[#0D2D5A]">{activeContact.name}</div>
                                <div className="text-xs text-gray-400">{ROLE_LABEL[activeContact.role] || activeContact.role}</div>
                            </div>
                        </div>
                    )}

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {threadMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <MessageCircle className="w-12 h-12 opacity-20" />
                                <p className="text-sm">Envoyez votre premier message à {activeContact?.name.split(" ")[0] || "ce contact"}.</p>
                            </div>
                        ) : (
                            threadMessages.map((msg, index) => {
                                const isMe = msg.senderId === userId;
                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                        <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isMe ? "bg-[#a855f7] text-white rounded-br-sm shadow-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                                                {msg.content}
                                            </div>
                                            <div className="text-[10px] text-gray-400 px-1">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50">
                        <div className="flex items-end gap-2 bg-white border border-gray-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#a855f7]/20 transition-all shadow-sm">
                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder="Écrivez votre message…"
                                className="w-full max-h-32 min-h-[40px] resize-none border-none focus:ring-0 outline-none text-sm text-gray-700 py-2.5 px-2 bg-transparent"
                                rows={1}
                            />
                            <button onClick={() => handleSend()} className="p-2.5 rounded-xl transition-all" style={{ background: reply.trim() ? "#a855f7" : "transparent" }}><Send className={`w-5 h-5 ${reply.trim() ? "text-white" : "text-gray-300"}`} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
