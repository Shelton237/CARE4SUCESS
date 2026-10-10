import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import AdvisorMessages from "@/pages/advisor/Messages";
import { fetchAdvisorContacts, fetchMessages, sendMessage, markMessageAsRead, uploadMessageAttachment } from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorContacts: vi.fn(), fetchMessages: vi.fn(), sendMessage: vi.fn(), markMessageAsRead: vi.fn(), uploadMessageAttachment: vi.fn(),
}));
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "adv", name: "Brice Owona", role: "advisor" } }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const CONTACTS = [
  { id: "t1", name: "Jean Marie N'Guessan", role: "teacher", category: "teacher", subjects: ["Mathématiques"], students: ["Saturin Penlap"], phone: "+237 699001122", email: "jm@x.cm" },
  { id: "p1", name: "Claire Koffi", role: "parent", category: "parent", children: ["Léo Koffi"] },
  { id: "s1", name: "Saturin Penlap", role: "student", category: "student", parentName: "Boris Kamdem" },
  { id: "p2", name: "Aminata Bâ", role: "parent", category: "parent" },
];
const now = Date.now();
const M = (o: Record<string, unknown>) => ({ id: "m", senderId: "t1", senderName: "Jean Marie N'Guessan", senderRole: "teacher", receiverId: "adv", receiverName: "Brice Owona", receiverRole: "advisor", content: "x", isRead: true, attachmentUrl: null as any, createdAt: new Date(now - 60_000).toISOString(), ...o });
const MESSAGES = [
  M({ id: "m1", content: "Bonjour Brice, je vous joins le plan.", createdAt: new Date(now - 3_600_000).toISOString() }),
  M({ id: "m2", content: "Plan_de_travail.pdf", attachmentUrl: "/uploads/attachment-1-2.pdf", isRead: false, createdAt: new Date(now - 3_000_000).toISOString() }),
  M({ id: "m3", senderId: "p1", senderName: "Claire Koffi", senderRole: "parent", content: "Merci pour votre retour", isRead: false, createdAt: new Date(now - 10 * 86_400_000).toISOString() }),
];

const renderPage = (state?: any) =>
  render(
    <MemoryRouter initialEntries={[{ pathname: "/advisor/messages", state }]}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AdvisorMessages />
      </QueryClientProvider>
    </MemoryRouter>
  );

describe("AdvisorMessages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetchAdvisorContacts as any).mockResolvedValue(CONTACTS);
    (fetchMessages as any).mockResolvedValue(MESSAGES);
    (sendMessage as any).mockResolvedValue({});
    (markMessageAsRead as any).mockResolvedValue({});
  });

  it("indicateurs, onglets et conversation la plus récente ouverte par défaut", async () => {
    renderPage();
    expect(await screen.findByText("Bonjour Brice, je vous joins le plan.")).toBeInTheDocument();
    // m2 est lu à l'ouverture de la conversation : il reste le message de Claire Koffi
    await waitFor(() => expect(screen.getByText("Messages non lus").previousSibling).toHaveTextContent("1"));
    expect(screen.getByRole("tab", { name: /Parents/ })).toHaveTextContent("2");
    expect(screen.getByRole("heading", { name: "Jean Marie N'Guessan" })).toBeInTheDocument();
    expect(screen.getByText(/Enseignant de Mathématiques • Saturin Penlap/)).toBeInTheDocument();
    expect(screen.getByText("Plan_de_travail.pdf")).toBeInTheDocument();
    expect(screen.getByText("Nouveau message")).toBeInTheDocument();
    await waitFor(() => expect(markMessageAsRead).toHaveBeenCalledWith("m2"));
    expect(markMessageAsRead).not.toHaveBeenCalledWith("m3");
    expect(screen.getByRole("link", { name: "Appeler" })).toHaveAttribute("href", "tel:+237699001122");
  });

  it("envoi avec Entrée vers le contact sélectionné", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Bonjour Brice, je vous joins le plan.");
    await user.click(screen.getByRole("button", { name: /Claire Koffi/ }));
    await user.type(screen.getByRole("textbox", { name: "Votre message" }), "Bonjour Madame{Enter}");
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect((sendMessage as any).mock.calls[0][0]).toMatchObject({ receiverId: "p1", receiverRole: "parent", content: "Bonjour Madame" });
  });

  it("contact sans conversation : on peut démarrer l'échange", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Bonjour Brice, je vous joins le plan.");
    await user.click(screen.getByRole("tab", { name: /Parents/ }));
    await user.click(screen.getByRole("button", { name: /Aminata Bâ/ }));
    expect(screen.getByText(/Aucun message avec Aminata Bâ/)).toBeInTheDocument();
  });

  it("recherche et filtre non lus", async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText("Bonjour Brice, je vous joins le plan.");
    await user.type(screen.getByRole("textbox", { name: "Rechercher" }), "léo");
    const list = screen.getByRole("navigation", { name: /Pagination/ }).parentElement!.parentElement!;
    expect(within(list).getByText("Claire Koffi")).toBeInTheDocument();
    expect(within(list).queryByText("Aminata Bâ")).not.toBeInTheDocument();
  });

  it("pièce jointe : envoyée avec le nom d'origine du fichier", async () => {
    const user = userEvent.setup();
    (uploadMessageAttachment as any).mockResolvedValue({ fileUrl: "/uploads/attachment-9.pdf" });
    renderPage();
    await screen.findByText("Bonjour Brice, je vous joins le plan.");
    const input = screen.getByLabelText("Joindre un fichier", { selector: "input" });
    await user.upload(input, new File(["%PDF"], "Bilan_Saturin.pdf", { type: "application/pdf" }));
    await waitFor(() => expect(sendMessage).toHaveBeenCalled());
    expect((sendMessage as any).mock.calls[0][0]).toMatchObject({ receiverId: "t1", content: "Bilan_Saturin.pdf", attachmentUrl: "/uploads/attachment-9.pdf" });
  });

  it("contact demandé par une autre page", async () => {
    renderPage({ contactId: "s1" });
    expect(await screen.findByRole("heading", { name: "Saturin Penlap" })).toBeInTheDocument();
    expect(screen.getByText(/Parent : Boris Kamdem/)).toBeInTheDocument();
  });
});
