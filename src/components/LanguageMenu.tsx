import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Flag } from "@/i18n/flags";
import { LANGUAGES, useI18n } from "@/i18n";

/** Sélecteur de langue. variant "light" : en-tête clair ; "dark" : pied de page bleu. */
export function LanguageMenu({ variant = "light", dropUp = false, className = "" }: { variant?: "light" | "dark"; dropUp?: boolean; className?: string }) {
  const { lang, setLang, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find(l => l.code === lang)!;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const dark = variant === "dark";
  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("Langue")}
        className={`flex items-center gap-2 rounded-lg transition-colors ${
          dark
            ? "text-[13.4px] text-blue-100/80 hover:text-white"
            : "h-10 xl:h-[42px] px-2.5 text-[13px] text-[#0D2D5A] hover:bg-white/70"
        }`}
      >
        <Flag code={lang} size={dark ? 18 : 22} />
        <span className="font-semibold">{current.short}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={t("Langue")}
          className={`absolute end-0 z-[60] w-44 rounded-xl bg-white text-[#0D2D5A] shadow-lg border border-[#0D2D5A]/10 py-1.5 ${dropUp ? "bottom-full mb-2" : "top-full mt-2"}`}
        >
          {LANGUAGES.map(l => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                lang={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm text-start hover:bg-[#F4F2ED] transition-colors ${l.code === lang ? "font-bold" : "font-medium"}`}
              >
                <Flag code={l.code} size={20} />
                <span className="flex-1">{l.label}</span>
                {l.code === lang && <Check className="w-4 h-4 text-[#0F9B8E]" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
