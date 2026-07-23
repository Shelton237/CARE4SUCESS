import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentHomework from "@/pages/student/Homework";
import { fetchStudentHomework, uploadHomeworkFile } from "@/api/backoffice";

// Périmètre élève : Mes Devoirs (/student/homework)
// Capacités testées : lecture (fetchStudentHomework), "Déposer" -> uploadHomeworkFile
// (PDF/PNG/JPG max 10 Mo), lecture correction/feedback.
// Refus explicite : l'élève ne corrige/ne note jamais son propre devoir (réservé à l'enseignant).

vi.mock("@/api/backoffice", () => ({
    fetchStudentHomework: vi.fn(),
    uploadHomeworkFile: vi.fn(),
    updateHomework: vi.fn(),
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

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => toastSuccessSpy(...args),
        error: (...args: any[]) => toastErrorSpy(...args),
    },
}));

const HW_TODO = {
    id: "hw1",
    title: "Exercices sur les fractions",
    subject: "Maths",
    description: "Faire les exercices 1 à 5",
    dueDate: "20/08/2026",
    teacherName: "M. Konaté",
    status: "à faire",
};

const HW_CORRECTED = {
    id: "hw2",
    title: "Rédaction sur Molière",
    subject: "Français",
    description: "Analyser un extrait",
    dueDate: "10/08/2026",
    teacherName: "Mme Diallo",
    status: "corrigé",
    feedback: "Bon travail, attention à l'orthographe.",
    submissionUrl: "/uploads/redaction.pdf",
};

function renderHomework() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentHomework />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Mes Devoirs", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche les devoirs à faire et corrigés avec leur statut", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([HW_TODO, HW_CORRECTED] as any);

        renderHomework();

        await waitFor(() => expect(screen.getByText("Exercices sur les fractions")).toBeInTheDocument());
        expect(screen.getByText("Rédaction sur Molière")).toBeInTheDocument();
        expect(screen.getAllByText("À faire").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Corrigé").length).toBeGreaterThan(0);
    });

    it("recherche : filtre les devoirs par titre ou matière", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([HW_TODO, HW_CORRECTED] as any);
        const user = userEvent.setup();

        renderHomework();
        await waitFor(() => expect(screen.getByText("Exercices sur les fractions")).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText("Rechercher..."), "Molière");
        expect(screen.queryByText("Exercices sur les fractions")).not.toBeInTheDocument();
        expect(screen.getByText("Rédaction sur Molière")).toBeInTheDocument();
    });

    it("succès : consulter la correction et le retour du professeur (lecture seule)", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([HW_CORRECTED] as any);
        renderHomework();

        await waitFor(() => expect(screen.getByText("Correction")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Correction"));

        expect(await screen.findByText("Bon travail, attention à l'orthographe.")).toBeInTheDocument();
        // Aucun contrôle de saisie de note/correction n'est proposé à l'élève :
        // seule la lecture du retour du professeur est disponible.
        expect(screen.queryByRole("spinbutton")).not.toBeInTheDocument();
        expect(screen.queryByLabelText(/note/i)).not.toBeInTheDocument();
    });

    it("succès : dépose un fichier de devoir via uploadHomeworkFile", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([HW_TODO] as any);
        vi.mocked(uploadHomeworkFile).mockResolvedValue({} as any);

        renderHomework();
        await waitFor(() => expect(screen.getByText("Déposer")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Déposer"));

        expect(await screen.findByText("Déposer mon travail")).toBeInTheDocument();
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["contenu"], "devoir.pdf", { type: "application/pdf" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(uploadHomeworkFile).toHaveBeenCalledWith("hw1", file));
        await waitFor(() => expect(toastSuccessSpy).toHaveBeenCalledWith(
            "Devoir déposé avec succès ! Ton professeur sera notifié."
        ));
    });

    it("erreur réseau / fichier invalide : un échec du dépôt affiche un toast d'erreur et laisse la fenêtre ouverte", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([HW_TODO] as any);
        vi.mocked(uploadHomeworkFile).mockRejectedValue(new Error("Fichier trop volumineux (> 10 Mo)"));

        renderHomework();
        await waitFor(() => expect(screen.getByText("Déposer")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Déposer"));

        await screen.findByText("Déposer mon travail");
        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const tooBigFile = new File(["x".repeat(10)], "devoir-trop-gros.pdf", { type: "application/pdf" });
        fireEvent.change(fileInput, { target: { files: [tooBigFile] } });

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Une erreur est survenue lors du dépôt."));
        expect(screen.getByText("Déposer mon travail")).toBeInTheDocument();
    });

    it("données vides : affiche un message si aucun devoir n'est disponible", async () => {
        vi.mocked(fetchStudentHomework).mockResolvedValue([]);
        renderHomework();

        await waitFor(() => expect(screen.getByText("Aucun devoir à afficher.")).toBeInTheDocument());
    });

    it("erreur réseau : retombe sur l'état vide si le chargement échoue", async () => {
        vi.mocked(fetchStudentHomework).mockRejectedValue(new Error("Erreur serveur"));
        renderHomework();

        await waitFor(() => expect(screen.getByText("Aucun devoir à afficher.")).toBeInTheDocument());
    });
});
