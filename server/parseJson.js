// Helpers de lecture des colonnes JSON MySQL.
// mysql2 renvoie les colonnes JSON déjà parsées (objet/tableau) ; selon le
// chemin d'écriture, une chaîne JSON peut aussi subsister. Ces helpers
// acceptent les deux formes.

// Colonne JSON contenant un objet : objet déjà parsé, chaîne JSON, ou vide -> {}.
export const parseJsonObject = (value) => {
  let v = value;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return {}; }
  }
  return v && typeof v === "object" && !Array.isArray(v) ? v : {};
};

// Colonne attendue sous forme de liste (tableau, chaîne JSON, CSV, chaîne simple).
// Comportement historique inchangé (déplacé tel quel depuis server/index.js).
export const parseJson = (value, fallback) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") value = parsed;
    } catch {
      /* ignore */
    }
    if (value.includes(",")) {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (value.trim()) {
      return [value.trim()];
    }
  }
  return fallback;
};
