// Tests unitaires — Espace Tuteur natif — Profil (/tutor/profile)
// Périmètre : actor-tutor (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Tuteur).
// `src/pages/tutor/Profile.tsx` est un ré-export direct de `src/pages/teacher/Profile.tsx`
// (aucune duplication de code). On teste ici le point d'entrée réellement monté sur la
// route /tutor/profile, avec un focus sur le badge dynamique selon rôle réel/secondaire,
// qui est la seule spécificité propre au périmètre tuteur pour cette page.
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TutorProfile from "@/pages/tutor/Profile";
import { toast } from "sonner";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "@/api/backoffice";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/api/backoffice", () => ({
  fetchUserProfile: vi.fn(),
  updateUserProfile: vi.fn(),
  uploadUserAvatar: vi.fn(),
}));

let authUser: any = { id: "tutor-1", name: "Aïcha Tuteur", role: "tutor" };

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: authUser }),
}));

const BASE_PROFILE = {
  id: "tutor-1",
  name: "Aïcha Tuteur",
  email: "aicha.tuteur@example.com",
  phone: "+237611111111",
  location: "Douala",
  bio: "Tutrice expérimentée.",
  avatarUrl: null,
  bankName: "",
  bankIban: "",
};

function renderProfile() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TutorProfile />
    </QueryClientProvider>
  );
}

describe("Tuteur — Profil (/tutor/profile)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authUser = { id: "tutor-1", name: "Aïcha Tuteur", role: "tutor" };
    (fetchUserProfile as any).mockResolvedValue(BASE_PROFILE);
    (updateUserProfile as any).mockResolvedValue(BASE_PROFILE);
    (uploadUserAvatar as any).mockResolvedValue(BASE_PROFILE);
  });

  it("succès : charge le profil, modifie le nom et enregistre", async () => {
    renderProfile();

    await waitFor(() => expect(screen.getByDisplayValue("Aïcha Tuteur")).toBeInTheDocument());

    const nameInput = screen.getByDisplayValue("Aïcha Tuteur");
    fireEvent.change(nameInput, { target: { value: "Aïcha T. Modifiée" } });

    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalledWith(
      "tutor-1",
      expect.objectContaining({ name: "Aïcha T. Modifiée" })
    ));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("badge dynamique : rôle tuteur simple affiche uniquement \"Tuteur Vérifié\"", async () => {
    authUser = { id: "tutor-1", name: "Aïcha Tuteur", role: "tutor" };

    renderProfile();

    await waitFor(() => expect(screen.getByText(/Tuteur Vérifié/i)).toBeInTheDocument());
    expect(screen.queryByText(/^Enseignant$/i)).not.toBeInTheDocument();
  });

  it("badge dynamique : double rôle tuteur/enseignant affiche les deux badges", async () => {
    authUser = { id: "tutor-1", name: "Aïcha Tuteur", role: "tutor", secondaryRole: "teacher" };

    renderProfile();

    await waitFor(() => expect(screen.getByText(/Tuteur Vérifié/i)).toBeInTheDocument());
    expect(screen.getByText(/^Enseignant$/i)).toBeInTheDocument();
    expect(screen.getByText(/Tuteur-Enseignant/i)).toBeInTheDocument();
  });

  it("champs obligatoires manquants : aucun fichier sélectionné ne déclenche pas l'upload d'avatar", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Aïcha Tuteur")).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeTruthy();

    fireEvent.change(fileInput, { target: { files: [] } });

    expect(uploadUserAvatar).not.toHaveBeenCalled();
  });

  it("succès : sélectionner un fichier déclenche bien l'upload de l'avatar", async () => {
    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Aïcha Tuteur")).toBeInTheDocument());

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(["avatar-bytes"], "avatar.png", { type: "image/png" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(uploadUserAvatar).toHaveBeenCalledWith("tutor-1", file));
    await waitFor(() => expect(toast.success).toHaveBeenCalled());
  });

  it("validation échouée : le serveur rejette la mise à jour (422) — aucun toast de succès", async () => {
    (updateUserProfile as any).mockRejectedValue(new Error("Requête invalide (422)"));

    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Aïcha Tuteur")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    // Le bouton reste utilisable après l'échec (pas de blocage de l'UI)
    expect(screen.getByRole("button", { name: /Enregistrer/i })).not.toBeDisabled();
  });

  it("erreur réseau : le fetch rejeté (hors-ligne) ne casse pas l'interface", async () => {
    (updateUserProfile as any).mockRejectedValue(new TypeError("Failed to fetch"));

    renderProfile();
    await waitFor(() => expect(screen.getByDisplayValue("Aïcha Tuteur")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(updateUserProfile).toHaveBeenCalled());
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByText(/Informations du Tuteur/i)).toBeInTheDocument();
  });
});
