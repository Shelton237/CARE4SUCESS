import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorSchedule from "@/pages/advisor/Schedule";
import {
  fetchAdvisorAppointments, createAdvisorAppointment, updateAdvisorAppointment, deleteAdvisorAppointment, fetchAdvisorFamilies,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorAppointments: vi.fn(), createAdvisorAppointment: vi.fn(), updateAdvisorAppointment: vi.fn(),
  deleteAdvisorAppointment: vi.fn(), fetchAdvisorFamilies: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "advisor-1", name: "Aline", role: "advisor" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const pad = (n: number) => String(n).padStart(2, "0");
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const E = (o: Record<string, unknown>) => ({
  id: "e", kind: "rdv", title: "Événement", date: day(1), time: "10:00", endTime: "10:30", priority: "normale", status: "planifié",
  location: null as any, studentId: null as any, studentName: null as any, parentName: null as any, teacherName: null as any, notes: null as any, ...o,
});
const EVENTS = [
  E({ id: "1", title: "Entretien avec la famille Kamdem", studentName: "Saturin Penlap", parentName: "Boris Kamdem", location: "En visioconférence", status: "confirmé", studentId: "s1" }),
  E({ id: "2", kind: "tache", title: "Envoyer le bilan pédagogique", time: null, endTime: null, status: "à faire", priority: "haute", teacherName: "Léa M." }),
  E({ id: "3", kind: "echeance", title: "Remise du rapport mensuel", date: day(-2), time: "17:00", endTime: null, status: "à faire" }),
  E({ id: "4", title: "Ancien suivi", date: day(-10), status: "réalisé" }),
];
const FAMILIES = [{ id: "req-9", studentId: "s9", child: "Jean Nore", parent: "Aminata Nore", level: "Terminale", teacher: "M. Diop" }];

const renderPage = (state?: any) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/advisor/schedule", state }]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdvisorSchedule />
      </QueryClientProvider>
    </MemoryRouter>
  );

describe("AdvisorSchedule : Tâches & Rendez-vous", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorAppointments as any).mockResolvedValue(EVENTS);
    (fetchAdvisorFamilies as any).mockResolvedValue(FAMILIES);
    (createAdvisorAppointment as any).mockResolvedValue({});
    (updateAdvisorAppointment as any).mockResolvedValue({});
    (deleteAdvisorAppointment as any).mockResolvedValue({});
  });

  it("onglets avec compteurs, retard calculé, terminés en dernier", async () => {
    renderPage();
    expect(await screen.findByText("Entretien avec la famille Kamdem")).toBeInTheDocument();
    expect(fetchAdvisorAppointments).toHaveBeenCalledWith("advisor-1");
    expect(screen.getByRole("tab", { name: /Tous/ })).toHaveTextContent("4");
    expect(screen.getByRole("tab", { name: /Tâches/ })).toHaveTextContent("1");
    expect(screen.getByText("En retard")).toBeInTheDocument();
    expect(screen.getByText("Haute priorité")).toBeInTheDocument();
    expect(screen.getAllByText("Demain")).toHaveLength(2);
    const titles = screen.getAllByRole("button", { name: /Entretien|Envoyer|Remise|Ancien/ }).map(b => b.textContent).filter(Boolean);
    expect(titles[0]).toBe("Remise du rapport mensuel");
    expect(titles[titles.length - 1]).toBe("Ancien suivi");
  });

  it("onglet Rendez-vous et filtres repliés par défaut", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Entretien avec la famille Kamdem");
    expect(screen.getByRole("button", { name: /Filtres avancés/ })).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByRole("tab", { name: /Rendez-vous/ }));
    expect(screen.queryByText("Envoyer le bilan pédagogique")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Filtres avancés/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: /Statut/ }), "done");
    expect(screen.getByText("Ancien suivi")).toBeInTheDocument();
    expect(screen.queryByText("Entretien avec la famille Kamdem")).not.toBeInTheDocument();
  });

  it("création d'une tâche rattachée à un élève par identifiant", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Entretien avec la famille Kamdem");
    await user.click(screen.getByRole("button", { name: /Nouvel événement/ }));
    const dialog = screen.getByRole("dialog");
    await user.click(within(dialog).getByRole("radio", { name: /Tâche/ }));
    await user.type(within(dialog).getByRole("textbox", { name: /Titre/ }), "Appeler la famille");
    await user.selectOptions(within(dialog).getByRole("combobox", { name: /Élève/ }), "req-9");
    await user.click(within(dialog).getByRole("button", { name: /Ajouter à l'agenda/ }));
    await waitFor(() => expect(createAdvisorAppointment).toHaveBeenCalledWith("advisor-1", expect.objectContaining({
      kind: "tache", title: "Appeler la famille", studentId: "s9", studentName: "Jean Nore", parentName: "Aminata Nore", teacherName: "M. Diop", endTime: null,
    })));
  });

  it("menu : marquer comme terminé et supprimer avec confirmation", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Envoyer le bilan pédagogique");
    await user.click(screen.getByRole("button", { name: "Actions pour Envoyer le bilan pédagogique" }));
    await user.click(await screen.findByRole("menuitem", { name: /Marquer comme terminé/ }));
    await waitFor(() => expect(updateAdvisorAppointment).toHaveBeenCalledWith("advisor-1", "2", { status: "terminé" }));
    await user.click(screen.getByRole("button", { name: "Actions pour Ancien suivi" }));
    await user.click(await screen.findByRole("menuitem", { name: /Supprimer/ }));
    await user.click(await screen.findByRole("button", { name: /^Supprimer$/ }));
    await waitFor(() => expect(deleteAdvisorAppointment).toHaveBeenCalledWith("advisor-1", "4"));
  });

  it("arrivée depuis une fiche élève : formulaire prérempli par identifiant", async () => {
    renderPage({ familyId: "req-9", familyName: "Aminata Nore", childName: "Jean Nore", type: "Suivi régulier" });
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByRole("textbox", { name: /Titre/ })).toHaveValue("Suivi régulier");
    await waitFor(() => expect(within(dialog).getByRole("combobox", { name: /Élève/ })).toHaveValue("req-9"));
  });

  it("ancien rendez-vous : le contact saisi en texte libre reste affiché", async () => {
    (fetchAdvisorAppointments as any).mockResolvedValue([E({ id: "9", title: "Bilan initial", family: "Famille Ba" })]);
    renderPage();
    expect(await screen.findByText("Contact : Famille Ba")).toBeInTheDocument();
  });

  it("vue Calendrier", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Entretien avec la famille Kamdem");
    await user.click(screen.getByRole("button", { name: /Calendrier/ }));
    expect(screen.getByRole("button", { name: "Mois suivant" })).toBeInTheDocument();
    expect(screen.getByText("Lun")).toBeInTheDocument();
  });
});
