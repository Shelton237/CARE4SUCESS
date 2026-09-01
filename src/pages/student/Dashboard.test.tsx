import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentDashboard from "@/pages/student/Dashboard";
import { fetchStudentOverview, fetchScheduleByRole } from "@/api/backoffice";

// Périmètre élève : Tableau de bord (/student)
// Capacités testées : fetchStudentOverview, fetchScheduleByRole, navigation Agenda/Quiz/Cours/Messages

vi.mock("@/api/backoffice", () => ({
    fetchStudentOverview: vi.fn(),
    fetchScheduleByRole: vi.fn(),
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

function renderDashboard() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentDashboard />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Tableau de bord", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche la moyenne, le niveau et les prochains cours de l'élève", async () => {
        vi.mocked(fetchStudentOverview).mockResolvedValue({
            currentAvg: 15.5,
            level: "Terminale",
            teacher: "M. Konaté",
            xp: 120,
            grade: "Apprenti",
            gradeColor: "#000",
            nextGrade: "Expert",
            progressToNext: 40,
            nextXP: 300,
            leaderboard: [],
            sessionsThisMonth: 4,
        } as any);
        vi.mocked(fetchScheduleByRole).mockResolvedValue([
            { id: "s1", subject: "Maths", teacher: "M. Konaté", day: "Lundi", date: "12/08", time: "10h", status: "planifié" },
        ] as any);

        renderDashboard();

        await waitFor(() => expect(screen.getByText("15.5/20")).toBeInTheDocument());
        expect(screen.getByText("Terminale")).toBeInTheDocument();
        expect(screen.getAllByText("M. Konaté").length).toBeGreaterThan(0);
    });

    it("erreur réseau : retombe sur des valeurs par défaut si le tableau de bord échoue à charger", async () => {
        vi.mocked(fetchStudentOverview).mockRejectedValue(new Error("Erreur serveur"));
        vi.mocked(fetchScheduleByRole).mockRejectedValue(new Error("Erreur serveur"));

        renderDashboard();

        await waitFor(() => expect(screen.getAllByText("--/20").length).toBeGreaterThan(0));
        expect(screen.getByText("N/A")).toBeInTheDocument();
        expect(screen.getByText("Aucun cours prévu")).toBeInTheDocument();
    });

    it("données vides : n'affiche aucun cours à venir quand le planning est vide", async () => {
        vi.mocked(fetchStudentOverview).mockResolvedValue({ level: "6ème" } as any);
        vi.mocked(fetchScheduleByRole).mockResolvedValue([]);

        renderDashboard();

        await waitFor(() => expect(screen.getByText("Aucun cours prévu")).toBeInTheDocument());
    });

    it("navigation : le raccourci 'Agenda complet' redirige vers /student/schedule", async () => {
        vi.mocked(fetchStudentOverview).mockResolvedValue({ level: "6ème" } as any);
        vi.mocked(fetchScheduleByRole).mockResolvedValue([]);

        renderDashboard();

        await waitFor(() => expect(screen.getByText("Agenda complet")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Agenda complet"));
        expect(mockNavigate).toHaveBeenCalledWith("/student/schedule");
    });

    it("navigation : le bouton 'Lancer un Quiz' redirige vers /student/quizzes", async () => {
        vi.mocked(fetchStudentOverview).mockResolvedValue({ level: "6ème" } as any);
        vi.mocked(fetchScheduleByRole).mockResolvedValue([]);

        renderDashboard();

        await waitFor(() => expect(screen.getByText("Lancer un Quiz")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Lancer un Quiz"));
        expect(mockNavigate).toHaveBeenCalledWith("/student/quizzes");
    });
});
