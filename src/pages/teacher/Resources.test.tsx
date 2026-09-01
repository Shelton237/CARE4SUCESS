// Tests unitaires — Espace Enseignant — Ressources Pédagogiques (/teacher/resources)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : POST /resources (upload ou URL), PATCH /resources/:id/download, DELETE
// /resources/:id — en vérifiant que la suppression n'est proposée que sur ses propres
// ressources, jamais sur celles d'un collègue dans la bibliothèque partagée.
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TeacherResources from "@/pages/teacher/Resources";
import { toast } from "sonner";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" }, token: "fake-token" }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const MY_RESOURCE = {
  id: "res-1", teacher_id: "teacher-1", teacher_name: "Mme Ngono", title: "Fiche fractions",
  description: "Support de révision", subject: "Mathématiques", level: "Collège",
  type: "pdf", file_url: "/uploads/fractions.pdf", downloads: 3,
};
const COLLEAGUE_RESOURCE = {
  id: "res-2", teacher_id: "teacher-2", teacher_name: "M. Diop", title: "Exercices Anglais",
  description: "Vocabulaire", subject: "Anglais", level: "Lycée",
  type: "link", file_url: "https://example.com/exo", downloads: 1,
};

function renderResources() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherResources />
    </QueryClientProvider>
  );
}

describe("Ressources Pédagogiques Enseignant — /teacher/resources", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/resources") && !String(url).includes("download") && !String(url).endsWith("res-1") && !String(url).endsWith("res-2")) {
        return Promise.resolve({ ok: true, json: async () => [MY_RESOURCE, COLLEAGUE_RESOURCE] });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("succès : affiche mes ressources et la bibliothèque partagée séparément", async () => {
    renderResources();
    expect(await screen.findByText("Fiche fractions")).toBeInTheDocument();
    expect(screen.getByText(/Mes ressources \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Bibliothèque partagée \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText("Exercices Anglais")).toBeInTheDocument();
  });

  it("scoping suppression : le bouton supprimer n'apparaît que sur mes propres ressources", async () => {
    renderResources();
    await screen.findByText("Fiche fractions");

    // Ma ressource : bouton "Ouvrir" + bouton de suppression (Trash2) présents
    const myCard = screen.getByText("Fiche fractions").closest("div.border.border-slate-100") as HTMLElement;
    expect(myCard).toBeTruthy();
    expect(myCard.querySelectorAll("button").length).toBe(2);

    // Ressource d'un collègue : uniquement le bouton "Ouvrir", aucun bouton de suppression
    const colleagueCard = screen.getByText("Exercices Anglais").closest("div.border.border-slate-100") as HTMLElement;
    expect(colleagueCard).toBeTruthy();
    expect(colleagueCard.querySelectorAll("button").length).toBe(1);
  });

  it("création : champs obligatoires manquants désactive la publication", async () => {
    const user = userEvent.setup();
    renderResources();
    await screen.findByText("Fiche fractions");

    await user.click(screen.getByRole("button", { name: /Ajouter/i }));
    expect(await screen.findByText("Nouvelle ressource")).toBeInTheDocument();

    const publishButton = screen.getByRole("button", { name: /Publier la ressource/i });
    expect(publishButton).toBeDisabled();
  });

  it("succès : création d'une ressource de type lien envoie POST /resources", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "POST") return Promise.resolve({ ok: true, json: async () => ({ id: "res-3" }) });
      return Promise.resolve({ ok: true, json: async () => [MY_RESOURCE, COLLEAGUE_RESOURCE] });
    });
    (globalThis as any).fetch = fetchMock;

    renderResources();
    await screen.findByText("Fiche fractions");
    await user.click(screen.getByRole("button", { name: /Ajouter/i }));
    await screen.findByText("Nouvelle ressource");

    await user.type(screen.getByPlaceholderText("Titre *"), "Vidéo sur la conjugaison");
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "Français"); // matière
    await user.selectOptions(selects[1], "Primaire"); // niveau
    await user.selectOptions(selects[2], "link"); // type

    await user.type(screen.getByPlaceholderText(/URL du lien/i), "https://youtube.com/watch?v=abc");

    const publishButton = screen.getByRole("button", { name: /Publier la ressource/i });
    expect(publishButton).not.toBeDisabled();
    await user.click(publishButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/resources"),
      expect.objectContaining({ method: "POST" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Ressource ajoutée !"));
  });

  it("erreur réseau : l'échec de création affiche un toast d'erreur", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "POST") return Promise.resolve({ ok: false });
      return Promise.resolve({ ok: true, json: async () => [MY_RESOURCE, COLLEAGUE_RESOURCE] });
    });
    (globalThis as any).fetch = fetchMock;

    renderResources();
    await screen.findByText("Fiche fractions");
    await user.click(screen.getByRole("button", { name: /Ajouter/i }));
    await screen.findByText("Nouvelle ressource");

    await user.type(screen.getByPlaceholderText("Titre *"), "Ressource en échec");
    const selects = screen.getAllByRole("combobox");
    await user.selectOptions(selects[0], "SVT");
    await user.selectOptions(selects[1], "Lycée");

    await user.click(screen.getByRole("button", { name: /Publier la ressource/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erreur lors de l'ajout"));
  });

  it("succès : ouvrir une ressource déclenche PATCH /resources/:id/download", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string) => {
      if (String(url).includes("/download")) return Promise.resolve({ ok: true });
      return Promise.resolve({ ok: true, json: async () => [MY_RESOURCE, COLLEAGUE_RESOURCE] });
    });
    (globalThis as any).fetch = fetchMock;
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderResources();
    await screen.findByText("Fiche fractions");

    const openButtons = screen.getAllByRole("button", { name: /Ouvrir/i });
    await user.click(openButtons[0]);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/resources/res-1/download"),
      expect.objectContaining({ method: "PATCH" })
    ));
    expect(openSpy).toHaveBeenCalledWith("/uploads/fractions.pdf", "_blank");
  });

  it("succès : suppression de ma propre ressource appelle DELETE /resources/:id", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockImplementation((url: string, opts?: any) => {
      if (opts?.method === "DELETE") return Promise.resolve({ ok: true });
      return Promise.resolve({ ok: true, json: async () => [MY_RESOURCE, COLLEAGUE_RESOURCE] });
    });
    (globalThis as any).fetch = fetchMock;

    renderResources();
    await screen.findByText("Fiche fractions");

    const myCard = screen.getByText("Fiche fractions").closest("div.border") as HTMLElement;
    const deleteButton = myCard.querySelectorAll("button")[1];
    await user.click(deleteButton);

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/resources/res-1"),
      expect.objectContaining({ method: "DELETE" })
    ));
  });

  it("état vide : aucune ressource affiche un message dédié", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    renderResources();
    expect(await screen.findByText(/Aucune ressource disponible/i)).toBeInTheDocument();
  });
});
