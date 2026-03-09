import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, Users, GitMerge, ClipboardList, UserPlus } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import AdvisorDashboard from "./Dashboard";
import AdvisorFamilies from "./Families";
import AdvisorMatching from "./Matching";
import AdvisorReports from "./Reports";
import AdvisorTeacherApplications from "./TeacherApplications";
import AdvisorMessages from "./Messages";
import AdvisorSchedule from "./Schedule";
import { MessageCircle, CalendarDays } from "lucide-react";

const NAV = [
    { to: "/advisor", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/advisor/families", label: "Mes familles", icon: Users },
    { to: "/advisor/matching", label: "Matching", icon: GitMerge },
    { to: "/advisor/applications", label: "Candidatures profs", icon: UserPlus },
    { to: "/advisor/reports", label: "Bilans", icon: ClipboardList },
    { to: "/advisor/messages", label: "Messagerie", icon: MessageCircle },
    { to: "/advisor/schedule", label: "Tâches & RDV", icon: CalendarDays },
];

export default function AdvisorLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Conseiller Pédagogique" roleColor="#a855f7" />

            <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<AdvisorDashboard />} />
                    <Route path="families" element={<AdvisorFamilies />} />
                    <Route path="matching" element={<AdvisorMatching />} />
                    <Route path="applications" element={<AdvisorTeacherApplications />} />
                    <Route path="reports" element={<AdvisorReports />} />
                    <Route path="messages" element={<AdvisorMessages />} />
                    <Route path="schedule" element={<AdvisorSchedule />} />
                    <Route path="*" element={<Navigate to="/advisor" replace />} />
                </Routes>
            </main>
        </div>
    );
}
