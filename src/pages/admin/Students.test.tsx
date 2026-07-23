// Tests unitaires — Admin — Élèves & Familles (/admin/students)
// Périmètre : actor-admin (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Admin).
// Capacités couvertes : updateFamilyDetails, resetUserPassword (via fenêtre prompt).
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdminStudents from "@/pages/admin/Students";
import { fetchAdvisorFamilies, resetUserPassword, updateFamilyDetails } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorFamilies: vi.fn(),
  resetUserPassword: vi.fn(),
  updateFamilyDetails: vi.fn(),
}));

const toastSpy = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({
  toast: toastSpy,
}));

const FAMILY = {
  id: "fam-1",
  parent: "Ngono Marie",
  child: "Junior Ngono",
  childEmail: "junior.ngono@example.com",
  location: "Douala",
  level: "Terminale",
  subject: "Mathématiques",
  teacher: "M. Dupont",
  nextRdv: "24/07/2026",
  status: "suivi actif",
};

function renderStudents() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <AdminStudents />
    </QueryClientProvider>
  );
}

describe("Admin Students — Élèves & Familles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche les familles récupérées via fetchAdvisorFamilies", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    renderStudents();

    expect(await screen.findByText("Ngono Marie")).toBeInTheDocument();
    expect(screen.getByText("Junior Ngono")).toBeInTheDocument();
    expect(screen.getByText("M. Dupont")).toBeInTheDocument();
  });

  it("erreur réseau : bannière d'erreur avec bouton Réessayer qui relance fetchAdvisorFamilies", async () => {
    (fetchAdvisorFamilies as any).mockRejectedValueOnce(new Error("Network down"));
    const user = userEvent.setup();
    renderStudents();

    expect(await screen.findByText(/Impossible de charger les familles/i)).toBeInTheDocument();

    (fetchAdvisorFamilies as any).mockResolvedValueOnce([FAMILY]);
    await user.click(screen.getByRole("button", { name: /Réessayer/i }));

    expect(await screen.findByText("Ngono Marie")).toBeInTheDocument();
    expect(fetchAdvisorFamilies).toHaveBeenCalledTimes(2);
  });

  it("succès : modifier le niveau et les matières via updateFamilyDetails", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    (updateFamilyDetails as any).mockResolvedValue({});
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Modifier les informations/i));
    await user.click(await screen.findByText("Anglais"));
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(updateFamilyDetails).toHaveBeenCalledWith(
      "fam-1",
      expect.objectContaining({ level: "Terminale" })
    ));
    await waitFor(() => expect(toastSpy.success).toHaveBeenCalled());
  });

  it("erreur réseau : échec de updateFamilyDetails affiche un toast d'erreur et laisse la modale ouverte", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    (updateFamilyDetails as any).mockRejectedValue(new Error("Erreur serveur"));
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Modifier les informations/i));
    await user.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => expect(updateFamilyDetails).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy.error).toHaveBeenCalled());
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("succès : réinitialiser l'accès élève appelle resetUserPassword avec le mot de passe saisi", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    (resetUserPassword as any).mockResolvedValue({});
    vi.spyOn(window, "prompt").mockReturnValue("nouveauMdp123");
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Réinitialiser l'accès élève/i));

    await waitFor(() => expect(resetUserPassword).toHaveBeenCalledWith("junior.ngono@example.com", "nouveauMdp123"));
    await waitFor(() => expect(toastSpy.success).toHaveBeenCalled());
  });

  it("champs obligatoires manquants : pas d'email élève configuré — resetUserPassword n'est pas appelé", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([{ ...FAMILY, childEmail: "" }]);
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Réinitialiser l'accès élève/i));

    expect(resetUserPassword).not.toHaveBeenCalled();
    expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining("n'a pas d'email configuré"));
  });

  it("annulation : le prompt annulé (null) n'appelle pas resetUserPassword", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    vi.spyOn(window, "prompt").mockReturnValue(null);
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Réinitialiser l'accès élève/i));

    expect(resetUserPassword).not.toHaveBeenCalled();
  });

  it("erreur réseau : resetUserPassword en échec affiche un toast d'erreur", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
    (resetUserPassword as any).mockRejectedValue(new Error("Erreur serveur"));
    vi.spyOn(window, "prompt").mockReturnValue("mdp");
    const user = userEvent.setup();
    renderStudents();
    await screen.findByText("Ngono Marie");

    await user.click(screen.getByTitle(/Réinitialiser l'accès élève/i));

    await waitFor(() => expect(resetUserPassword).toHaveBeenCalled());
    await waitFor(() => expect(toastSpy.error).toHaveBeenCalledWith(expect.stringContaining("Erreur lors de la réinitialisation")));
  });
});
