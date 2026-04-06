import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, UserPlus } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import TutorDashboard from "./Dashboard";
import TutorTeacherApplications from "./TeacherApplications";

const NAV = [
    { to: "/tutor", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/tutor/applications", label: "Candidatures profs", icon: UserPlus },
];

export default function TutorLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Tuteur Pédagogique" roleColor="#7C3AED" />
            <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<TutorDashboard />} />
                    <Route path="applications" element={<TutorTeacherApplications />} />
                    <Route path="*" element={<Navigate to="/tutor" replace />} />
                </Routes>
            </main>
        </div>
    );
}
