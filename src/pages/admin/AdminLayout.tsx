import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, Settings, UserPlus, BookOpen, UserCog, Wallet } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import AdminDashboard from "./Dashboard";
import AdminTeachers from "./Teachers";
import AdminStudents from "./Students";
import AdminRequests from "./Requests";
import AdminSettings from "./Settings";
import AdminTeacherApplications from "./TeacherApplications";
import AdminCourses from "./Courses";
import AdminFinance from "./Finance";
import ProfileManager from "./ProfileManager";

const NAV = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/teachers", label: "Enseignants", icon: GraduationCap },
    { to: "/admin/courses", label: "Cours & Quiz", icon: BookOpen },
    { to: "/admin/applications", label: "Candidatures profs", icon: UserPlus },
    { to: "/admin/students", label: "Élèves & Familles", icon: Users },
    { to: "/admin/requests", label: "Demandes de bilan", icon: ClipboardList },
    { to: "/admin/profiles", label: "Profils utilisateurs", icon: UserCog },
    { to: "/admin/finance", label: "Finance & Paie", icon: Wallet },
    { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Administration" roleColor="#1A6CC8" />
            <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="applications" element={<AdminTeacherApplications />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="requests" element={<AdminRequests />} />
                    <Route path="profiles" element={<ProfileManager />} />
                    <Route path="finance" element={<AdminFinance />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
