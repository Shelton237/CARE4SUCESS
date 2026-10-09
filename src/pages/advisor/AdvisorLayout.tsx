import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Home, Users, GitMerge, User, BarChart3, Mail, CalendarDays, FileText } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardTopbar } from "@/components/dashboard/DashboardTopbar";
import AdvisorDashboard from "./Dashboard";
import AdvisorFamilies from "./Families";
import AdvisorMatching from "./Matching";
import AdvisorReports from "./Reports";
import AdvisorTeacherApplications from "./TeacherApplications";
import AdvisorMessages from "./Messages";
import AdvisorSchedule from "./Schedule";
import AdvisorRequests from "./Requests";

const NAV = [
    { to: "/advisor", label: "Tableau de bord", icon: Home },
    { to: "/advisor/requests", label: "Demandes de bilan", icon: FileText },
    { to: "/advisor/families", label: "Mes élèves", icon: Users },
    { to: "/advisor/matching", label: "Matching", icon: GitMerge },
    { to: "/advisor/applications", label: "Candidatures profs", icon: User },
    { to: "/advisor/reports", label: "Bilans", icon: BarChart3 },
    { to: "/advisor/messages", label: "Messagerie", icon: Mail },
    { to: "/advisor/schedule", label: "Tâches & RDV", icon: CalendarDays },
];

const ROLE_COLOR = "#0F9B8E";

export default function AdvisorLayout() {
    const location = useLocation();
    const pageLabel = NAV.find(n => n.to === location.pathname)?.label
        || (location.pathname === "/advisor" ? "Tableau de bord" : "Care4Success");

    return (
        <div className="min-h-screen bg-[#F3F9FD] flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Conseiller Care4Success" roleColor={ROLE_COLOR} />

            <main className="flex-1 md:ml-72 ml-0 min-h-screen pt-16 md:pt-0 overflow-y-auto w-full">
                <DashboardTopbar homeTo="/advisor" pageLabel={pageLabel} roleColor={ROLE_COLOR} />
                <Routes>
                    <Route index element={<AdvisorDashboard />} />
                    <Route path="requests" element={<AdvisorRequests />} />
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
