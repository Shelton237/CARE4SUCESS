import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bell, CheckCircle2, AlertCircle, Info, MessageSquare, ClipboardList, Search, Filter, Trash2 } from "lucide-react";
import { fetchNotifications, markNotificationAsRead } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, any> = {
    info: Info,
    message: MessageSquare,
    homework: ClipboardList,
    success: CheckCircle2,
    warning: AlertCircle,
};

const COLOR_MAP: Record<string, string> = {
    info: "text-blue-500 bg-blue-50 border-blue-100",
    message: "text-purple-500 bg-purple-50 border-purple-100",
    homework: "text-orange-500 bg-orange-50 border-orange-100",
    success: "text-green-500 bg-green-50 border-green-100",
    warning: "text-red-500 bg-red-50 border-red-100",
};

export default function Notifications() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState("");
    const [filter, setFilter] = useState<string>("all");

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: () => fetchNotifications(user?.id || ""),
        enabled: !!user?.id,
    });

    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const filteredNotifications = useMemo(() => {
        return notifications
            .filter(n => {
                const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                     n.content.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesFilter = filter === "all" || 
                                     (filter === "unread" && !n.isRead) ||
                                     (filter === "read" && n.isRead) ||
                                     n.type === filter;
                return matchesSearch && matchesFilter;
            })
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [notifications, searchTerm, filter]);

    const handleMarkAsRead = (id: string) => {
        markAsReadMutation.mutate(id);
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="min-h-screen bg-gray-50 pb-16" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <div className="max-w-5xl mx-auto px-4 lg:px-0">
                <div className="flex items-center gap-3 pt-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A6CC8] hover:text-[#0D2D5A]"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Retour
                    </button>
                    <span className="text-xs uppercase tracking-[3px] text-gray-400 font-black">
                        Centre de notifications
                    </span>
                </div>

                <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-[#0D2D5A]">Historique complet</h1>
                        <p className="text-gray-500 mt-1">Retrouvez toutes vos alertes et communications importantes.</p>
                    </div>
                    {unreadCount > 0 && (
                        <Badge className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg shadow-blue-200">
                            {unreadCount} non lues
                        </Badge>
                    )}
                </div>

                <div className="mt-10 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input 
                                placeholder="Rechercher une notification..." 
                                className="pl-10 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 min-w-fit overflow-x-auto pb-2 md:pb-0">
                            {[
                                { id: "all", label: "Tous" },
                                { id: "unread", label: "Non lues" },
                                { id: "info", label: "Infos" },
                                { id: "message", label: "Messages" },
                                { id: "homework", label: "Devoirs" },
                                { id: "success", label: "Réussites" }
                            ].map((f) => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                                        filter === f.id 
                                            ? "bg-[#0D2D5A] text-white border-transparent shadow-md" 
                                            : "bg-white text-gray-500 border-gray-100 hover:border-[#1A6CC8]/30"
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {isLoading ? (
                            <div className="py-20 text-center">
                                <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                                <p className="text-gray-400">Chargement de vos notifications...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300">
                                    <Bell className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-[#0D2D5A]">Aucune notification trouvée</p>
                                    <p className="text-gray-400 text-sm">Essayez de modifier vos filtres ou votre recherche.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 border rounded-2xl overflow-hidden border-gray-50">
                                {filteredNotifications.map((notif) => {
                                    const Icon = ICON_MAP[notif.type] || Info;
                                    const colors = COLOR_MAP[notif.type] || COLOR_MAP.info;

                                    return (
                                        <div 
                                            key={notif.id}
                                            className={`group p-6 flex flex-col sm:flex-row gap-5 transition-all hover:bg-gray-50/80 ${!notif.isRead ? "bg-blue-50/10" : "bg-white"}`}
                                        >
                                            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border ${colors} shadow-sm group-hover:scale-110 transition-transform`}>
                                                <Icon className="w-7 h-7" />
                                            </div>
                                            <div className="flex-1 space-y-2">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className={`text-lg font-bold leading-none ${!notif.isRead ? "text-[#0D2D5A]" : "text-gray-600"}`}>
                                                            {notif.title}
                                                        </h3>
                                                        {!notif.isRead && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-200" />}
                                                    </div>
                                                    <span className="text-xs font-medium text-gray-400 px-3 py-1 bg-white border border-gray-50 rounded-full">
                                                        {new Date(notif.createdAt).toLocaleDateString("fr-FR", { 
                                                            day: 'numeric', 
                                                            month: 'long', 
                                                            year: 'numeric',
                                                            hour: '2-digit', 
                                                            minute: '2-digit' 
                                                        })}
                                                    </span>
                                                </div>
                                                <p className={`text-sm leading-relaxed ${!notif.isRead ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                                                    {notif.content}
                                                </p>
                                                <div className="pt-4 flex items-center gap-3">
                                                    {!notif.isRead && (
                                                        <Button 
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleMarkAsRead(notif.id)}
                                                            className="h-8 text-xs font-bold border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            disabled={markAsReadMutation.isPending}
                                                        >
                                                            Marquer comme lu
                                                        </Button>
                                                    )}
                                                    {notif.link && (
                                                        <Button 
                                                            size="sm"
                                                            onClick={() => navigate(notif.link)}
                                                            className="h-8 text-xs font-bold bg-[#1A6CC8] hover:bg-[#0D2D5A] shadow-md shadow-blue-100 rounded-lg"
                                                        >
                                                            Voir les détails
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
