import { NavLink } from "react-router-dom";
import {
  ArrowRight, Briefcase, BriefcaseBusiness, CirclePlay, GraduationCap, Laptop, Megaphone, Search,
  type LucideIcon,
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, BarsOutline, HandUnderline, TargetIcon, UsersOutline, type FilledIcon } from "@/components/decor";
import { useT, tt, rich, lines } from "@/i18n";

/* Images dans public/images/competences/ (découpées dans la maquette, texte manuscrit et
   bulle inclus dans la photo du hero). Remplaçables par les originaux, mêmes noms de fichier. */
const IMG = {
  hero: "/images/competences/hero-competences.jpg",
  etudiant: "/images/competences/etudiante.jpg",
  jeune: "/images/competences/jeune-pro.jpg",
  pro: "/images/competences/professionnelle.jpg",
};

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const H2 = "font-bold text-[#0D2D5A] leading-tight text-2xl md:text-[30px]";
const SUB = "mt-1.5 xl:mt-[3px] text-[#5C6B80] xl:text-[20.2px]";
const EYEBROW = "text-[#0F9B8E] text-xs xl:text-[14.6px] font-bold uppercase tracking-[0.14em]";
// Les coachs de cet univers sont listés dans l'annuaire, catégorie "competences"
const DIRECTORY = `${ROUTE_PATHS.ANNUAIRE_COACHS}?categorie=competences`;

type Icon = LucideIcon | FilledIcon;

const DOMAINS: { icon: Icon; title: string; desc: string; tint: string; circle: string; color: string; arrow: string; border: string }[] = [
  {
    icon: Laptop, title: tt("Digital & Data"), desc: tt("Développez des compétences\ntechniques et numériques\nrecherchées."),
    tint: "from-[#EEF7FE] to-[#E3F4FE]", border: "border-[#DCEBF7]", circle: "bg-[#E1F1FE]", color: "text-[#1A6CC8]", arrow: "bg-[#DCEEFC] text-[#1A6CC8]",
  },
  {
    icon: Briefcase, title: tt("Business & Management"), desc: tt("Renforcez vos compétences\nen gestion, stratégie et\nleadership."),
    tint: "from-[#FEF9EF] to-[#FCEED7]", border: "border-[#F6E9D2]", circle: "bg-[#FDEFD6]", color: "text-[#F5A623]", arrow: "bg-[#FCE9C8] text-[#C9880F]",
  },
  {
    icon: Megaphone, title: tt("Communication & Marketing"), desc: tt("Apprenez à mieux\ncommuniquer, promouvoir\net convaincre."),
    tint: "from-[#FDF2F6] to-[#FEEFF2]", border: "border-[#F6DCE3]", circle: "bg-[#FCE3E9]", color: "text-[#E2574C]", arrow: "bg-[#FADDE3] text-[#E2574C]",
  },
  {
    icon: BarsOutline, title: tt("Autres compétences"), desc: tt("Explorez de nouvelles\ncompétences selon\nvos objectifs."),
    tint: "from-[#EBFAF7] to-[#E9FAF4]", border: "border-[#D2F0EA]", circle: "bg-[#D5F3EC]", color: "text-[#0F9B8E]", arrow: "bg-[#D3F1EA] text-[#0F9B8E]",
  },
];

const PERSONAS: { photo: string; icon: Icon; title: string; desc: string }[] = [
  { photo: IMG.etudiant, icon: GraduationCap, title: tt("Étudiants"), desc: tt("Développez des compétences\npour réussir vos études et\npréparer votre avenir.") },
  { photo: IMG.jeune, icon: BriefcaseBusiness, title: tt("Jeunes professionnels"), desc: tt("Boostez votre employabilité\net saisissez de nouvelles\nopportunités.") },
  { photo: IMG.pro, icon: BarsOutline, title: tt("Professionnels"), desc: tt("Montez en compétences\net évoluez dans votre\ncarrière.") },
];

const STEPS: { n: string; icon: Icon; title: string; desc: string }[] = [
  { n: "1", icon: Search, title: tt("Choisissez votre objectif"), desc: tt("Identifiez la compétence que\nvous souhaitez développer.") },
  { n: "2", icon: UsersOutline, title: tt("Trouvez votre expert"), desc: tt("Nous vous proposons le coach\nle plus adapté à vos besoins.") },
  { n: "3", icon: BarsOutline, title: tt("Progressez"), desc: tt("Suivez vos cours et atteignez\nvos objectifs.") },
];

export default function Competences() {
  const { t } = useT();
  return (
    <div className="min-h-screen bg-[#F7FBFE]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#012C56] xl:h-[470px]">
        <div className="hidden md:block absolute top-0 end-0 w-[46.5%]">
          <img
            src={IMG.hero}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-auto block"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 14%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 14%)",
            }}
          />
          <span className="hero-sheen" aria-hidden style={{ WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 14%)", maskImage: "linear-gradient(to right, transparent 0%, #000 14%)" }} />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-[#012C56] to-transparent" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:ps-[6.25%] relative z-10 pt-10 pb-10 xl:pt-[44px] xl:pb-0">

          <p className="text-[#F5A623] text-sm xl:text-[15px] font-bold uppercase tracking-[0.14em]">{t("Compétences et carrière")}</p>
          <h1
            className="mt-2 xl:mt-[5px] font-bold text-white text-[clamp(2rem,4.6vw,3rem)] xl:text-[57px] leading-[1.12] xl:leading-[59px]"
            style={SERIF}
          >{rich(t("Développer aujourd’hui\nles opportunités <s1>de demain.</s1>"), { s1: c => <span className="italic text-gold-shimmer">{c}</span> })}</h1>
          <p className="mt-5 xl:mt-[23px] text-white/90 text-lg xl:text-[22px] leading-snug xl:leading-[29px] max-w-[520px] xl:max-w-[720px]">{rich(t("Acquérez de nouvelles compétences avec des experts{md}et avancez vers vos ambitions professionnelles."))}</p>

          <div className="flex flex-wrap gap-4 xl:gap-[17px] mt-8 xl:mt-[34px]">
            <NavLink
              to={DIRECTORY}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[52px] px-7 xl:px-[30px] rounded-xl xl:rounded-[9px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[17.5px] hover:bg-[#e09520] transition-colors"
            >{t("Trouver mon coach")}{" "}<ArrowRight className="w-4 h-4" />
            </NavLink>
            <NavLink
              to={ROUTE_PATHS.COMMENT_CA_MARCHE}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[52px] px-7 xl:px-[24px] rounded-xl xl:rounded-[9px] border border-white/45 bg-[#012C56]/40 text-white font-semibold xl:text-[15.5px] hover:bg-white/10 transition-colors"
            >
              <CirclePlay className="w-5 h-5 xl:w-[26px] xl:h-[26px]" strokeWidth={1.5} />{t("Voir comment ça marche")}
            </NavLink>
          </div>

          {/* Mobile : la photo passe sous les boutons */}
          <div className="md:hidden relative -mx-6 mt-8">
            <img src={IMG.hero} alt="" className="w-full h-auto block" />
            <span className="hero-sheen" aria-hidden />
            <div className="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-[#012C56] to-transparent" />
          </div>

          <ul className="flex flex-wrap gap-x-8 xl:gap-x-[42px] gap-y-3 mt-8 xl:mt-[40px]">
            {[
              { icon: BarsFilled, label: t("Compétences concrètes") },
              { icon: UsersOutline, label: t("Coachs experts") },
              { icon: TargetIcon, label: t("Objectifs professionnels") },
            ].map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm xl:text-[15.4px] text-white/90">
                <Icon className="w-6 h-6 xl:w-[32px] xl:h-[32px] text-[#2BB3A3]" />
                {t(label)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ══════════ NOS DOMAINES ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:ps-[5.75%] min-[1400px]:pe-[5%]">
          <p className={EYEBROW}>{t("Nos domaines")}</p>
          <h2 className={`${H2} xl:text-[41px] mt-2 xl:mt-[5px]`} style={SERIF}>{t("Des compétences pour vos ambitions")}</h2>
          <p className={SUB}>{t("Des domaines clés, dispensés par des experts du terrain.")}</p>

          <div className="mt-6 xl:mt-[22px] grid sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-[28px]">
            {DOMAINS.map(d => (
              <NavLink
                key={d.title}
                to={DIRECTORY}
                className={`group relative block rounded-2xl xl:rounded-[14px] border bg-gradient-to-br ${d.tint} ${d.border} p-5 xl:pt-[16px] xl:px-[21px] xl:pb-[16px] xl:h-[253px] hover:-translate-y-0.5 transition-transform`}
              >
                <span className={`w-14 h-14 xl:w-[70px] xl:h-[70px] rounded-full flex items-center justify-center ${d.circle} ${d.color}`}>
                  <d.icon className="w-7 h-7 xl:w-[44px] xl:h-[44px]" {...(d.icon === BarsOutline ? {} : { strokeWidth: 1.9 })} />
                </span>
                <h3 className="mt-3 xl:mt-[16px] font-extrabold text-[#0D2D5A] text-lg xl:text-[19.8px] xl:whitespace-nowrap leading-tight">{t(d.title)}</h3>
                <p className="mt-2 xl:mt-[11px] text-[#5C6B80] text-sm xl:text-[16.9px] leading-relaxed xl:leading-[25px] pe-6">
                  {lines(t(d.desc))}
                </p>
                <span className={`absolute end-4 bottom-4 xl:end-[18px] xl:bottom-[16px] w-8 h-8 xl:w-[35px] xl:h-[35px] rounded-full flex items-center justify-center ${d.arrow} group-hover:scale-105 transition-transform`}>
                  <ArrowRight className="w-4 h-4 xl:w-[17px] xl:h-[17px]" strokeWidth={2.4} />
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ POUR QUI ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:ps-[5.75%] min-[1400px]:pe-[5%]">
          <p className={EYEBROW}>{t("Pour qui ?")}</p>
          <h2 className={`${H2} xl:text-[43px] mt-2 xl:mt-[5px]`} style={SERIF}>{t("Un accompagnement pour chaque parcours")}</h2>
          <p className={SUB}>{t("Que vous soyez étudiant, jeune professionnel ou professionnel, nous vous aidons à atteindre vos objectifs.")}</p>

          <div className="mt-6 xl:mt-[22px] grid md:grid-cols-3 gap-4 xl:gap-[30px]">
            {PERSONAS.map(p => (
              <div key={p.title} className="flex rounded-xl xl:rounded-[12px] border border-[#0D2D5A]/[0.07] bg-white overflow-hidden xl:h-[186px]">
                <img
                  src={p.photo}
                  alt=""
                  onError={(e) => { e.currentTarget.style.display = "none"; }}
                  className="w-24 sm:w-32 xl:w-[142px] object-cover shrink-0"
                />
                <div className="p-4 xl:pt-[18px] xl:ps-[22px] xl:pe-[12px]">
                  <p.icon className="w-7 h-7 xl:w-[40px] xl:h-[40px] text-[#0F9B8E]" {...(p.icon === BarsOutline ? {} : { strokeWidth: 1.7 })} />
                  <h3 className="mt-1.5 xl:mt-[8px] font-extrabold text-[#0D2D5A] text-base xl:text-[18.6px] leading-tight">{t(p.title)}</h3>
                  <p className="mt-1 xl:mt-[6px] text-[#5C6B80] text-[13px] xl:text-[16.4px] leading-snug xl:leading-[24px]">
                    {lines(t(p.desc))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMMENT ÇA MARCHE ══════════ */}
      <section className="py-10 md:py-12 bg-[#F0FAFC]">
        <div className="mx-auto max-w-[1440px] px-6 min-[1400px]:ps-[5.75%] min-[1400px]:pe-[5.4%]">
          <p className={EYEBROW}>{t("Comment ça marche ?")}</p>
          <h2 className={`${H2} xl:text-[40px] mt-2 xl:mt-[5px]`} style={SERIF}>{t("Un parcours simple et efficace")}</h2>
          <p className={SUB}>{t("De votre objectif à vos résultats, en toute simplicité.")}</p>

          <ol className="mt-6 xl:mt-[22px] grid gap-4 md:grid-cols-3 md:gap-0 xl:grid-cols-[327fr_309fr_275fr]">
            {STEPS.map((step, i) => (
              <li key={step.n} className={`relative flex items-center ${i < STEPS.length - 1 ? "md:pe-10 xl:pe-[var(--gap)]" : ""}`} style={{ ["--gap" as string]: i === 0 ? "80px" : "75px" }}>
                <div className="flex-1 rounded-xl xl:rounded-[12px] bg-white/80 border border-[#0D2D5A]/[0.05] p-4 xl:pt-[22px] xl:ps-[16px] xl:pe-[14px] xl:pb-[22px] xl:h-[159px]">
                  <div className="flex items-center gap-3 xl:gap-[49px]">
                    <span className="w-10 h-10 xl:w-[52px] xl:h-[52px] rounded-full bg-[#0F9B8E] text-white flex items-center justify-center text-base xl:text-[21px] font-extrabold shrink-0">{step.n}</span>
                    <step.icon className="w-8 h-8 xl:w-[42px] xl:h-[42px] text-[#0F9B8E]" {...(step.icon === BarsOutline ? {} : { strokeWidth: 1.6 })} />
                  </div>
                  <h3 className="mt-2 xl:mt-[6px] xl:ps-[101px] font-extrabold text-[#0D2D5A] text-[15px] xl:text-[17.6px] leading-tight">{t(step.title)}</h3>
                  <p className="mt-1 xl:mt-[4px] xl:ps-[101px] text-[#5C6B80] text-[13px] xl:text-[15.4px] leading-snug xl:leading-[20px]">
                    {lines(t(step.desc))}
                  </p>
                </div>
                {i < STEPS.length - 1 && (
                  <ArrowRight className="hidden md:block absolute end-[10px] xl:end-[19px] w-4 h-4 xl:w-[20px] xl:h-[20px] text-[#0B2E6B]" strokeWidth={2.2} />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[219px] bg-[#012348] overflow-hidden">
        <div className="hidden xl:block absolute top-[36px] start-[36px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="hidden xl:block absolute top-[78px] start-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="hidden xl:block absolute -top-[50px] -end-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="hidden xl:block absolute top-[76px] end-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[31px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl xl:max-w-[720px]">
              <h2 className="text-3xl md:text-[38px] xl:text-[41px] font-bold text-white leading-tight xl:leading-[47px]" style={SERIF}>{rich(t("Prêt à développer <s1>votre avenir</s1>\u00A0?"), { s1: c => <span className="text-[#F5A623]">{c}</span> })}</h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[5px] xl:text-[18px] xl:leading-[25px]">{t("Des compétences aujourd'hui. De nouvelles opportunités demain.")}
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[19px] mt-6 xl:mt-[22px]">
                <NavLink
                  to={DIRECTORY}
                  className="inline-flex items-center gap-2 h-12 xl:h-[52px] px-7 xl:px-[26px] rounded-xl xl:rounded-[8px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[17px] hover:bg-[#e09520] transition-colors"
                >{t("Trouver mon coach")}{" "}<ArrowRight className="w-4 h-4" />
                </NavLink>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center h-12 xl:h-[52px] px-7 xl:px-[30px] rounded-xl xl:rounded-[8px] border border-white/45 text-white font-semibold xl:text-[17px] hover:bg-white/10 transition-colors"
                >{t("Nous contacter")}
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[9deg] shrink-0 xl:mt-[4px] min-[1400px]:-me-[36px]">
              <p className="text-[28px] xl:text-[32px] leading-[1.1] xl:leading-[1.2] text-white font-medium" style={HANDWRITING}>{rich(t("Investir dans vos\ncompétences, c'est investir\ndans votre potentiel"))}</p>
              <HandUnderline className="w-[100px] h-3 mt-1 xl:mt-[6px] ms-24" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
