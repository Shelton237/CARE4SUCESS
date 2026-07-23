// Tests unitaires — Classe Virtuelle (/virtual-class/:sessionId)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Route non restreinte par rôle (src/pages/common/VirtualClassroom.tsx) — testée ici du
// point de vue enseignant : check-in/check-out auto, "Terminer" la session, rapport de
// session (submitSessionReport), "Assigner un devoir" (createHomework), et documente
// l'absence de câblage du bouton "Export PDF".
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom-original";
import VirtualClassroom from "@/pages/common/VirtualClassroom";
import { toast } from "sonner";
import {
  fetchScheduleByRole,
  fetchCourseDetails,
  sessionCheckIn,
  sessionCheckOut,
  submitSessionReport,
  createHomework,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchScheduleByRole: vi.fn(),
  fetchCourseDetails: vi.fn(),
  sessionCheckIn: vi.fn(),
  sessionCheckOut: vi.fn(),
  submitSessionReport: vi.fn(),
  createHomework: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", email: "ngono@care4success.cm", role: "teacher" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const SESSION = {
  id: "sess-1",
  subject: "Mathématiques",
  studentName: "Jean Dupont",
  studentId: "st1",
  courseId: "course-1",
  actualStartTime: "2026-07-23T10:00:00Z",
  actualEndTime: null,
};

function renderVirtualClassroom() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/virtual-class/sess-1"]}>
        <Routes>
          <Route path="/virtual-class/:sessionId" element={<VirtualClassroom />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Classe Virtuelle (côté Enseignant) — /virtual-class/:sessionId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchScheduleByRole as any).mockResolvedValue([SESSION]);
    (fetchCourseDetails as any).mockResolvedValue({ id: "course-1", lessons: [] });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });

    // Stub Jitsi pour éviter le chargement du script externe et le polling de 15s :
    // on simule une API déjà disponible, comme si meet.care4success était déjà initialisé.
    // Doit être une "vraie" fonction constructible (le composant l'appelle avec `new`).
    (window as any).JitsiMeetExternalAPI = function JitsiMeetExternalAPIStub() {
      return { addEventListener: vi.fn(), dispose: vi.fn() };
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as any).JitsiMeetExternalAPI;
  });

  it("succès : affiche l'atelier collaboratif (notes / tableau blanc / code) une fois la session chargée", async () => {
    renderVirtualClassroom();
    expect((await screen.findAllByText("Notes")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Board").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Code").length).toBeGreaterThan(0);
  });

  it("succès : le bouton Terminer appelle sessionCheckOut puis ouvre le rapport de session", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });

    renderVirtualClassroom();
    await screen.findAllByText("Notes");

    await user.click(screen.getByRole("button", { name: /TERMINER/i }));

    await waitFor(() => expect((sessionCheckOut as any).mock.calls[0]?.[0]).toBe("sess-1"));
    expect(await screen.findByText("Rapport de Session")).toBeInTheDocument();
  });

  it("rapport de session : validation échouée si le rapport est trop court", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /TERMINER/i }));
    await screen.findByText("Rapport de Session");

    await user.type(screen.getByPlaceholderText(/Quels concepts ont été abordés/i), "Court");
    await user.click(screen.getByRole("button", { name: /Soumettre le rapport/i }));

    expect(await screen.findByText(/Veuillez fournir un rapport détaillé\./i)).toBeInTheDocument();
    expect(submitSessionReport).not.toHaveBeenCalled();
  });

  it("succès : soumission d'un rapport de session complet appelle submitSessionReport", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });
    (submitSessionReport as any).mockResolvedValue({ success: true });

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /TERMINER/i }));
    await screen.findByText("Rapport de Session");

    await user.type(
      screen.getByPlaceholderText(/Quels concepts ont été abordés/i),
      "Nous avons revu les fractions et les priorités opératoires en détail."
    );
    await user.click(screen.getByRole("button", { name: /Soumettre le rapport/i }));

    await waitFor(() => expect((submitSessionReport as any).mock.calls[0]?.[0]).toBe("sess-1"));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Rapport enregistré avec succès !"));
  });

  it("erreur réseau : l'échec de soumission du rapport affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    (sessionCheckOut as any).mockResolvedValue({ success: true });
    (submitSessionReport as any).mockRejectedValue(new Error("Erreur serveur"));

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /TERMINER/i }));
    await screen.findByText("Rapport de Session");

    await user.type(
      screen.getByPlaceholderText(/Quels concepts ont été abordés/i),
      "Nous avons revu les fractions et les priorités opératoires en détail."
    );
    await user.click(screen.getByRole("button", { name: /Soumettre le rapport/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erreur serveur"));
  });

  it("assigner un devoir : champs obligatoires manquants (titre trop court, date requise) bloque l'assignation", async () => {
    const user = userEvent.setup();

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /ASSIGNER UN DEVOIR/i }));
    await screen.findByText("Assigner un devoir");

    const titleInput = screen.getByPlaceholderText(/Révisions des fonctions/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Hi");

    await user.click(screen.getByRole("button", { name: /^Assigner$/i }));

    expect(await screen.findByText(/Le titre est trop court/i)).toBeInTheDocument();
    expect(createHomework).not.toHaveBeenCalled();
  });

  it("succès : assignation d'un devoir complet appelle createHomework avec les identifiants de la séance", async () => {
    const user = userEvent.setup();
    (createHomework as any).mockResolvedValue({ id: "hw-1" });

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /ASSIGNER UN DEVOIR/i }));
    await screen.findByText("Assigner un devoir");

    const titleInput = screen.getByPlaceholderText(/Révisions des fonctions/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Exercices sur les fractions");

    await user.click(screen.getByRole("button", { name: /^Assigner$/i }));

    await waitFor(() => expect(createHomework).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Exercices sur les fractions",
        teacherId: "teacher-1",
        studentId: "st1",
        sessionId: "sess-1",
        subject: "Mathématiques",
      })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Devoir assigné !"));
  });

  it("erreur réseau : l'échec d'assignation du devoir affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    (createHomework as any).mockRejectedValue(new Error("Erreur serveur"));

    renderVirtualClassroom();
    await screen.findAllByText("Notes");
    await user.click(screen.getByRole("button", { name: /ASSIGNER UN DEVOIR/i }));
    await screen.findByText("Assigner un devoir");

    const titleInput = screen.getByPlaceholderText(/Révisions des fonctions/i);
    await user.clear(titleInput);
    await user.type(titleInput, "Exercices sur les fractions");

    await user.click(screen.getByRole("button", { name: /^Assigner$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erreur serveur"));
  });

  it("bouton non câblé : \"Export PDF\" n'a pas de gestionnaire", async () => {
    const user = userEvent.setup();
    renderVirtualClassroom();
    await screen.findAllByText("Notes");

    const exportButton = screen.getByRole("button", { name: /EXPORT PDF/i });
    expect(exportButton).toBeInTheDocument();

    // Absence de handler réel dans src/pages/common/VirtualClassroom.tsx
    // (onClick={() => {}}) : aucun téléchargement, aucune requête réseau.
    await user.click(exportButton);
    expect(sessionCheckOut).not.toHaveBeenCalled();
    expect(createHomework).not.toHaveBeenCalled();
  });
});
