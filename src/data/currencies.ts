export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
  flag?: string;
  decimals: number;
}

export const CURRENCIES: CurrencyInfo[] = [
  {
    code: "XAF",
    name: "Franc CFA (BEAC - Afrique Centrale)",
    symbol: "FCFA",
    flag: "🇨🇲",
    decimals: 0,
  },
  {
    code: "MGA",
    name: "Ariary malgache",
    symbol: "Ar",
    flag: "🇲🇬",
    decimals: 0,
  },
  {
    code: "XOF",
    name: "Franc CFA (BCEAO - Afrique de l'Ouest)",
    symbol: "FCFA",
    flag: "🇨🇮",
    decimals: 0,
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    decimals: 2,
  },
  {
    code: "USD",
    name: "Dollar américain",
    symbol: "$",
    flag: "🇺🇸",
    decimals: 2,
  },
  {
    code: "CAD",
    name: "Dollar canadien",
    symbol: "CAD",
    flag: "🇨🇦",
    decimals: 2,
  },
  {
    code: "NGN",
    name: "Naira nigérian",
    symbol: "₦",
    flag: "🇳🇬",
    decimals: 0,
  },
];

export const DEFAULT_CURRENCY = CURRENCIES[0]; // XAF

export function getCurrency(code?: string | null): CurrencyInfo {
  if (!code) return DEFAULT_CURRENCY;
  return CURRENCIES.find((c) => c.code.toUpperCase() === code.toUpperCase()) || DEFAULT_CURRENCY;
}

/**
 * Associe le pays sélectionné à sa devise par défaut
 */
export function getCurrencyForCountry(countryCodeOrName?: string | null): CurrencyInfo {
  if (!countryCodeOrName) return DEFAULT_CURRENCY;
  const clean = countryCodeOrName.trim().toUpperCase();

  if (clean === "MG" || clean === "MADAGASCAR") {
    return getCurrency("MGA");
  }
  if (["CI", "SN", "BF", "ML", "BJ", "TG", "CÔTE D'IVOIRE", "SÉNÉGAL", "BENIN", "TOGO"].includes(clean)) {
    return getCurrency("XOF");
  }
  if (["FR", "BE", "FRANCE", "BELGIQUE"].includes(clean)) {
    return getCurrency("EUR");
  }
  if (clean === "CA" || clean === "CANADA") {
    return getCurrency("CAD");
  }

  // Par défaut Afrique centrale (Cameroun, Tchad, Gabon, Congo, Centrafrique...)
  return getCurrency("XAF");
}
