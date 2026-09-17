import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  Menu, X, Phone, MapPin, ArrowRight,
  LogIn, UserPlus, GraduationCap
} from "lucide-react";
import { ROUTE_PATHS } from "@/lib/index";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

const NAV_MAIN = [
  { to: ROUTE_PATHS.SERVICES,    label: "Services" },
  { to: ROUTE_PATHS.NIVEAUX,     label: "Niveaux" },
  { to: ROUTE_PATHS.PROFESSEURS, label: "Professeurs" },
  { to: ROUTE_PATHS.TARIFS,      label: "Tarifs" },
  { to: ROUTE_PATHS.A_PROPOS,    label: "À propos" },
  { to: ROUTE_PATHS.CONTACT,     label: "Contact" },
];

export function Layout({ children }: LayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled,   setScrolled]   = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const close = () => setMobileOpen(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div className={`bg-[#0D2D5A] text-white hidden lg:block transition-all duration-300 overflow-hidden ${scrolled ? "h-0 opacity-0" : "h-10 opacity-100"}`}>
        <div className="container mx-auto px-6 flex items-center justify-between h-full">
          <div className="flex items-center gap-2 text-[11px] text-white/80">
            <MapPin className="w-3 h-3 text-[#F5A623] shrink-0" />
            <span>Présents dans 15 pays africains</span>
            <span className="opacity-30 mx-2">·</span>
            <a href="tel:+237675252048" className="flex items-center gap-1 hover:text-[#F5A623] transition-colors font-semibold">
              <Phone className="w-3 h-3" />+237 675 252 048
            </a>
            <span className="opacity-30 mx-2">·</span>
            <a href="mailto:contact@usra-care.com" className="hover:text-[#F5A623] transition-colors">
              contact@usra-care.com
            </a>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="text-[#F5A623] font-bold hover:text-white transition-colors flex items-center gap-1">
              <GraduationCap className="w-3 h-3" /> Devenir enseignant
            </NavLink>
            <NavLink to="/login" className="text-white/70 font-medium hover:text-white transition-colors flex items-center gap-1">
              <LogIn className="w-3 h-3" /> Connexion
            </NavLink>
          </div>
        </div>
      </div>

      {/* ── NAVBAR PRINCIPALE ── */}
      <header className={`sticky top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white shadow-lg shadow-[#0D2D5A]/8 border-b border-gray-100"
          : "bg-white border-b border-gray-100"
      }`}>
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between h-16 md:h-18">

            {/* Logo */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center shrink-0">
              <picture>
                <source media="(min-width: 640px)" srcSet="/logo/Care 4 Success-logo-Ok_large.png" />
                <img
                  src="/logo/Care 4 Success-logo-Ok_compact.png"
                  alt="Care4Success"
                  className="h-12 md:h-14 w-auto object-contain"
                />
              </picture>
            </NavLink>

            {/* Nav desktop */}
            <nav className="hidden lg:flex items-center gap-1 ml-8">
              {NAV_MAIN.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      isActive
                        ? "text-[#1A6CC8] bg-[#1A6CC8]/8"
                        : "text-[#0D2D5A]/80 hover:text-[#1A6CC8] hover:bg-[#0D2D5A]/5"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* CTAs desktop */}
            <div className="hidden lg:flex items-center gap-3 ml-auto pl-6">
              <NavLink
                to="/login"
                className="h-9 px-4 rounded-lg border border-[#0D2D5A]/20 text-[#0D2D5A] text-sm font-semibold hover:border-[#1A6CC8] hover:text-[#1A6CC8] transition-all duration-150 flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" /> Connexion
              </NavLink>
              <NavLink
                to="/inscription"
                className="h-9 px-4 rounded-lg bg-[#1A6CC8] text-white text-sm font-bold hover:bg-[#0D2D5A] transition-all duration-150 flex items-center gap-1.5 shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5" /> S'inscrire
              </NavLink>
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="h-9 px-4 rounded-lg bg-[#F5A623] text-[#0D2D5A] text-sm font-bold hover:bg-[#e09520] transition-all duration-150 flex items-center gap-1.5 shadow-sm"
              >
                Bilan gratuit <ArrowRight className="w-3.5 h-3.5" />
              </NavLink>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[#0D2D5A] hover:bg-gray-100 transition-colors ml-auto cursor-pointer"
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
              className="lg:hidden border-t border-gray-100 bg-white"
            >
              <nav className="container mx-auto px-4 py-4 space-y-1">
                {NAV_MAIN.map(link => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={close}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive ? "bg-[#0D2D5A] text-white" : "text-[#0D2D5A] hover:bg-gray-50"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <NavLink to="/login" onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8] hover:text-white transition-colors cursor-pointer">
                    <LogIn className="w-4 h-4" /> Connexion
                  </NavLink>
                  <NavLink to="/inscription" onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#1A6CC8] text-white hover:bg-[#0D2D5A] transition-colors cursor-pointer">
                    <UserPlus className="w-4 h-4" /> S'inscrire
                  </NavLink>
                  <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold border-2 border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623] hover:text-[#0D2D5A] transition-colors cursor-pointer">
                    <GraduationCap className="w-4 h-4" /> Devenir enseignant
                  </NavLink>
                  <NavLink to={ROUTE_PATHS.CONTACT} onClick={close} className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#F5A623] text-[#0D2D5A] hover:bg-[#e09520] transition-colors cursor-pointer">
                    Bilan gratuit <ArrowRight className="w-4 h-4" />
                  </NavLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* MAIN */}
      <main className="flex-1">{children}</main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#0D2D5A] text-white" style={{ fontFamily: "Nunito, 'Noto Sans', sans-serif" }}>
        <div className="h-1 bg-[#F5A623]" />
        <div className="container mx-auto px-6 pt-14 pb-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Marque */}
            <div>
              <img
                src="/logo/care4success-long-white.png"
                alt="Care4Success"
                className="h-10 w-auto object-contain mb-3"
              />
              <p className="text-sm text-blue-200/80 leading-relaxed mb-5 max-w-xs">
                Every genius needs a coach. Plateforme de coaching panafricaine par USRA-CARE.
              </p>
              <div className="flex flex-wrap items-center gap-4">
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
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Parents</h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Évaluation gratuite", to: ROUTE_PATHS.CONTACT },
                  { label: "Espace parents", to: "/inscription" },
                  { label: "Comment ça marche", to: "#" },
                  { label: "Tarifs scolaire", to: ROUTE_PATHS.TARIFS },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Apprenants */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Apprenants</h3>
              <ul className="space-y-2.5">
                {[
                  { label: "Cours de langues", to: ROUTE_PATHS.PROFESSEURS },
                  { label: "Compétences pro", to: "#" },
                  { label: "Nos coachs", to: ROUTE_PATHS.PROFESSEURS },
                  { label: "Tarifs langues", to: ROUTE_PATHS.TARIFS },
                ].map(item => (
                  <li key={item.label}>
                    <NavLink to={item.to} className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Coachs */}
            <div>
              <h3 className="text-[10px] font-black text-[#F5A623] mb-4 uppercase tracking-[0.25em]">Coachs</h3>
              <ul className="space-y-2.5">
                <li>
                  <NavLink to={ROUTE_PATHS.DEVENIR_PROFESSEUR} className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">
                    Devenir coach
                  </NavLink>
                </li>
                <li>
                  <a href="#" className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">Nos critères</a>
                </li>
                <li>
                  <a href="#" className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">FAQ coachs</a>
                </li>
                <li>
                  <a href="mailto:contact@care4success.com" className="text-sm text-blue-200/70 hover:text-[#F5A623] transition-colors">
                    contact@care4success.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/8 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
            <p className="text-xs text-blue-300/50">© 2026 Care4Success · USRA-CARE</p>
            <div className="flex gap-6 text-xs text-blue-300/50">
              <a href="#" className="hover:text-[#F5A623] transition-colors">CGU</a>
              <NavLink to={ROUTE_PATHS.POLITIQUE_CONFIDENTIALITE} className="hover:text-[#F5A623] transition-colors">Confidentialité</NavLink>
              <a href="#" className="hover:text-[#F5A623] transition-colors">Remboursements</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
