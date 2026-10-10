import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorReports from "@/pages/advisor/Reports";
import { fetchAdvisorFamilies } from "@/api/backoffice";

const navigate = vi.fn();
vi.mock("react-router-dom", async (orig) => ({ ...(await orig<any>()), useNavigate: () => navigate }));
vi.mock("@/api/backoffice", () => ({ fetchAdvisorFamilies: vi.fn() }));
vi.mock("@/components/advisor/AdvisorBilanView", () => ({
  default: ({ family }: any) => <div data-testid="bilan-view">Bilan de {family.child}</div>,
}));

const recent = new Date(Date.now() - 2 * 86_400_000).toISOString();
const F = (o: Record<string, unknown>) => ({ id: "f", child: "Enfant", parent: "Parent", level: "Terminale", subject: "Mathématiques", createdAt: recent, bilan: { status: "a_traiter", diagnostic: null as any, plan: null as any }, ...o });
const DATA = [
  F({ id: "r1", child: "Jean Nore", bilan: { status: "termine", diagnostic: { evaluator: "Brice Owona", count: 2, subjects: ["Maths", "Physique"], firstAt: recent }, plan: { title: "Plan" } } }),
  F({ id: "r2", child: "Aubin Cabrel", level: "Première", bilan: { status: "en_cours", diagnostic: { evaluator: "Awa Diop", count: 1, subjects: ["Anglais"], firstAt: recent }, plan: null } }),
  F({ id: "r3", child: "Marie Louise", level: "Seconde", subject: "Français, Anglais" }),
  F({ id: "no-request-s4", child: "Kamel S.", level: null, subject: undefined }),
];

const renderPage = () =>
  render(
    <MemoryRouter>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdvisorReports />
      </QueryClientProvider>
    </MemoryRouter>
  );

describe("AdvisorReports : Bilans pédagogiques", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorFamilies as any).mockResolvedValue(DATA);
  });

  it("indicateurs et statuts réels (diagnostic, plan)", async () => {
    renderPage();
    expect(await screen.findByText("Jean Nore")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Bilans trouvés/ })).toHaveTextContent("4");
    expect(screen.getByRole("button", { name: /^\d+\s*Terminés/ })).toHaveTextContent("1");
    expect(screen.getByRole("button", { name: /^\d+\s*À traiter/ })).toHaveTextContent("2");
    expect(screen.getByText("Brice Owona · 2 évaluations")).toBeInTheDocument();
    expect(screen.getAllByText("Pas encore évalué")).toHaveLength(2);
    expect(screen.getByText("Niveau non renseigné")).toBeInTheDocument();
  });

  it("diagnostic enregistré sans note : signalé, matières affichées comme demandées", async () => {
    (fetchAdvisorFamilies as any).mockResolvedValue([
      F({ id: "t", child: "Tina", subject: "SVT", bilan: { status: "en_cours", diagnostic: { evaluator: "Awa Diop", count: 1, subjects: [] }, plan: null } }),
    ]);
    renderPage();
    expect(await screen.findByText("Diagnostic sans note")).toBeInTheDocument();
    expect(screen.getByText("Matières demandées")).toBeInTheDocument();
  });

  it("onglet « Bilans à traiter » et bandeau d'aperçu", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Jean Nore");
    await user.click(screen.getByRole("button", { name: /Voir les 2 bilans/ }));
    expect(screen.getByRole("tab", { name: /Bilans à traiter/ })).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Jean Nore")).not.toBeInTheDocument();
    expect(screen.getByText("Marie Louise")).toBeInTheDocument();
  });

  it("filtres repliés par défaut ; filtre par évaluateur", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Jean Nore");
    const toggle = screen.getByRole("button", { name: /Filtres avancés/ });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await user.click(toggle);
    await user.selectOptions(screen.getByRole("combobox", { name: /Évalué par/ }), "Awa Diop");
    expect(screen.getByText("Aubin Cabrel")).toBeInTheDocument();
    expect(screen.queryByText("Jean Nore")).not.toBeInTheDocument();
  });

  it("« Voir le bilan » ouvre la synthèse ; « Évaluer » ouvre la fiche sur le diagnostic, par identifiant", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Jean Nore");
    await user.click(screen.getAllByRole("button", { name: /Voir le bilan/ })[0]);
    expect(screen.getByTestId("bilan-view")).toHaveTextContent(/Jean Nore|Aubin Cabrel/);
    await user.click(screen.getAllByRole("button", { name: /Évaluer/ })[0]);
    expect(navigate).toHaveBeenCalledWith("/advisor/families", { state: { familyId: expect.stringMatching(/^(r3|no-request-s4)$/), defaultPanel: "diagnostic" } });
  });

  it("« Nouveau bilan » : choix de l'élève puis ouverture de sa fiche", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Jean Nore");
    await user.click(screen.getByRole("button", { name: /Nouveau bilan/ }));
    const dialog = screen.getByRole("dialog");
    await user.type(within(dialog).getByPlaceholderText(/Rechercher un élève/), "kamel");
    await user.click(within(dialog).getByText("Kamel S."));
    expect(navigate).toHaveBeenCalledWith("/advisor/families", { state: { familyId: "no-request-s4", defaultPanel: "diagnostic" } });
  });

  it("vue Tableau", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Jean Nore");
    await user.click(screen.getByRole("button", { name: /Tableau/ }));
    expect(screen.getAllByRole("row")).toHaveLength(5);
  });

  it("erreur réseau : bouton Réessayer", async () => {
    (fetchAdvisorFamilies as any).mockRejectedValue(new Error("down"));
    renderPage();
    expect(await screen.findByText("Impossible de charger les bilans.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Réessayer/ })).toBeInTheDocument();
  });
});
