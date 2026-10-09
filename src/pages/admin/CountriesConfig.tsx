import { useState, useMemo } from "react";
import {
  Globe,
  Plus,
  Save,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  PencilLine,
  X,
  Check,
  MapPin,
} from "lucide-react";
import {
  getConfiguredCountries,
  saveConfiguredCountries,
  resetConfiguredCountries,
  type Country,
} from "@/data/countries";
import { CountryFlag } from "@/components/common/CountryFlag";
import { useToast } from "@/hooks/use-toast";

/* ─── Petit composant : badge de ville ─── */
function CityTag({
  city,
  onRemove,
}: {
  city: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded-full">
      {city}
      <button
        type="button"
        onClick={onRemove}
        className="text-slate-400 hover:text-red-500 transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

/* ─── Panneau d'édition des villes d'un pays ─── */
function CitiesEditor({
  cities,
  onChange,
}: {
  cities: string[];
  onChange: (cities: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (!trimmed || cities.includes(trimmed)) return;
    onChange([...cities, trimmed]);
    setInput("");
  };

  const remove = (city: string) => onChange(cities.filter((c) => c !== city));

  return (
    <div className="mt-3 space-y-2">
      <p className="text-[10px] uppercase font-black text-slate-400 tracking-wide flex items-center gap-1">
        <MapPin className="w-3 h-3" /> Villes ({cities.length})
      </p>

      <div className="flex flex-wrap gap-1.5 min-h-[28px]">
        {cities.length === 0 ? (
          <span className="text-[11px] text-slate-400 italic">Aucune ville configurée</span>
        ) : (
          cities.map((city) => (
            <CityTag key={city} city={city} onRemove={() => remove(city)} />
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          placeholder="Ajouter une ville…"
          className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!input.trim()}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1A6CC8] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#155EAA] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

/* ─── Ligne d'un pays ─── */
function CountryRow({
  country,
  onChange,
  onDelete,
}: {
  country: Country;
  onChange: (c: Country) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(country.name);

  const toggle = () => onChange({ ...country, active: !country.active });

  const saveName = () => {
    if (nameInput.trim()) onChange({ ...country, name: nameInput.trim() });
    setEditingName(false);
  };

  return (
    <div
      className={`border rounded-xl transition-all ${
        country.active
          ? "border-slate-200 bg-white"
          : "border-slate-100 bg-slate-50 opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Toggle actif */}
        <button
          type="button"
          onClick={toggle}
          title={country.active ? "Désactiver" : "Activer"}
          className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
            country.active ? "bg-[#1A6CC8]" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
              country.active ? "left-4" : "left-0.5"
            }`}
          />
        </button>

        {/* Drapeau */}
        <CountryFlag code={country.code} countryName={country.name} size="md" className="flex-shrink-0" />

        {/* Nom éditable */}
        {editingName ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              autoFocus
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveName();
                if (e.key === "Escape") setEditingName(false);
              }}
              className="text-sm font-semibold border border-[#1A6CC8] rounded px-2 py-0.5 flex-1 focus:outline-none"
            />
            <button onClick={saveName} className="text-green-600 hover:text-green-700">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-[#0D2D5A] truncate">
              {country.name}
            </span>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="text-slate-300 hover:text-[#1A6CC8] transition-colors"
            >
              <PencilLine className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Infos meta */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400">
          <span className="font-mono">{country.dialCode || "—"}</span>
          <span className="font-mono">{country.code}</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded font-medium">
            {country.cities?.length ?? 0} villes
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            title="Gérer les villes"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
            title="Supprimer ce pays"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Panneau villes */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4">
          <CitiesEditor
            cities={country.cities ?? []}
            onChange={(cities) => onChange({ ...country, cities })}
          />
        </div>
      )}
    </div>
  );
}

/* ─── Modale d'ajout d'un nouveau pays ─── */
const BLANK_COUNTRY: Country = {
  code: "",
  name: "",
  dialCode: "",
  flag: "",
  currency: "",
  phonePlaceholder: "",
  active: true,
  cities: [],
};

function AddCountryModal({
  onAdd,
  onClose,
}: {
  onAdd: (c: Country) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState<Country>({ ...BLANK_COUNTRY });

  const set = (field: keyof Country, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // La validité ne requiert plus de flag emoji — le drapeau est généré depuis le code ISO
  const valid = form.code.trim().length === 2 && form.name.trim();

  const submit = () => {
    if (!valid) return;
    onAdd({ ...form, code: form.code.toUpperCase() });
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-black text-[#0D2D5A] text-sm uppercase tracking-wide">
            Ajouter un pays
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wide">
              Nom du pays *
            </label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="ex: Maroc"
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wide">
              Code ISO (2 lettres) * → drapeau auto
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                value={form.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().slice(0, 2))}
                placeholder="MA"
                maxLength={2}
                className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8] font-mono"
              />
              {/* Prévisualisation du drapeau en temps réel */}
              <div className="w-10 h-8 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg">
                {form.code.trim().length === 2 ? (
                  <CountryFlag code={form.code} size="md" />
                ) : (
                  <span className="text-slate-300 text-xs">--</span>
                )}
              </div>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wide">
              Indicatif tél.
            </label>
            <input
              value={form.dialCode}
              onChange={(e) => set("dialCode", e.target.value)}
              placeholder="+212"
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8] font-mono"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-slate-400 tracking-wide">
              Devise (3 lettres)
            </label>
            <input
              value={form.currency ?? ""}
              onChange={(e) => set("currency", e.target.value.toUpperCase().slice(0, 3))}
              placeholder="MAD"
              maxLength={3}
              className="mt-1 w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8] font-mono"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded-lg border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!valid}
            className="flex-1 px-4 py-2 rounded-lg bg-[#0D2D5A] text-white text-sm font-bold hover:bg-[#0a2248] transition-colors disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page principale ─── */
export default function CountriesConfig() {
  const { toast } = useToast();
  const [countries, setCountries] = useState<Country[]>(() => getConfiguredCountries());
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const edit = (updated: Country) => {
    setCountries((prev) => prev.map((c) => (c.code === updated.code ? updated : c)));
    setIsDirty(true);
  };

  const remove = (code: string) => {
    setCountries((prev) => prev.filter((c) => c.code !== code));
    setIsDirty(true);
  };

  const addCountry = (c: Country) => {
    setCountries((prev) => [...prev, c]);
    setShowAddModal(false);
    setIsDirty(true);
  };

  const save = () => {
    saveConfiguredCountries(countries);
    setIsDirty(false);
    toast({
      title: "Configuration sauvegardée",
      description: "Les pays et villes sont maintenant actifs sur toute la plateforme.",
    });
  };

  const reset = () => {
    const defaults = resetConfiguredCountries();
    setCountries(defaults);
    setIsDirty(false);
    toast({
      title: "Configuration réinitialisée",
      description: "Les pays par défaut ont été rétablis.",
    });
  };

  const activeCount = useMemo(
    () => countries.filter((c) => c.active !== false).length,
    [countries]
  );

  const filtered = useMemo(() => {
    let list = showInactive ? countries : countries.filter((c) => c.active !== false);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.dialCode.includes(q)
      );
    }
    return list;
  }, [countries, search, showInactive]);

  return (
    <div className="p-4 md:p-8 space-y-6 w-full">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-[#0D2D5A] flex items-center gap-2">
            <Globe className="w-5 h-5 text-[#1A6CC8]" />
            Gestion des Pays
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {activeCount} pays actifs · {countries.length} au total
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Réinitialiser
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1A6CC8] text-[#1A6CC8] text-xs font-bold hover:bg-blue-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un pays
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!isDirty}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D2D5A] text-white text-xs font-bold hover:bg-[#0a2248] transition-colors disabled:opacity-40"
          >
            <Save className="w-3.5 h-3.5" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* Barre de filtre */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pays…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/30 focus:border-[#1A6CC8]"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="accent-[#1A6CC8]"
          />
          Afficher les inactifs
        </label>
      </div>

      {/* Bandeau modifications non sauvegardées */}
      {isDirty && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-700">
          <Save className="w-3.5 h-3.5" />
          Modifications non enregistrées — cliquez sur "Enregistrer" pour les appliquer.
        </div>
      )}

      {/* Liste des pays */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-slate-400">
            Aucun pays trouvé.
          </div>
        )}
        {filtered.map((country) => (
          <CountryRow
            key={country.code}
            country={country}
            onChange={edit}
            onDelete={() => remove(country.code)}
          />
        ))}
      </div>

      {/* Info pédagogique */}
      <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-800 space-y-1.5">
        <p className="font-black uppercase tracking-wide flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Comment fonctionne ce paramétrage ?
        </p>
        <ul className="list-disc list-inside space-y-1 text-blue-700">
          <li>Les pays <strong>actifs</strong> apparaissent dans les formulaires d'inscription et d'évaluation.</li>
          <li>Les <strong>villes</strong> de chaque pays alimentent l'autocomplétion dans les formulaires.</li>
          <li>Cliquez sur la <strong>flèche ▼</strong> d'un pays pour gérer ses villes.</li>
          <li>Cliquez sur <strong>Enregistrer</strong> pour que les changements soient actifs immédiatement.</li>
          <li>La <strong>réinitialisation</strong> rétablit la liste de pays par défaut.</li>
        </ul>
      </section>

      {/* Modale d'ajout */}
      {showAddModal && (
        <AddCountryModal onAdd={addCountry} onClose={() => setShowAddModal(false)} />
      )}
    </div>
  );
}
