// Tests unitaires — Admin — Enseignants (/admin/teachers)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacités couvertes : createTeacher, updateTeacherSpecialties, updateTeacherStatus
// (suspendre/réactiver), recherche/filtre par statut.
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import AdminTeachers from "@/pages/admin/Teachers";
import { createTeacher, updateTeacherStatus, updateTeacherSpecialties } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  createTeacher: vi.fn(),
  updateTeacherStatus: vi.fn(),
  updateTeacherSpecialties: vi.fn(),
}));

// Radix <Select> nécessite ces API DOM absentes de jsdom.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const TEACHER = {
  id: "t-1",
  name: "Jean Dupont",
  email: "jean.dupont@example.com",
  subjects: ["Mathématiques"],
  levels: "Terminale",
  level: "Terminale",
  city: "Douala",
  status: "actif",
  rating: 4.6,
  students: 5,
};

function mockFetchTeachers(list: unknown[] = [TEACHER], ok = true) {
  return vi.fn(() =>
    Promise.resolve({
      ok,
      json: async () => list,
    } as Response)
  );
}

function renderTeachers() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdminTeachers />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Admin Teachers — Enseignants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : liste les enseignants récupérés via GET /api/teachers", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    renderTeachers();

    expect(await screen.findByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("jean.dupont@example.com")).toBeInTheDocument();
    expect(screen.getByText("Douala")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("erreur réseau : liste vide affichée si la récupération des enseignants échoue (réponse non-ok)", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers([], false));
    renderTeachers();

    expect(await screen.findByText("Aucun enseignant ne correspond à votre recherche.")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("recherche : filtre par nom ou matière", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.type(screen.getByPlaceholderText(/Rechercher par nom ou matière/i), "Introuvable");
    expect(await screen.findByText("Aucun enseignant ne correspond à votre recherche.")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("filtre par statut : n'affiche que les enseignants suspendus/inactifs", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("combobox"));
    await user.click(await screen.findByText("Inactifs/Suspendus"));

    expect(await screen.findByText("Aucun enseignant ne correspond à votre recherche.")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("créer un enseignant : champs obligatoires manquants — la soumission est bloquée avec un message d'erreur", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ajouter un enseignant/i }));
    await user.click(screen.getByRole("button", { name: /Créer le profil/i }));

    expect(createTeacher).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it("succès : createTeacher est appelé avec les champs renseignés puis la modale se referme", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    (createTeacher as any).mockResolvedValue({ id: "t-2" });
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ajouter un enseignant/i }));
    await user.type(screen.getByLabelText(/Nom complet/i), "Aïcha Bello");
    await user.type(screen.getByLabelText(/Adresse email/i), "aicha.bello@example.com");
    await user.click(screen.getByRole("button", { name: /Créer le profil/i }));

    await waitFor(() => expect(createTeacher).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Aïcha Bello", email: "aicha.bello@example.com" })
    ));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    vi.unstubAllGlobals();
  });

  it("erreur réseau : createTeacher en échec n'interrompt pas l'interface (la modale reste ouverte)", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    (createTeacher as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ajouter un enseignant/i }));
    await user.type(screen.getByLabelText(/Nom complet/i), "Aïcha Bello");
    await user.type(screen.getByLabelText(/Adresse email/i), "aicha.bello@example.com");
    await user.click(screen.getByRole("button", { name: /Créer le profil/i }));

    await waitFor(() => expect(createTeacher).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("suspendre/réactiver : updateTeacherStatus est appelé avec le statut inverse", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    (updateTeacherStatus as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ouvrir le menu/i }));
    await user.click(screen.getByText("Suspendre"));

    await waitFor(() => expect(updateTeacherStatus).toHaveBeenCalledWith("t-1", "suspendu"));
    vi.unstubAllGlobals();
  });

  it("modifier les spécialités : updateTeacherSpecialties reçoit les matières/niveaux sélectionnés", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    (updateTeacherSpecialties as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ouvrir le menu/i }));
    await user.click(screen.getByText("Modifier spécialités"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(updateTeacherSpecialties).toHaveBeenCalledWith(
      "t-1",
      expect.objectContaining({ subjects: "Mathématiques", levels: "Terminale" })
    ));
    vi.unstubAllGlobals();
  });

  it("erreur réseau : échec de updateTeacherSpecialties conserve la modale ouverte", async () => {
    vi.stubGlobal("fetch", mockFetchTeachers());
    (updateTeacherSpecialties as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderTeachers();
    await screen.findByText("Jean Dupont");

    await user.click(screen.getByRole("button", { name: /Ouvrir le menu/i }));
    await user.click(screen.getByText("Modifier spécialités"));

    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(updateTeacherSpecialties).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
