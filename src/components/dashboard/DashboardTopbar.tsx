import { NavLink, useNavigate } from "react-router-dom";
import { Home, ChevronRight, ChevronDown, UserCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationCenter } from "./NotificationCenter";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface Props {
    homeTo: string;
    pageLabel: string;
    roleColor: string;
}

export function DashboardTopbar({ homeTo, pageLabel, roleColor }: Props) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    const handleProfile = () => {
        if (user?.role === "teacher") navigate("/teacher/profile");
        else if (user?.role === "tutor" && user?.secondaryRole === "teacher") navigate("/tutor/enseignant/profile");
        else if (user?.role === "tutor") navigate("/tutor/profile");
        else navigate("/account");
    };

    return (
        <div className="hidden md:flex items-center justify-between px-8 pt-5 pb-1">
            <div className="flex items-center gap-2 text-sm">
                <NavLink to={homeTo} end className="text-gray-400 hover:text-[#0D2D5A] transition-colors">
                    <Home className="w-4 h-4" />
                </NavLink>
                <span className="text-gray-300 font-light">|</span>
                <NavLink to={homeTo} end className="text-gray-400 hover:text-[#0D2D5A] transition-colors">
                    Accueil
                </NavLink>
                <span className="text-gray-300">
                    <ChevronRight className="w-3.5 h-3.5" />
                </span>
                <span className="text-[#0D2D5A] font-bold">{pageLabel}</span>
            </div>

            <div className="flex items-center gap-3">
                <div className="rounded-full p-2 bg-white shadow-sm hover:shadow transition-shadow">
                    <NotificationCenter />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-full bg-white shadow-sm hover:shadow transition-shadow">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                                style={{ background: roleColor }}
                            >
                                {user?.avatar || user?.name?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-[#0D2D5A]">{user?.name}</span>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={handleProfile} className="gap-2 cursor-pointer">
                            <UserCircle2 className="w-4 h-4" /> Profil
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout} className="gap-2 cursor-pointer text-red-600 focus:text-red-600">
                            <LogOut className="w-4 h-4" /> Quitter
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
