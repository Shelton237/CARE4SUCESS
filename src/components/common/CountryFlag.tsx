import * as React from "react";
import { cn } from "@/lib/utils";

export interface CountryFlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  code?: string;
  countryName?: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// Dictionnaire de secours nom -> code ISO 2 lettres
const NAME_TO_CODE: Record<string, string> = {
  cameroun: "cm",
  madagascar: "mg",
  "côte d'ivoire": "ci",
  "cote d'ivoire": "ci",
  senegal: "sn",
  sénégal: "sn",
  gabon: "ga",
  congo: "cg",
  "rd congo": "cd",
  "republique democratique du congo": "cd",
  mali: "ml",
  guinee: "gn",
  guinée: "gn",
  benin: "bj",
  bénin: "bj",
  togo: "tg",
  france: "fr",
  belgique: "be",
  suisse: "ch",
  canada: "ca",
};

const SIZE_CLASSES = {
  xs: "w-4 h-3",
  sm: "w-5 h-3.5",
  md: "w-6 h-4",
  lg: "w-7 h-5",
};

export function CountryFlag({
  code,
  countryName,
  size = "sm",
  className,
  alt,
  ...props
}: CountryFlagProps) {
  let iso = (code || "").trim().toLowerCase();

  if (!iso && countryName) {
    const clean = countryName.trim().toLowerCase();
    iso = NAME_TO_CODE[clean] || "";
  }

  // Si pas de code ISO valide (2 lettres), afficher un fallback neutre
  if (!iso || iso.length !== 2) {
    return (
      <span
        className={cn(
          "inline-block rounded-sm bg-slate-200 border border-slate-300 shrink-0",
          SIZE_CLASSES[size],
          className
        )}
      />
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${iso}.png`}
      srcSet={`https://flagcdn.com/w80/${iso}.png 2x`}
      alt={alt || countryName || iso.toUpperCase()}
      loading="lazy"
      className={cn(
        "inline-block object-cover rounded-sm shadow-[0_0_1px_rgba(0,0,0,0.4)] shrink-0",
        SIZE_CLASSES[size],
        className
      )}
      onError={(e) => {
        // En cas d'erreur de chargement, masquer l'image cassée et afficher un rectangle propre
        (e.currentTarget as HTMLElement).style.display = "none";
      }}
      {...props}
    />
  );
}

export default CountryFlag;
