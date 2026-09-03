import * as React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentHomework from "@/pages/parent/Homework";
import * as backoffice from "@/api/backoffice";

// Capacité "Devoirs" — cartographie Parent :
// lecture des devoirs/ressources par enfant (fetchHomework("parent"),
// fetchLessonResources("parent")). Pas de dépôt de fichier côté parent.

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

function renderHomework(initialEntries: string[] = ["/parent/homework"]) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <ParentHomework />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const children = [
  { id: "child-1", name: "Alice Dupont" },
  { id: "child-2", name: "Bob Dupont" },
];

const homework = [
  {
    id: "hw1", title: "Exercices de conjugaison", status: "à faire", subject: "Français",
    teacherName: "Mme Diallo", dueDate: "25/07", studentId: "child-1", studentName: "Alice Dupont",
    description: "Faire les exercices 1 à 5.",
  },
  {
    id: "hw2", title: "Fiche de révision", status: "corrigé", subject: "Maths",
    teacherName: "M. Kouassi", dueDate: "18/07", studentId: "child-2", studentName: "Bob Dupont",
    description: "Réviser le chapitre 3.", feedback: "Très bon travail",
  },
];

// fileType volontairement différent de "pdf" : le rendu d'une ressource PDF
// déclenche le même bug applicatif que documenté plus bas (FileText non importé).
const resources = [
  { id: "r1", title: "Lien vers la vidéo de cours", subject: "Maths", teacherName: "M. Kouassi", fileType: "link", fileUrl: "/f1.pdf", studentId: "child-1" },
];

describe("Parent > Devoirs", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(backoffice, "fetchChildrenByParent").mockResolvedValue(children as any);
    vi.spyOn(backoffice, "fetchHomework").mockResolvedValue(homework as any);
    vi.spyOn(backoffice, "fetchLessonResources").mockResolvedValue(resources as any);
  });

  it("succès : liste les devoirs avec les compteurs à faire / corrigés", async () => {
    renderHomework();

    await waitFor(() => expect(screen.getByText("Exercices de conjugaison")).toBeInTheDocument());
    expect(screen.getByText("Fiche de révision")).toBeInTheDocument();
    expect(screen.getByText("1 À FAIRE")).toBeInTheDocument();
    expect(screen.getByText("1 CORRIGÉS")).toBeInTheDocument();
    expect(backoffice.fetchHomework).toHaveBeenCalledWith("parent", "parent-1");
    expect(backoffice.fetchLessonResources).toHaveBeenCalledWith("parent", "parent-1");
  });

  it("filtrage par enfant : le sélecteur multi-enfants restreint les devoirs affichés", async () => {
    const user = userEvent.setup();
    renderHomework();

    await waitFor(() => expect(screen.getByText("Exercices de conjugaison")).toBeInTheDocument());
    await user.click(screen.getByText("Bob"));

    expect(screen.queryByText("Exercices de conjugaison")).not.toBeInTheDocument();
    expect(screen.getByText("Fiche de révision")).toBeInTheDocument();
  });

  it("filtrage par enfant : le paramètre studentId de l'URL restreint aussi la liste", async () => {
    renderHomework(["/parent/homework?studentId=child-2"]);

    await waitFor(() => expect(screen.getByText("Fiche de révision")).toBeInTheDocument());
    expect(screen.queryByText("Exercices de conjugaison")).not.toBeInTheDocument();
  });

  it("succès : l'onglet « Fiches & Supports » liste les ressources de cours avec un lien Ouvrir", async () => {
    const user = userEvent.setup();
    renderHomework();

    await waitFor(() => expect(screen.getByText("Exercices de conjugaison")).toBeInTheDocument());
    await user.click(screen.getByText("Fiches & Supports"));

    await waitFor(() => expect(screen.getByText("Lien vers la vidéo de cours")).toBeInTheDocument());
    const openLink = screen.getByText("Ouvrir").closest("a");
    expect(openLink).toHaveAttribute("href", "/f1.pdf");
  });

  it("données vides : affiche un message si aucun devoir n'est assigné", async () => {
    vi.spyOn(backoffice, "fetchHomework").mockResolvedValue([] as any);
    renderHomework();

    await waitFor(() => expect(screen.getByText("Aucun devoir à suivre")).toBeInTheDocument());
  });

  it("erreur réseau : affiche un message d'erreur avec bouton Réessayer si fetchHomework échoue", async () => {
    vi.spyOn(backoffice, "fetchHomework").mockRejectedValue(new Error("Erreur réseau"));
    renderHomework();

    await waitFor(() => expect(screen.getByText(/Erreur de chargement des données/i)).toBeInTheDocument());
    expect(screen.getByText("Réessayer")).toBeInTheDocument();
  });

  it("erreur réseau : affiche aussi le message d'erreur si fetchLessonResources échoue", async () => {
    vi.spyOn(backoffice, "fetchLessonResources").mockRejectedValue(new Error("Erreur réseau"));
    renderHomework();

    await waitFor(() => expect(screen.getByText(/Erreur de chargement des données/i)).toBeInTheDocument());
  });

  it("écart applicatif détecté : l'ouverture du détail d'un devoir plante (FileText non importé dans Homework.tsx)", async () => {
    // Bug pré-existant dans src/pages/parent/Homework.tsx : le composant lucide-react
    // `FileText` est utilisé (accordéon d'un devoir, icône des ressources PDF) sans être
    // importé, ce qui déclenche une ReferenceError au premier rendu qui l'atteint.
    // Cet agent n'a pas le droit de corriger le code applicatif (fichiers de test
    // uniquement) : ce test documente le comportement réel plutôt que de le contourner.
    class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { message: string | null }> {
      state = { message: null as string | null };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      render() {
        return this.state.message
          ? <div data-testid="crash">Erreur de rendu détectée : {this.state.message}</div>
          : this.props.children;
      }
    }

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/parent/homework"]}>
          <LocalErrorBoundary>
            <ParentHomework />
          </LocalErrorBoundary>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Exercices de conjugaison")).toBeInTheDocument());
    await user.click(screen.getByText("Exercices de conjugaison"));

    await waitFor(() => expect(screen.getByTestId("crash")).toBeInTheDocument());
    expect(screen.getByTestId("crash").textContent).toContain("FileText is not defined");
    consoleErrorSpy.mockRestore();
  });

  it("écart applicatif détecté : une ressource de type PDF dans « Fiches & Supports » plante pour la même raison", async () => {
    vi.spyOn(backoffice, "fetchLessonResources").mockResolvedValue([
      { id: "r2", title: "Fiche PDF", subject: "Maths", teacherName: "M. Kouassi", fileType: "pdf", fileUrl: "/f2.pdf", studentId: "child-1" },
    ] as any);

    class LocalErrorBoundary extends React.Component<{ children: React.ReactNode }, { message: string | null }> {
      state = { message: null as string | null };
      static getDerivedStateFromError(error: Error) {
        return { message: error.message };
      }
      render() {
        return this.state.message
          ? <div data-testid="crash">Erreur de rendu détectée : {this.state.message}</div>
          : this.props.children;
      }
    }

    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const user = userEvent.setup();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/parent/homework"]}>
          <LocalErrorBoundary>
            <ParentHomework />
          </LocalErrorBoundary>
        </MemoryRouter>
      </QueryClientProvider>
    );

    await waitFor(() => expect(screen.getByText("Exercices de conjugaison")).toBeInTheDocument());
    await user.click(screen.getByText("Fiches & Supports"));

    await waitFor(() => expect(screen.getByTestId("crash")).toBeInTheDocument());
    expect(screen.getByTestId("crash").textContent).toContain("FileText is not defined");
    consoleErrorSpy.mockRestore();
  });
});
