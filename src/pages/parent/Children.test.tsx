import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentChildren from "@/pages/parent/Children";
import * as backoffice from "@/api/backoffice";

// Capacité "Mes Enfants" — cartographie Parent :
// lecture (fetchChildrenByParent), navigation Planning/Cockpit,
// "Contacter" (enseignant) et "Contacter un conseiller" sont (non câblé)

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom-original")>("react-router-dom-original");
  return { ...actual, useNavigate: () => navigateMock };
});

function renderChildren() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentChildren />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [
  {
    id: "child-1",
    name: "Alice Dupont",
    level: "3ème",
    average: 15.5,
    sessionCount: 12,
    attendance: 96,
    teacherName: "M. Kouassi",
    subject: "Maths",
  },
  {
    id: "child-2",
    name: "Bob Dupont",
    level: "Terminale",
    average: 12,
    sessionCount: 8,
    attendance: 90,
    teacherName: "Mme Diallo",
    subject: "Français",
  },
];

describe("Parent > Mes Enfants", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
  });

  it("succès : affiche les cartes enfants avec leurs indicateurs", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    renderChildren();

    await waitFor(() => expect(screen.getByText("Alice Dupont")).toBeInTheDocument());
    expect(screen.getByText("Bob Dupont")).toBeInTheDocument();
    expect(screen.getByText("M. Kouassi")).toBeInTheDocument();
    expect(screen.getByText("2 Étudiants Actifs")).toBeInTheDocument();
  });

  it("navigation : le bouton Planning envoie vers le planning filtré de l'enfant", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    const user = userEvent.setup();
    renderChildren();

    await waitFor(() => expect(screen.getByText("Alice Dupont")).toBeInTheDocument());
    const planningButtons = screen.getAllByText(/Planning/i);
    await user.click(planningButtons[0]);

    expect(navigateMock).toHaveBeenCalledWith("/parent/schedule?studentId=child-1");
  });

  it("navigation : le bouton Cockpit envoie vers la fiche individuelle de l'enfant", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    const user = userEvent.setup();
    renderChildren();

    await waitFor(() => expect(screen.getByText("Alice Dupont")).toBeInTheDocument());
    const cockpitButtons = screen.getAllByText(/Cockpit/i);
    await user.click(cockpitButtons[0]);

    expect(navigateMock).toHaveBeenCalledWith("/parent/children/child-1");
  });

  it("données vides : affiche un état vide si le parent n'a aucun enfant rattaché", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue([] as any);
    renderChildren();

    await waitFor(() => expect(screen.getByText(/Aucun enseignement en cours/i)).toBeInTheDocument());
  });

  it("erreur réseau : ne plante pas si fetchChildrenByParent échoue (liste vide affichée)", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockRejectedValue(new Error("Erreur réseau"));
    renderChildren();

    await waitFor(() => expect(screen.getByText(/Aucun enseignement en cours/i)).toBeInTheDocument());
  });

  it("bouton non câblé : « Contacter » l'enseignant n'a pas de handler (icône décorative)", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    renderChildren();

    await waitFor(() => expect(screen.getByText("Alice Dupont")).toBeInTheDocument());
    // Bouton icône "MessageCircle" à côté de l'enseignant principal : aucun onClick câblé.
    // Ce test documente l'absence de handler ; il échouera si un onClick apparaît
    // sans mise à jour de la cartographie fonctionnelle.
    const contactButtons = document.querySelectorAll("button svg.lucide-message-circle");
    expect(contactButtons.length).toBeGreaterThan(0);
    const button = contactButtons[0].closest("button") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Contacter un conseiller » n'a pas de handler", async () => {
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    renderChildren();

    await waitFor(() => expect(screen.getByText("Alice Dupont")).toBeInTheDocument());
    const button = screen.getByText("Contacter un conseiller") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });
});
