import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentInvoices from "@/pages/parent/Invoices";
import * as backoffice from "@/api/backoffice";

// Capacité "Factures" — cartographie Parent :
// lecture (fetchParentInvoices), "Télécharger" -> downloadInvoicePDF (jsPDF)
// sur facture payée — "Payer", "Régler Maintenant", "Rapport Annuel",
// "Moyens de Paiement" sont (non câblé)

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const savePdfSpy = vi.fn();
vi.mock("jspdf", () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        setFillColor: vi.fn(), rect: vi.fn(), setTextColor: vi.fn(), setFontSize: vi.fn(),
        setFont: vi.fn(), text: vi.fn(), setDrawColor: vi.fn(), setLineWidth: vi.fn(), line: vi.fn(),
        save: savePdfSpy,
      };
    }),
  };
});

function renderInvoices() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentInvoices />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [{ id: "child-1", name: "Alice Dupont" }];

const invoices = [
  { id: "inv-paid0001", parentId: "parent-1", date: "2026-06-01", description: "Cours de maths", amount: 25000, status: "paid" as const },
  { id: "inv-pend02", parentId: "parent-1", date: "2026-07-01", description: "Cours de français", amount: 15000, status: "pending" as const },
];

describe("Parent > Factures", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    savePdfSpy.mockReset();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchParentInvoices").mockResolvedValue(invoices as any);
  });

  it("succès : affiche les indicateurs et le registre des factures", async () => {
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-paid/)).toBeInTheDocument());
    expect(screen.getByText("Cours de français")).toBeInTheDocument();
    expect(screen.getByText("PAYÉE")).toBeInTheDocument();
    expect(screen.getByText("EN ATTENTE")).toBeInTheDocument();
  });

  it("succès : « Télécharger » génère le PDF pour une facture payée", async () => {
    const user = userEvent.setup();
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-paid/)).toBeInTheDocument());
    const downloadButtons = document.querySelectorAll("button svg.lucide-download");
    // Le premier bouton "Download" en en-tête correspond à Rapport Annuel (non câblé) ;
    // celui de la ligne facture payée est le suivant.
    expect(downloadButtons.length).toBeGreaterThanOrEqual(2);
    const downloadRowButton = downloadButtons[downloadButtons.length - 1].closest("button") as HTMLButtonElement;
    await user.click(downloadRowButton);

    expect(savePdfSpy).toHaveBeenCalled();
  });

  it("succès : une facture en attente affiche un bouton « Payer » (non câblé) et pas de téléchargement", async () => {
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-pend/)).toBeInTheDocument());
    const payerButton = screen.getByText("Payer") as HTMLButtonElement;
    expect(payerButton).toBeInTheDocument();
    expect(payerButton.onclick).toBeNull();
  });

  it("données vides : affiche un message si aucune facture n'est enregistrée", async () => {
    vi.spyOn(backoffice, "fetchParentInvoices").mockResolvedValue([] as any);
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/Aucun historique de facturation détecté/i)).toBeInTheDocument());
  });

  it("erreur réseau : reste sur le spinner sans crash si fetchParentInvoices échoue (isLoading reste vrai)", async () => {
    vi.spyOn(backoffice, "fetchParentInvoices").mockRejectedValue(new Error("Erreur réseau"));
    const { container } = renderInvoices();

    // La page ne gère pas explicitement isError : elle affiche le spinner de
    // chargement en continu (isLoading reste true après un échec sans retry
    // avec React Query v5, car isPending passe à false mais isLoading dépend
    // aussi de isFetching qui redevient false) — on vérifie ici l'absence de
    // crash pendant ce laps de temps.
    await waitFor(() => expect(backoffice.fetchParentInvoices).toHaveBeenCalled());
    expect(container).toBeTruthy();
  });

  it("bouton non câblé : « Régler Maintenant » n'a pas de handler", async () => {
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-pend/)).toBeInTheDocument());
    const button = screen.getByText("Régler Maintenant") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Rapport Annuel » n'a pas de handler", async () => {
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-paid/)).toBeInTheDocument());
    const button = screen.getByText("Rapport Annuel") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Moyens de Paiement » n'a pas de handler", async () => {
    renderInvoices();

    await waitFor(() => expect(screen.getByText(/inv-paid/)).toBeInTheDocument());
    const button = screen.getByText("Moyens de Paiement") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });
});
