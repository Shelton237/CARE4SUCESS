// Tests unitaires — Admin — Géographie & Zones (/admin/geography)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacité couverte : validateGeoLocation (action "validate" ou "reject").
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminGeography from "@/pages/admin/Geography";
import { fetchPendingGeoLocations, validateGeoLocation } from "@/api/geo";

vi.mock("@/api/geo", () => ({
  fetchPendingGeoLocations: vi.fn(),
  validateGeoLocation: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "admin-1", name: "Admin Care4Success", email: "admin@care4success.cm", role: "admin" } }),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const PENDING_LOCATION = {
  id: 42,
  name: "Bonapriso",
  type: "quartier" as const,
  parent_id: 10,
  status: "pending" as const,
  suggested_by: "parent@example.com",
  created_at: "2026-07-01T00:00:00.000Z",
  parent_name: "Douala 3ème",
  parent_type: "arrondissement" as const,
};

function renderGeography() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminGeography />
    </QueryClientProvider>
  );
}

describe("Admin Geography — Géographie & Zones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les suggestions de zones en attente", async () => {
    (fetchPendingGeoLocations as any).mockResolvedValue([PENDING_LOCATION]);
    renderGeography();

    expect(await screen.findByText("Bonapriso")).toBeInTheDocument();
    expect(screen.getByText("Quartier")).toBeInTheDocument();
    expect(screen.getByText(/Suggéré par/)).toBeInTheDocument();
    expect(screen.getByText("Douala 3ème")).toBeInTheDocument();
  });

  it("état vide : aucune suggestion en attente", async () => {
    (fetchPendingGeoLocations as any).mockResolvedValue([]);
    renderGeography();

    expect(await screen.findByText("Aucune suggestion en attente.")).toBeInTheDocument();
  });

  it("succès : valider une suggestion appelle validateGeoLocation avec l'action 'validate'", async () => {
    (fetchPendingGeoLocations as any).mockResolvedValue([PENDING_LOCATION]);
    (validateGeoLocation as any).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderGeography();
    await screen.findByText("Bonapriso");

    await user.click(screen.getByRole("button", { name: /Valider/i }));

    await waitFor(() => expect(validateGeoLocation).toHaveBeenCalledWith(
      42, "validate", "Admin Care4Success"
    ));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Zone validée" })
    ));
  });

  it("succès : rejeter une suggestion appelle validateGeoLocation avec l'action 'reject'", async () => {
    (fetchPendingGeoLocations as any).mockResolvedValue([PENDING_LOCATION]);
    (validateGeoLocation as any).mockResolvedValue({ success: true });
    const user = userEvent.setup();
    renderGeography();
    await screen.findByText("Bonapriso");

    await user.click(screen.getByRole("button", { name: /Rejeter/i }));

    await waitFor(() => expect(validateGeoLocation).toHaveBeenCalledWith(
      42, "reject", "Admin Care4Success"
    ));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Suggestion rejetée" })
    ));
  });

  it("erreur réseau : validateGeoLocation en échec affiche un toast d'erreur", async () => {
    (fetchPendingGeoLocations as any).mockResolvedValue([PENDING_LOCATION]);
    (validateGeoLocation as any).mockRejectedValue(new Error("Le serveur ne répond pas."));
    const user = userEvent.setup();
    renderGeography();
    await screen.findByText("Bonapriso");

    await user.click(screen.getByRole("button", { name: /Valider/i }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Erreur", description: "Le serveur ne répond pas.", variant: "destructive" })
    ));
  });

  it("erreur réseau (chargement) : comportement documenté — l'échec de fetchPendingGeoLocations affiche l'état vide, sans bannière d'erreur dédiée", async () => {
    (fetchPendingGeoLocations as any).mockRejectedValue(new Error("Erreur serveur"));
    renderGeography();

    // Geography.tsx n'exploite pas isError de useQuery : la liste retombe sur son
    // défaut ([]) et affiche le même message que l'état "aucune suggestion".
    expect(await screen.findByText("Aucune suggestion en attente.")).toBeInTheDocument();
  });
});
