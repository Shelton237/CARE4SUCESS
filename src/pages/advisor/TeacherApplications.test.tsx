import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvisorTeacherApplications from "@/pages/advisor/TeacherApplications";
import { fetchTeacherApplications, reviewTeacherApplication } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchTeacherApplications: vi.fn(),
  reviewTeacherApplication: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" } }),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const PENDING_APP = {
  id: "app-1",
  fullName: "Fatou Diallo",
  email: "fatou.diallo@example.com",
  phone: "+221 77 000 00 00",
  subjects: ["Mathématiques"],
  experienceYears: 3,
  availability: "Lundi au vendredi",
  motivation: "Motivée",
  cvUrl: null,
  status: "pending" as const,
  createdAt: "2026-07-01",
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdvisorTeacherApplications />
    </QueryClientProvider>
  );
}

describe("AdvisorTeacherApplications — Candidatures profs (reviewerRole=advisor)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!("clipboard" in navigator)) {
      Object.assign(navigator, { clipboard: { writeText: vi.fn() } });
    } else {
      vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue();
    }
  });

  it("succès : valide une candidature avec reviewerRole 'advisor' et affiche les identifiants générés", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    (reviewTeacherApplication as any).mockResolvedValue({
      ...PENDING_APP,
      status: "approved",
      credentials: { email: PENDING_APP.email, password: "Xy12Ab34", name: PENDING_APP.fullName },
    });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.click(screen.getByRole("button", { name: /Valider/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => expect(reviewTeacherApplication).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ status: "approved", reviewerRole: "advisor", rateType: "hourly", negotiatedRate: 7500 })
    ));
    expect(await screen.findByText("Enseignant validé avec succès")).toBeInTheDocument();
    expect(screen.getByText("Xy12Ab34")).toBeInTheDocument();
  });

  it("succès : refuse une candidature avec reviewerRole 'advisor'", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    (reviewTeacherApplication as any).mockResolvedValue({ ...PENDING_APP, status: "rejected" });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.click(screen.getByRole("button", { name: /Refuser/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => expect(reviewTeacherApplication).toHaveBeenCalledWith(
      "app-1",
      expect.objectContaining({ status: "rejected", reviewerRole: "advisor" })
    ));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Candidature mise à jour" })
    ));
  });

  it("erreur réseau : reviewTeacherApplication en échec affiche un toast d'erreur explicite", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    (reviewTeacherApplication as any).mockRejectedValue(new Error("Le serveur ne répond pas."));

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.click(screen.getByRole("button", { name: /Valider/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Impossible de mettre à jour", description: "Le serveur ne répond pas." })
    ));
  });

  it("validation échouée : une erreur métier renvoyée par le serveur (ex : tarif invalide) est aussi affichée en toast", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    (reviewTeacherApplication as any).mockRejectedValue(new Error("Le tarif négocié est invalide."));

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.click(screen.getByRole("button", { name: /Valider/i }));
    await user.click(screen.getByRole("button", { name: /Confirmer/i }));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Le tarif négocié est invalide." })
    ));
  });

  it("champs obligatoires manquants : la note interne est optionnelle, la validation n'est jamais bloquée par un champ vide", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    (reviewTeacherApplication as any).mockResolvedValue({ ...PENDING_APP, status: "approved" });

    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.click(screen.getByRole("button", { name: /Valider/i }));
    // Aucune note interne saisie, aucun champ requis côté formulaire de décision.
    const confirmBtn = screen.getByRole("button", { name: /Confirmer/i });
    expect(confirmBtn).toBeEnabled();
    await user.click(confirmBtn);

    await waitFor(() => expect(reviewTeacherApplication).toHaveBeenCalled());
  });

  it("recherche : filtre par nom, email ou matière, message vide si aucune correspondance", async () => {
    (fetchTeacherApplications as any).mockResolvedValue([PENDING_APP]);
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Fatou Diallo");

    await user.type(screen.getByPlaceholderText(/Rechercher par nom, email/i), "zzz-inexistant");
    expect(await screen.findByText("Aucune candidature")).toBeInTheDocument();
  });

  it("erreur réseau : affiche une bannière d'erreur si la liste des candidatures ne charge pas", async () => {
    (fetchTeacherApplications as any).mockRejectedValue(new Error("Impossible de charger les candidatures."));
    renderPage();

    expect(await screen.findByText("Impossible de charger les candidatures.")).toBeInTheDocument();
  });
});
