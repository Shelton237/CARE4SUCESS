import { Routes, Route, Navigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import TeacherDashboard from "./Dashboard";
import TeacherSchedule from "./Schedule";
import TeacherStudents from "./Students";
import TeacherEarnings from "./Earnings";
import TeacherCourses from "./Courses";
import TeacherMessages from "./Messages";
import TeacherHomework from "./Homework";
import { ClipboardList, LayoutDashboard, CalendarDays, Users, Banknote, BookOpen, MessageCircle } from "lucide-react";

const NAV = [
    { to: "/teacher", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/teacher/schedule", label: "Mon planning", icon: CalendarDays },
    { to: "/teacher/students", label: "Mes élèves", icon: Users },
    { to: "/teacher/homework", label: "Devoirs", icon: ClipboardList },
    { to: "/teacher/courses", label: "Cours & Quiz", icon: BookOpen },
    { to: "/teacher/messages", label: "Messages", icon: MessageCircle },
    { to: "/teacher/earnings", label: "Mes revenus", icon: Banknote },
];

export default function TeacherLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Enseignant" roleColor="#1A6CC8" />
            <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="schedule" element={<TeacherSchedule />} />
                    <Route path="students" element={<TeacherStudents />} />
                    <Route path="homework" element={<TeacherHomework />} />
                    <Route path="courses" element={<TeacherCourses />} />
                    <Route path="messages" element={<TeacherMessages />} />
                    <Route path="earnings" element={<TeacherEarnings />} />
                    <Route path="*" element={<Navigate to="/teacher" replace />} />
                </Routes>
            </main>
        </div>
    );
}
