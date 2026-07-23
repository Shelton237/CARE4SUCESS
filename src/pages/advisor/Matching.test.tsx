import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import AdvisorMatching from "@/pages/advisor/Matching";
import { fetchAdvisorAssignments, confirmAssignment } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorAssignments: vi.fn(),
  confirmAssignment: vi.fn(),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const ASSIGNMENT = {
  id: "match-1",
  child: "Idris",
  level: "CM2",
  subject: "Mathématiques",
  needs: ["Soutien fractions"],
  schedule: "Mercredi 16h",
  location: "Dakar",
  candidates: [
    { name: "M. Sow", rating: 4.5, available: true, city: "Dakar", locationMatch: true },
    { name: "Mme Fall", rating: 4.2, available: false, city: "Thiès", locationMatch: false },
  ],
  selectedTeacher: null,
  status: "pending",
};

function renderMatching() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdvisorMatching />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdvisorMatching — Matching enseignant/élève", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : liste les élèves en attente avec leurs candidats compatibles", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    renderMatching();

    expect(await screen.findByText("Idris")).toBeInTheDocument();
    expect(screen.getByText("M. Sow")).toBeInTheDocument();
    expect(screen.getByText("Mme Fall")).toBeInTheDocument();
    expect(screen.getByText(/Zone ✓/)).toBeInTheDocument();
  });

  it("état vide : affiche un message si aucun élève n'est en attente", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([]);
    renderMatching();
    expect(await screen.findByText("Aucun élève en attente pour le moment.")).toBeInTheDocument();
  });

  it("erreur réseau : bannière d'erreur avec bouton Réessayer qui relance la requête", async () => {
    (fetchAdvisorAssignments as any).mockRejectedValue(new Error("Impossible de charger les matching."));
    const user = userEvent.setup();
    renderMatching();

    expect(await screen.findByText("Impossible de charger les matching.")).toBeInTheDocument();
    const retryBtn = screen.getByText("Réessayer");
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    await user.click(retryBtn);

    expect(await screen.findByText("Idris")).toBeInTheDocument();
    expect(fetchAdvisorAssignments).toHaveBeenCalledTimes(2);
  });

  it("champs obligatoires manquants : le bouton Confirmer n'apparaît pas sans sélection de candidat", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    renderMatching();
    await screen.findByText("Idris");

    expect(screen.queryByText("Confirmer le matching")).not.toBeInTheDocument();
  });

  it("candidat indisponible : le clic ne le sélectionne pas et ne fait pas apparaître le bouton de confirmation", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    const user = userEvent.setup();
    renderMatching();
    await screen.findByText("Idris");

    await user.click(screen.getByText("Mme Fall"));
    expect(screen.queryByText("Confirmer le matching")).not.toBeInTheDocument();
  });

  it("succès : sélection d'un candidat disponible puis confirmAssignment déclenché avec toast de succès", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    (confirmAssignment as any).mockResolvedValue({ ...ASSIGNMENT, selectedTeacher: "M. Sow", status: "confirmed" });
    const user = userEvent.setup();
    renderMatching();
    await screen.findByText("Idris");

    await user.click(screen.getByText("M. Sow"));
    const confirmBtn = await screen.findByText("Confirmer le matching");
    await user.click(confirmBtn);

    await waitFor(() => expect(confirmAssignment).toHaveBeenCalledWith("match-1", "M. Sow"));
    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Matching confirmé" })
    ));
  });

  it("erreur réseau : confirmAssignment en échec affiche un toast d'erreur", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    (confirmAssignment as any).mockRejectedValue(new Error("Le serveur ne répond pas."));
    const user = userEvent.setup();
    renderMatching();
    await screen.findByText("Idris");

    await user.click(screen.getByText("M. Sow"));
    await user.click(await screen.findByText("Confirmer le matching"));

    await waitFor(() => expect(toastSpy).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Erreur", description: "Le serveur ne répond pas.", variant: "destructive" })
    ));
  });

  it("désélection : cliquer à nouveau sur un candidat sélectionné le désélectionne", async () => {
    (fetchAdvisorAssignments as any).mockResolvedValue([ASSIGNMENT]);
    const user = userEvent.setup();
    renderMatching();
    await screen.findByText("Idris");

    // Une fois sélectionné, "M. Sow" apparaît aussi dans le badge d'en-tête :
    // on cible précisément la carte candidat (classe "font-semibold") pour lever l'ambiguïté.
    const getCandidateCard = () => screen.getAllByText("M. Sow", { selector: ".font-semibold" })[0];

    await user.click(getCandidateCard());
    expect(await screen.findByText("Confirmer le matching")).toBeInTheDocument();

    await user.click(getCandidateCard());
    expect(screen.queryByText("Confirmer le matching")).not.toBeInTheDocument();
  });
});
