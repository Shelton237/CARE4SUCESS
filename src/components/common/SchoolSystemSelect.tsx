import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSchoolSystemsForCountry, SchoolSystem } from "@/data/education";
import { cn } from "@/lib/utils";

export interface SchoolSystemSelectProps {
  value?: string;
  onValueChange: (value: string, system?: SchoolSystem) => void;
  placeholder?: string;
  country?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function SchoolSystemSelect({
  value,
  onValueChange,
  placeholder = "Sélectionnez un système scolaire...",
  country,
  className,
  disabled = false,
  id,
}: SchoolSystemSelectProps) {
  const systems = React.useMemo(() => getSchoolSystemsForCountry(country), [country]);
  const current = systems.find((s) => s.value === value);

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        const sys = systems.find((s) => s.value === val);
        onValueChange(val, sys);
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} className={cn("w-full bg-white", className)}>
        <SelectValue placeholder={placeholder}>
          {current ? current.label : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-80">
        {systems.map((system) => (
          <SelectItem key={system.value} value={system.value} className="cursor-pointer">
            <div className="flex flex-col py-0.5 text-left">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">{system.label}</span>
                {system.badge && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    {system.badge}
                  </span>
                )}
              </div>
              {system.description && (
                <span className="text-xs text-muted-foreground mt-0.5 whitespace-normal">
                  {system.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SchoolSystemSelect;
