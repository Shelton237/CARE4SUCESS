import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ArrowRight, Backpack, Briefcase, CalendarDays, ChevronLeft, ChevronRight, CirclePlay, Ellipsis,
  Globe, Laptop, MessagesSquare, Plane, Scale, Search, Star, type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, HandUnderline, MedalFilled, ShieldFilled, TargetIcon, UsersOutline, type FilledIcon } from "@/components/decor";

/* Images dans public/images/langues/ (découpées dans la maquette, texte manuscrit et
   bulles inclus dans les photos). Remplaçables par les originaux, mêmes noms de fichier. */
const IMG = {
  hero: "/images/langues/hero-langues.jpg",
  homme: "/images/langues/homme.jpg",
  avatar: "/images/langues/avatar-apprenante.jpg",
};

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const H2 = "font-bold text-[#0D2D5A] leading-tight";
const EYEBROW_TEAL = "text-[#0F9B8E] text-xs xl:text-[14.4px] font-bold uppercase tracking-[0.14em]";
const EYEBROW_AMBER = "text-[#F5A623] text-xs xl:text-[14.4px] font-bold uppercase tracking-[0.14em]";

const DIRECTORY = ROUTE_PATHS.COACHS_LANGUES;

const LANGUAGES = [
  { key: "en", label: "Anglais", to: `${DIRECTORY}?langue=Anglais` },
  { key: "fr", label: "Français", to: `${DIRECTORY}?langue=Français` },
  { key: "es", label: "Espagnol", to: DIRECTORY },
  { key: "de", label: "Allemand", to: DIRECTORY },
  { key: "ar", label: "Arabe", to: DIRECTORY },
];

const GOALS: { icon: LucideIcon; title: string; desc: string[] }[] = [
  { icon: Backpack, title: "Études", desc: ["Préparez vos études", "en toute confiance."] },
  { icon: Briefcase, title: "Carrière", desc: ["Boostez vos opportunités", "professionnelles."] },
  { icon: Plane, title: "Voyages", desc: ["Communiquez facilement", "partout dans le monde."] },
  { icon: MessagesSquare, title: "Culture", desc: ["Découvrez de nouvelles", "cultures et échangez", "avec aisance."] },
];

const STEPS: { n: string; icon: LucideIcon; title: string; desc: string[] }[] = [
  { n: "01", icon: Search, title: "Recherchez", desc: ["Trouvez des coachs selon la", "langue, le niveau et l'objectif."] },
  { n: "02", icon: Scale, title: "Comparez", desc: ["Consultez les profils,", "expériences et tarifs."] },
  { n: "03", icon: CalendarDays, title: "Réservez", desc: ["Choisissez le créneau", "qui vous convient."] },
  { n: "04", icon: Laptop, title: "Apprenez", desc: ["Suivez vos cours en ligne", "ou en présentiel."] },
];

const WHY: { icon: LucideIcon | FilledIcon; title: string; desc: string[]; round: string; color: string }[] = [
  { icon: MedalFilled, title: "Coachs vérifiés", desc: ["Des profils qualifiés et", "évalués par notre équipe."], round: "bg-[#0F9B8E]", color: "text-white" },
  { icon: BarsFilled, title: "Apprentissage flexible", desc: ["En ligne ou en présentiel,", "selon votre emploi du temps."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#0F9B8E]" },
  { icon: TargetIcon, title: "Progression réelle", desc: ["Des objectifs clairs et un", "suivi régulier."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#0F9B8E]" },
  { icon: ShieldFilled, title: "Paiements sécurisés", desc: ["Des transactions simples", "et fiables."], round: "bg-white border border-[#0D2D5A]/8", color: "text-[#0F9B8E]" },
];

const TESTIMONIALS = [
  {
    quote: "Grâce à Care4Success, j'ai pu améliorer mon anglais et décrocher un nouvel emploi. Mon coach a été à l'écoute et très professionnel.",
    role: "Apprenante",
    rating: 5,
  },
];

export default function LanguesLanding() {
  const [testimonial, setTestimonial] = useState(0);
  const current = TESTIMONIALS[testimonial];

  return (
    <div className="min-h-screen bg-[#F8FCFF]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#002A53] xl:h-[460px]">
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
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#002A53] to-transparent" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.05%] relative z-10 pt-8 pb-10 xl:pt-[15px] xl:pb-0">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm xl:text-[14.6px] text-white/85">
            <NavLink to={ROUTE_PATHS.HOME} className="hover:text-white transition-colors">Accueil</NavLink>
            <ChevronRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-white/60" />
            <span>Langues</span>
          </nav>

          <p className="mt-4 xl:mt-[13px] text-[#F5A623] text-sm xl:text-[15px] font-bold uppercase tracking-[0.16em]">Langues</p>
          <h1
            className="mt-2 xl:mt-[5px] font-bold text-white text-[clamp(2rem,4.6vw,3rem)] xl:text-[70px] leading-[1.1] xl:leading-[63px]"
            style={SERIF}
          >
            Parler un<br />
            <span className="italic text-[#F5A623]">nouveau monde.</span>
          </h1>
          <div className="mt-5 xl:mt-[23px] space-y-2 xl:space-y-[8px] text-white/90 text-lg xl:text-[20px] leading-snug xl:leading-[28px] max-w-[520px] xl:max-w-[720px]">
            <p>Apprenez une langue avec un coach adapté à vos objectifs.</p>
            <p>Progressez à votre rythme, en ligne ou en présentiel.</p>
          </div>

          <div className="flex flex-wrap gap-4 xl:gap-[17px] mt-8 xl:mt-[34px]">
            <NavLink
              to={DIRECTORY}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[49px] px-7 xl:px-[27px] rounded-xl xl:rounded-[9px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[16.5px] hover:bg-[#e09520] transition-colors"
            >
              Trouver mon coach de langue <ArrowRight className="w-4 h-4" />
            </NavLink>
            <NavLink
              to={ROUTE_PATHS.COMMENT_CA_MARCHE}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[49px] px-7 xl:px-[24px] rounded-xl xl:rounded-[9px] border border-white/45 bg-[#002A53]/40 text-white font-semibold xl:text-[15px] hover:bg-white/10 transition-colors"
            >
              <CirclePlay className="w-5 h-5 xl:w-[26px] xl:h-[26px]" strokeWidth={1.5} /> Voir comment ça marche
            </NavLink>
          </div>

          {/* Mobile : la photo passe sous les boutons */}
          <div className="md:hidden relative -mx-6 mt-8">
            <img src={IMG.hero} alt="" className="w-full h-auto block" />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#002A53] to-transparent" />
          </div>

          <ul className="flex flex-wrap gap-x-8 xl:gap-x-[42px] gap-y-3 mt-8 xl:mt-[40px]">
            {[
              { icon: Globe, label: "Un large choix de langues" },
              { icon: BarsFilled, label: "Coachs qualifiés", alt: true },
              { icon: ShieldFilled, label: "En ligne ou en présentiel" },
            ].map(({ icon: Icon, label, alt }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm xl:text-[14.6px] text-white/90">
                {alt
                  ? <UsersOutline className="w-6 h-6 xl:w-[28px] xl:h-[28px] text-[#2BB3A3]" />
                  : <Icon className="w-6 h-6 xl:w-[28px] xl:h-[28px] text-[#2BB3A3]" />}
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ QUELLE LANGUE ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[4.9%] min-[1400px]:pr-[2.6%] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,297px)] gap-6 lg:gap-[22px] items-start">
          <div>
            <p className={EYEBROW_TEAL}>Les langues disponibles</p>
            <h2 className={`${H2} mt-2 xl:mt-[5px] text-2xl md:text-[30px] xl:text-[39px]`} style={SERIF}>Quelle langue souhaitez-vous apprendre&nbsp;?</h2>
            <p className="mt-1.5 xl:mt-[4px] text-[#5C6B80] xl:text-[18.2px]">Choisissez votre langue et trouvez le coach qui vous correspond.</p>

            <div className="mt-5 xl:mt-[20px] grid grid-cols-3 sm:grid-cols-6 gap-3 xl:gap-[12px]">
              {LANGUAGES.map(l => (
                <NavLink
                  key={l.key}
                  to={l.to}
                  className="flex flex-col items-center justify-center gap-2 xl:gap-[9px] h-28 xl:h-[115px] rounded-xl xl:rounded-[10px] bg-white border border-[#0D2D5A]/8 text-[#0D2D5A] font-bold text-sm xl:text-[16px] hover:border-[#0F9B8E]/50 hover:shadow-sm transition-all"
                >
                  <img src={`/images/langues/flag-${l.key}.png`} alt="" className="w-11 h-11 xl:w-[52px] xl:h-[52px] rounded-full object-cover" />
                  {l.label}
                </NavLink>
              ))}
              <NavLink
                to={DIRECTORY}
                className="flex flex-col items-center justify-center gap-2 xl:gap-[9px] h-28 xl:h-[115px] rounded-xl xl:rounded-[10px] bg-white border border-[#0D2D5A]/8 text-[#0D2D5A] font-bold text-sm xl:text-[16px] hover:border-[#0F9B8E]/50 hover:shadow-sm transition-all"
              >
                <span className="w-11 h-11 xl:w-[52px] xl:h-[52px] rounded-full bg-[#DDEEFB] text-[#1A6CC8] flex items-center justify-center">
                  <Ellipsis className="w-6 h-6 xl:w-[28px] xl:h-[28px]" strokeWidth={2.4} />
                </span>
                +5 langues
              </NavLink>
            </div>
          </div>

          <div className="rounded-2xl xl:rounded-[14px] border border-[#D5F1EE] bg-[#EBFBFA] p-5 xl:pt-[20px] xl:px-[20px] xl:pb-[22px]">
            <div className="flex items-center gap-4 xl:gap-[14px]">
              <span className="w-14 h-14 xl:w-[62px] xl:h-[62px] rounded-full bg-white border border-[#F5A623]/25 text-[#F5A623] flex items-center justify-center shrink-0">
                <Globe className="w-7 h-7 xl:w-[34px] xl:h-[34px]" strokeWidth={1.6} />
              </span>
              <p className="font-bold text-[#0D2D5A] text-lg xl:text-[19px] leading-snug" style={SERIF}>Une autre langue<br />en tête&nbsp;?</p>
            </div>
            <p className="mt-3 xl:mt-[13px] text-[#5C6B80] text-sm xl:text-[14.6px] leading-relaxed xl:leading-[21px]">
              Nous avons des coachs pour bien plus de langues.
            </p>
            <NavLink
              to={DIRECTORY}
              className="mt-4 xl:mt-[16px] inline-flex w-full items-center justify-center gap-2 h-12 xl:h-[52px] rounded-lg xl:rounded-[8px] border border-[#0B2E6B] text-[#0B2E6B] font-bold xl:text-[15.5px] bg-white/60 hover:bg-white transition-colors"
            >
              Voir toutes les langues <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>
        </div>
      </section>

      {/* ══════════ VOS OBJECTIFS ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[5.4%] min-[1400px]:pr-[5.5%] grid lg:grid-cols-[minmax(0,1fr)_minmax(0,411px)] gap-6 lg:gap-[8px] items-start">
          <div>
            <p className={EYEBROW_TEAL}>Vos objectifs</p>
            <h2 className={`${H2} mt-2 xl:mt-[5px] text-2xl md:text-[30px] xl:text-[37.7px]`} style={SERIF}>Apprenez une langue pour aller plus loin</h2>
            <p className="mt-1.5 xl:mt-[4px] text-[#5C6B80] xl:text-[18.2px]">Quel que soit votre objectif, nous vous aidons à trouver le bon coach.</p>

            <div className="mt-5 xl:mt-[19px] grid grid-cols-2 sm:grid-cols-4 gap-3 xl:gap-[15px]">
              {GOALS.map(g => (
                <div key={g.title} className="rounded-xl xl:rounded-[10px] bg-white border border-[#0D2D5A]/[0.07] p-4 xl:pt-[18px] xl:px-[16px] xl:pb-[16px] xl:h-[179px]">
                  <g.icon className="w-8 h-8 xl:w-[38px] xl:h-[38px] text-[#0F9B8E]" strokeWidth={1.6} />
                  <h3 className="mt-2 xl:mt-[11px] font-extrabold text-[#0D2D5A] text-base xl:text-[17.2px]">{g.title}</h3>
                  <p className="mt-1 xl:mt-[6px] text-[#5C6B80] text-[13px] xl:text-[14.4px] leading-snug xl:leading-[21px]">
                    {g.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <img
            src={IMG.homme}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-auto block lg:mt-[6px]"
          />
        </div>
      </section>

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[3.7%] min-[1400px]:pr-[3.7%]">
          <div className="rounded-2xl xl:rounded-[14px] border border-[#FBE7BA]/70 bg-[#FFF8EA] p-5 md:p-7 xl:pt-[19px] xl:px-[26px] xl:pb-[22px]">
            <p className={EYEBROW_AMBER}>Comment ça marche</p>
            <h2 className={`${H2} mt-2 xl:mt-[4px] text-2xl md:text-[30px] xl:text-[33.3px]`} style={SERIF}>Trouvez votre coach en quelques étapes</h2>
            <p className="mt-1.5 xl:mt-[4px] text-[#5C6B80] xl:text-[18.2px]">Une expérience simple, flexible et transparente.</p>

            <ol className="mt-5 xl:mt-[19px] grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-[15px]">
              {STEPS.map((step, i) => (
                <li key={step.n} className="relative rounded-xl xl:rounded-[10px] bg-white/85 border border-[#0D2D5A]/[0.05] p-4 xl:pt-[18px] xl:px-[20px] xl:pb-[12px] xl:h-[149px]">
                  <div className="flex items-center gap-3 xl:gap-[46px]">
                    <span className="w-9 h-9 xl:w-[44px] xl:h-[44px] rounded-full bg-[#F5A623] text-white flex items-center justify-center text-sm xl:text-[17px] font-extrabold">{step.n}</span>
                    <step.icon className="w-8 h-8 xl:w-[42px] xl:h-[42px] text-[#F5A623]" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-2.5 xl:mt-[8px] xl:pl-[78px] font-extrabold text-[#0D2D5A] text-[15px] xl:text-[16.6px]">{step.title}</h3>
                  <p className="mt-1 xl:mt-[3px] xl:pl-[78px] text-[#5C6B80] text-[13px] xl:text-[13.8px] leading-snug xl:leading-[19px]">
                    {step.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                  {i < STEPS.length - 1 && (
                    <ArrowRight className="hidden lg:block absolute top-1/2 -translate-y-1/2 right-[10px] xl:right-[14px] w-4 h-4 xl:w-[18px] xl:h-[18px] text-[#0B2E6B]" strokeWidth={2.2} />
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI CHOISIR ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6">
          <h2 className="text-center text-xl md:text-[24px] xl:text-[25.5px] font-bold text-[#0D2D5A] uppercase tracking-wide" style={SERIF}>
            Pourquoi choisir Care4Success&nbsp;?
          </h2>
        </div>
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[6.2%] min-[1400px]:pr-[4%]">
          <div className="mt-6 xl:mt-[20px] grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 lg:gap-x-0">
            {WHY.map((item, i) => (
              <div key={item.title} className={`flex items-center gap-4 xl:gap-[16px] ${i === 0 ? "" : "lg:pl-5 xl:pl-[12px] lg:border-l lg:border-[#0D2D5A]/10"}`}>
                <span className={`w-14 h-14 xl:w-[69px] xl:h-[69px] rounded-full flex items-center justify-center shrink-0 ${item.round}`}>
                  <item.icon className={`w-6 h-6 xl:w-[36px] xl:h-[36px] ${item.color}`} />
                </span>
                <div>
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] xl:text-[15.4px] leading-snug">{item.title}</p>
                  <p className="mt-1 xl:mt-[3px] text-sm xl:text-[14.6px] text-[#5C6B80] leading-relaxed xl:leading-[21px]">
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
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[2.7%] min-[1400px]:pr-[2.7%] flex items-center gap-4 xl:gap-0">
          <button
            type="button"
            aria-label="Témoignage précédent"
            onClick={() => setTestimonial(t => (t - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
            className="hidden md:flex w-10 h-10 xl:w-[43px] xl:h-[43px] rounded-full bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] items-center justify-center shrink-0 hover:bg-[#F0F5FA] transition-colors"
          >
            <ChevronLeft className="w-4 h-4 xl:w-[19px] xl:h-[19px]" strokeWidth={2.4} />
          </button>

          <div className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,727px)] xl:grid-cols-[minmax(0,1fr)_727px] items-center gap-6 lg:pl-8 xl:pl-[24px] xl:pr-[43px]">
            <div>
              <p className={EYEBROW_TEAL}>Ils témoignent</p>
              <h2 className={`${H2} mt-2 xl:mt-[8px] text-2xl md:text-[28px] xl:text-[31.5px] xl:leading-[39px]`} style={SERIF}>
                Une nouvelle langue,<br className="hidden md:block" /> de nouvelles opportunités.
              </h2>
            </div>

            <div className="rounded-xl xl:rounded-[12px] border border-[#0D2D5A]/8 bg-white p-4 xl:py-[20px] xl:px-[20px] flex items-center gap-4 xl:gap-[20px]">
              <img
                src={IMG.avatar}
                alt=""
                onError={(e) => { e.currentTarget.style.display = "none"; }}
                className="w-16 h-16 xl:w-[101px] xl:h-[101px] rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-[#3E4C66] text-sm xl:text-[16.4px] leading-relaxed xl:leading-[22px]">« {current.quote} »</p>
                <p className="mt-2 xl:mt-[8px] flex flex-wrap items-center gap-x-3 gap-y-1 xl:gap-[14px]">
                  <span className="font-extrabold text-[#0D2D5A] text-sm xl:text-[14.6px] whitespace-nowrap">{current.role}</span>
                  <span className="flex gap-0.5">
                    {Array.from({ length: current.rating }).map((_, i) => <Star key={i} className="w-4 h-4 xl:w-[19px] xl:h-[19px] fill-[#F5A623] text-[#F5A623]" />)}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="Témoignage suivant"
            onClick={() => setTestimonial(t => (t + 1) % TESTIMONIALS.length)}
            className="hidden md:flex w-10 h-10 xl:w-[43px] xl:h-[43px] rounded-full bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] items-center justify-center shrink-0 hover:bg-[#F0F5FA] transition-colors"
          >
            <ChevronRight className="w-4 h-4 xl:w-[19px] xl:h-[19px]" strokeWidth={2.4} />
          </button>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[180px] bg-[#00244A] overflow-hidden">
        <div className="hidden xl:block absolute top-[36px] left-[36px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="hidden xl:block absolute top-[78px] left-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="hidden xl:block absolute -top-[50px] -right-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="hidden xl:block absolute top-[76px] right-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[26px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl xl:max-w-[700px]">
              <h2 className="text-3xl md:text-[38px] xl:text-[38.5px] font-bold text-white leading-tight xl:leading-[45px]" style={SERIF}>
                Prêt à parler un <span className="italic text-[#F5A623]">nouveau monde</span>&nbsp;?
              </h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[4px] xl:text-[17.5px] xl:leading-[24px]">
                Trouvez dès maintenant votre coach de langue.
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[18px] mt-6 xl:mt-[16px]">
                <NavLink
                  to={DIRECTORY}
                  className="inline-flex items-center gap-2 h-12 xl:h-[52px] px-7 xl:px-[26px] rounded-xl xl:rounded-[8px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[16.8px] hover:bg-[#e09520] transition-colors"
                >
                  Trouver mon coach de langue <ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center h-12 xl:h-[52px] px-7 xl:px-[26px] rounded-xl xl:rounded-[8px] border border-white/45 text-white font-semibold xl:text-[16.8px] hover:bg-white/10 transition-colors"
                >
                  Nous contacter
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[9deg] shrink-0 xl:mt-[6px] min-[1400px]:-mr-[40px]">
              <p className="text-[28px] xl:text-[32px] leading-[1.1] xl:leading-[1.2] text-white font-medium" style={HANDWRITING}>
                Apprendre aujourd'hui<br />pour aller plus loin<br />demain
              </p>
              <HandUnderline className="w-[96px] h-3 mt-1 xl:mt-[6px] ml-14" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
