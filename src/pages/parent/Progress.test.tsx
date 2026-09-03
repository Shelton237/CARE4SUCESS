import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentProgress from "@/pages/parent/Progress";
import * as backoffice from "@/api/backoffice";

// Capacité "Progression" — cartographie Parent :
// lecture (fetchParentOverview, fetchProgressReport), "Bilan PDF" -> jsPDF

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: (...args: any[]) => toastSuccessSpy(...args),
    error: (...args: any[]) => toastErrorSpy(...args),
  },
}));

const savePdfSpy = vi.fn();
vi.mock("jspdf", () => {
  return {
    jsPDF: vi.fn().mockImplementation(function () {
      return {
        setFillColor: vi.fn(),
        rect: vi.fn(),
        setTextColor: vi.fn(),
        setFontSize: vi.fn(),
        setFont: vi.fn(),
        text: vi.fn(),
        save: savePdfSpy,
      };
    }),
  };
});

function renderProgress(initialEntries: string[] = ["/parent/progress"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ParentProgress />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [
  { id: "child-1", name: "Alice Dupont" },
  { id: "child-2", name: "Bob Dupont" },
];

const overview = {
  parentId: "parent-1", parentName: "Parent Test", studentId: "child-1", childName: "Alice Dupont",
  currentAvg: 15.5, previousAvg: 14, attendance: 96, sessionsThisMonth: 4, studyTime: 12, progression: "+8%",
  history: [{ name: "Mai", score: 14 }, { name: "Juin", score: 15.5 }],
};

const report = {
  childName: "Alice Dupont", parentName: "Parent Test", reportDate: "22/07/2026",
  attendance: 96, teacherComments: "Bonne progression générale.",
  weakPoints: "Grammaire à renforcer", recommendations: "Continuer les exercices ciblés.",
  grades: [
    { subject: "Maths", average: 16, count: 5 },
    { subject: "Français", average: 11, count: 4 },
  ],
};

describe("Parent > Progression", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    savePdfSpy.mockReset();
    toastSuccessSpy.mockReset();
    toastErrorSpy.mockReset();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchParentOverview").mockResolvedValue(overview as any);
    vi.spyOn(backoffice, "fetchProgressReport").mockResolvedValue(report as any);
  });

  it("succès : affiche les 4 indicateurs et le bilan mensuel automatique", async () => {
    renderProgress();

    await waitFor(() => expect(screen.getByText("15.5/20")).toBeInTheDocument());
    expect(screen.getByText("96%")).toBeInTheDocument();
    expect(screen.getByText("Bonne progression générale.")).toBeInTheDocument();
    expect(screen.getByText("Grammaire à renforcer")).toBeInTheDocument();
    expect(screen.getByText("Continuer les exercices ciblés.")).toBeInTheDocument();
  });

  it("succès : classe les matières maîtrisées (≥14) et les objectifs de progression (<14)", async () => {
    renderProgress();

    await waitFor(() => expect(screen.getByText("Maths")).toBeInTheDocument());
    // Maths (16) est maîtrisée, Français (11) est un objectif de progression
    const mathsBadge = screen.getByText("16/20");
    const francaisBadge = screen.getByText("11/20");
    expect(mathsBadge).toBeInTheDocument();
    expect(francaisBadge).toBeInTheDocument();
  });

  it("succès : « Bilan PDF » génère et télécharge le rapport complet", async () => {
    const user = userEvent.setup();
    renderProgress();

    await waitFor(() => expect(screen.getByText("Bilan PDF")).toBeInTheDocument());
    await user.click(screen.getByText("Bilan PDF"));

    expect(savePdfSpy).toHaveBeenCalled();
    expect(toastSuccessSpy).toHaveBeenCalledWith("Rapport téléchargé avec succès !");
  });

  it("erreur : un échec de génération du PDF affiche un toast d'erreur (pas de crash)", async () => {
    savePdfSpy.mockImplementationOnce(() => { throw new Error("Erreur PDF"); });
    const user = userEvent.setup();
    renderProgress();

    await waitFor(() => expect(screen.getByText("Bilan PDF")).toBeInTheDocument());
    await user.click(screen.getByText("Bilan PDF"));

    expect(toastErrorSpy).toHaveBeenCalledWith("Erreur lors de la génération du PDF.");
  });

  it("filtrage par enfant : le sélecteur multi-enfants relance la lecture de l'aperçu", async () => {
    const user = userEvent.setup();
    renderProgress();

    await waitFor(() => expect(screen.getByText("Bob")).toBeInTheDocument());
    await user.click(screen.getByText("Bob"));

    await waitFor(() => expect(backoffice.fetchParentOverview).toHaveBeenCalledWith("parent-1", "child-2"));
  });

  it("erreur réseau : dégrade gracieusement si fetchProgressReport échoue (pas de bilan affiché)", async () => {
    vi.spyOn(backoffice, "fetchProgressReport").mockRejectedValue(new Error("Erreur réseau"));
    renderProgress();

    await waitFor(() => expect(screen.getByText("15.5/20")).toBeInTheDocument());
    expect(screen.queryByText("Bilan Mensuel Automatique")).not.toBeInTheDocument();
  });

  it("erreur réseau : dégrade gracieusement si fetchParentOverview échoue (placeholders --/20)", async () => {
    vi.spyOn(backoffice, "fetchParentOverview").mockRejectedValue(new Error("Erreur réseau"));
    renderProgress();

    await waitFor(() => expect(screen.getByText("--/20")).toBeInTheDocument());
  });
});
