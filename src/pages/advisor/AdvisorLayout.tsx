import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, GitMerge, ClipboardList, UserPlus, MessageCircle, CalendarDays, Inbox } from "lucide-react";
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
    { to: "/advisor", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/advisor/requests", label: "Demandes de bilan", icon: Inbox },
    { to: "/advisor/families", label: "Mes familles", icon: Users },
    { to: "/advisor/matching", label: "Matching", icon: GitMerge },
    { to: "/advisor/applications", label: "Candidatures profs", icon: UserPlus },
    { to: "/advisor/reports", label: "Bilans", icon: ClipboardList },
    { to: "/advisor/messages", label: "Messagerie", icon: MessageCircle },
    { to: "/advisor/schedule", label: "Tâches & RDV", icon: CalendarDays },
];

const ROLE_COLOR = "#0F9B8E";

export default function AdvisorLayout() {
    const location = useLocation();
    const pageLabel = NAV.find(n => n.to === location.pathname)?.label
        || (location.pathname === "/advisor" ? "Tableau de bord" : "Care4Success");

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
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
