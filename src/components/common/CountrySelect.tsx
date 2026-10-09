import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountries, Country, findCountry } from "@/data/countries";
import { CountryFlag } from "./CountryFlag";
import { cn } from "@/lib/utils";

export interface CountrySelectProps {
  value?: string;
  onValueChange?: (countryName: string, country: Country) => void;
  placeholder?: string;
  showFlag?: boolean;
  showDialCode?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function CountrySelect({
  value,
  onValueChange,
  placeholder = "Choisissez un pays...",
  showFlag = true,
  showDialCode = false,
  className,
  disabled = false,
  id,
}: CountrySelectProps) {
  const countries = useCountries(true);
  const selectedCountry = findCountry(value);

  const handleSelect = (selectedName: string) => {
    const matched = findCountry(selectedName) || {
      code: "OTHER",
      name: selectedName,
      dialCode: "",
      flag: "🌍",
    };
    onValueChange?.(selectedName, matched);
  };

  return (
    <Select
      value={selectedCountry?.name || value || ""}
      onValueChange={handleSelect}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full bg-white", className)}>
        <SelectValue placeholder={placeholder}>
          {selectedCountry ? (
            <span className="flex items-center gap-2 truncate">
              {showFlag && (
                <CountryFlag
                  code={selectedCountry.code}
                  countryName={selectedCountry.name}
                  size="sm"
                />
              )}
              <span className="truncate">{selectedCountry.name}</span>
              {showDialCode && selectedCountry.dialCode && (
                <span className="text-xs text-muted-foreground ml-auto">
                  ({selectedCountry.dialCode})
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {countries.map((c) => (
          <SelectItem key={c.code} value={c.name} className="cursor-pointer">
            <div className="flex items-center gap-2.5 w-full">
              {showFlag && (
                <CountryFlag
                  code={c.code}
                  countryName={c.name}
                  size="sm"
                />
              )}
              <span className="font-medium text-foreground">{c.name}</span>
              {c.dialCode && (
                <span className="text-xs text-muted-foreground font-mono ml-auto">
                  {c.dialCode}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default CountrySelect;
