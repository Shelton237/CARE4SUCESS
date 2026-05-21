import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MessageCircle,
    Search,
    Send,
    Paperclip,
    CheckCheck,
    Phone,
    Video,
    Info,
    FolderOpen,
    Loader2
} from "lucide-react";
import { fetchTeacherContacts, fetchMessages, sendMessage, uploadMessageAttachment, markMessageAsRead } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const getFullAttachmentUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const rootUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    return `${rootUrl}${url}`;
};

export default function TeacherMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    const { data: contacts = [], isLoading: loadingContacts } = useQuery({
        queryKey: ["teacherContacts", user?.id],
        queryFn: () => fetchTeacherContacts(user!.id),
        enabled: !!user?.id,
    });

    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: ["messages", selectedContact?.id],
        queryFn: () => fetchMessages(selectedContact.channels?.id || selectedContact.id),
        enabled: !!selectedContact,
        refetchInterval: 5000,
    });

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ["messages", selectedContact?.id] });
        }
    });

    const markAsReadMutation = useMutation({
        mutationFn: markMessageAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["unreadCount", user?.id] });
        }
    });

    useEffect(() => {
        if (selectedContact && messages.length > 0) {
            const unread = messages.filter((m: any) => m.receiverId === user?.id && !m.isRead);
            if (unread.length > 0) {
                // Optimistic update to prevent infinite loops
                queryClient.setQueryData(["messages", selectedContact?.id], (old: any) => {
                    if (!old) return old;
                    return old.map((m: any) => unread.find((u: any) => u.id === m.id) ? { ...m, isRead: true } : m);
                });
                
                unread.forEach((m: any) => {
                    markAsReadMutation.mutate(m.id);
                });
            }
        }
    }, [messages, selectedContact, user?.id, queryClient]);

    const filteredContacts = contacts.filter((c: any) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;
        sendMutation.mutate({
            senderId: user!.id,
            senderName: user!.name,
            senderRole: user!.role,
            receiverId: selectedContact.id,
            receiverName: selectedContact.name,
            receiverRole: selectedContact.role,
            content: newMessage,
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContact) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("attachment", file);
        try {
            const { fileUrl } = await uploadMessageAttachment(formData);
            sendMutation.mutate({
                senderId: user!.id,
                senderName: user!.name,
                senderRole: user!.role,
                receiverId: selectedContact.id,
                receiverName: selectedContact.name,
                receiverRole: selectedContact.role,
                content: "Pièce jointe",
                attachmentUrl: fileUrl
            });
        } catch {
            toast.error("Erreur de téléchargement");
        } finally {
            setIsUploading(false);
            if (e.target) {
                e.target.value = "";
            }
        }
    };

    if (loadingContacts) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-160px)] flex md:gap-3 overflow-hidden p-3 bg-white">
            {/* Liste contacts */}
            <div className={`w-full md:w-72 border border-slate-200 bg-white overflow-hidden shrink-0 ${selectedContact ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 space-y-2">
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Messagerie</h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border border-slate-200 pl-9 pr-3 py-1.5 text-[11px] font-bold text-[#0D2D5A] outline-none focus:border-[#1A6CC8] transition-all"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="divide-y divide-slate-100">
                        {filteredContacts.length === 0 ? (
                            <div className="py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                Aucun contact
                            </div>
                        ) : (
                            filteredContacts.map((contact: any) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full px-3 py-2.5 flex items-center gap-3 transition-all text-left ${
                                        selectedContact?.id === contact.id
                                            ? "bg-[#1A6CC8] text-white"
                                            : "hover:bg-slate-50/50 text-[#0D2D5A]"
                                    }`}
                                >
                                    <div className={`w-8 h-8 flex items-center justify-center font-black text-[11px] shrink-0 ${
                                        selectedContact?.id === contact.id
                                            ? "bg-white/20 text-white"
                                            : "bg-[#0D2D5A] text-white"
                                    }`}>
                                        {contact.name?.charAt(0)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-[11px] uppercase tracking-tight truncate">{contact.name}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest truncate ${
                                            selectedContact?.id === contact.id ? "text-blue-100" : "text-slate-400"
                                        }`}>
                                            {contact.role || "Élève"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Zone de chat */}
            <div className={`border border-slate-200 bg-white overflow-hidden ${selectedContact ? 'flex flex-col flex-1' : 'hidden md:flex md:flex-col md:flex-1'}`}>
                {selectedContact ? (
                    <>
                        <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                            <div className="flex items-center gap-2 md:gap-3">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="md:hidden w-7 h-7 text-slate-400 shrink-0"
                                    onClick={() => setSelectedContact(null)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </Button>
                                <div className="w-8 h-8 bg-[#0D2D5A] text-white flex items-center justify-center font-black text-[11px] shrink-0">
                                    {selectedContact.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-black text-[#0D2D5A] text-[11px] uppercase tracking-tight">
                                        {selectedContact.name}
                                    </h3>
                                    <p className="text-[9px] text-[#1A6CC8] uppercase tracking-widest font-black">Discussion Active</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-300 hover:text-[#1A6CC8]">
                                    <Phone className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-300 hover:text-[#1A6CC8]">
                                    <Video className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="w-7 h-7 text-slate-300 hover:text-[#1A6CC8]">
                                    <Info className="w-3.5 h-3.5" />
                                </Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-3">
                            <div className="space-y-3">
                                {loadingMessages ? (
                                    <div className="flex justify-center py-4">
                                        <Loader2 className="animate-spin text-[#1A6CC8]/30 w-6 h-6" />
                                    </div>
                                ) : (
                                    messages.map((m: any) => {
                                        const isMe = m.senderId === user?.id;
                                        return (
                                            <div key={m.id} className={`flex gap-2 max-w-[80%] ${isMe ? "flex-row-reverse ml-auto" : ""}`}>
                                                <div className={`w-6 h-6 flex items-center justify-center text-[9px] font-black shrink-0 ${
                                                    isMe ? "bg-[#1A6CC8] text-white" : "bg-slate-100 text-slate-400"
                                                }`}>
                                                    {(isMe ? user?.name : selectedContact.name)?.charAt(0)}
                                                </div>
                                                <div className={`space-y-0.5 ${isMe ? "items-end" : ""}`}>
                                                    <div className={`px-3 py-2 text-[11px] font-bold ${
                                                        isMe
                                                            ? "bg-[#1A6CC8] text-white"
                                                            : "bg-slate-50 border border-slate-100 text-[#0D2D5A]"
                                                    }`}>
                                                        {m.content}
                                                        {m.attachmentUrl && (
                                                            <div className="mt-2 rounded-lg overflow-hidden border border-black/10 bg-black/5 p-2 flex flex-col gap-2">
                                                                {/\.(jpg|jpeg|png|gif|webp)$/i.test(m.attachmentUrl) ? (
                                                                    <img 
                                                                        src={getFullAttachmentUrl(m.attachmentUrl)} 
                                                                        alt="Pièce jointe" 
                                                                        className="max-w-full h-auto max-h-[150px] rounded object-cover" 
                                                                    />
                                                                ) : null}
                                                                <a 
                                                                    href={getFullAttachmentUrl(m.attachmentUrl)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-1.5 text-[9px] font-black uppercase hover:underline bg-white/20 hover:bg-white/30 text-current p-1.5 rounded transition-all w-fit"
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
                        </ScrollArea>

                        <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex items-center gap-2">
                            <div className="flex-1 flex items-center gap-2 bg-slate-50/50 border border-slate-200 px-3 py-1.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="w-6 h-6 text-slate-400 hover:text-[#1A6CC8] shrink-0"
                                    disabled={isUploading}
                                    onClick={() => document.getElementById('chat-file')?.click()}
                                >
                                    {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Paperclip className="w-3.5 h-3.5" />}
                                    <input type="file" id="chat-file" className="hidden" onChange={handleFileUpload} />
                                </Button>
                                <input
                                    type="text"
                                    placeholder="Écrire un message..."
                                    className="flex-1 bg-transparent border-none outline-none text-[11px] font-bold text-[#0D2D5A] py-1"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                            </div>
                            <Button
                                type="submit"
                                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] rounded-none shadow-none h-8 px-4 font-black text-[10px] uppercase gap-2"
                            >
                                <Send className="w-3.5 h-3.5" /> Envoyer
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 text-center space-y-3">
                        <div className="w-14 h-14 bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-200">
                            <MessageCircle className="w-7 h-7" />
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Messagerie</h3>
                            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest max-w-[180px] mx-auto mt-1">
                                Sélectionnez une discussion pour commencer.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
