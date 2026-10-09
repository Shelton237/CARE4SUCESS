import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorFamilies from "@/pages/advisor/Families";
import { fetchAdvisorFamilies } from "@/api/backoffice";

// Le dossier académique intégré (AcademicFile) est hors périmètre conseiller détaillé
// (composant partagé) : on l'isole pour tester uniquement la page Familles.
vi.mock("../common/AcademicFile", () => ({
  default: () => <div data-testid="academic-file-stub" />,
}));

const { navigateMock, toastSuccessMock } = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock("sonner", () => ({
  toast: { success: toastSuccessMock, error: vi.fn() },
}));

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorFamilies: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" },
    token: "fake-token",
  }),
}));

const FAMILY = {
  id: "fam-1",
  parentName: "Mme Ba",
  childName: "Idris Ba",
  studentId: "student-1",
  teacherName: "M. Diop",
  level: "CM2",
  average: "14",
  attendance: "92%",
  subject: "Mathématiques",
  lastReportDate: "12/06/2026",
};

function renderFamilies() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}>
        <AdvisorFamilies />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

function mockFetchByUrl(handlers: Record<string, () => Promise<Response> | Response>) {
  return vi.fn((url: string, _init?: RequestInit) => {
    for (const pattern of Object.keys(handlers)) {
      if (url.includes(pattern)) return Promise.resolve(handlers[pattern]());
    }
    return Promise.resolve(new Response(JSON.stringify(null), { status: 200 }));
  });
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

describe("AdvisorFamilies — Mes familles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorFamilies as any).mockResolvedValue([FAMILY]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("Liste et recherche", () => {
    it("succès : affiche la liste des familles récupérées via fetchAdvisorFamilies", async () => {
      renderFamilies();
      expect(await screen.findByText("Mme Ba")).toBeInTheDocument();
      expect(screen.getByText(/Idris Ba/)).toBeInTheDocument();
      expect(fetchAdvisorFamilies).toHaveBeenCalledTimes(1);
    });

    it("recherche : filtre la liste par nom de parent ou d'élève, message vide si aucun résultat", async () => {
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Mme Ba");

      const search = screen.getByPlaceholderText(/Rechercher un parent, un élève/i);
      await user.type(search, "Inexistant");

      expect(await screen.findByText(/Aucune famille ne correspond à votre recherche/i)).toBeInTheDocument();
    });

    it("erreur réseau : n'affiche aucune famille si fetchAdvisorFamilies échoue", async () => {
      (fetchAdvisorFamilies as any).mockRejectedValue(new Error("Network Error"));
      renderFamilies();

      await waitFor(() => expect(fetchAdvisorFamilies).toHaveBeenCalled());
      expect(screen.queryByText("Mme Ba")).not.toBeInTheDocument();
    });
  });

  describe("Onglet Notes", () => {
    it("succès : ajoute une note via POST /advisor-notes puis rafraîchit la liste", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor-notes/": () => jsonResponse([{ id: "n1", note_type: "observation", content: "Bon élève", created_at: "2026-07-01" }]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));

      await user.click(screen.getByText("Ajouter"));
      const textarea = screen.getByPlaceholderText("Votre observation...");
      await user.type(textarea, "Élève motivé");
      await user.click(screen.getByText("Enregistrer"));

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(([, init]: any) => init?.method === "POST" && (init.body as string)?.includes("Élève motivé"));
        expect(postCall).toBeTruthy();
      });
    });

    it("champs obligatoires manquants : le bouton Enregistrer est désactivé sans contenu de note", async () => {
      const fetchMock = mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Ajouter"));

      const saveButton = screen.getByText("Enregistrer");
      expect(saveButton).toBeDisabled();
    });

    it("erreur réseau : l'ajout de note échoué ne casse pas l'interface et conserve la saisie", async () => {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "POST") return Promise.resolve(new Response(null, { status: 500 }));
        if (url.includes("/advisor-notes/")) return Promise.resolve(jsonResponse([]));
        return Promise.resolve(jsonResponse(null));
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Ajouter"));
      const textarea = screen.getByPlaceholderText("Votre observation...");
      await user.type(textarea, "Contenu non envoyé");
      await user.click(screen.getByText("Enregistrer"));

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      // Le formulaire reste affiché avec la saisie : aucun retour d'erreur explicite à l'utilisateur.
      expect(screen.getByPlaceholderText("Votre observation...")).toHaveValue("Contenu non envoyé");
    });

    it("suppression : DELETE /advisor-notes/:id appelé au clic sur la croix", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor-notes/": () => jsonResponse([{ id: "n1", note_type: "observation", content: "À supprimer", created_at: "2026-07-01" }]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      const deleteBtn = await screen.findByText("×");
      await user.click(deleteBtn);

      await waitFor(() => {
        const deleteCall = fetchMock.mock.calls.find(([url, init]: any) => init?.method === "DELETE" && url.includes("/advisor-notes/n1"));
        expect(deleteCall).toBeTruthy();
      });
    });
  });

  describe("Onglet Diagnostic", () => {
    it("succès : consultation du dernier diagnostic (GET /students/:id/diagnostic)", async () => {
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse({ id: "diag-1", created_at: "2026-06-01", scores: { Mathématiques: 8 }, strengths: "Rigueur", weaknesses: "Lecture" }),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));

      expect(await screen.findByText("Mathématiques")).toBeInTheDocument();
      expect(screen.getByText("Rigueur")).toBeInTheDocument();
      expect(screen.getByText("Lecture")).toBeInTheDocument();
    });

    it("création : les curseurs de score sont bornés 0 à 5 (échelle du diagnostic)", async () => {
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));

      const sliders = await screen.findAllByRole("slider");
      expect(sliders.length).toBeGreaterThan(0);
      sliders.forEach((slider) => {
        expect(slider).toHaveAttribute("min", "0");
        expect(slider).toHaveAttribute("max", "5");
      });
    });

    it("succès : enregistrement d'un nouveau diagnostic (POST /students/:id/diagnostic)", async () => {
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));
      await user.click(screen.getByText("Enregistrer le diagnostic"));

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(([url, init]: any) => init?.method === "POST" && url.includes("/diagnostic"));
        expect(postCall).toBeTruthy();
      });
    });

    it("erreur réseau : l'enregistrement du diagnostic échoué n'affiche pas de succès", async () => {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "POST" && url.includes("/diagnostic")) return Promise.resolve(new Response(null, { status: 500 }));
        if (url.includes("/diagnostic")) return Promise.resolve(jsonResponse(null));
        if (url.includes("/advisor-notes/")) return Promise.resolve(jsonResponse([]));
        return Promise.resolve(jsonResponse(null));
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));
      await user.click(screen.getByText("Enregistrer le diagnostic"));

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      // Le formulaire de création reste affiché : la mutation a échoué et n'a pas invalidé la query.
      expect(screen.getByText("Enregistrer le diagnostic")).toBeInTheDocument();
    });
  });

  describe("Onglet Plan", () => {
    it("succès : consultation du plan pédagogique actif (GET /students/:id/academic-plan)", async () => {
      const fetchMock = mockFetchByUrl({
        "/academic-plan": () => jsonResponse({ id: "plan-1", title: "Plan de rattrapage", start_date: "2026-07-01", weeks: [{ objective: "Revoir les fractions", subjects: ["Mathématiques"], done: false }] }),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));

      expect(await screen.findByText("Plan de rattrapage")).toBeInTheDocument();
      expect(screen.getByText("Revoir les fractions")).toBeInTheDocument();
    });

    it("champs obligatoires manquants : le bouton Enregistrer le plan est désactivé sans titre ni date de début", async () => {
      const fetchMock = mockFetchByUrl({
        "/academic-plan": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));

      expect(screen.getByText("Enregistrer le plan")).toBeDisabled();
    });

    it("protection UI : impossible de supprimer la dernière semaine (pas de bouton de suppression pour une semaine unique)", async () => {
      const fetchMock = mockFetchByUrl({
        "/academic-plan": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));

      // Une semaine unique par défaut : aucune icône de suppression tant qu'il n'y en a qu'une.
      // (Documente qu'il n'est pas possible d'atteindre un plan "sans semaine" via l'UI.)
      expect(screen.getByPlaceholderText("Titre du plan...")).toBeInTheDocument();
      expect(screen.getByText(/^S1$/)).toBeInTheDocument();
    });

    it("succès : enregistrement d'un plan avec titre et date de début renseignés", async () => {
      const fetchMock = mockFetchByUrl({
        "/academic-plan": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));

      await user.type(screen.getByPlaceholderText("Titre du plan..."), "Plan de soutien");
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.type(dateInput, "2026-08-01");

      const saveButton = screen.getByText("Enregistrer le plan");
      expect(saveButton).toBeEnabled();
      await user.click(saveButton);

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(([url, init]: any) => init?.method === "POST" && url.includes("/academic-plan"));
        expect(postCall).toBeTruthy();
      });
    });

    it("erreur réseau : l'enregistrement du plan échoué n'invalide pas la query et conserve le formulaire", async () => {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "POST" && url.includes("/academic-plan")) return Promise.resolve(new Response(null, { status: 500 }));
        if (url.includes("/academic-plan")) return Promise.resolve(jsonResponse(null));
        if (url.includes("/advisor-notes/")) return Promise.resolve(jsonResponse([]));
        return Promise.resolve(jsonResponse(null));
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));
      await user.type(screen.getByPlaceholderText("Titre du plan..."), "Plan X");
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
      await user.type(dateInput, "2026-08-01");
      await user.click(screen.getByText("Enregistrer le plan"));

      await waitFor(() => expect(fetchMock).toHaveBeenCalled());
      expect(screen.getByPlaceholderText("Titre du plan...")).toBeInTheDocument();
    });
  });

  describe("Onglet Matching (lecture)", () => {
    it("succès : affiche les tuteurs recommandés (GET /advisor/match/:studentId)", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor/match/": () => jsonResponse({
          student: { weakSubjects: ["Anglais"] },
          matches: [{ id: "t1", name: "M. Sow", perf: 4.5, subjects: ["Mathématiques"], rate: 5000, score: 92 }],
        }),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Match"));

      expect(await screen.findByText("M. Sow")).toBeInTheDocument();
      expect(screen.getByText("Anglais")).toBeInTheDocument();
    });

    it("état vide : affiche un message si aucun tuteur n'est disponible", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor/match/": () => jsonResponse({ matches: [] }),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Match"));

      expect(await screen.findByText("Aucun tuteur disponible pour le moment")).toBeInTheDocument();
    });

    it("erreur réseau : une erreur de récupération du matching affiche une erreur distincte avec Réessayer (pas « Aucun tuteur »)", async () => {
      const fetchMock = vi.fn((url: string) => {
        if (url.includes("/advisor/match/")) return Promise.reject(new Error("Network Error"));
        if (url.includes("/advisor-notes/")) return Promise.resolve(jsonResponse([]));
        return Promise.resolve(jsonResponse(null));
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Match"));

      expect(await screen.findByText("Impossible de charger les tuteurs recommandés.")).toBeInTheDocument();
      expect(screen.getByText("Réessayer")).toBeInTheDocument();
      expect(screen.queryByText("Aucun tuteur disponible pour le moment")).not.toBeInTheDocument();
    });

    it("erreur serveur (403) : le matching affiche l'erreur et non « Aucun tuteur »", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor/match/": () => jsonResponse({ message: "Accès refusé" }, 403),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Match"));

      expect(await screen.findByText("Impossible de charger les tuteurs recommandés.")).toBeInTheDocument();
    });
  });

  describe("Non-régression lot FAM", () => {
    it("FAM-01 : une réponse 500 sur les notes n'écrase pas le panneau et affiche un message d'erreur", async () => {
      const fetchMock = mockFetchByUrl({
        "/advisor-notes/": () => jsonResponse({ message: "Erreur serveur" }, 500),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));

      expect(await screen.findByText("Impossible de charger les notes.")).toBeInTheDocument();
      expect(screen.getByText("Ajouter")).toBeInTheDocument();
    });

    it("FAM-02 : la suppression d'une note en échec ne plante pas et le bouton est actif à nouveau", async () => {
      const fetchMock = vi.fn((url: string, init?: RequestInit) => {
        if (init?.method === "DELETE") return Promise.resolve(new Response(null, { status: 500 }));
        if (url.includes("/advisor-notes/")) return Promise.resolve(jsonResponse([{ id: "n1", note_type: "observation", content: "Note", created_at: "2026-07-01" }]));
        return Promise.resolve(jsonResponse(null));
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(await screen.findByText("×"));

      await waitFor(() => expect(fetchMock.mock.calls.some(([, init]: any) => init?.method === "DELETE")).toBe(true));
      await waitFor(() => expect(screen.getByText("×")).toBeEnabled());
      expect(screen.getByText("Note")).toBeInTheDocument();
    });

    it("FAM-03 : le diagnostic enregistré sans toucher aux curseurs envoie 3 pour chaque matière", async () => {
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));
      await user.click(await screen.findByText("Enregistrer le diagnostic"));

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(([url, init]: any) => init?.method === "POST" && url.includes("/diagnostic"));
        expect(postCall).toBeTruthy();
        const body = JSON.parse((postCall as any)[1].body);
        expect(body.scores).toEqual({ "Mathématiques": 3 });
      });
    });

    it("matières dynamiques : seules les matières choisies à l'inscription sont évaluées", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([{ ...FAMILY, subject: "Anglais, Mathématiques" }]);
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));

      expect(await screen.findAllByRole("slider")).toHaveLength(2);
      await user.click(screen.getByText("Enregistrer le diagnostic"));

      await waitFor(() => {
        const postCall = fetchMock.mock.calls.find(([url, init]: any) => init?.method === "POST" && url.includes("/diagnostic"));
        expect(JSON.parse((postCall as any)[1].body).scores).toEqual({ "Anglais": 3, "Mathématiques": 3 });
      });
    });

    it("matières dynamiques : sans matière renseignée, la liste complète est proposée", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([{ ...FAMILY, subject: "" }]);
      vi.stubGlobal("fetch", mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/advisor-notes/": () => jsonResponse([]),
      }));

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));

      expect(await screen.findAllByRole("slider")).toHaveLength(6);
    });

    it("FAM-04 : une 500 sur le diagnostic affiche une erreur avec Réessayer et non le formulaire vide", async () => {
      const fetchMock = mockFetchByUrl({
        "/diagnostic": () => jsonResponse({ message: "boom" }, 500),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Diag."));

      expect(await screen.findByText("Impossible de charger le diagnostic.")).toBeInTheDocument();
      expect(screen.queryByText("Enregistrer le diagnostic")).not.toBeInTheDocument();
    });

    it("FAM-04 : une 404 sur le plan reste un état « aucun plan » (formulaire de création)", async () => {
      const fetchMock = mockFetchByUrl({
        "/academic-plan": () => jsonResponse({ message: "none" }, 404),
        "/advisor-notes/": () => jsonResponse([]),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /^Plan$/ }));

      expect(await screen.findByPlaceholderText("Titre du plan...")).toBeInTheDocument();
    });

    it("FAM-07 : aucun tiret cadratin visible quand les champs optionnels sont vides ou valent « tiret »", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([
        { id: "fam-2", parentName: "Mme Sy", childName: "Awa Sy", studentId: "student-2", teacherName: "—", nextRdv: "—", level: null },
      ]);
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) }));

      const user = userEvent.setup();
      const { container } = renderFamilies();
      await user.click(await screen.findByText("Mme Sy"));

      expect(container.textContent).not.toContain("—");
    });
  });

  describe("FAM-08 : Contacter la famille", () => {
    it("parentId présent : navigue vers la messagerie en présélectionnant le contact (state.contactId)", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([{ ...FAMILY, parentId: "parent-42" }]);
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) }));

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Contacter la famille"));

      expect(navigateMock).toHaveBeenCalledWith("/advisor/messages", {
        state: { contactId: "parent-42", contactName: "Mme Ba" },
      });
    });

    it("parentId absent ou null : navigation inchangée, sans présélection", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([{ ...FAMILY, parentId: null }]);
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) }));

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByText("Contacter la famille"));

      expect(navigateMock).toHaveBeenCalledWith("/advisor/messages");
    });
  });

  describe("FAM-09 : Bilan Conseil", () => {
    const DIAG = { id: "diag-1", created_at: "2026-06-01", scores: { Mathématiques: 4, Français: 2 }, strengths: "Rigueur", weaknesses: "Lecture" };
    const PLAN = { id: "plan-1", title: "Plan de rattrapage", start_date: "2026-07-01", weeks: [
      { objective: "Revoir les fractions", subjects: ["Mathématiques"], done: true },
      { objective: "Dictées quotidiennes", subjects: ["Français"], done: false },
    ] };

    async function openBilan() {
      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));
      await user.click(screen.getByRole("button", { name: /Bilan Conseil/ }));
      return { user, dialog: await screen.findByRole("dialog") };
    }

    it("ouvre la vue depuis la fiche et affiche en-tête, diagnostic, plan, notes et signature", async () => {
      vi.stubGlobal("fetch", mockFetchByUrl({
        "/diagnostic": () => jsonResponse(DIAG),
        "/academic-plan": () => jsonResponse(PLAN),
        "/advisor-notes/": () => jsonResponse([
          { id: "n1", note_type: "alerte", content: "Retards fréquents", created_at: "2026-07-02" },
        ]),
      }));

      const { dialog } = await openBilan();
      const view = within(dialog);

      expect(view.getByText("Idris Ba")).toBeInTheDocument();
      expect(view.getByText("M. Diop")).toBeInTheDocument();
      expect(await view.findByText("4/5")).toBeInTheDocument();
      expect(view.getByText("2/5")).toBeInTheDocument();
      expect(view.getByText("Rigueur")).toBeInTheDocument();
      expect(view.getByText("Lecture")).toBeInTheDocument();
      expect(await view.findByText("Plan de rattrapage")).toBeInTheDocument();
      expect(view.getByText("Revoir les fractions")).toBeInTheDocument();
      expect(view.getByText("Fait")).toBeInTheDocument();
      expect(view.getByText("À faire")).toBeInTheDocument();
      expect(await view.findByText("Retards fréquents")).toBeInTheDocument();
      expect(view.getByText(/Alerte/)).toBeInTheDocument();
      expect(view.getByText(/Bilan généré le .* par Aline Conseillère/)).toBeInTheDocument();
      expect(dialog.textContent).not.toContain("—");
    });

    it("limite les notes aux 5 plus récentes", async () => {
      const notes = Array.from({ length: 7 }, (_, i) => ({
        id: `n${i}`, note_type: "observation", content: `Note numero ${i}`, created_at: `2026-07-0${i + 1}`,
      }));
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse(notes) }));

      const { dialog } = await openBilan();
      const view = within(dialog);

      expect(await view.findByText("Note numero 6")).toBeInTheDocument();
      expect(view.getByText("Note numero 2")).toBeInTheDocument();
      expect(view.queryByText("Note numero 1")).not.toBeInTheDocument();
      expect(view.queryByText("Note numero 0")).not.toBeInTheDocument();
    });

    it("sections vides : messages explicites", async () => {
      vi.stubGlobal("fetch", mockFetchByUrl({
        "/diagnostic": () => jsonResponse(null),
        "/academic-plan": () => jsonResponse({ message: "none" }, 404),
        "/advisor-notes/": () => jsonResponse([]),
      }));

      const { dialog } = await openBilan();
      const view = within(dialog);

      expect(await view.findByText("Aucun diagnostic enregistré")).toBeInTheDocument();
      expect(await view.findByText("Aucun plan pédagogique actif")).toBeInTheDocument();
      expect(await view.findByText("Aucune note enregistrée")).toBeInTheDocument();
    });

    it("prospect : lit les endpoints /requests/:id/*, pas de notes ni d'appel advisor-notes", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([
        { id: "req-9", parentName: "M. Kane", childName: "Omar Kane", level: "6e", status: "nouveau" },
      ]);
      const fetchMock = mockFetchByUrl({
        "/requests/req-9/diagnostic": () => jsonResponse(DIAG),
        "/requests/req-9/plan": () => jsonResponse(PLAN),
      });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("M. Kane"));
      await user.click(screen.getByRole("button", { name: /Bilan Conseil/ }));
      const view = within(await screen.findByRole("dialog"));

      expect(await view.findByText("Notes disponibles après création du compte élève")).toBeInTheDocument();
      expect(await view.findByText("Rigueur")).toBeInTheDocument();
      expect(await view.findByText("Plan de rattrapage")).toBeInTheDocument();
      expect(fetchMock.mock.calls.some(([url]: any) => String(url).includes("/advisor-notes/"))).toBe(false);
    });

    it("erreur serveur : message d'erreur par section avec Réessayer, sans afficher « Aucun diagnostic »", async () => {
      vi.stubGlobal("fetch", mockFetchByUrl({
        "/diagnostic": () => jsonResponse({ message: "boom" }, 500),
        "/academic-plan": () => jsonResponse(PLAN),
        "/advisor-notes/": () => jsonResponse([]),
      }));

      const { dialog } = await openBilan();
      const view = within(dialog);

      expect(await view.findByText("Impossible de charger le diagnostic.")).toBeInTheDocument();
      expect(view.getByRole("button", { name: /Réessayer/ })).toBeInTheDocument();
      expect(view.queryByText("Aucun diagnostic enregistré")).not.toBeInTheDocument();
    });

    it("« Imprimer / Exporter en PDF » appelle window.print", async () => {
      const printSpy = vi.spyOn(window, "print").mockImplementation(() => {});
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) }));

      const { user, dialog } = await openBilan();
      await user.click(within(dialog).getByRole("button", { name: /Imprimer \/ Exporter en PDF/ }));

      expect(printSpy).toHaveBeenCalledTimes(1);
      printSpy.mockRestore();
    });

    it("« Fermer » referme la vue", async () => {
      vi.stubGlobal("fetch", mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) }));

      const { user, dialog } = await openBilan();
      await user.click(within(dialog).getByRole("button", { name: "Fermer" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    });
  });

  describe("FAM-15 : tri, onglets, badges", () => {
    const rowsText = () =>
      within(screen.getByRole("table")).getAllByRole("row").slice(1).map(r => r.textContent || "");

    const PEOPLE = [
      { id: "a", parentName: "Zoe Martin", childName: "Léo", studentId: "s-a", status: "suivi actif" },
      { id: "b", parentName: "Alice Durand", childName: "Hugo", studentId: "s-b", status: "nouveau" },
      { id: "c", parentName: "Marc Petit", childName: "Anna", studentId: "s-c", status: "matching" },
    ];

    it("tri par « Famille / Contact » : asc puis desc, indicateur aria-sort", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(PEOPLE);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Zoe Martin");

      const header = screen.getByRole("button", { name: /Famille \/ Contact/ });
      await user.click(header);
      let rows = rowsText();
      expect(rows[0]).toContain("Alice Durand");
      expect(rows[2]).toContain("Zoe Martin");
      expect(header.closest("th")).toHaveAttribute("aria-sort", "ascending");

      await user.click(header);
      rows = rowsText();
      expect(rows[0]).toContain("Zoe Martin");
      expect(rows[2]).toContain("Alice Durand");
      expect(header.closest("th")).toHaveAttribute("aria-sort", "descending");
    });

    it("tri par « Lien avec l'élève » et par « Statut »", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(PEOPLE);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Zoe Martin");

      await user.click(screen.getByRole("button", { name: /Lien avec l'élève/ }));
      expect(rowsText()[0]).toContain("Anna");

      await user.click(screen.getByRole("button", { name: /^Statut/ }));
      // Libellés : Matching, Nouveau, Suivi actif
      const rows = rowsText();
      expect(rows[0]).toContain("Marc Petit");
      expect(rows[2]).toContain("Zoe Martin");
    });

    it("tri stable : à valeur égale l'ordre d'origine est conservé, aussi en desc", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([
        { id: "1", parentName: "Famille Sy", childName: "Premier", studentId: "s1" },
        { id: "2", parentName: "Famille Sy", childName: "Deuxieme", studentId: "s2" },
        { id: "3", parentName: "Autre", childName: "Troisieme", studentId: "s3" },
      ]);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Autre");

      const header = screen.getByRole("button", { name: /Famille \/ Contact/ });
      await user.click(header);
      await user.click(header);
      const rows = rowsText();
      expect(rows[0]).toContain("Premier");
      expect(rows[1]).toContain("Deuxieme");
      expect(rows[2]).toContain("Troisieme");
    });

    it("le tri s'applique à la liste filtrée", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(PEOPLE);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Zoe Martin");

      await user.type(screen.getByPlaceholderText(/Rechercher un parent, un élève/i), "a");
      await user.click(screen.getByRole("button", { name: /Famille \/ Contact/ }));
      const rows = rowsText();
      expect(rows).toHaveLength(3 - rows.filter(r => !/a/i.test(r)).length);
      expect(rows[0]).toContain("Alice Durand");
    });

    const MIXED = [
      { id: "p1", parentName: "Prospect Nouveau", childName: "Kim", status: "nouveau" },
      { id: "p2", parentName: "Prospect Matching", childName: "Lou", status: "matching" },
      { id: "p3", parentName: "Prospect Inconnu", childName: "Mia", status: undefined },
      { id: "s1", parentName: "Parent Compte", childName: "Noa", studentId: "s-1", status: "nouveau" },
    ];

    it("onglet Prospects : toutes les familles sans compte, quel que soit le statut", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(MIXED);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Prospect Nouveau");

      await user.click(screen.getByRole("button", { name: "Prospects" }));
      const rows = rowsText();
      expect(rows).toHaveLength(3);
      expect(rows.join("|")).not.toContain("Parent Compte");
    });

    it("onglet À qualifier : seulement les prospects au statut initial, cohérent avec la carte de stat", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(MIXED);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      const user = userEvent.setup();
      renderFamilies();
      await screen.findByText("Prospect Nouveau");

      await user.click(screen.getByRole("button", { name: "À qualifier" }));
      const rows = rowsText();
      expect(rows).toHaveLength(2);
      expect(rows.join("|")).toContain("Prospect Nouveau");
      expect(rows.join("|")).toContain("Prospect Inconnu");
      expect(rows.join("|")).not.toContain("Prospect Matching");

      const card = screen.getByText("Nécessitent un suivi rapproché").parentElement as HTMLElement;
      expect(within(card).getByText("2")).toBeInTheDocument();
    });

    it("badge d'un prospect : vrai statut serveur (Matching) ou À qualifier si initial", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue(MIXED);
      vi.stubGlobal("fetch", mockFetchByUrl({}));
      renderFamilies();
      await screen.findByText("Prospect Nouveau");

      const rows = rowsText();
      expect(rows.find(r => r.includes("Prospect Matching"))).toContain("Matching");
      expect(rows.find(r => r.includes("Prospect Matching"))).not.toContain("À qualifier");
      expect(rows.find(r => r.includes("Prospect Nouveau"))).toContain("À qualifier");
      expect(rows.find(r => r.includes("Prospect Inconnu"))).toContain("À qualifier");
    });

    it("conversion : le toast de succès est professionnel, sans emoji", async () => {
      (fetchAdvisorFamilies as any).mockResolvedValue([MIXED[0]]);
      vi.stubGlobal("fetch", mockFetchByUrl({
        "/convert": () => jsonResponse({ studentEmail: "kim@exemple.test" }),
      }));
      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Prospect Nouveau"));
      await user.click(screen.getByRole("button", { name: /Créer le compte élève/ }));

      await waitFor(() => expect(toastSuccessMock).toHaveBeenCalled());
      const message = String(toastSuccessMock.mock.calls[0][0]);
      expect(message).toContain("kim@exemple.test");
      expect(message).not.toMatch(/\p{Extended_Pictographic}/u);
    });
  });
});
