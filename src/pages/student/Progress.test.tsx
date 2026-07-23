import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentProgress from "@/pages/student/Progress";
import { fetchStudentProgressData, fetchStudentSessions, submitGradeDispute } from "@/api/backoffice";

// Périmètre élève : Progression Académique (/student/progress)
// Capacités testées : lecture (fetchStudentProgressData, diagnostic/plan en lecture),
// submitGradeDispute({ studentId, sessionId, reason })

vi.mock("@/api/backoffice", () => ({
    fetchStudentProgressData: vi.fn(),
    fetchStudentSessions: vi.fn(),
    submitGradeDispute: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
const toastWarningSpy = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => toastSuccessSpy(...args),
        error: (...args: any[]) => toastErrorSpy(...args),
        warning: (...args: any[]) => toastWarningSpy(...args),
    },
}));

const PAST_SESSION = {
    id: "s1",
    subject: "Maths",
    teacher: "M. Konaté",
    date: "01/08/2026",
    status: "effectué",
    understandingScore: 4,
};

function mockFetch(overrides: Partial<Record<"diagnostic" | "academic-plan" | "overview", any>> = {}) {
    (globalThis.fetch as any) = vi.fn((url: string) => {
        if (url.includes("/diagnostic")) {
            return Promise.resolve({ ok: true, json: async () => overrides.diagnostic ?? null });
        }
        if (url.includes("/academic-plan")) {
            return Promise.resolve({ ok: true, json: async () => overrides["academic-plan"] ?? null });
        }
        if (url.includes("/overview")) {
            return Promise.resolve({ ok: true, json: async () => overrides.overview ?? null });
        }
        return Promise.resolve({ ok: true, json: async () => null });
    });
}

function renderProgress() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentProgress />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Progression Académique", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch();
    });

    it("succès : affiche l'historique des évaluations avec la note de la session", async () => {
        vi.mocked(fetchStudentProgressData).mockResolvedValue([] as any);
        vi.mocked(fetchStudentSessions).mockResolvedValue([PAST_SESSION] as any);

        renderProgress();

        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());
        expect(screen.getAllByText("Maths").length).toBeGreaterThan(0);
    });

    it("succès : le diagnostic initial et le plan pédagogique s'affichent quand disponibles", async () => {
        vi.mocked(fetchStudentProgressData).mockResolvedValue([] as any);
        vi.mocked(fetchStudentSessions).mockResolvedValue([]);
        mockFetch({
            diagnostic: { created_at: new Date().toISOString(), scores: { Maths: 8 }, strengths: "Bonne logique", weaknesses: "Orthographe" },
            "academic-plan": { title: "Plan de progrès", start_date: new Date().toISOString(), weeks: [{ objective: "Réviser les fractions", subjects: ["Maths"], done: false }] },
        });

        renderProgress();

        expect(await screen.findByText("Diagnostic initial")).toBeInTheDocument();
        expect(screen.getByText("Bonne logique")).toBeInTheDocument();
        expect(screen.getByText("Plan de progrès")).toBeInTheDocument();
        expect(screen.getByText("Réviser les fractions")).toBeInTheDocument();
    });

    it("succès : contester une note ouvre le formulaire et soumet la contestation via submitGradeDispute", async () => {
        vi.mocked(fetchStudentProgressData).mockResolvedValue([] as any);
        vi.mocked(fetchStudentSessions).mockResolvedValue([PAST_SESSION] as any);
        vi.mocked(submitGradeDispute).mockResolvedValue({} as any);
        const user = userEvent.setup();

        renderProgress();
        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Contester"));
        expect(await screen.findByText("Contester une note")).toBeInTheDocument();

        const textarea = screen.getByPlaceholderText("Expliquez brièvement votre contestation...");
        await user.type(textarea, "Je ne comprends pas cette note.");
        fireEvent.click(screen.getByText("Envoyer"));

        await waitFor(() => expect(submitGradeDispute).toHaveBeenCalledWith(
            {
                studentId: "student-1",
                sessionId: "s1",
                reason: "Je ne comprends pas cette note.",
            },
            expect.anything()
        ));
        await waitFor(() => expect(toastSuccessSpy).toHaveBeenCalledWith("Ta contestation a été enregistrée avec succès."));
    });

    it("champs obligatoires manquants : la contestation sans motif est bloquée avec un avertissement", async () => {
        vi.mocked(fetchStudentProgressData).mockResolvedValue([] as any);
        vi.mocked(fetchStudentSessions).mockResolvedValue([PAST_SESSION] as any);

        renderProgress();
        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Contester"));
        await screen.findByText("Contester une note");
        fireEvent.click(screen.getByText("Envoyer"));

        expect(toastWarningSpy).toHaveBeenCalledWith("Veuillez fournir un motif.");
        expect(submitGradeDispute).not.toHaveBeenCalled();
    });

    it("erreur réseau : un échec de submitGradeDispute affiche un toast d'erreur", async () => {
        vi.mocked(fetchStudentProgressData).mockResolvedValue([] as any);
        vi.mocked(fetchStudentSessions).mockResolvedValue([PAST_SESSION] as any);
        vi.mocked(submitGradeDispute).mockRejectedValue(new Error("Erreur serveur"));
        const user = userEvent.setup();

        renderProgress();
        await waitFor(() => expect(screen.getByText("M. Konaté")).toBeInTheDocument());

        fireEvent.click(screen.getByText("Contester"));
        await screen.findByText("Contester une note");
        await user.type(screen.getByPlaceholderText("Expliquez brièvement votre contestation..."), "Motif de test");
        fireEvent.click(screen.getByText("Envoyer"));

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Erreur: Erreur serveur"));
    });

    it("erreur réseau : retombe sur une courbe et un historique par défaut si le chargement échoue", async () => {
        vi.mocked(fetchStudentProgressData).mockRejectedValue(new Error("Erreur serveur"));
        vi.mocked(fetchStudentSessions).mockRejectedValue(new Error("Erreur serveur"));

        renderProgress();

        await waitFor(() => expect(screen.getByText("Courbe d'apprentissage")).toBeInTheDocument());
        expect(screen.getByText("Historique des évaluations")).toBeInTheDocument();
    });
});
