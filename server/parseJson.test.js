import { describe, it, expect } from "vitest";
import { parseJson, parseJsonObject } from "./parseJson.js";

describe("parseJsonObject", () => {
  it("objet déjà parsé (mysql2)", () => expect(parseJsonObject({ maths: 3 })).toEqual({ maths: 3 }));
  it("chaîne JSON objet", () => expect(parseJsonObject('{"maths":3}')).toEqual({ maths: 3 }));
  it("chaîne JSON tableau -> {}", () => expect(parseJsonObject("[1,2]")).toEqual({}));
  it("tableau -> {}", () => expect(parseJsonObject([1])).toEqual({}));
  it("CSV -> {}", () => expect(parseJsonObject("a,b")).toEqual({}));
  it("null / undefined / vide -> {}", () => {
    expect(parseJsonObject(null)).toEqual({});
    expect(parseJsonObject(undefined)).toEqual({});
    expect(parseJsonObject("")).toEqual({});
  });
  it("chaîne invalide -> {}", () => expect(parseJsonObject("{oops")).toEqual({}));
});

describe("parseJson (comportement historique inchangé)", () => {
  it("tableau", () => expect(parseJson(["a"], [])).toEqual(["a"]));
  it("chaîne JSON tableau", () => expect(parseJson('["a","b"]', [])).toEqual(["a", "b"]));
  it("CSV", () => expect(parseJson("a, b", [])).toEqual(["a", "b"]));
  it("chaîne simple", () => expect(parseJson("Maths", [])).toEqual(["Maths"]));
  it("chaîne JSON string", () => expect(parseJson('"a,b"', [])).toEqual(["a", "b"]));
  it("vide -> fallback", () => {
    expect(parseJson(null, [])).toEqual([]);
    expect(parseJson("", null)).toBeNull();
  });
  it("objet -> fallback (non géré par design, utiliser parseJsonObject)", () => {
    expect(parseJson({ a: 1 }, [])).toEqual([]);
  });
});
