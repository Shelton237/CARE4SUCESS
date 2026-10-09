import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AdvisorBilanView from "./AdvisorBilanView";

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" },
    token: "fake-token",
  }),
}));

const STUDENT_FAMILY = {
  id: "fam-1",
  parentName: "Mme Ba",
  childName: "Idris Ba",
  studentId: "student-1",
  teacherName: "M. Diop",
  level: "CM2",
  subject: "Mathématiques",
  requestDate: "12/06/2026",
  nextRdv: "—",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

function renderView(family: any, onClose = vi.fn(), qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AdvisorBilanView family={family} onClose={onClose} />
    </QueryClientProvider>
  );
  return { onClose, client };
}

describe("AdvisorBilanView", () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("élève avec compte : appelle les 3 GET existants avec le jeton", async () => {
    const fetchMock = vi.fn((_url: string, _init?: RequestInit) => Promise.resolve(json([])));
    vi.stubGlobal("fetch", fetchMock);
    renderView(STUDENT_FAMILY);

    await screen.findByText("Aucune note enregistrée");
    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls.some(u => u.endsWith("/advisor-notes/student-1"))).toBe(true);
    expect(urls.some(u => u.endsWith("/students/student-1/diagnostic"))).toBe(true);
    expect(urls.some(u => u.endsWith("/students/student-1/academic-plan"))).toBe(true);
    expect((fetchMock.mock.calls[0][1] as any).headers.Authorization).toBe("Bearer fake-token");
  });

  it("partage le cache React Query : aucune requête si les données sont déjà en cache", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(json(null)));
    vi.stubGlobal("fetch", fetchMock);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
    qc.setQueryData(["advisorNotes", "student-1"], [{ id: "n1", note_type: "positif", content: "Très motivé", created_at: "2026-07-01" }]);
    qc.setQueryData(["diagnostic", "student-1"], { id: "d1", created_at: "2026-06-01", scores: { Anglais: 5 }, strengths: "Oral", weaknesses: "Écrit" });
    qc.setQueryData(["academicPlan", "student-1"], { id: "p1", title: "Plan été", start_date: "2026-07-01", weeks: [] });
    renderView(STUDENT_FAMILY, vi.fn(), qc);

    expect(await screen.findByText("Très motivé")).toBeInTheDocument();
    expect(screen.getByText("5/5 · Maîtrisé")).toBeInTheDocument();
    expect(screen.getByText("Plan été")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("valeurs de repli : aucun tiret cadratin, « Non assigné » pour un tuteur absent", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json(null))));
    renderView({ ...STUDENT_FAMILY, teacherName: "—", level: null, subject: undefined, requestDate: "—" });

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Non assigné")).toBeInTheDocument();
    expect(dialog.textContent).not.toContain("—");
  });

  it("erreur des notes : message + Réessayer relance la requête", async () => {
    let notesCalls = 0;
    vi.stubGlobal("fetch", vi.fn((url: string) => {
      if (String(url).includes("/advisor-notes/")) {
        notesCalls += 1;
        return Promise.resolve(notesCalls === 1 ? json({ message: "boom" }, 500) : json([]));
      }
      return Promise.resolve(json(null));
    }));
    const user = userEvent.setup();
    renderView(STUDENT_FAMILY);

    expect(await screen.findByText("Impossible de charger les notes.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Réessayer/ }));
    expect(await screen.findByText("Aucune note enregistrée")).toBeInTheDocument();
    expect(notesCalls).toBe(2);
  });

  it("appelle onClose via « Fermer »", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json([]))));
    const user = userEvent.setup();
    const { onClose } = renderView(STUDENT_FAMILY);

    await user.click(await screen.findByRole("button", { name: "Fermer" }));
    expect(onClose).toHaveBeenCalled();
  });

  it("contient une feuille de styles d'impression qui masque l'application", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(json([]))));
    renderView(STUDENT_FAMILY);
    const dialog = await screen.findByRole("dialog");
    const css = dialog.querySelector("style")?.textContent ?? "";
    expect(css).toContain("@media print");
    expect(css).toContain("#root");
    expect(dialog.id).toBe("advisor-bilan-print");
  });
});
