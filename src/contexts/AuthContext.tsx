import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import type { User, Role } from "@/types/user";

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
    loginWithGoogle: (idToken: string) => Promise<{ ok: boolean; error?: string }>;
    logout: () => void;
    updateUser: (next: Partial<User>) => void;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Date d'expiration (ms) lue dans le jeton JWT, sans vérifier la signature (le serveur s'en charge).
const tokenExpiry = (token: string | null): number | null => {
    if (!token) return null;
    try {
        const part = token.split(".")[1];
        const json = JSON.parse(atob(part.replace(/-/g, "+").replace(/_/g, "/")));
        return typeof json.exp === "number" ? json.exp * 1000 : null;
    } catch {
        return null;
    }
};

// Session expirée : retour à la connexion avec un message, puis à la page en cours.
const redirectToLogin = () => {
    const here = window.location.pathname + window.location.search;
    if (window.location.pathname.startsWith("/login")) return;
    window.location.assign(`/login?expired=1&next=${encodeURIComponent(here)}`);
};

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const stored = localStorage.getItem("c4s_user");
            return stored ? JSON.parse(stored) : null;
        } catch {
            return null;
        }
    });
    const [token, setToken] = useState<string | null>(() => {
        try {
            return localStorage.getItem("c4s_token");
        } catch {
            return null;
        }
    });

    const persistUser = (value: User | null) => {
        if (!value) {
            localStorage.removeItem("c4s_user");
            return;
        }
        localStorage.setItem("c4s_user", JSON.stringify(value));
    };

    const persistToken = (value: string | null) => {
        if (!value) {
            localStorage.removeItem("c4s_token");
            return;
        }
        localStorage.setItem("c4s_token", value);
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

    const loginWithGoogle = async (idToken: string) => {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
            const response = await fetch(`${API_BASE_URL}/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken }),
            });

            if (!response.ok) {
                let errMessage = "Connexion Google impossible.";
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
            setToken(responseData.token ?? null);
            persistToken(responseData.token ?? null);
            return { ok: true };
        } catch (error) {
            console.error("Google login request failed:", error);
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

    const expireSession = () => {
        logout();
        redirectToLogin();
    };
    const expireRef = useRef(expireSession);
    expireRef.current = expireSession;

    // Déconnexion à l'heure d'expiration du jeton (au lieu d'écrans en erreur « Authentification invalide »).
    useEffect(() => {
        const exp = tokenExpiry(token);
        if (!exp) return;
        const delay = exp - Date.now();
        if (delay <= 0) { expireRef.current(); return; }
        const id = window.setTimeout(() => expireRef.current(), Math.min(delay, 2_147_000_000));
        return () => window.clearTimeout(id);
    }, [token]);

    // Filet de sécurité : toute réponse 401 à une requête authentifiée (jeton révoqué ou expiré) termine la session.
    useEffect(() => {
        const original = window.fetch;
        window.fetch = async (input, init) => {
            const response = await original(input, init);
            if (response.status === 401) {
                const h = init?.headers;
                const auth = h instanceof Headers ? h.get("Authorization") : (h as Record<string, string> | undefined)?.Authorization;
                if (auth?.startsWith("Bearer ") && localStorage.getItem("c4s_token")) expireRef.current();
            }
            return response;
        };
        return () => { window.fetch = original; };
    }, []);

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
            value={{ user, token, login, loginWithGoogle, logout, updateUser, isAuthenticated: !!user }}
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
