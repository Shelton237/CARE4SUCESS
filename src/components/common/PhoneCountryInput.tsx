import * as React from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountries, Country, findCountry, DEFAULT_COUNTRY } from "@/data/countries";
import { CountryFlag } from "./CountryFlag";
import { cn } from "@/lib/utils";

export interface PhoneCountryInputProps {
  phone: string;
  country?: string;
  onPhoneChange: (phone: string) => void;
  onCountryChange?: (countryName: string, country: Country) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  label?: string;
}

/**
 * Composant unifié Téléphone avec sélecteur d'indicatif/pays intégré.
 * Affiche le vrai drapeau du pays (image) à la place des emojis / codes texte.
 */
export function PhoneCountryInput({
  phone,
  country,
  onPhoneChange,
  onCountryChange,
  placeholder,
  disabled = false,
  className,
  id = "phone-country-input",
}: PhoneCountryInputProps) {
  const countries = useCountries(true);
  const currentCountry = findCountry(country) || DEFAULT_COUNTRY;

  const handleCountrySelect = (countryName: string) => {
    const nextCountry = findCountry(countryName) || DEFAULT_COUNTRY;
    onCountryChange?.(countryName, nextCountry);

    // Ajuste l'indicatif si le numéro était vide ou contenait seulement l'ancien indicatif
    const prevDial = currentCountry.dialCode;
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone === prevDial) {
      onPhoneChange(nextCountry.dialCode ? `${nextCountry.dialCode} ` : "");
    }
  };

  const dynamicPlaceholder =
    placeholder ||
    `${currentCountry.dialCode || "+237"} ${currentCountry.phonePlaceholder || "6XX XXX XXX"}`;

  return (
    <div className={cn("flex items-center rounded-lg border border-input bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#1A6CC8] overflow-hidden", className)}>
      <div className="border-r border-input bg-gray-50/70">
        <Select
          value={currentCountry.name}
          onValueChange={handleCountrySelect}
          disabled={disabled}
        >
          <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-gray-100/60 h-10 px-2.5 focus:ring-0 gap-1.5 rounded-none font-medium text-xs sm:text-sm">
            <SelectValue>
              <span className="flex items-center gap-1.5">
                <CountryFlag
                  code={currentCountry.code}
                  countryName={currentCountry.name}
                  size="sm"
                />
                <span className="font-mono text-slate-700">{currentCountry.dialCode}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.name} className="cursor-pointer text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <CountryFlag
                    code={c.code}
                    countryName={c.name}
                    size="sm"
                  />
                  <span className="font-medium text-slate-900">{c.name}</span>
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
      </div>

      <Input
        id={id}
        type="tel"
        disabled={disabled}
        value={phone}
        onChange={(e) => onPhoneChange(e.target.value)}
        placeholder={dynamicPlaceholder}
        className="border-0 shadow-none focus-visible:ring-0 h-10 px-3 bg-transparent rounded-none text-sm placeholder:text-gray-400"
      />
    </div>
  );
}

export default PhoneCountryInput;
