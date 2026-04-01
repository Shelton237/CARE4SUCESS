import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, TrendingUp, Receipt, Star, ClipboardList, Users, GraduationCap } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import ParentDashboard from "./Dashboard";
import ParentSchedule from "./Schedule";
import ParentProgress from "./Progress";
import ParentInvoices from "./Invoices";
import ParentFeedback from "./Feedback";
import ParentHomework from "./Homework";
import ParentChildren from "./Children";
import ParentTeam from "./Team";
import ParentMessages from "./Messages";
import ChildCockpit from "./ChildCockpit";
import { MessageSquare } from "lucide-react";

const NAV = [
    { to: "/parent", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/parent/children", label: "Mes Enfants", icon: Users },
    { to: "/parent/team", label: "Équipe Pédagogique", icon: GraduationCap },
    { to: "/parent/schedule", label: "Planning", icon: CalendarDays },
    { to: "/parent/homework", label: "Devoirs", icon: ClipboardList },
    { to: "/parent/progress", label: "Progression", icon: TrendingUp },
    { to: "/parent/invoices", label: "Factures", icon: Receipt },
    { to: "/parent/feedback", label: "Avis profs", icon: Star },
    { to: "/parent/messages", label: "Messages", icon: MessageSquare },
];

export default function ParentLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Parent" roleColor="#22c55e" />
            <main className="flex-1 ml-72 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="children" element={<ParentChildren />} />
                    <Route path="children/:id" element={<ChildCockpit />} />
                    <Route path="team" element={<ParentTeam />} />
                    <Route path="schedule" element={<ParentSchedule />} />
                    <Route path="homework" element={<ParentHomework />} />
                    <Route path="progress" element={<ParentProgress />} />
                    <Route path="invoices" element={<ParentInvoices />} />
                    <Route path="feedback" element={<ParentFeedback />} />
                    <Route path="messages" element={<ParentMessages />} />
                    <Route path="*" element={<Navigate to="/parent" replace />} />
                </Routes>
            </main>
        </div>
    );
}
