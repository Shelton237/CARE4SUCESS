import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as Slider from "@radix-ui/react-slider";
import { NavLink, useSearchParams } from "react-router-dom";
import { ArrowRight, Award, BarChart3, CalendarDays, CheckCircle2, ChevronDown, Filter, Globe, GraduationCap, Headphones, Heart, LayoutGrid, List, Loader2, MapPin, MessageSquare, Search, ShieldCheck, Star, UserRound, UsersRound } from "lucide-react";
import { fetchPublicTeachers, type PublicTeacher } from "@/api/public";
import { formatMoney } from "@/lib/money";
import { blankDirectoryFilters, coachCategoryMatches, coachFormats, coachTopics, DIRECTORY_LANGUAGES, DIRECTORY_SKILLS, filterDirectoryCoaches, hourlyCoachRate, type DirectoryCategory, type DirectoryFilters } from "@/lib/coachDirectory";
import { useSEO } from "@/hooks/useSEO";
import "./CoursDeLangues.css";

const POPULAR = ["Anglais", "Français", "Espagnol", "Allemand", ...DIRECTORY_SKILLS.slice(0, 6)];
const BENEFITS = [
  { icon: GraduationCap, text: "Des coachs qualifiés et vérifiés" },
  { icon: UserRound, text: "Des cours adaptés à vos objectifs" },
  { icon: CalendarDays, text: "Une grande flexibilité\n(en ligne ou en présentiel)" },
  { icon: BarChart3, text: "Des tarifs transparents" },
  { icon: MessageSquare, text: "Un accompagnement personnalisé" },
];
const FAVORITES_KEY = "care4success:favorite-coaches";
const toggleValue = (values: string[], value: string) => values.includes(value) ? values.filter(v => v !== value) : [...values, value];

export default function CoursDeLangues() {
  useSEO({ title: "Coachs de langues et compétences professionnelles", description: "Comparez les coachs Care4Success, leurs spécialités, leurs formats de cours et leurs tarifs. Trouvez votre coach de langues ou de compétences professionnelles.", canonicalPath: "/cours-de-langues/coachs" });
  const [params, setParams] = useSearchParams();
  const category: DirectoryCategory = params.get("categorie") === "competences" ? "competences" : "langues";
  const initialFilters = () => ({ ...blankDirectoryFilters(), subjects: params.get("langue") ? [params.get("langue")!] : [] });
  const [draft, setDraft] = useState<DirectoryFilters>(initialFilters);
  const [applied, setApplied] = useState<DirectoryFilters>(initialFilters);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [sort, setSort] = useState("pertinence");
  const [view, setView] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showSubjects, setShowSubjects] = useState(false);
  const [favorites, setFavorites] = useState<string[]>(() => {
    try { const value: unknown = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]"); return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []; } catch { return []; }
  });
  const { data: teachers = [], isLoading, isError, refetch } = useQuery({ queryKey: ["public-teachers"], queryFn: fetchPublicTeachers });
  const categoryTeachers = useMemo(() => teachers.filter(t => coachCategoryMatches(t, category)), [teachers, category]);
  const locations = useMemo(() => [...new Set(categoryTeachers.map(t => [t.city, t.country].filter(Boolean).join(", ")).filter(Boolean))].sort(), [categoryTeachers]);
  const levels = useMemo(() => [...new Set(categoryTeachers.map(t => t.level).filter(Boolean))].sort(), [categoryTeachers]);
  const subjects = category === "langues" ? DIRECTORY_LANGUAGES : DIRECTORY_SKILLS;
  const filtered = useMemo(() => {
    const list = filterDirectoryCoaches(teachers, category, query, activeLocation, applied);
    if (sort === "note") list.sort((a, b) => b.rating - a.rating);
    // Les prix de devises ou de types de facturation différents ne sont pas comparés entre eux.
    if (sort.startsWith("prix")) list.sort((a, b) => a.currency.localeCompare(b.currency) || a.rateType.localeCompare(b.rateType) || (sort === "prix-asc" ? 1 : -1) * ((hourlyCoachRate(a) ?? a.rate) - (hourlyCoachRate(b) ?? b.rate)));
    return list;
  }, [teachers, category, query, activeLocation, applied, sort]);
  const changeCategory = (next: DirectoryCategory) => {
    setParams(next === "competences" ? { categorie: next } : {}, { replace: true });
    setDraft(blankDirectoryFilters()); setApplied(blankDirectoryFilters()); setSearch(""); setQuery(""); setLocation(""); setActiveLocation(""); setShowSubjects(false);
  };
  const reset = () => { setDraft(blankDirectoryFilters()); setApplied(blankDirectoryFilters()); setSearch(""); setQuery(""); setLocation(""); setActiveLocation(""); setParams(category === "competences" ? { categorie: category } : {}, { replace: true }); };
  const favorite = (id: string) => { const next = toggleValue(favorites, id); setFavorites(next); try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); } catch { /* Le bouton reste utilisable si le stockage est indisponible. */ } };
  const check = (key: "subjects" | "formats" | "levels", value: string) => setDraft(previous => ({ ...previous, [key]: toggleValue(previous[key], value) }));

  return <div className="coach-directory">
    <section className="directory-hero">
      <img className="directory-hero-photo" src="/images/langues/hero-coachs.png" alt="Une apprenante suit un cours en ligne avec son coach" fetchPriority="high" />
      <div className="directory-hero-shade" />
      <div className="directory-container directory-hero-content">
        <h1>Trouvez un coach pour<br /><em>apprendre et évoluer.</em></h1>
        <p>Des coachs et formateurs qualifiés pour les langues et les compétences<br className="directory-desktop-break" /> professionnelles. Apprenez à votre rythme, en ligne ou en présentiel.</p>
        <div className="directory-hero-benefits">{[{ icon: ShieldCheck, text: "Coachs vérifiés" }, { icon: UsersRound, text: "Cours personnalisés" }, { icon: CalendarDays, text: "Horaires flexibles" }, { icon: BarChart3, text: "Apprentissage à votre rythme" }].map(({ icon: Icon, text }) => <span key={text}><Icon aria-hidden="true" />{text}</span>)}</div>
        <p className="directory-handwriting">Apprenez<br />auprès d’experts<br />passionnés<span /></p>
      </div>
    </section>
    <div className="directory-container">
      <div className="directory-search-row">
        <form className="directory-search" onSubmit={event => { event.preventDefault(); setQuery(search.trim()); setActiveLocation(location); }}>
          <label className="directory-search-topic"><Search aria-hidden="true" /><span><span>Quelle compétence ou langue voulez-vous apprendre ?</span><input aria-label="Compétence, langue ou nom du coach" value={search} onChange={event => setSearch(event.target.value)} placeholder="Ex : Anglais, Espagnol, Excel, Développement web, Comptabilité…" /></span><ChevronDown aria-hidden="true" /></label>
          <label className="directory-search-location"><MapPin aria-hidden="true" /><span><span>Votre localisation</span><select aria-label="Votre localisation" value={location} onChange={event => setLocation(event.target.value)}><option value="">Toutes les localisations</option>{locations.map(value => <option key={value}>{value}</option>)}</select></span></label>
          <button className="directory-button directory-button-gold" type="submit">Rechercher <ArrowRight size={17} /></button>
        </form>
        <div className="directory-categories">{[{ key: "langues" as const, icon: Globe, label: "Langues" }, { key: "competences" as const, icon: BarChart3, label: "Compétences professionnelles" }].map(({ key, icon: Icon, label }) => <button key={key} className={category === key ? "active" : ""} onClick={() => changeCategory(key)} aria-pressed={category === key}><Icon /><span>{label}</span></button>)}</div>
      </div>
      <div className="directory-popular"><strong>Recherches populaires :</strong>{POPULAR.map(topic => <button key={topic} onClick={() => { const next = DIRECTORY_LANGUAGES.includes(topic) ? "langues" : "competences"; changeCategory(next); setSearch(topic); setQuery(topic); }}>{topic}</button>)}</div>
      <div className="directory-columns">
        <aside className={`directory-filters directory-panel ${showFilters ? "is-open" : ""}`} aria-label="Filtres des coachs">
          <div className="directory-filter-heading"><h2>Filtres</h2><button onClick={reset}>Réinitialiser</button></div>
          <fieldset><legend>Catégorie</legend>{[{ key: "langues" as const, label: "Langues" }, { key: "competences" as const, label: "Compétences professionnelles" }].map(item => <label key={item.key}><input type="radio" name="directory-category" checked={category === item.key} onChange={() => changeCategory(item.key)} />{item.label}</label>)}</fieldset>
          <fieldset><legend>{category === "langues" ? "Langue" : "Compétence"}</legend>{(showSubjects ? subjects : subjects.slice(0, 5)).map(subject => <label key={subject}><input type="checkbox" checked={draft.subjects.includes(subject)} onChange={() => check("subjects", subject)} />{subject} ({categoryTeachers.filter(t => coachTopics(t).includes(subject)).length})</label>)}<button className="directory-more" onClick={() => setShowSubjects(!showSubjects)}>{showSubjects ? "Voir moins" : "Voir plus"} <ChevronDown size={12} /></button></fieldset>
          <fieldset><legend>Type de coaching</legend>{[{ key: "online", label: "En ligne" }, { key: "onsite", label: "En présentiel" }, { key: "both", label: "Les deux" }].map(item => <label key={item.key}><input type="checkbox" checked={draft.formats.includes(item.key)} onChange={() => check("formats", item.key)} />{item.label}</label>)}</fieldset>
          <fieldset><legend>Niveau</legend>{levels.length ? levels.map(level => <label key={level}><input type="checkbox" checked={draft.levels.includes(level)} onChange={() => check("levels", level)} />{level}</label>) : <p className="directory-muted">Les niveaux seront affichés avec les profils disponibles.</p>}</fieldset>
          <fieldset className="directory-prices"><legend>Tarif par heure <select aria-label="Devise du filtre de tarif" value={draft.currency} onChange={event => setDraft({ ...draft, currency: event.target.value })}>{[...new Set(["XAF", ...categoryTeachers.map(t => t.currency)])].map(currency => <option key={currency} value={currency}>{currency === "XAF" ? "FCFA" : currency}</option>)}</select></legend><Slider.Root className="directory-price-slider" min={0} max={200000} step={1000} value={[draft.min, draft.max]} onValueChange={([min, max]) => setDraft({ ...draft, min, max })}><Slider.Track className="directory-price-track"><Slider.Range className="directory-price-selected" /></Slider.Track><Slider.Thumb className="directory-price-thumb" aria-label="Curseur du tarif minimum" /><Slider.Thumb className="directory-price-thumb" aria-label="Curseur du tarif maximum" /></Slider.Root><div><input type="number" aria-label="Tarif horaire minimum" min="0" max={draft.max} value={draft.min} onChange={event => setDraft({ ...draft, min: Math.max(0, Math.min(draft.max, Number(event.target.value))) })} /><span>–</span><input type="number" aria-label="Tarif horaire maximum précis" min={draft.min} max="200000" value={draft.max} onChange={event => setDraft({ ...draft, max: Math.max(draft.min, Math.min(200000, Number(event.target.value))) })} /></div></fieldset>
          <button className="directory-button directory-button-blue" onClick={() => { setApplied({ ...draft }); setShowFilters(false); }}><Filter size={14} />Appliquer les filtres</button>
        </aside>
        <section className="directory-results" aria-label="Résultats de recherche">
          <div className="directory-results-toolbar"><p aria-live="polite"><strong>{isLoading ? "…" : filtered.length}</strong> coach{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}</p><div><button className="directory-mobile-filters" onClick={() => setShowFilters(!showFilters)} aria-expanded={showFilters}><Filter size={15} />Filtres</button><select aria-label="Trier les coachs" value={sort} onChange={event => setSort(event.target.value)}><option value="pertinence">Trier par : Pertinence</option><option value="note">Meilleure note</option><option value="prix-asc">Prix croissant (par devise)</option><option value="prix-desc">Prix décroissant (par devise)</option></select><div className="directory-view-switch"><button className={view === "grid" ? "active" : ""} aria-label="Affichage en grille" aria-pressed={view === "grid"} onClick={() => setView("grid")}><LayoutGrid size={16} /></button><button className={view === "list" ? "active" : ""} aria-label="Affichage en liste" aria-pressed={view === "list"} onClick={() => setView("list")}><List size={16} /></button></div></div></div>
          {isLoading ? <div className="directory-empty" role="status"><Loader2 className="animate-spin" /><p>Chargement des coachs…</p></div> : isError ? <div className="directory-empty" role="alert"><h2>Impossible de charger les coachs</h2><button className="directory-button directory-button-blue" onClick={() => refetch()}>Réessayer</button></div> : !filtered.length ? <div className="directory-empty"><Search /><h2>Aucun coach ne correspond à votre recherche.</h2><p>Essayez une autre langue ou élargissez vos filtres.</p><button className="directory-button directory-button-blue" onClick={reset}>Réinitialiser la recherche</button></div> : <div className={`directory-coach-grid ${view === "list" ? "is-list" : ""}`}>{filtered.map(teacher => <CoachCard key={teacher.id} teacher={teacher} favorite={favorites.includes(teacher.id)} onFavorite={() => favorite(teacher.id)} category={category} />)}</div>}
        </section>
        <aside className="directory-advice" aria-label="Pourquoi choisir Care4Success">
          <div className="directory-panel directory-benefits"><h2>Pourquoi choisir<br />Care4Success ?</h2><div className="directory-gold-line" />{BENEFITS.map(({ icon: Icon, text }) => <div key={text}><span><Icon /></span><p>{text}</p></div>)}</div>
          <div className="directory-panel directory-promise"><span className="directory-promise-icon"><ShieldCheck /></span><div><p>Apprenez avec confiance, avec un coach adapté à votre rythme et à vos objectifs.</p><strong>Care4Success, à vos côtés</strong><div className="directory-stars">{Array.from({ length: 5 }, (_, i) => <Star key={i} size={14} fill="currentColor" />)}</div></div></div>
          <div className="directory-help"><span><Headphones /></span><div><h2>Besoin d’aide pour trouver<br />le bon coach ?</h2><p>Notre équipe est là pour vous conseiller selon vos objectifs.</p><NavLink className="directory-button directory-button-outline" to="/contact">Nous contacter <ArrowRight size={17} /></NavLink></div></div>
        </aside>
      </div>
    </div>
  </div>;
}

function CoachCard({ teacher, favorite, onFavorite, category }: { teacher: PublicTeacher; favorite: boolean; onFavorite: () => void; category: DirectoryCategory }) {
  const [photoFailed, setPhotoFailed] = useState(false);
  const initials = teacher.name.split(" ").map(word => word[0]).join("").slice(0, 2).toUpperCase();
  const formats = coachFormats(teacher);
  const topics = coachTopics(teacher).filter(topic => topic === "Langues et compétences" || (category === "langues" ? DIRECTORY_LANGUAGES : DIRECTORY_SKILLS).includes(topic));
  const qualification = teacher.educations?.[0]?.institution || teacher.certificates?.[0]?.name;
  const tags = teacher.specialties?.length ? teacher.specialties.slice(0, 3) : topics.slice(0, 3);
  const rateUnit = teacher.rateType === "monthly" ? "mois" : teacher.rateUnitMinutes === 60 || !teacher.rateUnitMinutes ? "h" : `${teacher.rateUnitMinutes} min`;
  return <article className="directory-coach-card">
    <div className="directory-coach-photo">{teacher.avatarUrl && !photoFailed ? <img src={teacher.avatarUrl} alt={teacher.name} loading="lazy" onError={() => setPhotoFailed(true)} /> : <span className="directory-coach-initials">{initials}</span>}{(formats.online || formats.onsite) && <span className={`directory-format ${formats.online ? "online" : "onsite"}`}><CheckCircle2 size={11} />{formats.online && formats.onsite ? "Les deux" : formats.online ? "En ligne" : "En présentiel"}</span>}<button className={favorite ? "directory-favorite selected" : "directory-favorite"} aria-label={`${favorite ? "Retirer" : "Ajouter"} ${teacher.name} ${favorite ? "des" : "aux"} favoris`} aria-pressed={favorite} onClick={onFavorite}><Heart size={17} fill={favorite ? "currentColor" : "none"} /></button></div>
    <div className="directory-coach-body"><h2><NavLink to={`/professeurs/${teacher.id}`}>{teacher.name}</NavLink></h2><p className="directory-coach-subject">{topics.join(" · ")}</p><div className="directory-coach-rating"><span className="directory-stars" aria-label={`Note ${teacher.rating.toFixed(1)} sur 5`}>{Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} fill={i < Math.round(teacher.rating) ? "currentColor" : "none"} />)}</span><strong>{teacher.rating.toFixed(1)}</strong><span>({teacher.students} sessions)</span><b>{formatMoney(teacher.rate, teacher.currency)}/{rateUnit}</b></div><div className="directory-coach-details">{teacher.yearsExperience !== null && teacher.yearsExperience !== undefined && <span><ShieldCheck size={13} />{teacher.yearsExperience} an{teacher.yearsExperience > 1 ? "s" : ""} d’expérience</span>}{qualification ? <span title={qualification}><Award size={13} />{qualification}</span> : teacher.city ? <span><MapPin size={13} />{teacher.city}</span> : null}</div><div className="directory-coach-tags">{tags.map(tag => <span key={tag}>{tag}</span>)}</div><div className="directory-coach-actions"><NavLink className="directory-button directory-button-outline" to={`/professeurs/${teacher.id}`}>Voir le profil</NavLink><NavLink className="directory-button directory-button-gold" to={`/professeurs/${teacher.id}#reservation`}>Réserver un cours</NavLink></div></div>
  </article>;
}
