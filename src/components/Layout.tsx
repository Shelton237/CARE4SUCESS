import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ChevronRight, ChevronDown, Home as HomeIcon, User } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_MAIN = [
  { to: ROUTE_PATHS.HOME,               label: "Accueil" },
  { to: ROUTE_PATHS.SERVICES,            label: "Soutien scolaire" },
  { to: ROUTE_PATHS.COURS_DE_LANGUES,    label: "Langues" },
  { to: ROUTE_PATHS.COMPETENCES,         label: "Compétences" },
  { to: ROUTE_PATHS.COMMENT_CA_MARCHE,   label: "Comment ça marche" },
  { to: ROUTE_PATHS.DEVENIR_PROFESSEUR,  label: "Devenir coach" },
  { to: ROUTE_PATHS.FAQ,                  label: "FAQ" },
];

// Réseaux sociaux du pied de page. Renseigner les URL officielles : tant
// qu'une valeur est "#", l'icône est affichée mais ne mène nulle part.
const SocialSvg = ({ children }: { children: React.ReactNode }) => (
  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor" aria-hidden>{children}</svg>
);
const SOCIAL_LINKS = [
  {
    label: "LinkedIn", href: "#",
    icon: () => (
      <SocialSvg>
        <path d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3zm-.4 8v9.2h3V10h-3zm1.5-4.4a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4zM10 10v9.2h3v-4.7c0-1.3.6-2.1 1.7-2.1 1 0 1.5.7 1.5 2.1v4.7h3v-5.4c0-2.5-1.3-3.9-3.3-3.9-1.3 0-2.2.6-2.8 1.5V10H10z" fillRule="evenodd" />
      </SocialSvg>
    ),
  },
  {
    label: "Facebook", href: "#",
    icon: () => (
      <SocialSvg>
        <path d="M5 2h14a3 3 0 0 1 3 3v14a3 3 0 0 1-3 3h-4.2v-7.4h2.5l.4-3h-2.9V9.7c0-.9.3-1.5 1.5-1.5h1.5V5.5c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V22H5a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3z" />
      </SocialSvg>
    ),
  },
  {
    label: "Instagram", href: "#",
    icon: () => (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4.2" />
        <circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "YouTube", href: "#",
    icon: () => (
      <SocialSvg>
        <path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2C2 8.8 2 12 2 12s0 3.2.4 4.8a2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8c.4-1.6.4-4.8.4-4.8s0-3.2-.4-4.8zM10 15V9l5.2 3L10 15z" fillRule="evenodd" />
      </SocialSvg>
    ),
  },
];

function FlagFR() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 rounded-full shrink-0" aria-hidden>
      <rect width="8" height="24" fill="#0055A4" />
      <rect x="8" width="8" height="24" fill="#fff" />
      <rect x="16" width="8" height="24" fill="#EF4135" />
    </svg>
  );
}

// Sélecteur de langue : le site n'est disponible qu'en français pour l'instant.
function LanguageSelector() {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 text-xs text-blue-100/80 hover:text-white transition-colors"
      >
        <FlagFR /> <span className="font-semibold">FR</span> <ChevronDown className="w-3.5 h-3.5" />
      </button>
      {open && (
        <ul role="listbox" className="absolute right-0 bottom-full mb-2 w-40 rounded-lg bg-white text-[#0D2D5A] text-xs shadow-lg py-1 z-10">
          <li role="option" aria-selected className="px-3 py-2 font-semibold flex items-center gap-2"><FlagFR /> Français</li>
          <li role="option" aria-disabled className="px-3 py-2 text-gray-400">English (bientôt)</li>
        </ul>
      )}
    </div>
  );
}

// Libellés du fil d'Ariane par route statique. Les routes dynamiques
// (/professeurs/:id, /cours-groupe/:id) sont gérées à part car leur
// dernier segment n'est pas un libellé lisible.
const BREADCRUMB_LABELS: Record<string, string> = {
  [ROUTE_PATHS.SERVICES]: "Services",
  [ROUTE_PATHS.NIVEAUX]: "Niveaux",
  [ROUTE_PATHS.PROFESSEURS]: "Trouver un coach",
  [ROUTE_PATHS.ANNUAIRE_COACHS]: "Nos coachs",
  [ROUTE_PATHS.DEVENIR_PROFESSEUR]: "Devenir coach",
  [ROUTE_PATHS.COMMENT_CA_MARCHE]: "Comment ça marche",
  [ROUTE_PATHS.FAQ]: "FAQ",
  [ROUTE_PATHS.COMPETENCES]: "Compétences et carrière",
  "/recrutement": "Devenir coach",
  [ROUTE_PATHS.CONTACT]: "Contact",
  "/inscription": "Inscription",
  [ROUTE_PATHS.A_PROPOS]: "À propos",
  [ROUTE_PATHS.POLITIQUE_CONFIDENTIALITE]: "Politique de confidentialité",
};

function getBreadcrumbTrail(pathname: string): { label: string; to?: string }[] {
  if (pathname === ROUTE_PATHS.HOME) return [];

  if (pathname.startsWith("/professeurs/")) {
    return [
      { label: "Nos coachs", to: ROUTE_PATHS.ANNUAIRE_COACHS },
      { label: "Profil du coach" },
    ];
  }
  if (pathname.startsWith("/cours-groupe/")) {
    return [{ label: "Cours groupé" }];
  }
  if (pathname === ROUTE_PATHS.EVALUATION_GRATUITE) {
    return [
      { label: "Trouver un coach", to: ROUTE_PATHS.PROFESSEURS },
      { label: "Évaluation gratuite" },
    ];
  }
  if (pathname === ROUTE_PATHS.COACHS_LANGUES) {
    return [
      { label: "Langues", to: ROUTE_PATHS.COURS_DE_LANGUES },
      { label: "Nos coachs de langue" },
    ];
  }

  const label = BREADCRUMB_LABELS[pathname];
  if (label) return [{ label }];

  return [{ label: "Page introuvable" }];
}

// Pages avec un hero photo : elles importent Breadcrumb et le placent
// elles-mêmes juste en dessous de leur section hero, donc le rendu global
// de Layout est sauté sur ces routes pour ne pas le dupliquer au-dessus du hero.
const SELF_RENDERED_BREADCRUMB_ROUTES = new Set<string>([
  ROUTE_PATHS.SERVICES,
  ROUTE_PATHS.NIVEAUX,
  ROUTE_PATHS.PROFESSEURS,
  ROUTE_PATHS.ANNUAIRE_COACHS,
  ROUTE_PATHS.COURS_DE_LANGUES,
  ROUTE_PATHS.COACHS_LANGUES,
  ROUTE_PATHS.DEVENIR_PROFESSEUR,
  "/recrutement",
  ROUTE_PATHS.COMMENT_CA_MARCHE,
  ROUTE_PATHS.FAQ,
  ROUTE_PATHS.COMPETENCES,
  ROUTE_PATHS.CONTACT,
  ROUTE_PATHS.EVALUATION_GRATUITE,
  ROUTE_PATHS.A_PROPOS,
]);

export function Breadcrumb() {
  const { pathname } = useLocation();
  const trail = getBreadcrumbTrail(pathname);
  if (trail.length === 0) return null;

  return (
    <div className="bg-[#F4F2ED] border-t border-[#0D2D5A]/5">
      <div className="container mx-auto px-6 max-w-5xl py-4">
        <nav aria-label="Fil d'Ariane" className="flex items-center flex-wrap gap-2 text-sm font-semibold text-[#0D2D5A]/60">
          <NavLink to={ROUTE_PATHS.HOME} className="flex items-center gap-1.5 hover:text-[#0D2D5A] transition-colors">
            <HomeIcon className="w-4 h-4" /> Accueil
          </NavLink>
          {trail.map((item, i) => (
            <span key={item.label} className="flex items-center gap-2">
              <ChevronRight className="w-3.5 h-3.5 text-[#0D2D5A]/30" />
              {item.to ? (
                <NavLink to={item.to} className="hover:text-[#0D2D5A] transition-colors">
                  {item.label}
                </NavLink>
              ) : (
                <span className={i === trail.length - 1 ? "text-[#0D2D5A]" : ""}>{item.label}</span>
              )}
            </span>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── NAVBAR ── */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 bg-[#F8F8F7] ${
        scrolled ? "shadow-lg shadow-[#0D2D5A]/8" : ""
      }`}>
        <div className="mx-auto w-full max-w-[1920px] px-6 xl:pl-[6.05%] xl:pr-[4.8%]">
          <div className="flex items-center h-20 xl:h-[69px]">

            {/* Logo */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center shrink-0">
              <img
                src="/logo/Care 4 Success-logo-Ok_compact.png"
                alt="Care4Success"
                className="h-12 xl:h-[70px] w-auto object-contain -ml-[3px]"
              />
            </NavLink>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center ml-2 xl:max-[1399px]:ml-6 min-[1400px]:ml-[6.9%]">
              {NAV_MAIN.map(link => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `mx-1 xl:max-[1399px]:mx-2 min-[1400px]:mx-[11.3px] py-1.5 text-[12px] xl:text-[12.5px] font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
                      isActive
                        ? "text-[#0D2D5A] border-[#F5A623]"
                        : "text-[#0D2D5A] border-transparent hover:text-[#0D2D5A]/80"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* CTA desktop */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-[13px] ml-auto pl-1 xl:pl-2">
              <NavLink
                to="/login"
                className="h-10 xl:h-[42px] px-2.5 xl:px-[22px] rounded-lg bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] text-[12.5px] xl:text-[13.6px] font-semibold flex items-center gap-2 hover:bg-white/70 transition-colors"
              >
                <User className="w-4 h-4" /> Connexion
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.PROFESSEURS}
                className="h-10 xl:h-[42px] px-2.5 xl:px-[24px] rounded-lg bg-[#F5A623] text-[#0D2D5A] text-[13px] xl:text-[14.4px] font-bold text-center leading-tight hover:bg-[#e09520] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
              >
                Trouver mon coach <ArrowRight className="w-4 h-4" />
              </NavLink>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0D2D5A] hover:bg-white/60 transition-colors ml-auto cursor-pointer"
              aria-label="Menu"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-[#0D2D5A]/10 bg-[#F8F8F7]"
            >
              <nav className="container mx-auto px-4 py-4 space-y-1">
                {NAV_MAIN.map(link => (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    onClick={close}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-[#0D2D5A] text-white" : "text-[#0D2D5A] hover:bg-white/60"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="pt-3 border-t border-[#0D2D5A]/10 space-y-2">
                  <NavLink to="/login" onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] cursor-pointer">
                    <User className="w-4 h-4" /> Connexion
                  </NavLink>
                  <NavLink to={ROUTE_PATHS.PROFESSEURS} onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#F5A623] text-[#0D2D5A] hover:bg-[#e09520] transition-colors cursor-pointer">
                    Trouver mon coach <ArrowRight className="w-4 h-4" />
                  </NavLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {!SELF_RENDERED_BREADCRUMB_ROUTES.has(pathname) && !pathname.startsWith("/professeurs/") && <Breadcrumb />}

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#072345] text-white" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>
        <div className="mx-auto w-full max-w-[1920px] px-6 xl:px-[5%] pt-10 xl:pt-[26px]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_auto] xl:grid-cols-[368fr_241fr_246fr_244fr_202fr] gap-x-6 gap-y-8 xl:gap-x-0">

            {/* Marque */}
            <div className="xl:pl-[15px]">
              <img
                src="/logo/care4success-compact-white.png"
                alt="Care4Success"
                className="h-16 xl:h-[75px] w-auto object-contain mb-2.5 xl:mb-[8px] xl:-mt-[5px] xl:-ml-[5px]"
              />
              <p className="text-[13.5px] text-white/90 leading-[23px]">Every genius needs a coach.</p>
              <p className="text-[13.1px] text-[#A9C1E3] leading-[22px] mt-1.5 xl:mt-[5px] max-w-[266px]">
                Une plateforme de coaching panafricaine par USRA-CARE.
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-5">
                {[
                  { label: "Orange Money", logo: "/payment-icons/orange-money.png" },
                  { label: "MTN MoMo", logo: "/payment-icons/mtn-momo.png" },
                  { label: "MVola", logo: "/payment-icons/mvola.png" },
                  { label: "Visa", logo: "/payment-icons/visa.svg" },
                  { label: "Mastercard", logo: "/payment-icons/mastercard.png" },
                ].map(({ label, logo }) => (
                  <span key={label} className="h-12 flex items-center">
                    <img src={logo} alt={label} className="h-12 w-auto object-contain" />
                  </span>
                ))}
              </div>
            </div>

            {/* Parents */}
            <div>
              <h3 className="text-[13.7px] font-extrabold text-[#F5A623] mb-3 xl:mb-[11px] uppercase tracking-[0.1em]">Parents</h3>
              <ul className="space-y-2.5 xl:space-y-[11px]">
                {[
                  { label: "Évaluation gratuite", to: ROUTE_PATHS.EVALUATION_GRATUITE },
                  { label: "Suivi de progression", to: ROUTE_PATHS.SERVICES },
                  { label: "Comment ça marche", to: ROUTE_PATHS.COMMENT_CA_MARCHE },
                  { label: "FAQ", to: ROUTE_PATHS.FAQ },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Apprenants */}
            <div>
              <h3 className="text-[13.7px] font-extrabold text-[#F5A623] mb-3 xl:mb-[11px] uppercase tracking-[0.1em]">Apprenants</h3>
              <ul className="space-y-2.5 xl:space-y-[11px]">
                {[
                  { label: "Cours de langues", to: ROUTE_PATHS.COURS_DE_LANGUES },
                  { label: "Compétences pro", to: ROUTE_PATHS.COMPETENCES },
                  { label: "Nos coachs", to: ROUTE_PATHS.ANNUAIRE_COACHS },
                  { label: "FAQ", to: "/faq?cat=langues" },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coachs */}
            <div>
              <h3 className="text-[13.7px] font-extrabold text-[#F5A623] mb-3 xl:mb-[11px] uppercase tracking-[0.1em]">Coachs</h3>
              <ul className="space-y-2.5 xl:space-y-[11px]">
                <li>
                  <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">
                    Devenir coach
                  </NavLink>
                </li>
                <li><a href="#" className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">Nos critères</a></li>
                <li><NavLink to="/faq?cat=devenir-coach" className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">FAQ coachs</NavLink></li>
                <li>
                  <a href="mailto:contact@care4success.com" className="block text-[14.5px] text-white/90 leading-5 hover:text-[#F5A623] transition-colors">
                    contact@care4success.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Nous suivre */}
            <div className="lg:border-l lg:border-white/12 xl:pl-[41px] lg:pl-8 xl:h-[143px] xl:self-start">
              <h3 className="text-[14.3px] font-semibold text-white mb-3 xl:mb-[16px]">Nous suivre</h3>
              <div className="flex items-center gap-4 xl:gap-[13px]">
                {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-white hover:text-[#F5A623] transition-colors"
                  >
                    <Icon />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/12 mt-6 xl:mt-[23px] pt-5 xl:pt-[23px] pb-6 xl:pb-[30px] flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-[13.4px] text-[#7F9CC7]">© 2026 Care4Success · USRA-CARE</p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 xl:gap-x-[26px] text-[13.4px] text-[#7F9CC7]">
              <a href="#" className="hover:text-[#F5A623] transition-colors">CGU</a>
              <NavLink to={ROUTE_PATHS.POLITIQUE_CONFIDENTIALITE} className="hover:text-[#F5A623] transition-colors">Confidentialité</NavLink>
              <a href="#" className="hover:text-[#F5A623] transition-colors">Remboursements</a>
              <LanguageSelector />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
