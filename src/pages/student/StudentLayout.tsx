import { Routes, Route, Navigate } from "react-router-dom";
import {
    LayoutDashboard,
    CalendarDays,
    BookOpen,
    ClipboardList,
    GraduationCap,
    MessageSquare,
    TrendingUp,
    History,
    FileQuestion,
    Library
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import StudentDashboard from "./Dashboard";
import StudentSchedule from "./Schedule";
import StudentTeachers from "./Teachers";
import StudentHomework from "./Homework";
import StudentQuizzes from "./Quizzes";
import StudentProgress from "./Progress";
import StudentCourses from "./Courses";
import StudentMessages from "./Messages";
import StudentHistory from "./History";
import StudentResources from "./Resources";

const NAV = [
    { to: "/student", label: "Dashboard", icon: LayoutDashboard },
    { to: "/student/schedule", label: "Mon Planning", icon: CalendarDays },
    { to: "/student/teachers", label: "Mes Professeurs", icon: GraduationCap },
    { to: "/student/messages", label: "Mes Messages", icon: MessageSquare },
    { to: "/student/homework", label: "Mes Devoirs", icon: ClipboardList },
    { to: "/student/quizzes", label: "Tests & Quiz", icon: FileQuestion },
    { to: "/student/courses", label: "Mes Cours", icon: BookOpen },
    { to: "/student/progress", label: "Mes Notes", icon: TrendingUp },
    { to: "/student/history", label: "Historique Cours", icon: History },
    { to: "/student/resources", label: "Bibliothèque", icon: Library },
];

export default function StudentLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Élève" roleColor="#1A6CC8" />
            <main className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full">
                <Routes>
                    <Route index element={<StudentDashboard />} />
                    <Route path="schedule" element={<StudentSchedule />} />
                    <Route path="teachers" element={<StudentTeachers />} />
                    <Route path="homework" element={<StudentHomework />} />
                    <Route path="quizzes" element={<StudentQuizzes />} />
                    <Route path="courses" element={<StudentCourses />} />
                    <Route path="progress" element={<StudentProgress />} />
                    <Route path="messages" element={<StudentMessages />} />
                    <Route path="history" element={<StudentHistory />} />
                    <Route path="resources" element={<StudentResources />} />
                    <Route path="*" element={<Navigate to="/student" replace />} />
                </Routes>
            </main>
        </div>
    );
}
