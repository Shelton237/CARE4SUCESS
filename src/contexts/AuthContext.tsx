import { createContext, useContext, useState, ReactNode } from "react";
import { MOCK_USERS, User, Role } from "@/data/mock";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
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

    const login = async (email: string, password: string) => {
        try {
            const response = await fetch("http://localhost:4000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                let errMessage = "Email ou mot de passe incorrect.";
                try {
                    const errorData = await response.json();
                    if (errorData.message) errMessage = errorData.message;
                } catch { }
                return { ok: false, error: errMessage };
            }

            const userData = await response.json();
            setUser(userData);
            sessionStorage.setItem("c4s_user", JSON.stringify(userData));
            return { ok: true };
        } catch (error) {
            console.error("Login request failed:", error);
            // Fallback for mocked users if database is heavily disabled or unreachable:
            const found = MOCK_USERS.find(
                (u) => u.email === email && u.password === password
            );
            if (!found) {
                return { ok: false, error: "Serveur injoignable et identifiants locaux incorrects." };
            }
            setUser(found);
            sessionStorage.setItem("c4s_user", JSON.stringify(found));
            return { ok: true };
        }
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
