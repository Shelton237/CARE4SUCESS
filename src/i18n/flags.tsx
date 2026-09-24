import { useId } from "react";
import type { LangCode } from "./languages";

/* Drapeaux ronds en SVG (pas d'emoji : rendu identique partout).
   L'arabe n'est pas lié à un pays : pastille neutre avec la lettre ع. */

function Round({ children, size }: { children: React.ReactNode; size: number }) {
  const id = useId();
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="rounded-full shrink-0" aria-hidden>
      <defs><clipPath id={id}><circle cx="12" cy="12" r="12" /></clipPath></defs>
      <g clipPath={`url(#${id})`}>{children}</g>
    </svg>
  );
}

export function Flag({ code, size = 20 }: { code: LangCode; size?: number }) {
  if (code === "fr") {
    return (
      <Round size={size}>
        <rect width="8" height="24" fill="#0055A4" />
        <rect x="8" width="8" height="24" fill="#fff" />
        <rect x="16" width="8" height="24" fill="#EF4135" />
      </Round>
    );
  }
  if (code === "en") {
    return (
      <Round size={size}>
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#fff" strokeWidth="4.2" />
        <path d="M0 0L24 24M24 0L0 24" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M12 0V24M0 12H24" stroke="#fff" strokeWidth="7" />
        <path d="M12 0V24M0 12H24" stroke="#C8102E" strokeWidth="4" />
      </Round>
    );
  }
  if (code === "mg") {
    return (
      <Round size={size}>
        <rect width="24" height="24" fill="#fff" />
        <rect x="8" width="16" height="12" fill="#FC3D32" />
        <rect x="8" y="12" width="16" height="12" fill="#007E3A" />
      </Round>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className="shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#0F9B8E" />
      <text x="12" y="17.2" textAnchor="middle" fontSize="15" fontWeight="700" fill="#fff" fontFamily="'Noto Sans Arabic', 'Noto Sans', sans-serif">ع</text>
    </svg>
  );
}
