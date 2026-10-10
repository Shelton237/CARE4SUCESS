import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorDashboard from "@/pages/advisor/Dashboard";
import { fetchAdvisorFollowup } from "@/api/backoffice";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig<any>()), useNavigate: () => navigate }));
vi.mock("@/api/backoffice", () => ({ fetchAdvisorFollowup: vi.fn() }));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "adv", name: "Brice Owona", role: "advisor" } }) }));

const ROW = (o: Record<string, unknown>) => ({
  familyId: "r", studentId: "s", name: "Élève", level: "3e", initialAvg: 2.1, latestAvg: 3.6, delta: 1.5, evaluations: 2, lastEvalAt: "2026-03-12T10:00:00Z",
  sessions30: { done: 5, planned: 6 }, homeworkRate: 100, homeworkCount: 4, feedback: { avg: 4.5, n: 4 }, alerts: [] as string[], step: "reevaluation", stepLabel: "Réévaluation", ...o,
});
const DATA = {
  period: { from: "2026-09-11", to: "2026-10-10" },
  alerts: [
    { key: "diagPending", label: "Diagnostics en attente", rule: "> 7 jours sans diagnostic", short: "Diagnostic en attente", count: 1, items: [{ familyId: "r9", studentId: null, name: "Tina", detail: "Demande du 20/09/2026" }] },
    { key: "regression", label: "Recul mesuré", rule: "-1 point sur une matière", short: "Recul mesuré", count: 0, items: [] },
  ],
  kpis: {
    students: { total: 48, variation: 6, withDiagnostic: 41, withPlan: 35, withTutor: 25 },
    progression: { avg: 1.2, n: 28, variation: 0.3 },
    attendance: { rate: 78, n: 42, variation: 5 },
    homework: { rate: 87, n: 30, variation: 8, correctionDays: null, correctionN: 0 },
    satisfaction: { avg: 4.3, n: 18, variation: 0.4 },
  },
  funnel: [
    { key: "demande", label: "Demandes", count: 48, medianDays: null, n: null },
    { key: "diagnostic", label: "Diagnostics", count: 41, medianDays: 3, n: 41 },
    { key: "plan", label: "Plans", count: 35, medianDays: null, n: 0 },
  ],
  subjects: [{ subject: "Mathématiques", n: 12, initial: 2.1, latest: 3.6, delta: 1.5, reliability: 82, measures: 30 }],
  evaluatedStudents: 28,
  evaluatorGap: { avg: null, n: 0 },
  students: [
    ROW({ familyId: "r1", studentId: "s1", name: "Jean Nkoa" }),
    ROW({ familyId: "r2", studentId: "s2", name: "Fatou Sali", delta: -0.5, alerts: ["Recul mesuré"], step: "tuteur", stepLabel: "Tuteur" }),
    ROW({ familyId: "r3", studentId: null, name: "Tina FAMO", initialAvg: null, latestAvg: null, delta: null, evaluations: 0, lastEvalAt: null, sessions30: { done: 0, planned: 0 }, homeworkRate: null, feedback: { avg: null, n: 0 }, step: "demande", stepLabel: "Demande" }),
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdvisorDashboard />
      </QueryClientProvider>
    </MemoryRouter>
  );

describe("AdvisorDashboard : suivi pédagogique objectif", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorFollowup as any).mockResolvedValue(DATA);
  });

  it("indicateurs avec effectifs, entonnoir et progression par matière", async () => {
    renderPage();
    expect(await screen.findByText("Bonjour, Brice 👋")).toBeInTheDocument();
    expect(await screen.findByText("Élèves suivis")).toBeInTheDocument();
    expect(fetchAdvisorFollowup).toHaveBeenCalledWith(expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/), expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/));
    expect(screen.getByText("+1,2")).toBeInTheDocument();
    expect(screen.getByText("Sur 28 élèves évalués au moins 2 fois")).toBeInTheDocument();
    expect(screen.getByText("Sur 42 séances prévues et échues")).toBeInTheDocument();
    expect(screen.getByText("Pas encore mesuré")).toBeInTheDocument();
    expect(screen.getByText("4,3/5")).toBeInTheDocument();
    // Délai non mesuré dans l'entonnoir et écart d'un élève jamais évalué
    expect(screen.getAllByText("Non mesuré")).toHaveLength(2);
    expect(screen.getByText("Mathématiques")).toBeInTheDocument();
    expect(screen.getByText(/aucune double évaluation/)).toBeInTheDocument();
  });

  it("une alerte ouvre la liste et mène à la fiche, par identifiant", async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(await screen.findByRole("button", { name: "Diagnostics en attente : 1" }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: /Tina/ }));
    expect(navigate).toHaveBeenCalledWith("/advisor/families", { state: { familyId: "r9", defaultPanel: "diagnostic" } });
  });

  it("tableau de suivi : valeurs non mesurées signalées, recherche et filtre", async () => {
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText("Jean Nkoa")).toBeInTheDocument();
    const tina = screen.getByText("Tina FAMO").closest("tr")!;
    expect(within(tina).getByText("Non évalué")).toBeInTheDocument();
    expect(within(tina).getByText("Aucun avis")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /^Filtres/ }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Progression négative" }));
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByText("Jean Nkoa")).not.toBeInTheDocument());
    expect(screen.getByText("Fatou Sali")).toBeInTheDocument();
  });

  it("changement de période : nouvelle requête", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Élèves suivis");
    await user.click(screen.getByRole("button", { name: "Choisir la période" }));
    await user.click(await screen.findByRole("button", { name: "3 derniers mois" }));
    await waitFor(() => expect(fetchAdvisorFollowup).toHaveBeenCalledTimes(2));
  });

  it("erreur de chargement", async () => {
    (fetchAdvisorFollowup as any).mockRejectedValue(new Error("down"));
    renderPage();
    expect(await screen.findByText("Impossible de charger le tableau de bord.")).toBeInTheDocument();
  });
});
