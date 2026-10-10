import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorTutors from "./Tutors";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ token: "t", user: { id: "a1", role: "advisor" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const C = (percent: number, missing: string[]) => ({ percent, missing });
const TUTORS = [
    { id: "1", name: "Sophie Mbarga", status: "actif", createdAt: "2026-09-01", subjects: ["Mathématiques"], levels: ["Terminale"], city: "Yaoundé", zones: [], availability: { sam: ["matin"] }, rate: 1, currency: "XAF", completeness: C(80, ["tarif"]) },
    { id: "2", name: "Aubin Cabrel", status: "actif", createdAt: "2026-10-01", subjects: ["Anglais"], levels: ["Tous niveaux"], city: "Douala", zones: ["Akwa"], availability: { lun: ["soiree"] }, rate: 7500, currency: "XOF", completeness: C(100, []) },
];

const renderPage = () =>
    render(
        <MemoryRouter>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <AdvisorTutors />
            </QueryClientProvider>
        </MemoryRouter>
    );

describe("AdvisorTutors", () => {
    beforeEach(() => vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(JSON.stringify(TUTORS), { status: 200 })))));
    afterEach(() => vi.unstubAllGlobals());

    it("filtres avancés repliés par défaut, synthèse visible", async () => {
        renderPage();
        expect(await screen.findByText("Sophie Mbarga")).toBeInTheDocument();
        expect(screen.getByText("1/2")).toBeInTheDocument();
        expect(screen.queryByText("Matières enseignées")).not.toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Filtres avancés/ })).toHaveAttribute("aria-expanded", "false");
    });

    it("un filtre s'applique immédiatement et s'affiche en pastille retirable", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Sophie Mbarga");
        await user.click(screen.getByRole("button", { name: /Filtres avancés/ }));
        await user.click(screen.getByRole("button", { name: "Anglais" }));

        expect(screen.queryByText("Sophie Mbarga")).not.toBeInTheDocument();
        expect(screen.getByText("1 tuteur")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Filtres avancés · 1/ })).toBeInTheDocument();

        await user.click(screen.getByRole("button", { name: "Retirer le filtre Anglais" }));
        expect(screen.getByText("Sophie Mbarga")).toBeInTheDocument();
    });

    it("disponibilités : filtre par jour et créneau", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Sophie Mbarga");
        await user.click(screen.getByRole("button", { name: /Filtres avancés/ }));
        await user.selectOptions(screen.getByRole("combobox", { name: /Jour disponible/ }), "sam");
        expect(screen.queryByText("Aubin Cabrel")).not.toBeInTheDocument();
        await user.selectOptions(screen.getByRole("combobox", { name: /Créneau/ }), "soiree");
        expect(screen.getByText("0 tuteur")).toBeInTheDocument();
    });

    it("tarif aberrant et devise XOF signalés", async () => {
        renderPage();
        const row = (await screen.findByText("Sophie Mbarga")).closest("li")!;
        expect(within(row).getByText("Tarif à vérifier")).toBeInTheDocument();
        const aubin = screen.getByText("Aubin Cabrel").closest("li")!;
        expect(within(aubin).getByText("Devise XOF à vérifier")).toBeInTheDocument();
    });
});
