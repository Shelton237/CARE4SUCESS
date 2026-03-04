import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Menu, X, Phone, Mail, MapPin, GraduationCap } from "lucide-react";
import { SiFacebook, SiX, SiLinkedin, SiInstagram } from "react-icons/si";
import { ROUTE_PATHS } from "@/lib/index";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: ROUTE_PATHS.HOME, label: "Accueil" },
    { to: ROUTE_PATHS.SERVICES, label: "Services" },
    { to: ROUTE_PATHS.NIVEAUX, label: "Niveaux" },
    { to: ROUTE_PATHS.PROFESSEURS, label: "Professeurs" },
    { to: ROUTE_PATHS.CONTACT, label: "Contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header / Navbar ── */}
      <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85 border-b border-blue-100 shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-18 py-2">

            {/* Logo Care4Success — version large en desktop, compact en mobile */}
            <NavLink to={ROUTE_PATHS.HOME} className="flex items-center gap-2 shrink-0">
              <picture>
                <source
                  media="(min-width: 640px)"
                  srcSet="/logo/Care 4 Success-logo-Ok_large.png"
                />
                <img
                  src="/logo/Care 4 Success-logo-Ok_compact.png"
                  alt="Care 4 Success"
                  className="h-12 w-auto object-contain"
                />
              </picture>
            </NavLink>

            {/* Navigation desktop */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                      ? "bg-[#1A6CC8] text-white shadow-md shadow-blue-200"
                      : "text-[#0D2D5A] hover:text-[#1A6CC8] hover:bg-blue-50"
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {/* CTA desktop */}
            <div className="hidden md:flex items-center gap-3">
              <a
                href="tel:+237675252048"
                className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[#1A6CC8] text-[#1A6CC8] text-sm font-semibold hover:bg-[#1A6CC8] hover:text-white transition-all duration-200"
              >
                <Phone className="w-4 h-4" />
                +237 675 252 048
              </a>
              <NavLink
                to={ROUTE_PATHS.CONTACT}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold text-[#0D2D5A] cta-gold shadow-lg hover:scale-105 transition-transform duration-200"
              >
                Bilan gratuit
              </NavLink>
            </div>

            {/* Burger mobile */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-blue-50 transition-colors text-[#0D2D5A]"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu mobile */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden border-t border-blue-100 bg-white"
            >
              <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${isActive
                        ? "bg-[#1A6CC8] text-white shadow-md"
                        : "text-[#0D2D5A] hover:text-[#1A6CC8] hover:bg-blue-50"
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-blue-100">
                  <a
                    href="tel:+237675252048"
                    className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-[#1A6CC8] text-[#1A6CC8] text-sm font-semibold"
                  >
                    <Phone className="w-4 h-4" />
                    +237 675 252 048
                  </a>
                  <NavLink
                    to={ROUTE_PATHS.CONTACT}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-bold text-[#0D2D5A] cta-gold shadow-lg"
                  >
                    Bilan gratuit
                  </NavLink>
                </div>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1 pt-20">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-brand-blue-gradient text-white mt-24">
        <div className="container mx-auto px-4 py-14">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

            {/* Logo + description + socials */}
            <div>
              <div className="mb-5">
                <img
                  src="/logo/Care 4 Success-logo-Ok_compact.png"
                  alt="Care 4 Success"
                  className="h-14 w-auto object-contain brightness-0 invert"
                />
              </div>
              <p className="text-sm text-blue-100 mb-5 leading-relaxed">
                Votre partenaire de confiance pour la réussite scolaire.
                10 ans d'expérience, 500+ enseignants qualifiés au Cameroun.
              </p>
              <div className="flex gap-3">
                {[
                  { href: "https://facebook.com", Icon: SiFacebook, label: "Facebook" },
                  { href: "https://x.com", Icon: SiX, label: "X" },
                  { href: "https://linkedin.com", Icon: SiLinkedin, label: "LinkedIn" },
                  { href: "https://instagram.com", Icon: SiInstagram, label: "Instagram" },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg bg-white/10 hover:bg-[#F5A623] hover:text-[#0D2D5A] flex items-center justify-center transition-all duration-200 hover:scale-110"
                    aria-label={label}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-bold text-[#F5A623] mb-5 uppercase text-xs tracking-widest">
                Services
              </h3>
              <ul className="space-y-2">
                {[
                  "Cours particuliers",
                  "Cours en ligne",
                  "Stages vacances",
                  "Accompagnement scolaire",
                ].map((item) => (
                  <li key={item}>
                    <NavLink
                      to={ROUTE_PATHS.SERVICES}
                      className="text-sm text-blue-100 hover:text-[#F5A623] transition-colors duration-200"
                    >
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Niveaux */}
            <div>
              <h3 className="font-bold text-[#F5A623] mb-5 uppercase text-xs tracking-widest">
                Niveaux
              </h3>
              <ul className="space-y-2">
                {["Primaire", "Collège", "Lycée", "Supérieur", "Adultes"].map((item) => (
                  <li key={item}>
                    <NavLink
                      to={ROUTE_PATHS.NIVEAUX}
                      className="text-sm text-blue-100 hover:text-[#F5A623] transition-colors duration-200"
                    >
                      {item}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-bold text-[#F5A623] mb-5 uppercase text-xs tracking-widest">
                Contact
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <Phone className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <div>
                    <div className="font-semibold text-white">+237 675 252 048</div>
                    <div className="text-xs">Lun-Sam 8h–18h</div>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <Mail className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <a
                    href="mailto:contact@care4success.cm"
                    className="hover:text-[#F5A623] transition-colors"
                  >
                    contact@care4success.cm
                  </a>
                </li>
                <li className="flex items-start gap-3 text-sm text-blue-100">
                  <MapPin className="w-4 h-4 mt-0.5 text-[#F5A623] shrink-0" />
                  <div>
                    <div className="font-semibold text-white">Bureau Régional</div>
                    <div>Arrondissement Douala 5ᵉ, Makepe Bloc L</div>
                    <div>Douala, Cameroun</div>
                  </div>
                </li>
              </ul>

              <div className="mt-6 p-4 rounded-xl bg-[#F5A623]/15 border border-[#F5A623]/30">
                <GraduationCap className="w-5 h-5 text-[#F5A623] mb-2" />
                <p className="text-xs text-blue-100 font-medium">
                  Préparation BEPC &amp; BAC —{" "}
                  <span className="text-[#F5A623] font-bold text-sm">Résultats garantis</span>
                </p>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/15 mt-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-blue-200">
              © 2026 Care 4 Success. Tous droits réservés.
            </p>
            <div className="flex gap-6 text-sm text-blue-200">
              {["Mentions légales", "Politique de confidentialité", "CGV"].map((item) => (
                <a key={item} href="#" className="hover:text-[#F5A623] transition-colors">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}