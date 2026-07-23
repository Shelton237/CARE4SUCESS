// Tests unitaires — Espace Enseignant — Mon Profil (/teacher/profile)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : uploadUserAvatar, updateUserProfile, et documente l'absence de câblage
// du bouton 2FA "Activer" (onglet Sécurité & Accès).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TeacherProfile from "@/pages/teacher/Profile";
import { toast } from "sonner";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "@/api/backoffice";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

vi.mock("@/api/backoffice", () => ({
  fetchUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  uploadUserAvatar: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

const BASE_PROFILE = {
  id: "teacher-1",
  name: "Mme Ngono",
  email: "ngono@care4success.cm",
  phone: "+237600000000",
  location: "Douala",
  bio: "Enseignante de mathématiques.",
  avatarUrl: null,
  bankName: "",
  bankIban: "",
};

function renderProfile() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherProfile />
    </QueryClientProvider>
  );
}

describe("Mon Profil Enseignant — /teacher/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchUserProfile as any).mockResolvedValue(BASE_PROFILE);
    (updateUserProfile as any).mockResolvedValue(BASE_PROFILE);
    (uploadUserAvatar as any).mockResolvedValue(BASE_PROFILE);
  });

  it("succès : charge le profil, modifie le nom et enregistre", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    const nameInput = screen.getByDisplayValue("Mme Ngono");
    await userEvent.setup().clear(nameInput);
    await userEvent.setup().type(nameInput, "Mme A. Ngono");

    await userEvent.setup().click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalledWith(
      "teacher-1",
      expect.objectContaining({ name: expect.stringContaining("Ngono") })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("badge : affiche 'Enseignant Vérifié' pour un rôle teacher pur", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByText(/Enseignant Vérifié/i)).toBeInTheDocument());
  });

  it("champs obligatoires manquants : aucun fichier sélectionné ne déclenche pas l'upload d'avatar", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(fileInput, { target: { files: [] } });

    expect(uploadUserAvatar).not.toHaveBeenCalled();
  });

  it("succès : sélectionner un fichier déclenche l'upload de l'avatar", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["avatar-bytes"], "avatar.png", { type: "image/png" });
    const { fireEvent } = await import("@testing-library/react");
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(uploadUserAvatar).toHaveBeenCalledWith("teacher-1", file));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("validation échouée : le serveur rejette la mise à jour — aucun toast de succès", async () => {
    (updateUserProfile as any).mockRejectedValue(new Error("Requête invalide (422)"));
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    await userEvent.setup().click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /Enregistrer/i })).not.toBeDisabled();
  });

  it("erreur réseau : le fetch rejeté (hors-ligne) ne casse pas l'interface", async () => {
    (updateUserProfile as any).mockRejectedValue(new TypeError("Failed to fetch"));
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    await userEvent.setup().click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText(/Informations de l'Enseignant/i)).toBeInTheDocument();
  });

  it("bouton non câblé : l'activation de la 2FA (onglet Sécurité) n'a pas de gestionnaire", async () => {
    const user = userEvent.setup();
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Mme Ngono")).toBeInTheDocument());

    await user.click(screen.getByRole("button", { name: /Sécurité & Accès/i }));
    const activerButton = await screen.findByRole("button", { name: /^Activer$/i });
    expect(activerButton).toBeInTheDocument();

    // Aucune mutation ni navigation n'est déclenchée au clic — absence de onClick
    // dans src/pages/teacher/Profile.tsx (non câblé, cf. cartographie fonctionnelle).
    await user.click(activerButton);
    expect(updateUserProfile).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /^Activer$/i })).toBeInTheDocument();
  });
});
