import { Routes, Route, Navigate } from "react-router-dom";
import {
    LayoutDashboard, UserPlus, CalendarDays, Users,
    Banknote, BookOpen, MessageCircle, Library, ClipboardList
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { fetchUnreadMessagesCount } from "@/api/backoffice";
import TutorDashboard from "./Dashboard";
import TutorTeacherApplications from "./TeacherApplications";
import TutorProfile from "./Profile";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import TeacherSchedule from "@/pages/teacher/Schedule";
import TeacherStudents from "@/pages/teacher/Students";
import TeacherEarnings from "@/pages/teacher/Earnings";
import TeacherCourses from "@/pages/teacher/Courses";
import TeacherMessages from "@/pages/teacher/Messages";
import TeacherHomework from "@/pages/teacher/Homework";
import TeacherResources from "@/pages/teacher/Resources";
import TeacherProfile from "@/pages/teacher/Profile";

const TUTOR_NAV = [
    { to: "/tutor", section: "Espace Tuteur", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/tutor/applications", label: "Candidatures profs", icon: UserPlus },
];

const TEACHER_NAV = [
    { to: "/tutor/enseignant", section: "Espace Enseignant", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/tutor/enseignant/schedule", label: "Mon planning", icon: CalendarDays },
    { to: "/tutor/enseignant/students", label: "Mes élèves", icon: Users },
    { to: "/tutor/enseignant/homework", label: "Devoirs", icon: ClipboardList },
    { to: "/tutor/enseignant/courses", label: "Cours & Quiz", icon: BookOpen },
    { to: "/tutor/enseignant/messages", label: "Messages", icon: MessageCircle },
    { to: "/tutor/enseignant/resources", label: "Ressources", icon: Library },
    { to: "/tutor/enseignant/earnings", label: "Mes revenus", icon: Banknote },
];

export default function TutorLayout() {
    const { user } = useAuth();
    const isAlsoTeacher = user?.secondaryRole === "teacher";

    const unreadQuery = useQuery({
        queryKey: ["unreadCount", user?.id],
        queryFn: () => fetchUnreadMessagesCount(user!.id),
        enabled: !!user?.id && isAlsoTeacher,
        refetchInterval: 10000,
    });
    const unreadCount = unreadQuery.data?.count || 0;

    const teacherNavWithBadge = TEACHER_NAV.map(item =>
        item.to === "/tutor/enseignant/messages"
            ? { ...item, badgeCount: unreadCount }
            : item
    );

    const navItems = isAlsoTeacher
        ? [...TUTOR_NAV, ...teacherNavWithBadge]
        : TUTOR_NAV;

    return (
        <div className="min-h-screen bg-white flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar
                items={navItems}
                roleLabel={isAlsoTeacher ? "Tuteur-Enseignant" : "Tuteur Pédagogique"}
                roleColor="#1A6CC8"
            />
            <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<TutorDashboard />} />
                    <Route path="applications" element={<TutorTeacherApplications />} />
                    <Route path="profile" element={<TutorProfile />} />
                    {isAlsoTeacher && (
                        <>
                            <Route path="enseignant" element={<TeacherDashboard />} />
                            <Route path="enseignant/schedule" element={<TeacherSchedule />} />
                            <Route path="enseignant/students" element={<TeacherStudents />} />
                            <Route path="enseignant/homework" element={<TeacherHomework />} />
                            <Route path="enseignant/courses" element={<TeacherCourses />} />
                            <Route path="enseignant/courses/:id" element={<TeacherCourses />} />
                            <Route path="enseignant/courses/new" element={<TeacherCourses />} />
                            <Route path="enseignant/messages" element={<TeacherMessages />} />
                            <Route path="enseignant/resources" element={<TeacherResources />} />
                            <Route path="enseignant/earnings" element={<TeacherEarnings />} />
                            <Route path="enseignant/profile" element={<TeacherProfile />} />
                        </>
                    )}
                    <Route path="*" element={<Navigate to="/tutor" replace />} />
                </Routes>
            </main>
        </div>
    );
}
