import { createContext, useContext, useState, ReactNode } from "react";
import { MOCK_USERS, User, Role } from "@/data/mock";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => { ok: boolean; error?: string };
    logout: () => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = sessionStorage.getItem("c4s_user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });

    const login = (email: string, password: string) => {
        const found = MOCK_USERS.find(
            (u) => u.email === email && u.password === password
        );
        if (!found) {
            return { ok: false, error: "Email ou mot de passe incorrect." };
        }
        setUser(found);
        sessionStorage.setItem("c4s_user", JSON.stringify(found));
        return { ok: true };
    };

    const logout = () => {
        setUser(null);
        sessionStorage.removeItem("c4s_user");
    };

    return (
        <AuthContext.Provider
            value={{ user, login, logout, isAuthenticated: !!user }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}

export const ROLE_REDIRECTS: Record<Role, string> = {
    admin: "/admin",
    teacher: "/teacher",
    parent: "/parent",
    advisor: "/advisor",
    student: "/student",
};
