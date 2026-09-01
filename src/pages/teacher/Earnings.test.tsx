// Tests unitaires — Espace Enseignant — Mes Revenus (/teacher/earnings)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : lecture (fetchEarningsHistory, fetchTeacherEarnings) et documente
// l'absence de câblage du bouton "Exporter".
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TeacherEarnings from "@/pages/teacher/Earnings";
import { fetchEarningsHistory, fetchTeacherEarnings } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchEarningsHistory: vi.fn(),
  fetchTeacherEarnings: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

const HISTORY = [
  { month: "Mai", amount: 300000 },
  { month: "Juin", amount: 350000 },
];
const TRANSACTIONS = [
  { id: "tx-1234567", date: "2026-06-15", amount: 15000, student_name: "Jean Dupont", subject: "Mathématiques" },
];

function renderEarnings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherEarnings />
    </QueryClientProvider>
  );
}

describe("Mes Revenus Enseignant — /teacher/earnings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche le total perçu et l'historique des transactions", async () => {
    (fetchEarningsHistory as any).mockResolvedValue(HISTORY);
    (fetchTeacherEarnings as any).mockResolvedValue(TRANSACTIONS);

    renderEarnings();

    expect(await screen.findByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getAllByText(/650.000/).length).toBeGreaterThan(0); // total = 300000 + 350000
    expect(screen.getByText("Mathématiques")).toBeInTheDocument();
  });

  it("état vide : aucune transaction affiche un message dédié", async () => {
    (fetchEarningsHistory as any).mockResolvedValue([]);
    (fetchTeacherEarnings as any).mockResolvedValue([]);

    renderEarnings();

    expect(await screen.findByText(/Aucune transaction/i)).toBeInTheDocument();
  });

  it("erreur réseau : n'affiche pas de crash, retombe sur les valeurs par défaut", async () => {
    (fetchEarningsHistory as any).mockRejectedValue(new Error("Erreur réseau"));
    (fetchTeacherEarnings as any).mockRejectedValue(new Error("Erreur réseau"));

    renderEarnings();

    expect(await screen.findByText("Mes Revenus")).toBeInTheDocument();
    expect(screen.getByText(/Aucune transaction/i)).toBeInTheDocument();
  });

  it("affiche un indicateur de chargement pendant la requête", () => {
    (fetchEarningsHistory as any).mockImplementation(() => new Promise(() => {}));
    (fetchTeacherEarnings as any).mockImplementation(() => new Promise(() => {}));

    renderEarnings();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("bouton non câblé : \"Exporter\" n'a pas de gestionnaire sur la page Mes Revenus", async () => {
    const user = userEvent.setup();
    (fetchEarningsHistory as any).mockResolvedValue(HISTORY);
    (fetchTeacherEarnings as any).mockResolvedValue(TRANSACTIONS);

    renderEarnings();
    await screen.findByText("Jean Dupont");

    const exportButton = screen.getByRole("button", { name: /Exporter/i });
    expect(exportButton).toBeInTheDocument();

    // Absence de handler onClick dans src/pages/teacher/Earnings.tsx : le clic
    // ne déclenche aucun téléchargement ni aucune requête réseau supplémentaire.
    await user.click(exportButton);
    expect(fetchEarningsHistory).toHaveBeenCalledTimes(1);
    expect(fetchTeacherEarnings).toHaveBeenCalledTimes(1);
  });
});
