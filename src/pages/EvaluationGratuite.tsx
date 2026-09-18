import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitEvaluationRequest } from "@/api/public";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Breadcrumb } from "@/components/Layout";

const STAGES = [
  { label: "Formulaire", sub: "2 minutes" },
  { label: "Évaluation", sub: "24-48h" },
  { label: "Coach proposé", sub: "Vous décidez" },
  { label: "Premier cours", sub: "C'est parti" },
];

const COUNTRIES = ["Cameroun", "Madagascar"];

const SCHOOL_SYSTEMS = [
  { value: "camerounais", label: "Camerounais (BEPC / BAC)" },
  { value: "francais", label: "Français" },
  { value: "britannique", label: "Britannique (IB / Cambridge)" },
  { value: "americain", label: "Américain" },
  { value: "autre", label: "Autre" },
];

const FORMATS = [
  { value: "en-ligne", label: "En ligne (visioconférence)" },
  { value: "presentiel", label: "Présentiel (à domicile)" },
  { value: "hybride", label: "Hybride" },
];

const URGENCY_OPTIONS = [
  { value: "aucune", label: "Pas d'urgence particulière" },
  { value: "2-semaines", label: "Dans les 2 semaines" },
  { value: "cette-semaine", label: "Cette semaine" },
  { value: "urgent", label: "Urgent (sous 48h)" },
];

const HOW_HEARD_OPTIONS = [
  { value: "reseaux-sociaux", label: "Réseaux sociaux" },
  { value: "recommandation", label: "Recommandation d'un proche" },
  { value: "recherche", label: "Recherche Google" },
  { value: "publicite", label: "Publicité" },
  { value: "autre", label: "Autre" },
];

const defaultForm = () => ({
  parentFirstName: "", parentLastName: "", email: "", phone: "", country: "", city: "",
  childFirstName: "", level: "", schoolSystem: "", currentSchool: "", subjects: "", format: "en-ligne",
  needs: "", urgency: "aucune", availability: "", howHeard: "",
});

export default function EvaluationGratuite() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState(defaultForm());

  const set = (field: keyof ReturnType<typeof defaultForm>) => (value: string) =>
    setForm(f => ({ ...f, [field]: value }));

  const mutation = useMutation({
    mutationFn: submitEvaluationRequest,
    onSuccess: () => setSubmitted(true),
    onError: (error: Error) => {
      toast({ title: "Erreur lors de l'envoi", description: error.message, variant: "destructive" });
    },
  });

  const goNext = () => {
    if (step === 1) {
      if (!form.parentFirstName || !form.parentLastName || !form.email || !form.phone) {
        toast({ title: "Champs manquants", description: "Merci de renseigner votre prénom, nom, email et téléphone.", variant: "destructive" });
        return;
      }
    }
    if (step === 2) {
      if (!form.childFirstName || !form.level || !form.schoolSystem || !form.subjects) {
        toast({ title: "Champs manquants", description: "Merci de compléter le prénom, la classe, le système scolaire et les matières.", variant: "destructive" });
        return;
      }
    }
    setStep(s => Math.min(3, s + 1));
  };

  const goBack = () => setStep(s => Math.max(1, s - 1));

  const handleSubmit = () => {
    mutation.mutate({
      parentFirstName: form.parentFirstName,
      parentLastName: form.parentLastName,
      email: form.email,
      phone: form.phone,
      country: form.country,
      city: form.city,
      childFirstName: form.childFirstName,
      level: form.level,
      schoolSystem: form.schoolSystem,
      currentSchool: form.currentSchool,
      subjects: form.subjects,
      format: form.format,
      needs: form.needs,
      urgency: form.urgency,
      availability: form.availability,
      howHeard: form.howHeard,
    });
  };

  return (
    <div className="min-h-screen bg-[#F4F2ED]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0B2545]">
        <div className="absolute inset-0">
          <img
            src={IMAGES.TEACHER_STUDENT_4}
            alt="Coach et apprenant"
            className="w-full h-full object-cover opacity-70 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/80 to-[#0B2545]/50" />
        </div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10 py-5 md:py-6 text-center">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.2em] mb-4">Évaluation gratuite</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Trouvons ensemble <span className="text-[#F5A623]">le bon coach</span>
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Un bilan gratuit et sans engagement, pour un coach proposé sous 48h.
          </p>
        </div>
      </section>

      <Breadcrumb />

      <div className="container mx-auto px-6 max-w-2xl py-16">
        <div className="bg-white rounded-3xl shadow-sm p-10">

          {/* ── Étapes macro (informatif) ── */}
          <div className="bg-[#F4F2ED] rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {STAGES.map((s, i) => (
              <div key={s.label}>
                <p className={`text-sm font-bold ${i === 0 ? "text-[#0D2D5A]" : "text-gray-400"}`}>
                  {i + 1}. {s.label}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
              </div>
            ))}
          </div>

          {!submitted && (
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: "100%",
                      backgroundColor: i < step ? "#0F9B8E" : i === step ? "#F5A623" : "transparent",
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <h1 className="text-2xl font-bold text-[#0D2D5A] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>
            Évaluation gratuite
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            Remplissez ce formulaire. Notre équipe évalue le profil de votre enfant et vous propose le coach idéal sous 48h.
          </p>

          {submitted ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-[#0F9B8E] flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-xl font-bold text-[#0D2D5A] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                Demande envoyée
              </h2>
              <p className="text-sm text-gray-500 max-w-sm mx-auto mb-8">
                Notre équipe évalue le profil de votre enfant et vous propose le coach le plus adapté sous 48h. Vous recevrez un email de confirmation.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <NavLink to={ROUTE_PATHS.HOME} className="px-6 py-3 rounded-xl bg-[#0D2D5A] text-white text-sm font-bold hover:bg-[#0B2545] transition-colors">
                  Retour à l'accueil
                </NavLink>
                <NavLink to="/inscription" className="px-6 py-3 rounded-xl border border-gray-200 text-[#0D2D5A] text-sm font-bold hover:bg-gray-50 transition-colors">
                  Découvrir l'espace parents
                </NavLink>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {step === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="parentFirstName">Votre prénom</Label>
                      <Input id="parentFirstName" placeholder="Prénom du parent" value={form.parentFirstName} onChange={e => set("parentFirstName")(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="parentLastName">Votre nom</Label>
                      <Input id="parentLastName" placeholder="Nom de famille" value={form.parentLastName} onChange={e => set("parentLastName")(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="parent@email.com" value={form.email} onChange={e => set("email")(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input id="phone" placeholder="+261 34 XX XXX XX" value={form.phone} onChange={e => set("phone")(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Pays</Label>
                      <Select value={form.country} onValueChange={set("country")}>
                        <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" placeholder="Ex : Antananarivo, Douala..." value={form.city} onChange={e => set("city")(e.target.value)} />
                  </div>
                  <Button onClick={goNext} className="w-full bg-[#0D2D5A] hover:bg-[#0B2545] text-white h-12 text-base font-bold mt-2">
                    Continuer <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="childFirstName">Prénom de l'enfant</Label>
                      <Input id="childFirstName" placeholder="Prénom" value={form.childFirstName} onChange={e => set("childFirstName")(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="level">Classe / niveau</Label>
                      <Input id="level" placeholder="Ex : 3ème, Grade 10..." value={form.level} onChange={e => set("level")(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Système scolaire</Label>
                    <Select value={form.schoolSystem} onValueChange={set("schoolSystem")}>
                      <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                      <SelectContent>
                        {SCHOOL_SYSTEMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="currentSchool">École actuelle (optionnel)</Label>
                    <Input id="currentSchool" placeholder="Ex : Lycée Français, ESCA..." value={form.currentSchool} onChange={e => set("currentSchool")(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="subjects">Matière(s) souhaitée(s)</Label>
                    <Input id="subjects" placeholder="Ex : Mathématiques, Physique, Anglais..." value={form.subjects} onChange={e => set("subjects")(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Format souhaité</Label>
                    <Select value={form.format} onValueChange={set("format")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {FORMATS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={goBack} className="flex-1 border-gray-200 h-12 text-base font-bold">
                      ← Retour
                    </Button>
                    <Button onClick={goNext} className="flex-1 bg-[#0D2D5A] hover:bg-[#0B2545] text-white h-12 text-base font-bold">
                      Continuer <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="needs">Décrivez les besoins de votre enfant</Label>
                    <Textarea
                      id="needs"
                      rows={4}
                      placeholder="Ex : Mon fils a des difficultés en maths depuis la 4ème. Il prépare le brevet en juin..."
                      value={form.needs}
                      onChange={e => set("needs")(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Urgence</Label>
                    <Select value={form.urgency} onValueChange={set("urgency")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {URGENCY_OPTIONS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="availability">Disponibilités souhaitées</Label>
                    <Input id="availability" placeholder="Ex : Lundi et jeudi après 16h, samedi matin..." value={form.availability} onChange={e => set("availability")(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Comment avez-vous entendu parler de nous ?</Label>
                    <Select value={form.howHeard} onValueChange={set("howHeard")}>
                      <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                      <SelectContent>
                        {HOW_HEARD_OPTIONS.map(h => <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-3 mt-2">
                    <Button variant="outline" onClick={goBack} disabled={mutation.isPending} className="flex-1 border-gray-200 h-12 text-base font-bold">
                      ← Retour
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={mutation.isPending}
                      className="flex-1 bg-[#F5A623] hover:bg-[#e09520] text-[#0D2D5A] h-12 text-base font-bold"
                    >
                      {mutation.isPending ? "Envoi..." : <>Envoyer ma demande <ArrowRight className="w-4 h-4 ml-1" /></>}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
