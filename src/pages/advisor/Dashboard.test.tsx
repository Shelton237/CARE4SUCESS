import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvisorDashboard from "@/pages/advisor/Dashboard";
import { fetchAdvisorDashboard } from "@/api/backoffice";

// Mock réseau systématique : le module API est entièrement simulé, aucun vrai fetch.
vi.mock("@/api/backoffice", () => ({
  fetchAdvisorDashboard: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" },
    token: "fake-token",
  }),
}));

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdvisorDashboard />
    </QueryClientProvider>
  );
}

describe("AdvisorDashboard — Tableau de bord conseiller (lecture seule)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les 4 KPI, la liste des familles et les dernières demandes", async () => {
    (fetchAdvisorDashboard as any).mockResolvedValue({
      stats: {
        assignedFamilies: 12,
        pendingRequests: 3,
        matchingInProgress: 2,
        reportsThisMonth: 5,
        avgResponseTime: "6h",
      },
      families: [
        { id: "f1", child: "Awa", level: "3ème", teacher: "M. Diop", status: "suivi actif" },
      ],
      requests: [
        { id: "r1", parent: "Mme Ba", child: "Idris", level: "CM2", subject: "Maths", date: "2026-07-20", status: "reçu" },
      ],
    });

    renderDashboard();

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Awa")).toBeInTheDocument();
    expect(screen.getByText("Idris")).toBeInTheDocument();
    expect(screen.getByText("6h")).toBeInTheDocument();
    expect(fetchAdvisorDashboard).toHaveBeenCalledWith("advisor-1");
  });

  it("état vide : affiche les messages d'absence de données sans planter", async () => {
    (fetchAdvisorDashboard as any).mockResolvedValue({
      stats: { assignedFamilies: 0, pendingRequests: 0, matchingInProgress: 0, reportsThisMonth: 0, avgResponseTime: "—" },
      families: [],
      requests: [],
    });

    renderDashboard();

    expect(await screen.findByText("Aucune famille assignée.")).toBeInTheDocument();
    expect(screen.getByText("Aucune demande récente.")).toBeInTheDocument();
  });

  it("erreur réseau : affiche un message d'erreur si fetchAdvisorDashboard échoue", async () => {
    (fetchAdvisorDashboard as any).mockRejectedValue(new Error("Network Error"));

    renderDashboard();

    expect(await screen.findByText(/Erreur lors du chargement des données conseiller/i)).toBeInTheDocument();
  });

  it("page en lecture seule : aucune action d'écriture n'est exposée (pas de bouton de mutation)", async () => {
    (fetchAdvisorDashboard as any).mockResolvedValue({
      stats: { assignedFamilies: 1, pendingRequests: 0, matchingInProgress: 0, reportsThisMonth: 0, avgResponseTime: "1h" },
      families: [],
      requests: [],
    });

    renderDashboard();
    await screen.findByText("1");

    // Aucun bouton n'est rendu sur ce tableau de bord : conforme au périmètre "lecture seule".
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});
