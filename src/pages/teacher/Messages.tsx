import { useState, useMemo } from "react";
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
    Loader2
} from "lucide-react";
import { fetchTeacherContacts, fetchMessages, sendMessage, uploadMessageAttachment } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

export default function TeacherMessages() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [selectedContact, setSelectedContact] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [newMessage, setNewMessage] = useState("");
    const [isUploading, setIsUploading] = useState(false);

    // DYNAMIQUE : Contacts réels
    const { data: contacts = [], isLoading: loadingContacts } = useQuery({
        queryKey: ["teacherContacts", user?.id],
        queryFn: () => fetchTeacherContacts(user!.id),
        enabled: !!user?.id,
    });

    // DYNAMIQUE : Messages réels
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

    const filteredContacts = contacts.filter((c: any) =>
        c.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;
        
        sendMutation.mutate({
            senderId: user!.id,
            receiverId: selectedContact.id,
            content: newMessage,
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedContact) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);
        
        try {
            const { fileUrl } = await uploadMessageAttachment(formData);
            sendMutation.mutate({
                senderId: user!.id,
                receiverId: selectedContact.id,
                content: "Pièce jointe",
                attachmentUrl: fileUrl
            });
        } catch (err) {
            toast.error("Erreur de téléchargement");
        } finally {
            setIsUploading(false);
        }
    };

    if (loadingContacts) {
        return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#1A6CC8]" /></div>;
    }

    return (
        <div className="h-[calc(100vh-160px)] flex gap-6 animate-in fade-in duration-500 font-bold overflow-hidden">
            {/* Contact List - Soft & Pro */}
            <div className="w-80 md:w-96 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden shrink-0">
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-bold text-[#0D2D5A]">Messagerie</h2>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-50 rounded-xl pl-10 pr-4 py-3 text-sm font-medium border-none focus:ring-2 focus:ring-blue-100 outline-none"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4 pb-4">
                    <div className="space-y-2">
                        {filteredContacts.length === 0 ? (
                            <div className="py-10 text-center text-gray-300 text-xs italic font-bold">Aucun contact</div>
                        ) : (
                            filteredContacts.map((contact: any) => (
                                <button
                                    key={contact.id}
                                    onClick={() => setSelectedContact(contact)}
                                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all ${selectedContact?.id === contact.id ? "bg-blue-600 text-white shadow-md" : "hover:bg-gray-50 text-[#0D2D5A]"}`}
                                >
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg ${selectedContact?.id === contact.id ? "bg-white/20" : "bg-blue-50 text-[#1A6CC8]"}`}>
                                            {contact.name?.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-sm truncate">{contact.name}</p>
                                        </div>
                                        <p className={`text-[10px] uppercase font-bold tracking-widest truncate ${selectedContact?.id === contact.id ? "text-blue-100" : "text-gray-400"}`}>
                                            {contact.role || "Elève"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Chat Area - Soft & Pro Dynamique */}
            <div className="flex-1 bg-white rounded-[2rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                {selectedContact ? (
                    <>
                        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A6CC8] flex items-center justify-center font-bold">
                                    {selectedContact.name?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-[#0D2D5A]">{selectedContact.name}</h3>
                                    <p className="text-[10px] text-[#1A6CC8] uppercase tracking-[2px] font-bold">Discussion Active</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className="text-gray-300"><Phone className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-gray-300"><Video className="w-5 h-5" /></Button>
                                <Button variant="ghost" size="icon" className="text-gray-300"><Info className="w-5 h-5" /></Button>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 p-8">
                            <div className="space-y-6">
                                {loadingMessages ? (
                                    <div className="flex justify-center"><Loader2 className="animate-spin text-blue-100" /></div>
                                ) : (
                                    messages.map((m: any) => {
                                        const isMe = m.senderId === user?.id;
                                        return (
                                            <div key={m.id} className={`flex gap-4 max-w-[80%] ${isMe ? "flex-row-reverse ml-auto" : ""}`}>
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${isMe ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                                                    {(isMe ? user?.name : selectedContact.name)?.charAt(0)}
                                                </div>
                                                <div className={`space-y-1 ${isMe ? "items-end" : ""}`}>
                                                    <div className={`p-4 rounded-2xl text-sm font-medium ${isMe ? "bg-blue-600 text-white rounded-tr-none" : "bg-gray-50 text-[#0D2D5A] rounded-tl-none"}`}>
                                                        {m.content}
                                                        {m.attachmentUrl && (
                                                            <div className="mt-2 p-2 bg-black/5 rounded-lg flex items-center gap-2 text-[10px]">
                                                                <FolderOpen className="w-3 h-3" /> Fichier joint
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </ScrollArea>

                        <form onSubmit={handleSend} className="p-6 border-t border-gray-50 flex items-center gap-4">
                            <div className="flex-1 flex items-center gap-3 bg-gray-50 rounded-2xl p-2 px-4 border border-gray-100">
                                <Button 
                                    type="button"
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-gray-400 hover:text-[#1A6CC8]"
                                    disabled={isUploading}
                                    onClick={() => document.getElementById('chat-file')?.click()}
                                >
                                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                                    <input type="file" id="chat-file" className="hidden" onChange={handleFileUpload} />
                                </Button>
                                <input
                                    type="text"
                                    placeholder="Écrire un message..."
                                    className="flex-1 bg-transparent border-none outline-none text-sm font-medium py-2"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                <Button type="submit" className="bg-[#1A6CC8] hover:bg-[#0D2D5A] rounded-xl px-6 font-bold h-10 shadow-sm">
                                    Envoyer <Send className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4">
                        <div className="w-20 h-20 rounded-[2.5rem] bg-gray-50 flex items-center justify-center text-gray-200">
                            <MessageCircle className="w-10 h-10" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#0D2D5A]">Messagerie</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest max-w-xs mx-auto">Sélectionnez une discussion.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function FolderOpen({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </svg>
    );
}
