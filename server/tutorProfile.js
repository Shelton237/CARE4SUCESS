// Profil de matching d'un tuteur : validation des champs modifiables et complétude.

const DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"];
const SLOTS = ["matin", "debut-apres-midi", "apres-midi", "soiree"];
export const MIN_VALID_RATE = 500;

const cleanList = (value, max = 20, len = 80) =>
  Array.isArray(value)
    ? [...new Set(value.map((v) => String(v ?? "").trim()).filter(Boolean).map((v) => v.slice(0, len)))].slice(0, max)
    : undefined;

export const cleanAvailability = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const out = {};
  for (const day of DAYS) {
    const slots = Array.isArray(value[day]) ? value[day].filter((s) => SLOTS.includes(s)) : [];
    if (slots.length) out[day] = [...new Set(slots)];
  }
  return out;
};

const parseList = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try { const p = JSON.parse(v); if (Array.isArray(p)) return p; } catch { /* texte libre */ }
    return v.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return [];
};

const parseObject = (v) => {
  if (v && typeof v === "object" && !Array.isArray(v)) return v;
  if (typeof v === "string") { try { const p = JSON.parse(v); return p && typeof p === "object" ? p : {}; } catch { return {}; } }
  return {};
};

const hasSlots = (avail) =>
  Array.isArray(avail) ? avail.length > 0 : Object.values(avail || {}).some((s) => Array.isArray(s) && s.length > 0);

// Ligne teachers (+ localisation du compte en repli) -> profil lisible.
export const readTutorProfile = (t, userLocation = "") => ({
  subjects: parseList(t.subjects),
  levels: t.levels ? parseList(t.levels) : parseList(t.level),
  city: (t.city || "").trim() || (userLocation || "").trim(),
  zones: parseList(t.zones),
  availability: parseObject(t.availability_json),
  rate: Number(t.hourly_rate) || 0,
  currency: t.currency || "XAF",
});

export const profileCompleteness = (p) => {
  const checks = [
    ["matières", p.subjects.length > 0],
    ["niveaux", p.levels.length > 0],
    ["ville", !!p.city],
    ["disponibilités", hasSlots(p.availability)],
    ["tarif", p.rate >= MIN_VALID_RATE],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
  return { percent: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
};

// Colonnes SQL à mettre à jour ; le tarif et la devise uniquement si allowRate (conseiller / admin).
export const buildProfileUpdate = (body, { allowRate = false } = {}) => {
  const sets = [];
  const params = [];
  const subjects = cleanList(body?.subjects);
  if (subjects) { sets.push("subjects = ?"); params.push(JSON.stringify(subjects)); }
  const levels = cleanList(body?.levels);
  if (levels) {
    sets.push("levels = ?", "level = ?");
    params.push(JSON.stringify(levels), levels.join(", ").slice(0, 120));
  }
  if (typeof body?.city === "string") { sets.push("city = ?"); params.push(body.city.trim().slice(0, 120)); }
  const zones = cleanList(body?.zones, 20, 120);
  if (zones) { sets.push("zones = ?"); params.push(JSON.stringify(zones)); }
  const availability = cleanAvailability(body?.availability);
  if (availability) { sets.push("availability_json = ?"); params.push(JSON.stringify(availability)); }
  if (allowRate) {
    if (body?.rate !== undefined && body.rate !== null && body.rate !== "") {
      const rate = Number(body.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 10000000) return { error: "Tarif invalide." };
      sets.push("hourly_rate = ?"); params.push(Math.round(rate));
    }
    if (typeof body?.currency === "string" && body.currency) {
      if (!/^[A-Z]{3}$/.test(body.currency)) return { error: "Devise invalide." };
      sets.push("currency = ?"); params.push(body.currency);
    }
  }
  return { sets, params };
};
