// PASSE 2 (frontend) — Corrélation de la faille SÉCURITÉ 03
// ============================================================================
// Objet : /virtual-class/:sessionId est « non restreinte par rôle » (cartographie).
// La passe 1 (server/__tests__/security/03-*) a prouvé que l'API check-in/check-out
// accepte N'IMPORTE quel utilisateur authentifié. Cette passe 2 documente le
// versant UI : côté client, les contrôles de séance (check-in auto, TERMINER,
// ASSIGNER UN DEVOIR) sont gardés par `user.role === 'teacher'`
// (VirtualClassroom.tsx L146/L267/L486/L498). Un élève ne voit donc PAS ces
// contrôles — absence réelle dans le DOM, pas un disabled/display:none.
//
// CONCLUSION DE CORRÉLATION : API laisse passer + UI cache le contrôle → CRITIQUE.
// La garde UI ci-dessous ne protège rien : tout client HTTP contourne l'API.
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom-original";
import VirtualClassroom from "@/pages/common/VirtualClassroom";
import {
  fetchScheduleByRole, fetchCourseDetails,
  sessionCheckIn, sessionCheckOut, submitSessionReport, createHomework,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchScheduleByRole: vi.fn(),
  fetchCourseDetails: vi.fn(),
  sessionCheckIn: vi.fn(),
  sessionCheckOut: vi.fn(),
  submitSessionReport: vi.fn(),
  createHomework: vi.fn(),
}));

// Acteur hostile : un ÉLÈVE ouvre l'URL d'une session (route non restreinte).
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "eleve-hostile-1", name: "Élève Hostile", email: "eleve@it.test", role: "student" } }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const SESSION = {
  id: "sess-1", subject: "Mathématiques", studentName: "Jean Dupont", studentId: "st1",
  courseId: "course-1", actualStartTime: null, actualEndTime: null,
};

function renderAsStudent() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/virtual-class/sess-1"]}>
        <Routes>
          <Route path="/virtual-class/:sessionId" element={<VirtualClassroom />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("PASSE 2 — Classe virtuelle vue par un ÉLÈVE (corrélation SÉCURITÉ 03)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchScheduleByRole as any).mockResolvedValue([SESSION]);
    (fetchCourseDetails as any).mockResolvedValue({ id: "course-1", lessons: [] });
    (globalThis as any).fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    (window as any).JitsiMeetExternalAPI = function JitsiMeetExternalAPIStub() {
      return { addEventListener: vi.fn(), dispose: vi.fn() };
    };
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete (window as any).JitsiMeetExternalAPI;
  });

  it("le check-in automatique n'est PAS déclenché côté UI pour un élève (garde role==='teacher')", async () => {
    renderAsStudent();
    await screen.findAllByText("Notes");
    // Laisse le temps à un éventuel effet de check-in de s'exécuter.
    await new Promise((r) => setTimeout(r, 50));
    expect(sessionCheckIn, "l'UI ne déclenche pas le check-in pour un élève").not.toHaveBeenCalled();
  });

  it("le contrôle TERMINER (check-out) est ABSENT du DOM pour un élève (pas disabled/display:none)", async () => {
    renderAsStudent();
    await screen.findAllByText("Notes");
    expect(screen.queryByRole("button", { name: /TERMINER/i })).toBeNull();
  });

  it("le contrôle ASSIGNER UN DEVOIR est ABSENT du DOM pour un élève", async () => {
    renderAsStudent();
    await screen.findAllByText("Notes");
    expect(screen.queryByRole("button", { name: /ASSIGNER UN DEVOIR/i })).toBeNull();
  });

  it("aucun appel de check-out/rapport/devoir n'est possible depuis l'UI élève", async () => {
    renderAsStudent();
    await screen.findAllByText("Notes");
    expect(sessionCheckOut).not.toHaveBeenCalled();
    expect(submitSessionReport).not.toHaveBeenCalled();
    expect(createHomework).not.toHaveBeenCalled();
  });
});
