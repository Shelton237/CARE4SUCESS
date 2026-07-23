// Scénario 05 — Messagerie croisée
// Réf. cartographie : Enseignant/Parent/Conseiller/Élève > Messages
//
// Paires : teacher↔parent, advisor↔parent, student↔teacher.
// Vérifie envoi, badge non-lu (unread-count), marquage lu, pièce jointe.
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  get, post, patch, API_BASE, tokenFor, seedUser, cleanupTestData, closePool,
} from "../helpers/harness.js";

const teacher = { id: "it-05-teacher", name: "[IT] Prof05", email: "prof05@it.test", role: "teacher" };
const parent = { id: "it-05-parent", name: "[IT] Parent05", email: "parent05@it.test", role: "parent" };
const advisor = { id: "it-05-advisor", name: "[IT] Advisor05", email: "advisor05@it.test", role: "advisor" };
const student = { id: "it-05-student", name: "[IT] Eleve05", email: "eleve05@it.test", role: "student" };

let tTok, pTok, aTok, sTok;
let msgTeacherToParentId;

const send = (from, to, content, attachmentUrl, token) =>
  post("/messages", {
    senderId: from.id, senderName: from.name, senderRole: from.role,
    receiverId: to.id, receiverName: to.name, receiverRole: to.role,
    content, attachmentUrl,
  }, { token });

const unread = (userId, token) => get(`/messages/unread-count/${userId}`, { token });

describe("Scénario 05 — Messagerie croisée", () => {
  beforeAll(async () => {
    await cleanupTestData();
    await seedUser(teacher); await seedUser(parent); await seedUser(advisor); await seedUser(student);
    tTok = tokenFor(teacher); pTok = tokenFor(parent); aTok = tokenFor(advisor); sTok = tokenFor(student);
  });

  afterAll(async () => {
    await cleanupTestData();
    await closePool();
  });

  it("étape 1 (actor-teacher → actor-parent) : envoi + badge non-lu incrémenté côté parent", async () => {
    const before = (await unread(parent.id, pTok)).data.count;
    const { status, data } = await send(teacher, parent, "Bonjour, point sur la séance de demain.", null, tTok);
    expect(status).toBe(201);
    msgTeacherToParentId = data.id;

    // Message présent dans le fil du parent
    const thread = await get(`/messages/${parent.id}`, { token: pTok });
    expect(thread.data.find((m) => m.id === msgTeacherToParentId), "message absent du fil parent").toBeTruthy();
    // Badge non-lu +1
    const after = (await unread(parent.id, pTok)).data.count;
    expect(after, "badge non-lu non incrémenté côté parent").toBe(before + 1);
  });

  it("étape 2 (actor-parent) : marquage lu → badge retombe", async () => {
    const beforeRead = (await unread(parent.id, pTok)).data.count;
    expect(beforeRead).toBeGreaterThanOrEqual(1);
    const { status } = await patch(`/messages/${msgTeacherToParentId}/read`, {}, { token: pTok });
    expect(status).toBe(200);
    const afterRead = (await unread(parent.id, pTok)).data.count;
    expect(afterRead, "badge non-lu non remis à jour après lecture").toBe(beforeRead - 1);
  });

  it("étape 3 (actor-advisor → actor-parent) : envoi avec pièce jointe, accessible côté parent", async () => {
    // Upload de la pièce jointe
    const form = new FormData();
    form.append("attachment", new Blob(["contenu image [IT]"], { type: "image/png" }), "bilan.png");
    const up = await fetch(`${API_BASE}/messages/upload`, {
      method: "POST", headers: { Authorization: `Bearer ${aTok}` }, body: form,
    });
    expect(up.status, "upload pièce jointe échoué").toBe(200);
    const { fileUrl } = await up.json();
    expect(fileUrl).toBeTruthy();

    const { status, data } = await send(advisor, parent, "Voici le bilan en pièce jointe.", fileUrl, aTok);
    expect(status).toBe(201);
    expect(data.attachmentUrl || data.attachment_url, "pièce jointe non enregistrée").toBeTruthy();

    // Côté parent : la pièce jointe est accessible dans le fil
    const thread = await get(`/messages/${parent.id}`, { token: pTok });
    const received = thread.data.find((m) => m.id === data.id);
    expect(received, "message conseiller absent côté parent").toBeTruthy();
    expect(received.attachmentUrl || received.attachment_url, "lien pièce jointe cassé côté parent").toBeTruthy();
  });

  it("étape 4 (actor-student → actor-teacher) : envoi + badge non-lu côté enseignant", async () => {
    const before = (await unread(teacher.id, tTok)).data.count;
    const { status, data } = await send(student, teacher, "Bonjour, une question sur le devoir.", null, sTok);
    expect(status).toBe(201);

    const thread = await get(`/messages/${teacher.id}`, { token: tTok });
    expect(thread.data.find((m) => m.id === data.id), "message élève absent du fil enseignant").toBeTruthy();
    const after = (await unread(teacher.id, tTok)).data.count;
    expect(after, "badge non-lu enseignant non incrémenté").toBe(before + 1);
  });
});
