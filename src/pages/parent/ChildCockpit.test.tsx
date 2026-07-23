import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom-original";
import ChildCockpit from "@/pages/parent/ChildCockpit";
import * as backoffice from "@/api/backoffice";

// Capacité "Cockpit enfant" — cartographie Parent :
// lecture (fetchUserProfile, fetchParentProgress, fetchStudentQuizAttempts,
// fetchStudentHomework, fetchStudentEvaluations) — "Contacter Tuteur" et
// "Bilan PDF" (en-tête) sont (non câblé)

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom-original")>("react-router-dom-original");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderCockpit(id = "child-1") {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/parent/children/${id}`]}>
        <Routes>
          <Route path="/parent/children/:id" element={<ChildCockpit />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [{ id: "child-1", name: "Alice Dupont", level: "3ème" }];

const profile = { id: "child-1", name: "Alice Dupont", email: "alice@eureka.test", level: "3ème" };

const overview = {
  parentId: "parent-1", childName: "Alice Dupont", childLevel: "3ème",
  currentAvg: 15.5, sessionsThisMonth: 4, focusSubject: "Maths",
};

const progress = [{ month: "Mai", maths: 14, francais: 12 }, { month: "Juin", maths: 15.5, francais: 13 }];

const grades = [{ id: "g1", subject: "Maths", quizTitle: "Quiz Algèbre", score: 18, totalPoints: 20 }];

const homework = [{ id: "hw1", title: "Exercices", dueDate: "25/07", status: "pending" }];

const evaluations = [{ id: "ev1", teacherName: "M. Kouassi", rating: 4, comment: "Bon investissement", createdAt: "2026-07-01" }];

describe("Parent > Cockpit enfant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchUserProfile").mockResolvedValue(profile as any);
    vi.spyOn(backoffice, "fetchParentOverview").mockResolvedValue(overview as any);
    vi.spyOn(backoffice, "fetchParentProgress").mockResolvedValue(progress as any);
    vi.spyOn(backoffice, "fetchStudentQuizAttempts").mockResolvedValue(grades as any);
    vi.spyOn(backoffice, "fetchStudentHomework").mockResolvedValue(homework as any);
    vi.spyOn(backoffice, "fetchStudentEvaluations").mockResolvedValue(evaluations as any);
  });

  it("succès : affiche le profil, les indicateurs et les dernières évaluations/devoirs", async () => {
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    expect(screen.getByText("alice@eureka.test")).toBeInTheDocument();
    expect(screen.getByText("15.5/20")).toBeInTheDocument();
    expect(screen.getByText("Quiz Algèbre")).toBeInTheDocument();
    expect(screen.getByText("Exercices")).toBeInTheDocument();
  });

  it("succès : affiche les conseils et observations pédagogiques (avis enseignants)", async () => {
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    expect(screen.getByText("M. Kouassi")).toBeInTheDocument();
    expect(screen.getByText('"Bon investissement"')).toBeInTheDocument();
  });

  it("navigation : « Dossier Académique Complet » navigue vers /parent/academic-file", async () => {
    const { default: userEvent } = await import("@testing-library/user-event");
    const user = userEvent.setup();
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    await user.click(screen.getByText("Dossier Académique Complet"));

    expect(navigateMock).toHaveBeenCalledWith("/parent/academic-file?studentId=child-1");
  });

  it("données vides : affiche un message si aucune observation pédagogique n'est enregistrée", async () => {
    vi.spyOn(backoffice, "fetchStudentEvaluations").mockResolvedValue([] as any);
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Aucune observation enregistrée pour le moment/i)).toBeInTheDocument());
  });

  it("erreur réseau : dégrade gracieusement si fetchStudentEvaluations échoue (pas de crash)", async () => {
    vi.spyOn(backoffice, "fetchStudentEvaluations").mockRejectedValue(new Error("Erreur réseau"));
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    expect(screen.getByText(/Aucune observation enregistrée pour le moment/i)).toBeInTheDocument();
  });

  it("erreur réseau : dégrade gracieusement si fetchUserProfile échoue en retombant sur la liste des enfants", async () => {
    vi.spyOn(backoffice, "fetchUserProfile").mockRejectedValue(new Error("Erreur réseau"));
    renderCockpit();

    // childInList (issu de fetchChildrenByParent) prend le relais pour l'affichage du nom
    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
  });

  it("bouton non câblé : « Contacter Tuteur » n'a pas de handler", async () => {
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    const button = screen.getByText("Contacter Tuteur") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Bilan PDF » de l'en-tête n'a pas de handler", async () => {
    renderCockpit();

    await waitFor(() => expect(screen.getByText(/Profil de Alice Dupont/i)).toBeInTheDocument());
    const button = screen.getByText("Bilan PDF") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });
});
