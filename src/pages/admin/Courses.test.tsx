// Tests unitaires — Admin — Cours & Quiz (/admin/courses)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacité : lecture seule (fetchCourses("admin")) — pas de création/édition pour ce rôle
// (réservée aux profs/conseillers). Ce test documente explicitement cette restriction.
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminCourses from "@/pages/admin/Courses";
import { fetchCourses } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchCourses: vi.fn(),
  createCourse: vi.fn(),
  createCourseLesson: vi.fn(),
  createLessonQuiz: vi.fn(),
  createQuizQuestion: vi.fn(),
  assignCourseToStudent: vi.fn(),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-1", name: "Admin Care4Success", role: "admin" } }),
}));

const COURSE = {
  id: "course-1",
  title: "Programme sciences collège",
  description: "Notions fondamentales de sciences.",
  subject: "Sciences",
  level: "5e",
  status: "published" as const,
  coverUrl: null,
  createdAt: "2026-06-01",
  lessons: [
    {
      id: "lesson-1",
      courseId: "course-1",
      title: "Introduction",
      content: "Contenu de la leçon",
      order: 1,
      quiz: null,
    },
  ],
};

function renderCourses() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminCourses />
    </QueryClientProvider>
  );
}

describe("Admin Courses — Cours & Quiz (lecture seule)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : liste les cours via fetchCourses('admin') et affiche le détail du cours sélectionné", async () => {
    (fetchCourses as any).mockResolvedValue([COURSE]);
    renderCourses();

    expect(await screen.findByText("Programme sciences collège")).toBeInTheDocument();
    await waitFor(() => expect(fetchCourses).toHaveBeenCalledWith("admin"));
    expect(screen.getByText("Introduction")).toBeInTheDocument();
  });

  it("erreur réseau : affiche un message d'erreur si fetchCourses échoue", async () => {
    (fetchCourses as any).mockRejectedValue(new Error("Impossible de récupérer les cours."));
    renderCourses();

    expect(await screen.findByText("Impossible de récupérer les cours.")).toBeInTheDocument();
  });

  it("état vide : affiche un message si aucun cours n'existe", async () => {
    (fetchCourses as any).mockResolvedValue([]);
    renderCourses();

    expect(await screen.findByText("Aucun cours pour le moment.")).toBeInTheDocument();
  });

  it("lecture seule : le mode Consultation est affiché et aucun formulaire de création/édition n'est exposé pour l'admin", async () => {
    (fetchCourses as any).mockResolvedValue([COURSE]);
    renderCourses();

    expect(await screen.findByText("Mode Consultation")).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Creer le cours|Ajouter la lecon|Valider le quiz|Assigner le cours/i })).not.toBeInTheDocument();
  });
});
