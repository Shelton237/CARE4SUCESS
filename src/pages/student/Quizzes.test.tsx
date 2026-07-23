import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentQuizzes from "@/pages/student/Quizzes";
import { fetchCourses, fetchStudentQuizAttempts, fetchQuiz, submitQuizAttempt } from "@/api/backoffice";

// Périmètre élève : Tests & Quiz (/student/quizzes)
// Capacités testées : lecture (fetchCourses, fetchStudentQuizAttempts), lecteur de quiz,
// submitQuizAttempt

vi.mock("@/api/backoffice", () => ({
    fetchCourses: vi.fn(),
    fetchStudentQuizAttempts: vi.fn(),
    fetchQuiz: vi.fn(),
    submitQuizAttempt: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => toastSuccessSpy(...args),
        error: (...args: any[]) => toastErrorSpy(...args),
    },
}));

const COURSE_WITH_QUIZ = {
    id: "c1",
    title: "Cours de Maths",
    subject: "Maths",
    lessons: [
        {
            id: "l1",
            title: "Leçon Fractions",
            quiz: { id: "q1", title: "Quiz Fractions", totalPoints: 20 },
        },
    ],
};

const ATTEMPT = {
    id: "a1",
    quizId: "q1",
    quizTitle: "Quiz Fractions",
    subject: "Maths",
    score: 15,
    totalPoints: 20,
    createdAt: new Date().toISOString(),
};

const QUIZ_DETAILS = {
    id: "q1",
    title: "Quiz Fractions",
    questions: [
        {
            id: "ques1",
            prompt: "Combien font 2 + 2 ?",
            points: 1,
            choices: [
                { id: "A", label: "3" },
                { id: "B", label: "4" },
            ],
        },
    ],
};

function renderQuizzes() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentQuizzes />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

function getPlayButton() {
    return screen.getAllByRole("button").find(b => b.querySelector("svg.lucide-circle-play")) as HTMLButtonElement;
}

describe("Élève / Tests & Quiz", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche les quiz disponibles et les derniers résultats", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE_WITH_QUIZ] as any);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([ATTEMPT] as any);

        renderQuizzes();

        await waitFor(() => expect(screen.getAllByText("Quiz Fractions").length).toBeGreaterThan(0));
        expect(screen.getByText("15 / 20")).toBeInTheDocument();
    });

    it("recherche : filtre les quiz par titre ou matière", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE_WITH_QUIZ] as any);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([]);
        const user = userEvent.setup();

        renderQuizzes();
        await waitFor(() => expect(screen.getByText("Quiz Fractions")).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText("Rechercher..."), "Anglais");
        expect(screen.queryByText("Quiz Fractions")).not.toBeInTheDocument();
    });

    it("succès : lance un quiz, répond puis soumet une tentative via submitQuizAttempt", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE_WITH_QUIZ] as any);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([]);
        vi.mocked(fetchQuiz).mockResolvedValue(QUIZ_DETAILS as any);
        vi.mocked(submitQuizAttempt).mockResolvedValue({ attemptId: "a2", score: 1, totalPoints: 1 } as any);

        renderQuizzes();
        await waitFor(() => expect(screen.getByText("Quiz Fractions")).toBeInTheDocument());
        fireEvent.click(getPlayButton());

        expect(await screen.findByText("Combien font 2 + 2 ?")).toBeInTheDocument();
        fireEvent.click(screen.getByText("4"));
        fireEvent.click(screen.getByText("Terminer le Quiz"));

        await waitFor(() => expect(submitQuizAttempt).toHaveBeenCalledWith("q1", expect.objectContaining({
            studentId: "student-1",
            answers: [{ questionId: "ques1", answer: "B" }],
        })));
        expect(await screen.findByText("Excellent travail !")).toBeInTheDocument();
    });

    it("champs obligatoires manquants : impossible de continuer sans avoir répondu à la question", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE_WITH_QUIZ] as any);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([]);
        vi.mocked(fetchQuiz).mockResolvedValue(QUIZ_DETAILS as any);

        renderQuizzes();
        await waitFor(() => expect(screen.getByText("Quiz Fractions")).toBeInTheDocument());
        fireEvent.click(getPlayButton());

        await screen.findByText("Combien font 2 + 2 ?");
        expect(screen.getByText("Terminer le Quiz").closest("button")).toBeDisabled();
        expect(submitQuizAttempt).not.toHaveBeenCalled();
    });

    it("erreur réseau : l'échec de la soumission du quiz affiche un toast d'erreur", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE_WITH_QUIZ] as any);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([]);
        vi.mocked(fetchQuiz).mockResolvedValue(QUIZ_DETAILS as any);
        vi.mocked(submitQuizAttempt).mockRejectedValue(new Error("Erreur serveur"));

        renderQuizzes();
        await waitFor(() => expect(screen.getByText("Quiz Fractions")).toBeInTheDocument());
        fireEvent.click(getPlayButton());

        await screen.findByText("Combien font 2 + 2 ?");
        fireEvent.click(screen.getByText("4"));
        fireEvent.click(screen.getByText("Terminer le Quiz"));

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Erreur lors de l'envoi : Erreur serveur"));
    });

    it("données vides : affiche un message si aucun quiz n'est disponible", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([]);
        vi.mocked(fetchStudentQuizAttempts).mockResolvedValue([]);

        renderQuizzes();

        await waitFor(() => expect(screen.getByText("Aucun quiz disponible.")).toBeInTheDocument());
        expect(screen.getByText("Aucune tentative récente.")).toBeInTheDocument();
    });

    it("erreur réseau : retombe sur des listes vides si le chargement échoue", async () => {
        vi.mocked(fetchCourses).mockRejectedValue(new Error("Erreur serveur"));
        vi.mocked(fetchStudentQuizAttempts).mockRejectedValue(new Error("Erreur serveur"));

        renderQuizzes();

        await waitFor(() => expect(screen.getByText("Aucun quiz disponible.")).toBeInTheDocument());
    });
});
