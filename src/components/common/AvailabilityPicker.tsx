import * as React from "react";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DayKey = "lun" | "mar" | "mer" | "jeu" | "ven" | "sam" | "dim";
export type SlotKey =
  | "matin"
  | "debut-apres-midi"
  | "apres-midi"
  | "soiree";

export interface AvailabilitySelection {
  [day: string]: SlotKey[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const DAYS: { key: DayKey; label: string; short: string }[] = [
  { key: "lun", label: "Lundi",    short: "Lun" },
  { key: "mar", label: "Mardi",    short: "Mar" },
  { key: "mer", label: "Mercredi", short: "Mer" },
  { key: "jeu", label: "Jeudi",    short: "Jeu" },
  { key: "ven", label: "Vendredi", short: "Ven" },
  { key: "sam", label: "Samedi",   short: "Sam" },
  { key: "dim", label: "Dimanche", short: "Dim" },
];

const SLOTS: { key: SlotKey; label: string; hours: string; color: string }[] = [
  { key: "matin",            label: "Matin",           hours: "7h – 12h",  color: "bg-amber-50 border-amber-300 text-amber-800"  },
  { key: "debut-apres-midi", label: "Début d'après-midi", hours: "12h – 15h", color: "bg-sky-50 border-sky-300 text-sky-800" },
  { key: "apres-midi",       label: "Après-midi",      hours: "15h – 18h", color: "bg-blue-50 border-blue-300 text-blue-800"   },
  { key: "soiree",           label: "Soirée",           hours: "18h – 22h", color: "bg-indigo-50 border-indigo-300 text-indigo-800" },
];

// ─── Serialisation ──────────────────────────────────────────────────────────

export function serializeAvailability(selection: AvailabilitySelection): string {
  const parts: string[] = [];
  DAYS.forEach(({ key, label }) => {
    const slots = selection[key] ?? [];
    if (slots.length === 0) return;
    const slotLabels = SLOTS
      .filter((s) => slots.includes(s.key))
      .map((s) => `${s.label} (${s.hours})`);
    parts.push(`${label} : ${slotLabels.join(", ")}`);
  });
  return parts.join(" | ");
}

export function deserializeAvailability(text: string): AvailabilitySelection {
  const sel: AvailabilitySelection = {};
  DAYS.forEach(({ key, label }) => {
    const regex = new RegExp(label + "\\s*:\\s*(.+?)(?=\\s*\\||$)", "i");
    const m = text.match(regex);
    if (!m) return;
    const part = m[1];
    SLOTS.forEach((s) => {
      if (part.includes(s.label)) {
        sel[key] = [...(sel[key] ?? []), s.key];
      }
    });
  });
  return sel;
}

// ─── Component ───────────────────────────────────────────────────────────────

export interface AvailabilityPickerProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

export function AvailabilityPicker({
  value = "",
  onChange,
  className,
}: AvailabilityPickerProps) {
  const [selection, setSelection] = React.useState<AvailabilitySelection>(
    () => (value ? deserializeAvailability(value) : {})
  );

  // Sync inbound when value changes from outside
  React.useEffect(() => {
    if (!value) setSelection({});
  }, [value]);

  const toggle = (day: DayKey, slot: SlotKey) => {
    setSelection((prev) => {
      const current = prev[day] ?? [];
      const next = current.includes(slot)
        ? current.filter((s) => s !== slot)
        : [...current, slot];
      const updated = { ...prev, [day]: next };
      onChange(serializeAvailability(updated));
      return updated;
    });
  };

  const toggleDay = (day: DayKey) => {
    setSelection((prev) => {
      const current = prev[day] ?? [];
      // If all slots are selected, deselect all; otherwise select all
      const allSelected = current.length === SLOTS.length;
      const updated = { ...prev, [day]: allSelected ? [] : SLOTS.map((s) => s.key) };
      onChange(serializeAvailability(updated));
      return updated;
    });
  };

  const toggleSlot = (slot: SlotKey) => {
    setSelection((prev) => {
      // Check if all days have this slot
      const allHave = DAYS.every((d) => (prev[d.key] ?? []).includes(slot));
      const updated: AvailabilitySelection = { ...prev };
      DAYS.forEach(({ key }) => {
        const current = updated[key] ?? [];
        if (allHave) {
          updated[key] = current.filter((s) => s !== slot);
        } else if (!current.includes(slot)) {
          updated[key] = [...current, slot];
        }
      });
      onChange(serializeAvailability(updated));
      return updated;
    });
  };

  const hasAny = DAYS.some((d) => (selection[d.key] ?? []).length > 0);

  return (
    <div className={cn("space-y-3", className)}>
      {/* ── Quick-select row ── */}
      <div className="flex flex-wrap gap-2">
        {SLOTS.map((slot) => {
          const allSelected = DAYS.every((d) =>
            (selection[d.key] ?? []).includes(slot.key)
          );
          return (
            <button
              key={slot.key}
              type="button"
              onClick={() => toggleSlot(slot.key)}
              className={cn(
                "inline-flex flex-col items-center px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all",
                allSelected
                  ? "bg-[#1A6CC8] text-white border-[#1A6CC8] shadow"
                  : "bg-white text-slate-600 border-slate-200 hover:border-[#1A6CC8]/40"
              )}
            >
              <span className="font-bold">{slot.label}</span>
              <span className="text-[10px] opacity-70 font-normal">{slot.hours}</span>
            </button>
          );
        })}
        {hasAny && (
          <button
            type="button"
            onClick={() => {
              setSelection({});
              onChange("");
            }}
            className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-200 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 transition-all"
          >
            Réinitialiser
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="overflow-x-auto -mx-1 px-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              {/* top-left empty corner */}
              <th className="w-10" />
              {SLOTS.map((slot) => (
                <th key={slot.key} className="pb-2 text-center font-semibold text-slate-600 text-xs px-1">
                  <div className="flex flex-col items-center">
                    <span>{slot.label}</span>
                    <span className="text-[10px] font-normal text-slate-400">{slot.hours}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(({ key, label, short }) => {
              const daySlots = selection[key] ?? [];
              const allDay = daySlots.length === SLOTS.length;
              return (
                <tr key={key} className="group">
                  {/* Day label — click to toggle all slots for that day */}
                  <td className="pr-2 py-1">
                    <button
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={cn(
                        "flex items-center gap-1 text-xs font-bold rounded-md px-2 py-1 w-full transition-all",
                        allDay
                          ? "bg-[#0D2D5A] text-white"
                          : daySlots.length > 0
                          ? "bg-[#1A6CC8]/10 text-[#0D2D5A]"
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{short}</span>
                    </button>
                  </td>

                  {/* Slot cells */}
                  {SLOTS.map((slot) => {
                    const isSelected = daySlots.includes(slot.key);
                    return (
                      <td key={slot.key} className="px-1 py-1 text-center">
                        <button
                          type="button"
                          onClick={() => toggle(key, slot.key)}
                          aria-pressed={isSelected}
                          className={cn(
                            "w-full min-w-[52px] h-9 rounded-lg border flex items-center justify-center transition-all focus:outline-none",
                            isSelected
                              ? "bg-[#1A6CC8] border-[#1A6CC8] text-white shadow-sm scale-105"
                              : "bg-white border-slate-200 text-slate-300 hover:border-[#1A6CC8]/50 hover:bg-slate-50 group-hover:border-slate-300"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Summary ── */}
      {hasAny && (
        <div className="rounded-lg bg-[#0D2D5A]/5 border border-[#0D2D5A]/10 px-3 py-2 text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-[#0D2D5A] mr-1">Votre sélection :</span>
          {DAYS
            .filter((d) => (selection[d.key] ?? []).length > 0)
            .map(({ key, label }) => {
              const slotLabels = SLOTS
                .filter((s) => (selection[key] ?? []).includes(s.key))
                .map((s) => `${s.label} (${s.hours})`);
              return (
                <span key={key} className="inline-block mr-2">
                  <span className="font-semibold text-[#1A6CC8]">{label}</span>
                  {" : "}
                  {slotLabels.join(", ")}
                  {" · "}
                </span>
              );
            })}
        </div>
      )}
    </div>
  );
}

export default AvailabilityPicker;
