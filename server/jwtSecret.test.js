import { describe, it, expect } from "vitest";
import { resolveJwtSecret } from "./jwtSecret.js";

describe("resolveJwtSecret", () => {
  it("lève une erreur claire quand JWT_SECRET n'est pas défini, au lieu d'un fallback silencieux", () => {
    expect(() => resolveJwtSecret({})).toThrow(/JWT_SECRET/);
  });

  it("lève une erreur claire quand JWT_SECRET est une chaîne vide", () => {
    expect(() => resolveJwtSecret({ JWT_SECRET: "" })).toThrow(/JWT_SECRET/);
  });

  it("retourne la valeur définie par l'environnement quand JWT_SECRET est présent", () => {
    expect(resolveJwtSecret({ JWT_SECRET: "un-secret-de-test" })).toBe("un-secret-de-test");
  });
});
