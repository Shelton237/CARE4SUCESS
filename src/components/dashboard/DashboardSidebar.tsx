import { NavLink, useNavigate } from "react-router-dom";
import { LucideIcon, LogOut, UserCircle2, Menu, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export interface SidebarItem {
    to: string;
    label: string;
    icon: LucideIcon;
    badgeCount?: number;
    section?: string;
}

interface Props {
    items: SidebarItem[];
    roleLabel: string;
    roleColor: string;
}

export function DashboardSidebar({ items, roleLabel, roleColor }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [open, setOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfile = () => {
        setOpen(false);
        if (user?.role === 'teacher') navigate("/teacher/profile");
        else if (user?.role === 'tutor' && user?.secondaryRole === 'teacher') navigate("/tutor/enseignant/profile");
        else if (user?.role === 'tutor') navigate("/tutor/profile");
        else navigate("/account");
    };

    const SidebarContent = () => (
        <div className="flex flex-col h-full overflow-hidden" style={{ background: "#0D2D5A" }}>
            {/* Logo */}
            <div className="px-5 pt-8 pb-7 flex justify-center">
                <img src="/logo/care4success-compact-white.png" alt="Care 4 Success" className="h-20 w-auto object-contain" />
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-2 space-y-3 overflow-y-auto scrollbar-hide">
                {items.map((item, idx) => {
                    const prevSection = idx > 0 ? items[idx - 1].section : undefined;
                    const showSectionHeader = item.section && item.section !== prevSection;
                    return (
                        <div key={item.to}>
                            {showSectionHeader && (
                                <div className={`px-4 pb-1 text-[9px] font-black uppercase tracking-widest text-white/30 ${idx > 0 ? "pt-5 border-t border-white/10 mt-3" : "pt-0"}`}>
                                    {item.section}
                                </div>
                            )}
                            <NavLink
                                to={item.to}
                                end
                                onClick={() => setOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 ${isActive
                                        ? "text-white shadow-lg"
                                        : "text-blue-100/60 hover:text-white hover:bg-white/5"
                                    }`
                                }
                                style={({ isActive }) => isActive ? { background: roleColor } : {}}
                            >
                                {() => (
                                    <>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <item.icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="tracking-tight truncate">{item.label}</span>
                                        </div>
                                        {item.badgeCount && item.badgeCount > 0 ? (
                                            <div className="bg-red-500 text-white text-[9px] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-none shadow-sm shadow-red-900/40">
                                                {item.badgeCount}
                                            </div>
                                        ) : null}
                                    </>
                                )}
                            </NavLink>
                        </div>
                    );
                })}
            </nav>

            {/* User footer */}
            <div className="px-3 pb-5 pt-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                    <div className="flex items-center gap-3 px-3 py-3">
                        <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: roleColor, color: "#fff" }}
                        >
                            {user?.avatar || user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-white truncate tracking-tight">{user?.name}</div>
                            <div className="text-[11px] text-blue-200/60 truncate">{roleLabel}</div>
                        </div>
                        <ChevronDown className="w-3.5 h-3.5 text-blue-200/40 flex-shrink-0" />
                    </div>
                    <div className="border-t border-white/10 flex items-center">
                        <button
                            onClick={handleProfile}
                            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-blue-100/70 hover:text-white hover:bg-white/5 transition-colors"
                        >
                            <UserCircle2 className="w-3.5 h-3.5" />
                            Profil
                        </button>
                        <div className="w-px self-stretch bg-white/10" />
                        <button
                            onClick={handleLogout}
                            className="group flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/5 transition-colors"
                        >
                            <LogOut className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                            Quitter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 flex items-center justify-between px-4 z-50 border-b border-white/5 shadow-2xl" style={{ background: "#0D2D5A" }}>
                <div className="flex items-center gap-3">
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <button className="text-white p-2 hover:bg-white/10 rounded-xl transition-colors">
                                <Menu className="w-6 h-6" />
                            </button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72 border-none overflow-hidden" style={{ background: "#0D2D5A" }}>
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care 4 Success" className="h-7 w-auto object-contain brightness-0 invert" />
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="bg-white/5 rounded-full p-1.5 border border-white/5">
                        <NotificationCenter />
                    </div>
                    <div 
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black shadow-lg"
                        style={{ background: roleColor, color: "#fff" }}
                    >
                        {user?.name?.charAt(0)}
                    </div>
                </div>
            </div>

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex fixed left-0 top-0 h-full w-72 flex-col z-40 border-r border-white/5 shadow-2xl" style={{ background: "#0D2D5A" }}>
                <SidebarContent />
            </aside>
        </>
    );
}
