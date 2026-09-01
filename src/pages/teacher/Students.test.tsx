// Tests unitaires — Espace Enseignant — Mes Apprenants (/teacher/students)
// Périmètre : actor-teacher (voir docs/CARTOGRAPHIE_FONCTIONNELLE.md, section Enseignant).
// Couvre : lecture des élèves (fetchTeacherStudents), recherche, ouverture du dossier
// académique (AcademicFile), et documente l'absence de câblage du bouton
// "Envoyer un message" dans ce composant précis.
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TeacherStudents from "@/pages/teacher/Students";
import { fetchTeacherStudents } from "@/api/backoffice";

// AcademicFile est un composant partagé hors périmètre détaillé de cette page ;
// on l'isole pour tester uniquement Mes Apprenants.
vi.mock("../common/AcademicFile", () => ({
  default: ({ studentId }: { studentId: string }) => <div data-testid="academic-file-stub">Dossier de {studentId}</div>,
}));

vi.mock("@/api/backoffice", () => ({
  fetchTeacherStudents: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "teacher-1", name: "Mme Ngono", role: "teacher" } }),
}));

const STUDENTS = [
  { id: "st1", name: "Jean Dupont", level: "3ème", average: "14", attendance: "92%", homeworkCount: 5, email: "jean@example.com", phone: "+237600000001", lastSessionDate: "20/07/2026" },
  { id: "st2", name: "Awa Ba", level: "Terminale", average: "16", attendance: "88%", homeworkCount: 3, email: "awa@example.com", phone: "+237600000002", lastSessionDate: "18/07/2026" },
];

function renderStudents() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TeacherStudents />
    </QueryClientProvider>
  );
}

describe("Mes Apprenants Enseignant — /teacher/students", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche la liste des apprenants après chargement", async () => {
    (fetchTeacherStudents as any).mockResolvedValue(STUDENTS);
    renderStudents();

    expect(await screen.findByText("Jean Dupont")).toBeInTheDocument();
    expect(screen.getByText("Awa Ba")).toBeInTheDocument();
    expect(screen.getByText(/2 Élèves/)).toBeInTheDocument();
  });

  it("état vide : aucun apprenant ne retourne un message dédié", async () => {
    (fetchTeacherStudents as any).mockResolvedValue([]);
    renderStudents();

    expect(await screen.findByText(/Aucun apprenant trouvé/i)).toBeInTheDocument();
  });

  it("erreur réseau : n'affiche pas de crash, retombe sur une liste vide", async () => {
    (fetchTeacherStudents as any).mockRejectedValue(new Error("Erreur réseau"));
    renderStudents();

    expect(await screen.findByText(/Aucun apprenant trouvé/i)).toBeInTheDocument();
  });

  it("recherche : filtre les apprenants par nom", async () => {
    const user = userEvent.setup();
    (fetchTeacherStudents as any).mockResolvedValue(STUDENTS);
    renderStudents();

    await screen.findByText("Jean Dupont");
    await user.type(screen.getByPlaceholderText(/Rechercher un apprenant/i), "Awa");

    expect(screen.queryByText("Jean Dupont")).not.toBeInTheDocument();
    expect(screen.getByText("Awa Ba")).toBeInTheDocument();
  });

  it("succès : sélectionner un élève affiche ses détails et ses coordonnées", async () => {
    const user = userEvent.setup();
    (fetchTeacherStudents as any).mockResolvedValue(STUDENTS);
    renderStudents();

    await user.click(await screen.findByText("Jean Dupont"));

    expect(screen.getByText("jean@example.com")).toBeInTheDocument();
    expect(screen.getByText("+237600000001")).toBeInTheDocument();
  });

  it("succès : ouverture du dossier académique (AcademicFile) pour l'élève sélectionné", async () => {
    const user = userEvent.setup();
    (fetchTeacherStudents as any).mockResolvedValue(STUDENTS);
    renderStudents();

    await user.click(await screen.findByText("Jean Dupont"));
    await user.click(screen.getByRole("button", { name: /Voir le dossier/i }));

    expect(await screen.findByTestId("academic-file-stub")).toBeInTheDocument();
    expect(screen.getByText("Dossier de st1")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Fermer/i }));
    expect(screen.queryByTestId("academic-file-stub")).not.toBeInTheDocument();
  });

  it("bouton non câblé : \"Envoyer un message\" n'a pas de gestionnaire dans ce composant", async () => {
    const user = userEvent.setup();
    (fetchTeacherStudents as any).mockResolvedValue(STUDENTS);
    renderStudents();

    await user.click(await screen.findByText("Jean Dupont"));
    const sendMessageButton = screen.getByRole("button", { name: /Envoyer un message/i });
    expect(sendMessageButton).toBeInTheDocument();

    // Aucun crash au clic, et aucune navigation/mutation n'est déclenchée :
    // le bouton est présent dans le DOM mais n'appelle aucun handler
    // (absence de onClick dans src/pages/teacher/Students.tsx — non câblé).
    await user.click(sendMessageButton);
    expect(screen.getByRole("button", { name: /Envoyer un message/i })).toBeInTheDocument();
  });
});
