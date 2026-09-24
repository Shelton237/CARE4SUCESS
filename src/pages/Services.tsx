import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, BadgeCheck, BookOpen, CirclePlay, ClipboardCheck, ClipboardList, GraduationCap,
  School, Star, TrendingUp, UserCog, UsersRound, ShieldCheck, Heart, type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, BarsOutline, HandUnderline, ShieldFilled, UsersFilled, type FilledIcon } from "@/components/decor";

/* Photos dans public/images/soutien/ (découpées dans la maquette, texte manuscrit et
   bulle inclus dans l'image). Remplaçables par les originaux, mêmes noms de fichier. */
const IMG = {
  hero: "/images/soutien/hero-soutien.jpg",
  fille: "/images/soutien/fille.jpg",
  avatar: "/images/soutien/avatar-parent.jpg",
};

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const EYEBROW = "text-[#0F9B8E] text-xs xl:text-[14.4px] font-bold uppercase tracking-[0.16em]";
const H2 = "text-2xl md:text-[32px] xl:text-[42.6px] font-bold text-[#0D2D5A] leading-tight";
// Contenu aligné sur la maquette à 1440 px : marge gauche 5,85 %, droite 4,1 %
const WRAP = "mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[5.85%] min-[1400px]:pr-[4.1%]";

const LEVELS: { key: string; label: string; icon: LucideIcon; subjects: string[] }[] = [
  { key: "primaire", label: "Primaire", icon: GraduationCap, subjects: ["Mathématiques", "Français", "Anglais", "Sciences", "Physique-Chimie", "SVT"] },
  { key: "college", label: "Collège", icon: BookOpen, subjects: ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Histoire-Géo"] },
  { key: "lycee", label: "Lycée", icon: School, subjects: ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Philosophie", "Économie", "Informatique"] },
  { key: "examens", label: "Examens", icon: ClipboardCheck, subjects: ["Mathématiques", "Français", "Anglais", "Physique-Chimie", "SVT", "Philosophie"] },
];

const TRUST: { icon: FilledIcon | LucideIcon; label: string }[] = [
  { icon: ShieldFilled, label: "Coachs sélectionnés" },
  { icon: UsersFilled, label: "Accompagnement personnalisé" },
  { icon: BarsFilled, label: "Progression suivie" },
];

const STEPS: { n: string; title: string; desc: string[]; icon: LucideIcon | FilledIcon }[] = [
  { n: "01", title: "Évaluation du besoin", desc: ["Nous identifions les difficultés,", "objectifs et attentes."], icon: ClipboardList },
  { n: "02", title: "Matching Care4Success", desc: ["Nous recherchons le profil", "pédagogique le plus adapté."], icon: UsersRound },
  { n: "03", title: "Coach assigné", desc: ["Votre enfant commence avec", "un coach sélectionné."], icon: UserCog },
  { n: "04", title: "Suivi de la progression", desc: ["Vous suivez régulièrement", "ses progrès."], icon: BarsOutline },
];

const WHY: { icon: LucideIcon | FilledIcon; title: string; desc: string[]; round: string; color: string; fill?: boolean }[] = [
  { icon: BadgeCheck, title: "Coachs sélectionnés", desc: ["Compétences, expérience", "et pédagogie vérifiées."], round: "bg-[#099F94]", color: "text-white" },
  { icon: UsersFilled, title: "Matching personnalisé", desc: ["Le coach est choisi selon", "les besoins réels de l'enfant."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#F5A623]" },
  { icon: BarsFilled, title: "Progression suivie", desc: ["Les objectifs et progrès", "sont suivis dans le temps."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#099F94]" },
  { icon: Heart, title: "Parents informés", desc: ["Vous gardez une vision claire", "de l'accompagnement."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#E2574C]", fill: true },
];

export default function Services() {
  const [level, setLevel] = useState(LEVELS[0].key);
  const active = LEVELS.find(l => l.key === level)!;

  const scrollToApproach = () => document.getElementById("approche")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <div className="min-h-screen bg-[#F8FCFF]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#012B54] xl:h-[472px]">
        <div className="hidden md:block absolute top-0 right-0 w-[47.3%]">
          <img
            src={IMG.hero}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-auto block"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 15%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 15%)",
            }}
          />
          <span className="hero-sheen" aria-hidden style={{ WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 15%)", maskImage: "linear-gradient(to right, transparent 0%, #000 15%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#012B54] to-transparent" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.15%] relative z-10 pt-10 pb-10 xl:pt-[44px] xl:pb-0">

          <p className="text-[#2BB3A3] text-sm xl:text-[15px] font-bold uppercase tracking-[0.16em]">Soutien scolaire</p>
          <h1
            className="mt-2 xl:mt-[7px] font-bold text-white text-[clamp(2rem,4.6vw,3rem)] xl:text-[66px] leading-[1.12] xl:leading-[62px]"
            style={SERIF}
          >
            Révéler le potentiel<br />
            de <span className="italic text-gold-shimmer">chaque enfant.</span>
          </h1>
          <div className="mt-5 xl:mt-[22px] space-y-2 xl:space-y-[8px] text-white/90 text-lg xl:text-[20px] leading-snug xl:leading-[28px] max-w-[520px] xl:max-w-[700px]">
            <p>Chaque enfant apprend différemment.</p>
            <p>Nous trouvons le coach qui lui correspond et suivons sa progression.</p>
          </div>

          <div className="flex flex-wrap gap-4 xl:gap-[17px] mt-8 xl:mt-[36px]">
            <NavLink
              to={ROUTE_PATHS.EVALUATION_GRATUITE}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[55px] px-7 xl:px-[28px] rounded-xl xl:rounded-[10px] bg-[#0F9B8E] text-white font-extrabold xl:text-[18px] hover:bg-[#0c857a] transition-colors"
            >
              Faire évaluer mon enfant <ArrowRight className="w-4 h-4" />
            </NavLink>
            <button
              type="button"
              onClick={scrollToApproach}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[55px] px-7 xl:px-[28px] rounded-xl xl:rounded-[10px] border border-white/45 bg-[#012B54]/40 text-white font-semibold xl:text-[17px] hover:bg-white/10 transition-colors"
            >
              <CirclePlay className="w-5 h-5 xl:w-[26px] xl:h-[26px]" strokeWidth={1.5} /> Découvrir notre approche
            </button>
          </div>

          {/* Mobile : la photo passe sous les boutons */}
          <div className="md:hidden relative -mx-6 mt-8">
            <img src={IMG.hero} alt="" className="w-full h-auto block" />
            <span className="hero-sheen" aria-hidden />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#012B54] to-transparent" />
          </div>

          <ul className="flex flex-wrap gap-x-8 xl:gap-x-[28px] gap-y-3 mt-8 xl:mt-[40px]">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm xl:text-[15.2px] text-white/90">
                <Icon className="w-6 h-6 xl:w-[27px] xl:h-[27px] text-[#2BB3A3]" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ COMMENT POUVONS-NOUS AIDER ══════════ */}
      <section className="py-10 md:py-12">
        <div className={`${WRAP} grid lg:grid-cols-[minmax(0,1fr)_minmax(0,422px)] gap-8 lg:gap-[30px] items-start`}>
          <div>
            <p className={EYEBROW}>Un accompagnement adapté</p>
            <h2 className={`${H2} mt-2 xl:mt-[6px]`} style={SERIF}>Comment pouvons-nous aider votre enfant&nbsp;?</h2>
            <p className="mt-1.5 xl:mt-[3px] text-[#5C6B80] xl:text-[19px]">Un accompagnement adapté à son niveau, ses matières et ses objectifs.</p>

            <div role="tablist" aria-label="Niveau scolaire" className="mt-6 xl:mt-[22px] grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-[14px]">
              {LEVELS.map(l => {
                const on = l.key === level;
                return (
                  <button
                    key={l.key}
                    type="button"
                    role="tab"
                    aria-selected={on}
                    onClick={() => setLevel(l.key)}
                    className={`flex flex-col items-center justify-center gap-1.5 xl:gap-[6px] h-20 xl:h-[84px] rounded-xl xl:rounded-[11px] font-bold text-sm xl:text-[16.6px] transition-colors ${
                      on ? "bg-[#019B8F] text-white" : "bg-[#F0F7FD] text-[#0D2D5A] hover:bg-[#E4F0FA]"
                    }`}
                  >
                    <l.icon className={`w-7 h-7 xl:w-[33px] xl:h-[33px] ${on ? "text-white" : "text-[#1A6CC8]"}`} strokeWidth={1.6} />
                    {l.label}
                  </button>
                );
              })}
            </div>

            <div className="mt-5 xl:mt-[24px] pt-5 xl:pt-[26px] border-t border-[#0D2D5A]/10 flex flex-wrap gap-2.5 xl:gap-[14px]">
              {active.subjects.map(s => (
                <span key={s} className="px-4 xl:px-[17px] h-9 xl:h-[42px] inline-flex items-center rounded-full bg-[#EBF5FD] border border-[#DCEBF7] text-[#0D2D5A] text-[13px] xl:text-[13.4px]">
                  {s}
                </span>
              ))}
              <span className="px-4 xl:px-[17px] h-9 xl:h-[42px] inline-flex items-center rounded-full bg-[#EBF5FD] border border-[#DCEBF7] text-[#0D2D5A] text-[13px] xl:text-[13.4px]">
                + autres matières
              </span>
            </div>
          </div>

          <img
            src={IMG.fille}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-auto rounded-2xl xl:rounded-[20px] block"
          />
        </div>
      </section>

      {/* ══════════ L'APPROCHE CARE4SUCCESS ══════════ */}
      <section id="approche" className="py-10 md:py-12 scroll-mt-24">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[4.3%] min-[1400px]:pr-[4.1%]">
          <div className="rounded-2xl xl:rounded-[20px] border border-[#D5F1EE] bg-[#EBFBFA] p-5 md:p-7 xl:pt-[19px] xl:px-[30px] xl:pb-[31px]">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
              <div>
                <p className={EYEBROW}>L'approche Care4Success</p>
                <h2 className={`${H2} mt-2 xl:mt-[4px] xl:text-[42px] xl:leading-[42px]`} style={SERIF}>
                  Vous ne choisissez pas<br className="hidden md:block" /> un coach au hasard.
                </h2>
                <p className="mt-3 xl:mt-[8px] text-[#3E4C66] xl:text-[18.5px] xl:leading-[25px] max-w-[640px] xl:max-w-[470px]">
                  Nous commençons par comprendre votre enfant, puis nous identifions le coach le plus adapté à ses besoins.
                </p>
              </div>
              <NavLink
                to={ROUTE_PATHS.EVALUATION_GRATUITE}
                className="shrink-0 inline-flex items-center gap-2.5 h-12 xl:h-[51px] px-6 xl:px-[27px] rounded-lg xl:rounded-[9px] bg-[#0F9B8E] text-white font-extrabold xl:text-[17px] hover:bg-[#0c857a] transition-colors xl:mt-[36px] xl:mr-[4px]"
              >
                Faire évaluer mon enfant <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>

            <ol className="mt-6 xl:mt-[20px] grid gap-4 sm:grid-cols-2 lg:flex lg:items-stretch lg:gap-0">
              {STEPS.map((step, i) => (
                <li key={step.n} className="contents lg:flex lg:items-center lg:min-w-0" style={{ flex: "1 1 0%" }}>
                  <div className="flex-1 min-w-0 h-full rounded-xl xl:rounded-[11px] border border-[#0D2D5A]/[0.06] bg-[#F7FBFE] p-4 xl:pt-[17px] xl:px-[16px] xl:pb-[14px] xl:min-h-[160px] xl:bg-white/80">
                    <div className="flex items-center gap-3 xl:gap-[16px] xl:pl-[6px]">
                      <span className="w-9 h-9 xl:w-[47px] xl:h-[47px] rounded-full bg-[#0F9B8E] text-white flex items-center justify-center text-sm xl:text-[19px] font-extrabold">
                        {step.n}
                      </span>
                      <step.icon className="w-8 h-8 xl:w-[40px] xl:h-[40px] text-[#0F9B8E]" {...(step.icon === BarsOutline ? {} : { strokeWidth: 1.6 })} />
                    </div>
                    <h3 className="mt-3 xl:mt-[14px] text-center font-extrabold text-[#0D2D5A] text-[15px] xl:text-[17.8px] leading-snug">{step.title}</h3>
                    <p className="mt-1 xl:mt-[5px] text-center text-[13px] xl:text-[15px] leading-snug xl:leading-[21px] text-[#4B5A73]">
                      {step.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                    </p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <span className="hidden lg:flex w-6 xl:w-[53px] shrink-0 items-center justify-center text-[#0F9B8E]">
                      <ArrowRight className="w-4 h-4 xl:w-[22px] xl:h-[22px]" strokeWidth={2.2} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI LES PARENTS ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6">
          <h2 className="text-center text-2xl md:text-[28px] xl:text-[33px] font-bold text-[#0D2D5A] leading-tight" style={SERIF}>
            Pourquoi les parents nous confient leur enfant&nbsp;?
          </h2>
        </div>
        <div className={WRAP}>
          <div className="mt-6 xl:mt-[24px] grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 lg:gap-x-0">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 xl:gap-[16px] ${i === 0 ? "" : "lg:pl-5 xl:pl-[14px] lg:border-l lg:border-[#0D2D5A]/10"}`}
              >
                <span className={`w-14 h-14 xl:w-[68px] xl:h-[68px] rounded-full flex items-center justify-center shrink-0 ${item.round}`}>
                  <item.icon className={`w-6 h-6 xl:w-[34px] xl:h-[34px] ${item.color}`} {...(item.fill ? { fill: "currentColor" } : {})} />
                </span>
                <div className="xl:pt-[4px]">
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] xl:text-[15.4px] leading-snug">{item.title}</p>
                  <p className="mt-1 xl:mt-[3px] text-sm xl:text-[15.2px] text-[#5C6B80] leading-relaxed xl:leading-[21px]">
                    {item.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TÉMOIGNAGE ══════════ */}
      <section className="py-10 md:py-12">
        <div className={`${WRAP} grid lg:grid-cols-[minmax(250px,0.8fr)_minmax(0,1.2fr)_170px] xl:grid-cols-[430px_minmax(0,658px)_200px] xl:justify-between items-center gap-6 lg:gap-6 xl:gap-[24px]`}>
          <div>
            <p className={EYEBROW}>Ils témoignent</p>
            <h2 className={`${H2} mt-2 xl:mt-[8px] xl:text-[34px] xl:leading-[42px]`} style={SERIF}>
              Ce sont <em>leurs</em> progrès<br className="hidden xl:block" /> qui parlent le mieux.
            </h2>
          </div>

          <div className="rounded-xl xl:rounded-[12px] border border-[#0D2D5A]/8 bg-white p-4 xl:py-[22px] xl:px-[22px] flex items-center gap-4 xl:gap-[20px]">
            <img
              src={IMG.avatar}
              alt=""
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              className="w-16 h-16 xl:w-[105px] xl:h-[105px] rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[#3E4C66] text-sm xl:text-[15.2px] leading-relaxed xl:leading-[24px]">
                « Mon fils avait perdu confiance en mathématiques. Après quelques semaines avec son coach, il est devenu beaucoup plus autonome et ses résultats ont progressé. »
              </p>
              <p className="mt-2 xl:mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1 xl:gap-[16px]">
                <span className="font-extrabold text-[#0D2D5A] text-sm xl:text-[14.6px] whitespace-nowrap">Parent d'un élève</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 xl:w-[19px] xl:h-[19px] fill-[#F5A623] text-[#F5A623]" />)}
                </span>
              </p>
            </div>
          </div>

          <ul className="flex flex-row lg:flex-col gap-3 xl:gap-[11px]">
            {[
              { icon: TrendingUp, label: "Progression suivie" },
              { icon: ShieldCheck, label: "Coach sélectionné selon le besoin" },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex-1 lg:flex-none flex items-center gap-3 xl:gap-[12px] rounded-xl xl:rounded-[14px] bg-[#E9FAF8] px-4 xl:px-[16px] py-2.5 xl:py-[12px]">
                <Icon className="w-6 h-6 xl:w-[29px] xl:h-[29px] text-[#0F9B8E] shrink-0" strokeWidth={1.9} />
                <span className="text-[#0D2D5A] font-semibold text-[13px] xl:text-[12.6px] leading-tight">{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[217px] bg-[#022A52] overflow-hidden">
        <div className="hidden xl:block absolute top-[50px] left-[31px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="hidden xl:block absolute top-[90px] left-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="hidden xl:block absolute -top-[60px] -right-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="hidden xl:block absolute top-[84px] right-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[28px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl xl:max-w-[700px]">
              <h2 className="text-3xl md:text-[38px] xl:text-[35.5px] font-bold text-white leading-tight xl:leading-[38px]" style={SERIF}>
                Chaque enfant peut progresser<br className="hidden md:block" /> avec le <span className="text-[#F5A623]">bon accompagnement.</span>
              </h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[8px] xl:text-[17.5px] xl:leading-[24px]">
                Tout commence par comprendre ses besoins.
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[17px] mt-6 xl:mt-[16px]">
                <NavLink
                  to={ROUTE_PATHS.EVALUATION_GRATUITE}
                  className="inline-flex items-center gap-2 h-12 xl:h-[50px] px-7 xl:px-[26px] rounded-xl xl:rounded-[8px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[16.8px] hover:bg-[#e09520] transition-colors"
                >
                  Faire évaluer mon enfant <ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center h-12 xl:h-[50px] px-7 xl:px-[26px] rounded-xl xl:rounded-[8px] border border-white/45 text-white font-semibold xl:text-[16.8px] hover:bg-white/10 transition-colors"
                >
                  Nous contacter
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[10deg] shrink-0 xl:mt-[22px] min-[1400px]:-mr-[60px]">
              <p className="text-[28px] xl:text-[32px] leading-[1.1] xl:leading-[1.15] text-white font-medium" style={HANDWRITING}>
                Chaque potentiel<br />mérite d'être accompagné
              </p>
              <HandUnderline className="w-[130px] h-3 mt-1 xl:mt-[6px] ml-10" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
