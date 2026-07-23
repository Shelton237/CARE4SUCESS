// Tests unitaires — Admin — Paramètres (/admin/settings)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacité couverte : savePlatformSettings (tarifs par matière, centres/antennes,
// notifications, sécurité/2FA/session).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminSettings from "@/pages/admin/Settings";
import { fetchPlatformSettings, savePlatformSettings } from "@/api/backoffice";
import type { PlatformSettings } from "@/integrations/supabase/types";

vi.mock("@/api/backoffice", () => ({
  fetchPlatformSettings: vi.fn(),
  savePlatformSettings: vi.fn(),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const SETTINGS: PlatformSettings = {
  hourlyRates: [
    { id: "rate-1", label: "Mathématiques", baseRate: 10000, premiumRate: 15000 },
  ],
  centers: [
    { id: "center-1", name: "Centre Bonanjo", city: "Douala", address: "Rue du Palais", active: true },
  ],
  notifications: [
    { key: "newRequest", label: "Nouvelle demande de bilan", enabled: true },
  ],
  security: {
    sessionTimeout: "1h",
    passwordPolicy: "standard",
    enforce2FA: false,
  },
};

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminSettings />
    </QueryClientProvider>
  );
}

describe("Admin Settings — Paramètres de la plateforme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les tarifs, centres, notifications et sécurité chargés", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    renderSettings();

    expect(await screen.findByDisplayValue("Mathématiques")).toBeInTheDocument();
    expect(screen.getByText("Centre Bonanjo")).toBeInTheDocument();
    expect(screen.getByText("Nouvelle demande de bilan")).toBeInTheDocument();
  });

  it("succès : modifier un tarif puis Enregistrer appelle savePlatformSettings avec la nouvelle valeur", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    (savePlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    const baseRateInput = screen.getByDisplayValue("10000");
    await user.clear(baseRateInput);
    await user.type(baseRateInput, "12000");
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(savePlatformSettings).toHaveBeenCalled());
    expect((savePlatformSettings as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        hourlyRates: [expect.objectContaining({ id: "rate-1", baseRate: 12000 })],
      })
    );
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Paramètres enregistrés" })
    ));
  });

  it("validation échouée : ajouter une matière sans nom affiche un toast d'erreur et n'ajoute rien", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    await user.click(screen.getByRole("button", { name: /Ajouter une matière/i }));
    await user.click(screen.getByRole("button", { name: "Ajouter ce tarif" }));

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Informations incomplètes", variant: "destructive" })
    );
    expect(savePlatformSettings).not.toHaveBeenCalled();
  });

  it("champs obligatoires manquants : ajouter un centre sans ville/adresse affiche un toast d'erreur", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    await user.click(screen.getByRole("button", { name: /Ajouter un centre/i }));
    await user.type(screen.getByPlaceholderText("Nom du centre"), "Centre Akwa");
    await user.click(screen.getByRole("button", { name: "Ajouter ce centre" }));

    expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Informations incomplètes", variant: "destructive" })
    );
    expect(screen.queryByText("Centre Akwa")).not.toBeInTheDocument();
  });

  it("succès : ajouter un centre complet puis Enregistrer appelle savePlatformSettings avec le nouveau centre", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    (savePlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    await user.click(screen.getByRole("button", { name: /Ajouter un centre/i }));
    await user.type(screen.getByPlaceholderText("Nom du centre"), "Centre Akwa");
    await user.type(screen.getByPlaceholderText("Ville"), "Douala");
    await user.type(screen.getByPlaceholderText("Adresse complète"), "Avenue de la Liberté");
    await user.click(screen.getByRole("button", { name: "Ajouter ce centre" }));

    expect(await screen.findByText("Centre Akwa")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(savePlatformSettings).toHaveBeenCalled());
    expect((savePlatformSettings as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        centers: expect.arrayContaining([
          expect.objectContaining({ name: "Centre Akwa", city: "Douala", address: "Avenue de la Liberté" }),
        ]),
      })
    );
  });

  it("succès : basculer une notification puis Enregistrer transmet la préférence mise à jour", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    (savePlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    // La checkbox est dans un <label> englobant le libellé : on cible via le texte parent.
    const notifLabel = screen.getByText("Nouvelle demande de bilan").closest("label");
    const checkbox = notifLabel!.querySelector("input[type=checkbox]") as HTMLInputElement;
    await user.click(checkbox);

    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(savePlatformSettings).toHaveBeenCalled());
    expect((savePlatformSettings as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        notifications: [expect.objectContaining({ key: "newRequest", enabled: false })],
      })
    );
  });

  it("succès : modifier la sécurité (2FA + délai de session) puis Enregistrer transmet les nouvelles valeurs", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    (savePlatformSettings as any).mockResolvedValue(SETTINGS);
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    await user.click(screen.getByLabelText(/Activer pour les comptes admin/i));
    await user.selectOptions(screen.getByDisplayValue("1 heure"), "4h");
    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(savePlatformSettings).toHaveBeenCalled());
    expect((savePlatformSettings as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        security: expect.objectContaining({ enforce2FA: true, sessionTimeout: "4h" }),
      })
    );
  });

  it("erreur réseau : savePlatformSettings en échec affiche un toast d'erreur explicite", async () => {
    (fetchPlatformSettings as any).mockResolvedValue(SETTINGS);
    (savePlatformSettings as any).mockRejectedValue(new Error("Le serveur ne répond pas."));
    const user = userEvent.setup();
    renderSettings();
    await screen.findByDisplayValue("Mathématiques");

    await user.click(screen.getByRole("button", { name: /Enregistrer/i }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Échec de l'enregistrement", description: "Le serveur ne répond pas.", variant: "destructive" })
    ));
  });

  it("erreur réseau (chargement) : comportement documenté — si fetchPlatformSettings échoue, la page reste vide (aucun paramètre affiché)", async () => {
    (fetchPlatformSettings as any).mockRejectedValue(new Error("Erreur serveur"));
    renderSettings();

    await waitFor(() => expect(fetchPlatformSettings).toHaveBeenCalled());
    // AdminSettings retourne `null` tant que `settings` n'est pas hydraté : aucune
    // section de paramètres ne doit apparaître.
    expect(screen.queryByText("Paramètres de la plateforme")).not.toBeInTheDocument();
  });
});
