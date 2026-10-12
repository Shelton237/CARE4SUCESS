import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BarChart3, CalendarDays, Check, CheckCircle2, Eye, EyeOff, GraduationCap, Headphones, HelpCircle, Lightbulb, Loader2, LockKeyhole, Mail, MapPin, Plus, ShieldCheck, Trash2, UserRound, UsersRound } from "lucide-react";
import { PhoneCountryInput } from "@/components/common/PhoneCountryInput";
import { GeoSelector } from "@/components/GeoSelector";
import { LevelSelect } from "@/components/common/LevelSelect";
import { SubjectBadgePicker } from "@/components/common/SubjectSelect";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import "./inscription.css";

type Child = { id: string; name: string; email: string; password: string; level: string; subject: string[] };
type CreatedAccounts = { parent: { email: string }; students: { id: string; name: string; email: string }[] };
const newChild = (): Child => ({ id: crypto.randomUUID(), name: "", email: "", password: "", level: "", subject: [] });
const BENEFITS = [
  { icon: GraduationCap, title: "Accédez aux meilleurs coachs", text: "Des enseignants qualifiés et expérimentés." },
  { icon: BarChart3, title: "Suivez la progression", text: "Des rapports réguliers sur les apprentissages." },
  { icon: CalendarDays, title: "Choisissez librement", text: "Selon vos besoins, vos horaires et votre budget." },
  { icon: ShieldCheck, title: "Un accompagnement sécurisé", text: "Vos données protégées." },
];
const FAQ = [
  ["L’inscription est-elle payante ?", "La création des comptes parent et enfant est gratuite. Les cours sont facturés séparément selon l’accompagnement choisi."],
  ["Puis-je inscrire plusieurs enfants ?", "Oui. À l’étape Informations enfant, cliquez sur Ajouter un enfant. Chaque enfant dispose de son propre compte, rattaché au vôtre."],
  ["Comment sont sélectionnés les coachs ?", "Notre équipe examine leurs qualifications et leur expérience, puis réalise une évaluation ou un entretien selon leur domaine."],
  ["Mes données sont-elles sécurisées ?", "Les mots de passe sont stockés sous forme chiffrée à sens unique. Chaque compte accède aux informations autorisées pour son rôle."],
];

function Field({ id, label, children, required = false }: { id: string; label: string; children: ReactNode; required?: boolean }) {
  return <div className="signup-field"><label htmlFor={id}>{label}{required && <span className="signup-required"> *</span>}</label>{children}</div>;
}
function PasswordField({ id, value, onChange, label = "Mot de passe" }: { id: string; value: string; onChange: (value: string) => void; label?: string }) {
  const [visible, setVisible] = useState(false);
  return <Field id={id} label={label} required><div className="signup-input-icon"><LockKeyhole size={16} /><input id={id} name={id} type={visible ? "text" : "password"} value={value} onChange={e => onChange(e.target.value)} placeholder="8 caractères minimum" autoComplete="new-password" minLength={8} maxLength={72} required /><button type="button" className="signup-eye" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></Field>;
}

export default function Inscription() {
  const [params, setParams] = useSearchParams();
  const studentMode = params.get("profil") === "eleve";
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedAccounts | null>(null);
  const [googleIdToken, setGoogleIdToken] = useState<string | null>(null);
  const [parent, setParent] = useState({ name: "", email: "", password: "", phone: "", location: "", geoId: null as number | null });
  const [children, setChildren] = useState<Child[]>(() => [newChild()]);
  const formSection = useRef<HTMLElement>(null);
  const submissionPending = useRef(false);
  const goTo = (next: number) => { setError(""); setStep(next); requestAnimationFrame(() => formSection.current?.scrollIntoView({ behavior: "smooth", block: "start" })); };
  const updateChild = (id: string, patch: Partial<Child>) => setChildren(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  const handleGoogleCredential = (token: string) => {
    try {
      const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
      const profile = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(base64), c => c.charCodeAt(0))));
      setGoogleIdToken(token); setParent(prev => ({ ...prev, name: profile.name || prev.name, email: profile.email || prev.email, password: "" })); setError("");
    } catch { setError("Impossible de lire le profil Google. Réessayez ou utilisez votre email."); }
  };
  const nextParent = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!parent.geoId) return setError("Sélectionnez votre pays dans la rubrique Votre localisation.");
    if (parent.phone.replace(/\D/g, "").length < 8) return setError("Saisissez un numéro de téléphone complet.");
    goTo(2);
  };
  const nextChildren = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (children.some(c => !c.level || !c.subject.length)) return setError("Choisissez un niveau et au moins une matière pour chaque enfant.");
    const emails = [parent.email, ...children.map(c => c.email)].map(email => email.trim().toLowerCase());
    if (new Set(emails).size !== emails.length) return setError("Chaque compte doit avoir une adresse email différente : parent et enfants.");
    goTo(3);
  };
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault(); if (submissionPending.current) return;
    submissionPending.current = true; setLoading(true); setError("");
    try {
      const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
      const response = await fetch(`${base}/parents/enroll`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        parentName: parent.name.trim(), parentEmail: parent.email.trim().toLowerCase(), parentPassword: parent.password,
        parentPhone: parent.phone.trim(), parentLocation: parent.location, parentGeoLocationId: parent.geoId,
        googleIdToken: googleIdToken || undefined, userType: studentMode ? "student" : "parent",
        children: children.map(c => ({ name: c.name.trim(), email: c.email.trim().toLowerCase(), password: c.password, level: c.level, subject: c.subject.join(", ") })),
      }) });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message || "Impossible de créer les comptes. Réessayez dans quelques instants.");
      if (!data?.parent?.email || !Array.isArray(data.students)) throw new Error("La confirmation du serveur est incomplète. Contactez notre équipe avant de réessayer.");
      setCreated(data); setParent(prev => ({ ...prev, password: "" })); setChildren(prev => prev.map(c => ({ ...c, password: "" }))); goTo(4);
    } catch (err) { setError(err instanceof Error ? err.message : "Erreur de connexion au serveur."); }
    finally { submissionPending.current = false; setLoading(false); }
  };

  return <div className="signup-page">
    <section className="signup-hero">
      <img className="signup-hero-photo" src="/images/soutien/hero-soutien.jpg" alt="Une mère accompagne son enfant dans ses apprentissages" />
      <div className="signup-hero-shade" />
      <div className="signup-wrap signup-hero-content">
        <nav aria-label="Fil d’Ariane"><Link to="/">Accueil</Link><span>›</span><span>{studentMode ? "Inscription élève" : "Inscription parent"}</span></nav>
        <h1>{studentMode ? "Commencez votre parcours" : "Inscrivez votre enfant"}<br />sur <em>Care4Success</em></h1>
        <p>Créez votre compte en quelques minutes et {studentMode ? "bénéficiez d’un" : "offrez-lui un"}<br className="signup-desktop-break" /> accompagnement de qualité par des coachs qualifiés.</p>
        <ul className="signup-trust">{[{ icon: LockKeyhole, label: "Inscription gratuite" }, { icon: UsersRound, label: "Sans engagement" }, { icon: ShieldCheck, label: "Données sécurisées" }].map(({ icon: Icon, label }) => <li key={label}><span><Icon size={19} /></span>{label}</li>)}</ul>
      </div>
      <div className="signup-hero-note">Investissez<br />dans son avenir<svg viewBox="0 0 160 20" aria-hidden="true"><path d="M3 17Q78 -3 157 4" fill="none" stroke="#F5A623" strokeWidth="4" strokeLinecap="round" /></svg></div>
      <div className="signup-hero-card"><span><Lightbulb size={27} /></span><p>Un accompagnement adapté<br />aux besoins de votre enfant,<br /><strong>à chaque étape de son parcours.</strong></p></div>
    </section>
    <section ref={formSection} className="signup-main signup-wrap" aria-labelledby="signup-title">
      <header className="signup-heading"><h2 id="signup-title">Inscription {studentMode ? "Élève" : "Parent"}</h2><p>{step === 4 ? "Vos comptes sont prêts." : "Créez votre compte en 3 étapes simples."}</p>
        {step < 4 && <div className="signup-profiles" aria-label="Profil d’inscription"><button type="button" aria-pressed={!studentMode} onClick={() => { setParams({ profil: "parent" }); goTo(1); }}>Parent</button><button type="button" aria-pressed={studentMode} onClick={() => { setParams({ profil: "eleve" }); setChildren(prev => [prev[0]]); goTo(1); }}>Élève</button></div>}
      </header>
      <ol className="signup-stepper" aria-label="Étapes d’inscription">{[studentMode ? "Responsable (Compte)" : "Informations parent (Compte)", studentMode ? "Informations élève" : "Informations enfant", "Confirmation"].map((label, i) => <li key={label} className={step >= i + 1 ? "is-current" : ""} aria-current={step === i + 1 ? "step" : undefined}><span>{step > i + 1 ? <Check size={17} /> : i + 1}</span><p>{label}</p></li>)}</ol>
      <div className="signup-columns">
        <aside className="signup-benefits"><h3>Pourquoi créer un compte ?</h3><div className="signup-gold-rule" />{BENEFITS.map(({ icon: Icon, title, text }) => <div className="signup-benefit" key={title}><span><Icon size={27} /></span><div><h4>{title}</h4><p>{text}</p></div></div>)}<img src="/images/parcours/parents.jpg" alt="Un parent et son enfant" /></aside>
        <div className="signup-form-card">
          {error && <div className="signup-error" role="alert">{error}</div>}
          {step === 1 && <form onSubmit={nextParent}>
            <div className="signup-form-heading"><span className="signup-round-icon"><UserRound size={25} /></span><div><h3>{studentMode ? "Informations Responsable" : "Informations Parent"}</h3><p>{studentMode ? "Le compte parent ou tuteur accompagne votre inscription." : "Commencez par créer votre compte."}</p></div>{!googleIdToken && import.meta.env.VITE_GOOGLE_CLIENT_ID && <div className="signup-google"><span>ou</span><GoogleSignInButton onCredential={handleGoogleCredential} text="signup_with" width={200} /></div>}</div>
            {googleIdToken && <div className="signup-google-connected"><CheckCircle2 size={18} /><span>Compte Google : {parent.email}</span><button type="button" onClick={() => setGoogleIdToken(null)}>Changer</button></div>}
            <div className="signup-fields">
              <Field id="parentName" label="Nom complet" required><div className="signup-input-icon"><UserRound size={16} /><input id="parentName" name="parentName" value={parent.name} onChange={e => setParent({ ...parent, name: e.target.value })} placeholder="Ex. Jean Dupont" autoComplete="name" minLength={2} maxLength={120} pattern=".*\S.*" required /></div></Field>
              <div className="signup-grid">
                <Field id="parentEmail" label="Email de connexion" required><div className="signup-input-icon"><Mail size={16} /><input id="parentEmail" name="parentEmail" type="email" value={parent.email} readOnly={!!googleIdToken} onChange={e => setParent({ ...parent, email: e.target.value })} placeholder="votre@email.com" autoComplete="email" maxLength={254} required /></div></Field>
                {!googleIdToken && <PasswordField id="parentPassword" value={parent.password} onChange={password => setParent({ ...parent, password })} />}
                <Field id="parentPhone" label="Téléphone" required><PhoneCountryInput id="parentPhone" phone={parent.phone} onPhoneChange={phone => setParent(prev => ({ ...prev, phone }))} nationalNumber required /></Field>
              </div>
              <div className="signup-location"><h4><MapPin size={21} />Votre localisation</h4><GeoSelector layout="registration" value={parent.geoId} onChange={(geoId, location) => setParent(prev => ({ ...prev, geoId, location }))} /></div>
            </div>
            <button className="signup-primary" type="submit">{studentMode ? "Continuer vers mes informations" : "Continuer vers l’enfant"}<ArrowRight size={17} /></button>
            <p className="signup-login">Vous avez déjà un compte ? <Link to="/login">Se connecter</Link></p>
          </form>}
          {step === 2 && <form onSubmit={nextChildren}>
            <div className="signup-form-heading"><span className="signup-round-icon"><GraduationCap size={25} /></span><div><h3>Informations {studentMode ? "Élève" : "Enfant"}</h3><p>Un compte personnel pour suivre ses apprentissages.</p></div></div>
            <div className="signup-children">{children.map((child, i) => <fieldset key={child.id} className="signup-child"><legend>{studentMode ? "Mon profil" : `Enfant ${i + 1}`}</legend>{children.length > 1 && <button type="button" className="signup-remove" aria-label={`Supprimer l’enfant ${i + 1}`} onClick={() => setChildren(prev => prev.filter(c => c.id !== child.id))}><Trash2 size={16} /></button>}
              <div className="signup-fields"><Field id={`childName-${child.id}`} label={studentMode ? "Mon nom complet" : "Nom complet de l’enfant"} required><input id={`childName-${child.id}`} name="childName" value={child.name} onChange={e => updateChild(child.id, { name: e.target.value })} minLength={2} maxLength={120} pattern=".*\S.*" placeholder="Ex. Marie Dupont" autoComplete="off" required /></Field>
                <div className="signup-grid"><Field id={`childEmail-${child.id}`} label="Email de connexion de l’enfant" required><input id={`childEmail-${child.id}`} name="childEmail" type="email" value={child.email} onChange={e => updateChild(child.id, { email: e.target.value })} maxLength={254} placeholder="email.enfant@exemple.com" autoComplete="off" required /></Field><PasswordField id={`childPassword-${child.id}`} label="Mot de passe de l’enfant" value={child.password} onChange={password => updateChild(child.id, { password })} /></div>
                <p className="signup-hint">Utilisez une adresse différente du compte parent. Conservez ces identifiants pour accéder à l’espace élève.</p>
                <Field id={`childLevel-${child.id}`} label="Niveau scolaire" required><LevelSelect id={`childLevel-${child.id}`} country={parent.location.split(" › ")[0]} value={child.level} onValueChange={level => updateChild(child.id, { level })} /></Field>
                <div className="signup-field"><p className="signup-field-label">Matières prioritaires<span className="signup-required"> *</span></p><SubjectBadgePicker selectedSubjects={child.subject} onChange={subject => updateChild(child.id, { subject })} /><p className="signup-hint">Choisissez une ou plusieurs matières.</p></div>
              </div></fieldset>)}</div>
            {!studentMode && children.length < 10 && <button type="button" className="signup-add" onClick={() => setChildren(prev => [...prev, newChild()])}><Plus size={17} />Ajouter un enfant</button>}
            <div className="signup-actions"><button className="signup-secondary" type="button" onClick={() => goTo(1)}><ArrowLeft size={16} />Retour</button><button className="signup-primary" type="submit">Continuer vers la confirmation<ArrowRight size={16} /></button></div>
          </form>}
          {step === 3 && <form onSubmit={submit}>
            <div className="signup-form-heading"><span className="signup-round-icon"><ShieldCheck size={25} /></span><div><h3>Confirmez votre inscription</h3><p>Vérifiez les informations avant de créer les comptes.</p></div></div>
            <section className="signup-summary"><div className="signup-summary-heading"><h4>Compte parent / responsable</h4><button type="button" onClick={() => goTo(1)} disabled={loading}>Modifier</button></div><dl><dt>Nom</dt><dd>{parent.name}</dd><dt>Email</dt><dd>{parent.email}</dd><dt>Téléphone</dt><dd>{parent.phone}</dd><dt>Localisation</dt><dd>{parent.location}</dd></dl></section>
            {children.map((child, i) => <section className="signup-summary" key={child.id}><div className="signup-summary-heading"><h4>{studentMode ? "Compte élève" : `Compte enfant ${i + 1}`}</h4><button type="button" disabled={loading} onClick={() => goTo(2)}>Modifier</button></div><dl><dt>Nom</dt><dd>{child.name}</dd><dt>Email</dt><dd>{child.email}</dd><dt>Niveau</dt><dd>{child.level}</dd><dt>Matières</dt><dd>{child.subject.join(", ")}</dd></dl></section>)}
            <p className="signup-hint">L’inscription est gratuite. Chaque enfant sera rattaché au compte parent. Consultez notre <Link to="/politique-confidentialite">politique de confidentialité</Link> pour connaître l’utilisation de vos données.</p>
            <div className="signup-actions"><button className="signup-secondary" type="button" onClick={() => goTo(2)} disabled={loading}><ArrowLeft size={16} />Retour</button><button className="signup-primary" type="submit" disabled={loading}>{loading ? <><Loader2 className="animate-spin" size={17} />Création des comptes…</> : <>Confirmer l’inscription<Check size={17} /></>}</button></div>
          </form>}
          {step === 4 && created && <div className="signup-success"><CheckCircle2 size={56} /><h3>Vos comptes ont été créés !</h3><p>Connectez-vous avec l’adresse email et le mot de passe choisis pour chaque compte.</p><div className="signup-summary"><h4>Compte parent</h4><p>{created.parent.email}</p>{created.students.map(child => <div key={child.id}><h4>Compte élève : {child.name}</h4><p>{child.email}</p></div>)}</div>{googleIdToken && <p>Pour le compte parent, utilisez « Se connecter avec Google ».</p>}<Link className="signup-primary" to="/login">Se connecter maintenant<ArrowRight size={17} /></Link></div>}
        </div>
        <aside className="signup-support"><section className="signup-tip"><Lightbulb size={24} /><div><h3>Conseil</h3><p>{step === 2 ? "Choisissez des identifiants distincts pour chaque enfant et notez-les pour sa première connexion." : "Utilisez une adresse email que vous consultez régulièrement pour recevoir les informations importantes sur la scolarité de votre enfant."}</p></div></section>
          <section className="signup-reassurance"><img src="/images/soutien/avatar-parent.jpg" alt="" /><p>Accompagnez ses progrès et retrouvez le suivi de ses apprentissages dans votre espace parent.</p></section>
          <section className="signup-faq"><h3><HelpCircle size={20} />Questions fréquentes</h3>{FAQ.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</section>
          <section className="signup-help"><Headphones size={28} /><div><h3>Besoin d’aide ?</h3><p>Notre équipe est disponible pour vous accompagner dans votre inscription.</p><Link to="/contact">Nous contacter<ArrowRight size={15} /></Link></div></section>
        </aside>
      </div>
    </section>
  </div>;
}
