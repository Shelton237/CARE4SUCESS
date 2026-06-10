import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, Settings, UserPlus, BookOpen, UserCog, Wallet, GitMerge, Globe } from "lucide-react";
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
import AdvisorMatching from "../advisor/Matching";
import AdminGeography from "./Geography";

const NAV = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/teachers", label: "Enseignants", icon: GraduationCap },
    { to: "/admin/courses", label: "Cours & Quiz", icon: BookOpen },
    { to: "/admin/applications", label: "Candidatures profs", icon: UserPlus },
    { to: "/admin/students", label: "Élèves & Familles", icon: Users },
    { to: "/admin/requests", label: "Demandes de bilan", icon: ClipboardList },
    { to: "/admin/matching", label: "Matching", icon: GitMerge },
    { to: "/admin/profiles", label: "Profils utilisateurs", icon: UserCog },
    { to: "/admin/finance", label: "Finance & Paie", icon: Wallet },
    { to: "/admin/geography", label: "Géographie", icon: Globe },
    { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Administration" roleColor="#1A6CC8" />
            <main className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full">
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="courses" element={<AdminCourses />} />
                    <Route path="applications" element={<AdminTeacherApplications />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="requests" element={<AdminRequests />} />
                    <Route path="profiles/:userId?" element={<ProfileManager />} />
                    <Route path="matching" element={<AdvisorMatching />} />
                    <Route path="finance" element={<AdminFinance />} />
                    <Route path="geography" element={<AdminGeography />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
