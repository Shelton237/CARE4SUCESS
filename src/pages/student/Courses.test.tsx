import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentCourses from "@/pages/student/Courses";
import {
    fetchCourses,
    fetchCourseBookmarks,
    addCourseBookmark,
    removeCourseBookmark,
    fetchActiveCourse,
    fetchCourseDetails,
    updateCourseProgress,
} from "@/api/backoffice";

// Périmètre élève : Mes Cours (/student/courses)
// Capacités testées : lecture (fetchCourses, fetchCourseBookmarks, fetchActiveCourse, fetchCourseDetails),
// addCourseBookmark/removeCourseBookmark, updateCourseProgress, "Rejoindre la Classe" si cours en ligne

vi.mock("@/api/backoffice", () => ({
    fetchCourses: vi.fn(),
    fetchCourseBookmarks: vi.fn(),
    addCourseBookmark: vi.fn(),
    removeCourseBookmark: vi.fn(),
    fetchActiveCourse: vi.fn(),
    fetchCourseDetails: vi.fn(),
    updateCourseProgress: vi.fn(),
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

const COURSE = {
    id: "c1",
    title: "Introduction aux Fractions",
    subject: "Maths",
    description: "Les bases des fractions",
    progress: 40,
    lessons: [{ id: "l1", title: "Leçon 1" }],
};

const COURSE_DETAILS = {
    id: "c1",
    title: "Introduction aux Fractions",
    subject: "Maths",
    progress: 40,
    mode: "online",
    completedLessons: [],
    lessons: [
        { id: "l1", title: "Leçon 1", content: "Contenu de la leçon 1" },
    ],
};

function renderCourses() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentCourses />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Mes Cours", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchActiveCourse).mockResolvedValue(null as any);
    });

    it("succès : affiche les cours avec leur progression", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);

        renderCourses();

        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());
        expect(screen.getByText("40%")).toBeInTheDocument();
    });

    it("recherche : filtre les cours par titre ou matière", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);
        const user = userEvent.setup();

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());

        await user.type(screen.getByPlaceholderText("Rechercher..."), "Anglais");
        expect(screen.queryByText("Introduction aux Fractions")).not.toBeInTheDocument();
    });

    it("succès : ajoute un cours en favoris via addCourseBookmark", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);
        vi.mocked(addCourseBookmark).mockResolvedValue({} as any);

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());

        const bookmarkButton = document.querySelector(".absolute.top-3.right-3 button") as HTMLButtonElement;
        fireEvent.click(bookmarkButton);

        await waitFor(() => expect(addCourseBookmark).toHaveBeenCalledWith("student-1", "c1"));
        await waitFor(() => expect(toastSuccessSpy).toHaveBeenCalledWith("Cours ajouté aux favoris"));
    });

    it("succès : retire un cours des favoris via removeCourseBookmark", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue(["c1"]);
        vi.mocked(removeCourseBookmark).mockResolvedValue({} as any);

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());

        const bookmarkButton = document.querySelector(".absolute.top-3.right-3 button") as HTMLButtonElement;
        fireEvent.click(bookmarkButton);

        await waitFor(() => expect(removeCourseBookmark).toHaveBeenCalledWith("student-1", "c1"));
        await waitFor(() => expect(toastSuccessSpy).toHaveBeenCalledWith("Cours retiré des favoris"));
    });

    it("erreur réseau : un échec du (dé)marquage en favori affiche un toast d'erreur", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);
        vi.mocked(addCourseBookmark).mockRejectedValue(new Error("Erreur serveur"));

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());

        const bookmarkButton = document.querySelector(".absolute.top-3.right-3 button") as HTMLButtonElement;
        fireEvent.click(bookmarkButton);

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Une erreur est survenue"));
    });

    it("succès : ouvre un cours, consulte la leçon et marque sa progression via updateCourseProgress", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);
        vi.mocked(fetchCourseDetails).mockResolvedValue(COURSE_DETAILS as any);
        vi.mocked(updateCourseProgress).mockResolvedValue({} as any);

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Introduction aux Fractions"));

        expect(await screen.findByText("Contenu de la leçon 1")).toBeInTheDocument();
        fireEvent.click(screen.getByText("Marquer comme terminée"));

        await waitFor(() => expect(updateCourseProgress).toHaveBeenCalledWith("student-1", "c1", { lessonId: "l1", completed: true }));
        expect(toastSuccessSpy).toHaveBeenCalledWith("Leçon marquée comme terminée !");
    });

    it("succès : le cours en ligne propose 'Rejoindre la Classe'", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([COURSE] as any);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);
        vi.mocked(fetchCourseDetails).mockResolvedValue(COURSE_DETAILS as any);

        renderCourses();
        await waitFor(() => expect(screen.getByText("Introduction aux Fractions")).toBeInTheDocument());
        fireEvent.click(screen.getByText("Introduction aux Fractions"));

        await screen.findByText("Contenu de la leçon 1");
        fireEvent.click(screen.getByText("Rejoindre la Classe"));

        expect(mockNavigate).toHaveBeenCalledWith("/virtual-class/c1");
    });

    it("données vides : affiche un message si aucun cours n'est trouvé", async () => {
        vi.mocked(fetchCourses).mockResolvedValue([]);
        vi.mocked(fetchCourseBookmarks).mockResolvedValue([]);

        renderCourses();

        await waitFor(() => expect(screen.getByText("Aucun cours trouvé.")).toBeInTheDocument());
    });

    it("erreur réseau : retombe sur une liste vide si le chargement échoue", async () => {
        vi.mocked(fetchCourses).mockRejectedValue(new Error("Erreur serveur"));
        vi.mocked(fetchCourseBookmarks).mockRejectedValue(new Error("Erreur serveur"));

        renderCourses();

        await waitFor(() => expect(screen.getByText("Aucun cours trouvé.")).toBeInTheDocument());
    });
});
