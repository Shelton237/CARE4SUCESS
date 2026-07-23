// Tests unitaires — Admin — Demandes de bilan (/admin/requests)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacités couvertes : createRequest, updateRequestStatus (menu déroulant, glisser-déposer),
// navigation contextuelle vers /admin/matching depuis « Lancer le matching ».
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import AdminRequests from "@/pages/admin/Requests";
import { fetchRequests, updateRequestStatus, createRequest } from "@/api/backoffice";

const navigateSpy = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateSpy };
});

vi.mock("@/api/backoffice", () => ({
  fetchRequests: vi.fn(),
  updateRequestStatus: vi.fn(),
  createRequest: vi.fn(),
}));

const toastSpy = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: toastSpy }));

const REQUEST_RECU = {
  id: "req-1",
  parent: "Ngono Marie",
  child: "Junior Ngono",
  level: "Terminale",
  subject: "Maths",
  status: "reçu" as const,
  date: "2026-07-20",
  phone: "+237600000000",
};

const REQUEST_EN_TRAITEMENT = {
  ...REQUEST_RECU,
  id: "req-2",
  child: "Awa Diop",
  status: "en traitement" as const,
};

function renderRequests() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminRequests />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Admin Requests — Demandes de bilan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les demandes réparties par colonne (Kanban)", async () => {
    (fetchRequests as any).mockResolvedValue([REQUEST_RECU, REQUEST_EN_TRAITEMENT]);
    renderRequests();

    expect(await screen.findByText("Junior Ngono")).toBeInTheDocument();
    expect(screen.getByText("Awa Diop")).toBeInTheDocument();
  });

  it("erreur réseau : bannière d'erreur avec bouton Réessayer qui relance fetchRequests", async () => {
    (fetchRequests as any).mockRejectedValueOnce(new Error("Impossible de charger les demandes."));
    const user = userEvent.setup();
    renderRequests();

    expect(await screen.findByText("Impossible de charger les demandes.")).toBeInTheDocument();

    (fetchRequests as any).mockResolvedValueOnce([REQUEST_RECU]);
    await user.click(screen.getByRole("button", { name: /Réessayer/i }));

    expect(await screen.findByText("Junior Ngono")).toBeInTheDocument();
    expect(fetchRequests).toHaveBeenCalledTimes(2);
  });

  it("succès : changer le statut via le menu déroulant appelle updateRequestStatus", async () => {
    (fetchRequests as any).mockResolvedValue([REQUEST_RECU]);
    (updateRequestStatus as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderRequests();
    await screen.findByText("Junior Ngono");

    const select = screen.getByDisplayValue("Reçu");
    await user.selectOptions(select, "assigné");

    await waitFor(() => expect(updateRequestStatus).toHaveBeenCalledWith("req-1", "assigné"));
    await waitFor(() => expect(toastSpy.success).toHaveBeenCalled());
  });

  it("erreur réseau : échec de updateRequestStatus affiche un toast d'erreur", async () => {
    (fetchRequests as any).mockResolvedValue([REQUEST_RECU]);
    (updateRequestStatus as any).mockRejectedValue(new Error("Le serveur ne répond pas."));
    const user = userEvent.setup();
    renderRequests();
    await screen.findByText("Junior Ngono");

    const select = screen.getByDisplayValue("Reçu");
    await user.selectOptions(select, "clôturé");

    await waitFor(() => expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining("Le serveur ne répond pas.")));
  });

  it("lancer le matching : redirige vers /admin/matching avec le contexte de la demande", async () => {
    (fetchRequests as any).mockResolvedValue([REQUEST_EN_TRAITEMENT]);
    const user = userEvent.setup();
    renderRequests();
    await screen.findByText("Awa Diop");

    await user.click(screen.getByRole("button", { name: /Lancer le matching/i }));

    expect(navigateSpy).toHaveBeenCalledWith("/admin/matching", {
      state: { childName: "Awa Diop", level: "Terminale", subject: "Maths" },
    });
  });

  it("créer une demande : champs obligatoires manquants — le bouton de création reste désactivé", async () => {
    (fetchRequests as any).mockResolvedValue([]);
    const user = userEvent.setup();
    renderRequests();
    await waitFor(() => expect(fetchRequests).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Nouvelle demande/i }));
    expect(screen.getByRole("button", { name: /Créer la demande/i })).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/Ngono Marie/i), "Awa Ba");
    expect(screen.getByRole("button", { name: /Créer la demande/i })).toBeDisabled();
  });

  it("succès : créer une demande avec tous les champs requis appelle createRequest", async () => {
    (fetchRequests as any).mockResolvedValue([]);
    (createRequest as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderRequests();
    await waitFor(() => expect(fetchRequests).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Nouvelle demande/i }));
    await user.type(screen.getByPlaceholderText(/Ngono Marie/i), "Ba Fatou");
    await user.type(screen.getByPlaceholderText(/Junior Ngono/i), "Ibrahim Ba");
    await user.type(screen.getByPlaceholderText(/\+237/i), "+237611223344");

    const createBtn = screen.getByRole("button", { name: /Créer la demande/i });
    expect(createBtn).toBeEnabled();
    await user.click(createBtn);

    await waitFor(() => expect(createRequest).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy.success).toHaveBeenCalledWith("Demande créée avec succès"));
  });

  it("erreur réseau : échec de createRequest affiche un toast d'erreur et conserve la modale ouverte", async () => {
    (fetchRequests as any).mockResolvedValue([]);
    (createRequest as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderRequests();
    await waitFor(() => expect(fetchRequests).toHaveBeenCalled());

    await user.click(screen.getByRole("button", { name: /Nouvelle demande/i }));
    await user.type(screen.getByPlaceholderText(/Ngono Marie/i), "Ba Fatou");
    await user.type(screen.getByPlaceholderText(/Junior Ngono/i), "Ibrahim Ba");
    await user.type(screen.getByPlaceholderText(/\+237/i), "+237611223344");
    await user.click(screen.getByRole("button", { name: /Créer la demande/i }));

    await waitFor(() => expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining("Erreur serveur")));
    expect(screen.getByRole("heading", { name: "Nouvelle demande" })).toBeInTheDocument();
  });
});
