import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { submitTeacherApplication } from "@/api/backoffice";
import { springPresets } from "@/lib/motion";
import { IMAGES } from "@/assets/images";
import { Breadcrumb } from "@/components/Layout";

const VERTICALES = [
  { value: "langues-competences", label: "Langues et compétences" },
  { value: "soutien-scolaire", label: "Soutien scolaire" },
];

const PAYS = ["Cameroun", "Madagascar"];

const ADVANTAGES = [
  { title: "Fixez votre tarif", desc: "vous décidez du prix de vos sessions en Langues et Compétences." },
  { title: "Choisissez votre format", desc: "en ligne, présentiel ou hybride. Vous enseignez comme vous voulez." },
  { title: "Zéro frais d'inscription", desc: "Care4Success se rémunère sur une commission à la session." },
  { title: "Visibilité garantie", desc: "votre profil est promu sur le site, l'app et nos réseaux sociaux." },
  { title: "Paiement sécurisé", desc: "les apprenants paient via C4S, vous recevez votre dû automatiquement." },
];

export default function DevenirProfesseur() {
  const { toast } = useToast();
  const [completed, setCompleted] = useState(false);

  const [prenom, setPrenom] = useState("");
  const [nom, setNom] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verticale, setVerticale] = useState("");
  const [pays, setPays] = useState("");
  const [motivation, setMotivation] = useState("");

  const mutation = useMutation({
    mutationFn: submitTeacherApplication,
    onSuccess: () => {
      setCompleted(true);
      toast({
        title: "Candidature envoyée",
        description: "Notre équipe vous contacte sous 48h.",
      });
      setPrenom(""); setNom(""); setEmail(""); setPhone("");
      setVerticale(""); setPays(""); setMotivation("");
      setTimeout(() => setCompleted(false), 3500);
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur lors de l'envoi",
        description: error.message,
        variant: "destructive",
      });
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

  return (
    <div className="min-h-screen bg-[#F4F2ED]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#0B2545]">
        <div className="absolute inset-0">
          <img
            src={IMAGES.TEACHER_STUDENT_2}
            alt="Coach Care4Success"
            className="w-full h-full object-cover opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/95 to-[#0B2545]/70" />
        </div>
        <div className="container mx-auto px-6 max-w-4xl relative z-10 py-20 md:py-28 text-center">
          <p className="text-[#F5A623] text-xs font-bold uppercase tracking-[0.2em] mb-4">Devenir coach</p>
          <h1
            className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Vous avez <span className="text-[#F5A623]">l'expertise</span>. Nous avons les apprenants.
          </h1>
          <p className="text-blue-200 text-xl max-w-2xl mx-auto leading-relaxed">
            Deux façons de coacher avec Care4Success.
          </p>
        </div>
      </section>

      <Breadcrumb />

      <section className="py-20 md:py-28">
        <div className="container mx-auto px-6 max-w-6xl">

          {/* ── 2 cartes verticales ── */}
          <div className="grid sm:grid-cols-2 gap-5 mb-14 max-w-3xl">
            <div className="bg-gradient-to-br from-amber-50 to-[#F4F2ED] border border-amber-100 rounded-2xl p-6">
              <h3 className="font-bold text-[#0D2D5A] mb-2">Langues et compétences</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Marketplace : vous fixez votre prix, vous gérez vos disponibilités, vous choisissez vos élèves. Liberté totale.
              </p>
            </div>
            <div className="bg-gradient-to-br from-teal-50 to-[#F4F2ED] border border-teal-100 rounded-2xl p-6">
              <h3 className="font-bold text-[#0D2D5A] mb-2">Soutien scolaire</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Missions assignées : C4S vous attribue des élèves après validation par nos superviseurs. Accompagnement structuré, stabilité.
              </p>
            </div>
          </div>

          {/* ── Avantages + Formulaire ── */}
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="font-bold text-[#0D2D5A] text-lg mb-5">Vos avantages</h2>
              <ul className="space-y-4">
                {ADVANTAGES.map(a => (
                  <li key={a.title} className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-md bg-[#0F9B8E] flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5 text-white" />
                    </span>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      <span className="font-bold text-[#0D2D5A]">{a.title}</span> : {a.desc}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              {completed ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springPresets.gentle}
                  className="bg-white rounded-2xl p-10 text-center shadow-sm"
                >
                  <CheckCircle2 className="w-12 h-12 mx-auto text-[#0F9B8E] mb-4" />
                  <h3 className="text-xl font-bold text-[#0D2D5A] mb-2">Merci pour votre candidature !</h3>
                  <p className="text-gray-500 text-sm">Notre équipe vous contacte sous 48h.</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm space-y-5">
                  <div>
                    <h2 className="font-bold text-[#0D2D5A] text-lg">Candidatez maintenant</h2>
                    <p className="text-sm text-gray-500">Notre équipe vous contacte sous 48h.</p>
                  </div>

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

                  <div className="space-y-1.5">
                    <Label>Verticale souhaitée</Label>
                    <Select value={verticale} onValueChange={setVerticale}>
                      <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                      <SelectContent>
                        {VERTICALES.map(v => (
                          <SelectItem key={v.value} value={v.value}>{v.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Pays</Label>
                    <Select value={pays} onValueChange={setPays}>
                      <SelectTrigger><SelectValue placeholder="Choisissez..." /></SelectTrigger>
                      <SelectContent>
                        {PAYS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    {mutation.isPending ? "Envoi en cours..." : "Envoyer ma candidature →"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
