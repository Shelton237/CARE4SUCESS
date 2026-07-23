// Tests unitaires — Espace Enseignant — Mes Cours (/teacher/courses)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : liste des cours, création (createCourse + createCourseLesson), édition
// (updateCourse/updateCourseLesson), suppression (deleteCourse), bascule brouillon/publié.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom-original";
import TeacherCourses from "@/pages/teacher/Courses";
import { toast } from "sonner";
import {
  fetchCourses, createCourse, updateCourse, deleteCourse,
  createCourseLesson, updateCourseLesson,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchCourses: vi.fn(),
  createCourse: vi.fn(),
  updateCourse: vi.fn(),
  deleteCourse: vi.fn(),
  createCourseLesson: vi.fn(),
  updateCourseLesson: vi.fn(),
  deleteCourseLesson: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const COURSE_A = {
  id: "course-1", title: "Révision Bac", subject: "Mathématiques", level: "Terminale",
  mode: "presentiel", status: "draft", price: 5000, duration: "1h30", lessons: [],
};

function renderCourses(initialPath = "/teacher/courses", { warmCache = false } = {}) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  // Dans l'app réelle, l'édition d'un cours est ouverte depuis la liste "Mes Cours" —
  // le cache React Query de la liste est donc déjà chaud au moment du montage de
  // l'éditeur (même clé de requête). On reproduit cette navigation réaliste pour les
  // scénarios d'édition afin d'éviter la course de rendu (form initialisé avant que
  // la liste ne soit chargée) qui n'existe pas dans le parcours utilisateur normal.
  if (warmCache) {
    qc.setQueryData(["courses", "teacher", "teacher-1"], [COURSE_A]);
  }
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/teacher/courses" element={<TeacherCourses />} />
          <Route path="/teacher/courses/:id" element={<TeacherCourses />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Mes Cours Enseignant — /teacher/courses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchCourses as any).mockResolvedValue([COURSE_A]);
  });

  it("succès : affiche la liste des cours de l'enseignant", async () => {
    renderCourses();
    expect(await screen.findByText("Révision Bac")).toBeInTheDocument();
    expect(screen.getByText(/Brouillon/i)).toBeInTheDocument();
  });

  it("état vide : aucun cours créé affiche un message dédié", async () => {
    (fetchCourses as any).mockResolvedValue([]);
    renderCourses();
    expect(await screen.findByText(/Aucun cours créé/i)).toBeInTheDocument();
  });

  it("création de cours : titre/matière/niveau manquants bloque l'enregistrement", async () => {
    const user = userEvent.setup();
    renderCourses("/teacher/courses/new");

    await user.click(await screen.findByRole("button", { name: /^Enregistrer$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Titre, matière et niveau sont obligatoires."));
    expect(createCourse).not.toHaveBeenCalled();
  });

  it("succès : création d'un cours complet avec une leçon", async () => {
    const user = userEvent.setup();
    (createCourse as any).mockResolvedValue({ id: "new-course-id" });
    (createCourseLesson as any).mockResolvedValue({ id: "lesson-1" });

    renderCourses("/teacher/courses/new");
    await screen.findByText("Créer un cours");

    await user.type(screen.getByPlaceholderText(/Révision Bac/i), "Cours de soutien Physique");
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "Physique-Chimie"); // matière
    await user.selectOptions(selects[1], "Terminale"); // niveau

    await user.click(screen.getByRole("button", { name: /^Enregistrer$/i }));

    await waitFor(() => expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Cours de soutien Physique", subject: "Physique-Chimie", level: "Terminale", status: "draft" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Cours enregistré"));
  });

  it("succès : publier un cours envoie le statut published", async () => {
    const user = userEvent.setup();
    (createCourse as any).mockResolvedValue({ id: "new-course-id" });

    renderCourses("/teacher/courses/new");
    await screen.findByText("Créer un cours");

    await user.type(screen.getByPlaceholderText(/Révision Bac/i), "Cours de soutien SVT");
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "SVT");
    await user.selectOptions(selects[1], "3ème");

    await user.click(screen.getByRole("button", { name: /^Publier$/i }));

    await waitFor(() => expect(createCourse).toHaveBeenCalledWith(
      expect.objectContaining({ status: "published" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Cours publié !"));
  });

  it("erreur réseau : échec d'enregistrement affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    (createCourse as any).mockRejectedValue(new Error("Erreur serveur"));

    renderCourses("/teacher/courses/new");
    await screen.findByText("Créer un cours");

    await user.type(screen.getByPlaceholderText(/Révision Bac/i), "Cours Anglais");
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "Anglais");
    await user.selectOptions(selects[1], "5ème");

    await user.click(screen.getByRole("button", { name: /^Enregistrer$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erreur serveur"));
  });

  it("succès : édition d'un cours existant appelle updateCourse", async () => {
    const user = userEvent.setup();
    (updateCourse as any).mockResolvedValue({});

    renderCourses("/teacher/courses/course-1", { warmCache: true });
    expect(await screen.findByText(/Éditer : Révision Bac/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^Enregistrer$/i }));

    await waitFor(() => expect(updateCourse).toHaveBeenCalledWith(
      "course-1",
      expect.objectContaining({ title: "Révision Bac", subject: "Mathématiques", level: "Terminale" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Cours enregistré"));
  });

  it("succès : suppression d'un cours appelle deleteCourse après confirmation", async () => {
    const user = userEvent.setup();
    (deleteCourse as any).mockResolvedValue({});
    vi.spyOn(window, "confirm").mockReturnValue(true);

    renderCourses("/teacher/courses/course-1", { warmCache: true });
    await screen.findByText(/Éditer : Révision Bac/i);

    await user.click(screen.getByRole("button", { name: /Supprimer ce cours/i }));

    await waitFor(() => expect(deleteCourse).toHaveBeenCalledWith("course-1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Cours supprimé"));
  });

  it("bascule brouillon/publié : le badge de statut change au clic", async () => {
    const user = userEvent.setup();
    renderCourses("/teacher/courses/course-1", { warmCache: true });
    await screen.findByText(/Éditer : Révision Bac/i);

    const badge = screen.getByRole("button", { name: /Brouillon/i });
    await user.click(badge);

    expect(await screen.findByRole("button", { name: /Publié/i })).toBeInTheDocument();
  });
});
