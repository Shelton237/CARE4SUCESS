// XAF = Franc CFA d'Afrique Centrale (BEAC — Cameroun et pays voisins, marché
// principal de la plateforme). À ne pas confondre avec XOF (Afrique de
// l'Ouest, BCEAO) : les deux sont familièrement appelés "FCFA" mais ne sont
// pas interchangeables pour les paiements Mobile Money (Flutterwave les
// distingue strictement par pays).
export const SUPPORTED_CURRENCIES = ["XAF", "XOF", "GHS", "KES", "NGN", "MGA", "USD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const formatMoney = (
  value: number | string | null | undefined,
  currency: string = "XAF",
  locale: string = "fr-FR"
) => {
  const amount = Number(value ?? 0);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(safeAmount)} ${currency}`;
  }
};

export const formatFCFA = (value: number | string | null | undefined) => formatMoney(value, "XAF");
