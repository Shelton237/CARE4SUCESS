import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorMatching from "./Matching";

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ token: "t", user: { id: "a1", role: "advisor" } }) }));
const { toastSuccess } = vi.hoisted(() => ({ toastSuccess: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: toastSuccess, error: vi.fn() } }));

const tutor = (over: Record<string, unknown>) => ({
    id: "t1", name: "Sophie Mbarga", subjects: ["Mathématiques"], city: "Yaoundé", status: "actif", yearsExperience: 5,
    languages: ["Français"], specialties: [], hasAvailability: true, rate: 7500, currency: "XAF", reviewCount: 12, reviewAvg: 4.8,
    alreadyAssigned: false, score: 95, profile: { percent: 100, missing: [] },
    reasons: [{ key: "priority", ok: true, label: "Prioritaires couvertes : Mathématiques" }, { key: "level", ok: true, label: "Niveau Terminale" }],
    ...over,
});
const DATA = {
    tutorCount: 2,
    items: [
        {
            student: { id: "s1", name: "Léo Nkca", subject: "Mathématiques", level: "Terminale", city: "Douala", hasDiagnostic: true, scores: { Mathématiques: 2 }, prioritySubjects: ["Mathématiques"], consolidateSubjects: [] },
            assignedTeachers: [],
            matches: [tutor({})],
        },
        {
            student: { id: "s2", name: "Marie Rose", subject: "Français", level: "Première", city: "", hasDiagnostic: false, scores: {}, prioritySubjects: [], consolidateSubjects: [] },
            assignedTeachers: [{ id: "t2", name: "Saturin Penlap" }],
            // Cas réel en production : langues enregistrées comme objets { name, level }
            matches: [tutor({ id: "t2", name: "Saturin Penlap", subjects: ["Français"], score: 82, alreadyAssigned: true, hasAvailability: false, reviewCount: 0, reviewAvg: null, yearsExperience: null, languages: [{ name: "Anglais", level: "C1" }] })],
        },
    ],
};

const renderPage = () =>
    render(
        <MemoryRouter>
            <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
                <AdvisorMatching />
            </QueryClientProvider>
        </MemoryRouter>
    );

describe("AdvisorMatching", () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    beforeEach(() => {
        fetchMock = vi.fn((url: string, init?: RequestInit) => {
            if (init?.method === "POST") return Promise.resolve(new Response("{}", { status: 200 }));
            return Promise.resolve(new Response(JSON.stringify(DATA), { status: 200 }));
        });
        vi.stubGlobal("fetch", fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it("affiche chaque élève avec son meilleur tuteur, le score et les critères", async () => {
        renderPage();
        const row = (await screen.findByText("Léo Nkca")).closest("li")!;
        expect(within(row).getByText("Sophie Mbarga")).toBeInTheDocument();
        expect(within(row).getByText("95%")).toBeInTheDocument();
        expect(within(row).getByText("Même matière")).toBeInTheDocument();
        expect(within(row).getByText("En difficulté")).toBeInTheDocument();
        expect(within(row).getByText("4.8 (12 avis)")).toBeInTheDocument();
        expect(within(row).getByText("Disponible")).toBeInTheDocument();
        expect(screen.getByText("2 correspondances trouvées")).toBeInTheDocument();
        expect(fetchMock.mock.calls[0][0]).toContain("/advisor/matches?top=1");
    });

    it("données absentes affichées honnêtement (pas d'avis, expérience, diagnostic)", async () => {
        renderPage();
        const row = (await screen.findByText("Marie Rose")).closest("li")!;
        expect(within(row).getByText("Pas encore d'avis")).toBeInTheDocument();
        expect(within(row).getByText("Expérience non renseignée")).toBeInTheDocument();
        expect(within(row).getByText("Diagnostic à faire")).toBeInTheDocument();
        expect(within(row).getByText("Affecté")).toBeInTheDocument();
    });

    it("correspondance optimale désactivée : charge les 3 meilleurs tuteurs", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Léo Nkca");
        await user.click(screen.getByRole("switch", { name: "Correspondance optimale" }));
        await waitFor(() => expect(fetchMock.mock.calls.some(([u]) => String(u).includes("top=3"))).toBe(true));
    });

    it("filtre Langue : accepte les langues enregistrées comme objets", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Marie Rose");
        await user.click(screen.getByRole("button", { name: /Filtres avancés/ }));
        await user.selectOptions(screen.getByRole("combobox", { name: /Langue du tuteur/ }), "Anglais");
        expect(screen.queryByText("Léo Nkca")).not.toBeInTheDocument();
        expect(screen.getByText("Marie Rose")).toBeInTheDocument();
    });

    it("onglet Élèves à affecter : masque les élèves qui ont déjà un tuteur", async () => {
        const user = userEvent.setup();
        renderPage();
        await screen.findByText("Marie Rose");
        await user.click(screen.getByRole("tab", { name: /Élèves à affecter/ }));
        await waitFor(() => expect(screen.queryByText("Marie Rose")).not.toBeInTheDocument());
        expect(screen.getByText("Léo Nkca")).toBeInTheDocument();
    });

    it("affectation : confirmation puis POST par identifiants", async () => {
        const user = userEvent.setup();
        renderPage();
        const row = (await screen.findByText("Léo Nkca")).closest("li")!;
        await user.click(within(row).getByRole("button", { name: /Plus d'actions/ }));
        await user.click(await screen.findByText("Affecter ce tuteur"));
        expect(await screen.findByText("Affecter Sophie Mbarga à Léo Nkca ?")).toBeInTheDocument();
        await user.click(screen.getByRole("button", { name: "Confirmer l'affectation" }));
        await waitFor(() => {
            const call = fetchMock.mock.calls.find(([u, i]) => (i as RequestInit)?.method === "POST");
            expect(String(call?.[0])).toContain("/advisor/students/s1/assign");
            expect(JSON.parse(String((call?.[1] as RequestInit).body)).teacherId).toBe("t1");
        });
        expect(toastSuccess).toHaveBeenCalledWith("Sophie Mbarga est maintenant affecté à Léo Nkca");
    });
});
