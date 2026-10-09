import { CURRENCIES, getCurrency, getCurrencyForCountry, CurrencyInfo } from "@/data/currencies";

export * from "@/data/currencies";

export const SUPPORTED_CURRENCIES = CURRENCIES.map((c) => c.code) as unknown as readonly string[];
export type SupportedCurrency = string;

/**
 * Formate un montant avec le symbole et la devise appropriée
 */
export const formatMoney = (
  value: number | string | null | undefined,
  currency: string = "XAF",
  locale: string = "fr-FR"
): string => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  const currInfo = getCurrency(currency);

  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currInfo.code === "XAF" || currInfo.code === "XOF" ? "XOF" : currInfo.code,
      maximumFractionDigits: currInfo.decimals,
    })
      .format(safeAmount)
      .replace("CFA", currInfo.symbol)
      .replace("XOF", currInfo.symbol);
  } catch {
    const formattedNum = new Intl.NumberFormat(locale, {
      maximumFractionDigits: currInfo.decimals,
    }).format(safeAmount);
    return `${formattedNum} ${currInfo.symbol}`;
  }
};

export const formatFCFA = (value: number | string | null | undefined) => formatMoney(value, "XAF");
export const formatMGA = (value: number | string | null | undefined) => formatMoney(value, "MGA");

/**
 * Formate le prix automatiquement selon le pays de l'utilisateur
 */
export const formatPriceForCountry = (
  amountInXAF: number,
  country?: string | null
): string => {
  const curr = getCurrencyForCountry(country);
  // Si le pays est Madagascar, conversion indicative approximative ou tarif local
  if (curr.code === "MGA") {
    // 1 XAF ≈ 7 MGA (taux indicatif)
    return formatMoney(amountInXAF * 7, "MGA");
  }
  return formatMoney(amountInXAF, curr.code);
};
