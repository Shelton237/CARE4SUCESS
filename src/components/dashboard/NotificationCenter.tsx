import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, MessageSquare, ClipboardList, CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { fetchNotifications, markNotificationAsRead } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";

const ICON_MAP: Record<string, any> = {
    info: Info,
    message: MessageSquare,
    homework: ClipboardList,
    success: CheckCircle2,
    warning: AlertCircle,
};

const COLOR_MAP: Record<string, string> = {
    info: "text-blue-500 bg-blue-50",
    message: "text-purple-500 bg-purple-50",
    homework: "text-orange-500 bg-orange-50",
    success: "text-green-500 bg-green-50",
    warning: "text-red-500 bg-red-50",
};

export function NotificationCenter() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);

    const { data: notifications = [] } = useQuery({
        queryKey: ["notifications", user?.id],
        queryFn: () => fetchNotifications(user?.id || ""),
        enabled: !!user?.id,
        refetchInterval: 30000, // Polling every 30s
    });

    const markAsReadMutation = useMutation({
        mutationFn: markNotificationAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["notifications"] });
        }
    });

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleNotificationClick = (notif: any) => {
        if (!notif.isRead) {
            markAsReadMutation.mutate(notif.id);
        }
        if (notif.link) {
            navigate(notif.link);
        }
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative group rounded-full hover:bg-gray-100 transition-all">
                    <Bell className="w-5 h-5 text-gray-500 group-hover:text-[#1A6CC8] transition-colors" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white border-2 border-white animate-in zoom-in duration-300">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-gray-100 overflow-hidden" align="end">
                <div className="p-4 border-b border-gray-50 bg-white sticky top-0 z-10 flex items-center justify-between">
                    <h3 className="font-bold text-[#0D2D5A] lowercase first-letter:uppercase">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                            {unreadCount} nouvelles
                        </span>
                    )}
                </div>

                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                <Bell className="w-6 h-6" />
                            </div>
                            <p className="text-sm text-gray-400 font-medium">Aucune notification pour le moment.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((notif) => {
                                const Icon = ICON_MAP[notif.type] || Info;
                                const colors = COLOR_MAP[notif.type] || COLOR_MAP.info;

                                return (
                                    <button
                                        key={notif.id}
                                        onClick={() => handleNotificationClick(notif)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors flex gap-4 ${!notif.isRead ? "bg-blue-50/20" : ""}`}
                                    >
                                        <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center ${colors}`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={`text-sm font-bold truncate ${!notif.isRead ? "text-[#0D2D5A]" : "text-gray-500"}`}>
                                                    {notif.title}
                                                </p>
                                                {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                                                {notif.content}
                                            </p>
                                            <div className="flex items-center justify-between pt-1">
                                                <span className="text-[10px] font-medium text-gray-400">
                                                    {new Date(notif.createdAt).toLocaleDateString("fr-FR", { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                {notif.link && (
                                                    <ExternalLink className="w-3 h-3 text-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {notifications.length > 0 && (
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100 text-center">
                        <Button variant="ghost" className="text-[10px] font-bold text-gray-400 uppercase tracking-widest h-auto p-1 hover:bg-transparent hover:text-blue-500 transition-colors">
                            Voir tout l'historique
                        </Button>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}
