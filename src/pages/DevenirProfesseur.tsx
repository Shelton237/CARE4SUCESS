import { useEffect, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowRight, Award, BadgeCheck, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, CirclePlay,
  ClipboardList, Clock, GraduationCap, Globe, Heart, Monitor, Search, Star, UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { submitTeacherApplication } from "@/api/backoffice";
import { ROUTE_PATHS } from "@/lib/index";
import { BarsFilled, BarsOutline, HandUnderline, ShieldFilled, UsersFilled, type FilledIcon } from "@/components/decor";

/* Les photos vivent dans public/images/coach/ (découpées dans la maquette, à remplacer
   par les originaux en gardant les mêmes noms). Tailles en px à 1440 de large. */
const IMG = {
  hero: "/images/coach/hero-coach.jpg",
  soutien: { src: "/images/coach/card-soutien.png", w: 148, h: 238 },
  langues: { src: "/images/coach/card-langues.png", w: 138, h: 238 },
  competences: { src: "/images/coach/card-competences.png", w: 169, h: 238 },
  avatar: "/images/coach/avatar-coach.jpg",
};

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };
const WRAP = "mx-auto w-full max-w-[1309px] px-6 min-[1400px]:px-0";
const EYEBROW = "text-[#0F9B8E] text-xs xl:text-[14.6px] font-bold uppercase tracking-[0.16em]";
const H2 = "text-2xl md:text-[32px] xl:text-[38.5px] font-bold text-[#0D2D5A] leading-tight";

const VERTICALES = [
  { value: "langues-competences", label: "Langues et compétences" },
  { value: "soutien-scolaire", label: "Soutien scolaire" },
];
const PAYS = ["Cameroun", "Madagascar"];

const HERO_CARD: { icon: typeof Monitor; label: string[] }[] = [
  { icon: Monitor, label: ["En ligne ou", "en présentiel"] },
  { icon: Clock, label: ["Horaires flexibles"] },
  { icon: Award, label: ["Revenus selon", "votre engagement"] },
];

const TRUST: { icon: LucideOrFilled; label: string }[] = [
  { icon: ShieldFilled, label: "Une plateforme de confiance" },
  { icon: UsersFilled, label: "Des apprenants motivés" },
  { icon: BadgeCheck, label: "Un accompagnement dédié" },
];
type LucideOrFilled = FilledIcon | typeof BadgeCheck;

const WAYS = [
  {
    key: "soutien", to: ROUTE_PATHS.SERVICES, title: "Soutien scolaire", photo: IMG.soutien,
    desc: "Accompagnez les élèves du primaire au lycée dans leurs apprentissages (Maths, français, sciences, etc.).",
    icon: GraduationCap, iconColor: "#1A6CC8", circle: "bg-[#DDEEFB]", bg: "from-[#EEF8FE] via-[#EBF7FF] to-[#F4FAFF]", border: "border-[#DCEBF7]", fr: "305fr",
  },
  {
    key: "langues", to: ROUTE_PATHS.COURS_DE_LANGUES, title: "Langues", photo: IMG.langues,
    desc: "Enseignez une langue et ouvrez de nouvelles opportunités (anglais, français, espagnol, etc.).",
    icon: Globe, iconColor: "#F5A623", circle: "bg-[#FDEDD0]", bg: "from-[#FFF3E3] via-[#FDF9EE] to-[#FCF8F0]", border: "border-[#F6E9D2]", fr: "290fr",
  },
  {
    key: "competences", to: ROUTE_PATHS.COMPETENCES, title: "Compétences pro", photo: IMG.competences,
    desc: "Partagez votre expertise dans des domaines professionnels (data, bureautique, management, communication, etc.).",
    icon: BarsOutline, iconColor: "#0F9B8E", circle: "bg-[#D2F1EC]", bg: "from-[#F0FDFC] via-[#ECFBF8] to-[#F3FDFB]", border: "border-[#D2F0EA]", fr: "302fr",
  },
];

function CheckFilled({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <circle cx="16" cy="16" r="14" fill="currentColor" />
      <path d="M9.5 16.5l4.5 4.5 8.5-9" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  { n: "01", title: "Candidatez", desc: "Remplissez notre formulaire en quelques minutes.", icon: ClipboardList, fr: 166 },
  { n: "02", title: "Nous vérifions votre profil", desc: "Nous étudions vos qualifications et votre expérience.", icon: Search, fr: 177 },
  { n: "03", title: "Évaluation / entretien", desc: "Selon votre domaine, un test ou un entretien est réalisé (notamment pour le scolaire).", icon: UsersRound, fr: 175 },
  { n: "04", title: "Profil validé", desc: "Vous rejoignez notre réseau de coachs.", icon: CheckFilled, fr: 164 },
  { n: "05", title: "Commencez à coacher", desc: "Vous définissez vos disponibilités et recevez vos premiers apprenants.", icon: CirclePlay, fr: 170 },
];

const WHY = [
  { icon: UsersFilled, title: "Partagez votre expertise", desc: "Aidez des apprenants à atteindre leurs objectifs.", round: "bg-white border border-[#CBEBE5] text-[#0F9B8E]" },
  { icon: CalendarDays, title: "Gérez votre temps", desc: "Choisissez vos disponibilités en ligne ou en présentiel.", round: "bg-white border border-[#0D2D5A]/8 text-[#0F9B8E]" },
  { icon: BarsFilled, title: "Développez votre activité", desc: "Accédez à de nouveaux apprenants et élargissez votre réseau.", round: "bg-[#E7F7F4] border border-[#D6F0EB] text-[#0F9B8E]" },
  { icon: Heart, title: "Rejoignez une mission utile", desc: "Contribuez à l'éducation et au développement des talents.", round: "bg-white border border-[#0D2D5A]/8 text-[#E2574C]" },
];

const TESTIMONIALS = [
  {
    quote: "Rejoindre Care4Success m'a permis de partager ma passion pour les langues, de rencontrer des apprenants motivés et de vivre une expérience très enrichissante.",
    role: "Coach de langues",
    rating: 5,
  },
];

export default function DevenirProfesseur() {
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [testimonial, setTestimonial] = useState(0);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verticale, setVerticale] = useState("");
  const [pays, setPays] = useState("");
  const [motivation, setMotivation] = useState("");

  const openApply = (vertical?: string) => {
    if (vertical) setVerticale(vertical);
    setCompleted(false);
    setOpen(true);
  };

  // /devenir-professeur?candidater=1 ouvre directement le formulaire
  useEffect(() => {
    if (params.get("candidater")) {
      setOpen(true);
      const next = new URLSearchParams(params);
      next.delete("candidater");
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const mutation = useMutation({
    mutationFn: submitTeacherApplication,
    onSuccess: () => {
      setCompleted(true);
      toast({ title: "Candidature envoyée", description: "Notre équipe vous contacte sous 48h." });
      setPrenom(""); setNom(""); setEmail(""); setPhone("");
      setVerticale(""); setPays(""); setMotivation("");
    },
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'envoi", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verticale) {
      toast({
        title: "Verticale requise",
        description: "Merci de choisir la verticale souhaitée avant d'envoyer votre candidature.",
        variant: "destructive",
      });
      return;
    }
    const verticaleLabel = VERTICALES.find(v => v.value === verticale)?.label ?? "Non précisée";
    const formData = new window.FormData();
    formData.append("fullName", `${prenom} ${nom}`.trim());
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("subjects", verticaleLabel);
    formData.append("availability", "À confirmer avec le coach");
    formData.append("city", pays);
    formData.append("motivation", `Verticale souhaitée : ${verticaleLabel}. ${motivation}`);
    mutation.mutate(formData as any);
  };

  const current = TESTIMONIALS[testimonial];

  return (
    <div className="min-h-screen bg-[#F7FCFF]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#022D58] xl:h-[464px]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[47%] xl:w-[46%]">
          <img
            src={IMG.hero}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-full object-cover object-left"
            style={{
              WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 16%)",
              maskImage: "linear-gradient(to right, transparent 0%, #000 16%)",
            }}
          />
          <div className="absolute inset-0 lg:hidden bg-[#022D58]/62" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.05%] relative z-10 pt-12 pb-10 xl:pt-[48px] xl:pb-0">
          <p className="text-[#2BB3A3] text-sm xl:text-[15px] font-bold uppercase tracking-[0.16em]">Devenir coach</p>
          <h1
            className="mt-3 xl:mt-[17px] font-bold text-white text-[clamp(2rem,4.6vw,3rem)] xl:text-[55.5px] leading-[1.12] xl:leading-[56px]"
            style={SERIF}
          >
            Transmettez votre savoir.<br />
            Faites <span className="italic text-[#F5A623]">grandir des potentiels.</span>
          </h1>
          <p className="mt-6 xl:mt-[25px] text-white/90 text-lg xl:text-[22.8px] leading-snug xl:leading-[31px] max-w-[500px] xl:max-w-[600px]">
            Rejoignez Care4Success et accompagnez des apprenants vers leurs objectifs.
          </p>

          <div className="flex flex-wrap gap-4 xl:gap-[21px] mt-8 xl:mt-[37px]">
            <button
              type="button"
              onClick={() => openApply()}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[55px] px-8 xl:px-[34px] rounded-xl xl:rounded-[10px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[16.5px] hover:bg-[#e09520] transition-colors"
            >
              Déposer ma candidature <ArrowRight className="w-4 h-4" />
            </button>
            <NavLink
              to={ROUTE_PATHS.COMMENT_CA_MARCHE}
              className="inline-flex items-center gap-2.5 h-14 xl:h-[55px] px-7 xl:px-[30px] rounded-xl xl:rounded-[10px] border border-white/40 bg-[#0D2D5A]/40 text-white font-semibold xl:text-[16px] hover:bg-white/10 transition-colors"
            >
              <CirclePlay className="w-5 h-5 xl:w-[26px] xl:h-[26px]" strokeWidth={1.5} /> Voir comment ça marche
            </NavLink>
          </div>

          <ul className="flex flex-wrap gap-x-8 xl:gap-x-[30px] gap-y-3 mt-8 xl:mt-[41px]">
            {TRUST.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-sm xl:text-[14px] text-white/90">
                <Icon className="w-6 h-6 xl:w-[27px] xl:h-[27px] text-[#2BB3A3]" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Texte manuscrit + carte des avantages, posés sur la photo */}
        <div className="hidden lg:block absolute right-[5.4%] top-[40px] xl:top-[42px] text-left -rotate-[9deg] origin-left z-10">
          <p className="text-[28px] xl:text-[35px] leading-[1.02] xl:leading-[35px] text-white font-medium" style={HANDWRITING}>
            Votre<br />expertise<br />change<br />des vies
          </p>
          <HandUnderline className="w-[78px] xl:w-[88px] h-3 mt-1 -ml-1" />
        </div>
        <ul className="hidden lg:flex flex-col gap-3 xl:gap-[15px] absolute right-[2.6%] xl:right-[2.34%] top-[204px] xl:top-[221px] w-[200px] xl:w-[212px] rounded-[14px] bg-white p-4 xl:pt-[24px] xl:pb-[23px] xl:px-[20px] z-10">
          {HERO_CARD.map(({ icon: Icon, label }) => (
            <li key={label.join(" ")} className="flex items-center gap-3 xl:gap-[12px]">
              <Icon className="w-6 h-6 xl:w-[31px] xl:h-[31px] text-[#0F9B8E] shrink-0" strokeWidth={1.6} />
              <span className="text-[#0D2D5A] font-bold text-[12px] xl:text-[12.6px] leading-[1.25]">
                {label.map((line, i) => <span key={i} className="block">{line}</span>)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* ══════════ TROIS FAÇONS DE COACHER ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <div className="xl:pl-[22px]">
            <p className={EYEBROW}>Trois façons de coacher</p>
            <h2 className={`${H2} mt-2 xl:mt-[9px]`} style={SERIF}>Partagez vos compétences dans votre domaine.</h2>
            <p className="mt-1.5 xl:mt-[4px] text-[#5C6B80] xl:text-[18.5px]">Choisissez la ou les catégories qui vous correspondent.</p>
          </div>

          <div className="mt-6 xl:mt-[10px] grid grid-cols-1 md:grid-cols-3 gap-5 xl:gap-[22px] xl:[grid-template-columns:305fr_290fr_302fr]">
            {WAYS.map(way => (
              <NavLink
                key={way.key}
                to={way.to}
                aria-label={`Découvrir : ${way.title}`}
                className={`group relative block overflow-hidden rounded-2xl xl:rounded-[16px] border bg-gradient-to-r ${way.bg} ${way.border} p-5 pb-[68px] xl:pt-[8px] xl:pl-[35px] xl:pr-[0px] xl:pb-[22px] min-h-[220px] xl:h-[243px] hover:-translate-y-0.5 transition-transform`}
              >
                <div
                  className="hidden xl:block absolute right-0 top-0"
                  style={{
                    width: way.photo.w, height: way.photo.h + 4,
                    WebkitMaskImage: "linear-gradient(to bottom, #000 78%, transparent 100%)",
                    maskImage: "linear-gradient(to bottom, #000 78%, transparent 100%)",
                  }}
                >
                  <img
                    src={way.photo.src}
                    alt=""
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                    className="block w-full h-full"
                    style={{
                      WebkitMaskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
                      maskImage: "linear-gradient(to right, transparent 0%, #000 22%)",
                    }}
                  />
                </div>

                <div className="relative z-10 xl:pr-[var(--pw)]" style={{ ["--pw" as string]: `${way.photo.w - 22}px` }}>
                  <span className={`w-14 h-14 xl:w-[72px] xl:h-[72px] rounded-full flex items-center justify-center ${way.circle}`} style={{ color: way.iconColor }}>
                    <way.icon className="w-7 h-7 xl:w-[46px] xl:h-[46px]" {...(way.icon === BarsOutline ? {} : { strokeWidth: 1.8 })} />
                  </span>
                  <h3 className="mt-3 xl:mt-[0px] text-xl xl:text-[23px] font-extrabold text-[#0D2D5A] leading-tight">{way.title}</h3>
                  <p className="mt-2 xl:mt-[8px] text-sm xl:text-[16px] leading-relaxed xl:leading-[21px] text-[#4B5A73]">{way.desc}</p>
                </div>

                <span
                  aria-hidden
                  className="absolute right-4 bottom-4 xl:right-[13px] xl:bottom-[10px] w-10 h-10 xl:w-[43px] xl:h-[43px] rounded-full bg-white text-[#0D2D5A] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform z-10"
                >
                  <ArrowRight className="w-4 h-4 xl:w-[19px] xl:h-[19px]" strokeWidth={2.4} />
                </span>
              </NavLink>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMMENT NOUS REJOINDRE ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <div className="xl:pl-[22px]">
            <p className={EYEBROW}>Comment nous rejoindre ?</p>
            <h2 className={`${H2} mt-2 xl:mt-[1px] xl:text-[41.2px]`} style={SERIF}>Un processus clair et équitable.</h2>
            <p className="mt-1.5 xl:mt-[4px] text-[#5C6B80] xl:text-[18.5px]">Nous sélectionnons nos coachs pour garantir une expérience de qualité à nos apprenants.</p>
          </div>

          <ol className="mt-6 xl:mt-[12px] min-[1400px]:-mx-[6px] grid gap-4 sm:grid-cols-2 lg:flex lg:items-stretch lg:gap-0">
            {STEPS.map((step, i) => (
              <li key={step.n} className="contents lg:flex lg:items-center lg:min-w-0" style={{ flex: `${step.fr} 1 0%` }}>
                <div className="flex-1 min-w-0 h-full rounded-xl xl:rounded-[14px] border border-[#0D2D5A]/[0.07] bg-white/45 p-4 xl:pt-[20px] xl:px-[14px] xl:pb-[16px] text-center lg:text-left xl:text-center xl:min-h-[191px]">
                  <div className="flex items-center justify-center gap-3 xl:gap-[14px]">
                    <span
                      className={`w-9 h-9 xl:w-[46px] xl:h-[46px] rounded-full flex items-center justify-center text-sm xl:text-[17px] font-extrabold ${
                        i === STEPS.length - 1 ? "bg-[#0F9B8E] text-white" : "bg-[#DDEFF4] text-[#0B2E6B]"
                      }`}
                    >
                      {step.n}
                    </span>
                    <step.icon
                      className="w-8 h-8 xl:w-[46px] xl:h-[46px] text-[#0F9B8E]"
                      {...(step.icon === CheckFilled ? {} : { strokeWidth: 1.7 })}
                    />
                  </div>
                  <h3 className="mt-3 xl:mt-[16px] font-extrabold text-[#0D2D5A] text-[15px] xl:text-[17.2px] leading-snug">{step.title}</h3>
                  <p className="mt-1.5 xl:mt-[6px] text-[13px] xl:text-[15px] leading-snug xl:leading-[21px] text-[#5C6B80]">{step.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <span className="hidden lg:flex w-6 xl:w-[29px] shrink-0 items-center justify-center text-[#0B2E6B]">
                    <ArrowRight className="w-4 h-4 xl:w-[18px] xl:h-[18px]" strokeWidth={2.2} />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════ POURQUOI DEVENIR COACH ══════════ */}
      <section className="py-10 md:py-12">
        <div className={WRAP}>
          <div className="xl:pl-[22px]">
            <p className={EYEBROW}>Pourquoi devenir coach ?</p>
            <h2 className={`${H2} mt-2 xl:mt-[2px] xl:text-[41.2px]`} style={SERIF}>Plus qu'un travail, un impact.</h2>
          </div>

          <div className="mt-6 xl:mt-[18px] grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6 lg:gap-x-0">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className={`flex items-start gap-4 xl:gap-[18px] ${i === 0 ? "xl:pl-[15px]" : "lg:pl-5 xl:pl-[20px] lg:border-l lg:border-[#0D2D5A]/10"}`}
              >
                <span className={`w-14 h-14 xl:w-[76px] xl:h-[76px] rounded-full flex items-center justify-center shrink-0 ${item.round}`}>
                  <item.icon
                    className="w-6 h-6 xl:w-[40px] xl:h-[40px]"
                    {...(item.icon === Heart ? { fill: "currentColor" } : item.icon === CalendarDays ? { strokeWidth: 1.7 } : {})}
                  />
                </span>
                <div className="xl:pt-[3px]">
                  <p className="font-extrabold text-[#0D2D5A] text-[15px] xl:text-[15.4px] leading-snug">{item.title}</p>
                  <p className="mt-1 xl:mt-[5px] text-sm xl:text-[14.6px] text-[#5C6B80] leading-relaxed xl:leading-[21px] xl:max-w-[196px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ ILS TÉMOIGNENT ══════════ */}
      <section className="py-10 md:py-12">
        <div className={`${WRAP} grid lg:grid-cols-[minmax(0,1fr)_minmax(0,660px)_auto] xl:grid-cols-[471px_638px_1fr] items-center gap-6 xl:gap-0`}>
          <div className="xl:pl-[22px]">
            <p className={EYEBROW}>Ils témoignent</p>
            <h2 className={`${H2} mt-2 xl:mt-[10px] xl:text-[35.5px] xl:leading-[43px] max-w-[440px] xl:max-w-[470px]`} style={SERIF}>
              Des coachs engagés,<br />des parcours inspirants.
            </h2>
          </div>

          <div className="rounded-xl xl:rounded-[14px] border border-[#0D2D5A]/8 bg-white p-4 xl:py-[20px] xl:px-[22px] flex items-center gap-4 xl:gap-[20px]">
            <img
              src={IMG.avatar}
              alt=""
              onError={(e) => { e.currentTarget.style.display = "none"; }}
              className="w-16 h-16 xl:w-[105px] xl:h-[105px] rounded-full object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[#3E4C66] text-sm xl:text-[16px] leading-relaxed xl:leading-[23px]">« {current.quote} »</p>
              <p className="mt-2 xl:mt-[9px] flex flex-wrap items-center gap-x-3 gap-y-1 xl:gap-[14px]">
                <span className="font-extrabold text-[#0D2D5A] text-sm xl:text-[15px] whitespace-nowrap">{current.role}</span>
                <span className="flex gap-0.5">
                  {Array.from({ length: current.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 xl:w-[18px] xl:h-[18px] fill-[#F5A623] text-[#F5A623]" />
                  ))}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 xl:gap-[16px] justify-self-end min-[1400px]:-mr-[33px]">
            {[
              { icon: ChevronLeft, label: "Témoignage précédent", step: -1 },
              { icon: ChevronRight, label: "Témoignage suivant", step: 1 },
            ].map(({ icon: Icon, label, step }) => (
              <button
                key={label}
                type="button"
                aria-label={label}
                onClick={() => setTestimonial(t => (t + step + TESTIMONIALS.length) % TESTIMONIALS.length)}
                className="w-10 h-10 xl:w-[43px] xl:h-[43px] rounded-full bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] flex items-center justify-center hover:bg-[#F0F5FA] transition-colors"
              >
                <Icon className="w-4 h-4 xl:w-[19px] xl:h-[19px]" strokeWidth={2.4} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative py-10 md:py-11 xl:py-0 xl:h-[211px] bg-[#012650] overflow-hidden">
        <div className="hidden xl:block absolute top-[42px] left-[31px] w-[112px] h-[112px] rounded-full bg-[#0F9B8E]/20 pointer-events-none" />
        <div className="hidden xl:block absolute top-[62px] left-0 w-[166px] h-[166px] rounded-full bg-[#8A8467]/30 pointer-events-none" />
        <div className="absolute -top-[60px] -right-[20px] w-[200px] h-[200px] rounded-full bg-[#1A6CC8]/12 pointer-events-none" />
        <div className="hidden xl:block absolute top-[78px] right-[48px] w-[120px] h-[120px] rounded-full bg-[#8A8467]/30 pointer-events-none" />

        <div className="mx-auto max-w-[947px] px-6 min-[1400px]:px-0 relative z-10 xl:pt-[26px]">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
            <div className="max-w-xl xl:max-w-[700px]">
              <h2 className="text-3xl md:text-[38px] xl:text-[38.8px] font-bold text-white leading-tight xl:leading-[1.15]" style={SERIF}>
                Prêt à transmettre ce que <span className="italic text-[#F5A623]">vous savez</span>&nbsp;?
              </h2>
              <p className="text-blue-100/85 mt-3 xl:mt-[8px] xl:text-[19.2px] xl:leading-[26px] xl:max-w-[640px]">
                Rejoignez une communauté de coachs engagés et faites la différence.
              </p>
              <div className="flex flex-wrap gap-4 xl:gap-[21px] mt-7 xl:mt-[24px]">
                <button
                  type="button"
                  onClick={() => openApply()}
                  className="inline-flex items-center gap-2 h-12 xl:h-[55px] px-7 xl:px-[30px] rounded-xl xl:rounded-[11px] bg-[#F5A623] text-[#0D2D5A] font-extrabold xl:text-[17.8px] hover:bg-[#e09520] transition-colors"
                >
                  Déposer ma candidature <ArrowRight className="w-4 h-4" />
                </button>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="inline-flex items-center h-12 xl:h-[55px] px-7 xl:px-[30px] rounded-xl xl:rounded-[11px] border border-white/45 text-white font-semibold xl:text-[17.8px] hover:bg-white/10 transition-colors"
                >
                  Une question ? Nous contacter
                </NavLink>
              </div>
            </div>

            <div className="hidden md:block -rotate-[12deg] shrink-0 xl:mt-[22px] xl:-mr-[62px]">
              <p className="text-[28px] xl:text-[29px] leading-[1.1] xl:leading-[1.2] text-white font-medium" style={HANDWRITING}>
                Ensemble,<br />révélons les talents<br />de demain
              </p>
              <HandUnderline className="w-[88px] h-3 mt-1 xl:mt-[8px] ml-16" />
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ FORMULAIRE DE CANDIDATURE ══════════ */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto">
          {completed ? (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-12 h-12 mx-auto text-[#0F9B8E] mb-4" />
              <DialogTitle className="text-xl font-bold text-[#0D2D5A] mb-2">Merci pour votre candidature !</DialogTitle>
              <DialogDescription className="text-gray-500">Notre équipe vous contacte sous 48h.</DialogDescription>
              <Button className="mt-6 bg-[#0D2D5A] hover:bg-[#0B2545]" onClick={() => setOpen(false)}>Fermer</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-[#0D2D5A] text-lg font-bold">Candidatez maintenant</DialogTitle>
                <DialogDescription>Notre équipe vous contacte sous 48h.</DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nom">Nom</Label>
                  <Input id="nom" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="votre@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" placeholder="+237 6XX XXX XXX" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Verticale souhaitée</Label>
                  <Select value={verticale} onValueChange={setVerticale}>
                    <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                    <SelectContent>
                      {VERTICALES.map(v => <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Pays</Label>
                  <Select value={pays} onValueChange={setPays}>
                    <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                    <SelectContent>
                      {PAYS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="motivation">Expérience et motivation</Label>
                <Textarea
                  id="motivation"
                  rows={4}
                  placeholder="Décrivez votre parcours d'enseignement..."
                  value={motivation}
                  onChange={e => setMotivation(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={mutation.isPending}
                className="w-full bg-[#0D2D5A] hover:bg-[#0B2545] text-white h-12 text-base font-bold"
              >
                {mutation.isPending ? "Envoi en cours..." : "Envoyer ma candidature"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
