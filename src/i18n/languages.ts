export type LangCode = "fr" | "en" | "mg" | "ar";

export interface LanguageInfo {
  code: LangCode;
  /** Nom dans sa propre langue, affiché dans le sélecteur */
  label: string;
  /** Code court affiché à côté du drapeau */
  short: string;
  dir: "ltr" | "rtl";
}

export const LANGUAGES: LanguageInfo[] = [
  { code: "fr", label: "Français", short: "FR", dir: "ltr" },
  { code: "en", label: "English", short: "EN", dir: "ltr" },
  { code: "mg", label: "Malagasy", short: "MG", dir: "ltr" },
  { code: "ar", label: "العربية", short: "AR", dir: "rtl" },
];

export const DEFAULT_LANG: LangCode = "fr";
export const isLangCode = (v: unknown): v is LangCode => LANGUAGES.some(l => l.code === v);
