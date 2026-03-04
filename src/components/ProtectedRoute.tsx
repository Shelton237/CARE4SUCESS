import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Role } from "@/data/mock";

interface Props {
    children: React.ReactNode;
    role?: Role;
}

export function ProtectedRoute({ children, role }: Props) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (role && user?.role !== role) {
        // Redirect to their own dashboard
        const roleRoutes: Record<Role, string> = {
            admin: "/admin",
            teacher: "/teacher",
            parent: "/parent",
            advisor: "/advisor",
            student: "/student",
        };
        return <Navigate to={roleRoutes[user!.role]} replace />;
    }

    return <>{children}</>;
}
