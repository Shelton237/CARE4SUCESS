import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getEducationCyclesForSystem,
  getAllLevelsForSystem,
  EducationCycle,
} from "@/data/education";
import { cn } from "@/lib/utils";

export interface LevelSelectProps {
  value?: string;
  onValueChange: (level: string) => void;
  placeholder?: string;
  country?: string;
  schoolSystem?: string;
  availableLevels?: string[];
  groupByCycle?: boolean;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function LevelSelect({
  value,
  onValueChange,
  placeholder = "Sélectionnez une classe / niveau...",
  country,
  schoolSystem,
  availableLevels,
  groupByCycle = true,
  className,
  disabled = false,
  id,
}: LevelSelectProps) {
  const cycles = React.useMemo(() => {
    const rawCycles = getEducationCyclesForSystem(schoolSystem, country);

    // Si des niveaux spécifiques sont fournis par les enseignants actifs
    if (availableLevels && availableLevels.length > 0) {
      const hasAll = availableLevels.some((al) =>
        al.toLowerCase().includes("tous")
      );
      if (!hasAll) {
        const filtered = rawCycles
          .map((c) => ({
            ...c,
            levels: c.levels.filter(
              (lvl) =>
                lvl === value ||
                availableLevels.some(
                  (al) =>
                    al.toLowerCase().trim() === lvl.toLowerCase().trim() ||
                    lvl.toLowerCase().includes(al.toLowerCase().trim()) ||
                    al.toLowerCase().includes(lvl.toLowerCase().trim())
                )
            ),
          }))
          .filter((c) => c.levels.length > 0);

        if (filtered.length > 0) return filtered;
      }
    }
    return rawCycles;
  }, [schoolSystem, country, availableLevels, value]);

  const flatLevels = React.useMemo(() => {
    return cycles.flatMap((c) => c.levels);
  }, [cycles]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {groupByCycle ? (
          cycles.map((cycle) => (
            <SelectGroup key={cycle.id}>
              <SelectLabel className="text-xs font-bold text-[#1A6CC8] tracking-wider uppercase bg-slate-50/70 px-2 py-1">
                {cycle.label}
              </SelectLabel>
              {cycle.levels.map((lvl) => (
                <SelectItem key={lvl} value={lvl} className="cursor-pointer pl-4">
                  {lvl}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          flatLevels.map((lvl) => (
            <SelectItem key={lvl} value={lvl} className="cursor-pointer">
              {lvl}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export default LevelSelect;
