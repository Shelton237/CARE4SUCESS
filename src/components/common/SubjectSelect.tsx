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
import { SUBJECT_CATEGORIES, ALL_SUBJECTS } from "@/data/education";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export interface SubjectSelectProps {
  value?: string;
  onValueChange: (subject: string) => void;
  placeholder?: string;
  groupByCategory?: boolean;
  availableSubjects?: string[];
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function SubjectSelect({
  value,
  onValueChange,
  placeholder = "Sélectionnez une matière...",
  groupByCategory = true,
  availableSubjects,
  className,
  disabled = false,
  id,
}: SubjectSelectProps) {
  const subjectsList = React.useMemo(() => {
    if (availableSubjects && availableSubjects.length > 0) {
      return availableSubjects;
    }
    return ALL_SUBJECTS;
  }, [availableSubjects]);

  const categories = React.useMemo(() => {
    if (!availableSubjects || availableSubjects.length === 0) {
      return SUBJECT_CATEGORIES;
    }
    return SUBJECT_CATEGORIES.map((cat) => ({
      ...cat,
      subjects: cat.subjects.filter((s) => subjectsList.includes(s)),
    })).filter((cat) => cat.subjects.length > 0);
  }, [availableSubjects, subjectsList]);

  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger id={id} className={cn("w-full bg-white", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {groupByCategory && categories.length > 0 ? (
          categories.map((cat) => (
            <SelectGroup key={cat.id}>
              <SelectLabel className="text-xs font-bold text-[#1A6CC8] tracking-wider uppercase bg-slate-50/70 px-2 py-1">
                {cat.label}
              </SelectLabel>
              {cat.subjects.map((sub) => (
                <SelectItem key={sub} value={sub} className="cursor-pointer pl-4">
                  {sub}
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        ) : (
          subjectsList.map((sub) => (
            <SelectItem key={sub} value={sub} className="cursor-pointer">
              {sub}
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  );
}

export interface SubjectBadgePickerProps {
  selectedSubjects: string[];
  onChange: (subjects: string[]) => void;
  availableSubjects?: string[];
  className?: string;
  max?: number;
  loading?: boolean;
}

/**
 * Sélecteur multi-matières interactif sous forme de badges cliquables
 * Limité uniquement aux matières proposées par les enseignants disponibles
 */
export function SubjectBadgePicker({
  selectedSubjects = [],
  onChange,
  availableSubjects,
  className,
  max,
  loading = false,
}: SubjectBadgePickerProps) {
  const toggleSubject = (sub: string) => {
    if (selectedSubjects.includes(sub)) {
      onChange(selectedSubjects.filter((s) => s !== sub));
    } else {
      if (max && selectedSubjects.length >= max) return;
      onChange([...selectedSubjects, sub]);
    }
  };

  const displayedSubjects = React.useMemo(() => {
    if (availableSubjects && availableSubjects.length > 0) {
      // Garantit que les matières déjà sélectionnées restent visibles
      const set = new Set([...availableSubjects, ...selectedSubjects]);
      return Array.from(set);
    }
    return ALL_SUBJECTS;
  }, [availableSubjects, selectedSubjects]);

  if (loading) {
    return (
      <div className={cn("flex flex-wrap gap-2 animate-pulse", className)}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-7 w-24 bg-slate-100 rounded-full border border-slate-200" />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayedSubjects.map((sub) => {
        const isSelected = selectedSubjects.includes(sub);
        return (
          <button
            key={sub}
            type="button"
            onClick={() => toggleSubject(sub)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border",
              isSelected
                ? "bg-[#1A6CC8] text-white border-[#1A6CC8] shadow-sm scale-105"
                : "bg-white text-slate-700 border-slate-200 hover:border-[#1A6CC8]/50 hover:bg-slate-50"
            )}
          >
            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
            <span>{sub}</span>
          </button>
        );
      })}
    </div>
  );
}

export default SubjectSelect;
