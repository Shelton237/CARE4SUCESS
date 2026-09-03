import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    MessageCircle,
    Search,
    Send,
    Paperclip,
    MoreVertical,
    CheckCheck,
    Phone,
    Video,
    Info,
    SearchX,
    FolderOpen,
    Loader2,
    ShieldCheck
} from "lucide-react";
import { fetchParentContacts, fetchMessages, sendMessage, uploadMessageAttachment, markMessageAsRead } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

const getFullAttachmentUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const rootUrl = (import.meta.env.VITE_API_URL || "").replace(/\/api\/?$/, "");
    return `${rootUrl}${url}`;
};

export default function ParentMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // DYNAMIQUE : Contacts réels (Enseignants et Conseillers)
    const { data: contacts = [], isLoading: loadingContacts } = useQuery({
        queryKey: ["parentContacts", user?.id],
        queryFn: () => fetchParentContacts(user!.id),
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (!selectedContact && contacts.length > 0) {
            setSelectedContact(contacts[0]);
        }
    }, [contacts, selectedContact]);

    // DYNAMIQUE : Messages réels pour la conversation sélectionnée
    const { data: messages = [], isLoading: loadingMessages } = useQuery({
        queryKey: ["messages", user?.id, selectedContact?.id],
        queryFn: () => fetchMessages(user!.id, selectedContact!.id),
        enabled: Boolean(user?.id && selectedContact?.id),
        refetchInterval: 3000,
    });

    const threadMessages = useMemo(() => {
        if (!selectedContact || !user) return [];
        return messages.filter((m: any) =>
            (m.senderId === user.id && m.receiverId === selectedContact.id) ||
            (m.receiverId === user.id && m.senderId === selectedContact.id)
        );
    }, [messages, selectedContact, user]);

    const sendMutation = useMutation({
        mutationFn: sendMessage,
        onSuccess: () => {
            setNewMessage("");
            queryClient.invalidateQueries({ queryKey: ["messages", user?.id, selectedContact?.id] });
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
            messages.forEach((m: any) => {
                if (m.receiverId === user?.id && !m.isRead) {
                    markAsReadMutation.mutate(m.id);
                }
            });
        }
    }, [messages, selectedContact, user?.id]);

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
        } catch (err) {
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
            <div className="flex items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-100px)] w-full bg-white font-sans text-[#0D2D5A] overflow-hidden">
            {/* Slim Header Integration */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Centre de Messages 
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Communication directe avec l'équipe pédagogique
                    </p>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Contact List - High Density */}
                <div className={`w-full md:w-80 md:w-96 border-r border-slate-100 bg-slate-50/10 shrink-0 capitalize overflow-hidden ${selectedContact ? 'hidden md:flex md:flex-col' : 'flex flex-col'}`}>
                    <div className="p-4 border-b border-slate-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 w-3.5 h-3.5" />
                            <input
                                type="text"
                                placeholder="RECHERCHER UN CONTACT..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white border border-slate-100 rounded-none pl-9 pr-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#1A6CC8] transition-colors"
                            />
                        </div>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="divide-y divide-slate-50">
                            {filteredContacts.length === 0 ? (
                                <div className="py-20 text-center space-y-2">
                                    <SearchX className="w-8 h-8 text-slate-200 mx-auto" />
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucun contact trouvé</p>
                                </div>
                            ) : (
                                filteredContacts.map((contact: any) => (
                                    <button
                                        key={contact.id}
                                        onClick={() => setSelectedContact(contact)}
                                        className={`w-full p-4 flex items-center gap-4 transition-all hover:bg-slate-50 relative ${selectedContact?.id === contact.id ? "bg-slate-100" : ""}`}
                                    >
                                        {selectedContact?.id === contact.id && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1A6CC8]" />
                                        )}
                                        <div className="w-12 h-12 bg-[#0D2D5A] text-white flex items-center justify-center font-black text-sm shrink-0">
                                            {contact.name?.charAt(0)}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <h3 className="text-xs font-black text-[#0D2D5A] uppercase truncate">{contact.name}</h3>
                                            <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 mt-1 rounded-none border-slate-200 text-slate-400 bg-white">
                                                {contact.role === 'teacher' ? 'ENSEIGNANT' : 'CONSEILLER'}
                                            </Badge>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Chat Area - Eureka Aesthetic */}
                <div className={`bg-white overflow-hidden relative ${selectedContact ? 'flex flex-col flex-1' : 'hidden md:flex md:flex-col md:flex-1'}`}>
                    {selectedContact ? (
                        <>
                            {/* Chat Header */}
                            <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between bg-white z-10">
                                <div className="flex items-center gap-4">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="md:hidden w-7 h-7 text-slate-400 shrink-0 mr-1"
                                        onClick={() => setSelectedContact(null)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    </Button>
                                    <div className="w-10 h-10 bg-[#1A6CC8] text-white flex items-center justify-center font-black text-sm">
                                        {selectedContact.name?.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-black text-[#0D2D5A] uppercase">{selectedContact.name}</h3>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic font-bold">Connecté</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="text-slate-300 h-8 w-8 hover:text-[#0D2D5A]"><Phone className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-slate-300 h-8 w-8 hover:text-[#0D2D5A]"><Video className="w-4 h-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-slate-300 h-8 w-8 hover:text-[#0D2D5A]"><Info className="w-4 h-4" /></Button>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <ScrollArea className="flex-1 p-4 md:p-6 bg-slate-50/30">
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {loadingMessages ? (
                                        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-slate-200" /></div>
                                    ) : threadMessages.length === 0 ? (
                                        <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px]">Aucun message dans cette conversation. Écrivez votre premier message !</div>
                                    ) : (
                                        threadMessages.map((m: any) => {
                                            const isMe = m.senderId === user?.id;
                                            return (
                                                <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                                                    <div className={`max-w-[85%] p-4 border ${isMe ? "bg-[#0D2D5A] text-white border-[#0D2D5A]" : "bg-white text-[#0D2D5A] border-slate-100"}`}>
                                                        <p className="text-sm font-medium leading-relaxed">{m.content}</p>
                                                        {m.attachmentUrl && (
                                                            <div className="mt-3 p-3 bg-black/5 flex flex-col gap-3 border border-dashed border-white/20">
                                                                {/\.(jpg|jpeg|png|gif|webp)$/i.test(m.attachmentUrl) ? (
                                                                    <img 
                                                                        src={getFullAttachmentUrl(m.attachmentUrl)} 
                                                                        alt="Pièce jointe" 
                                                                        className="max-w-full h-auto max-h-[150px] object-cover" 
                                                                    />
                                                                ) : null}
                                                                <a 
                                                                    href={getFullAttachmentUrl(m.attachmentUrl)} 
                                                                    target="_blank" 
                                                                    rel="noopener noreferrer"
                                                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:underline w-fit"
                                                                >
                                                                    <FolderOpen className="w-4 h-4" />
                                                                    Ouvrir le document
                                                                </a>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">
                                                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </ScrollArea>

                            {/* Input Area */}
                            <form onSubmit={handleSend} className="p-4 border-t border-slate-100 bg-white">
                                <div className="flex items-center gap-2 max-w-4xl mx-auto">
                                    <Button 
                                        type="button"
                                        variant="outline" 
                                        size="icon" 
                                        className="h-10 w-10 border-slate-100 rounded-none shrink-0"
                                        disabled={isUploading}
                                        onClick={() => document.getElementById('chat-file-parent')?.click()}
                                    >
                                        {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Paperclip className="w-4 h-4 text-slate-400" />}
                                        <input type="file" id="chat-file-parent" className="hidden" onChange={handleFileUpload} />
                                    </Button>
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="ÉCRIRE VOTRE MESSAGE ICI..."
                                            className="w-full bg-slate-50 border border-slate-100 rounded-none px-4 py-2.5 text-[10px] font-black uppercase tracking-widest outline-none focus:bg-white transition-all"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                    </div>
                                    <Button type="submit" className="bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white rounded-none h-10 px-6 font-black text-[10px] uppercase tracking-widest shrink-0">
                                        ENVOYER <Send className="ml-2 w-3.5 h-3.5" />
                                    </Button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6">
                            <div className="w-20 h-20 bg-slate-50 flex items-center justify-center text-slate-200">
                                <MessageCircle className="w-10 h-10" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-sm font-black text-[#0D2D5A] uppercase tracking-widest">Messagerie Directe</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest max-w-xs mx-auto">Sélectionnez un enseignant ou un conseiller pour démarrer une discussion.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
