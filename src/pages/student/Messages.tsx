import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageCircle, Paperclip, Search, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const ROLE_COLOR: Record<string, string> = {
    teacher: "#1A6CC8",
    advisor: "#a855f7",
    student: "#22c55e",
};

const ROLE_LABEL: Record<string, string> = {
    teacher: "Enseignant",
    advisor: "Conseiller",
    student: "Moi",
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

// Contacts par défaut pour pouvoir démarrer une conversation même sans historique
// IDs réels depuis la base de données (table users)
const DEFAULT_CONTACTS = [
    { id: "t1", name: "Dr. Clémentine Abanda", role: "teacher", avatar: "CA", color: "#1A6CC8" },
    { id: "c1", name: "Brice Owona", role: "advisor", avatar: "BO", color: "#a855f7" },
];

export default function StudentMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef<HTMLDivElement>(null);
    const userId = user?.id || "s1"; // Fallback pour dev (s1 = Koffi Diallo en base)
    const userName = user?.name || "Koffi Diallo";

    const [reply, setReply] = useState("");
    const [selectedContactId, setSelectedContactId] = useState<string>("t1");
    const [searchTerm, setSearchTerm] = useState("");
    const [contactFilter, setContactFilter] = useState<"all" | "teacher" | "advisor">("all");
    const [isUploading, setIsUploading] = useState(false);

    // 1. Fetch de tous les messages de l'utilisateur
    const { data: messages = [], isLoading } = useQuery<Message[]>({
        queryKey: ["messages", userId],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/messages/${userId}`);
            if (!res.ok) throw new Error("Erreur serveur");
            return res.json();
        },
        refetchInterval: 10000, // Rafraîchissement automatique toutes les 10s (Simili temps réel)
    });

    // 2. Envoi de message (Mutation)
    const sendMessageMutation = useMutation({
        mutationFn: async (payload: Partial<Message>) => {
            const res = await fetch(`${API_BASE_URL}/messages`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Erreur d'envoi");
            return res.json();
        },
        onMutate: async (newMessage) => {
            // Optimistic update pour une UI ultra fluide
            await queryClient.cancelQueries({ queryKey: ["messages", userId] });
            const previousMessages = queryClient.getQueryData<Message[]>(["messages", userId]);

            const optimisticMessage: Message = {
                id: `temp-${Date.now()}`,
                senderId: userId,
                senderName: userName,
                senderRole: "student",
                receiverId: selectedContactId,
                receiverName: activeContact?.name || "",
                receiverRole: activeContact?.role || "",
                content: newMessage.content || "",
                attachmentUrl: newMessage.attachmentUrl,
                isRead: true, // par défaut
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

    // 3. Mark as Read (Mutation)
    const markAsReadMutation = useMutation({
        mutationFn: async (messageId: string) => {
            await fetch(`${API_BASE_URL}/messages/${messageId}/read`, { method: "PATCH" });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["messages", userId] });
        }
    });

    // Construction dynamique de la liste de contacts basée sur l'historique + par défaut
    const contacts = useMemo(() => {
        const contactMap = new Map<string, typeof DEFAULT_CONTACTS[0] & { unread: number, lastMessage?: Message }>();

        // Insérer contacts par défaut
        DEFAULT_CONTACTS.forEach(c => contactMap.set(c.id, { ...c, unread: 0 }));

        // Remplir avec l'historique
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
            c.lastMessage = msg; // Le select est ORDER BY ASC donc le dernier écrasera
            if (!isMe && !msg.isRead) {
                c.unread += 1;
            }
        });

        return Array.from(contactMap.values());
    }, [messages, userId]);

    // Filtrer la sidebar
    const filteredContacts = contacts.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = contactFilter === "all" || c.role === contactFilter;
        return matchesSearch && matchesFilter;
    });

    const activeContact = contacts.find(c => c.id === selectedContactId) || contacts[0];

    // Messages du thread actif
    const threadMessages = messages.filter(m =>
        (m.senderId === userId && m.receiverId === selectedContactId) ||
        (m.receiverId === userId && m.senderId === selectedContactId)
    );

    // Scroller en bas à chaque nouveau message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [threadMessages]);

    // Marquer comme lu à l'ouverture d'un contact
    useEffect(() => {
        const unreadMessages = threadMessages.filter(m => m.receiverId === userId && !m.isRead);
        if (unreadMessages.length > 0) {
            unreadMessages.forEach(m => markAsReadMutation.mutate(m.id));
        }
    }, [selectedContactId, threadMessages]);

    const handleSend = async (attachmentUrl?: string) => {
        if (!reply.trim() && !attachmentUrl) return;

        const content = reply.trim();
        setReply(""); // Reset direct pour la UI

        sendMessageMutation.mutate({
            senderId: userId,
            senderName: userName,
            senderRole: "student",
            receiverId: activeContact.id,
            receiverName: activeContact.name,
            receiverRole: activeContact.role,
            content: attachmentUrl ? (content || "Pièce jointe") : content,
            attachmentUrl
        });
    };

    const triggerUpload = () => {
        // Simulation d'upload
        setIsUploading(true);
        setTimeout(() => {
            handleSend("https://placehold.co/400x300.png?text=Fichier+Exercice");
            setIsUploading(false);
            toast.success("Fichier envoyé avec succès !");
        }, 1500);
    };

    return (
        <div className="p-4 md:p-8 space-y-6 h-[calc(100vh-80px)] overflow-hidden flex flex-col">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Messages</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Échangez avec votre enseignant et votre conseiller
                </p>
            </div>

            <div className="flex-1 grid lg:grid-cols-3 gap-6 min-h-0">
                {/* Sidebar */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        {/* Search & Tabs */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 text-sm pl-9 pr-4 py-2 rounded-xl border-none focus:ring-2 focus:ring-[#1A6CC8]/20 outline-none"
                            />
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-xl">
                            {(["all", "teacher", "advisor"] as const).map((filter) => (
                                <button
                                    key={filter}
                                    onClick={() => setContactFilter(filter)}
                                    className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${contactFilter === filter ? "bg-white text-[#0D2D5A] shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                                >
                                    {filter === "all" ? "Tous" : ROLE_LABEL[filter]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {isLoading && contacts.length === 0 ? (
                            <div className="flex justify-center p-6"><Loader2 className="w-6 h-6 animate-spin text-gray-300" /></div>
                        ) : filteredContacts.length === 0 ? (
                            <div className="text-center text-sm text-gray-400 p-6">Aucun contact trouvé.</div>
                        ) : (
                            filteredContacts.map((c) => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedContactId(c.id)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedContactId === c.id
                                        ? "bg-[#1A6CC8]/5 border border-[#1A6CC8]/20"
                                        : "border border-transparent hover:bg-gray-50"
                                        }`}
                                >
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                        style={{ background: c.color }}
                                    >
                                        {c.avatar}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <div className="font-semibold text-[#0D2D5A] text-sm truncate">{c.name}</div>
                                            {c.lastMessage && (
                                                <div className="text-[10px] text-gray-400">
                                                    {new Date(c.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-400 truncate flex items-center justify-between">
                                            <span className="truncate pr-2">{c.lastMessage ? (c.lastMessage.senderId === userId ? `Vous: ${c.lastMessage.content}` : c.lastMessage.content) : c.role}</span>
                                            {c.unread > 0 && (
                                                <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                                    {c.unread}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Thread */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col min-h-0">
                    {/* Header thread */}
                    {activeContact && (
                        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ background: activeContact.color }}>
                                {activeContact.avatar}
                            </div>
                            <div>
                                <div className="font-bold text-[#0D2D5A]">{activeContact.name}</div>
                                <div className="text-xs text-gray-400">{ROLE_LABEL[activeContact.role]}</div>
                            </div>
                            <div className="ml-auto flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                                <span className="text-xs font-medium text-gray-500">En ligne</span>
                            </div>
                        </div>
                    )}

                    {/* Messages list */}
                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
                        {threadMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-3">
                                <MessageCircle className="w-12 h-12 opacity-20" />
                                <p className="text-sm">Envoyez votre premier message à {activeContact?.name.split(" ")[0]}.</p>
                            </div>
                        ) : (
                            threadMessages.map((msg, index) => {
                                const isMe = msg.senderId === userId;
                                const showAvatar = !isMe && (index === 0 || threadMessages[index - 1].senderId !== msg.senderId);

                                return (
                                    <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                                        <div className="w-8 flex-shrink-0 flex justify-center">
                                            {showAvatar && (
                                                <div
                                                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                                    style={{ background: activeContact.color }}
                                                >
                                                    {activeContact.avatar}
                                                </div>
                                            )}
                                        </div>
                                        <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isMe
                                                    ? "bg-[#22c55e] text-white rounded-br-sm shadow-sm"
                                                    : "bg-gray-100 text-gray-800 rounded-bl-sm"
                                                    }`}
                                            >
                                                {msg.attachmentUrl && (
                                                    <div className="mb-2 relative rounded-lg overflow-hidden border border-white/20">
                                                        <img src={msg.attachmentUrl} alt="Pièce jointe" className="max-w-full h-auto max-h-[200px] object-cover" />
                                                    </div>
                                                )}
                                                {msg.content}
                                            </div>
                                            <div className="text-[10px] text-gray-400 px-1 font-medium">
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        {sendMessageMutation.isPending && (
                            <div className="flex items-end gap-2 flex-row-reverse opacity-50">
                                <div className="w-8" />
                                <div className="bg-[#22c55e] text-white px-4 py-2 rounded-2xl rounded-br-sm text-sm">Envoi en cours...</div>
                            </div>
                        )}
                    </div>

                    {/* Composer */}
                    <div className="px-4 py-4 border-t border-gray-100 bg-gray-50/50 flex-shrink-0">
                        <div className="flex items-end gap-2 bg-white border border-gray-200 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-[#22c55e]/20 focus-within:border-[#22c55e] transition-all shadow-sm">
                            <button
                                onClick={triggerUpload}
                                disabled={isUploading || sendMessageMutation.isPending}
                                className="p-2 text-gray-400 hover:text-[#1A6CC8] hover:bg-[#1A6CC8]/10 rounded-xl transition-colors shrink-0 disabled:opacity-50"
                            >
                                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-[#1A6CC8]" /> : <Paperclip className="w-5 h-5" />}
                            </button>

                            <textarea
                                value={reply}
                                onChange={(e) => setReply(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Écrivez votre message… (Entrée pour envoyer)"
                                className="w-full max-h-32 min-h-[40px] resize-none border-none focus:ring-0 outline-none text-sm text-gray-700 py-2.5 px-2 bg-transparent"
                                rows={1}
                            />

                            <button
                                onClick={() => handleSend()}
                                disabled={!reply.trim() && !isUploading}
                                className="p-2.5 rounded-xl shrink-0 transition-all flex items-center justify-center disabled:opacity-50"
                                style={{ background: reply.trim() ? "#1A6CC8" : "transparent" }}
                            >
                                <Send className={`w-5 h-5 ${reply.trim() ? "text-white" : "text-gray-300"}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
