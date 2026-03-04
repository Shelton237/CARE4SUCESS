import { Routes, Route, Navigate } from "react-router-dom";
import { LayoutDashboard, CalendarDays, TrendingUp, Receipt } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import ParentDashboard from "./Dashboard";
import ParentSchedule from "./Schedule";
import ParentProgress from "./Progress";
import ParentInvoices from "./Invoices";

const NAV = [
    { to: "/parent", label: "Tableau de bord", icon: LayoutDashboard },
    { to: "/parent/schedule", label: "Planning", icon: CalendarDays },
    { to: "/parent/progress", label: "Progression", icon: TrendingUp },
    { to: "/parent/invoices", label: "Factures", icon: Receipt },
];

export default function ParentLayout() {
    return (
        <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
            <DashboardSidebar items={NAV} roleLabel="Parent" roleColor="#22c55e" />
            <main className="flex-1 ml-60 min-h-screen overflow-y-auto">
                <Routes>
                    <Route index element={<ParentDashboard />} />
                    <Route path="schedule" element={<ParentSchedule />} />
                    <Route path="progress" element={<ParentProgress />} />
                    <Route path="invoices" element={<ParentInvoices />} />
                    <Route path="*" element={<Navigate to="/parent" replace />} />
                </Routes>
            </main>
        </div>
    );
}
