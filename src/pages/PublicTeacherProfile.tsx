import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, Clock, ArrowRight,
    Loader2, CheckCircle2, GraduationCap, X, BookOpen, ImageIcon, BadgeCheck, Check,
    CreditCard, Phone, Mail, User,
} from "lucide-react";
import {
    fetchPublicTeacherProfile,
    initiateBooking,
    authorizeBookingCharge,
    checkBookingStatus,
    type TeacherSlot,
    type PublicTeacherProfile as TeacherProfileData,
    type MobileMoneyNetwork,
} from "@/api/public";
import { formatMoney } from "@/lib/money";
import { ROUTE_PATHS } from "@/lib/index";
import { IMAGES } from "@/assets/images";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// "mar. 22 sept." -> "Mar 22 sept"
const formatSlotDate = (value: string) => {
    const s = new Date(value).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).replace(/\./g, "");
    return s.charAt(0).toUpperCase() + s.slice(1);
};

const formatLabel = (f: string) => (f === "En ligne" ? "En ligne (visioconférence)" : f);

const formatSlotTime = (value: string) =>
    new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Couleurs des pastilles "Formats disponibles", alignées sur le code couleur
// déjà utilisé pour les univers de coaching (teal/or/corail) ailleurs sur le site.
const FORMAT_COLORS: Record<string, { bg: string; text: string }> = {
    "En ligne":   { bg: "bg-[#0F9B8E]/10", text: "text-[#0F9B8E]" },
    "Présentiel": { bg: "bg-[#F5A623]/15", text: "text-[#c9880f]" },
    "Hybride":    { bg: "bg-[#E2574C]/10", text: "text-[#E2574C]" },
};
const formatColor = (f: string) => FORMAT_COLORS[f] || { bg: "bg-gray-100", text: "text-gray-600" };

type BookingStep = "form" | "otp" | "waiting" | "redirect" | "success";

// Pas d'emoji dans les contenus du coach (accroche, bio) : retirés à l'affichage.
const stripEmoji = (t: string) => t.replace(/[\p{Extended_Pictographic}️‍]/gu, "").replace(/[ \t]{2,}/g, " ").trim();

const SECTION_TITLE = "text-lg font-bold text-[#0D2D5A]";

// Lien YouTube/Vimeo saisi par le coach -> URL d'intégration (le serveur ne
// laisse passer que ces hôtes, cf. TEACHER_VIDEO_URL_RE).
const toEmbedUrl = (url: string | null): string | null => {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{6,})/i);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vm = url.match(/vimeo\.com\/(\d+)/i);
    if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
    return null;
};

// Texte libre du coach : les lignes "### Titre" deviennent des sous-titres,
// le reste est rendu tel quel (retours à la ligne conservés).
function RichText({ text }: { text: string }) {
    const blocks: { type: "h" | "p"; text: string }[] = [];
    let paragraphBreak = false;
    for (const rawLine of text.split("\n")) {
        const line = stripEmoji(rawLine);
        if (line.startsWith("### ")) {
            blocks.push({ type: "h", text: line.slice(4).trim() });
            paragraphBreak = false;
        } else if (!line.trim()) {
            paragraphBreak = true;
        } else if (!paragraphBreak && blocks.length && blocks[blocks.length - 1].type === "p") {
            blocks[blocks.length - 1].text += "\n" + line;
        } else {
            blocks.push({ type: "p", text: line });
            paragraphBreak = false;
        }
    }
    return (
        <div className="space-y-3">
            {blocks.map((b, i) => b.type === "h"
                ? <h3 key={i} className="text-sm font-bold text-[#0D2D5A] pt-1">{b.text}</h3>
                : <p key={i} className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{b.text}</p>)}
        </div>
    );
}

// ─── Spécialités : titre + description repliable (accordéon pleine largeur) ──
function SpecialtiesSection({ teacher }: { teacher: TeacherProfileData }) {
    const descriptions = teacher.specialtyDescriptions ?? {};
    const described = teacher.specialties.filter(s => descriptions[s]);
    // Tout déplié sur ordinateur ; replié sur mobile pour éviter des écrans de texte.
    const [openItems] = useState<string[]>(() =>
        typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? described : []
    );
    if (!teacher.specialties.length) return null;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className={SECTION_TITLE + " mb-2"} style={{ fontFamily: "'Playfair Display', serif" }}>Mes spécialités</h2>
            <Accordion type="multiple" defaultValue={openItems}>
                {teacher.specialties.map(name => descriptions[name] ? (
                    <AccordionItem key={name} value={name} className="border-gray-100 last:border-b-0">
                        <AccordionTrigger className="text-sm font-bold text-[#0D2D5A] hover:no-underline">{name}</AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{descriptions[name]}</AccordionContent>
                    </AccordionItem>
                ) : (
                    <div key={name} className="py-4 border-b border-gray-100 last:border-b-0 text-sm font-bold text-[#0D2D5A]">{name}</div>
                ))}
            </Accordion>
        </div>
    );
}

// ─── Avis : note globale + cartes sur deux colonnes, "Voir plus" par avis ───
function ReviewCard({ review }: { review: TeacherProfileData["reviews"][number] }) {
    const [expanded, setExpanded] = useState(false);
    const long = review.comment.length > 180;
    return (
        <div>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F4F2ED] flex items-center justify-center text-sm font-semibold text-[#0D2D5A] shrink-0">
                    {review.reviewerName.trim().charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-[#0D2D5A] truncate">{review.reviewerName}</p>
                    <p className="text-xs text-gray-400">{review.date}</p>
                </div>
            </div>
            <div className="flex items-center gap-0.5 mt-3">
                {[1, 2, 3, 4, 5].map(i => (
                    <Star key={i} className={`w-4 h-4 ${i <= Math.round(review.rating) ? "fill-[#0D2D5A] text-[#0D2D5A]" : "text-gray-200"}`} />
                ))}
            </div>
            <p className={`text-sm text-gray-600 leading-relaxed mt-2 ${expanded ? "" : "line-clamp-4"}`}>{review.comment}</p>
            {long && (
                <button type="button" onClick={() => setExpanded(v => !v)} className="mt-2 text-xs font-semibold text-[#0D2D5A] underline underline-offset-2">
                    {expanded ? "Voir moins" : "Voir plus"}
                </button>
            )}
        </div>
    );
}

function ReviewsSection({ teacher }: { teacher: TeacherProfileData }) {
    const [showAll, setShowAll] = useState(false);
    if (teacher.reviewsCount <= 0) return null;
    const PAGE = 6;
    const visible = showAll ? teacher.reviews : teacher.reviews.slice(0, PAGE);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className={SECTION_TITLE + " mb-4"} style={{ fontFamily: "'Playfair Display', serif" }}>Ce que disent mes apprenants</h2>
            <div className="flex items-center gap-8 flex-wrap mb-8">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-5xl font-bold text-[#0D2D5A] leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>{Number(teacher.rating.toFixed(1))}</span>
                        <Star className="w-8 h-8 fill-[#F5A623] text-[#F5A623]" />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">Sur la base de {teacher.reviewsCount} avis</p>
                </div>
                <div className="flex-1 min-w-[240px] max-w-md space-y-1.5">
                    {([5, 4, 3, 2, 1] as const).map(stars => {
                        const count = teacher.ratingDistribution[stars] ?? 0;
                        const pct = teacher.reviewsCount ? Math.round((count / teacher.reviewsCount) * 100) : 0;
                        return (
                            <div key={stars} className="flex items-center gap-2 text-[11px] text-gray-500">
                                <span className="w-3 text-right">{stars}</span>
                                <Star className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                                <div className="flex-1 h-1.5 rounded-full bg-[#F4F2ED] overflow-hidden">
                                    <div className="h-full rounded-full bg-[#F5A623]" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-6 text-right">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-8">
                {visible.map((r, i) => <ReviewCard key={i} review={r} />)}
            </div>
            {!showAll && teacher.reviews.length > PAGE && (
                <div className="mt-8 flex justify-center">
                    <button
                        type="button"
                        onClick={() => setShowAll(true)}
                        className="px-6 h-11 rounded-lg border border-gray-200 text-sm font-semibold text-[#0D2D5A] hover:bg-[#F4F2ED] transition-colors"
                    >
                        Voir les {teacher.reviews.length} avis
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Formations et certificats (colonne droite, ou gauche sans vidéo) ─────
function EducationCard({ teacher }: { teacher: TeacherProfileData }) {
    if (!teacher.educations.length && !teacher.certificates.length) return null;
    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className={SECTION_TITLE + " mb-4"} style={{ fontFamily: "'Playfair Display', serif" }}>Formations et certificats</h2>
            <ul className="space-y-3">
                {teacher.educations.map((ed, i) => (
                    <li key={`ed-${i}`} className="flex gap-3">
                        <GraduationCap className="w-4 h-4 text-[#1A6CC8] shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-[#0D2D5A]">{[ed.degree, ed.institution].filter(Boolean).join(" · ")}</p>
                            {ed.dates && <p className="text-xs text-gray-400">{ed.dates}</p>}
                        </div>
                    </li>
                ))}
                {teacher.certificates.map((c, i) => (
                    <li key={`ce-${i}`} className="flex gap-3">
                        <BadgeCheck className="w-4 h-4 text-[#0F9B8E] shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-[#0D2D5A]">{c.name}</p>
                            {c.dates && <p className="text-xs text-gray-400">{c.dates}</p>}
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}

// ─── Booking Panel (formulaire parent/élève + paiement Mobile Money) ───────
function BookingPanel({
    teacherName,
    slot,
    onCancel,
}: {
    teacherName: string;
    slot: TeacherSlot;
    onCancel: () => void;
}) {
    const [step, setStep] = useState<BookingStep>("form");
    const [parentName, setParentName] = useState("");
    const [parentEmail, setParentEmail] = useState("");
    const [parentPhone, setParentPhone] = useState("");
    const [studentName, setStudentName] = useState("");
    const [subject, setSubject] = useState(slot.subject || "");
    const [network, setNetwork] = useState<MobileMoneyNetwork>("MTN");
    const [momoPhone, setMomoPhone] = useState("");
    const [amount, setAmount] = useState<{ value: number; currency: string } | null>(null);
    const [charge, setCharge] = useState<{ chargeId: string; reference: string } | null>(null);
    const [otpType, setOtpType] = useState<"otp" | "pin">("otp");
    const [code, setCode] = useState("");
    const [testRedirectUrl, setTestRedirectUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const pollAttempts = useRef(0);
    const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    const startPolling = (reference: string) => {
        pollAttempts.current = 0;
        pollTimer.current = setInterval(async () => {
            pollAttempts.current += 1;
            try {
                const result = await checkBookingStatus(reference);
                if (result.success) {
                    if (pollTimer.current) clearInterval(pollTimer.current);
                    setStep("success");
                    return;
                }
            } catch {
                // erreur transitoire — on continue de sonder
            }
            if (pollAttempts.current >= 20) {
                if (pollTimer.current) clearInterval(pollTimer.current);
                setError("Paiement non confirmé après plusieurs minutes. Vérifiez votre téléphone ou réessayez.");
                setStep("form");
            }
        }, 4000);
    };

    const handleSubmit = async () => {
        setError(null);
        if (!parentName || !parentEmail || !studentName || !momoPhone) {
            setError("Merci de renseigner tous les champs obligatoires.");
            return;
        }
        setSubmitting(true);
        try {
            const data = await initiateBooking({
                slotId: slot.id,
                network,
                phoneNumber: momoPhone,
                parentName,
                parentEmail,
                parentPhone,
                studentName,
                subject: subject || undefined,
            });
            setAmount({ value: data.amount, currency: data.currency });
            setCharge({ chargeId: data.chargeId, reference: data.reference });
            const nextAction = data.nextAction;
            if (nextAction?.type === "requires_otp") {
                setOtpType("otp");
                setStep("otp");
            } else if (nextAction?.type === "requires_pin") {
                setOtpType("pin");
                setStep("otp");
            } else if (nextAction?.type === "redirect_url" && nextAction.redirect_url?.url) {
                setTestRedirectUrl(nextAction.redirect_url.url);
                setStep("redirect");
                startPolling(data.reference);
            } else {
                setStep("waiting");
                startPolling(data.reference);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Impossible d'initier la réservation.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleAuthorize = async () => {
        if (!charge) return;
        setError(null);
        setSubmitting(true);
        try {
            const data = await authorizeBookingCharge(charge.chargeId, otpType, code);
            if (data.nextAction?.type === "requires_otp" || data.nextAction?.type === "requires_pin") {
                setError("Code invalide, réessayez.");
                setCode("");
            } else {
                setStep("waiting");
                startPolling(charge.reference);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Autorisation refusée.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-2xl border border-gray-100 overflow-hidden"
        >
            {/* Header du panel */}
            <div className="bg-[#0D2D5A] p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Réservation</p>
                <p className="text-sm font-bold text-white capitalize">{formatSlotDate(slot.startTime)}</p>
                <p className="text-xs text-blue-200 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatSlotTime(slot.startTime)} – {formatSlotTime(slot.endTime)}
                    <span className="mx-1 opacity-40">·</span>
                    {teacherName}
                </p>
                {amount && step !== "success" && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs text-blue-200">Montant à payer</p>
                        <p className="text-xl font-black text-white">{formatMoney(amount.value, amount.currency)}</p>
                    </div>
                )}
            </div>

            <div className="p-5">
                <AnimatePresence mode="wait">

                    {step === "form" && (
                        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Section parent */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                    <User className="w-3 h-3" /> Vos informations
                                </p>
                                <div className="space-y-2.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Votre nom *</Label>
                                        <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Jean Dupont" className="h-9 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Email *</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <Input type="email" value={parentEmail} onChange={e => setParentEmail(e.target.value)} placeholder="vous@email.com" className="h-9 text-sm pl-8" />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Téléphone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="h-9 text-sm pl-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section élève */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                    <GraduationCap className="w-3 h-3" /> L'élève
                                </p>
                                <div className="space-y-2.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Nom de l'élève *</Label>
                                        <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nom de l'enfant (ou le vôtre)" className="h-9 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Matière souhaitée</Label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: Mathématiques" className="h-9 text-sm pl-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section paiement */}
                            <div className="bg-[#F4F2ED] rounded-xl p-4 space-y-2.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                    <CreditCard className="w-3 h-3" /> Paiement Mobile Money
                                </p>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">Opérateur *</Label>
                                    <Select value={network} onValueChange={v => setNetwork(v as MobileMoneyNetwork)}>
                                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                                            <SelectItem value="ORANGE">Orange Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">Numéro Mobile Money *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                        <Input value={momoPhone} onChange={e => setMomoPhone(e.target.value)} placeholder="6XX XXX XXX" className="h-9 text-sm pl-8 bg-white" />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                                    {error}
                                </motion.p>
                            )}

                            <Button
                                className="w-full h-10 text-sm font-bold bg-[#0D2D5A] hover:bg-[#0B2545] text-white rounded-xl"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initialisation...</>
                                ) : (
                                    <>Réserver et payer <ArrowRight className="w-4 h-4 ml-1.5" /></>
                                )}
                            </Button>
                            <button
                                onClick={onCancel}
                                className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors text-center py-1"
                            >
                                Annuler
                            </button>
                        </motion.div>
                    )}

                    {step === "otp" && (
                        <motion.div key="otp" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                            <div className="text-center py-2">
                                <div className="w-12 h-12 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center mx-auto mb-3">
                                    <Phone className="w-5 h-5 text-[#1A6CC8]" />
                                </div>
                                <p className="text-sm font-bold text-[#0D2D5A]">Vérification requise</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {otpType === "pin" ? "Entrez votre code PIN Mobile Money." : "Entrez le code reçu par SMS."}
                                </p>
                            </div>
                            <Input
                                value={code}
                                onChange={e => setCode(e.target.value)}
                                placeholder="Code"
                                className="h-10 text-center text-lg font-bold tracking-widest"
                            />
                            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                            <Button
                                className="w-full h-10 text-sm font-bold bg-[#0D2D5A] hover:bg-[#0B2545] text-white rounded-xl"
                                disabled={!code.trim() || submitting}
                                onClick={handleAuthorize}
                            >
                                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Vérification...</> : "Valider"}
                            </Button>
                        </motion.div>
                    )}

                    {step === "redirect" && testRedirectUrl && (
                        <motion.div key="redirect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4 text-center">
                            <p className="text-xs text-gray-500">Environnement de test — validez le paiement sur la page Flutterwave.</p>
                            <Button
                                className="w-full h-10 text-sm font-bold bg-[#0D2D5A] hover:bg-[#0B2545] text-white rounded-xl"
                                onClick={() => window.open(testRedirectUrl, "_blank", "noopener,noreferrer")}
                            >
                                Ouvrir la page de test Flutterwave
                            </Button>
                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> En attente de confirmation...
                            </div>
                            {error && <p className="text-xs text-red-500">{error}</p>}
                        </motion.div>
                    )}

                    {step === "waiting" && (
                        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[#0D2D5A]">Validation en cours</p>
                                <p className="text-xs text-gray-500 mt-1">Validez la transaction sur votre téléphone<br />({network === "MTN" ? "MTN Mobile Money" : "Orange Money"})</p>
                            </div>
                            {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
                        </motion.div>
                    )}

                    {step === "success" && (
                        <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-8 text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle2 className="w-9 h-9 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-base font-black text-[#0D2D5A]">Réservation confirmée !</p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    Un email de confirmation avec le lien de votre classe virtuelle a été envoyé à <b>{parentEmail}</b>.
                                </p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// ─── Panneau "Réserver une session" (format + créneaux + total + CTA) ─────
function ReservationPanel({
    teacher,
    slots,
    onZoom,
}: {
    teacher: { name: string; rate: number; currency: string; formats: string[] };
    slots: TeacherSlot[];
    onZoom: (url: string) => void;
}) {
    const [selectedSlotId, setSelectedSlotId] = useState<string | null>(slots[0]?.id ?? null);
    const [format, setFormat] = useState(teacher.formats[0] || "En ligne");
    const [showForm, setShowForm] = useState(false);

    const selectedSlot = slots.find(s => s.id === selectedSlotId) || null;

    if (showForm && selectedSlot) {
        return (
            <BookingPanel
                teacherName={teacher.name}
                slot={selectedSlot}
                onCancel={() => setShowForm(false)}
            />
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
            <h2 className={SECTION_TITLE + " mb-4"} style={{ fontFamily: "'Playfair Display', serif" }}>Réserver une session</h2>

            <div className="space-y-1.5 mb-5">
                <Label className="text-xs text-gray-600">Format</Label>
                <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="h-10 text-sm bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {(teacher.formats.length ? teacher.formats : ["En ligne"]).map(f => (
                            <SelectItem key={f} value={f}>{formatLabel(f)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {slots.length === 0 ? (
                <div className="text-center py-8">
                    <p className="text-sm text-gray-400">Aucun créneau ouvert pour le moment.</p>
                    <p className="text-xs text-gray-400 mt-1">Contactez-nous pour être mis en relation.</p>
                </div>
            ) : (
                <>
                    <Label className="text-xs text-gray-600 mb-2 block">Créneaux disponibles</Label>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {slots.map(slot => {
                            const selected = slot.id === selectedSlotId;
                            return (
                                <button
                                    key={slot.id}
                                    onClick={() => setSelectedSlotId(slot.id)}
                                    className={`relative rounded-xl border px-2 py-2.5 text-center transition-colors ${
                                        selected
                                            ? "bg-[#0F9B8E] border-[#0F9B8E] text-white"
                                            : "bg-white border-gray-200 text-[#0D2D5A] hover:border-[#0F9B8E]/40"
                                    }`}
                                >
                                    {slot.posterUrl && (
                                        <span
                                            onClick={(e) => { e.stopPropagation(); onZoom(slot.posterUrl!); }}
                                            className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center ${selected ? "bg-white text-[#0F9B8E]" : "bg-[#0D2D5A] text-white"}`}
                                        >
                                            <ImageIcon className="w-3 h-3" />
                                        </span>
                                    )}
                                    <p className="text-xs font-bold">{formatSlotDate(slot.startTime)}</p>
                                    <p className={`text-[11px] mt-0.5 ${selected ? "text-white/85" : "text-gray-400"}`}>{formatSlotTime(slot.startTime)}</p>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-100 pt-4 mb-5">
                        <span className="text-sm font-semibold text-[#0D2D5A]">Total</span>
                        <span className="text-xl font-bold text-[#0F9B8E]" style={{ fontFamily: "'Playfair Display', serif" }}>{formatMoney(teacher.rate, teacher.currency)}/h</span>
                    </div>

                    <Button
                        disabled={!selectedSlot}
                        onClick={() => setShowForm(true)}
                        className="w-full h-12 text-sm font-bold bg-[#F5A623] hover:bg-[#e09520] text-white rounded-xl"
                    >
                        Réserver cette session <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                    <p className="text-[11px] text-gray-400 text-center mt-3">
                        Annulation gratuite 24h avant · Paiement sécurisé
                    </p>
                </>
            )}
        </div>
    );
}

// ─── Page principale ────────────────────────────────────────────────────────
export default function PublicTeacherProfile() {
    const { id } = useParams<{ id: string }>();
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setLightboxUrl(null); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, []);

    const { data: teacher, isLoading, isError } = useQuery({
        queryKey: ["public-teacher", id],
        queryFn: () => fetchPublicTeacherProfile(id!),
        enabled: Boolean(id),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#F4F2ED]">
                <div className="flex flex-col items-center gap-3 py-32">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                    <p className="text-sm text-gray-400">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (isError || !teacher) {
        return (
            <div className="min-h-screen bg-[#F4F2ED]">
                <div className="flex flex-col items-center justify-center gap-4 text-center px-6 py-32">
                    <p className="text-xl font-bold text-[#0D2D5A]">Enseignant introuvable</p>
                    <NavLink to={ROUTE_PATHS.ANNUAIRE_COACHS} className="text-[#1A6CC8] font-semibold hover:underline text-sm">
                        ← Retour à l'annuaire
                    </NavLink>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F4F2ED]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

            {/* ── Hero ── */}
            <section className="relative overflow-hidden bg-[#0B2545] py-9">
                <div className="absolute inset-0">
                    <img
                        src={IMAGES.STUDENTS_STUDYING_7}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover opacity-70 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0B2545]/80 to-[#0B2545]/50" />
                </div>
                <div className="relative z-10 mx-auto max-w-[1108px] px-6">
                    <div className="flex items-center gap-4 md:gap-6 flex-wrap md:flex-nowrap">
                        {/* Avatar */}
                        {teacher.avatarUrl ? (
                            <img
                                src={teacher.avatarUrl}
                                alt={teacher.name}
                                className="w-20 h-20 md:w-[100px] md:h-[100px] rounded-full object-cover flex-shrink-0 ring-2 ring-white/20"
                            />
                        ) : (
                            <div
                                aria-label={teacher.name}
                                className="w-20 h-20 md:w-[100px] md:h-[100px] rounded-full border-[3px] border-white/15 bg-white/10 flex items-center justify-center flex-shrink-0 text-white text-2xl md:text-3xl font-bold"
                                style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                                {teacher.name.split(/\s+/).filter(Boolean).map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl md:text-[28px] font-bold text-white leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{teacher.name}</h1>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-semibold text-white" title="Profil examiné et validé par l'équipe Care4Success">
                                    <BadgeCheck className="w-3.5 h-3.5 text-[#F5A623]" /> Coach vérifié
                                </span>
                            </div>
                            {teacher.headline && <p className="text-white/90 text-sm mt-1">{stripEmoji(teacher.headline)}</p>}
                            <p className="text-blue-200 text-sm mt-1.5">
                                {[...teacher.subjects, teacher.city || teacher.region || teacher.country].filter(Boolean).join(" · ")}
                            </p>
                            <div className="flex items-center gap-1 mt-2 text-[#F5A623] text-sm">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star key={i} className={`w-3 h-3 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-white/20"}`} />
                                ))}
                                <span className="ml-1">{teacher.rating.toFixed(1)} ({teacher.reviewsCount} avis)</span>
                            </div>
                        </div>

                        {/* Prix */}
                        <div className="w-full md:w-auto flex items-baseline gap-2 md:block md:text-right flex-shrink-0">
                            <p className="text-[26px] md:text-[32px] font-bold text-[#F5A623] leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>{formatMoney(teacher.rate, teacher.currency)}/h</p>
                            <p className="text-[11px] text-blue-200/80 md:mt-1">par session</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Contenu principal ── */}
            <section className="mx-auto max-w-[1108px] px-6 py-9 pb-16">
                <div className="grid md:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">

                    {/* Colonne gauche */}
                    <div className="space-y-5">

                        {/* Vidéo de présentation */}
                        {toEmbedUrl(teacher.videoIntroUrl) && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-3">
                                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                                    <iframe
                                        src={toEmbedUrl(teacher.videoIntroUrl)!}
                                        title={`Présentation de ${teacher.name}`}
                                        className="w-full h-full"
                                        loading="lazy"
                                        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                                        allowFullScreen
                                    />
                                </div>
                            </div>
                        )}

                        {/* Card À propos */}
                        {teacher.bio && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                                <h2 className={SECTION_TITLE + " mb-3"} style={{ fontFamily: "'Playfair Display', serif" }}>À propos</h2>
                                <RichText text={teacher.bio} />
                            </div>
                        )}

                        {!toEmbedUrl(teacher.videoIntroUrl) && <EducationCard teacher={teacher} />}
                    </div>

                    {/* Colonne droite */}
                    <div className="space-y-5">
                        <ReservationPanel teacher={teacher} slots={teacher.slots} onZoom={setLightboxUrl} />

                        {/* Stats */}
                        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-[#F4F2ED] rounded-xl py-4 sm:py-6 px-1 text-center">
                                    <p className="text-2xl font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>{teacher.students}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">sessions</p>
                                </div>
                                <div className="bg-[#F4F2ED] rounded-xl py-4 sm:py-6 px-1 text-center">
                                    <p className="text-2xl font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>{teacher.rating.toFixed(1)}</p>
                                    <p className="text-[11px] text-gray-500 mt-1">note moyenne</p>
                                </div>
                                <div className="bg-[#F4F2ED] rounded-xl py-4 sm:py-6 px-1 text-center">
                                    <p className="text-2xl font-bold text-[#0D2D5A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                                        {teacher.yearsExperience ?? (teacher.formats.length || teacher.subjects.length)}
                                    </p>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {teacher.yearsExperience != null ? (teacher.yearsExperience > 1 ? "ans d'expérience" : "an d'expérience") : teacher.formats.length ? "formats" : "matières"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card Langues parlées */}
                        {teacher.languages.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                                <h2 className={SECTION_TITLE + " mb-3"} style={{ fontFamily: "'Playfair Display', serif" }}>Langues parlées</h2>
                                <div className="flex flex-wrap gap-2">
                                    {teacher.languages.map(l => (
                                        <span key={l.name} className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-[#F4F2ED] text-[#0D2D5A]">
                                            <span className="font-semibold">{l.name}</span>
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white text-gray-500">{l.level}</span>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {toEmbedUrl(teacher.videoIntroUrl) && <EducationCard teacher={teacher} />}

                        {/* Card Style d'enseignement */}
                        {teacher.qualities.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                                <h2 className={SECTION_TITLE + " mb-3"} style={{ fontFamily: "'Playfair Display', serif" }}>Style d'enseignement</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {teacher.qualities.map(q => (
                                        <span key={q} className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#F4F2ED] text-[#0D2D5A]">
                                            <Check className="w-3 h-3 text-[#0F9B8E]" /> {q}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Card Formats disponibles */}
                        {teacher.formats.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6">
                                <h2 className={SECTION_TITLE + " mb-3"} style={{ fontFamily: "'Playfair Display', serif" }}>Formats disponibles</h2>
                                <div className="flex flex-wrap gap-1.5">
                                    {teacher.formats.map((f: string) => {
                                        const c = formatColor(f);
                                        return (
                                            <span key={f} className={`text-xs px-3 py-1.5 rounded-full ${c.bg} ${c.text}`}>
                                                {f}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="mt-6 space-y-5">
                    <SpecialtiesSection teacher={teacher} />
                    <ReviewsSection teacher={teacher} />
                </div>
            </section>

            {/* ── Lightbox (affiche de cours) ── */}
            <AnimatePresence>
                {lightboxUrl && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
                        onClick={() => setLightboxUrl(null)}
                    >
                        <button
                            className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/40 rounded-full p-2 transition-colors"
                            onClick={() => setLightboxUrl(null)}
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <motion.img
                            initial={{ opacity: 0, scale: 0.92 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.92 }}
                            src={lightboxUrl}
                            alt="Affiche du cours"
                            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
