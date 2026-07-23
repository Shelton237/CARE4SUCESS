// @vitest-environment node
//
// Test de non-régression — T-02 (docs/backlog.md / AUDIT_2026-07-22.md, constat [B2]).
//
// Bug: PATCH /api/requests/:id était accessible sans authentification, ce qui
// permettait à n'importe qui de modifier le statut de n'importe quelle demande.
//
// On mocke mysql2/promise (aucune vraie connexion DB), node-cron (pas de timers
// réels qui garderaient le process ouvert) et on intercepte express() pour capturer
// l'app réelle sans laisser server/index.js ouvrir un vrai port réseau via son
// propre app.listen(). Le test pilote ensuite l'app via un serveur HTTP éphémère
// que l'on ferme nous-mêmes à la fin.

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import http from "http";
import jwt from "jsonwebtoken";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret_for_hotfix_t02";

let capturedApp;

vi.mock("mysql2/promise", () => {
  const query = vi.fn(async (sql) => {
    const text = typeof sql === "string" ? sql : String(sql);
    if (/SELECT \* FROM requests WHERE id = \?/i.test(text)) {
      return [
        [
          {
            id: "req-123",
            parent_name: "Jean Dupont",
            child_name: "Alice Dupont",
            level: "Terminale",
            subject: "Maths",
            phone: "699000000",
            status: "clôturé",
            request_date: "2026-01-01",
          },
        ],
      ];
    }
    // Toute autre requête (CREATE TABLE, SHOW COLUMNS, UPDATE, ALTER TABLE, ...)
    // utilisées par initDB() et les migrations n'ont pas besoin d'un résultat
    // spécifique pour ce test ciblé.
    return [[]];
  });
  const pool = {
    query,
    getConnection: vi.fn(async () => ({
      query: vi.fn(async () => [[]]),
      beginTransaction: vi.fn(),
      commit: vi.fn(),
      rollback: vi.fn(),
      release: vi.fn(),
    })),
    end: vi.fn(),
  };
  return {
    default: { createPool: () => pool },
    createPool: () => pool,
  };
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
    // Empêche server/index.js d'ouvrir un vrai port réseau pendant le test :
    // on pilote l'app nous-mêmes via un serveur HTTP éphémère (voir beforeAll).
    app.listen = (_port, cb) => {
      if (typeof cb === "function") cb();
      return { close: (done) => { if (typeof done === "function") done(); } };
    };
    capturedApp = app;
    return app;
  };
  Object.assign(wrapper, realExpress);
  return { ...actual, default: wrapper };
});

let server;
let baseUrl;

beforeAll(async () => {
  await import("./index.js");
  server = http.createServer(capturedApp);
  await new Promise((resolve) => server.listen(0, resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

describe("PATCH /api/requests/:id", () => {
  it("rejette une requête sans jeton d'authentification (régression sécurité T-02)", async () => {
    const res = await fetch(`${baseUrl}/api/requests/req-123`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "clôturé" }),
    });
    expect(res.status).toBe(401);
  });

  it("rejette une requête avec un jeton invalide", async () => {
    const res = await fetch(`${baseUrl}/api/requests/req-123`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token-invalide",
      },
      body: JSON.stringify({ status: "clôturé" }),
    });
    expect(res.status).toBe(401);
  });

  it("accepte une requête avec un jeton valide et met à jour le statut (comportement inchangé)", async () => {
    const token = jwt.sign(
      { sub: "advisor-1", role: "advisor" },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    const res = await fetch(`${baseUrl}/api/requests/req-123`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status: "clôturé" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("clôturé");
  });
});
