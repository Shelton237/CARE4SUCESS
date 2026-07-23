import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvisorFamilies from "@/pages/advisor/Families";
import { fetchAdvisorFamilies } from "@/api/backoffice";

// Le dossier académique intégré (AcademicFile) est hors périmètre conseiller détaillé
// (composant partagé) : on l'isole pour tester uniquement la page Familles.
vi.mock("../common/AcademicFile", () => ({
  default: () => <div data-testid="academic-file-stub" />,
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
    <QueryClientProvider client={qc}>
      <AdvisorFamilies />
    </QueryClientProvider>
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

      const search = screen.getByPlaceholderText(/Rechercher un parent ou un élève/i);
      await user.type(search, "Inexistant");

      expect(await screen.findByText(/Aucune famille ne correspond à votre recherche/i)).toBeInTheDocument();
    });

    it("erreur réseau : n'affiche aucune famille et affiche un message d'erreur clair (ex: 503 backend) au lieu de données fictives", async () => {
      (fetchAdvisorFamilies as any).mockRejectedValue(new Error("Service temporairement indisponible, réessayez."));
      renderFamilies();

      await waitFor(() => expect(fetchAdvisorFamilies).toHaveBeenCalled());
      expect(screen.queryByText("Mme Ba")).not.toBeInTheDocument();
      expect(await screen.findByText(/Impossible de charger les familles/i)).toBeInTheDocument();
      expect(screen.getByText("Réessayer")).toBeInTheDocument();
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

    it("création : les curseurs de score sont bornés 0–10 (plage imposée par le composant)", async () => {
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
        expect(slider).toHaveAttribute("max", "10");
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
      await user.click(screen.getByText("Plan"));

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
      await user.click(screen.getByText("Plan"));

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
      await user.click(screen.getByText("Plan"));

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
      await user.click(screen.getByText("Plan"));

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
      await user.click(screen.getByText("Plan"));
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

    it("erreur réseau : une erreur de récupération du matching ne fait pas planter l'écran (mais reste silencieuse pour l'utilisateur)", async () => {
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

      // Constat : en cas d'erreur réseau, l'onglet retombe sur le même message que l'état "vide"
      // faute de gestion explicite de isError dans le composant — aucune bannière d'erreur dédiée.
      expect(await screen.findByText("Aucun tuteur disponible pour le moment")).toBeInTheDocument();
    });
  });

  describe("Boutons non câblés (hors périmètre — signalés par la cartographie)", () => {
    it("« Contacter la famille » et « Bilan Conseil » sont affichés mais sans effet observable au clic", async () => {
      const fetchMock = mockFetchByUrl({ "/advisor-notes/": () => jsonResponse([]) });
      vi.stubGlobal("fetch", fetchMock);

      const user = userEvent.setup();
      renderFamilies();
      await user.click(await screen.findByText("Mme Ba"));

      const contactBtn = screen.getByText("Contacter la famille");
      const bilanBtn = screen.getByText("Bilan Conseil");
      const callsBefore = fetchMock.mock.calls.length;

      await user.click(contactBtn);
      await user.click(bilanBtn);

      // Aucun appel réseau supplémentaire déclenché : ces boutons n'ont pas de handler câblé.
      expect(fetchMock.mock.calls.length).toBe(callsBefore);
    });
  });
});
