import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import TeacherDashboard from "@/pages/teacher/Dashboard";
import { fetchTeacherDashboard } from "@/api/backoffice";

// --- Mocks réseau systématiques ---
vi.mock("@/api/backoffice", () => ({
  fetchTeacherDashboard: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "teacher-1", name: "Mme Ngono", email: "ngono@care4success.cm", role: "teacher" },
  }),
}));

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeacherDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Tableau de bord Enseignant — /teacher", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les KPIs et les séances imminentes après chargement", async () => {
    (fetchTeacherDashboard as any).mockResolvedValue({
      stats: {
        monthlyEarnings: 100000,
        activeStudents: 5,
        avgGrade: "14/20",
        avgRating: "8.5",
        pendingHomework: 2,
        pendingReports: 1,
        totalSessions: 20,
      },
      schedule: [
        { id: "s1", day: "Lundi", date: "2026-07-27", time: "16:00", subject: "Mathématiques", student: "Jean Dupont" },
      ],
      students: [{ id: "st1", name: "Jean Dupont", avgGrade: "14" }],
    });

    renderDashboard();

    expect(await screen.findByText(/ESPACE MISSION/i)).toBeInTheDocument();
    expect(await screen.findByText("5")).toBeInTheDocument(); // apprenants actifs
    expect(screen.getAllByText(/Jean Dupont/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Vous avez 2 devoir\(s\) à évaluer\./)).toBeInTheDocument();
  });

  it("état vide : affiche les messages par défaut quand aucune donnée n'est retournée", async () => {
    (fetchTeacherDashboard as any).mockResolvedValue({ stats: {}, schedule: [], students: [] });

    renderDashboard();

    expect(await screen.findByText(/Aucune séance prévue/i)).toBeInTheDocument();
    expect(screen.getByText(/Aucun nouveau rendu à corriger\./i)).toBeInTheDocument();
    expect(screen.getByText(/Tous vos rapports sont à jour\./i)).toBeInTheDocument();
  });

  it("erreur réseau : n'affiche pas de crash et retombe sur les valeurs par défaut", async () => {
    (fetchTeacherDashboard as any).mockRejectedValue(new Error("Erreur réseau"));

    renderDashboard();

    // Le tableau de bord n'a pas de gestion d'erreur dédiée : il retombe sur stats={} par défaut.
    expect(await screen.findByText(/ESPACE MISSION/i)).toBeInTheDocument();
    expect(screen.getByText(/Aucune séance prévue/i)).toBeInTheDocument();
  });

  it("affiche un indicateur de chargement pendant la requête", () => {
    (fetchTeacherDashboard as any).mockImplementation(() => new Promise(() => {}));
    renderDashboard();
    expect(document.querySelector(".animate-spin")).toBeInTheDocument();
  });
});
