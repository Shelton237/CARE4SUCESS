import * as React from "react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { getCitiesForCountry, findCountry, findCountryForCity } from "@/data/countries";
import { CountryFlag } from "./CountryFlag";
import { MapPin, Check, X, ChevronDown, Loader2, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Nominatim (OpenStreetMap) — GRATUIT, sans clé API ──────────────────────
// Usage policy : 1 req/sec max, User-Agent obligatoire
// Docs : https://nominatim.openstreetmap.org/ui/search.html

interface NominatimResult {
  place_id: number;
  display_name: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    country?: string;
    country_code?: string;
  };
  lat: string;
  lon: string;
}

async function searchCitiesAPI(
  query: string,
  countryCode?: string,
  signal?: AbortSignal
): Promise<string[]> {
  if (!query || query.trim().length < 2) return [];

  const params = new URLSearchParams({
    q: query.trim(),
    format: "json",
    addressdetails: "1",
    limit: "8",
    featuretype: "city",
    dedupe: "1",
  });

  if (countryCode) {
    params.set("countrycodes", countryCode.toLowerCase());
  }

  try {
    const resp = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      {
        signal,
        headers: {
          "User-Agent": "Care4Success-App/1.0 (care4success.com)",
          "Accept-Language": "fr,en",
        },
      }
    );
    if (!resp.ok) return [];
    const data: NominatimResult[] = await resp.json();

    const cities = data
      .map((r) => {
        // Prendre city > town > village > première partie du display_name
        const name =
          r.address.city ||
          r.address.town ||
          r.address.village ||
          r.display_name.split(",")[0].trim();
        return name;
      })
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i); // dédoublonnage

    return cities;
  } catch {
    return [];
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CityAutocompleteProps {
  country?: string;
  value: string;
  onChange: (city: string) => void;
  onSelectCountry?: (countryName: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

interface CityOption {
  name: string;
  source: "local" | "api";
  countryCode?: string;
  countryName?: string;
}

// ─── Composant ───────────────────────────────────────────────────────────────

export function CityAutocomplete({
  country,
  value,
  onChange,
  onSelectCountry,
  placeholder,
  disabled = false,
  className,
  id = "city-autocomplete",
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [apiCities, setApiCities] = useState<string[]>([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const countryInfo = useMemo(() => findCountry(country), [country]);
  const localCities = useMemo(() => getCitiesForCountry(country), [country]);

  // ── Merge local + API (local en premier, API complète) ─────────────────
  const mergedOptions = useMemo((): CityOption[] => {
    const localSet = new Set(localCities.map((c) => c.toLowerCase()));

    const local: CityOption[] = localCities.map((c) => {
      const detected = countryInfo || findCountryForCity(c);
      return {
        name: c,
        source: "local",
        countryCode: detected?.code,
        countryName: detected?.name,
      };
    });

    const fromApi: CityOption[] = apiCities
      .filter((c) => !localSet.has(c.toLowerCase()))
      .map((c) => ({ name: c, source: "api" }));

    return [...local, ...fromApi];
  }, [localCities, apiCities, countryInfo]);

  // ── Filtrage par saisie ─────────────────────────────────────────────────
  const filteredOptions = useMemo((): CityOption[] => {
    if (!value || !value.trim()) {
      return mergedOptions.slice(0, 10);
    }
    const query = value
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    return mergedOptions.filter((opt) => {
      const n = opt.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return n.startsWith(query) || n.includes(query);
    });
  }, [mergedOptions, value]);

  // ── Appel API Nominatim (debounced) ─────────────────────────────────────
  const fetchCities = useCallback(
    (query: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (abortRef.current) abortRef.current.abort();

      if (!query || query.trim().length < 2) {
        setApiCities([]);
        setIsLoadingApi(false);
        return;
      }

      setIsLoadingApi(true);
      debounceRef.current = setTimeout(async () => {
        abortRef.current = new AbortController();
        const results = await searchCitiesAPI(
          query,
          countryInfo?.code,
          abortRef.current.signal
        );
        setApiCities(results);
        setIsLoadingApi(false);
      }, 500);
    },
    [countryInfo?.code]
  );

  // Relancer la recherche si le pays change alors qu'une saisie est en cours
  useEffect(() => {
    setApiCities([]);
    if (value && value.trim().length >= 2) {
      fetchCities(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryInfo?.code]);

  // ── Fermer au clic extérieur ────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Sélection d'une ville ───────────────────────────────────────────────
  const handleSelectCity = (opt: CityOption) => {
    onChange(opt.name);
    // Auto-déduire le pays si possible
    if (!country && onSelectCountry) {
      if (opt.countryName) {
        onSelectCountry(opt.countryName);
      } else {
        const matched = findCountryForCity(opt.name);
        if (matched) onSelectCountry(matched.name);
      }
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
    setApiCities([]);
  };

  // ── Navigation clavier ──────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredOptions.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelectCity(filteredOptions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const dynamicPlaceholder =
    placeholder ||
    (countryInfo?.citiesExample
      ? `Ex : ${countryInfo.citiesExample}`
      : "Ex : Douala, Abidjan, Paris...");

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Input */}
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
        <Input
          ref={inputRef}
          id={id}
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v);
            setIsOpen(true);
            setHighlightedIndex(-1);
            fetchCities(v);
          }}
          onFocus={() => { if (!disabled) setIsOpen(true); }}
          onClick={() => { if (!disabled) setIsOpen(true); }}
          onKeyDown={handleKeyDown}
          placeholder={dynamicPlaceholder}
          className="pl-9 pr-14 h-10 text-sm bg-white"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        />

        {/* Icônes à droite */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {isLoadingApi && (
            <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
          )}
          {value && !disabled && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => {
                onChange("");
                setApiCities([]);
                inputRef.current?.focus();
                setIsOpen(true);
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100 transition-colors"
              aria-label="Effacer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              if (!disabled) {
                setIsOpen((prev) => !prev);
                inputRef.current?.focus();
              }
            }}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Ouvrir la liste"
          >
            <ChevronDown
              className={cn(
                "w-3.5 h-3.5 transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </button>
        </div>
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden"
          style={{ maxHeight: "14rem" }}
        >
          {/* En-tête */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
              {countryInfo ? (
                <>
                  <CountryFlag
                    code={countryInfo.code}
                    countryName={countryInfo.name}
                    size="xs"
                  />
                  <span>{countryInfo.name}</span>
                </>
              ) : (
                <>
                  <Globe className="w-3 h-3" />
                  <span>Toutes les villes</span>
                </>
              )}
            </span>
            <span className="text-[10px] text-slate-400">
              {isLoadingApi
                ? "Recherche en cours…"
                : `${filteredOptions.length} ville${filteredOptions.length > 1 ? "s" : ""} · saisie libre`}
            </span>
          </div>

          {/* Liste */}
          <div className="overflow-y-auto" style={{ maxHeight: "10.5rem" }}>
            {filteredOptions.length === 0 && !isLoadingApi && (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                <MapPin className="w-5 h-5 mx-auto mb-1.5 opacity-40" />
                {value
                  ? `Aucune ville trouvée pour « ${value} »`
                  : "Tapez pour rechercher une ville"}
                <p className="text-xs mt-1 text-slate-300">
                  Vous pouvez aussi saisir librement.
                </p>
              </div>
            )}

            {filteredOptions.length === 0 && isLoadingApi && (
              <div className="px-4 py-6 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Recherche de villes…
              </div>
            )}

            {filteredOptions.map((opt, idx) => {
              const isSelected =
                value.trim().toLowerCase() === opt.name.toLowerCase();
              const isHighlighted = idx === highlightedIndex;

              return (
                <button
                  key={`${opt.name}-${opt.source}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelectCity(opt);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={cn(
                    "flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors",
                    isHighlighted
                      ? "bg-[#1A6CC8]/10 text-[#1A6CC8]"
                      : "text-slate-700 hover:bg-slate-50",
                    isSelected && "font-semibold text-[#1A6CC8]"
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{opt.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Badge source API */}
                    {opt.source === "api" && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-50 text-blue-400 rounded border border-blue-100">
                        OSM
                      </span>
                    )}
                    {/* Pays si pas de filtre actif */}
                    {!country && opt.countryName && (
                      <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <CountryFlag
                          code={opt.countryCode}
                          countryName={opt.countryName}
                          size="xs"
                        />
                        <span className="hidden sm:inline">{opt.countryName}</span>
                      </span>
                    )}
                    {isSelected && (
                      <Check className="w-4 h-4 text-[#1A6CC8]" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pied de page informatif */}
          <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-300 flex items-center gap-1">
            <Globe className="w-3 h-3" />
            Données géographiques : base locale + OpenStreetMap (Nominatim)
          </div>
        </div>
      )}
    </div>
  );
}

export default CityAutocomplete;
