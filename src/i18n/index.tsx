import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LANG, LANGUAGES, isLangCode, type LangCode } from "./languages";

export { LANGUAGES, type LangCode } from "./languages";

/* ─── Dictionnaires ───────────────────────────────────────────────────────────
   Un fichier JSON par page dans ./dict/, de la forme
   { "Texte français": { "en": "...", "mg": "...", "ar": "..." } }.
   Le texte français sert de clé : sans traduction, on affiche le français.
   Vérification de couverture : node scripts/i18n-check.mjs */
type Entry = Partial<Record<Exclude<LangCode, "fr">, string>>;
const files = import.meta.glob("./dict/*.json", { eager: true, import: "default" }) as Record<string, Record<string, Entry>>;
const DICT: Record<string, Entry> = Object.assign({}, ...Object.values(files));

const STORAGE_KEY = "c4s-lang";

function readInitialLang(): LangCode {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("lang");
    if (isLangCode(fromUrl)) return fromUrl;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLangCode(stored)) return stored;
  } catch { /* navigation privée, stockage bloqué : on reste sur le français */ }
  return DEFAULT_LANG;
}

/** Marque une chaîne française à traduire quand elle est définie hors d'un composant
    (données de page). À afficher ensuite avec t(valeur). Ne change pas la valeur. */
export const tt = <T extends string>(s: T): T => s;

export type TFunction = (fr: string, vars?: Record<string, string | number>) => string;

interface I18nValue {
  lang: LangCode;
  dir: "ltr" | "rtl";
  setLang: (l: LangCode) => void;
  t: TFunction;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(readInitialLang);
  const dir = LANGUAGES.find(l => l.code === lang)!.dir;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = dir;
  }, [lang, dir]);

  const setLang = useCallback((l: LangCode) => {
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch { /* ignoré */ }
  }, []);

  const t = useCallback<TFunction>((fr, vars) => {
    let out = lang === "fr" ? fr : DICT[fr]?.[lang] ?? fr;
    if (vars) for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(String(v));
    return out;
  }, [lang]);

  const value = useMemo(() => ({ lang, dir, setLang, t }), [lang, dir, setLang, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé dans <I18nProvider>");
  return ctx;
}

/** Raccourci : const { t } = useT(); */
export const useT = useI18n;

// Classes écrites en toutes lettres pour que Tailwind les détecte
const SOFT_BREAK: Record<string, string> = {
  sm: "hidden sm:block",
  md: "hidden md:block",
  lg: "hidden lg:block",
  xl: "hidden xl:block",
};

/** Texte enrichi :
 *  - "\n" : saut de ligne forcé
 *  - "{sm}" "{md}" "{lg}" "{xl}" : saut de ligne visible seulement à partir de cette largeur
 *    d'écran (simple espace en dessous)
 *  - <nom>…</nom> : rendu par map[nom]
 *  Ex. rich(t("Trouvons ensemble\n<gold>le bon coach.</gold>"), { gold: c => <span className="...">{c}</span> }) */
export function rich(text: string, map: Record<string, (children: ReactNode) => ReactNode> = {}): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /<(\w+)>([\s\S]*?)<\/\1>|\{(sm|md|lg|xl)\}|\n/g;
  let last = 0, i = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[0] === "\n") out.push(<br key={`br${i++}`} />);
    else if (m[3]) out.push(<span key={`sb${i++}`}><br className={SOFT_BREAK[m[3]]} />{" "}</span>);
    else {
      const render = map[m[1]];
      out.push(render ? <span key={`t${i++}`} style={{ display: "contents" }}>{render(m[2])}</span> : m[2]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Lignes en blocs (descriptions dont le français impose des retours à la ligne). */
export function lines(text: string): ReactNode[] {
  return text.split("\n").map((l, k) => <span key={k} className="block">{l}</span>);
}
