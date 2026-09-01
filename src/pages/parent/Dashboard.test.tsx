import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentDashboard from "@/pages/parent/Dashboard";
import * as backoffice from "@/api/backoffice";

// Capacité "Tableau de bord" — cartographie Parent :
// sélecteur d'enfant, lecture (fetchParentOverview, fetchParentProgress, fetchScheduleByRole)

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

function renderDashboard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [
  { id: "child-1", name: "Alice Dupont" },
  { id: "child-2", name: "Bob Dupont" },
];

const overview = {
  parentId: "parent-1",
  parentName: "Parent Test",
  studentId: "child-1",
  childName: "Alice Dupont",
  childLevel: "3ème",
  focusSubject: "Maths",
  sessionsThisMonth: 4,
  currentAvg: 15.5,
  previousAvg: 14,
  totalPaidThisMonth: 25000,
  upcomingSession: null,
  pendingInvoice: { id: "inv-1", parentId: "parent-1", date: "2026-07-01", description: "Cours de maths", amount: 10000, status: "pending" as const },
  latestEvaluations: [
    { id: "ev-1", score: 18, totalPoints: 20, quizTitle: "Quiz Algèbre", courseTitle: "Maths", subject: "Maths", createdAt: "2026-06-01" },
  ],
};

const progress = [
  { month: "Mai", maths: 14, francais: 12, anglais: 13 },
  { month: "Juin", maths: 15, francais: 13, anglais: 14 },
];

const schedule = [
  { id: "s1", day: "Lundi", date: "20/07", time: "10:00", subject: "Maths", location: "En ligne", status: "à venir" as const, teacher: "M. Kouassi", teacherId: "t1", student: "Alice Dupont", studentId: "child-1", parent: "Parent Test", parentId: "parent-1" },
];

describe("Parent > Tableau de bord", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchParentOverview").mockResolvedValue(overview as any);
    vi.spyOn(backoffice, "fetchParentProgress").mockResolvedValue(progress as any);
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue(schedule as any);
  });

  it("succès : affiche les indicateurs et le sélecteur d'enfant", async () => {
    renderDashboard();

    await waitFor(() => expect(screen.getByText(/15\.5\/20/)).toBeInTheDocument());
    expect(screen.getByText("ALICE DUPONT")).toBeInTheDocument();
    expect(screen.getByText("BOB DUPONT")).toBeInTheDocument();
    // Aperçu du planning
    expect(screen.getByText("MATHS")).toBeInTheDocument();
    // Bannière facture en attente avec bouton RÉGLER
    expect(screen.getByRole("button", { name: /RÉGLER/i })).toBeInTheDocument();
  });

  it("succès : changer d'enfant via le sélecteur relance la lecture des données", async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Le tableau de bord affiche un spinner plein écran tant que l'aperçu
    // (overviewQuery) n'est pas stabilisé : on attend l'état final (données
    // chargées ET sélecteur visible) dans un seul waitFor pour éviter de
    // cibler un état intermédiaire transitoire.
    await waitFor(() => {
      expect(screen.getByText(/15\.5\/20/)).toBeInTheDocument();
      expect(screen.getByText("BOB DUPONT")).toBeInTheDocument();
    });
    await user.click(screen.getByText("BOB DUPONT"));

    await waitFor(() => {
      expect(backoffice.fetchParentOverview).toHaveBeenCalledWith("parent-1", "child-2");
    });
  });

  it("navigation : les raccourcis Gestion Family et Facturation appellent bien la navigation", async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/15\.5\/20/)).toBeInTheDocument();
      expect(screen.getByText(/Gestion Family/i)).toBeInTheDocument();
    });
    await user.click(screen.getByText(/Gestion Family/i));
    expect(navigateMock).toHaveBeenCalledWith("/parent/children");

    await user.click(screen.getByText(/Facturation/i));
    expect(navigateMock).toHaveBeenCalledWith("/parent/invoices");
  });

  it("erreur réseau : dégrade gracieusement si fetchParentOverview échoue (pas de crash, placeholders affichés)", async () => {
    vi.spyOn(backoffice, "fetchParentOverview").mockRejectedValue(new Error("Erreur réseau"));
    renderDashboard();

    // Après échec définitif de la requête (retry désactivé), la page se
    // stabilise avec le sélecteur d'enfant et des placeholders "—".
    await waitFor(() => {
      expect(screen.getByText("ALICE DUPONT")).toBeInTheDocument();
      expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    });
  });

  it("erreur réseau : dégrade gracieusement si fetchScheduleByRole échoue (planning vide, pas de crash)", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockRejectedValue(new Error("Erreur réseau"));
    renderDashboard();

    await waitFor(() => expect(screen.getByText(/TABLEAU DE BORD/i)).toBeInTheDocument());
    expect(screen.getByText(/Planning/i)).toBeInTheDocument();
  });
});
