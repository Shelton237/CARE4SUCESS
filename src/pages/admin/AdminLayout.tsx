import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, GraduationCap, ClipboardList, Settings } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import AdminDashboard from "./Dashboard";
import AdminTeachers from "./Teachers";
import AdminStudents from "./Students";
import AdminRequests from "./Requests";
import AdminSettings from "./Settings";

const NAV = [
    { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/admin/teachers", label: "Enseignants", icon: GraduationCap },
    { to: "/admin/students", label: "Élèves & Familles", icon: Users },
    { to: "/admin/requests", label: "Demandes de bilan", icon: ClipboardList },
    { to: "/admin/settings", label: "Paramètres", icon: Settings },
];

export default function AdminLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Administration" roleColor="#F5A623" />
            <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<AdminDashboard />} />
                    <Route path="teachers" element={<AdminTeachers />} />
                    <Route path="students" element={<AdminStudents />} />
                    <Route path="requests" element={<AdminRequests />} />
                    <Route path="settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                </Routes>
            </main>
        </div>
    );
}
