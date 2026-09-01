import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvisorReports from "@/pages/advisor/Reports";
import { fetchAdvisorFamilies, fetchRequests } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorFamilies: vi.fn(),
  fetchRequests: vi.fn(),
}));

const FAMILY = {
  id: "fam-1",
  parent: "Mme Ba",
  child: "Idris",
  level: "CM2",
  subject: "Mathématiques",
  teacher: "M. Diop",
  status: "suivi actif",
  nextRdv: "20/07/2026",
};

const REQUEST = {
  id: "req-1",
  parent: "M. Sy",
  child: "Awa",
  level: "3ème",
  subject: "Physique",
  phone: "+221 78 000 00 00",
  status: "reçu",
  date: "18/07/2026",
};

function renderReports() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdvisorReports />
    </QueryClientProvider>
  );
}

describe("AdvisorReports — Bilans pédagogiques", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    (fetchRequests as any).mockResolvedValue([REQUEST]);
  });

  it("succès : affiche les compteurs de bilans et les demandes actives", async () => {
    renderReports();
    expect(await screen.findByText("Idris")).toBeInTheDocument();
    expect(screen.getByText("Awa")).toBeInTheDocument();
    expect(screen.getByText(/demandes actives/)).toBeInTheDocument();
  });

  it("succès : le clic sur un bilan déplie la synthèse (parent, enseignant, type)", async () => {
    const user = userEvent.setup();
    renderReports();
    const reportRow = await screen.findByText("Idris");
    await user.click(reportRow);

    expect(await screen.findByText(/progresse sur/)).toBeInTheDocument();
  });

  it("erreur réseau : bannière d'erreur avec bouton Réessayer si les familles ou les demandes ne chargent pas", async () => {
    (fetchAdvisorFamilies as any).mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    renderReports();

    expect(await screen.findByText("Impossible de charger les données conseillers.")).toBeInTheDocument();

    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    await user.click(screen.getByText("Réessayer"));

    expect(await screen.findByText("Idris")).toBeInTheDocument();
  });

  it("état vide : messages appropriés si aucune famille ni aucune demande active", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([]);
    (fetchRequests as any).mockResolvedValue([]);
    renderReports();

    expect(await screen.findByText(/Aucune famille suivie pour l'instant/)).toBeInTheDocument();
    expect(screen.getByText("Toutes les demandes ont été traitées.")).toBeInTheDocument();
  });

  describe("Boutons non câblés (documentés par la cartographie — hors périmètre)", () => {
    it("« Nouveau bilan » n'a pas de handler câblé : le clic ne déclenche aucun appel réseau supplémentaire", async () => {
      const user = userEvent.setup();
      renderReports();
      await screen.findByText("Idris");

      const callsBefore = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;
      await user.click(screen.getByText("Nouveau bilan"));

      const callsAfter = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;
      expect(callsAfter).toBe(callsBefore);
    });

    it("« Continuer la rédaction » (bilan à rédiger) n'a pas de handler câblé", async () => {
      // mapFamilyStatusToReport("nouveau") => "à rédiger" (statut par défaut, ni "suivi actif" ni "matching")
      const A_REDIGER_FAMILY = { ...FAMILY, status: "nouveau" };
      (fetchAdvisorFamilies as any).mockResolvedValue([A_REDIGER_FAMILY]);
      const user = userEvent.setup();
      renderReports();
      const reportRow = await screen.findByText("Idris");
      await user.click(reportRow);

      const actionBtn = await screen.findByText("Continuer la rédaction");
      const callsBefore = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;
      await user.click(actionBtn);
      const callsAfter = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;

      expect(callsAfter).toBe(callsBefore);
      // Le contenu affiché reste inchangé après le clic : aucune navigation, aucune mutation.
      expect(screen.getByText("Continuer la rédaction")).toBeInTheDocument();
    });

    it("« Modifier le bilan » et « Envoyer au parent » n'ont pas de handler câblé pour un bilan rédigé", async () => {
      const REDIGE_FAMILY = { ...FAMILY, status: "suivi actif" }; // mapFamilyStatusToReport("suivi actif") => "rédigé"
      (fetchAdvisorFamilies as any).mockResolvedValue([REDIGE_FAMILY]);
      const user = userEvent.setup();
      renderReports();
      const reportRow = await screen.findByText("Idris");
      await user.click(reportRow);

      const modifyBtn = await screen.findByText("Modifier le bilan");
      const sendBtn = screen.getByText("Envoyer au parent");
      const callsBefore = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;

      await user.click(modifyBtn);
      await user.click(sendBtn);

      const callsAfter = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;
      expect(callsAfter).toBe(callsBefore);
    });

    it("« Traiter » (demande de bilan) n'a pas de handler câblé", async () => {
      const user = userEvent.setup();
      renderReports();
      const traiterBtn = await screen.findByText("Traiter");
      const callsBefore = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;

      await userEvent.setup().click(traiterBtn);

      const callsAfter = (fetchAdvisorFamilies as any).mock.calls.length + (fetchRequests as any).mock.calls.length;
      expect(callsAfter).toBe(callsBefore);
      // La demande reste affichée avec son statut initial : le clic n'a rien modifié.
      expect(screen.getByText("Awa")).toBeInTheDocument();
      expect(screen.getByText("reçu")).toBeInTheDocument();
    });
  });
});
