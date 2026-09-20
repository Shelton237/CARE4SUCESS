import { useMemo, useState } from "react";
import { NavLink, useSearchParams } from "react-router-dom";
import { ArrowRight, Headphones, Mail, MessageSquare, Minus, Plus, Search } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { FAQ_CATEGORIES } from "./faqData";

/* Photo du hero : remplacer public/images/faq/hero-faq.jpg (paysage, idéalement
   1600 px de large ou plus). Le fichier actuel est provisoire : c'est un extrait de
   la photo de l'accueil. */
const HERO_PHOTO = "/images/faq/hero-faq.jpg";

const SERIF = { fontFamily: "'Playfair Display', serif" };
const HANDWRITING = { fontFamily: "Caveat, cursive" };

const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function ChatIllustration() {
  return (
    <svg viewBox="0 0 220 220" className="w-full h-full" aria-hidden>
      <circle cx="110" cy="110" r="108" fill="#F1F8F8" />
      <g transform="translate(22 108)">
        <rect x="0" y="0" width="96" height="66" rx="20" fill="#CFEDEA" />
        <path d="M22 62 L14 86 L42 64 Z" fill="#CFEDEA" />
        <circle cx="30" cy="33" r="6" fill="#fff" /><circle cx="48" cy="33" r="6" fill="#fff" /><circle cx="66" cy="33" r="6" fill="#fff" />
      </g>
      <g transform="translate(74 34)">
        <rect x="0" y="0" width="118" height="80" rx="24" fill="#0B2E6B" />
        <path d="M78 76 L98 104 L100 74 Z" fill="#0B2E6B" />
        <circle cx="38" cy="40" r="7.5" fill="#fff" /><circle cx="60" cy="40" r="7.5" fill="#fff" /><circle cx="82" cy="40" r="7.5" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Faq() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("cat");
  const activeId = FAQ_CATEGORIES.some(c => c.id === requested) ? requested! : FAQ_CATEGORIES[0].id;
  const active = FAQ_CATEGORIES.find(c => c.id === activeId)!;

  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(`${FAQ_CATEGORIES[0].id}:0`);

  const searching = query.trim().length > 0;
  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return [];
    return FAQ_CATEGORIES.flatMap(cat =>
      cat.items
        .map((item, index) => ({ cat, item, index }))
        .filter(({ item }) => normalize(item.q).includes(q) || normalize(item.a).includes(q))
    );
  }, [query]);

  const selectCategory = (id: string) => {
    setParams(id === FAQ_CATEGORIES[0].id ? {} : { cat: id }, { replace: true });
    setQuery("");
    setOpenKey(`${id}:0`);
  };

  const rows = searching
    ? results.map(({ cat, item, index }) => ({ key: `${cat.id}:${index}`, q: item.q, a: item.a, tag: cat.label }))
    : active.items.map((item, index) => ({ key: `${active.id}:${index}`, q: item.q, a: item.a, tag: null as string | null }));

  return (
    <div className="min-h-screen bg-[#F7FAFC]" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>

      {/* ══════════ HERO ══════════ */}
      <section className="relative overflow-hidden bg-[#0B2A55] xl:h-[432px]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[52%]">
          <img
            src={HERO_PHOTO}
            alt=""
            onError={(e) => { e.currentTarget.style.display = "none"; }}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2A55] via-[#0B2A55]/35 md:via-[#0B2A55]/10 to-transparent" />
          <div className="absolute inset-0 md:hidden bg-[#0B2A55]/60" />
        </div>

        <div className="mx-auto max-w-[1920px] px-6 xl:pl-[6.15%] relative z-10 pt-12 pb-14 xl:pt-[58px] xl:pb-0">
          <p className="text-[#2BB3A3] text-sm xl:text-[15px] font-bold uppercase tracking-[0.18em]">FAQ</p>
          <h1
            className="mt-3 xl:mt-[14px] font-bold text-[clamp(2.6rem,5vw,4rem)] xl:text-[62px] leading-[1.06] xl:leading-[66px]"
            style={SERIF}
          >
            <span className="block text-white">Vos questions,</span>
            <span className="block text-[#F5A623]">nos réponses.</span>
          </h1>
          <p className="mt-5 xl:mt-[22px] text-white/90 text-lg xl:text-[22.5px] leading-snug xl:leading-[34px] max-w-[440px] xl:max-w-[600px]">
            Tout ce que vous devez savoir sur Care4Success,<br className="hidden md:block" /> au même endroit.
          </p>

          <label className="mt-7 xl:mt-[32px] flex items-center gap-3 h-14 xl:h-[66px] max-w-[593px] rounded-xl xl:rounded-[14px] bg-white px-5 xl:px-[24px] shadow-sm">
            <Search className="w-5 h-5 xl:w-[24px] xl:h-[24px] text-[#1A6CC8] shrink-0" strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une question..."
              aria-label="Rechercher une question"
              className="flex-1 min-w-0 bg-transparent outline-none text-[#0D2D5A] placeholder:text-gray-400 text-base xl:text-[18px]"
            />
          </label>
        </div>

        <div className="hidden md:block absolute right-[4.5%] top-[55px] xl:top-[54px] text-right -rotate-[13deg] origin-right z-10">
          <p className="text-[34px] xl:text-[38px] leading-[1.12] text-white font-medium" style={HANDWRITING}>
            Des réponses<br />pour avancer<br />en toute<br />confiance
          </p>
          <svg viewBox="0 0 120 12" className="w-[105px] h-3 ml-auto -mt-0.5" aria-hidden>
            <path d="M2 9 C 30 2, 80 2, 118 5" stroke="#F5A623" strokeWidth="3" strokeLinecap="round" fill="none" />
          </svg>
        </div>
      </section>

      {/* ══════════ QUESTIONS ══════════ */}
      <section className="py-10 md:py-12">
        <div className="mx-auto w-full max-w-[1286px] px-6 min-[1400px]:px-0 grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,330px)_minmax(0,1fr)] xl:grid-cols-[368px_minmax(0,1fr)] gap-8 lg:gap-0">

          {/* Catégories */}
          <nav aria-label="Catégories" className="min-w-0 lg:border-r lg:border-[#0D2D5A]/10 lg:pr-5 xl:pr-[22px]">
            <ul className="flex lg:flex-col gap-2 lg:gap-0 overflow-x-auto lg:overflow-visible -mx-6 px-6 lg:mx-0 lg:px-0 pb-2 lg:pb-0">
              {FAQ_CATEGORIES.map(cat => {
                const isActive = !searching && cat.id === activeId;
                return (
                  <li key={cat.id} className="shrink-0 lg:shrink">
                    <button
                      type="button"
                      onClick={() => selectCategory(cat.id)}
                      aria-current={isActive ? "true" : undefined}
                      className={`w-full flex items-center gap-3 xl:gap-[20px] text-left rounded-xl border transition-colors px-4 py-3 lg:py-0 lg:h-[76px] xl:h-[104px] xl:px-[22px] ${
                        isActive
                          ? "bg-[#DDF3EF] border-[#BFE6E0]"
                          : "bg-white lg:bg-transparent border-[#0D2D5A]/10 lg:border-transparent hover:bg-white"
                      }`}
                    >
                      <cat.icon className="w-6 h-6 xl:w-[36px] xl:h-[36px] text-[#0D2D5A] shrink-0" strokeWidth={1.7} />
                      <span className="min-w-0">
                        <span className="block font-extrabold text-[#0D2D5A] text-sm lg:text-[15px] xl:text-[18px] leading-tight whitespace-nowrap lg:whitespace-normal">{cat.label}</span>
                        <span className="hidden lg:block text-[13px] xl:text-[15.5px] text-[#5C6B80] mt-0.5 xl:mt-1 leading-snug">{cat.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Liste des questions */}
          <div className="lg:pl-10 xl:pl-[46px]">
            <p className="text-[#0F9B8E] text-xs xl:text-[14.5px] font-bold uppercase tracking-[0.18em]">
              {searching ? "Recherche" : active.label}
            </p>
            <h2 className="mt-2 xl:mt-[8px] text-3xl md:text-4xl xl:text-[42px] font-bold text-[#0D2D5A] leading-tight" style={SERIF}>
              {searching ? "Résultats de la recherche" : "Questions fréquentes"}
            </h2>
            <p className="mt-1.5 xl:mt-[8px] text-[#5C6B80] xl:text-[19px]">
              {searching
                ? `${results.length} résultat${results.length > 1 ? "s" : ""} pour « ${query.trim()} »`
                : active.intro}
            </p>

            <div className="mt-6 xl:mt-[28px] space-y-2.5 xl:space-y-[7px]">
              {rows.length === 0 && (
                <div className="rounded-xl border border-[#0D2D5A]/10 bg-white p-6 text-[#5C6B80]">
                  Aucune question ne correspond à votre recherche. Essayez d'autres mots ou{" "}
                  <NavLink to={ROUTE_PATHS.CONTACT} className="font-bold text-[#0D2D5A] underline underline-offset-2">contactez-nous</NavLink>.
                </div>
              )}
              {rows.map(row => {
                const open = openKey === row.key;
                return (
                  <div
                    key={row.key}
                    className={`rounded-xl xl:rounded-[14px] border transition-colors ${open ? "bg-[#EAF2FB] border-[#C9DDF3]" : "bg-white border-[#0D2D5A]/10"}`}
                  >
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenKey(open ? null : row.key)}
                        aria-expanded={open}
                        className="w-full flex items-center justify-between gap-4 text-left px-5 xl:px-[24px] py-4 xl:py-[16px]"
                      >
                        <span className="min-w-0">
                          {row.tag && <span className="block text-[11px] font-bold uppercase tracking-[0.14em] text-[#0F9B8E] mb-0.5">{row.tag}</span>}
                          <span className="font-bold text-[#0D2D5A] text-[15px] xl:text-[18px] leading-snug">{row.q.replace(/ \?$/, " ?")}</span>
                        </span>
                        {open
                          ? <Minus className="w-5 h-5 xl:w-[24px] xl:h-[24px] text-[#0D2D5A] shrink-0" strokeWidth={2.2} />
                          : <Plus className="w-5 h-5 xl:w-[24px] xl:h-[24px] text-[#0D2D5A] shrink-0" strokeWidth={2.2} />}
                      </button>
                    </h3>
                    {open && (
                      <p className="px-5 xl:px-[24px] pb-5 xl:pb-[20px] -mt-1 text-[#4B5A73] text-sm xl:text-[16.2px] leading-relaxed xl:leading-[26px] xl:pr-[60px]">
                        {row.a}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ CONTACT ══════════ */}
      <section className="pb-10 md:pb-12">
        <div className="mx-auto w-full max-w-[1334px] px-6 min-[1400px]:px-0">
          <div className="rounded-2xl xl:rounded-[18px] bg-gradient-to-r from-[#DFF3F0] via-[#E8F6F4] to-[#EEF8F8] p-6 md:p-8 xl:pl-[33px] xl:pr-[40px] xl:py-[38px] grid grid-cols-[minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_minmax(0,330px)] xl:grid-cols-[minmax(0,1fr)_372px] gap-8 lg:gap-0">
            <div className="grid md:grid-cols-[minmax(0,1fr)_170px] xl:grid-cols-[minmax(0,1fr)_214px] items-center gap-6 lg:pr-8">
              <div>
                <p className="text-[#0F9B8E] text-xs xl:text-[14.5px] font-bold uppercase tracking-[0.18em]">Vous ne trouvez pas la réponse ?</p>
                <h2 className="mt-2 xl:mt-[8px] text-[28px] md:text-4xl xl:text-[41px] font-bold text-[#0D2D5A] leading-tight" style={SERIF}>
                  Nous sommes là pour vous aider.
                </h2>
                <p className="mt-3 xl:mt-[12px] text-[#3E4C66] xl:text-[19px]">
                  <b className="text-[#0D2D5A]">Notre équipe</b> est <b className="text-[#0D2D5A]">à votre écoute</b> pour répondre à toutes vos questions.
                </p>
                <NavLink
                  to={ROUTE_PATHS.CONTACT}
                  className="mt-6 xl:mt-[26px] inline-flex items-center gap-3 h-12 xl:h-[59px] px-7 xl:px-[38px] rounded-lg xl:rounded-[10px] bg-[#0B2E6B] text-white font-bold xl:text-[18px] hover:bg-[#0a2555] transition-colors"
                >
                  Nous contacter <ArrowRight className="w-4 h-4 xl:w-[18px] xl:h-[18px]" />
                </NavLink>
              </div>
              <div className="hidden md:block w-[170px] h-[170px] xl:w-[214px] xl:h-[214px] justify-self-end">
                <ChatIllustration />
              </div>
            </div>

            <ul className="lg:border-l lg:border-[#0D2D5A]/10 lg:pl-8 xl:pl-[34px] flex flex-col justify-center gap-5 xl:gap-[26px]">
              {[
                { icon: Mail, title: "Par email", sub: "contact@care4success.com", href: "mailto:contact@care4success.com" },
                { icon: MessageSquare, title: "Via notre formulaire", sub: "Réponse sous 24h", href: ROUTE_PATHS.CONTACT },
                { icon: Headphones, title: "Assistance en ligne", sub: "Lun - Sam, 8h - 18h (GMT+1)", href: null },
              ].map(row => {
                const body = (
                  <>
                    <span className="w-14 h-14 xl:w-[70px] xl:h-[70px] rounded-full bg-white flex items-center justify-center shrink-0">
                      <row.icon className="w-6 h-6 xl:w-[30px] xl:h-[30px] text-[#0B2E6B]" strokeWidth={1.7} />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-extrabold text-[#0D2D5A] xl:text-[18px] leading-tight">{row.title}</span>
                      <span className="block text-[#5C6B80] text-sm xl:text-[16.5px] mt-0.5 break-words">{row.sub}</span>
                    </span>
                  </>
                );
                return (
                  <li key={row.title}>
                    {row.href ? (
                      row.href.startsWith("mailto:")
                        ? <a href={row.href} className="flex items-center gap-4 xl:gap-[20px] hover:opacity-80 transition-opacity">{body}</a>
                        : <NavLink to={row.href} className="flex items-center gap-4 xl:gap-[20px] hover:opacity-80 transition-opacity">{body}</NavLink>
                    ) : (
                      <div className="flex items-center gap-4 xl:gap-[20px]">{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
