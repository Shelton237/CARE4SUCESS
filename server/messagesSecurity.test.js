// @vitest-environment node
//
// Non-régression sécurité de la messagerie (base simulée, même harnais que index.test.js) :
//  - lecture limitée à sa propre messagerie (sinon 403) ;
//  - expéditeur, noms et rôles relus en base, jamais pris du corps de la requête ;
//  - seul le destinataire peut marquer un message comme lu.
import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import http from "http";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_messages";

let capturedApp;
const calls = [];

vi.mock("mysql2/promise", () => {
  const USERS = [
    { id: "adv-1", name: "Brice Owona", role: "advisor", secondary_role: null },
    { id: "par-1", name: "Valérie Famo", role: "parent", secondary_role: null },
    { id: "tut-1", name: "Awa Tutrice", role: "tutor", secondary_role: "teacher" },
  ];
  const query = vi.fn(async (sql, params = []) => {
    const text = typeof sql === "string" ? sql : String(sql);
    calls.push({ text, params });
    if (/FROM users WHERE id IN \(\?, \?\)/i.test(text)) return [USERS.filter((u) => params.includes(u.id))];
    if (/SELECT \* FROM messages WHERE id = \?/i.test(text)) {
      const ins = [...calls].reverse().find((c) => /INSERT INTO messages/i.test(c.text));
      const p = ins?.params || [];
      return [[{ id: p[0], sender_id: p[1], sender_name: p[2], sender_role: p[3], receiver_id: p[4], receiver_name: p[5], receiver_role: p[6], content: p[7], is_read: 0 }]];
    }
    return [[]];
  });
  const pool = {
    query,
    getConnection: vi.fn(async () => ({ query: vi.fn(async () => [[]]), beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn() })),
    end: vi.fn(),
  };
  return { default: { createPool: () => pool }, createPool: () => pool };
});

vi.mock("node-cron", () => {
  const schedule = vi.fn(() => ({ stop: vi.fn() }));
  return { default: { schedule }, schedule };
});

vi.mock("express", async () => {
  const actual = await vi.importActual("express");
  const realExpress = actual.default;
  const wrapper = (...args) => {
    const app = realExpress(...args);
    app.listen = (_port, cb) => { if (typeof cb === "function") cb(); return { close: (done) => { if (typeof done === "function") done(); } }; };
    capturedApp = app;
    return app;
  };
  Object.assign(wrapper, realExpress);
  return { ...actual, default: wrapper };
});

let server;
let baseUrl;
const token = (sub, role) => jwt.sign({ sub, role }, process.env.JWT_SECRET, { expiresIn: "1h" });
const call = (path, { method = "GET", sub = "par-1", role = "parent", body } = {}) =>
  fetch(`${baseUrl}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token(sub, role)}` },
    body: body ? JSON.stringify(body) : undefined,
  });

beforeAll(async () => {
  await import("./index.js");
  server = http.createServer(capturedApp);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => { await new Promise((resolve) => server.close(resolve)); });
beforeEach(() => { calls.length = 0; });

describe("Messagerie : contrôle d'accès", () => {
  it("un parent ne peut pas lire la messagerie d'un autre utilisateur", async () => {
    expect((await call("/messages/adv-1")).status).toBe(403);
    expect((await call("/messages/unread-count/adv-1")).status).toBe(403);
    expect((await call("/messages/par-1")).status).toBe(200);
  });

  it("l'expéditeur et les noms viennent du jeton et de la base, pas du corps", async () => {
    const res = await call("/messages", {
      method: "POST",
      body: { senderId: "adv-1", senderName: "Usurpateur", senderRole: "admin", receiverId: "tut-1", receiverName: "X", receiverRole: "teacher", content: "Bonjour" },
    });
    expect(res.status).toBe(201);
    const insert = calls.find((c) => /INSERT INTO messages/i.test(c.text));
    // [id, senderId, senderName, senderRole, receiverId, receiverName, receiverRole, content, attachment]
    expect(insert.params.slice(1, 7)).toEqual(["par-1", "Valérie Famo", "parent", "tut-1", "Awa Tutrice", "teacher"]);
  });

  it("destinataire inconnu : 404", async () => {
    expect((await call("/messages", { method: "POST", body: { receiverId: "fantome", content: "x" } })).status).toBe(404);
  });

  it("marquer comme lu est restreint au destinataire", async () => {
    await call("/messages/m-1/read", { method: "PATCH" });
    const upd = calls.find((c) => /UPDATE messages SET is_read/i.test(c.text));
    expect(upd.text).toMatch(/receiver_id = \?/);
    expect(upd.params).toEqual(["m-1", "par-1"]);
  });
});
