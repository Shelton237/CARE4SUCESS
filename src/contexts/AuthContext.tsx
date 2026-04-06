import { createContext, useContext, useState, ReactNode } from "react";
import type { User, Role } from "@/types/user";

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => void;
    updateUser: (next: Partial<User>) => void;
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
    const [token, setToken] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem("c4s_token");
        } catch {
            return null;
        }
    });

    const persistUser = (value: User | null) => {
        if (!value) {
            sessionStorage.removeItem("c4s_user");
            return;
        }
        sessionStorage.setItem("c4s_user", JSON.stringify(value));
    };

    const persistToken = (value: string | null) => {
        if (!value) {
            sessionStorage.removeItem("c4s_token");
            return;
        }
        sessionStorage.setItem("c4s_token", value);
    };

    const login = async (email: string, password: string) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                let errMessage = "Email ou mot de passe incorrect.";
                try {
                    const errorData = await response.json();
                    if (errorData.message) errMessage = errorData.message;
                } catch {
                    /* ignore JSON parse errors */
                }
                return { ok: false, error: errMessage };
            }

            const responseData = await response.json();
            setUser(responseData.user);
            persistUser(responseData.user);
            if (responseData.token) {
                setToken(responseData.token);
                persistToken(responseData.token);
            } else {
                setToken(null);
                persistToken(null);
            }
            return { ok: true };
        } catch (error) {
            console.error("Login request failed:", error);
            return {
                ok: false,
                error: "Impossible de contacter le serveur. Merci de réessayer dans un instant.",
            };
        }
    };

    const logout = () => {
        setUser(null);
        persistUser(null);
        setToken(null);
        persistToken(null);
    };

    const updateUser = (next: Partial<User>) => {
        setUser((prev) => {
            if (!prev) return prev;
            const merged = { ...prev, ...next };
            persistUser(merged);
            return merged;
        });
    };

    return (
        <AuthContext.Provider
            value={{ user, token, login, logout, updateUser, isAuthenticated: !!user }}
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
    tutor: "/tutor",
};
