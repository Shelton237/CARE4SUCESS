import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, CirclePlay, MapPin, GraduationCap, ChartColumn, ShieldCheck, Heart,
  Globe, Briefcase, Clock, ClipboardList, Users, UserCog, TrendingUp, Search, Scale,
  CalendarDays, Laptop, BadgeCheck, type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";

/* ─── IMAGES ─────────────────────────────────────
   Les photos vivent dans public/images/home/. Le hero est fourni ; les trois
   photos des cartes "univers" sont facultatives : tant qu'un fichier est absent,
   la carte affiche une icône décorative à la place. */
const HOME_IMAGES = {
  hero: "/images/home/hero-coach.png",
  soutien: "/images/home/card-soutien.jpg",
  langues: "/images/home/card-langues.jpg",
  competences: "/images/home/card-competences.jpg",
};

const HANDWRITING = { fontFamily: "Caveat, cursive" };
const SERIF = { fontFamily: "'Playfair Display', serif" };

/* ─── PETITS COMPOSANTS ──────────────────────── */

function FlagCM() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 rounded-full shrink-0" aria-hidden>
      <rect width="8" height="24" fill="#007A5E" />
      <rect x="8" width="8" height="24" fill="#CE1126" />
      <rect x="16" width="8" height="24" fill="#FCD116" />
      <path d="M12 8.5l1 2.6h2.8l-2.2 1.7.9 2.7-2.5-1.7-2.5 1.7.9-2.7-2.2-1.7H11z" fill="#FCD116" />
    </svg>
  );
}

function FlagMG() {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6 rounded-full shrink-0" aria-hidden>
      <rect width="24" height="24" fill="#fff" />
      <rect x="8" width="16" height="12" fill="#FC3D32" />
      <rect x="8" y="12" width="16" height="12" fill="#007E3A" />
    </svg>
  );
}

/** Trait de soulignement manuscrit (or) sous les textes en écriture. */
function HandUnderline({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 12" className={className} aria-hidden>
      <path d="M2 9 C 30 2, 80 2, 118 5" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

interface UniverseCard {
  key: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  border: string;
  chip: string;
  title: string;
  desc: string;
  tags: string[];
  photo: string;
  footer: ReactNode;
  cta: ReactNode;
}

const CARD_BTN = "inline-flex items-center justify-center gap-2 min-h-11 py-2.5 px-5 rounded-xl text-sm font-bold transition-colors";

const UNIVERSES: UniverseCard[] = [
  {
    key: "soutien",
    icon: GraduationCap,
    color: "#0F9B8E",
    bg: "from-[#DDF4F0] via-[#EEF9F7] to-white",
    border: "border-[#CDEBE6]",
    chip: "bg-white/70 border-[#CDEBE6] text-[#0B7F74]",
    title: "Soutien scolaire",
    desc: "Nous trouvons le coach adapté pour votre enfant. Évaluation, matching, suivi et facturation transparente.",
    tags: ["Primaire", "Collège", "Lycée", "Examens"],
    photo: HOME_IMAGES.soutien,
    footer: (
      <p className="flex items-center gap-2 text-sm text-gray-600">
        <MapPin className="w-4 h-4 text-[#0F9B8E]" /> Disponible à Madagascar
      </p>
    ),
    cta: (
      <NavLink to={ROUTE_PATHS.EVALUATION_GRATUITE} className={`${CARD_BTN} bg-[#0F9B8E] text-white hover:bg-[#0c857a]`}>
        Faire évaluer mon enfant <ArrowRight className="w-4 h-4" />
      </NavLink>
    ),
  },
  {
    key: "langues",
    icon: Globe,
    color: "#F5A623",
    bg: "from-[#FFF0CF] via-[#FFF8E8] to-white",
    border: "border-[#FBE7BA]",
    chip: "bg-white/70 border-[#FBE7BA] text-[#C9880F]",
    title: "Langues",
    desc: "Choisissez votre coach, comparez les prix, réservez et commencez aujourd'hui.",
    tags: ["Anglais", "Français", "Espagnol", "+5 langues"],
    photo: HOME_IMAGES.langues,
    footer: (
      <p className="flex items-center gap-3 text-sm text-gray-700">
        <span className="flex items-center gap-2"><FlagCM /> Cameroun</span>
        <span className="text-gray-300">|</span>
        <span className="flex items-center gap-2"><FlagMG /> Madagascar</span>
      </p>
    ),
    cta: (
      <NavLink to={ROUTE_PATHS.COURS_DE_LANGUES} className={`${CARD_BTN} bg-[#F5A623] text-white hover:bg-[#e09520]`}>
        Trouver un coach de langue <ArrowRight className="w-4 h-4" />
      </NavLink>
    ),
  },
  {
    key: "competences",
    icon: Briefcase,
    color: "#E2574C",
    bg: "from-[#FCE1DE] via-[#FEEFED] to-white",
    border: "border-[#F6D2CE]",
    chip: "bg-white/70 border-[#F6D2CE] text-[#D2453A]",
    title: "Compétences et carrière",
    desc: "Développez une compétence avec un expert capable de vous accompagner vers un objectif concret.",
    tags: ["Bureautique", "Data", "Communication", "+"],
    photo: HOME_IMAGES.competences,
    footer: null,
    cta: (
      <span className={`${CARD_BTN} bg-[#FBE0DD] border border-[#F3C4BF] text-[#D2453A] cursor-default`}>
        <Clock className="w-4 h-4" /> Bientôt disponible
      </span>
    ),
  },
];

function UniverseCardView({ card }: { card: UniverseCard }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${card.bg} ${card.border} p-6 md:p-7 min-h-[300px] flex flex-col`}>
      {/* Photo à droite, fondue vers la couleur de la carte. Icône décorative si le fichier est absent. */}
      <card.icon className="absolute right-6 top-6 w-28 h-28 opacity-[0.07]" style={{ color: card.color }} aria-hidden />
      <img
        src={card.photo}
        alt=""
        onError={(e) => { e.currentTarget.style.display = "none"; }}
        className="absolute right-0 top-0 h-[62%] w-[52%] object-cover object-top [mask-image:linear-gradient(to_right,transparent,black_40%),linear-gradient(to_bottom,black_70%,transparent)] [mask-composite:intersect]"
      />

      <div className="relative z-10 flex flex-col flex-1">
        <span className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ backgroundColor: card.color }}>
          <card.icon className="w-7 h-7 text-white" />
        </span>
        <h3 className="text-xl font-extrabold text-[#0D2D5A] mb-2.5">{card.title}</h3>
        <p className="text-[13px] leading-relaxed text-gray-700 mb-4 max-w-[92%]">{card.desc}</p>
        <div className="flex flex-wrap gap-2 mb-5">
          {card.tags.map(tag => (
            <span key={tag} className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${card.chip}`}>{tag}</span>
          ))}
        </div>
        <div className="mt-auto">
          <div className="mb-3.5">{card.cta}</div>
          {card.footer}
        </div>
      </div>
    </div>
  );
}

interface ApproachStep { icon: LucideIcon; label: string }

function ApproachPanel({
  tone, icon: Icon, title, subtitle, steps, cta,
}: {
  tone: "teal" | "amber";
  icon: LucideIcon;
  title: ReactNode;
  subtitle: string;
  steps: ApproachStep[];
  cta: ReactNode;
}) {
  const teal = tone === "teal";
  const accent = teal ? "#0F9B8E" : "#F5A623";
  return (
    <div className={`rounded-2xl border p-5 md:p-6 bg-gradient-to-br ${teal ? "from-[#E3F6F3] to-[#F4FBFA] border-[#CDEBE6]" : "from-[#FFF3D9] to-[#FFFBF1] border-[#FBE7BA]"}`}>
      <div className="flex items-center gap-4 mb-5">
        {teal ? (
          <Icon className="w-11 h-11 shrink-0" style={{ color: accent }} strokeWidth={1.6} />
        ) : (
          <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
            <Icon className="w-7 h-7 text-white" />
          </span>
        )}
        <div>
          <p className="text-[17px] text-[#0D2D5A] leading-snug">{title}</p>
          <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white/90 rounded-xl px-4 py-5 mb-5 grid grid-cols-2 gap-y-5 sm:flex sm:items-start sm:justify-between">
        {steps.map((step, i) => (
          <div key={step.label} className="contents sm:flex sm:items-start">
            <div className="flex flex-col items-center text-center gap-2 sm:w-[92px]">
              <step.icon className="w-7 h-7" style={{ color: accent }} strokeWidth={1.7} />
              <span className="text-xs text-gray-700 leading-snug">{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden sm:block w-4 h-4 mt-3 shrink-0" style={{ color: accent }} />
            )}
          </div>
        ))}
      </div>
      {cta}
    </div>
  );
}

const WHY = [
  { icon: BadgeCheck, title: "Coachs sélectionnés", desc: "Compétences, expérience et pédagogie vérifiées.", round: true },
  { icon: ChartColumn, title: "Accompagnement adapté", desc: "Une solution pour chaque objectif et chaque niveau.", round: false },
  { icon: Users, title: "Progression suivie", desc: "Cours, objectifs et résultats depuis votre espace.", round: false },
  { icon: ShieldCheck, title: "Paiements simples et sécurisés", desc: "Mobile Money et carte bancaire selon votre pays.", round: false },
];

const TRUST = [
  { icon: GraduationCap, label: "Coachs sélectionnés", color: "#2BB3A3" },
  { icon: ChartColumn, label: "Suivi de progression", color: "#2BB3A3" },
  { icon: ShieldCheck, label: "Paiement sécurisé", color: "#2BB3A3" },
  { icon: Heart, label: "Zéro frais d'inscription", color: "#F5A623" },
];

/* ─── PAGE ───────────────────────────────────── */
export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7FAFC]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#0D2D5A]">
        <div className="hidden md:block absolute top-0 right-0 w-[58%] h-[90%]">
          <img src={HOME_IMAGES.hero} alt="" className="w-full h-full object-cover object-right-top" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D2D5A] via-[#0D2D5A]/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0D2D5A] to-transparent" />
        </div>

        <div className="container mx-auto px-6 relative z-10 pt-11 md:pt-12 pb-5">
          <div className="max-w-xl">
            <h1
              className="font-bold text-white leading-[1.02] text-[clamp(2.6rem,4.4vw,3.95rem)]"
              style={SERIF}
            >
              Every genius<br />
              needs <span className="italic text-[#F5A623]">a coach</span>
            </h1>
            <p className="text-white/90 text-lg md:text-[22px] leading-snug mt-5">
              Soutien scolaire. Langues. Compétences.<br />
              Un coach pour chaque objectif.
            </p>

            <div className="flex flex-wrap gap-4 mt-6">
              <NavLink
                to={ROUTE_PATHS.PROFESSEURS}
                id="hero-cta-primary"
                className="inline-flex items-center gap-2 h-14 px-8 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-extrabold hover:bg-[#e09520] transition-colors"
              >
                Trouver mon coach <ArrowRight className="w-4 h-4" />
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.COMMENT_CA_MARCHE}
                className="inline-flex items-center gap-2.5 h-14 px-7 rounded-xl border border-white/35 bg-[#0D2D5A]/40 text-white font-bold hover:bg-white/10 transition-colors"
              >
                <CirclePlay className="w-5 h-5" strokeWidth={1.6} /> Voir comment ça marche
              </NavLink>
            </div>

            <p className="flex items-center gap-2 text-sm text-blue-100/80 mt-4">
              <MapPin className="w-4 h-4 text-[#2BB3A3]" /> Disponible au Cameroun et à Madagascar
            </p>
          </div>

          {/* Mobile : la photo passe sous les boutons, en bloc net */}
          <div className="md:hidden relative -mx-6 mt-6 h-56">
            <img src={HOME_IMAGES.hero} alt="" className="w-full h-full object-cover object-right-top" />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#0D2D5A] to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#0D2D5A] to-transparent" />
          </div>

          <ul className="flex flex-wrap gap-x-10 gap-y-3 mt-7">
            {TRUST.map(item => (
              <li key={item.label} className="flex items-center gap-2.5 text-sm text-white/90">
                <item.icon className="w-7 h-7" style={{ color: item.color }} strokeWidth={1.8} />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ NOS UNIVERS ══════════ */}
      <section className="pt-10 md:pt-10 pb-6 md:pb-8">
        <div className="container mx-auto px-6">
          <div className="flex items-start justify-between gap-6 mb-6">
            <div>
              <p className="text-[#0F9B8E] text-xs font-bold uppercase tracking-[0.2em] mb-2">Nos univers</p>
              <h2 className="text-3xl md:text-[40px] font-bold text-[#0D2D5A] leading-tight" style={SERIF}>
                Quel est votre objectif&nbsp;?
              </h2>
              <p className="text-gray-500 mt-1.5">Chaque parcours est unique. Choisissez le vôtre.</p>
            </div>
            <div className="hidden md:block text-right shrink-0 -rotate-6 mt-2 mr-2">
              <p className="text-[30px] leading-[1.05] text-[#0D2D5A] font-medium" style={HANDWRITING}>
                Un coach<br />pour chaque objectif
              </p>
              <HandUnderline className="w-28 h-3 ml-auto mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
            {UNIVERSES.map(card => <UniverseCardView key={card.key} card={card} />)}
          </div>
        </div>
      </section>

      {/* ══════════ DEUX APPROCHES ══════════ */}
      <section className="py-6 md:py-8">
        <div className="container mx-auto px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-[34px] font-bold text-[#0D2D5A] leading-tight" style={SERIF}>
              Deux approches, un même objectif : votre réussite
            </h2>
            <p className="text-gray-500 mt-2">Selon votre besoin, nous vous accompagnons différemment.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
            <ApproachPanel
              tone="teal"
              icon={GraduationCap}
              title={<><b className="font-extrabold">Soutien scolaire</b> – un service managé (Madagascar)</>}
              subtitle="Vous nous confiez votre besoin, nous nous occupons du reste."
              steps={[
                { icon: ClipboardList, label: "Évaluation du besoin" },
                { icon: Users, label: "Matching Care4Success" },
                { icon: UserCog, label: "Coach assigné" },
                { icon: TrendingUp, label: "Suivi et bilan régulier" },
              ]}
              cta={
                <NavLink to={ROUTE_PATHS.SERVICES} className={`${CARD_BTN} bg-[#0F9B8E] text-white hover:bg-[#0c857a]`}>
                  En savoir plus sur le soutien scolaire <ArrowRight className="w-4 h-4" />
                </NavLink>
              }
            />
            <ApproachPanel
              tone="amber"
              icon={Globe}
              title={<><b className="font-extrabold">Langues</b> – une <b className="font-extrabold">marketplace</b> (Cameroun + Madagascar)</>}
              subtitle="Vous gardez le choix de votre coach."
              steps={[
                { icon: Search, label: "Recherche de coachs" },
                { icon: Scale, label: "Comparaison des tarifs" },
                { icon: CalendarDays, label: "Réservation du cours" },
                { icon: Laptop, label: "Cours en ligne" },
              ]}
              cta={
                <NavLink to={ROUTE_PATHS.COURS_DE_LANGUES} className={`${CARD_BTN} bg-[#F5A623] text-[#0D2D5A] hover:bg-[#e09520]`}>
                  Découvrir les cours de langues <ArrowRight className="w-4 h-4" />
                </NavLink>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI CHOISIR ══════════ */}
      <section className="pt-8 md:pt-8 pb-10 md:pb-11">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-[32px] font-bold text-[#0D2D5A] text-center mb-7" style={SERIF}>
            Pourquoi choisir Care4Success&nbsp;?
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-7 lg:gap-x-0 lg:divide-x lg:divide-[#0D2D5A]/10">
            {WHY.map(item => (
              <div key={item.title} className="flex items-start gap-4 lg:px-6 first:lg:pl-0 last:lg:pr-0">
                <span
                  className={`w-14 h-14 flex items-center justify-center shrink-0 ${
                    item.round ? "rounded-full bg-[#0F9B8E]" : "rounded-2xl bg-white border border-[#0D2D5A]/5 shadow-sm"
                  }`}
                >
                  <item.icon className={`w-7 h-7 ${item.round ? "text-white" : "text-[#F5A623]"}`} strokeWidth={item.round ? 1.8 : 2} />
                </span>
                <div>
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] leading-snug">{item.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 bg-[#0B2545] overflow-hidden">
        <div className="absolute -bottom-16 -left-10 w-64 h-64 rounded-full bg-white/[0.06] pointer-events-none" />
        <div className="absolute top-8 left-8 w-28 h-28 rounded-full bg-[#0F9B8E]/15 pointer-events-none" />
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-[#1A6CC8]/10 pointer-events-none" />
        <div className="absolute -bottom-20 -right-4 w-56 h-56 rounded-full bg-[#F5A623]/10 pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-10">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-[38px] font-bold text-white leading-tight" style={SERIF}>
                Prêt à <span className="text-[#F5A623]">atteindre votre objectif</span>&nbsp;?
              </h2>
              <p className="text-blue-100/85 mt-3">
                Scolaire, langues ou compétences, Care4Success vous accompagne vers le bon coach.
              </p>
              <div className="flex flex-wrap gap-4 mt-7">
                <NavLink
                  to={ROUTE_PATHS.PROFESSEURS}
                  className="inline-flex items-center gap-2 h-12 px-7 rounded-xl bg-[#F5A623] text-[#0D2D5A] font-extrabold hover:bg-[#e09520] transition-colors"
                >
                  Trouver mon coach <ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to="/inscription"
                  className="inline-flex items-center h-12 px-7 rounded-xl border border-white/40 text-white font-bold hover:bg-white/10 transition-colors"
                >
                  Créer un compte gratuitement
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[8deg] shrink-0">
              <p className="text-[32px] leading-[1.1] text-white font-medium" style={HANDWRITING}>
                Investir aujourd'hui<br />dans votre potentiel
              </p>
              <HandUnderline className="w-28 h-3 mt-1 ml-6" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
