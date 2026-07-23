import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentResources from "@/pages/student/Resources";

// Périmètre élève : Bibliothèque (/student/resources)
// Capacités testées : lecture/filtrage ressources, ouverture/téléchargement -> PATCH /api/resources/:id/download

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const RESOURCE = {
    id: "r1",
    title: "Fiche de révision - Fractions",
    subject: "Mathématiques",
    level: "Collège",
    type: "pdf",
    teacher_name: "M. Konaté",
    downloads: 3,
    file_url: "https://cdn.example.com/fiche.pdf",
    description: "Fiche récapitulative",
};

const windowOpenSpy = vi.fn();

function mockFetch(resources: any[] = [RESOURCE]) {
    (globalThis.fetch as any) = vi.fn((url: string, options?: any) => {
        if (options?.method === "PATCH") {
            return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({ ok: true, json: async () => resources });
    });
}

function renderResources() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentResources />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Bibliothèque", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.open = windowOpenSpy as any;
    });

    it("succès : affiche les ressources pédagogiques disponibles", async () => {
        mockFetch([RESOURCE]);

        renderResources();

        await waitFor(() => expect(screen.getByText("Fiche de révision - Fractions")).toBeInTheDocument());
        expect(screen.getAllByText("Mathématiques").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Collège").length).toBeGreaterThan(0);
    });

    it("filtrage : la recherche texte réduit la liste des ressources affichées", async () => {
        mockFetch([RESOURCE]);
        const user = userEvent.setup();

        renderResources();
        await waitFor(() => expect(screen.getByText("Fiche de révision - Fractions")).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText("Rechercher une ressource..."), "Anglais");
        expect(screen.queryByText("Fiche de révision - Fractions")).not.toBeInTheDocument();
    });

    it("filtrage : le filtre par matière restreint la liste aux ressources correspondantes", async () => {
        const OTHER = { ...RESOURCE, id: "r2", title: "Vidéo Grammaire", subject: "Français" };
        mockFetch([RESOURCE, OTHER]);
        const user = userEvent.setup();

        renderResources();
        await waitFor(() => expect(screen.getByText("Fiche de révision - Fractions")).toBeInTheDocument());

        await user.click(screen.getByRole("button", { name: "Français" }));
        await waitFor(() => expect(screen.getByText("Vidéo Grammaire")).toBeInTheDocument());
    });

    it("succès : ouvrir une ressource déclenche le PATCH de comptage puis l'ouverture du fichier", async () => {
        mockFetch([RESOURCE]);

        renderResources();
        await waitFor(() => expect(screen.getByText("Fiche de révision - Fractions")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Fiche de révision - Fractions"));

        await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/resources/r1/download"),
            expect.objectContaining({ method: "PATCH" })
        ));
        await waitFor(() => expect(windowOpenSpy).toHaveBeenCalledWith("https://cdn.example.com/fiche.pdf", "_blank"));
    });

    it("erreur réseau : l'ouverture reste possible même si le comptage de téléchargement échoue", async () => {
        (globalThis.fetch as any) = vi.fn((url: string, options?: any) => {
            if (options?.method === "PATCH") {
                return Promise.reject(new Error("Erreur réseau"));
            }
            return Promise.resolve({ ok: true, json: async () => [RESOURCE] });
        });

        renderResources();
        await waitFor(() => expect(screen.getByText("Fiche de révision - Fractions")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Fiche de révision - Fractions"));

        await waitFor(() => expect(windowOpenSpy).toHaveBeenCalledWith("https://cdn.example.com/fiche.pdf", "_blank"));
    });

    it("données vides : affiche un message si aucune ressource n'est disponible", async () => {
        mockFetch([]);

        renderResources();

        await waitFor(() => expect(screen.getByText("Aucune ressource disponible")).toBeInTheDocument());
    });
});
