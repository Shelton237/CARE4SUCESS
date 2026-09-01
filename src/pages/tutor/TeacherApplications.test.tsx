// Tests unitaires — Espace Tuteur natif — Candidatures profs (/tutor/applications)
// Périmètre : actor-tutor (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Tuteur).
// Couvre les deux onglets : Entretien (PATCH /teacher-applications/:id/interview)
// et Rapport d'évaluation (POST /tutor-evaluations + PATCH /teacher-applications/:id).
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TutorTeacherApplications from "@/pages/tutor/TeacherApplications";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "tutor-1", name: "Aïcha Tuteur", role: "tutor" },
    token: "fake-tutor-token",
  }),
}));

const BASE_APP = {
  id: "app-1",
  full_name: "Marc Nkoulou",
  email: "marc.nkoulou@example.com",
  phone: "+237600000000",
  motivation: "Je souhaite enseigner les mathématiques.",
  subjects: ["Mathématiques", "Physique-Chimie"],
  experience_years: 5,
  status: "pending",
  interview_date: null,
  interview_notes: null,
};

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TutorTeacherApplications />
    </QueryClientProvider>
  );
}

async function selectFirstApplication() {
  await waitFor(() => expect(screen.getByText("Marc Nkoulou")).toBeInTheDocument());
  fireEvent.click(screen.getByText("Marc Nkoulou"));
}

describe("Tuteur — Candidatures profs (/tutor/applications)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("Onglet Entretien", () => {
    it("succès : planifie un entretien avec date et notes préparatoires", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) {
          return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        }
        if (String(url).includes("/interview")) {
          return Promise.resolve({ ok: true, json: async () => ({ ...BASE_APP, interview_date: "2026-08-01T10:00:00.000Z" }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await selectFirstApplication();

      // Champ date/heure (input type=datetime-local, non ciblable par label/placeholder unique)
      const dateField = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      expect(dateField).toBeTruthy();

      fireEvent.change(dateField, { target: { value: "2026-08-01T10:00" } });

      const notesField = screen.getByPlaceholderText(/Points à aborder/i);
      fireEvent.change(notesField, { target: { value: "Vérifier le diplôme et l'expérience." } });

      const submitBtn = screen.getByRole("button", { name: /Planifier l'entretien/i });
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/interview"));
        expect(call).toBeTruthy();
      });

      const [, patchOpts] = fetchMock.mock.calls.find(([url]) => String(url).includes("/interview"))!;
      expect(patchOpts.method).toBe("PATCH");
      const body = JSON.parse(patchOpts.body as string);
      expect(body).toMatchObject({
        interviewDate: "2026-08-01T10:00",
        interviewNotes: "Vérifier le diplôme et l'expérience.",
        interviewStatus: "scheduled",
      });

      // onSuccess réinitialise le formulaire
      await waitFor(() => expect(dateField.value).toBe(""));
    });

    it("champs obligatoires manquants : le bouton \"Planifier l'entretien\" reste désactivé sans date", async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => [BASE_APP] }) as unknown as typeof fetch;

      renderPage();
      await selectFirstApplication();

      const submitBtn = screen.getByRole("button", { name: /Planifier l'entretien/i });
      expect(submitBtn).toBeDisabled();

      // Renseigner uniquement les notes ne suffit pas à activer le bouton
      const notesField = screen.getByPlaceholderText(/Points à aborder/i);
      fireEvent.change(notesField, { target: { value: "Notes sans date" } });
      expect(submitBtn).toBeDisabled();
    });

    it("validation échouée : le serveur rejette la planification (422) sans faire planter l'UI", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        if (String(url).includes("/interview")) {
          return Promise.resolve({ ok: false, status: 422, json: async () => ({ error: "Date invalide" }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await selectFirstApplication();

      const dateField = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(dateField, { target: { value: "2020-01-01T10:00" } });

      const submitBtn = screen.getByRole("button", { name: /Planifier l'entretien/i });
      fireEvent.click(submitBtn);

      // Le bouton reprend son libellé initial (la mutation échoue, onSuccess n'est pas déclenché)
      await waitFor(() => expect(screen.getByRole("button", { name: /Planifier l'entretien/i })).toBeInTheDocument());
      // Le champ n'est pas réinitialisé puisque la requête a échoué
      expect(dateField.value).toBe("2020-01-01T10:00");
    });

    it("erreur réseau : le fetch rejeté (hors-ligne) ne casse pas l'interface", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        if (String(url).includes("/interview")) {
          return Promise.reject(new TypeError("Failed to fetch"));
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await selectFirstApplication();

      const dateField = document.querySelector('input[type="datetime-local"]') as HTMLInputElement;
      fireEvent.change(dateField, { target: { value: "2026-08-01T10:00" } });

      const submitBtn = screen.getByRole("button", { name: /Planifier l'entretien/i });
      fireEvent.click(submitBtn);

      await waitFor(() => expect(screen.getByRole("button", { name: /Planifier l'entretien/i })).toBeInTheDocument());
      expect(dateField.value).toBe("2026-08-01T10:00"); // pas réinitialisé, la mutation a échoué
    });
  });

  describe("Onglet Rapport d'évaluation", () => {
    async function goToEvaluationTab() {
      await selectFirstApplication();
      fireEvent.click(screen.getByRole("button", { name: /Rapport d'évaluation/i }));
    }

    it("succès : soumet l'évaluation avec recommandation \"Approuver\" et met à jour le statut de la candidature", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        if (String(url).includes("/tutor-evaluations")) {
          return Promise.resolve({ ok: true, json: async () => ({ id: "ev-1" }) });
        }
        if (String(url).includes("/teacher-applications/")) {
          return Promise.resolve({ ok: true, json: async () => ({ ...BASE_APP, status: "approved" }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await goToEvaluationTab();

      // Sélection de la recommandation "Approuver"
      fireEvent.click(screen.getByRole("button", { name: /^Approuver$/i }));

      // Classification niveau/matière : "Lycée" pour Mathématiques
      const mathRow = screen.getByText("Mathématiques").closest("div") as HTMLElement;
      fireEvent.click(within(mathRow).getByText("Lycée"));

      const notesField = screen.getByPlaceholderText(/Observations, points forts/i);
      fireEvent.change(notesField, { target: { value: "Excellente pédagogie, ponctuel, très bonne communication." } });

      const submitBtn = screen.getByRole("button", { name: /Soumettre l'évaluation/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"));
        expect(call).toBeTruthy();
      });
      const [, evalOpts] = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"))!;
      const evalBody = JSON.parse(evalOpts.body as string);
      expect(evalBody).toMatchObject({
        applicationId: "app-1",
        pedagogicalScore: 3,
        punctualityScore: 3,
        communicationScore: 3,
        recommendation: "approved",
        overallNotes: "Excellente pédagogie, ponctuel, très bonne communication.",
        levelClassification: { Mathématiques: ["Lycée"] },
      });

      // Mise à jour automatique du statut de la candidature suite à l'approbation
      await waitFor(() => {
        const call = fetchMock.mock.calls.find(
          ([url, o]) => String(url).includes("/teacher-applications/app-1") && o?.method === "PATCH"
        );
        expect(call).toBeTruthy();
      });
      const [, patchOpts] = fetchMock.mock.calls.find(
        ([url, o]) => String(url).includes("/teacher-applications/app-1") && o?.method === "PATCH"
      )!;
      const patchBody = JSON.parse(patchOpts.body as string);
      expect(patchBody).toMatchObject({ status: "approved", reviewerRole: "tutor" });
    });

    it("succès : les scores 1-5 (Pédagogie, Ponctualité, Communication) sont bien transmis lorsqu'ils sont modifiés", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await goToEvaluationTab();

      const pedagogieRow = screen.getByText(/^Pédagogie$/i).closest("div") as HTMLElement;
      fireEvent.click(within(pedagogieRow).getByText("5"));
      const ponctualiteRow = screen.getByText(/^Ponctualité$/i).closest("div") as HTMLElement;
      fireEvent.click(within(ponctualiteRow).getByText("1"));

      const notesField = screen.getByPlaceholderText(/Observations, points forts/i);
      fireEvent.change(notesField, { target: { value: "Observations complètes." } });

      fireEvent.click(screen.getByRole("button", { name: /Soumettre l'évaluation/i }));

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"));
        expect(call).toBeTruthy();
      });
      const [, evalOpts] = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"))!;
      const evalBody = JSON.parse(evalOpts.body as string);
      expect(evalBody.pedagogicalScore).toBe(5);
      expect(evalBody.punctualityScore).toBe(1);
    });

    it("champs obligatoires manquants : écart constaté — la soumission n'est pas bloquée sans observations", async () => {
      // La cartographie présente le champ observations comme partie du rapport,
      // mais le composant ne désactive pas le bouton "Soumettre l'évaluation" en son
      // absence (aucune vérification cliente sur overallNotes). Ce test documente le
      // comportement RÉEL actuel (écart identifié, voir coverage/unit/tutor.md) plutôt
      // que d'inventer une validation qui n'existe pas dans le composant.
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await goToEvaluationTab();

      const submitBtn = screen.getByRole("button", { name: /Soumettre l'évaluation/i });
      expect(submitBtn).not.toBeDisabled();
      fireEvent.click(submitBtn);

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"));
        expect(call).toBeTruthy();
      });
      const [, evalOpts] = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"))!;
      const evalBody = JSON.parse(evalOpts.body as string);
      expect(evalBody.overallNotes).toBe("");
      // Les 3 scores restent malgré tout renseignés (valeur par défaut 3/5)
      expect(evalBody.pedagogicalScore).toBe(3);
      expect(evalBody.punctualityScore).toBe(3);
      expect(evalBody.communicationScore).toBe(3);
    });

    it("validation échouée : le serveur rejette l'évaluation (422) — aucune mise à jour de statut n'est déclenchée", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        if (String(url).includes("/tutor-evaluations")) {
          return Promise.resolve({ ok: false, status: 422, json: async () => ({ error: "Score invalide" }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await goToEvaluationTab();

      fireEvent.click(screen.getByRole("button", { name: /^Approuver$/i }));
      const notesField = screen.getByPlaceholderText(/Observations, points forts/i);
      fireEvent.change(notesField, { target: { value: "Test validation échouée" } });
      fireEvent.click(screen.getByRole("button", { name: /Soumettre l'évaluation/i }));

      await waitFor(() => {
        const call = fetchMock.mock.calls.find(([url]) => String(url).includes("/tutor-evaluations"));
        expect(call).toBeTruthy();
      });

      // Comme l'évaluation a échoué (throw avant le second appel), le PATCH de statut
      // de la candidature n'a jamais été envoyé.
      const statusPatchCall = fetchMock.mock.calls.find(
        ([url, o]) => String(url).includes("/teacher-applications/app-1") && o?.method === "PATCH"
      );
      expect(statusPatchCall).toBeUndefined();
    });

    it("erreur réseau : le fetch rejeté ne casse pas l'interface et le bouton reste utilisable", async () => {
      const fetchMock = vi.fn().mockImplementation((url: string, opts?: RequestInit) => {
        if (!opts?.method) return Promise.resolve({ ok: true, json: async () => [BASE_APP] });
        if (String(url).includes("/tutor-evaluations")) {
          return Promise.reject(new TypeError("Failed to fetch"));
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });
      global.fetch = fetchMock as unknown as typeof fetch;

      renderPage();
      await goToEvaluationTab();

      const notesField = screen.getByPlaceholderText(/Observations, points forts/i);
      fireEvent.change(notesField, { target: { value: "Test erreur réseau" } });
      fireEvent.click(screen.getByRole("button", { name: /Soumettre l'évaluation/i }));

      await waitFor(() => expect(screen.getByRole("button", { name: /Soumettre l'évaluation/i })).toBeInTheDocument());
      expect(screen.getByRole("button", { name: /Soumettre l'évaluation/i })).not.toBeDisabled();
    });
  });
});
