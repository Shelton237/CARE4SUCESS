import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentTeachers from "@/pages/student/Teachers";
import { fetchTeachersByStudent } from "@/api/backoffice";

// Périmètre élève : Mes Professeurs (/student/teachers)
// Capacités testées : lecture (fetchTeachersByStudent), "Discuter" -> messagerie avec contact pré-sélectionné

vi.mock("@/api/backoffice", () => ({
    fetchTeachersByStudent: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const TEACHER = {
    id: "t1",
    name: "M. Konaté",
    email: "konate@care4success.com",
    phone: "+225 07 00 00 00",
    sessionsCount: 12,
};

function renderTeachers() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentTeachers />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Mes Professeurs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche la liste des tuteurs assignés avec leurs coordonnées", async () => {
        vi.mocked(fetchTeachersByStudent).mockResolvedValue([TEACHER] as any);

        renderTeachers();

        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());
        expect(screen.getByText("konate@care4success.com")).toBeInTheDocument();
        expect(screen.getByText("12 cours")).toBeInTheDocument();
    });

    it("navigation : le bouton 'Discuter' redirige vers la messagerie avec le contact pré-sélectionné", async () => {
        vi.mocked(fetchTeachersByStudent).mockResolvedValue([TEACHER] as any);

        renderTeachers();

        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Discuter"));

        expect(mockNavigate).toHaveBeenCalledWith("/student/messages", {
            state: { contactId: "t1", contactName: "M. Konaté", contactRole: "teacher" },
        });
    });

    it("données vides : affiche un message si aucun tuteur n'est assigné", async () => {
        vi.mocked(fetchTeachersByStudent).mockResolvedValue([]);

        renderTeachers();

        await waitFor(() => expect(screen.getByText("Aucun tuteur assigné")).toBeInTheDocument());
    });

    it("erreur réseau : retombe sur l'état vide si le chargement échoue", async () => {
        vi.mocked(fetchTeachersByStudent).mockRejectedValue(new Error("Erreur serveur"));

        renderTeachers();

        await waitFor(() => expect(screen.getByText("Aucun tuteur assigné")).toBeInTheDocument());
    });
});
