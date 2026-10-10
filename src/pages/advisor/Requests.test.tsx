import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorRequests from "./Requests";

const { fetchRequests, updateRequestStatus, createRequest } = vi.hoisted(() => ({
    fetchRequests: vi.fn(), updateRequestStatus: vi.fn(), createRequest: vi.fn(),
}));
vi.mock("@/api/backoffice", () => ({ fetchRequests, updateRequestStatus, createRequest }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const R = (o: Record<string, unknown>) => ({
    id: "r", parent: "Parent", child: "Enfant", level: "Terminale", subject: "Mathématiques", phone: "+237600000000",
    status: "reçu", date: "10/04/2026", requestDate: "2026-04-10T00:00:00.000Z", createdAt: "2026-04-10T13:32:00.000Z",
    urgency: null, hasDiagnostic: false, hasPlan: false, ...o,
});
const DATA = [
    R({ id: "1", child: "Anthonio FAMO", parent: "Valérie FAMO" }),
    R({ id: "2", child: "Tina FAMO", urgency: "urgent", subject: "SVT" }),
    R({ id: "3", child: "Jean Nore", status: "en traitement", hasDiagnostic: true, subject: "Anglais" }),
    R({ id: "4", child: "Kamden Boris", status: "assigné" }),
    R({ id: "5", child: "Marie Rose", status: "clôturé" }),
];

const renderPage = () =>
    render(
        <MemoryRouter>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <AdvisorRequests />
            </QueryClientProvider>
        </MemoryRouter>
    );

describe("AdvisorRequests", () => {
    beforeEach(() => {
        fetchRequests.mockResolvedValue(DATA);
        updateRequestStatus.mockResolvedValue({});
    });

    it("Kanban : colonnes avec compteurs, urgence et avancement", async () => {
        renderPage();
        const recu = await screen.findByRole("generic", { name: "Colonne Reçu" });
        expect(await within(recu).findByText("Anthonio FAMO")).toBeInTheDocument();
        expect(within(recu).getByText("Urgent")).toBeInTheDocument();
        expect(within(recu).getByText("Parent : Valérie FAMO")).toBeInTheDocument();
        const enCours = screen.getByRole("generic", { name: "Colonne En traitement" });
        expect(within(enCours).getByText("60%")).toBeInTheDocument();
        expect(within(enCours).getByText("Diagnostic fait")).toBeInTheDocument();
    });

    it("Prendre en charge passe la demande en traitement", async () => {
        const user = userEvent.setup();
        renderPage();
        const card = (await screen.findByText("Anthonio FAMO")).closest("[draggable]") as HTMLElement;
        await user.click(within(card).getByRole("button", { name: /Prendre en charge/ }));
        await waitFor(() => expect(updateRequestStatus).toHaveBeenCalledWith("1", "en traitement"));
    });

    it("filtres repliés par défaut ; le KPI filtre par statut", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Anthonio FAMO");
        expect(screen.getByRole("button", { name: /Filtres avancés/ })).toHaveAttribute("aria-expanded", "false");
        await user.click(screen.getByRole("button", { name: /Assignées/ }));
        expect(screen.queryByText("Anthonio FAMO")).not.toBeInTheDocument();
        expect(screen.getByText("Kamden Boris")).toBeInTheDocument();
    });

    it("vue Tableau et filtre Urgence", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Anthonio FAMO");
        await user.click(screen.getByRole("button", { name: /Tableau/ }));
        expect(screen.getByRole("table")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: /Filtres avancés/ }));
        await user.selectOptions(screen.getByRole("combobox", { name: /Urgence/ }), "urgent");
        expect(screen.getAllByRole("row")).toHaveLength(2);
        expect(screen.getByText("Tina FAMO")).toBeInTheDocument();
    });
});
