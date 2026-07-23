import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import userEvent from "@testing-library/user-event";
import AdminDashboard from "@/pages/admin/Dashboard";

// recharts (ResponsiveContainer) a besoin de ResizeObserver, absent de jsdom.
if (typeof (globalThis as any).ResizeObserver === "undefined") {
  (globalThis as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Capacité admin : Tableau de bord (/admin) — lecture seule, refetch en cas d'erreur.
// Source : docs/CARTOGRAPHIE_FONCTIONNELLE.md#admin

const mocks = vi.hoisted(() => ({
  fetchAdminDashboard: vi.fn(),
  fetchTeacherRatings: vi.fn(),
  fetchTeacherFeedback: vi.fn(),
}));

vi.mock("@/api/backoffice", () => mocks);

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", role: "admin", name: "Admin Care4Success" },
  }),
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const baseDashboard = {
  stats: {
    totalTeachers: 12,
    activeStudents: 48,
    pendingRequests: 5,
    monthlyRevenue: 1_200_000,
    previousRevenue: 1_000_000,
    satisfactionRate: 4.5,
    newFamiliesThisMonth: 3,
    occupancyRate: 70,
    activeTeachersThisMonth: 9,
    leadsThisMonth: 6,
  },
  monthlyRevenue: [{ month: "Jan", amount: 500_000 }],
  revenueBySubject: [{ subject: "Maths", amount: 300_000 }],
  latestRequests: [
    { id: "r1", parent: "Ngono Marie", child: "Junior Ngono", level: "Terminale", subject: "Maths", status: "reçu", date: "2026-07-20" },
  ],
};

describe("Admin Dashboard — tableau de bord (lecture seule)", () => {
  beforeEach(() => {
    mocks.fetchAdminDashboard.mockReset();
    mocks.fetchTeacherRatings.mockReset().mockResolvedValue([]);
    mocks.fetchTeacherFeedback.mockReset().mockResolvedValue([]);
  });

  it("succès : affiche les KPIs et les dernières demandes issus de fetchAdminDashboard", async () => {
    mocks.fetchAdminDashboard.mockResolvedValueOnce(baseDashboard);
    renderDashboard();

    expect(await screen.findByText("Tableau de bord")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText("12")).toBeInTheDocument());
    expect(screen.getByText("48")).toBeInTheDocument();
    expect(screen.getByText("Junior Ngono")).toBeInTheDocument();
  });

  it("erreur réseau : affiche un message d'erreur et permet de relancer via Réessayer (refetch)", async () => {
    mocks.fetchAdminDashboard.mockRejectedValueOnce(new Error("network down"));
    renderDashboard();

    expect(await screen.findByText(/Impossible de récupérer les statistiques/i)).toBeInTheDocument();
    expect(mocks.fetchAdminDashboard).toHaveBeenCalledTimes(1);

    mocks.fetchAdminDashboard.mockResolvedValueOnce(baseDashboard);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Réessayer/i }));

    await waitFor(() => expect(mocks.fetchAdminDashboard).toHaveBeenCalledTimes(2));
    expect(await screen.findByText("Junior Ngono")).toBeInTheDocument();
  });

  it("pas de formulaire sur cette page : aucune action d'écriture n'est exposée (capacité lecture seule)", async () => {
    mocks.fetchAdminDashboard.mockResolvedValueOnce(baseDashboard);
    renderDashboard();
    await screen.findByText("Tableau de bord");
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /créer|ajouter|enregistrer/i })).not.toBeInTheDocument();
  });
});
