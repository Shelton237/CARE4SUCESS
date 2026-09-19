import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, ChevronRight, ChevronDown, Home as HomeIcon, User, Linkedin, Facebook, Instagram, Youtube } from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_MAIN = [
  { to: ROUTE_PATHS.HOME,               label: "Accueil" },
  { to: ROUTE_PATHS.SERVICES,            label: "Soutien scolaire" },
  { to: ROUTE_PATHS.COURS_DE_LANGUES,    label: "Langues" },
  { to: ROUTE_PATHS.COMMENT_CA_MARCHE,   label: "Comment ça marche" },
  { to: ROUTE_PATHS.DEVENIR_PROFESSEUR,  label: "Devenir coach" },
  { to: ROUTE_PATHS.TARIFS,              label: "Tarifs" },
  { to: "#",                             label: "FAQ" },
];

// Réseaux sociaux du pied de page. Renseigner les URL officielles : tant
// qu'une valeur est "#", l'icône est affichée mais ne mène nulle part.
const SOCIAL_LINKS = [
  { label: "LinkedIn",  icon: Linkedin,  href: "#" },
  { label: "Facebook",  icon: Facebook,  href: "#" },
  { label: "Instagram", icon: Instagram, href: "#" },
  { label: "YouTube",   icon: Youtube,   href: "#" },
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
  "/recrutement": "Devenir coach",
  [ROUTE_PATHS.CONTACT]: "Contact",
  "/inscription": "Inscription",
  [ROUTE_PATHS.A_PROPOS]: "À propos",
  [ROUTE_PATHS.TARIFS]: "Tarifs",
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
  if (pathname === ROUTE_PATHS.COURS_DE_LANGUES) {
    return [
      { label: "Trouver un coach", to: ROUTE_PATHS.PROFESSEURS },
      { label: "Cours de langues" },
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
  ROUTE_PATHS.DEVENIR_PROFESSEUR,
  "/recrutement",
  ROUTE_PATHS.COMMENT_CA_MARCHE,
  ROUTE_PATHS.CONTACT,
  ROUTE_PATHS.EVALUATION_GRATUITE,
  ROUTE_PATHS.A_PROPOS,
  ROUTE_PATHS.TARIFS,
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
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 bg-[#F4F2ED] ${
        scrolled ? "shadow-lg shadow-[#0D2D5A]/8" : ""
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center shrink-0">
              <img
                src="/logo/Care 4 Success-logo-Ok_compact.png"
                alt="Care4Success"
                className="h-12 xl:h-14 w-auto object-contain"
              />
            </NavLink>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center ml-2 xl:ml-4">
              {NAV_MAIN.map(link => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  className={({ isActive }) =>
                    `mx-1.5 xl:mx-2.5 py-1.5 text-[12.5px] xl:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors duration-150 ${
                      isActive && link.to !== "#"
                        ? "text-[#0D2D5A] border-[#F5A623]"
                        : "text-[#0D2D5A]/75 border-transparent hover:text-[#0D2D5A]"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* CTA desktop */}
            <div className="hidden lg:flex items-center gap-2 xl:gap-3 ml-2 xl:ml-4">
              <NavLink
                to="/login"
                className="h-10 px-3 xl:px-4 rounded-lg bg-white border border-[#0D2D5A]/10 text-[#0D2D5A] text-[13px] xl:text-sm font-semibold flex items-center gap-2 hover:bg-white/70 transition-colors"
              >
                <User className="w-4 h-4" /> Connexion
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.PROFESSEURS}
                className="h-10 px-3.5 xl:px-5 rounded-lg bg-[#F5A623] text-[#0D2D5A] text-[13px] xl:text-sm font-bold text-center leading-tight hover:bg-[#e09520] transition-all duration-150 flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
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
              className="lg:hidden border-t border-[#0D2D5A]/10 bg-[#F4F2ED]"
            >
              <nav className="container mx-auto px-4 py-4 space-y-1">
                {NAV_MAIN.map(link => (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    onClick={close}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive && link.to !== "#" ? "bg-[#0D2D5A] text-white" : "text-[#0D2D5A] hover:bg-white/60"
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
      <footer className="bg-[#0D2D5A] text-white" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>
        <div className="h-1 bg-[#F5A623]" />
        <div className="container mx-auto px-6 pt-10 pb-7">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr_auto] gap-10">

            {/* Marque */}
            <div>
              <img
                src="/logo/care4success-long-white.png"
                alt="Care4Success"
                className="h-16 w-auto object-contain mb-3"
              />
              <p className="text-sm text-blue-200/80 leading-relaxed mb-5 max-w-xs">
                Every genius needs a coach. Plateforme de coaching panafricaine par USRA-CARE.
              </p>
            </div>

            {/* Parents */}
            <div>
              <h3 className="text-sm font-black text-[#F5A623] mb-4 uppercase tracking-[0.2em]">Parents</h3>
              <ul className="space-y-3">
                {[
                  { label: "Évaluation gratuite", to: ROUTE_PATHS.EVALUATION_GRATUITE },
                  { label: "Espace parents", to: "/inscription" },
                  { label: "Comment ça marche", to: ROUTE_PATHS.COMMENT_CA_MARCHE },
                  { label: "Tarifs scolaire", to: ROUTE_PATHS.TARIFS },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Apprenants */}
            <div>
              <h3 className="text-sm font-black text-[#F5A623] mb-4 uppercase tracking-[0.2em]">Apprenants</h3>
              <ul className="space-y-3">
                {[
                  { label: "Cours de langues", to: ROUTE_PATHS.COURS_DE_LANGUES },
                  { label: "Compétences pro", to: "#" },
                  { label: "Nos coachs", to: ROUTE_PATHS.ANNUAIRE_COACHS },
                  { label: "Tarifs langues", to: ROUTE_PATHS.TARIFS },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coachs */}
            <div>
              <h3 className="text-sm font-black text-[#F5A623] mb-4 uppercase tracking-[0.2em]">Coachs</h3>
              <ul className="space-y-3">
                <li>
                  <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">
                    Devenir coach
                  </NavLink>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">Nos critères</a>
                </li>
                <li>
                  <a href="#" className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">FAQ coachs</a>
                </li>
                <li>
                  <a href="mailto:contact@care4success.com" className="text-base text-blue-100/85 font-medium hover:text-[#F5A623] transition-colors">
                    contact@care4success.com
                  </a>
                </li>
              </ul>
            </div>

            {/* Nous suivre */}
            <div className="lg:border-l lg:border-white/10 lg:pl-8">
              <h3 className="text-sm font-bold text-white mb-4">Nous suivre</h3>
              <div className="flex items-center gap-4">
                {SOCIAL_LINKS.map(({ label, icon: Icon, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    {...(href !== "#" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="text-white hover:text-[#F5A623] transition-colors"
                  >
                    <Icon className="w-6 h-6" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-white/8 mt-8 pt-5 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-blue-300/50">© 2026 Care4Success · USRA-CARE</p>
            <div className="flex items-center gap-6 text-xs text-blue-300/50">
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
