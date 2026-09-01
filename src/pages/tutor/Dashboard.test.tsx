// Tests unitaires — Espace Tuteur natif — Tableau de bord (/tutor)
// Périmètre : actor-tutor (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Tuteur).
// Capacité en lecture seule (GET /tutor/dashboard) : pas de formulaire, donc pas de
// scénario "validation échouée" / "champs obligatoires manquants" applicable ici
// (voir coverage/unit/tutor.md).
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TutorDashboard from "@/pages/tutor/Dashboard";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "u1", name: "Aïcha Tuteur", role: "tutor" },
    token: "fake-tutor-token",
  }),
}));

function renderDashboard() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TutorDashboard />
    </QueryClientProvider>
  );
}

describe("Tuteur — Tableau de bord (/tutor)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("succès : affiche les 4 cartes de statistiques et le tableau des candidatures récentes", async () => {
    const mockData = {
      stats: { pendingCount: 3, interviewCount: 2, approvedCount: 5, evalCount: 4 },
      recentApplications: [
        {
          id: "a1",
          full_name: "Jean Dupont",
          subjects: ["Mathématiques", "Physique-Chimie"],
          experience_years: 4,
          status: "pending",
          created_at: "2026-01-10T00:00:00.000Z",
        },
      ],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockData,
    }) as unknown as typeof fetch;

    renderDashboard();

    await waitFor(() => expect(screen.getByText("Jean Dupont")).toBeInTheDocument());

    expect(screen.getByText("3")).toBeInTheDocument(); // en attente
    expect(screen.getByText("2")).toBeInTheDocument(); // entretiens planifiés
    expect(screen.getByText("5")).toBeInTheDocument(); // approuvés
    expect(screen.getByText("4")).toBeInTheDocument(); // évaluations
    expect(screen.getByText(/Mathématiques, Physique-Chimie/i)).toBeInTheDocument();
    // "En attente" apparaît deux fois (carte statistique + badge de statut de la ligne)
    expect(screen.getAllByText(/En attente/i).length).toBe(2);

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/tutor/dashboard"),
      expect.objectContaining({
        headers: { Authorization: "Bearer fake-tutor-token" },
      })
    );
  });

  it("erreur réseau : retombe sur des statistiques à zéro et une liste vide sans planter", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as unknown as typeof fetch;

    renderDashboard();

    await waitFor(() => expect(screen.getByText(/Aucune candidature/i)).toBeInTheDocument());
    // Les 4 cartes retombent sur 0 (stats = {} par défaut faute de données)
    expect(screen.getAllByText("0").length).toBe(4);
  });

  it("erreur réseau (fetch rejeté) : n'affiche pas de crash et garde l'UI stable", async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch;

    renderDashboard();

    await waitFor(() => expect(screen.getByText(/Aucune candidature/i)).toBeInTheDocument());
    expect(screen.getByText(/Tableau de bord Tuteur/i)).toBeInTheDocument();
  });
});
