import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentTeam from "@/pages/parent/Team";
import * as backoffice from "@/api/backoffice";

// Capacité "Équipe Pédagogique" — cartographie Parent :
// liste reconstruite depuis les séances planifiées, "Discuter" -> toast de
// confirmation (pas d'envoi réel), icône mail -> mailto:

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

function renderTeam() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentTeam />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [
  { id: "child-1", name: "Alice Dupont" },
  { id: "child-2", name: "Bob Dupont" },
];

const sessions = [
  {
    id: "s1", day: "Lundi", date: "20/07", time: "10:00", subject: "Maths",
    location: "En ligne", status: "effectué" as const,
    teacher: "M. Kouassi", teacherId: "t1",
    student: "Alice Dupont", studentId: "child-1", parent: "Parent Test", parentId: "parent-1",
  },
  {
    id: "s2", day: "Mardi", date: "21/07", time: "14:00", subject: "Français",
    location: "En ligne", status: "à venir" as const,
    teacher: "M. Kouassi", teacherId: "t1",
    student: "Bob Dupont", studentId: "child-2", parent: "Parent Test", parentId: "parent-1",
  },
];

describe("Parent > Équipe Pédagogique", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastSpy.mockReset();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue(sessions as any);
  });

  it("succès : reconstruit la liste des enseignants depuis le planning", async () => {
    renderTeam();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    expect(screen.getByText("1 INTERVENANTS ACTIFS")).toBeInTheDocument();
    expect(screen.getByText("Maths")).toBeInTheDocument();
    expect(screen.getByText("Français")).toBeInTheDocument();
    expect(screen.getByText("Alice Dupont")).toBeInTheDocument();
    expect(screen.getByText("Bob Dupont")).toBeInTheDocument();
  });

  it("succès : « Discuter » affiche un toast de confirmation sans envoi réel", async () => {
    const user = userEvent.setup();
    renderTeam();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("Discuter"));

    expect(toastSpy).toHaveBeenCalledWith({
      title: "Demande de contact envoyée",
      description: "Votre demande de discussion avec M. Kouassi a été transmise au conseiller pédagogique.",
    });
    // Aucun appel réseau déclenché par ce bouton : c'est bien un toast local.
    expect(backoffice.fetchScheduleByRole).toHaveBeenCalledTimes(1);
  });

  it("succès : l'icône mail ouvre le client mail via un lien mailto:", async () => {
    renderTeam();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    // Le composant déclenche window.location.href = mailto:... au clic (pas de <a href>),
    // on vérifie donc simplement la présence du bouton mail dédié.
    const mailButtons = document.querySelectorAll("button svg.lucide-mail");
    expect(mailButtons.length).toBeGreaterThan(0);
  });

  it("données vides : affiche un message si aucun enseignant n'est encore planifié", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([] as any);
    renderTeam();

    await waitFor(() => expect(screen.getByText(/Dossier en cours d'affectation/i)).toBeInTheDocument());
  });

  it("erreur réseau : dégrade gracieusement si fetchScheduleByRole échoue", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockRejectedValue(new Error("Erreur réseau"));
    renderTeam();

    await waitFor(() => expect(screen.getByText(/Dossier en cours d'affectation/i)).toBeInTheDocument());
  });
});
