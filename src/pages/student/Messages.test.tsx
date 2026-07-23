import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import StudentMessages from "@/pages/student/Messages";
import { fetchTeachersByStudent, uploadMessageAttachment } from "@/api/backoffice";

// Périmètre élève : Mes Messages (/student/messages)
// Capacités testées : fetchMessages (fetch brut), sendMessage, uploadMessageAttachment,
// markMessageAsRead, filtres par rôle

vi.mock("@/api/backoffice", () => ({
    fetchTeachersByStudent: vi.fn(),
    uploadMessageAttachment: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
    useAuth: () => ({
        user: { id: "student-1", name: "Awa Traoré", role: "student" },
        token: "fake-token",
    }),
}));

const toastSuccessSpy = vi.fn();
const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
    toast: {
        success: (...args: any[]) => toastSuccessSpy(...args),
        error: (...args: any[]) => toastErrorSpy(...args),
    },
}));

const TEACHER = { id: "t1", name: "M. Konaté", role: "teacher" };

const MSG_FROM_TEACHER = {
    id: "m1",
    senderId: "t1",
    senderName: "M. Konaté",
    senderRole: "teacher",
    receiverId: "student-1",
    receiverName: "Awa Traoré",
    receiverRole: "student",
    content: "Bonjour Awa, n'oublie pas ton devoir.",
    isRead: false,
    createdAt: new Date().toISOString(),
};

function mockFetchSequence(initialMessages: any[] = []) {
    const store = [...initialMessages];
    (globalThis.fetch as any) = vi.fn((url: string, options?: any) => {
        if (url.includes("/messages/") && (!options || options.method === undefined)) {
            return Promise.resolve({ ok: true, json: async () => store });
        }
        if (url.includes("/messages") && options?.method === "POST") {
            const body = JSON.parse(options.body);
            store.push({ id: `srv-${store.length + 1}`, isRead: true, createdAt: new Date().toISOString(), ...body });
            return Promise.resolve({ ok: true, json: async () => ({ id: `srv-${store.length}` }) });
        }
        if (url.includes("/read")) {
            return Promise.resolve({ ok: true, json: async () => ({}) });
        }
        return Promise.resolve({ ok: true, json: async () => ([]) });
    });
}

function renderMessages() {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter>
                <StudentMessages />
            </MemoryRouter>
        </QueryClientProvider>
    );
}

describe("Élève / Mes Messages", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(fetchTeachersByStudent).mockResolvedValue([TEACHER] as any);
    });

    it("succès : affiche les contacts (professeurs assignés) et le fil de discussion", async () => {
        mockFetchSequence([MSG_FROM_TEACHER]);

        renderMessages();

        expect((await screen.findAllByText("M. Konaté")).length).toBeGreaterThan(0);
        expect((await screen.findAllByText("Bonjour Awa, n'oublie pas ton devoir.")).length).toBeGreaterThan(0);
    });

    it("filtre par rôle : la liste de contacts se filtre correctement", async () => {
        const user = userEvent.setup();
        mockFetchSequence([MSG_FROM_TEACHER]);

        renderMessages();
        await screen.findAllByText("M. Konaté");

        await user.click(screen.getByText("Conseiller"));
        expect(screen.queryByText("Aucun contact trouvé.")).toBeInTheDocument();

        await user.click(screen.getByText("Tous"));
        expect((await screen.findAllByText("M. Konaté")).length).toBeGreaterThan(0);
    });

    it("champs obligatoires manquants : le bouton d'envoi est désactivé sans texte saisi", async () => {
        mockFetchSequence([MSG_FROM_TEACHER]);
        renderMessages();
        await screen.findAllByText("M. Konaté");

        const sendButtons = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-send"));
        expect(sendButtons[0]).toBeDisabled();
    });

    it("succès : envoi d'un message texte via sendMessage (fetch POST)", async () => {
        const user = userEvent.setup();
        mockFetchSequence([]);

        renderMessages();
        await screen.findAllByText("M. Konaté");

        const textarea = screen.getByPlaceholderText("Écrivez votre message… (Entrée pour envoyer)");
        await user.type(textarea, "Merci professeur");

        const sendButtons = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-send"));
        await user.click(sendButtons[0]);

        await waitFor(() => expect(screen.getByText("Merci professeur")).toBeInTheDocument());
        expect(globalThis.fetch).toHaveBeenCalledWith(
            expect.stringContaining("/messages"),
            expect.objectContaining({ method: "POST" })
        );
    });

    it("erreur réseau : un échec d'envoi annule le message optimiste et affiche un toast d'erreur", async () => {
        const user = userEvent.setup();
        (globalThis.fetch as any) = vi.fn((url: string, options?: any) => {
            if (options?.method === "POST") {
                return Promise.reject(new Error("Erreur d'envoi"));
            }
            return Promise.resolve({ ok: true, json: async () => ([]) });
        });

        renderMessages();
        await screen.findAllByText("M. Konaté");

        const textarea = screen.getByPlaceholderText("Écrivez votre message… (Entrée pour envoyer)");
        await user.type(textarea, "Message qui va échouer");
        const sendButtons = screen.getAllByRole("button").filter(b => b.querySelector("svg.lucide-send"));
        await user.click(sendButtons[0]);

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Le message n'a pas pu être envoyé."));
        await waitFor(() => expect(screen.queryByText("Message qui va échouer")).not.toBeInTheDocument());
    });

    it("succès : upload d'une pièce jointe déclenche l'envoi avec l'URL du fichier", async () => {
        mockFetchSequence([]);
        vi.mocked(uploadMessageAttachment).mockResolvedValue({ fileUrl: "/uploads/devoir.pdf" } as any);

        renderMessages();
        await screen.findAllByText("M. Konaté");

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["contenu"], "devoir.pdf", { type: "application/pdf" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(uploadMessageAttachment).toHaveBeenCalled());
        await waitFor(() => expect(toastSuccessSpy).toHaveBeenCalledWith("Fichier envoyé avec succès !"));
    });

    it("erreur réseau : un échec d'upload de pièce jointe affiche un toast d'erreur dédié", async () => {
        mockFetchSequence([]);
        vi.mocked(uploadMessageAttachment).mockRejectedValue(new Error("Erreur réseau"));

        renderMessages();
        await screen.findAllByText("M. Konaté");

        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = new File(["contenu"], "devoir.pdf", { type: "application/pdf" });
        fireEvent.change(fileInput, { target: { files: [file] } });

        await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Erreur de téléchargement"));
    });

    it("état vide : affiche 'Aucune discussion active' si l'élève n'a aucun professeur assigné", async () => {
        vi.mocked(fetchTeachersByStudent).mockResolvedValue([]);
        mockFetchSequence([]);

        renderMessages();

        expect(await screen.findByText("Aucune discussion active")).toBeInTheDocument();
    });
});
