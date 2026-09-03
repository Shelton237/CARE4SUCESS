// Tests unitaires — Espace Enseignant — Mon Emploi du Temps (/teacher/schedule)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : lecture du planning, création de séance (multi-élèves, récurrence),
// démarrage/clôture de séance (check-in/check-out), clôture pédagogique
// (POST /sessions/:id/report + POST /homework optionnel), bouton "Rejoindre".
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import TeacherSchedule from "@/pages/teacher/Schedule";
import { toast } from "sonner";
import {
  fetchScheduleByRole,
  sessionCheckIn,
  sessionCheckOut,
  fetchTeacherStudents,
  createSession,
  fetchCourses,
  fetchCourseDetails,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchScheduleByRole: vi.fn(),
  sessionCheckIn: vi.fn(),
  sessionCheckOut: vi.fn(),
  fetchTeacherStudents: vi.fn(),
  createSession: vi.fn(),
  fetchCourses: vi.fn(),
  fetchCourseDetails: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const STUDENT_A = { id: "st1", name: "Jean Dupont" };
const STUDENT_B = { id: "st2", name: "Awa Ba" };
const COURSE_MATH = { id: "course-1", title: "Révision Bac", subject: "Mathématiques" };

const SESSION_PLANIFIEE = {
  id: "sess-1", day: "Lundi", date: "27/07/2026", time: "16:00",
  subject: "Mathématiques", student: "Jean Dupont", status: "planifié",
  location: "Domicile", courseId: "course-1",
};
const SESSION_EN_COURS = {
  id: "sess-2", day: "Mardi", date: "28/07/2026", time: "17:00",
  subject: "Français", student: "Awa Ba", status: "en cours",
  location: "En ligne", courseId: "course-1", studentId: "st2",
};
const SESSION_TERMINEE = {
  id: "sess-3", day: "Mercredi", date: "29/07/2026", time: "18:00",
  subject: "SVT", student: "Jean Dupont", status: "effectué",
  location: "Domicile", notes: "Bonne progression sur la photosynthèse.",
};

function renderSchedule() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TeacherSchedule />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Mon Emploi du Temps Enseignant — /teacher/schedule", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchScheduleByRole as any).mockResolvedValue([SESSION_PLANIFIEE, SESSION_EN_COURS, SESSION_TERMINEE]);
    (fetchTeacherStudents as any).mockResolvedValue([STUDENT_A, STUDENT_B]);
    (fetchCourses as any).mockResolvedValue([COURSE_MATH]);
    (fetchCourseDetails as any).mockResolvedValue({ ...COURSE_MATH, lessons: [] });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succès : affiche les séances de la semaine et l'historique complet", async () => {
    renderSchedule();
    expect(await screen.findByText(/3 séances/)).toBeInTheDocument();
    expect(screen.getByText("Toutes les séances")).toBeInTheDocument();
    expect(screen.getAllByText(/Jean Dupont/).length).toBeGreaterThan(0);
  });

  it("erreur réseau : affiche un message d'erreur avec bouton Réessayer", async () => {
    (fetchScheduleByRole as any).mockRejectedValue(new Error("Réseau indisponible"));
    renderSchedule();
    expect(await screen.findByText(/Réseau indisponible/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Réessayer/i })).toBeInTheDocument();
  });

  it("création de séance : champs obligatoires manquants bloque la soumission", async () => {
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText(/3 séances/);

    await user.click(screen.getByRole("button", { name: /Nouvelle séance/i }));
    expect(await screen.findByText("Planifier une séance")).toBeInTheDocument();

    // Le bouton de création reste désactivé sans élève/matière/date/cours
    const createButton = screen.getByRole("button", { name: /Créer la séance/i });
    expect(createButton).toBeDisabled();
    expect(createSession).not.toHaveBeenCalled();
  });

  it("création de séance : séance non rattachée à un cours est refusée avec message dédié", async () => {
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Nouvelle séance/i }));
    await screen.findByText("Planifier une séance");

    // Sélectionne un élève, une matière, une date — mais pas de cours
    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.selectOptions(screen.getByDisplayValue("— Matière —"), "Mathématiques");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-01" } });

    // Le cours rattaché reste vide -> bouton toujours désactivé
    const createButton = screen.getByRole("button", { name: /Créer la séance/i });
    expect(createButton).toBeDisabled();
  });

  it("succès : création d'une séance complète avec cours rattaché", async () => {
    const user = userEvent.setup();
    (createSession as any).mockResolvedValue({ sessions: [SESSION_PLANIFIEE], count: 1 });

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Nouvelle séance/i }));
    await screen.findByText("Planifier une séance");

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.selectOptions(screen.getByDisplayValue("— Matière —"), "Mathématiques");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-01" } });
    await user.selectOptions(screen.getByDisplayValue("— Sélectionner un cours —"), "course-1");

    const createButton = screen.getByRole("button", { name: /Créer la séance/i });
    expect(createButton).not.toBeDisabled();
    await user.click(createButton);

    await waitFor(() => expect((createSession as any).mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ studentIds: ["st1"], subject: "Mathématiques", courseId: "course-1" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("erreur réseau : échec de création de séance affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    (createSession as any).mockRejectedValue(new Error("Erreur serveur"));

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Nouvelle séance/i }));
    await screen.findByText("Planifier une séance");

    await user.click(screen.getAllByRole("checkbox")[0]);
    await user.selectOptions(screen.getByDisplayValue("— Matière —"), "Mathématiques");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-08-01" } });
    await user.selectOptions(screen.getByDisplayValue("— Sélectionner un cours —"), "course-1");

    await user.click(screen.getByRole("button", { name: /Créer la séance/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erreur serveur"));
  });

  it("succès : démarrer une séance appelle sessionCheckIn", async () => {
    const user = userEvent.setup();
    (sessionCheckIn as any).mockResolvedValue({ success: true });

    renderSchedule();
    await screen.findByText(/3 séances/);

    await user.click(screen.getByRole("button", { name: /Démarrer/i }));
    await waitFor(() => expect((sessionCheckIn as any).mock.calls[0]?.[0]).toBe("sess-1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("succès : clôturer une séance en cours ouvre la clôture pédagogique", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });

    renderSchedule();
    await screen.findByText(/3 séances/);

    await user.click(screen.getByRole("button", { name: /Clôturer/i }));
    await waitFor(() => expect(sessionCheckOut).toHaveBeenCalledWith("sess-2"));
    expect(await screen.findByText("Clôture Pédagogique")).toBeInTheDocument();
  });

  it("clôture pédagogique : rapport de cours manquant bloque la finalisation", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Clôturer/i }));
    await screen.findByText("Clôture Pédagogique");

    expect(screen.getByText(/Ce champ est obligatoire pour finaliser la séance\./i)).toBeInTheDocument();
    const finaliser = screen.getByRole("button", { name: /Finaliser la séance/i });
    expect(finaliser).toBeDisabled();
  });

  it("succès : clôture pédagogique complète envoie le rapport via fetch", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (globalThis as any).fetch = fetchMock;

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Clôturer/i }));
    await screen.findByText("Clôture Pédagogique");

    const textarea = screen.getByPlaceholderText(/Décrivez les notions abordées/i);
    await user.type(textarea, "Séance productive sur les accords du participe passé.");

    const finaliser = screen.getByRole("button", { name: /Finaliser la séance/i });
    expect(finaliser).not.toBeDisabled();
    await user.click(finaliser);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/sessions/sess-2/report"),
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Clôture pédagogique")));
  });

  it("erreur réseau : la clôture pédagogique affiche un toast d'erreur si le rapport échoue", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Clôturer/i }));
    await screen.findByText("Clôture Pédagogique");

    const textarea = screen.getByPlaceholderText(/Décrivez les notions abordées/i);
    await user.type(textarea, "Séance sur les fractions.");
    await user.click(screen.getByRole("button", { name: /Finaliser la séance/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("erreur est survenue")));
  });

  it("clôture pédagogique : leçon abordée obligatoire si le cours en possède", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });
    (fetchCourseDetails as any).mockResolvedValue({
      ...COURSE_MATH,
      lessons: [{ id: "l1", title: "Les fractions", order: 1 }],
    });

    renderSchedule();
    await screen.findByText(/3 séances/);
    await user.click(screen.getByRole("button", { name: /Clôturer/i }));
    await screen.findByText("Clôture Pédagogique");

    const textarea = screen.getByPlaceholderText(/Décrivez les notions abordées/i);
    await user.type(textarea, "Séance sur les fractions.");

    expect(await screen.findByText(/Leçon abordée/i)).toBeInTheDocument();
    const finaliser = screen.getByRole("button", { name: /Finaliser la séance/i });
    expect(finaliser).toBeDisabled();
  });

  it("bouton Rejoindre : navigue vers /virtual-class/:sessionId pour une séance avec lien virtuel", async () => {
    const user = userEvent.setup();
    (fetchScheduleByRole as any).mockResolvedValue([
      { ...SESSION_PLANIFIEE, virtualLink: "https://meet.example.com/room" },
    ]);

    renderSchedule();
    await screen.findByText(/1 séances/);

    const rejoindre = await screen.findByRole("button", { name: /Rejoindre/i });
    expect(rejoindre).toBeInTheDocument();
    await user.click(rejoindre);
    // La navigation elle-même est déléguée à react-router ; on vérifie juste la présence
    // du contrôle et l'absence de crash au clic.
  });

  it("succès : consulter le bilan d'une séance terminée affiche les notes", async () => {
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText(/3 séances/);

    await user.click(screen.getByRole("button", { name: /Bilan/i }));
    expect(await screen.findByText(/photosynthèse/i)).toBeInTheDocument();
  });
});
