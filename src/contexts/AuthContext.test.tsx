import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { AuthProvider, useAuth } from "./AuthContext";

const jwt = (expSeconds: number) =>
    `x.${btoa(JSON.stringify({ sub: "u1", role: "advisor", exp: expSeconds })).replace(/=+$/, "")}.y`;

function Probe() {
    const { isAuthenticated } = useAuth();
    return <p>{isAuthenticated ? "connecté" : "déconnecté"}</p>;
}

describe("AuthContext : session expirée", () => {
    const assign = vi.fn();
    const realLocation = window.location;

    beforeEach(() => {
        assign.mockReset();
        Object.defineProperty(window, "location", {
            configurable: true,
            value: { ...realLocation, pathname: "/advisor/matching", search: "", assign },
        });
        localStorage.setItem("c4s_user", JSON.stringify({ id: "u1", name: "Brice", role: "advisor" }));
    });
    afterEach(() => {
        Object.defineProperty(window, "location", { configurable: true, value: realLocation });
        localStorage.clear();
        vi.unstubAllGlobals();
    });

    it("un jeton déjà expiré déconnecte et renvoie vers la connexion avec la page en cours", async () => {
        localStorage.setItem("c4s_token", jwt(Math.floor(Date.now() / 1000) - 60));
        render(<AuthProvider><Probe /></AuthProvider>);
        await waitFor(() => expect(screen.getByText("déconnecté")).toBeInTheDocument());
        expect(assign).toHaveBeenCalledWith("/login?expired=1&next=%2Fadvisor%2Fmatching");
        expect(localStorage.getItem("c4s_token")).toBeNull();
    });

    it("un jeton valide reste connecté", () => {
        localStorage.setItem("c4s_token", jwt(Math.floor(Date.now() / 1000) + 3600));
        render(<AuthProvider><Probe /></AuthProvider>);
        expect(screen.getByText("connecté")).toBeInTheDocument();
        expect(assign).not.toHaveBeenCalled();
    });

    it("une réponse 401 à une requête authentifiée termine la session", async () => {
        localStorage.setItem("c4s_token", jwt(Math.floor(Date.now() / 1000) + 3600));
        vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 401 }))));
        render(<AuthProvider><Probe /></AuthProvider>);
        await act(async () => { await window.fetch("/api/assignments", { headers: { Authorization: "Bearer abc" } }); });
        expect(screen.getByText("déconnecté")).toBeInTheDocument();
        expect(assign).toHaveBeenCalled();
    });

    it("un 401 sans jeton (mauvais mot de passe) ne déclenche rien", async () => {
        localStorage.setItem("c4s_token", jwt(Math.floor(Date.now() / 1000) + 3600));
        vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response("{}", { status: 401 }))));
        render(<AuthProvider><Probe /></AuthProvider>);
        await act(async () => { await window.fetch("/api/auth/login", { method: "POST" }); });
        expect(screen.getByText("connecté")).toBeInTheDocument();
        expect(assign).not.toHaveBeenCalled();
    });
});
