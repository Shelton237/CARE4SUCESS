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
  required?: boolean;
  nationalNumber?: boolean;
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
  required = false,
  nationalNumber = false,
}: PhoneCountryInputProps) {
  const countries = useCountries(true);
  const [selectedCountry, setSelectedCountry] = React.useState(DEFAULT_COUNTRY.name);
  const phoneCountry = countries
    .filter(c => c.dialCode && phone.trim().startsWith(c.dialCode))
    .sort((a, b) => b.dialCode.length - a.dialCode.length)[0];
  const currentCountry = findCountry(country) || phoneCountry || findCountry(selectedCountry) || DEFAULT_COUNTRY;

  const handleCountrySelect = (countryName: string) => {
    const nextCountry = findCountry(countryName) || DEFAULT_COUNTRY;
    setSelectedCountry(nextCountry.name);
    onCountryChange?.(countryName, nextCountry);

    // Remplace l'ancien indicatif en conservant le numéro déjà saisi.
    const prevDial = currentCountry.dialCode;
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone === prevDial) {
      onPhoneChange(nextCountry.dialCode ? `${nextCountry.dialCode} ` : "");
    } else if (prevDial && cleanPhone.startsWith(prevDial)) {
      onPhoneChange(`${nextCountry.dialCode} ${cleanPhone.slice(prevDial.length).trim()}`);
    }
  };

  const dynamicPlaceholder =
    placeholder ||
    `${nationalNumber ? "" : `${currentCountry.dialCode || "+237"} `}${currentCountry.phonePlaceholder || "6XX XXX XXX"}`;
  const displayedPhone = nationalNumber && currentCountry.dialCode && phone.trim().startsWith(currentCountry.dialCode)
    ? phone.trim().slice(currentCountry.dialCode.length).trimStart() : phone;

  return (
    <div className={cn("flex w-full min-w-0 items-center rounded-lg border border-input bg-white shadow-sm focus-within:ring-2 focus-within:ring-[#1A6CC8] overflow-hidden", className)}>
      <div className="shrink-0 border-r border-input bg-gray-50/70">
        <Select
          value={currentCountry.name}
          onValueChange={handleCountrySelect}
          disabled={disabled}
        >
          <SelectTrigger aria-label="Indicatif téléphonique" className="border-0 shadow-none bg-transparent hover:bg-gray-100/60 h-10 px-2.5 focus:ring-0 gap-1.5 rounded-none font-medium text-xs sm:text-sm">
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
        required={required}
        autoComplete="tel"
        value={displayedPhone}
        onChange={(e) => {
          const value = e.target.value;
          onPhoneChange(nationalNumber && value && !value.startsWith("+") ? `${currentCountry.dialCode} ${value}` : value);
        }}
        placeholder={dynamicPlaceholder}
        className="min-w-0 flex-1 border-0 shadow-none focus-visible:ring-0 h-10 px-3 bg-transparent rounded-none text-base md:text-sm placeholder:text-gray-400"
      />
    </div>
  );
}

export default PhoneCountryInput;
