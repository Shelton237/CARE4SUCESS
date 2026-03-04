import { NavLink, useNavigate } from "react-router-dom";
import { LucideIcon, LogOut, GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
            {/* Logo */}
            <div className="px-5 py-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <img src="/logo/Care 4 Success-logo-Ok_compact.png" alt="Care 4 Success" className="h-9 w-auto object-contain brightness-0 invert" />
                </div>
                <div
                    className="mt-3 text-xs font-bold px-3 py-1 rounded-full inline-block"
                    style={{ background: roleColor + "25", color: roleColor, border: `1px solid ${roleColor}40` }}
                >
                    {roleLabel}
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {items.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        end
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-150 ${isActive
                                ? "text-[#0D2D5A] shadow-md"
                                : "text-blue-200 hover:text-white hover:bg-white/10"
                            }`
                        }
                        style={({ isActive }) => isActive ? { background: roleColor, color: "#fff" } : {}}
                    >
                        {({ isActive }) => (
                            <>
                                <item.icon className="w-4 h-4 flex-shrink-0" />
                                {item.label}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            {/* User footer */}
            <div className="px-3 py-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3 py-3 mb-2">
                    <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                        style={{ background: roleColor, color: "#fff" }}
                    >
                        {user?.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                        <div className="text-xs text-blue-300 truncate">{user?.email}</div>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-blue-300 hover:text-white hover:bg-white/10 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                </button>
            </div>
        </aside>
    );
}
