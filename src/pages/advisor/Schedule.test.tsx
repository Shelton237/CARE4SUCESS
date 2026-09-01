import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import AdvisorSchedule from "@/pages/advisor/Schedule";
import { fetchAdvisorAppointments, createAdvisorAppointment } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorAppointments: vi.fn(),
  createAdvisorAppointment: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" } }),
}));

const toastSpy = vi.fn();
vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

const APPOINTMENT = {
  id: "rdv-1",
  family: "Famille Ba",
  type: "Suivi régulier",
  date: "25/07/2026",
  time: "10:00",
  status: "planifié",
};

function renderSchedule() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdvisorSchedule />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdvisorSchedule — Tâches & RDV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("succès : affiche la liste des prochains rendez-vous", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([APPOINTMENT]);
    renderSchedule();

    expect(await screen.findByText("Famille Ba")).toBeInTheDocument();
    expect(screen.getByText("10:00")).toBeInTheDocument();
    expect(screen.getByText("25/07/2026")).toBeInTheDocument();
    expect(screen.getByText("planifié")).toBeInTheDocument();
    expect(fetchAdvisorAppointments).toHaveBeenCalledWith("advisor-1");
  });

  it("état vide : affiche un message si aucun rendez-vous n'est planifié", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    renderSchedule();

    expect(await screen.findByText("Aucun rendez-vous planifié.")).toBeInTheDocument();
  });

  it("succès : création d'un rendez-vous avec tous les champs renseignés déclenche createAdvisorAppointment puis réinitialise le formulaire", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    (createAdvisorAppointment as any).mockResolvedValue({ ...APPOINTMENT, id: "rdv-2" });
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText("Aucun rendez-vous planifié.");

    await user.type(screen.getByPlaceholderText("Nom de la famille"), "Famille Diop");
    await user.selectOptions(screen.getByDisplayValue("Suivi régulier"), "Bilan initial");

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    await user.type(dateInput, "2026-08-01");
    await user.type(timeInput, "14:30");

    await user.click(screen.getByText("Confirmer le rendez-vous"));

    await waitFor(() =>
      expect(createAdvisorAppointment).toHaveBeenCalledWith(
        "advisor-1",
        expect.objectContaining({
          family: "Famille Diop",
          type: "Bilan initial",
          date: "2026-08-01",
          time: "14:30",
        })
      )
    );
    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Rendez-vous planifié" })
      )
    );
    await waitFor(() => expect(screen.getByPlaceholderText("Nom de la famille")).toHaveValue(""));
  });

  it("champs obligatoires manquants : la soumission sans date ni heure ne déclenche pas createAdvisorAppointment", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText("Aucun rendez-vous planifié.");

    // Seul le champ famille est renseigné : date et heure (obligatoires) restent vides.
    await user.type(screen.getByPlaceholderText("Nom de la famille"), "Famille Sy");
    await user.click(screen.getByText("Confirmer le rendez-vous"));

    // La validation HTML5 native (attribut required) bloque la soumission du formulaire.
    expect(createAdvisorAppointment).not.toHaveBeenCalled();
  });

  it("champs obligatoires manquants : la soumission sans nom de famille ne déclenche pas createAdvisorAppointment", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText("Aucun rendez-vous planifié.");

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    await user.type(dateInput, "2026-08-01");
    await user.type(timeInput, "14:30");
    await user.click(screen.getByText("Confirmer le rendez-vous"));

    expect(createAdvisorAppointment).not.toHaveBeenCalled();
  });

  it("erreur réseau : l'échec de createAdvisorAppointment affiche un toast d'erreur et ne réinitialise pas le formulaire", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    (createAdvisorAppointment as any).mockRejectedValue(new Error("Le serveur ne répond pas."));
    const user = userEvent.setup();
    renderSchedule();
    await screen.findByText("Aucun rendez-vous planifié.");

    await user.type(screen.getByPlaceholderText("Nom de la famille"), "Famille Fall");
    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement;
    const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement;
    await user.type(dateInput, "2026-08-02");
    await user.type(timeInput, "09:00");
    await user.click(screen.getByText("Confirmer le rendez-vous"));

    await waitFor(() =>
      expect(toastSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de planifier le rendez-vous.",
        })
      )
    );
    expect(screen.getByPlaceholderText("Nom de la famille")).toHaveValue("Famille Fall");
  });

  it("erreur réseau (chargement) : un échec de fetchAdvisorAppointments affiche la liste vide sans bloquer le formulaire", async () => {
    (fetchAdvisorAppointments as any).mockRejectedValue(new Error("Network Error"));
    renderSchedule();

    // Constat : aucune bannière d'erreur dédiée n'est affichée en cas d'échec de chargement des rendez-vous
    // (dégradation silencieuse vers la liste vide, comme pour la messagerie).
    expect(await screen.findByText("Aucun rendez-vous planifié.")).toBeInTheDocument();
    expect(screen.getByText("Confirmer le rendez-vous")).toBeInTheDocument();
  });

  it("pré-remplissage : arrivée depuis « Planifier RDV » de Mes Familles pré-remplit le nom de la famille", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([]);
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={qc}>
        <MemoryRouter initialEntries={[{ pathname: "/advisor/schedule", state: { familyName: "Famille Ndiaye" } }]}>
          <AdvisorSchedule />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByDisplayValue("Famille Ndiaye")).toBeInTheDocument();
    expect(screen.getByText(/Planification de rendez-vous/)).toBeInTheDocument();
  });
});
