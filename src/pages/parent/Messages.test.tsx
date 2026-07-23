import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import ParentMessages from "@/pages/parent/Messages";
import * as backoffice from "@/api/backoffice";

// Capacité "Messages" — cartographie Parent :
// fetchParentContacts, fetchMessages, sendMessage, uploadMessageAttachment,
// markMessageAsRead — boutons Appel/Vidéo/Info sont (non câblé).

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "parent-1", name: "Parent Test", email: "parent@test.com", role: "parent" },
    token: "fake-token",
  }),
}));

const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: (...args: any[]) => toastErrorSpy(...args),
  },
}));

function renderMessages() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ParentMessages />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const contacts = [
  { id: "teacher-1", name: "M. Kouassi", role: "teacher" },
  { id: "advisor-1", name: "Mme Bamba", role: "advisor" },
];

const messages = [
  {
    id: "m1", senderId: "teacher-1", senderName: "M. Kouassi", senderRole: "teacher",
    receiverId: "parent-1", receiverName: "Parent Test", receiverRole: "parent",
    content: "Bonjour, tout va bien pour Alice.", isRead: false, createdAt: "2026-07-20T10:00:00.000Z",
  },
  {
    id: "m2", senderId: "parent-1", senderName: "Parent Test", senderRole: "parent",
    receiverId: "teacher-1", receiverName: "M. Kouassi", receiverRole: "teacher",
    content: "Merci pour le retour !", isRead: true, createdAt: "2026-07-20T10:05:00.000Z",
  },
];

describe("Parent > Messages", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    toastErrorSpy.mockReset();
    vi.spyOn(backoffice, "fetchParentContacts").mockResolvedValue(contacts as any);
    vi.spyOn(backoffice, "fetchMessages").mockResolvedValue(messages as any);
    vi.spyOn(backoffice, "sendMessage").mockResolvedValue({ id: "m3" } as any);
    vi.spyOn(backoffice, "uploadMessageAttachment").mockResolvedValue({ fileUrl: "/uploads/doc.pdf" } as any);
    vi.spyOn(backoffice, "markMessageAsRead").mockResolvedValue({} as any);
  });

  it("succès : affiche la liste des contacts (enseignants et conseillers)", async () => {
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    expect(screen.getByText("Mme Bamba")).toBeInTheDocument();
    expect(screen.getByText("ENSEIGNANT")).toBeInTheDocument();
    expect(screen.getByText("CONSEILLER")).toBeInTheDocument();
  });

  it("succès : sélectionner un contact charge le fil de discussion et marque les messages non lus comme lus", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));

    expect(await screen.findByText("Bonjour, tout va bien pour Alice.")).toBeInTheDocument();
    expect(screen.getByText("Merci pour le retour !")).toBeInTheDocument();
    await waitFor(() => expect(backoffice.markMessageAsRead).toHaveBeenCalled());
    expect((backoffice.markMessageAsRead as any).mock.calls[0][0]).toBe("m1");
    // Le message déjà lu (m2, envoyé par le parent) n'est pas re-marqué
    expect((backoffice.markMessageAsRead as any).mock.calls.some((c: any[]) => c[0] === "m2")).toBe(false);
  });

  it("succès : envoie un message texte via sendMessage puis vide le champ", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const input = screen.getByPlaceholderText("ÉCRIRE VOTRE MESSAGE ICI...");
    await user.type(input, "Bonjour, merci de votre retour.");
    await user.click(screen.getByText("ENVOYER"));

    await waitFor(() => expect(backoffice.sendMessage).toHaveBeenCalled());
    expect((backoffice.sendMessage as any).mock.calls[0][0]).toMatchObject({
      senderId: "parent-1",
      receiverId: "teacher-1",
      receiverName: "M. Kouassi",
      receiverRole: "teacher",
      content: "Bonjour, merci de votre retour.",
    });
    await waitFor(() => expect((input as HTMLInputElement).value).toBe(""));
  });

  it("champ obligatoire : un message vide (ou uniquement des espaces) n'appelle pas sendMessage", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const input = screen.getByPlaceholderText("ÉCRIRE VOTRE MESSAGE ICI...");
    await user.type(input, "   ");
    await user.click(screen.getByText("ENVOYER"));

    expect(backoffice.sendMessage).not.toHaveBeenCalled();
  });

  it("succès : envoie une pièce jointe via uploadMessageAttachment puis sendMessage avec l'URL du fichier", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const file = new File(["contenu"], "bulletin.pdf", { type: "application/pdf" });
    const fileInput = document.getElementById("chat-file-parent") as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => expect(backoffice.uploadMessageAttachment).toHaveBeenCalled());
    await waitFor(() => expect(backoffice.sendMessage).toHaveBeenCalled());
    expect((backoffice.sendMessage as any).mock.calls[0][0]).toMatchObject({
      content: "Pièce jointe",
      attachmentUrl: "/uploads/doc.pdf",
    });
  });

  it("erreur réseau : un toast d'erreur s'affiche si l'envoi de la pièce jointe échoue", async () => {
    vi.spyOn(backoffice, "uploadMessageAttachment").mockRejectedValue(new Error("Erreur réseau"));
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const file = new File(["contenu"], "bulletin.pdf", { type: "application/pdf" });
    const fileInput = document.getElementById("chat-file-parent") as HTMLInputElement;
    await user.upload(fileInput, file);

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Erreur de téléchargement"));
    expect(backoffice.sendMessage).not.toHaveBeenCalled();
  });

  it("erreur réseau : dégrade gracieusement si fetchParentContacts échoue (aucun contact affiché)", async () => {
    vi.spyOn(backoffice, "fetchParentContacts").mockRejectedValue(new Error("Erreur réseau"));
    renderMessages();

    await waitFor(() => expect(screen.getByText("Aucun contact trouvé")).toBeInTheDocument());
  });

  it("données vides : un message d'accueil invite à sélectionner un contact avant toute discussion", async () => {
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    expect(screen.getByText("Messagerie Directe")).toBeInTheDocument();
  });

  it("bouton non câblé : « Appel » (icône téléphone) n'a pas de handler", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const button = document.querySelector("button svg.lucide-phone")!.closest("button") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Vidéo » (icône caméra) n'a pas de handler", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const button = document.querySelector("button svg.lucide-video")!.closest("button") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });

  it("bouton non câblé : « Info » (icône information) n'a pas de handler", async () => {
    const user = userEvent.setup();
    renderMessages();

    await waitFor(() => expect(screen.getByText("M. Kouassi")).toBeInTheDocument());
    await user.click(screen.getByText("M. Kouassi"));
    await screen.findByText("Bonjour, tout va bien pour Alice.");

    const button = document.querySelector("button svg.lucide-info")!.closest("button") as HTMLButtonElement;
    expect(button.onclick).toBeNull();
  });
});
