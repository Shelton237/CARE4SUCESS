import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom-original";
import AdvisorMessages from "@/pages/advisor/Messages";
import {
  fetchAdvisorContacts,
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  uploadMessageAttachment,
} from "@/api/backoffice";

vi.mock("@/api/backoffice", () => ({
  fetchAdvisorContacts: vi.fn(),
  fetchMessages: vi.fn(),
  sendMessage: vi.fn(),
  markMessageAsRead: vi.fn(),
  uploadMessageAttachment: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "advisor-1", name: "Aline Conseillère", role: "advisor" } }),
}));

const toastErrorSpy = vi.fn();
vi.mock("sonner", () => ({
  toast: { error: (...args: any[]) => toastErrorSpy(...args), success: vi.fn() },
}));

const TEACHER = { id: "t1", name: "M. Diop", role: "teacher" };
const PARENT = { id: "p1", name: "Mme Ba", role: "parent" };

const MSG_FROM_TEACHER = {
  id: "m1",
  senderId: "t1",
  senderName: "M. Diop",
  senderRole: "teacher",
  receiverId: "advisor-1",
  receiverName: "Aline Conseillère",
  receiverRole: "advisor",
  content: "Bonjour, avez-vous des nouvelles ?",
  isRead: false,
  createdAt: new Date().toISOString(),
};

function renderMessages() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <AdvisorMessages />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

function getSubmitButton(container: HTMLElement) {
  return container.querySelector('button[type="submit"]') as HTMLButtonElement;
}

// Magasin mutable simulant le serveur : la mutation d'envoi invalide la requête des messages,
// qui refetch via fetchMessages — il faut donc que ce mock reflète les messages "envoyés"
// pour que le message optimiste survive au refetch, comme le ferait un vrai backend.
let messagesStore: any[] = [];

describe("AdvisorMessages — Messagerie", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    messagesStore = [MSG_FROM_TEACHER];
    (fetchAdvisorContacts as any).mockResolvedValue([TEACHER, PARENT]);
    (fetchMessages as any).mockImplementation(() => Promise.resolve([...messagesStore]));
    (markMessageAsRead as any).mockResolvedValue({});
  });

  it("succès : affiche la liste des contacts avec badge de non-lus", async () => {
    renderMessages();
    expect(await screen.findByText("M. Diop")).toBeInTheDocument();
    expect(screen.getByText("Mme Ba")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument(); // badge non-lu sur le contact enseignant
  });

  it("recherche et filtre par rôle : filtrent la liste des contacts", async () => {
    const user = userEvent.setup();
    renderMessages();
    await screen.findByText("M. Diop");

    await user.click(screen.getByText("Parents"));
    expect(screen.queryByText("M. Diop")).not.toBeInTheDocument();
    expect(screen.getByText("Mme Ba")).toBeInTheDocument();

    await user.click(screen.getByText("Tous"));
    await user.type(screen.getByPlaceholderText(/Rechercher un contact/i), "Diop");
    expect(screen.getByText("M. Diop")).toBeInTheDocument();
    expect(screen.queryByText("Mme Ba")).not.toBeInTheDocument();
  });

  it("succès : sélectionner un contact affiche le fil et marque les messages reçus comme lus", async () => {
    const user = userEvent.setup();
    renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    expect(await screen.findByText("Bonjour, avez-vous des nouvelles ?")).toBeInTheDocument();
    await waitFor(() => expect(markMessageAsRead).toHaveBeenCalledWith("m1"));
  });

  it("champs obligatoires manquants : le bouton d'envoi est désactivé sans texte saisi", async () => {
    const user = userEvent.setup();
    const { container } = renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    expect(getSubmitButton(container)).toBeDisabled();
  });

  it("succès : envoi d'un message texte avec mise à jour optimiste puis réinitialisation du champ", async () => {
    (sendMessage as any).mockImplementation(async (payload: any) => {
      const msg = { id: "m2", isRead: true, createdAt: new Date().toISOString(), ...payload };
      messagesStore.push(msg);
      return msg;
    });
    const user = userEvent.setup();
    const { container } = renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    const input = screen.getByPlaceholderText("Écrire un message...");
    await user.type(input, "Merci pour votre retour");
    await user.click(getSubmitButton(container));

    expect(await screen.findByText("Merci pour votre retour")).toBeInTheDocument();
    // TanStack Query v5 appelle mutationFn avec (variables, context) : on inspecte donc
    // uniquement le premier argument plutôt que toHaveBeenCalledWith qui exigerait la liste exacte.
    await waitFor(() => expect((sendMessage as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({ receiverId: "t1", senderRole: "advisor", content: "Merci pour votre retour" })
    ));
    expect(input).toHaveValue("");
  });

  it("erreur réseau : l'échec de l'envoi affiche un toast d'erreur et annule le message optimiste", async () => {
    (sendMessage as any).mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    const { container } = renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    const input = screen.getByPlaceholderText("Écrire un message...");
    await user.type(input, "Message qui va échouer");
    await user.click(getSubmitButton(container));

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Le message n'a pas pu être envoyé."));
    await waitFor(() => expect(screen.queryByText("Message qui va échouer")).not.toBeInTheDocument());
  });

  it("succès : upload d'une pièce jointe déclenche l'envoi avec l'URL du fichier", async () => {
    (uploadMessageAttachment as any).mockResolvedValue({ fileUrl: "/uploads/piece.pdf" });
    (sendMessage as any).mockImplementation(async (payload: any) => {
      const msg = { id: "m3", isRead: true, createdAt: new Date().toISOString(), ...payload };
      messagesStore.push(msg);
      return msg;
    });
    const user = userEvent.setup();
    renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    const fileInput = document.getElementById("advisor-chat-file") as HTMLInputElement;
    const file = new File(["contenu"], "piece.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(uploadMessageAttachment).toHaveBeenCalled());
    await waitFor(() => expect((sendMessage as any).mock.calls[0][0]).toEqual(
      expect.objectContaining({ attachmentUrl: "/uploads/piece.pdf" })
    ));
  });

  it("erreur réseau : l'échec de l'upload de pièce jointe affiche un toast d'erreur dédié", async () => {
    (uploadMessageAttachment as any).mockRejectedValue(new Error("Network Error"));
    const user = userEvent.setup();
    renderMessages();
    await user.click(await screen.findByText("M. Diop"));

    const fileInput = document.getElementById("advisor-chat-file") as HTMLInputElement;
    const file = new File(["contenu"], "piece.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => expect(toastErrorSpy).toHaveBeenCalledWith("Erreur lors de l'envoi du fichier."));
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it("état vide : message d'absence de contact si la liste est vide", async () => {
    (fetchAdvisorContacts as any).mockResolvedValue([]);
    (fetchMessages as any).mockResolvedValue([]);
    renderMessages();
    expect(await screen.findByText("Aucun contact")).toBeInTheDocument();
  });

  it("erreur réseau (chargement) : un échec de fetchAdvisorContacts n'empêche pas le rendu (dégradation silencieuse vers liste vide)", async () => {
    (fetchAdvisorContacts as any).mockRejectedValue(new Error("Network Error"));
    (fetchMessages as any).mockResolvedValue([]);
    renderMessages();

    // Constat : aucune bannière d'erreur dédiée n'est affichée en cas d'échec de chargement des contacts.
    expect(await screen.findByText("Aucun contact")).toBeInTheDocument();
  });
});
