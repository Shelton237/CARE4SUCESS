import { NavLink } from "react-router-dom";
import {
  ArrowRight, Briefcase, ChevronRight, CircleUser, ClipboardList, GraduationCap, UserRound, UsersRound,
  type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, BarsOutline, HandUnderline, ShieldFilled, UsersOutline, type FilledIcon } from "@/components/decor";

/* Images dans public/images/parcours/ (découpées dans la maquette, texte manuscrit et
   bulle inclus dans la photo du hero). Remplaçables par les originaux, mêmes noms de fichier. */
const IMG = {
  hero: "/images/parcours/hero-parcours.jpg",
  parents: "/images/parcours/parents.jpg",
  apprenants: "/images/parcours/apprenants.jpg",
  pros: "/images/parcours/professionnels.jpg",
};

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const EYEBROW = "text-[#0F9B8E] text-xs xl:text-[14.6px] font-bold uppercase tracking-[0.14em]";
const H2 = "font-bold text-[#0D2D5A] leading-tight text-2xl md:text-[30px]";
const SUB = "mt-1.5 xl:mt-[3px] text-[#5C6B80] xl:text-[20px]";
const WRAP = "mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[5.85%] min-[1400px]:pr-[4.8%]";

type Icon = LucideIcon | FilledIcon;

const STEPS: { n: string; icon: Icon; title: string; desc: string[]; circle: string; ring?: string }[] = [
  { n: "01", icon: ClipboardList, title: "Évaluation du besoin", desc: ["Nous comprenons vos objectifs", "et votre niveau."], circle: "bg-[#DDF3F0] text-[#0F9B8E]" },
  { n: "02", icon: UsersOutline, title: "Matching Care4Success", desc: ["Nous vous proposons le coach", "le plus adapté à votre profil."], circle: "bg-[#FFF1CC] text-[#F5A623]" },
  { n: "03", icon: CircleUser, title: "Démarrage", desc: ["Vous commencez vos cours", "en ligne ou en présentiel."], circle: "bg-[#FCE1E5] text-[#E2596D]", ring: "bg-[#FCE9EC] text-[#E2596D]" },
  { n: "04", icon: BarsOutline, title: "Suivi des progrès", desc: ["Nous suivons vos avancées", "et ajustons si nécessaire."], circle: "bg-[#DDECF6] text-[#0F7F8E]" },
];

const PROFILES: { key: string; photo: string; icon: Icon; title: string; desc: string[]; to: string; bg: string; iconWrap?: string; iconColor: string }[] = [
  {
    key: "parents", photo: IMG.parents, icon: UserRound, title: "Parents", to: ROUTE_PATHS.SERVICES,
    desc: ["Un accompagnement", "pour la réussite scolaire", "de votre enfant."],
    bg: "from-[#F2FEFE] to-[#F6FEFD]", iconWrap: "bg-[#2BB3A3]", iconColor: "text-white",
  },
  {
    key: "apprenants", photo: IMG.apprenants, icon: GraduationCap, title: "Apprenants", to: ROUTE_PATHS.COURS_DE_LANGUES,
    desc: ["Des cours de langues,", "des compétences et un", "suivi personnalisé."],
    bg: "from-[#F1FCFE] to-[#F5FDFE]", iconColor: "text-[#0F9B8E]",
  },
  {
    key: "pros", photo: IMG.pros, icon: Briefcase, title: "Professionnels", to: ROUTE_PATHS.COMPETENCES,
    desc: ["Développez vos compétences", "et avancez vers de nouvelles", "opportunités."],
    bg: "from-[#FFF9F6] to-[#FFFBF8]", iconColor: "text-[#F5A623]",
  },
];

const WHY: { icon: Icon; title: string[]; desc: string[]; round: string; color: string }[] = [
  { icon: UsersRound, title: ["Coachs sélectionnés"], desc: ["Des profils qualifiés et", "vérifiés."], round: "bg-[#DDF3F0]", color: "text-[#0F9B8E]" },
  { icon: UsersRound, title: ["Accompagnement", "personnalisé"], desc: ["Une solution adaptée", "à vos objectifs."], round: "bg-[#FFF1D5]", color: "text-[#F5A623]" },
  { icon: BarsFilled, title: ["Progression suivie"], desc: ["Des résultats concrets", "dans le temps."], round: "bg-[#FCE1E5]", color: "text-[#E25A73]" },
  { icon: ShieldFilled, title: ["Flexibilité"], desc: ["Des cours en ligne", "ou en présentiel."], round: "bg-[#DDF3F0]", color: "text-[#0F9B8E]" },
];

export default function CommentCaMarche() {
  return (
    <div className="min-h-screen bg-[#F8FCFF]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#012853] xl:h-[426px]">
        <div className="hidden md:block absolute top-0 right-0 w-[51.2%]">
          <img
            src={IMG.hero}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-auto block"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 12%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 12%)",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#012853] to-transparent" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.35%] relative z-10 pt-8 pb-10 xl:pt-[17px] xl:pb-0">
          <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-sm xl:text-[14.6px] text-white/85">
            <NavLink to={ROUTE_PATHS.HOME} className="hover:text-white transition-colors">Accueil</NavLink>
            <ChevronRight className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-white/60" />
            <span>Comment ça marche</span>
          </nav>

          <p className="mt-4 xl:mt-[16px] text-[#F5A623] text-sm xl:text-[15px] font-bold uppercase tracking-[0.14em]">Comment ça marche</p>
          <h1
            className="mt-2 xl:mt-[8px] font-bold text-white text-[clamp(2rem,4.6vw,3rem)] xl:text-[64px] leading-[1.12] xl:leading-[63px]"
            style={SERIF}
          >
            Un parcours simple<br />
            vers <span className="italic text-[#F5A623]">vos objectifs.</span>
          </h1>
          <p className="mt-5 xl:mt-[26px] text-white/90 text-lg xl:text-[23px] leading-snug xl:leading-[34px] max-w-[520px] xl:max-w-[760px]">
            Nous vous accompagnons à chaque étape, de l’évaluation<br className="hidden md:block" />{" "}
            du besoin jusqu’au suivi de vos progrès.
          </p>

          <div className="mt-8 xl:mt-[32px]">
            <NavLink
              to={ROUTE_PATHS.PROFESSEURS}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[56px] px-8 xl:px-[32px] rounded-xl xl:rounded-[10px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[17.6px] hover:bg-[#e09520] transition-colors"
            >
              Commencer maintenant <ArrowRight className="w-4 h-4" />
            </NavLink>
          </div>

          {/* Mobile : la photo passe sous le bouton */}
          <div className="md:hidden relative -mx-6 mt-8">
            <img src={IMG.hero} alt="" className="w-full h-auto block" />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#012853] to-transparent" />
          </div>
        </div>
      </section>

      {/* ══════════ 4 ÉTAPES ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <div className="relative">
            <p className={EYEBROW}>4 étapes simples</p>
            <h2 className={`${H2} xl:text-[40px] mt-2 xl:mt-[5px]`} style={SERIF}>De votre besoin à vos résultats</h2>
            <p className={SUB}>Un accompagnement clair, transparent et entièrement personnalisé.</p>

            <div className="hidden lg:block absolute right-[6px] top-[-4px] xl:top-[-2px] text-left -rotate-[8deg] origin-left text-[#0D2D5A]">
              <p className="text-[24px] xl:text-[29px] leading-[1.1] xl:leading-[1.2] font-medium" style={HANDWRITING}>
                Un accompagnement<br />du début à la réussite
              </p>
              <HandUnderline className="w-[84px] h-3 mt-0.5 ml-16" />
            </div>
          </div>

          <ol className="mt-6 xl:mt-[22px] min-[1400px]:-ml-[15px] grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] lg:gap-0 items-stretch">
            {STEPS.map((step, i) => (
              <li key={step.n} className="contents">
                <div className="rounded-xl xl:rounded-[12px] border border-[#0D2D5A]/[0.06] bg-white/80 p-4 xl:pt-[20px] xl:pl-[22px] xl:pr-[16px] xl:pb-[18px] xl:h-[202px]">
                  <div className="flex items-center gap-3 xl:gap-[26px]">
                    <span className={`w-11 h-11 xl:w-[59px] xl:h-[59px] rounded-full flex items-center justify-center text-base xl:text-[21px] font-extrabold ${step.circle}`}>{step.n}</span>
                    {step.ring ? (
                      <span className={`w-11 h-11 xl:w-[52px] xl:h-[52px] rounded-full flex items-center justify-center ${step.ring}`}>
                        <step.icon className="w-6 h-6 xl:w-[30px] xl:h-[30px]" strokeWidth={1.7} />
                      </span>
                    ) : (
                      <step.icon className="w-8 h-8 xl:w-[42px] xl:h-[42px] text-[#0F9B8E]" {...(step.icon === BarsOutline ? {} : { strokeWidth: 1.7 })} />
                    )}
                  </div>
                  <h3 className="mt-3 xl:mt-[14px] font-extrabold text-[#0D2D5A] text-base xl:text-[19.9px] leading-tight">{step.title}</h3>
                  <p className="mt-1.5 xl:mt-[9px] text-[#5C6B80] text-sm xl:text-[17.4px] leading-snug xl:leading-[25px]">
                    {step.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:flex w-8 xl:w-[62px] items-center justify-center text-[#0B2E6B]">
                    <ArrowRight className="w-4 h-4 xl:w-[22px] xl:h-[22px]" strokeWidth={2.2} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════ EXPÉRIENCE ADAPTÉE ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:pl-[3.1%] min-[1400px]:pr-[3%]">
          <div className="rounded-2xl xl:rounded-[16px] border border-[#D9F0F2] bg-[#EFFAFC] p-5 md:p-7 xl:pt-[17px] xl:pl-[24px] xl:pr-[24px] xl:pb-[17px]">
            <p className={EYEBROW}>Une expérience adaptée à vos besoins</p>
            <h2 className={`${H2} xl:text-[41.3px] mt-2 xl:mt-[6px]`} style={SERIF}>Selon votre profil, un même objectif&nbsp;: votre réussite</h2>
            <p className={SUB}>Que vous soyez parent, apprenant ou professionnel, nous vous accompagnons différemment.</p>

            <div className="mt-5 xl:mt-[22px] grid md:grid-cols-3 gap-4 xl:gap-[22px]">
              {PROFILES.map(p => (
                <div key={p.key} className={`relative overflow-hidden rounded-xl xl:rounded-[12px] border border-[#0D2D5A]/[0.06] bg-gradient-to-r ${p.bg} p-5 xl:pt-[22px] xl:pl-[22px] xl:pb-[18px] xl:h-[250px]`}>
                  <img
                    src={p.photo}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="hidden lg:block absolute right-0 top-0 h-full w-[46%] object-cover object-left"
                    style={{
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 30%)",
                      maskImage: "linear-gradient(to right, transparent 0%, #000 30%)",
                    }}
                  />
                  <div className="relative z-10 flex flex-col h-full lg:max-w-[62%]">
                    {p.iconWrap ? (
                      <span className={`w-12 h-12 xl:w-[52px] xl:h-[52px] rounded-full flex items-center justify-center ${p.iconWrap} ${p.iconColor}`}>
                        <p.icon className="w-6 h-6 xl:w-[28px] xl:h-[28px]" strokeWidth={1.8} />
                      </span>
                    ) : (
                      <p.icon className={`w-10 h-10 xl:w-[48px] xl:h-[48px] ${p.iconColor}`} strokeWidth={1.6} />
                    )}
                    <h3 className="mt-2 xl:mt-[9px] font-extrabold text-[#0D2D5A] text-lg xl:text-[21px] leading-tight">{p.title}</h3>
                    <p className="mt-1.5 xl:mt-[9px] text-[#5C6B80] text-sm xl:text-[16.8px] leading-snug xl:leading-[24px]">
                      {p.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                    </p>
                    <NavLink to={p.to} className="mt-auto pt-3 inline-flex items-center gap-2 text-[#0E7490] font-bold text-sm xl:text-[16.4px] hover:gap-3 transition-all">
                      En savoir plus <ArrowRight className="w-4 h-4" strokeWidth={2.2} />
                    </NavLink>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ POURQUOI ÇA FONCTIONNE ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <p className={EYEBROW}>Pourquoi ça fonctionne ?</p>
          <h2 className={`${H2} xl:text-[41px] mt-2 xl:mt-[5px]`} style={SERIF}>Une approche humaine et efficace</h2>
          <p className={SUB}>Nous combinons technologie et expertise humaine pour vous offrir la meilleure expérience.</p>

          <div className="mt-6 xl:mt-[22px] grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 lg:gap-x-0">
            {WHY.map((item, i) => (
              <div key={item.title.join(" ")} className={`flex items-center gap-4 xl:gap-[16px] ${i === 0 ? "" : "lg:pl-5 xl:pl-[24px] lg:border-l lg:border-[#0D2D5A]/10"}`}>
                <span className={`w-14 h-14 xl:w-[70px] xl:h-[70px] rounded-full flex items-center justify-center shrink-0 ${item.round} ${item.color}`}>
                  <item.icon className="w-7 h-7 xl:w-[36px] xl:h-[36px]" {...(item.icon === BarsFilled || item.icon === ShieldFilled ? {} : { strokeWidth: 1.7 })} />
                </span>
                <div>
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] xl:text-[16.2px] leading-snug">
                    {item.title.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                  <p className="mt-1 xl:mt-[3px] text-sm xl:text-[15.4px] text-[#5C6B80] leading-relaxed xl:leading-[24px]">
                    {item.desc.map((line, k) => <span key={k} className="block">{line}</span>)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[219px] bg-[#01244A] overflow-hidden">
        <div className="hidden xl:block absolute top-[36px] left-[36px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="hidden xl:block absolute top-[78px] left-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="hidden xl:block absolute -top-[50px] -right-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="hidden xl:block absolute top-[76px] right-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[28px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl xl:max-w-[740px]">
              <h2 className="text-3xl md:text-[38px] xl:text-[39.5px] font-bold text-white leading-tight xl:leading-[47px]" style={SERIF}>
                Prêt à commencer <span className="text-[#F5A623]">votre parcours</span>&nbsp;?
              </h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[6px] xl:text-[18px] xl:leading-[25px]">
                Rejoignez Care4Success et avancez vers vos objectifs.
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[18px] mt-6 xl:mt-[22px]">
                <NavLink
                  to={ROUTE_PATHS.PROFESSEURS}
                  className="inline-flex items-center gap-2 h-12 xl:h-[55px] px-7 xl:px-[30px] rounded-xl xl:rounded-[8px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[18px] hover:bg-[#e09520] transition-colors"
                >
                  Trouver mon coach <ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to="/inscription"
                  className="inline-flex items-center h-12 xl:h-[55px] px-7 xl:px-[30px] rounded-xl xl:rounded-[8px] border border-white/45 text-white font-semibold xl:text-[18px] hover:bg-white/10 transition-colors"
                >
                  Créer un compte gratuitement
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[9deg] shrink-0 xl:mt-[16px] min-[1400px]:-mr-[40px]">
              <p className="text-[28px] xl:text-[32px] leading-[1.1] xl:leading-[1.2] text-white font-medium" style={HANDWRITING}>
                Un premier pas<br />vers de grandes réussites
              </p>
              <HandUnderline className="w-[96px] h-3 mt-1 xl:mt-[6px] ml-12" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
