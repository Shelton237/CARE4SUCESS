import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentSchedule from "@/pages/parent/Schedule";
import * as backoffice from "@/api/backoffice";

// Capacité "Planning" — cartographie Parent :
// filtrage par enfant (via l'URL), "Rapport" (lecture bilan de séance),
// "Avis" -> POST /api/session-feedback (note 1-5 + commentaire)

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

function renderSchedule(initialEntries: string[] = ["/parent/schedule"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ParentSchedule />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const pastSession = {
  id: "s1", day: "Lundi", date: "20/07", time: "10:00", subject: "Maths",
  location: "En ligne", status: "effectué" as const,
  teacher: "M. Kouassi", teacherId: "t1", notes: "Bon travail sur les fractions.",
  student: "Alice Dupont", studentId: "child-1", parent: "Parent Test", parentId: "parent-1",
};

const upcomingSession = {
  id: "s2", day: "Mardi", date: "21/07", time: "14:00", subject: "Français",
  location: "En ligne", status: "à venir" as const,
  teacher: "Mme Diallo", teacherId: "t2",
  student: "Bob Dupont", studentId: "child-2", parent: "Parent Test", parentId: "parent-1",
};

describe("Parent > Planning", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = vi.fn();
  });

  it("succès : affiche les séances de la famille et le badge de comptage", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession, upcomingSession] as any);
    renderSchedule();

    await waitFor(() => expect(screen.getByText("2 Séances")).toBeInTheDocument());
    expect(screen.getByText("Vue d'ensemble familiale")).toBeInTheDocument();
  });

  it("filtrage par enfant : le paramètre studentId de l'URL restreint le planning affiché", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession, upcomingSession] as any);
    renderSchedule(["/parent/schedule?studentId=child-1"]);

    await waitFor(() => expect(screen.getByText("1 Séances")).toBeInTheDocument());
    expect(
      screen.getByRole("heading", { name: /Planning\s+Alice Dupont/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/Historique de l'élève/i)).toBeInTheDocument();
  });

  it("succès : « Rapport » ouvre la modale de bilan de séance en lecture", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession] as any);
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => expect(screen.getAllByText("Rapport").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Rapport")[0]);

    expect(await screen.findByText("Bilan de séance")).toBeInTheDocument();
    expect(screen.getByText(/Bon travail sur les fractions\./)).toBeInTheDocument();
  });

  it("succès : « Avis » soumet une note et un commentaire via POST /api/session-feedback", async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession] as any);
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => expect(screen.getAllByText("Avis").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Avis")[0]);

    expect(await screen.findByText("Votre avis sur la séance")).toBeInTheDocument();
    // Note par défaut 5/5, on ajoute un commentaire
    await user.type(screen.getByPlaceholderText(/Votre retour sur le cours/i), "Très bonne séance");
    await user.click(screen.getByText("Soumettre mon avis"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/session-feedback"),
      expect.objectContaining({ method: "POST" })
    ));
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ sessionId: "s1", rating: 5, comment: "Très bonne séance" });
  });

  it("champs obligatoires : le commentaire est optionnel, la note par défaut (5) suffit à soumettre l'avis", async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: true, json: async () => ({}) });
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession] as any);
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => expect(screen.getAllByText("Avis").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Avis")[0]);
    await screen.findByText("Votre avis sur la séance");

    await user.click(screen.getByText("Soumettre mon avis"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body).toMatchObject({ rating: 5, comment: null });
  });

  it("erreur réseau : l'échec de la soumission d'avis n'invalide pas le planning et ne referme pas la modale", async () => {
    (globalThis.fetch as any).mockResolvedValue({ ok: false });
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([pastSession] as any);
    const user = userEvent.setup();
    renderSchedule();

    await waitFor(() => expect(screen.getAllByText("Avis").length).toBeGreaterThan(0));
    await user.click(screen.getAllByText("Avis")[0]);
    await screen.findByText("Votre avis sur la séance");
    await user.click(screen.getByText("Soumettre mon avis"));

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    // La modale reste affichée : l'échec n'a pas de gestion de succès qui la ferme
    expect(screen.getByText("Votre avis sur la séance")).toBeInTheDocument();
  });

  it("erreur réseau : le planning affiche un message et permet de réessayer si fetchScheduleByRole échoue", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockRejectedValue(new Error("Impossible de charger le planning."));
    renderSchedule();

    await waitFor(() => expect(screen.getByText("Impossible de charger le planning.")).toBeInTheDocument());
    expect(screen.getByText("Réessayer")).toBeInTheDocument();
  });
});
