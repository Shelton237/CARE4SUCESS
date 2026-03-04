import { useState } from "react";
import { studentMessages } from "@/data/mock";
import { useAuth } from "@/contexts/AuthContext";
import { Send, MessageCircle } from "lucide-react";

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

export default function StudentMessages() {
    const { user } = useAuth();
    const [reply, setReply] = useState("");
    const [messages, setMessages] = useState(studentMessages);

    const handleSend = () => {
        if (!reply.trim()) return;
        setMessages((prev) => [
            ...prev,
            {
                id: `m${prev.length + 1}`,
                from: user?.name ?? "Koffi Diallo",
                fromRole: "student",
                avatar: user?.avatar ?? "KD",
                date: "04/03/2026",
                time: "Maintenant",
                text: reply.trim(),
                read: true,
            },
        ]);
        setReply("");
    };

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Messages</h1>
                <p className="text-gray-500 text-sm mt-1">
                    Échangez avec votre enseignant et votre conseiller
                </p>
            </div>

            {/* Conversations */}
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Sidebar conversations */}
                <div className="space-y-2">
                    {[
                        { name: "Dr. Clémentine Abanda", role: "Enseignant", avatar: "CA", color: "#1A6CC8", unread: 0 },
                        { name: "Brice Owona", role: "Conseiller", avatar: "BO", color: "#a855f7", unread: 1 },
                    ].map((c, i) => (
                        <div
                            key={c.name}
                            className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${i === 0
                                    ? "border-[#1A6CC8]/20 bg-[#1A6CC8]/5 shadow-sm"
                                    : "border-gray-100 bg-white hover:bg-gray-50 hover:shadow-sm"
                                }`}
                        >
                            <div
                                className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                                style={{ background: c.color }}
                            >
                                {c.avatar}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#0D2D5A] text-sm truncate">{c.name}</div>
                                <div className="text-xs text-gray-400">{c.role}</div>
                            </div>
                            {c.unread > 0 && (
                                <div className="w-5 h-5 rounded-full bg-[#22c55e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                                    {c.unread}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Thread messages */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col" style={{ minHeight: "500px" }}>
                    {/* Header thread */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
                        <div className="w-9 h-9 rounded-full bg-[#1A6CC8] flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                            CA
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-sm">Dr. Clémentine Abanda</div>
                            <div className="text-xs text-gray-400">Enseignant · Mathématiques · 3e</div>
                        </div>
                        <div className="ml-auto flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                            <span className="text-xs text-gray-400">En ligne</span>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                        {messages
                            .filter((m) => m.fromRole !== "advisor")
                            .map((msg) => {
                                const isMe = msg.fromRole === "student";
                                const color = ROLE_COLOR[msg.fromRole] ?? "#6b7280";
                                return (
                                    <div key={msg.id} className={`flex items-end gap-3 ${isMe ? "flex-row-reverse" : ""}`}>
                                        {!isMe && (
                                            <div
                                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mb-0.5"
                                                style={{ background: color }}
                                            >
                                                {msg.avatar}
                                            </div>
                                        )}
                                        <div className={`max-w-[70%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                                            {!isMe && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold" style={{ color }}>{msg.from}</span>
                                                    <span className="text-xs text-gray-300">{ROLE_LABEL[msg.fromRole]}</span>
                                                </div>
                                            )}
                                            <div
                                                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isMe
                                                        ? "text-white rounded-br-sm"
                                                        : "bg-gray-50 text-gray-700 border border-gray-100 rounded-bl-sm"
                                                    }`}
                                                style={isMe ? { background: "#22c55e" } : {}}
                                            >
                                                {msg.text}
                                            </div>
                                            <div className="text-xs text-gray-300 px-1">{msg.time}</div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* Composer */}
                    <div className="px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#22c55e] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                                {user?.avatar ?? "KD"}
                            </div>
                            <div className="flex-1 relative">
                                <input
                                    type="text"
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                                    placeholder="Écrivez votre message…"
                                    className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#22c55e] focus:ring-2 focus:ring-[#22c55e]/20 outline-none text-sm text-gray-700 transition-all"
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!reply.trim()}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30"
                                    style={{ background: reply.trim() ? "#22c55e" : "transparent" }}
                                >
                                    <Send className={`w-4 h-4 ${reply.trim() ? "text-white" : "text-gray-300"}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Conseiller */}
            {messages.filter((m) => !m.read && m.fromRole === "advisor").length > 0 && (
                <div className="flex items-center justify-between gap-4 bg-[#a855f7]/5 border border-[#a855f7]/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#a855f7]/15 flex items-center justify-center">
                            <MessageCircle className="w-5 h-5 text-[#a855f7]" />
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-sm">Message non lu de votre conseiller pédagogique</div>
                            <div className="text-xs text-gray-500">Brice Owona · {messages.find((m) => m.fromRole === "advisor")?.date}</div>
                        </div>
                    </div>
                    <button className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-[#a855f7] hover:bg-[#9333ea] transition-colors shadow-sm whitespace-nowrap">
                        Voir le message
                    </button>
                </div>
            )}
        </div>
    );
}
