import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, CirclePlay, GraduationCap, ChartColumn, ShieldCheck, Heart,
  Globe, Briefcase, Clock, ClipboardList, Users, UserCog, TrendingUp, Search, Scale,
  CalendarDays, Laptop, BadgeCheck, type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, UsersFilled, ShieldFilled, HandUnderline, type FilledIcon } from "@/components/decor";

/* ─── IMAGES ─────────────────────────────────────
   Les photos vivent dans public/images/home/. Elles sont découpées dans la
   maquette (zones sans texte) : remplacer les fichiers par les originaux pour
   une meilleure définition, en gardant les mêmes noms. Les tailles ci-dessous
   (px à 1440 de large) sont celles de la maquette. */
const HOME_IMAGES = {
  hero: "/images/home/hero-coach.png",
  soutien: { src: "/images/home/card-soutien.png", w: 111, h: 294 },
  langues: { src: "/images/home/card-langues.png", w: 141, h: 204 },
  competences: { src: "/images/home/card-competences.png", w: 103, h: 204 },
};

/* Les valeurs préfixées xl: sont calibrées sur la maquette à 1440 px de large ;
   en dessous, la mise en page reste fluide. */
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const SERIF = { fontFamily: "'Playfair Display', serif" };
const WRAP = "mx-auto w-full max-w-[1334px] px-6 min-[1400px]:px-0";

/* ─── PETITS COMPOSANTS ──────────────────────── */

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
  photo: { src: string; w: number; h: number };
  footer: ReactNode;
  cta: ReactNode;
}

const CARD_BTN = "inline-flex items-center justify-center gap-2 min-h-11 py-2.5 px-5 rounded-xl text-sm font-bold transition-colors xl:h-[46px] xl:min-h-0 xl:py-0 xl:px-7 xl:text-[16.4px] xl:rounded-[12px]";

const UNIVERSES: UniverseCard[] = [
  {
    key: "soutien",
    icon: GraduationCap,
    color: "#0F9B8E",
    bg: "from-[#DFF5F1] via-[#EDF9F7] to-[#FAFDFC]",
    border: "border-[#CDEBE6]",
    chip: "bg-[#0F9B8E]/12 text-[#0B7F74]",
    title: "Soutien scolaire",
    desc: "Nous trouvons le coach adapté pour votre enfant. Évaluation, matching, suivi et facturation transparente.",
    tags: ["Primaire", "Collège", "Lycée", "Examens"],
    photo: HOME_IMAGES.soutien,
    footer: null,
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
    bg: "from-[#FFF1D1] via-[#FFF8E8] to-[#FFFDF8]",
    border: "border-[#FBE7BA]",
    chip: "bg-[#F5A623]/16 text-[#C9880F]",
    title: "Langues",
    desc: "Choisissez votre coach, comparez les prix, réservez et commencez aujourd'hui.",
    tags: ["Anglais", "Français", "Espagnol", "+5 langues"],
    photo: HOME_IMAGES.langues,
    footer: null,
    cta: (
      <NavLink to={ROUTE_PATHS.COACHS_LANGUES} className={`${CARD_BTN} bg-[#F5A623] text-white hover:bg-[#e09520]`}>
        Trouver un coach de langue <ArrowRight className="w-4 h-4" />
      </NavLink>
    ),
  },
  {
    key: "competences",
    icon: Briefcase,
    color: "#E2574C",
    bg: "from-[#FCE2DF] via-[#FEEFED] to-[#FFF8F7]",
    border: "border-[#F6D2CE]",
    chip: "bg-[#E2574C]/12 text-[#D2453A]",
    title: "Compétences et carrière",
    desc: "Développez une compétence avec un expert capable de vous accompagner vers un objectif concret.",
    tags: ["Bureautique", "Data", "Communication", "+"],
    photo: HOME_IMAGES.competences,
    footer: null,
    cta: (
      <span className={`${CARD_BTN} bg-[#FBE0DD] border border-[#F3C4BF] text-[#D2453A] cursor-default xl:h-[50px] xl:text-[15.5px]`}>
        <Clock className="w-4 h-4 xl:w-5 xl:h-5" /> Bientôt disponible
      </span>
    ),
  },
];

function UniverseCardView({ card }: { card: UniverseCard }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl xl:rounded-[22px] border bg-gradient-to-r ${card.bg} ${card.border} p-6 md:p-7 xl:pt-[16px] xl:px-[22px] xl:pb-[22px] min-h-[300px] xl:h-[354px] flex flex-col`}>
      {/* Photo à droite, fondue vers la couleur de la carte. Icône décorative si le fichier est absent. */}
      <card.icon className="absolute right-6 top-6 w-28 h-28 opacity-[0.05] xl:hidden" style={{ color: card.color }} aria-hidden />
      {/* Deux masques imbriqués : fondu vers le bas (div) puis vers la gauche (img) */}
      <div
        className="hidden xl:block absolute -right-px -top-px"
        style={{
          width: card.photo.w,
          height: card.photo.h,
          WebkitMaskImage: "linear-gradient(to bottom, #000 70%, transparent 100%)",
          maskImage: "linear-gradient(to bottom, #000 70%, transparent 100%)",
        }}
      >
        <img
          src={card.photo.src}
          alt=""
          onError={(e) => { e.currentTarget.style.display = "none"; }}
          className="block w-full h-full"
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 26%)",
            maskImage: "linear-gradient(to right, transparent 0%, #000 26%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        <span
          className="w-14 h-14 xl:w-[66px] xl:h-[66px] rounded-2xl xl:rounded-[18px] flex items-center justify-center mb-5 xl:mb-[15px]"
          style={{ backgroundColor: card.color }}
        >
          <card.icon className="w-7 h-7 xl:w-[31px] xl:h-[31px] text-white" />
        </span>
        <h3 className="text-xl xl:text-[23.6px] font-extrabold text-[#0D2D5A] mb-2.5 xl:mb-[8px] leading-tight">{card.title}</h3>
        <p className="text-[13px] xl:text-[13.7px] leading-relaxed xl:leading-[19px] text-gray-700 xl:text-[#2A3550] mb-4 xl:mb-5 max-w-[92%] xl:max-w-[306px] xl:min-h-[57px]">{card.desc}</p>
        <div className="flex flex-wrap gap-2 xl:gap-[9px] mb-5 xl:mb-3">
          {card.tags.map(tag => (
            <span key={tag} className={`text-xs xl:text-[12.4px] font-semibold px-3 xl:px-[14px] py-1.5 xl:py-[7px] rounded-full ${card.chip}`}>{tag}</span>
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

interface ApproachStep { icon: LucideIcon; label: string[] }

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
    <div className={`rounded-2xl xl:rounded-[18px] border p-5 md:p-6 xl:pt-[22px] xl:px-[27px] xl:pb-[21px] xl:h-[271px] bg-gradient-to-br ${teal ? "from-[#DFF5F1] to-[#F3FAF9] border-[#CDEBE6]" : "from-[#FFF1D3] to-[#FFFAEE] border-[#FBE7BA]"}`}>
      <div className={`flex items-center gap-4 xl:gap-[25px] mb-5 xl:mb-[16px] ${teal ? "xl:pl-[11px]" : ""}`}>
        {teal ? (
          <Icon className="w-11 h-11 xl:w-12 xl:h-12 shrink-0" style={{ color: accent }} strokeWidth={1.6} />
        ) : (
          <span className="w-12 h-12 xl:w-[53px] xl:h-[53px] rounded-xl xl:rounded-[14px] flex items-center justify-center shrink-0" style={{ backgroundColor: accent }}>
            <Icon className="w-7 h-7 xl:w-8 xl:h-8 text-white" />
          </span>
        )}
        <div>
          <p className="text-[17px] xl:text-[18px] text-[#0D2D5A] leading-snug">{title}</p>
          <p className="text-sm xl:text-[15.6px] text-gray-600 xl:text-[#3E4C66] mt-0.5 xl:mt-[3px]">{subtitle}</p>
        </div>
      </div>

      <div className="bg-white/90 rounded-xl xl:rounded-[14px] px-4 py-5 xl:py-0 xl:h-[107px] xl:px-[4px] mb-5 xl:mb-[13px] grid grid-cols-2 gap-y-5 sm:flex sm:items-center sm:justify-between">
        {steps.map((step, i) => (
          <div key={step.label.join(" ")} className="contents sm:flex sm:items-center">
            <div className="flex flex-col items-center text-center gap-2 xl:gap-[6px] sm:w-[92px] xl:w-[110px]">
              <step.icon className="w-7 h-7 xl:w-9 xl:h-9" style={{ color: accent }} strokeWidth={1.9} />
              <span className="text-xs xl:text-[15px] text-gray-700 xl:text-[#1E2B4A] xl:font-medium leading-snug xl:leading-[19px]">
                {step.label.map((line, k) => <span key={k} className="block">{line}</span>)}
              </span>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight className="hidden sm:block w-4 h-4 xl:w-[17px] xl:h-[17px] shrink-0" style={{ color: accent }} strokeWidth={2.8} />
            )}
          </div>
        ))}
      </div>
      {cta}
    </div>
  );
}

const WHY: { icon: LucideIcon | FilledIcon; title: string; desc: string; round: boolean }[] = [
  { icon: BadgeCheck, title: "Coachs sélectionnés", desc: "Compétences, expérience et pédagogie vérifiées.", round: true },
  { icon: BarsFilled, title: "Accompagnement adapté", desc: "Une solution pour chaque objectif et chaque niveau.", round: false },
  { icon: UsersFilled, title: "Progression suivie", desc: "Cours, objectifs et résultats depuis votre espace.", round: false },
  { icon: ShieldFilled, title: "Paiements simples et sécurisés", desc: "Mobile Money et carte bancaire selon votre pays.", round: false },
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
      <section className="relative overflow-hidden bg-[#07284B] xl:h-[448px]">
        {/* Photo à droite (positions de la maquette, en % de la largeur) */}
        <div className="hidden md:block absolute top-0 left-[42.97%] w-[57.03%]">
          <img src={HOME_IMAGES.hero} alt="" className="w-full h-auto block" />
          <span className="hero-sheen" aria-hidden />
          <div className="absolute inset-0 bg-gradient-to-r from-[#07284B] via-[#07284B]/10 to-transparent" />
          <div className="absolute inset-x-0 -bottom-px h-20 bg-gradient-to-t from-[#07284B] via-[#07284B]/80 to-transparent" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.05%] xl:pr-0 relative z-10 pt-11 md:pt-12 pb-5 xl:pt-[48px] xl:pb-0">
          <div className="max-w-xl xl:max-w-none">
            <h1
              className="font-bold text-white leading-[1.02] text-[clamp(2.6rem,4.4vw,3.95rem)] xl:text-[69.5px] xl:leading-[60px]"
              style={SERIF}
            >
              Every genius<br />
              needs <span className="italic text-gold-shimmer xl:text-[1.145em]">a coach</span>
            </h1>
            <div className="text-white/90 text-lg md:text-[22px] xl:text-[23.8px] leading-snug xl:leading-[28px] mt-6 xl:mt-[30px] space-y-2 xl:space-y-[8px]">
              <p>Soutien scolaire. Langues. Compétences.</p>
              <p><em className="italic">Un coach pour chaque objectif.</em></p>
            </div>

            <div className="flex flex-wrap gap-4 xl:gap-[18px] mt-8 xl:mt-[34px]">
              <NavLink
                to={ROUTE_PATHS.PROFESSEURS}
                id="hero-cta-primary"
                className="inline-flex items-center gap-2 h-14 px-8 xl:px-[33px] rounded-xl xl:rounded-[13px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[17px] hover:bg-[#e09520] transition-colors"
              >
                Trouver mon coach <ArrowRight className="w-4 h-4" />
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.COMMENT_CA_MARCHE}
                className="inline-flex items-center gap-2.5 h-14 px-7 xl:px-[30px] rounded-xl xl:rounded-[13px] border border-white/40 bg-[#07284B]/40 text-white font-bold xl:font-semibold xl:text-[15px] hover:bg-white/10 transition-colors"
              >
                <CirclePlay className="w-5 h-5 xl:w-[26px] xl:h-[26px]" strokeWidth={1.5} /> Voir comment ça marche
              </NavLink>
            </div>

            {/* Mobile : la photo passe sous les boutons, en bloc net */}
            <div className="md:hidden relative -mx-6 mt-8 h-56">
              <img src={HOME_IMAGES.hero} alt="" className="w-full h-full object-cover object-right-top" />
              <span className="hero-sheen" aria-hidden />
              <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#07284B] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#07284B] to-transparent" />
            </div>

            <ul className="flex flex-wrap gap-x-10 xl:gap-x-[58px] gap-y-3 mt-8 xl:mt-[40px]">
              {TRUST.map(item => (
                <li key={item.label} className="flex items-center gap-2.5 text-sm xl:text-[14.3px] text-white/90">
                  <item.icon className="w-7 h-7 xl:w-8 xl:h-8" style={{ color: item.color }} strokeWidth={1.8} />
                  {item.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ══════════ NOS UNIVERS ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <div className="relative xl:pl-[17px] mb-6 xl:mb-3">
            <p className="text-[#0F9B8E] text-xs xl:text-[12.8px] font-bold uppercase tracking-[0.2em] mb-2 xl:mb-[11px]">Nos univers</p>
            <h2 className="text-3xl md:text-[40px] xl:text-[46.7px] font-bold text-[#0D2D5A] leading-tight xl:leading-[1.1]" style={SERIF}>
              Quel est votre objectif&nbsp;?
            </h2>
            <p className="text-gray-500 mt-1.5 xl:mt-1">Chaque parcours est unique. Choisissez le vôtre.</p>

            <div className="hidden md:block absolute right-0 top-0 xl:-top-[11px] text-right -rotate-[10deg] origin-right">
              <p className="text-[27px] xl:text-[28.4px] leading-[1.05] text-[#0D2D5A] font-medium" style={HANDWRITING}>
                Un coach<br />pour chaque objectif
              </p>
              <HandUnderline className="w-20 xl:w-[73px] h-3 ml-auto mt-0.5" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 xl:[grid-template-columns:313fr_303fr_299fr] xl:gap-x-[23.5px]">
            {UNIVERSES.map(card => <UniverseCardView key={card.key} card={card} />)}
          </div>
        </div>
      </section>

      {/* ══════════ DEUX APPROCHES ══════════ */}
      <section className="py-10 md:py-12">
        <div className={`${WRAP} xl:max-w-[1326px]`}>
          <div className="text-center mb-6 xl:mb-3.5">
            <h2 className="text-2xl md:text-[34px] xl:text-[32.2px] font-bold text-[#0D2D5A] leading-tight xl:leading-[1.2]" style={SERIF}>
              Deux approches, un même objectif&nbsp;: votre réussite
            </h2>
            <p className="text-gray-500 mt-2 xl:mt-1 xl:text-[20px] xl:leading-7">Selon votre besoin, nous vous accompagnons différemment.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 xl:gap-[21px]">
            <ApproachPanel
              tone="teal"
              icon={GraduationCap}
              title={<><b className="font-extrabold">Soutien scolaire</b> – un service managé (Madagascar)</>}
              subtitle="Vous nous confiez votre besoin, nous nous occupons du reste."
              steps={[
                { icon: ClipboardList, label: ["Évaluation", "du besoin"] },
                { icon: Users, label: ["Matching", "Care4Success"] },
                { icon: UserCog, label: ["Coach", "assigné"] },
                { icon: TrendingUp, label: ["Suivi et bilan", "régulier"] },
              ]}
              cta={
                <NavLink to={ROUTE_PATHS.SERVICES} className={`${CARD_BTN} xl:h-[44px] xl:px-[27px] xl:text-[13.2px] bg-[#0F9B8E] text-white hover:bg-[#0c857a]`}>
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
                { icon: Search, label: ["Recherche", "de coachs"] },
                { icon: Scale, label: ["Comparaison", "des tarifs"] },
                { icon: CalendarDays, label: ["Réservation", "du cours"] },
                { icon: Laptop, label: ["Cours", "en ligne"] },
              ]}
              cta={
                <NavLink to={ROUTE_PATHS.COURS_DE_LANGUES} className={`${CARD_BTN} xl:h-[44px] xl:px-[27px] xl:text-[13.2px] bg-[#F5A623] text-[#0D2D5A] hover:bg-[#e09520]`}>
                  Découvrir les cours de langues <ArrowRight className="w-4 h-4" />
                </NavLink>
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI CHOISIR ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <h2 className="text-2xl md:text-[32px] font-bold text-[#0D2D5A] text-center mb-7 xl:mb-3" style={SERIF}>
            Pourquoi choisir Care4Success&nbsp;?
          </h2>
          <div className="grid sm:grid-cols-2 xl:grid-cols-[334fr_344fr_321fr_335fr] gap-x-8 gap-y-7 xl:gap-x-0 xl:gap-y-0 xl:mt-[22px]">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 xl:gap-5 xl:h-[68px] ${i === 0 ? "xl:pl-[19px]" : "xl:pl-[10px] xl:border-l xl:border-[#0D2D5A]/10"}`}
              >
                <span
                  className={`flex items-center justify-center shrink-0 w-14 h-14 ${
                    item.round
                      ? "rounded-full bg-[#0F9B8E] xl:w-[65px] xl:h-[65px]"
                      : "rounded-2xl xl:rounded-[16px] bg-white border border-[#0D2D5A]/5 shadow-sm xl:w-[70px] xl:h-[70px]"
                  }`}
                >
                  <item.icon className={`w-7 h-7 xl:w-9 xl:h-9 ${item.round ? "text-white" : "text-[#F5A623]"}`} {...(item.round ? { strokeWidth: 1.8 } : {})} />
                </span>
                <div className="xl:pt-[8px]">
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] xl:text-[15.4px] leading-snug">{item.title}</p>
                  <p className="text-sm xl:text-[15.4px] text-gray-500 xl:text-[#5C6B80] leading-relaxed xl:leading-[22px] mt-1 xl:mt-[8px] xl:max-w-[232px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[229px] bg-[#06274A] overflow-hidden">
        <div className="absolute top-[53px] left-[31px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="absolute top-[62px] left-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="absolute -top-[60px] -right-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="absolute top-[86px] right-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[36px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-[38px] xl:text-[34.3px] font-bold text-white leading-tight xl:leading-[1.15]" style={SERIF}>
                Prêt à <span className="text-[#F5A623]">atteindre votre objectif</span>&nbsp;?
              </h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[10px] xl:text-[17px] xl:leading-[22.5px] xl:max-w-[540px]">
                Scolaire, langues ou compétences, Care4Success vous accompagne vers le bon coach.
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[15px] mt-7 xl:mt-[19px]">
                <NavLink
                  to={ROUTE_PATHS.PROFESSEURS}
                  className="inline-flex items-center gap-2 h-12 px-7 xl:px-[27px] rounded-xl xl:rounded-[11px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[16.8px] hover:bg-[#e09520] transition-colors"
                >
                  Trouver mon coach <ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to="/inscription"
                  className="inline-flex items-center h-12 px-7 xl:px-[27px] rounded-xl xl:rounded-[11px] border border-white/45 text-white font-bold xl:font-semibold xl:text-[17.6px] hover:bg-white/10 transition-colors"
                >
                  Créer un compte gratuitement
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[12deg] shrink-0 xl:mt-[29px] xl:mr-[6px]">
              <p className="text-[28px] leading-[1.1] xl:leading-[1.2] text-white font-medium" style={HANDWRITING}>
                Investir aujourd'hui<br />dans votre potentiel
              </p>
              <HandUnderline className="w-[88px] h-3 mt-1 xl:mt-[11px] ml-6 xl:ml-[60px]" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
