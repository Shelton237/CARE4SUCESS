import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, TrendingUp, Receipt, Star, ClipboardList, Users, GraduationCap, MessageSquare } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessagesCount } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import ParentDashboard from "./Dashboard";
import ParentSchedule from "./Schedule";
import ParentProgress from "./Progress";
import ParentInvoices from "./Invoices";
import ParentFeedback from "./Feedback";
import ParentHomework from "./Homework";
import ParentChildren from "./Children";
import ParentTeam from "./Team";
import ParentMessages from "./Messages";
import ChildCockpit from "./ChildCockpit";
import AcademicFile from "../common/AcademicFile";

export default function ParentLayout() {
    const { user } = useAuth();

    const unreadQuery = useQuery({
        queryKey: ["unreadCount", user?.id],
        queryFn: () => fetchUnreadMessagesCount(user!.id),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    const unreadCount = unreadQuery.data?.count || 0;

    const navItems = [
        { to: "/parent", label: "Tableau de bord", icon: LayoutDashboard },
        { to: "/parent/children", label: "Mes Enfants", icon: Users },
        { to: "/parent/team", label: "Équipe Pédagogique", icon: GraduationCap },
        { to: "/parent/schedule", label: "Planning", icon: CalendarDays },
        { to: "/parent/homework", label: "Devoirs", icon: ClipboardList },
        { to: "/parent/progress", label: "Progression", icon: TrendingUp },
        { to: "/parent/academic-file", label: "Dossier Académique", icon: TrendingUp },
        { to: "/parent/invoices", label: "Factures", icon: Receipt },
        { to: "/parent/feedback", label: "Avis profs", icon: Star },
        { to: "/parent/messages", label: "Messages", icon: MessageSquare, badgeCount: unreadCount },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={navItems} roleLabel="Parent" roleColor="#22c55e" />
            <main className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full">
                <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="children" element={<ParentChildren />} />
                    <Route path="children/:id" element={<ChildCockpit />} />
                    <Route path="team" element={<ParentTeam />} />
                    <Route path="schedule" element={<ParentSchedule />} />
                    <Route path="homework" element={<ParentHomework />} />
                    <Route path="progress" element={<ParentProgress />} />
                    <Route path="academic-file" element={<AcademicFile studentId="" />} />
                    <Route path="invoices" element={<ParentInvoices />} />
                    <Route path="feedback" element={<ParentFeedback />} />
                    <Route path="messages" element={<ParentMessages />} />
                    <Route path="*" element={<Navigate to="/parent" replace />} />
                </Routes>
            </main>
        </div>
    );
}
