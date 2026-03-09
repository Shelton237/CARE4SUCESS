import { NavLink, useNavigate } from "react-router-dom";
import { LucideIcon, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "./NotificationCenter";

export interface SidebarItem {
    to: string;
    label: string;
    icon: LucideIcon;
}

interface Props {
    items: SidebarItem[];
    roleLabel: string;
    roleColor: string;
}

export function DashboardSidebar({ items, roleLabel, roleColor }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-60 flex flex-col z-40" style={{ background: "#0D2D5A" }}>
            {/* Logo & Notifications */}
            <div className="px-5 py-6 border-b border-white/10 flex items-center justify-between">
                <div className="flex flex-col gap-1.5">
                    <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care 4 Success" className="h-8 w-auto object-contain brightness-0 invert" />
                    <div
                        className="text-[9px] font-black px-3 py-0.5 rounded-full inline-block uppercase tracking-[2px] text-center"
                        style={{ background: roleColor + "15", color: roleColor, border: `1px solid ${roleColor}30` }}
                    >
                        {roleLabel}
                    </div>
                </div>
                <div className="bg-white/5 rounded-full p-1 border border-white/5 hover:bg-white/10 transition-colors">
                    <NotificationCenter />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-hide">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${isActive
                                ? "text-white shadow-lg"
                                : "text-blue-100/60 hover:text-white hover:bg-white/5"
                            }`
                        }
                        style={({ isActive }) => isActive ? { background: roleColor } : {}}
                    >
                        {() => (
                            <>
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                <span className="tracking-tight">{item.label}</span>
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User footer */}
            <div className="px-3 py-5 border-t border-white/10 bg-black/10">
                <div className="flex items-center gap-3 px-3 py-3 mb-3 bg-white/5 rounded-2xl border border-white/5">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0 shadow-lg shadow-black/20"
                        style={{ background: roleColor, color: "#fff" }}
                    >
                        {user?.avatar || user?.name?.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-black text-white truncate tracking-tight">{user?.name}</div>
                        <div className="text-[10px] font-bold text-blue-300/50 truncate uppercase tracking-widest">{user?.email}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-blue-300/60 hover:text-white hover:bg-red-500/10 transition-all duration-300"
                >
                    <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
