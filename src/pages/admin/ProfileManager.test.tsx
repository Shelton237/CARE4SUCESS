// Tests unitaires — Admin — Profils utilisateurs (/admin/profiles)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacités couvertes : registerUser (création, tout rôle), updateUserProfile,
// linkParentChildRelation/unlinkParentChildRelation, linkStudentTeacherRelation/
// unlinkStudentTeacherRelation.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ProfileManager from "@/pages/admin/ProfileManager";
import {
  registerUser,
  fetchUsers,
  updateUserProfile,
  fetchChildrenByParent,
  fetchParentsByStudent,
  fetchTeachersByStudent,
  fetchStudentsLinkedToTeacher,
  linkParentChildRelation,
  unlinkParentChildRelation,
  linkStudentTeacherRelation,
  unlinkStudentTeacherRelation,
} from "@/api/backoffice";
import { fetchGeoLocations, suggestGeoLocation } from "@/api/geo";

vi.mock("@/api/backoffice", () => ({
  registerUser: vi.fn(),
  fetchUsers: vi.fn(),
  updateUserProfile: vi.fn(),
  fetchChildrenByParent: vi.fn(),
  fetchParentsByStudent: vi.fn(),
  fetchTeachersByStudent: vi.fn(),
  fetchStudentsLinkedToTeacher: vi.fn(),
  linkParentChildRelation: vi.fn(),
  unlinkParentChildRelation: vi.fn(),
  linkStudentTeacherRelation: vi.fn(),
  unlinkStudentTeacherRelation: vi.fn(),
}));

// GeoSelector (composant partagé) interroge /api/geo au montage : on le neutralise
// pour ne pas dépendre du réseau dans ce périmètre (déjà couvert ailleurs).
vi.mock("@/api/geo", () => ({
  fetchGeoLocations: vi.fn(),
  suggestGeoLocation: vi.fn(),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const PARENT = { id: "u-parent-1", name: "Awa Ndiaye", email: "awa@example.com", role: "parent" };
const STUDENT = { id: "u-student-1", name: "Junior Ndiaye", email: "junior@example.com", role: "student" };
const TEACHER = { id: "u-teacher-1", name: "M. Sarr", email: "sarr@example.com", role: "teacher" };

function mockFetchUsersByRole() {
  (fetchUsers as any).mockImplementation((role?: string) => {
    if (role === "parent") return Promise.resolve([PARENT]);
    if (role === "student") return Promise.resolve([STUDENT]);
    if (role === "teacher") return Promise.resolve([TEACHER]);
    return Promise.resolve([]);
  });
}

function renderProfileManager() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <ProfileManager />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("Admin ProfileManager — Profils utilisateurs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchUsersByRole();
    (fetchChildrenByParent as any).mockResolvedValue([]);
    (fetchParentsByStudent as any).mockResolvedValue([]);
    (fetchTeachersByStudent as any).mockResolvedValue([]);
    (fetchStudentsLinkedToTeacher as any).mockResolvedValue([]);
    (fetchGeoLocations as any).mockResolvedValue([]);
    (suggestGeoLocation as any).mockResolvedValue({});
  });

  it("succès : création d'un compte via registerUser (mode Créer)", async () => {
    (registerUser as any).mockResolvedValue({ user: { id: "u-new" } });
    const user = userEvent.setup({ delay: null });
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    await user.click(screen.getByRole("button", { name: /Créer$/i }));
    await user.type(screen.getByPlaceholderText("Nom Prénom"), "Fatou Diop");
    await user.type(screen.getByPlaceholderText("email@care4success.cm"), "fatou.diop@example.com");
    await user.type(screen.getByPlaceholderText("Min. 8 caractères"), "motdepasse123");
    await user.click(screen.getByRole("button", { name: /Créer le compte/i }));

    await waitFor(() => expect(registerUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Fatou Diop", email: "fatou.diop@example.com", role: "parent" })
    ));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Compte créé" })
    ));
  }, 15000);

  it("champs obligatoires manquants : la création est bloquée sans nom/email/mot de passe", async () => {
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    await user.click(screen.getByRole("button", { name: /Créer$/i }));
    await user.click(screen.getByRole("button", { name: /Créer le compte/i }));

    expect(registerUser).not.toHaveBeenCalled();
  });

  it("erreur réseau : registerUser en échec affiche un toast d'erreur explicite", async () => {
    (registerUser as any).mockRejectedValue(new Error("Email déjà utilisé"));
    const user = userEvent.setup({ delay: null });
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    await user.click(screen.getByRole("button", { name: /Créer$/i }));
    await user.type(screen.getByPlaceholderText("Nom Prénom"), "Fatou Diop");
    await user.type(screen.getByPlaceholderText("email@care4success.cm"), "fatou.diop@example.com");
    await user.type(screen.getByPlaceholderText("Min. 8 caractères"), "motdepasse123");
    await user.click(screen.getByRole("button", { name: /Créer le compte/i }));

    await waitFor(() => expect(registerUser).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Impossible de créer le compte", description: "Email déjà utilisé" })
    ));
  }, 15000);

  it("succès : édition du profil d'un utilisateur sélectionné via updateUserProfile", async () => {
    (updateUserProfile as any).mockResolvedValue({ id: "u-parent-1", name: "Awa Ndiaye Fall" });
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    const nameInput = await screen.findByDisplayValue("Awa Ndiaye");
    await user.clear(nameInput);
    await user.type(nameInput, "Awa Ndiaye Fall");
    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalledWith(
      "u-parent-1",
      expect.objectContaining({ name: "Awa Ndiaye Fall" })
    ));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Profil mis à jour" })
    ));
  });

  it("champs obligatoires manquants : le nom complet vide bloque la sauvegarde de l'édition", async () => {
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    const nameInput = await screen.findByDisplayValue("Awa Ndiaye");
    await user.clear(nameInput);
    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    expect(updateUserProfile).not.toHaveBeenCalled();
  });

  it("erreur réseau : updateUserProfile en échec affiche un toast d'erreur", async () => {
    (updateUserProfile as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Impossible de mettre à jour", description: "Erreur serveur" })
    ));
  });

  it("succès : ajout d'une liaison parent-enfant via linkParentChildRelation lors de la sauvegarde", async () => {
    (updateUserProfile as any).mockResolvedValue({ id: "u-parent-1", name: "Awa Ndiaye" });
    (linkParentChildRelation as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    // "Junior Ndiaye" apparaît dans la colonne Relations (chips Enfants rattachés).
    await user.click(await screen.findByText("Junior Ndiaye"));
    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    await waitFor(() => expect(linkParentChildRelation).toHaveBeenCalledWith("u-parent-1", "u-student-1"));
  });

  it("succès : retrait d'une liaison parent-enfant via unlinkParentChildRelation lors de la sauvegarde", async () => {
    (fetchChildrenByParent as any).mockResolvedValue([STUDENT]);
    (updateUserProfile as any).mockResolvedValue({ id: "u-parent-1", name: "Awa Ndiaye" });
    (unlinkParentChildRelation as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    // L'enfant est déjà lié (chip active) : un clic le détache.
    await user.click(await screen.findByText("Junior Ndiaye"));
    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    await waitFor(() => expect(unlinkParentChildRelation).toHaveBeenCalledWith("u-parent-1", "u-student-1"));
  });

  it("succès : liaison élève-tuteur via linkStudentTeacherRelation lorsqu'on édite un élève", async () => {
    (updateUserProfile as any).mockResolvedValue({ id: "u-student-1", name: "Junior Ndiaye" });
    (linkStudentTeacherRelation as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderProfileManager();
    await screen.findByText("Awa Ndiaye");

    await user.click(screen.getByRole("tab", { name: "Élève" }));
    await screen.findByDisplayValue("Junior Ndiaye");

    await user.click(await screen.findByText("M. Sarr"));
    await user.click(screen.getByRole("button", { name: /Sauvegarder/i }));

    await waitFor(() => expect(linkStudentTeacherRelation).toHaveBeenCalledWith("u-student-1", "u-teacher-1"));
  });
});
