// Tests unitaires — Admin — Finance & Paie (/admin/finance)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacités couvertes : generateManualInvoices, lecture des KPIs/tableau de paie.
// Le bouton "Exporter" est explicitement documenté comme *non câblé* (aucun onClick) :
// voir le test de garde-fou dédié en fin de fichier.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminFinance from "@/pages/admin/Finance";
import { fetchFinanceSummary, fetchTeacherPayroll, generateManualInvoices } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchFinanceSummary: vi.fn(),
  fetchTeacherPayroll: vi.fn(),
  generateManualInvoices: vi.fn(),
}));

const toastSpy = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({
  toast: toastSpy,
}));

const SUMMARY = {
  totalBilled: 1_000_000,
  totalPaid: 800_000,
  totalTeacherExpenses: 400_000,
  margin: 400_000,
};

const PAYROLL = [
  { id: "t-1", name: "M. Dupont", rateType: "hourly", monthlyEarnings: 50_000, totalEarnings: 150_000 },
  { id: "t-2", name: "Mme Fall", rateType: "monthly", monthlyEarnings: 120_000, totalEarnings: 360_000 },
];

function renderFinance() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminFinance />
    </QueryClientProvider>
  );
}

describe("Admin Finance — Finance & Paie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les KPIs et le tableau de paie des enseignants", async () => {
    (fetchFinanceSummary as any).mockResolvedValue(SUMMARY);
    (fetchTeacherPayroll as any).mockResolvedValue(PAYROLL);
    renderFinance();

    expect(await screen.findByText("M. Dupont")).toBeInTheDocument();
    expect(screen.getByText("Mme Fall")).toBeInTheDocument();
    expect(screen.getByText("1 000 000 FCFA")).toBeInTheDocument();
    expect(screen.getByText("Forfait")).toBeInTheDocument();
    expect(screen.getByText("Horaire")).toBeInTheDocument();
  });

  it("erreur réseau : le chargement des KPIs échoue — valeurs par défaut affichées sans faire planter l'interface", async () => {
    (fetchFinanceSummary as any).mockRejectedValue(new Error("Erreur serveur"));
    (fetchTeacherPayroll as any).mockResolvedValue([]);
    renderFinance();

    // Comportement documenté : Finance.tsx n'a pas de bannière d'erreur (pas d'isError
    // exploité) ; en cas d'échec réseau, les KPIs retombent silencieusement à 0 FCFA.
    expect(await screen.findByText("FINANCE & PAIE")).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText("0 FCFA").length).toBeGreaterThan(0));
  });

  it("succès : générer les factures via generateManualInvoices affiche un toast de succès", async () => {
    (fetchFinanceSummary as any).mockResolvedValue(SUMMARY);
    (fetchTeacherPayroll as any).mockResolvedValue(PAYROLL);
    (generateManualInvoices as any).mockResolvedValue({ generated: 12, month: "Juillet 2026" });
    const user = userEvent.setup();
    renderFinance();
    await screen.findByText("M. Dupont");

    await user.click(screen.getByRole("button", { name: /Générer factures/i }));

    await waitFor(() => expect(generateManualInvoices).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy.success).toHaveBeenCalledWith(
      expect.stringContaining("12 nouvelles factures")
    ));
  });

  it("erreur réseau : generateManualInvoices en échec affiche un toast d'erreur", async () => {
    (fetchFinanceSummary as any).mockResolvedValue(SUMMARY);
    (fetchTeacherPayroll as any).mockResolvedValue(PAYROLL);
    (generateManualInvoices as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderFinance();
    await screen.findByText("M. Dupont");

    await user.click(screen.getByRole("button", { name: /Générer factures/i }));

    await waitFor(() => expect(generateManualInvoices).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy.error).toHaveBeenCalledWith(
      expect.stringContaining("Erreur lors de la génération")
    ));
  });

  it("garde-fou : le bouton 'Exporter' n'est pas câblé — aucun appel réseau au clic", async () => {
    (fetchFinanceSummary as any).mockResolvedValue(SUMMARY);
    (fetchTeacherPayroll as any).mockResolvedValue(PAYROLL);
    const user = userEvent.setup();
    renderFinance();
    await screen.findByText("M. Dupont");

    const exportButton = screen.getByRole("button", { name: /Exporter/i });
    await user.click(exportButton);

    // Ce test documente l'absence de handler (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md).
    // Il doit échouer si un onClick est câblé sans mise à jour de la cartographie —
    // dans ce cas, l'une des mutations/fetch ci-dessous serait invoquée par erreur.
    expect(generateManualInvoices).not.toHaveBeenCalled();
    expect(fetchFinanceSummary).toHaveBeenCalledTimes(1);
    expect(fetchTeacherPayroll).toHaveBeenCalledTimes(1);
  });
});
