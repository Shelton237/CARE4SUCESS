// Tests unitaires — Espace Enseignant — Gestion des Devoirs (/teacher/homework)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : lecture (fetchHomework), création (POST /homework), marquer "rendu",
// correction (PATCH /homework/:id avec feedback obligatoire). Les appels réseau bruts
// (fetch) de ce composant sont mockés via un stub global fetch.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TeacherHomework from "@/pages/teacher/Homework";
import { toast } from "sonner";
import { fetchHomework, fetchStudentsByTeacher } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchHomework: vi.fn(),
  fetchStudentsByTeacher: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/components/ui/FilePreview", () => ({
  FilePreview: ({ label }: { label: string }) => <div data-testid="file-preview">{label}</div>,
}));

const STUDENTS = [{ id: "st1", name: "Jean Dupont" }];

const HOMEWORK_A_FAIRE = {
  id: "hw1", title: "Exercices fractions", subject: "Mathématiques",
  studentName: "Jean Dupont", dueDate: "2026-08-01", status: "à faire",
  description: "Faire les exercices 1 à 5.",
};
const HOMEWORK_RENDU = {
  id: "hw2", title: "Dissertation", subject: "Français",
  studentName: "Jean Dupont", dueDate: "2026-07-20", status: "rendu",
  submissionUrl: "/uploads/dissertation.pdf",
};

function renderHomework() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherHomework />
    </QueryClientProvider>
  );
}

describe("Gestion des Devoirs Enseignant — /teacher/homework", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchHomework as any).mockResolvedValue([HOMEWORK_A_FAIRE, HOMEWORK_RENDU]);
    (fetchStudentsByTeacher as any).mockResolvedValue(STUDENTS);
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succès : affiche les devoirs et les statistiques", async () => {
    renderHomework();
    expect(await screen.findByText("Exercices fractions")).toBeInTheDocument();
    expect(screen.getByText("Dissertation")).toBeInTheDocument();
  });

  it("erreur réseau : liste vide sans crash si le chargement échoue", async () => {
    (fetchHomework as any).mockRejectedValue(new Error("Erreur réseau"));
    renderHomework();
    expect(await screen.findByText(/Aucun devoir trouvé/i)).toBeInTheDocument();
  });

  it("création de devoir : champs obligatoires manquants bloque la soumission", async () => {
    const user = userEvent.setup();
    renderHomework();
    await screen.findByText("Exercices fractions");

    await user.click(screen.getByRole("button", { name: /Nouveau Devoir/i }));
    expect(await screen.findByText("Assigner un Devoir")).toBeInTheDocument();

    const assignButton = screen.getByRole("button", { name: /Assigner/i });
    expect(assignButton).toBeDisabled();
  });

  it("succès : création d'un devoir complet envoie une requête POST /homework", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (globalThis as any).fetch = fetchMock;

    renderHomework();
    await screen.findByText("Exercices fractions");
    await user.click(screen.getByRole("button", { name: /Nouveau Devoir/i }));
    await screen.findByText("Assigner un Devoir");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "st1"); // élève
    await user.type(screen.getByPlaceholderText(/Exercices sur les fractions/i), "Révisions de grammaire");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-08-15");

    const assignButton = screen.getByRole("button", { name: /Assigner/i });
    expect(assignButton).not.toBeDisabled();
    await user.click(assignButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/homework"),
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("erreur réseau : échec de création de devoir affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });

    renderHomework();
    await screen.findByText("Exercices fractions");
    await user.click(screen.getByRole("button", { name: /Nouveau Devoir/i }));
    await screen.findByText("Assigner un Devoir");

    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "st1");
    await user.type(screen.getByPlaceholderText(/Exercices sur les fractions/i), "Révisions");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    await user.type(dateInput, "2026-08-15");

    await user.click(screen.getByRole("button", { name: /Assigner/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Impossible de créer le devoir."));
  });

  it("succès : marquer un devoir 'à faire' comme rendu", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (globalThis as any).fetch = fetchMock;

    renderHomework();
    const item = (await screen.findByText("Exercices fractions")).closest("div.group") as HTMLElement;
    await user.click(within(item!).getByRole("button", { name: /Rendu/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/homework/hw1"),
      expect.objectContaining({ method: "PATCH" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("terminé")));
  });

  it("correction : commentaire de feedback obligatoire pour valider la correction", async () => {
    const user = userEvent.setup();
    renderHomework();
    await screen.findByText("Dissertation");

    await user.click(screen.getByText("Dissertation"));
    expect(await screen.findByText("Détails du Devoir")).toBeInTheDocument();

    const validerButton = screen.getByRole("button", { name: /Valider la correction/i });
    expect(validerButton).toBeDisabled();
  });

  it("succès : correction avec feedback envoie PATCH /homework/:id avec le statut corrigé", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (globalThis as any).fetch = fetchMock;

    renderHomework();
    await screen.findByText("Dissertation");
    await user.click(screen.getByText("Dissertation"));
    await screen.findByText("Détails du Devoir");

    const feedback = screen.getByPlaceholderText(/Saisissez vos remarques/i);
    await user.type(feedback, "Très bon travail, continue ainsi !");

    const validerButton = screen.getByRole("button", { name: /Valider la correction/i });
    expect(validerButton).not.toBeDisabled();
    await user.click(validerButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/homework/hw2"),
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ status: "corrigé", feedback: "Très bon travail, continue ainsi !" }),
      })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("corrigé")));
  });

  it("erreur réseau : la correction affiche un toast d'erreur si la requête échoue", async () => {
    const user = userEvent.setup();
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: false });

    renderHomework();
    await screen.findByText("Dissertation");
    await user.click(screen.getByText("Dissertation"));
    await screen.findByText("Détails du Devoir");

    await user.type(screen.getByPlaceholderText(/Saisissez vos remarques/i), "Feedback");
    await user.click(screen.getByRole("button", { name: /Valider la correction/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(expect.stringContaining("correction")));
  });
});
