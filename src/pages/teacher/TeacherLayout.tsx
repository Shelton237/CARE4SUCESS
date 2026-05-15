import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessagesCount } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import TeacherDashboard from "./Dashboard";
import TeacherSchedule from "./Schedule";
import TeacherStudents from "./Students";
import TeacherEarnings from "./Earnings";
import TeacherCourses from "./Courses";
import TeacherMessages from "./Messages";
import TeacherHomework from "./Homework";
import TeacherResources from "./Resources";
import { ClipboardList, LayoutDashboard, CalendarDays, Users, Banknote, BookOpen, MessageCircle, Library } from "lucide-react";

export default function TeacherLayout() {
    const { user } = useAuth();

    const unreadQuery = useQuery({
        queryKey: ["unreadCount", user?.id],
        queryFn: () => fetchUnreadMessagesCount(user!.id),
        enabled: !!user?.id,
        refetchInterval: 10000,
    });

    const unreadCount = unreadQuery.data?.count || 0;

    const navItems = [
        { to: "/teacher", label: "Tableau de bord", icon: LayoutDashboard },
        { to: "/teacher/schedule", label: "Mon planning", icon: CalendarDays },
        { to: "/teacher/students", label: "Mes élèves", icon: Users },
        { to: "/teacher/homework", label: "Devoirs", icon: ClipboardList },
        { to: "/teacher/courses", label: "Cours & Quiz", icon: BookOpen },
        { to: "/teacher/messages", label: "Messages", icon: MessageCircle, badgeCount: unreadCount },
        { to: "/teacher/resources", label: "Ressources", icon: Library },
        { to: "/teacher/earnings", label: "Mes revenus", icon: Banknote },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={navItems} roleLabel="Enseignant" roleColor="#1A6CC8" />
            <main className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full">
                <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="schedule" element={<TeacherSchedule />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="homework" element={<TeacherHomework />} />
                    <Route path="courses" element={<TeacherCourses />} />
                    <Route path="courses/:id" element={<TeacherCourses />} />
                    <Route path="messages" element={<TeacherMessages />} />
                    <Route path="resources" element={<TeacherResources />} />
                    <Route path="earnings" element={<TeacherEarnings />} />
                    <Route path="*" element={<Navigate to="/teacher" replace />} />
                </Routes>
            </main>
        </div>
    );
}
