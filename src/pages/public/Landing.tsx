import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap, Star, CheckCircle2, ArrowRight,
  BookOpen, Users, TrendingUp, Video, MessageCircle, Award
} from "lucide-react";
import { toast } from "sonner";

const API = import.meta.env.VITE_API_URL || "/api";

import { ALL_LEVELS, ALL_SUBJECTS } from "@/lib/education";

const LEVELS = ALL_LEVELS;
const SUBJECTS = ALL_SUBJECTS;

export default function Landing() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ parentName:"", childName:"", phone:"", email:"", level:"", subject:"", city:"", message:"" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.parentName || !form.childName || !form.phone || !form.level) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parentName: form.parentName, childName: form.childName,
          phone: form.phone, email: form.email, level: form.level,
          subject: form.subject, city: form.city, message: form.message,
        }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast.error("Une erreur est survenue. Réessayez ou appelez-nous.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#0D2D5A]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100 h-16 flex items-center px-6 justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo/Care 4 Success-logo-Ok_compact.png" className="h-9 w-9 object-contain" alt="Care4Success" />
          <span className="font-black text-[#0D2D5A] text-lg hidden sm:block">Care<span className="text-[#F5A623]">4</span>Success</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="#bilan" className="text-sm font-bold text-[#1A6CC8] hidden sm:block">Bilan gratuit</a>
          <button
            onClick={() => navigate("/login")}
            className="h-9 px-4 bg-[#0D2D5A] text-white text-xs font-black uppercase tracking-widest rounded-xl"
          >
            Connexion
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-[#0D2D5A] via-[#1A4A8A] to-[#1A6CC8] text-white text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
            <Star className="w-3 h-3 text-[#F5A623]" /> Soutien scolaire personnalisé au Cameroun
          </div>
          <h1 className="text-4xl sm:text-5xl font-black leading-tight mb-6">
            Votre enfant mérite<br />le meilleur <span className="text-[#F5A623]">accompagnement</span>
          </h1>
          <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto">
            Des tuteurs qualifiés, un suivi personnalisé, des résultats mesurables — du CP au Bac et au-delà.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#bilan" className="h-12 px-8 bg-[#F5A623] hover:bg-[#e09520] text-white font-black rounded-xl flex items-center justify-center gap-2 transition-colors">
              Demander un bilan gratuit <ArrowRight className="w-4 h-4" />
            </a>
            <button onClick={() => navigate("/login")} className="h-12 px-8 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors border border-white/20">
              Accéder à mon espace
            </button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 px-6 text-center">
          {[
            { value: "500+", label: "Élèves accompagnés" },
            { value: "4.8/5", label: "Satisfaction moyenne" },
            { value: "3 villes", label: "Douala · Yaoundé · En ligne" },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black text-[#1A6CC8]">{s.value}</div>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-3">Notre offre</h2>
          <p className="text-center text-gray-400 text-sm mb-12">Un accompagnement complet pour chaque élève</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, color: "bg-blue-50 text-[#1A6CC8]", title: "Cours individuels", desc: "Séances en tête-à-tête avec un tuteur qualifié, à domicile ou en ligne." },
              { icon: Video, color: "bg-purple-50 text-purple-600", title: "Cours en ligne", desc: "Classe virtuelle interactive avec tableau blanc, partage d'écran et exercices en temps réel." },
              { icon: TrendingUp, color: "bg-emerald-50 text-emerald-600", title: "Suivi de progression", desc: "Notes, rapports de cours, diagnostic initial et plan pédagogique personnalisé." },
              { icon: Users, color: "bg-orange-50 text-[#F5A623]", title: "Conseiller dédié", desc: "Un conseiller pédagogique suit l'évolution de votre enfant et fait le lien avec les tuteurs." },
              { icon: Award, color: "bg-red-50 text-red-500", title: "Tuteurs certifiés", desc: "Sélection rigoureuse, entretien, évaluation pédagogique avant toute affectation." },
              { icon: MessageCircle, color: "bg-teal-50 text-teal-600", title: "Communication directe", desc: "Messagerie intégrée entre parents, tuteurs et conseillers, avec notifications en temps réel." },
            ].map(s => (
              <div key={s.title} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${s.color}`}>
                  <s.icon className="w-5 h-5" />
                </div>
                <h3 className="font-black text-[#0D2D5A] mb-2">{s.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire bilan gratuit */}
      <section id="bilan" className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-[#F5A623]/10 px-4 py-1.5 rounded-full text-xs font-bold text-[#F5A623] uppercase tracking-widest mb-4">
              <GraduationCap className="w-3 h-3" /> 100% gratuit et sans engagement
            </div>
            <h2 className="text-3xl font-black mb-3">Demandez votre bilan gratuit</h2>
            <p className="text-gray-400 text-sm">Un de nos conseillers vous contactera sous 24h pour évaluer les besoins de votre enfant.</p>
          </div>

          {sent ? (
            <div className="text-center py-16 space-y-4">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-black text-[#0D2D5A]">Demande envoyée !</h3>
              <p className="text-gray-400 text-sm">Nous vous contacterons sous 24h. Merci de votre confiance.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Nom du parent *</label>
                  <input value={form.parentName} onChange={set("parentName")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors" placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prénom de l'élève *</label>
                  <input value={form.childName} onChange={set("childName")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors" placeholder="Marie" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Téléphone *</label>
                  <input value={form.phone} onChange={set("phone")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors" placeholder="+237 6XX XXX XXX" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Email</label>
                  <input type="email" value={form.email} onChange={set("email")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors" placeholder="email@exemple.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Niveau scolaire *</label>
                  <select value={form.level} onChange={set("level")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors bg-white">
                    <option value="">Choisir...</option>
                    {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Matière principale</label>
                  <select value={form.subject} onChange={set("subject")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors bg-white">
                    <option value="">Choisir...</option>
                    {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ville</label>
                <input value={form.city} onChange={set("city")} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors" placeholder="Douala, Yaoundé..." />
              </div>
              <div>
                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Message (optionnel)</label>
                <textarea value={form.message} onChange={set("message")} rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#1A6CC8] transition-colors resize-none" placeholder="Décrivez les difficultés rencontrées..." />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full h-12 bg-[#0D2D5A] hover:bg-[#1A4A8A] text-white font-black text-xs uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
              >
                {sending ? "Envoi en cours..." : <><ArrowRight className="w-4 h-4" /> Demander mon bilan gratuit</>}
              </button>
              <p className="text-[9px] text-center text-gray-300">Vos données sont confidentielles et ne seront jamais partagées.</p>
            </form>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0D2D5A] text-white py-12 px-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo/Care 4 Success-logo-Ok_compact.png" className="h-8 w-8 object-contain" alt="" />
          <span className="font-black text-lg">Care<span className="text-[#F5A623]">4</span>Success</span>
        </div>
        <p className="text-blue-200/50 text-xs">© {new Date().getFullYear()} Care4Success — Douala · Yaoundé · En ligne</p>
      </footer>
    </div>
  );
}
