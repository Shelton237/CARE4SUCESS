import { useState, useEffect } from "react";

export interface Country {
  code: string;         // ISO 3166-1 alpha-2, e.g. "CM"
  name: string;         // Nom usuel en français, e.g. "Cameroun"
  dialCode: string;     // Préfixe téléphonique international, e.g. "+237"
  flag: string;         // Emoji drapeau, e.g. "🇨🇲"
  currency?: string;    // Monnaie, e.g. "XAF"
  phonePlaceholder?: string; // Format d'exemple sans l'indicatif, e.g. "6XX XXX XXX"
  citiesExample?: string;    // Villes principales d'exemple pour placeholder
  cities?: string[];         // Liste des villes pour l'autocomplétion
  active?: boolean;          // Statut d'activation par le super admin
}

export const INITIAL_COUNTRIES: Country[] = [
  {
    code: "CM",
    name: "Cameroun",
    dialCode: "+237",
    flag: "🇨🇲",
    currency: "XAF",
    phonePlaceholder: "6XX XXX XXX",
    citiesExample: "Douala, Yaoundé, Bafoussam, Garoua...",
    active: true,
    cities: [
      "Douala",
      "Yaoundé",
      "Bafoussam",
      "Garoua",
      "Bamenda",
      "Maroua",
      "Ngaoundéré",
      "Kribi",
      "Limbé",
      "Dschang",
      "Ebolowa",
      "Buea",
      "Bertoua",
      "Edéa",
      "Foumban",
      "Kumba",
      "Mbalmayo",
      "Nkongsamba",
      "Sangmélima",
      "Bafang",
      "Bangangté",
    ],
  },
  {
    code: "MG",
    name: "Madagascar",
    dialCode: "+261",
    flag: "🇲🇬",
    currency: "MGA",
    phonePlaceholder: "34 XX XXX XX",
    citiesExample: "Antananarivo, Toamasina, Majunga...",
    active: true,
    cities: [
      "Antananarivo",
      "Toamasina (Tamatave)",
      "Antsirabe",
      "Mahajanga (Majunga)",
      "Fianarantsoa",
      "Toliara (Tuléar)",
      "Antsiranana (Diégo-Suarez)",
      "Nosy Be",
      "Morondava",
      "Ambatondrazaka",
      "Taolagnaro (Fort-Dauphin)",
      "Manakara",
      "Sambava",
      "Fénérive-Est",
    ],
  },
  {
    code: "CI",
    name: "Côte d'Ivoire",
    dialCode: "+225",
    flag: "🇨🇮",
    currency: "XOF",
    phonePlaceholder: "07 XX XX XX XX",
    citiesExample: "Abidjan, Bouaké, Yamoussoukro...",
    active: true,
    cities: [
      "Abidjan",
      "Bouaké",
      "Yamoussoukro",
      "San-Pédro",
      "Korhogo",
      "Daloa",
      "Man",
      "Gagnoa",
      "Soubré",
      "Grand-Bassam",
      "Bingerville",
      "Anyama",
      "Divo",
      "Abengourou",
    ],
  },
  {
    code: "SN",
    name: "Sénégal",
    dialCode: "+221",
    flag: "🇸🇳",
    currency: "XOF",
    phonePlaceholder: "77 XXX XX XX",
    citiesExample: "Dakar, Thiès, Saint-Louis...",
    active: true,
    cities: [
      "Dakar",
      "Thiès",
      "Saint-Louis",
      "Kaolack",
      "Ziguinchor",
      "Mbour",
      "Touba",
      "Rufisque",
      "Tambacounda",
      "Diourbel",
      "Kolda",
      "Louga",
    ],
  },
  {
    code: "GA",
    name: "Gabon",
    dialCode: "+241",
    flag: "🇬🇦",
    currency: "XAF",
    phonePlaceholder: "06X XX XX XX",
    citiesExample: "Libreville, Port-Gentil, Franceville...",
    active: true,
    cities: [
      "Libreville",
      "Port-Gentil",
      "Franceville",
      "Oyem",
      "Moanda",
      "Mouila",
      "Lambaréné",
      "Tchibanga",
      "Koulamoutou",
      "Akanda",
    ],
  },
  {
    code: "TD",
    name: "Tchad",
    dialCode: "+235",
    flag: "🇹🇩",
    currency: "XAF",
    phonePlaceholder: "66 XX XX XX",
    citiesExample: "N'Djamena, Moundou, Sarh...",
    active: true,
    cities: [
      "N'Djamena",
      "Moundou",
      "Sarh",
      "Abéché",
      "Kélo",
      "Koumra",
      "Pala",
      "Am Timan",
      "Bongor",
      "Mongo",
    ],
  },
  {
    code: "CD",
    name: "RD Congo",
    dialCode: "+243",
    flag: "🇨🇩",
    currency: "CDF",
    phonePlaceholder: "8X XXX XXXX",
    citiesExample: "Kinshasa, Lubumbashi, Goma...",
    active: true,
    cities: [
      "Kinshasa",
      "Lubumbashi",
      "Mbuji-Mayi",
      "Kananga",
      "Kisangani",
      "Bukavu",
      "Goma",
      "Kolwezi",
      "Matadi",
      "Likasi",
    ],
  },
  {
    code: "CG",
    name: "Congo (Brazzaville)",
    dialCode: "+242",
    flag: "🇨🇬",
    currency: "XAF",
    phonePlaceholder: "06 XXX XX XX",
    citiesExample: "Brazzaville, Pointe-Noire...",
    active: true,
    cities: [
      "Brazzaville",
      "Pointe-Noire",
      "Dolisie",
      "Nkayi",
      "Ouésso",
      "Owando",
      "Kinkala",
      "Djambala",
    ],
  },
  {
    code: "BJ",
    name: "Bénin",
    dialCode: "+229",
    flag: "🇧🇯",
    currency: "XOF",
    phonePlaceholder: "9X XX XX XX",
    citiesExample: "Cotonou, Porto-Novo, Parakou...",
    active: true,
    cities: [
      "Cotonou",
      "Porto-Novo",
      "Parakou",
      "Abomey-Calavi",
      "Djougou",
      "Bohicon",
      "Ouidah",
      "Natitingou",
    ],
  },
  {
    code: "TG",
    name: "Togo",
    dialCode: "+228",
    flag: "🇹🇬",
    currency: "XOF",
    phonePlaceholder: "9X XX XX XX",
    citiesExample: "Lomé, Kara, Sokodé...",
    active: true,
    cities: [
      "Lomé",
      "Sokodé",
      "Kara",
      "Kpalimé",
      "Atakpamé",
      "Dapaong",
      "Tsévié",
      "Aného",
    ],
  },
  {
    code: "ML",
    name: "Mali",
    dialCode: "+223",
    flag: "🇲🇱",
    currency: "XOF",
    phonePlaceholder: "7X XX XX XX",
    citiesExample: "Bamako, Sikasso, Ségou...",
    active: true,
    cities: [
      "Bamako",
      "Sikasso",
      "Mopti",
      "Koutiala",
      "Kayes",
      "Ségou",
      "Gao",
      "Kati",
    ],
  },
  {
    code: "BF",
    name: "Burkina Faso",
    dialCode: "+226",
    flag: "🇧🇫",
    currency: "XOF",
    phonePlaceholder: "7X XX XX XX",
    citiesExample: "Ouagadougou, Bobo-Dioulasso...",
    active: true,
    cities: [
      "Ouagadougou",
      "Bobo-Dioulasso",
      "Koudougou",
      "Ouahigouya",
      "Banfora",
      "Dédougou",
      "Fada N'Gourma",
    ],
  },
  {
    code: "GN",
    name: "Guinée",
    dialCode: "+224",
    flag: "🇬🇳",
    currency: "GNF",
    phonePlaceholder: "6X XX XX XX",
    citiesExample: "Conakry, Kankan, Kindia...",
    active: true,
    cities: [
      "Conakry",
      "Kankan",
      "Nzérékoré",
      "Kindia",
      "Labé",
      "Mamou",
      "Boké",
      "Guéckédou",
    ],
  },
  {
    code: "KM",
    name: "Comores",
    dialCode: "+269",
    flag: "🇰🇲",
    currency: "KMF",
    phonePlaceholder: "3XX XX XX",
    citiesExample: "Moroni, Mutsamudu...",
    active: true,
    cities: [
      "Moroni",
      "Mutsamudu",
      "Fomboni",
      "Domoni",
      "Mirontsi",
      "Sima",
    ],
  },
  {
    code: "CF",
    name: "Centrafrique",
    dialCode: "+236",
    flag: "🇨🇫",
    currency: "XAF",
    phonePlaceholder: "7X XX XX XX",
    citiesExample: "Bangui, Bimbo...",
    active: true,
    cities: [
      "Bangui",
      "Bimbo",
      "Berbérati",
      "Carnot",
      "Bambari",
      "Bouar",
      "Bossangoa",
    ],
  },
  {
    code: "FR",
    name: "France",
    dialCode: "+33",
    flag: "🇫🇷",
    currency: "EUR",
    phonePlaceholder: "6 XX XX XX XX",
    citiesExample: "Paris, Lyon, Marseille...",
    active: true,
    cities: [
      "Paris",
      "Lyon",
      "Marseille",
      "Toulouse",
      "Nice",
      "Nantes",
      "Strasbourg",
      "Montpellier",
      "Bordeaux",
      "Lille",
      "Rennes",
    ],
  },
  {
    code: "BE",
    name: "Belgique",
    dialCode: "+32",
    flag: "🇧🇪",
    currency: "EUR",
    phonePlaceholder: "4XX XX XX XX",
    citiesExample: "Bruxelles, Liège, Namur...",
    active: true,
    cities: [
      "Bruxelles",
      "Liège",
      "Namur",
      "Charleroi",
      "Mons",
      "Anvers",
      "Gand",
    ],
  },
  {
    code: "CA",
    name: "Canada",
    dialCode: "+1",
    flag: "🇨🇦",
    currency: "CAD",
    phonePlaceholder: "XXX XXX-XXXX",
    citiesExample: "Montréal, Québec, Ottawa...",
    active: true,
    cities: [
      "Montréal",
      "Québec",
      "Ottawa",
      "Toronto",
      "Gatineau",
      "Laval",
      "Sherbrooke",
    ],
  },
  {
    code: "OTHER",
    name: "Autre pays",
    dialCode: "",
    flag: "🌍",
    phonePlaceholder: "Numéro de téléphone",
    citiesExample: "Votre ville...",
    active: true,
    cities: [],
  },
];

const STORAGE_KEY = "c4s_configured_countries";
const EVENT_NAME = "c4s:countries_updated";

/**
 * Récupère la liste des pays (depuis localStorage si paramétrés par le super admin, sinon INITIAL_COUNTRIES)
 */
export function getConfiguredCountries(): Country[] {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load configured countries from localStorage", e);
  }
  return INITIAL_COUNTRIES;
}

/**
 * Enregistre les pays paramétrés par le super admin
 */
export function saveConfiguredCountries(countries: Country[]): void {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(countries));
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: countries }));
    }
  } catch (e) {
    console.error("Failed to save configured countries to localStorage", e);
  }
}

/**
 * Rétablit la liste par défaut des pays
 */
export function resetConfiguredCountries(): Country[] {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
      window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: INITIAL_COUNTRIES }));
    }
  } catch (e) {
    console.error("Failed to reset configured countries", e);
  }
  return INITIAL_COUNTRIES;
}

/**
 * Hook React pour écouter en direct les modifications de pays faites dans le backoffice
 */
export function useCountries(onlyActive = true): Country[] {
  const [list, setList] = useState<Country[]>(() => getConfiguredCountries());

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<Country[]>;
      if (custom.detail) {
        setList(custom.detail);
      } else {
        setList(getConfiguredCountries());
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return onlyActive ? list.filter((c) => c.active !== false) : list;
}

// Variable rétrocompatible exportée
export const COUNTRIES: Country[] = getConfiguredCountries();

export const DEFAULT_COUNTRY = INITIAL_COUNTRIES[0]; // Cameroun

/**
 * Recherche flexible d'un pays par nom, code ISO ou indicatif
 */
export function findCountry(query?: string | null): Country | undefined {
  if (!query) return undefined;
  const list = getConfiguredCountries();
  const clean = query.trim().toLowerCase();
  return list.find(
    (c) =>
      c.name.toLowerCase() === clean ||
      c.code.toLowerCase() === clean ||
      (c.dialCode && c.dialCode.toLowerCase() === clean)
  );
}

/**
 * Extrait l'indicatif téléphonique d'un pays ou renvoie +237 par défaut
 */
export function getCountryDialCode(query?: string | null, fallback = "+237"): string {
  const match = findCountry(query);
  return match?.dialCode || fallback;
}

/**
 * Renvoie toutes les villes de tous les pays actifs configurés
 */
export function getAllActiveCities(): string[] {
  const countries = getConfiguredCountries().filter((c) => c.active !== false);
  const citySet = new Set<string>();
  for (const c of countries) {
    if (Array.isArray(c.cities)) {
      for (const city of c.cities) {
        if (city && city.trim()) citySet.add(city.trim());
      }
    }
  }
  return Array.from(citySet);
}

/**
 * Retrouve le pays associé à une ville donnée (recherche insensible à la casse)
 */
export function findCountryForCity(cityName?: string | null): Country | undefined {
  if (!cityName || !cityName.trim()) return undefined;
  const clean = cityName.trim().toLowerCase();
  const countries = getConfiguredCountries().filter((c) => c.active !== false);
  return countries.find((c) =>
    Array.isArray(c.cities) && c.cities.some((city) => city.toLowerCase() === clean)
  );
}

/**
 * Renvoie la liste des villes associées à un pays donné.
 * Si aucun pays n'est fourni ou trouvé, renvoie toutes les villes actives comme fallback.
 */
export function getCitiesForCountry(countryNameOrCode?: string | null): string[] {
  if (!countryNameOrCode || !countryNameOrCode.trim()) {
    return getAllActiveCities();
  }
  const country = findCountry(countryNameOrCode);
  if (country?.cities && country.cities.length > 0) {
    return country.cities;
  }
  return getAllActiveCities();
}

