import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, BarChart2, BookOpen, MessageCircle } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import StudentDashboard from "./Dashboard";
import StudentSchedule from "./Schedule";
import StudentGrades from "./Grades";
import StudentHomework from "./Homework";
import StudentMessages from "./Messages";
import StudentCourses from "./Courses";

const NAV = [
    { to: "/student", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/student/schedule", label: "Mon planning", icon: CalendarDays },
    { to: "/student/grades", label: "Mes notes", icon: BarChart2 },
    { to: "/student/courses", label: "Cours & Quiz", icon: BookOpen },
    { to: "/student/homework", label: "Mes devoirs", icon: BookOpen },
    { to: "/student/messages", label: "Messages", icon: MessageCircle },
];

export default function StudentLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Espace Élève" roleColor="#22c55e" />
            <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="schedule" element={<StudentSchedule />} />
                    <Route path="grades" element={<StudentGrades />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="homework" element={<StudentHomework />} />
                    <Route path="messages" element={<StudentMessages />} />
                    <Route path="*" element={<Navigate to="/student" replace />} />
                </Routes>
            </main>
        </div>
    );
}
