import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentFeedback from "@/pages/parent/Feedback";
import * as backoffice from "@/api/backoffice";

// Capacité "Avis profs" — cartographie Parent :
// dépôt d'avis (TeacherFeedbackForm, rôle "parent") -> POST /teacher-feedback,
// lecture du classement (fetchTeacherRatings) via TeacherRatingsBoard.

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

function renderFeedback() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentFeedback />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const sessions = [
  {
    id: "s1", day: "Lundi", date: "20/07", time: "10:00", subject: "Maths",
    location: "En ligne", status: "effectué" as const,
    teacher: "M. Kouassi", teacherId: "t1", teacherName: "M. Kouassi",
    student: "Alice Dupont", studentId: "child-1", parent: "Parent Test", parentId: "parent-1",
  },
];

const ratings = [
  { teacherId: "t1", teacherName: "M. Kouassi", averageRating: 4.5, reviewCount: 3, lastReviewAt: "2026-07-01T00:00:00.000Z" },
];

describe("Parent > Avis profs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastSpy.mockReset();
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue(sessions as any);
    vi.spyOn(backoffice, "fetchTeacherRatings").mockResolvedValue(ratings as any);
    vi.spyOn(backoffice, "fetchTeacherFeedback").mockResolvedValue([] as any);
    vi.spyOn(backoffice, "submitTeacherFeedback").mockResolvedValue({
      id: "fb1", teacherId: "t1", teacherName: "M. Kouassi", reviewerName: "Parent Test",
      reviewerType: "parent", rating: 5, comment: "Très bien", createdAt: "2026-07-23T00:00:00.000Z",
    } as any);
  });

  it("succès : affiche le formulaire d'avis pré-rempli avec l'enseignant du planning et le classement", async () => {
    renderFeedback();

    await waitFor(() => expect(screen.getByText("Avis & Satisfaction")).toBeInTheDocument());
    expect(await screen.findByText("Déposer un témoignage")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "M. KOUASSI" })).toBeInTheDocument();
    expect(await screen.findByText("Palmarès de l'Équipe")).toBeInTheDocument();
  });

  it("succès : soumet un avis (note + commentaire) via submitTeacherFeedback en rôle parent", async () => {
    const user = userEvent.setup();
    renderFeedback();

    await waitFor(() => expect(screen.getByRole("option", { name: "M. KOUASSI" })).toBeInTheDocument());

    const textarea = screen.getByPlaceholderText(/Pédagogie active/i);
    await user.type(textarea, "Très bien");
    await user.click(screen.getByText("Soumettre mon évaluation"));

    await waitFor(() => expect(backoffice.submitTeacherFeedback).toHaveBeenCalled());
    expect((backoffice.submitTeacherFeedback as any).mock.calls[0][0]).toMatchObject({
      teacherId: "t1",
      teacherName: "M. Kouassi",
      reviewerName: "Parent Test",
      reviewerType: "parent",
      rating: 5,
      comment: "Très bien",
    });
    expect(toastSpy).toHaveBeenCalledWith({
      title: "Merci pour votre évaluation",
      description: "Votre retour a bien été enregistré.",
    });
  });

  it("succès : la note (étoiles) est modifiable avant soumission", async () => {
    const user = userEvent.setup();
    renderFeedback();

    await waitFor(() => expect(screen.getByRole("option", { name: "M. KOUASSI" })).toBeInTheDocument());

    const starButtons = document.querySelectorAll("button svg.lucide-star");
    // Sélectionne la 3ème étoile (note = 3)
    await user.click((starButtons[2] as SVGElement).closest("button")!);
    await user.click(screen.getByText("Soumettre mon évaluation"));

    await waitFor(() => expect(backoffice.submitTeacherFeedback).toHaveBeenCalled());
    expect((backoffice.submitTeacherFeedback as any).mock.calls[0][0]).toMatchObject({ rating: 3 });
  });

  it("champs obligatoires : le commentaire est optionnel, la note par défaut (5) suffit à soumettre l'avis", async () => {
    const user = userEvent.setup();
    renderFeedback();

    await waitFor(() => expect(screen.getByRole("option", { name: "M. KOUASSI" })).toBeInTheDocument());
    await user.click(screen.getByText("Soumettre mon évaluation"));

    await waitFor(() => expect(backoffice.submitTeacherFeedback).toHaveBeenCalled());
    expect((backoffice.submitTeacherFeedback as any).mock.calls[0][0]).toMatchObject({ rating: 5, comment: "" });
  });

  it("validation échouée : sans enseignant planifié, le formulaire est désactivé et n'appelle pas l'API", async () => {
    vi.spyOn(backoffice, "fetchScheduleByRole").mockResolvedValue([] as any);
    renderFeedback();

    await waitFor(() => expect(
      screen.getByText(/Aucun professeur n'est encore planifié pour votre famille/i)
    ).toBeInTheDocument());
    expect(backoffice.submitTeacherFeedback).not.toHaveBeenCalled();
  });

  it("erreur réseau : un toast d'erreur s'affiche si submitTeacherFeedback échoue", async () => {
    vi.spyOn(backoffice, "submitTeacherFeedback").mockRejectedValue(new Error("Erreur réseau"));
    const user = userEvent.setup();
    renderFeedback();

    await waitFor(() => expect(screen.getByRole("option", { name: "M. KOUASSI" })).toBeInTheDocument());
    await user.click(screen.getByText("Soumettre mon évaluation"));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith({
      title: "Erreur",
      description: "Erreur réseau",
      variant: "destructive",
    }));
  });

  it("données vides : le classement affiche un message si aucun avis n'est disponible", async () => {
    vi.spyOn(backoffice, "fetchTeacherRatings").mockResolvedValue([] as any);
    renderFeedback();

    await waitFor(() => expect(
      screen.getByText(/Audit de satisfaction non disponible pour le moment/i)
    ).toBeInTheDocument());
    expect(await screen.findByText(/Soyez le premier parent à évaluer l'équipe/i)).toBeInTheDocument();
  });

  it("erreur réseau : le classement dégrade gracieusement si fetchTeacherRatings échoue", async () => {
    vi.spyOn(backoffice, "fetchTeacherRatings").mockRejectedValue(new Error("Erreur réseau"));
    renderFeedback();

    await waitFor(() => expect(
      screen.getByText(/Audit de satisfaction non disponible pour le moment/i)
    ).toBeInTheDocument());
  });
});
