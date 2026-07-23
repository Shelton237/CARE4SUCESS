import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentSchedule from "@/pages/student/Schedule";
import { fetchScheduleByRole } from "@/api/backoffice";

// Périmètre élève : Mon Planning (/student/schedule)
// Capacités testées : recherche de sessions, "Rejoindre" -> /virtual-class/:id,
// "Résumé" (lecture bilan) + téléchargement PDF (jsPDF)

vi.mock("@/api/backoffice", () => ({
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

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => toastSuccessSpy(...args),
        error: (...args: any[]) => toastErrorSpy(...args),
    },
}));

const savePdfSpy = vi.fn();
vi.mock("jspdf", () => {
    return {
        jsPDF: vi.fn().mockImplementation(function () {
            return {
                setFillColor: vi.fn(),
                rect: vi.fn(),
                setTextColor: vi.fn(),
                setFontSize: vi.fn(),
                setFont: vi.fn(),
                text: vi.fn(),
                splitTextToSize: vi.fn().mockReturnValue(["ligne 1"]),
                setDrawColor: vi.fn(),
                line: vi.fn(),
                save: savePdfSpy,
            };
        }),
    };
});

const UPCOMING_SESSION = {
    id: "s1",
    subject: "Maths",
    teacher: "M. Konaté",
    day: "Lundi",
    date: "12/08",
    time: "10h",
    status: "planifié",
    location: "En ligne",
    virtualLink: "https://meet.example.com/abc",
};

const PAST_SESSION = {
    id: "s2",
    subject: "Français",
    teacher: "Mme Diallo",
    day: "Mardi",
    date: "05/08",
    time: "14h",
    status: "effectué",
    location: "En ligne",
    notes: "Bon travail sur les figures de style.",
};

function renderSchedule() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentSchedule />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Mon Planning", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("succès : affiche les sessions et permet de rejoindre une session en ligne à venir", async () => {
        vi.mocked(fetchScheduleByRole).mockResolvedValue([UPCOMING_SESSION] as any);

        renderSchedule();

        await waitFor(() => expect(screen.getByText("Maths avec M. Konaté")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Rejoindre"));
        expect(mockNavigate).toHaveBeenCalledWith("/virtual-class/s1");
    });

    it("recherche : filtre les sessions par matière ou enseignant", async () => {
        vi.mocked(fetchScheduleByRole).mockResolvedValue([UPCOMING_SESSION, PAST_SESSION] as any);
        const user = userEvent.setup();

        renderSchedule();

        await waitFor(() => expect(screen.getByText("Maths avec M. Konaté")).toBeInTheDocument());
        await user.type(screen.getByPlaceholderText("Matière, enseignant..."), "Français");

        expect(screen.queryByText("Maths avec M. Konaté")).not.toBeInTheDocument();
        expect(screen.getByText("Français avec Mme Diallo")).toBeInTheDocument();
    });

    it("succès : le bouton 'Résumé' ouvre le bilan pédagogique d'une session passée", async () => {
        vi.mocked(fetchScheduleByRole).mockResolvedValue([PAST_SESSION] as any);
        renderSchedule();

        await waitFor(() => expect(screen.getByText("Résumé")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Résumé"));

        expect(await screen.findByText("Résumé du Cours")).toBeInTheDocument();
        expect(screen.getByText("Bon travail sur les figures de style.")).toBeInTheDocument();
    });

    it("succès : le téléchargement du bilan en PDF déclenche la génération et un toast de succès", async () => {
        vi.mocked(fetchScheduleByRole).mockResolvedValue([PAST_SESSION] as any);
        renderSchedule();

        await waitFor(() => expect(screen.getByText("Résumé")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Résumé"));
        await screen.findByText("Résumé du Cours");

        const downloadButton = document.querySelector(".bg-blue-50.text-\\[\\#1A6CC8\\]") as HTMLButtonElement;
        fireEvent.click(downloadButton);

        expect(savePdfSpy).toHaveBeenCalled();
        expect(toastSuccessSpy).toHaveBeenCalledWith("Le compte-rendu a été téléchargé.");
    });

    it("données vides : affiche un message si aucune session n'est planifiée", async () => {
        vi.mocked(fetchScheduleByRole).mockResolvedValue([]);
        renderSchedule();

        await waitFor(() => expect(screen.getByText("Aucun cours trouvé.")).toBeInTheDocument());
    });

    it("erreur réseau : retombe sur un planning vide si le chargement échoue", async () => {
        vi.mocked(fetchScheduleByRole).mockRejectedValue(new Error("Erreur serveur"));
        renderSchedule();

        await waitFor(() => expect(screen.getByText("Aucun cours trouvé.")).toBeInTheDocument());
    });
});
