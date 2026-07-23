import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentHistory from "@/pages/student/History";

// Périmètre élève : Historique des cours (/student/history)
// Capacités testées : lecture seule stricte (GET /api/students/:id/course-history), aucune action d'écriture

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const PAST_SESSION = {
    id: "s1",
    date: "2026-08-01T10:00:00.000Z",
    subject: "Maths",
    teacherName: "M. Konaté",
    startTime: "2026-08-01T10:00:00.000Z",
    endTime: "2026-08-01T12:00:00.000Z",
    reportText: "Bonne compréhension des fractions.",
    understandingScore: 4,
    homeworkTitle: "Exercices 1 à 5",
    homeworkDue: "2026-08-08T00:00:00.000Z",
};

function mockFetch(response: any, ok = true) {
    (globalThis.fetch as any) = vi.fn(() =>
        Promise.resolve({ ok, json: async () => response })
    );
}

function renderHistory() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentHistory />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Historique des cours", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche l'historique des séances effectuées avec le rapport du professeur (lecture seule)", async () => {
        mockFetch([PAST_SESSION]);

        renderHistory();

        await waitFor(() => expect(screen.getByText("Maths")).toBeInTheDocument());
        expect(screen.getByText("Bonne compréhension des fractions.", { exact: false })).toBeInTheDocument();
        expect(screen.getByText("M. Konaté")).toBeInTheDocument();
        expect(screen.getByText("Exercices 1 à 5")).toBeInTheDocument();
    });

    it("lecture seule : aucune action d'écriture (bouton de modification/suppression) n'est proposée", async () => {
        mockFetch([PAST_SESSION]);

        renderHistory();

        await waitFor(() => expect(screen.getByText("Maths")).toBeInTheDocument());
        expect(screen.queryByRole("button")).not.toBeInTheDocument();
        expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("données vides : affiche un message si aucun cours n'a été effectué", async () => {
        mockFetch([]);

        renderHistory();

        await waitFor(() => expect(screen.getByText("Aucun cours effectué pour le moment")).toBeInTheDocument());
    });

    it("erreur réseau : retombe sur une liste vide si l'API renvoie une erreur", async () => {
        mockFetch({ error: "Erreur serveur" }, false);

        renderHistory();

        await waitFor(() => expect(screen.getByText("Aucun cours effectué pour le moment")).toBeInTheDocument());
    });
});
