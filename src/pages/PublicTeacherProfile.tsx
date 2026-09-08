import { useRef, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Star, MapPin, Calendar, Clock, ArrowLeft, ArrowRight,
    Loader2, CheckCircle2, GraduationCap, Users, X, BookOpen,
    CreditCard, Phone, Mail, User, ChevronRight, Sparkles,
} from "lucide-react";
import {
    fetchPublicTeacherProfile,
    initiateBooking,
    authorizeBookingCharge,
    checkBookingStatus,
    type TeacherSlot,
    type MobileMoneyNetwork,
} from "@/api/public";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const formatSlotDate = (value: string) =>
    new Date(value).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

const formatSlotTime = (value: string) =>
    new Date(value).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

type BookingStep = "form" | "otp" | "waiting" | "redirect" | "success";

// â”€â”€â”€ Slot Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function SlotCard({
    slot,
    selected,
    onSelect,
    onZoom,
}: {
    slot: TeacherSlot;
    selected: boolean;
    onSelect: () => void;
    onZoom: (url: string) => void;
}) {
    return (
        <motion.button
            layout
            onClick={onSelect}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`group text-left rounded-2xl border-2 overflow-hidden transition-all duration-200 w-full bg-white ${
                selected
                    ? "border-[#1A6CC8] shadow-[0_0_0_4px_rgba(26,108,200,0.12)]"
                    : "border-gray-100 hover:border-[#1A6CC8]/40 hover:shadow-md"
            }`}
        >
            {/* Poster */}
            {slot.posterUrl ? (
                <div
                    className="relative overflow-hidden h-36 cursor-zoom-in"
                    onClick={(e) => { e.stopPropagation(); onZoom(slot.posterUrl!); }}
                >
                    <img
                        src={slot.posterUrl}
                        alt="Affiche du cours"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    {slot.subject && (
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-[#1A6CC8]/90 px-2 py-0.5 rounded-full uppercase tracking-wide">
                            {slot.subject}
                        </span>
                    )}
                </div>
            ) : (
                slot.subject && (
                    <div className="h-9 bg-gradient-to-r from-[#0D2D5A] to-[#1A6CC8] flex items-center px-4">
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest">{slot.subject}</span>
                    </div>
                )
            )}

            {/* Info */}
            <div className="p-4">
                <p className="text-sm font-bold text-[#0D2D5A] capitalize leading-tight">
                    {formatSlotDate(slot.startTime)}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#1A6CC8]" />
                    {formatSlotTime(slot.startTime)} â€“ {formatSlotTime(slot.endTime)}
                </p>
                <div className={`mt-3 flex items-center justify-between transition-colors ${selected ? "text-[#1A6CC8]" : "text-gray-300 group-hover:text-[#1A6CC8]/60"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {selected ? "SÃ©lectionnÃ© âœ“" : "Choisir ce crÃ©neau"}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5" />
                </div>
            </div>
        </motion.button>
    );
}

// â”€â”€â”€ Booking Panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
                // erreur transitoire â€” on continue de sonder
            }
            if (pollAttempts.current >= 20) {
                if (pollTimer.current) clearInterval(pollTimer.current);
                setError("Paiement non confirmÃ© aprÃ¨s plusieurs minutes. VÃ©rifiez votre tÃ©lÃ©phone ou rÃ©essayez.");
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
            setError(err instanceof Error ? err.message : "Impossible d'initier la rÃ©servation.");
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
                setError("Code invalide, rÃ©essayez.");
                setCode("");
            } else {
                setStep("waiting");
                startPolling(charge.reference);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Autorisation refusÃ©e.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sticky top-6"
        >
            {/* Header du panel */}
            <div className="bg-gradient-to-r from-[#0D2D5A] to-[#1A6CC8] p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">RÃ©servation</p>
                <p className="text-sm font-bold text-white capitalize">{formatSlotDate(slot.startTime)}</p>
                <p className="text-xs text-blue-200 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />
                    {formatSlotTime(slot.startTime)} â€“ {formatSlotTime(slot.endTime)}
                    <span className="mx-1 opacity-40">Â·</span>
                    {teacherName}
                </p>
                {amount && step !== "success" && (
                    <div className="mt-3 pt-3 border-t border-white/20">
                        <p className="text-xs text-blue-200">Montant Ã  payer</p>
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
                                        <Label className="text-xs text-gray-600">TÃ©lÃ©phone</Label>
                                        <div className="relative">
                                            <Phone className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <Input value={parentPhone} onChange={e => setParentPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="h-9 text-sm pl-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section Ã©lÃ¨ve */}
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                                    <GraduationCap className="w-3 h-3" /> L'Ã©lÃ¨ve
                                </p>
                                <div className="space-y-2.5">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">Nom de l'Ã©lÃ¨ve *</Label>
                                        <Input value={studentName} onChange={e => setStudentName(e.target.value)} placeholder="Nom de l'enfant (ou le vÃ´tre)" className="h-9 text-sm" />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600">MatiÃ¨re souhaitÃ©e</Label>
                                        <div className="relative">
                                            <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                            <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Ex: MathÃ©matiques" className="h-9 text-sm pl-8" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Section paiement */}
                            <div className="bg-[#f4f6fb] rounded-xl p-4 space-y-2.5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                                    <CreditCard className="w-3 h-3" /> Paiement Mobile Money
                                </p>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">OpÃ©rateur *</Label>
                                    <Select value={network} onValueChange={v => setNetwork(v as MobileMoneyNetwork)}>
                                        <SelectTrigger className="h-9 text-sm bg-white"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MTN">MTN Mobile Money</SelectItem>
                                            <SelectItem value="ORANGE">Orange Money</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-600">NumÃ©ro Mobile Money *</Label>
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
                                className="w-full h-10 text-sm font-bold bg-[#1A6CC8] hover:bg-[#155aa8] text-white rounded-xl"
                                disabled={submitting}
                                onClick={handleSubmit}
                            >
                                {submitting ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Initialisation...</>
                                ) : (
                                    <>RÃ©server et payer <ArrowRight className="w-4 h-4 ml-1.5" /></>
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
                                <p className="text-sm font-bold text-[#0D2D5A]">VÃ©rification requise</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {otpType === "pin" ? "Entrez votre code PIN Mobile Money." : "Entrez le code reÃ§u par SMS."}
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
                                className="w-full h-10 text-sm font-bold bg-[#1A6CC8] hover:bg-[#155aa8] text-white rounded-xl"
                                disabled={!code.trim() || submitting}
                                onClick={handleAuthorize}
                            >
                                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> VÃ©rification...</> : "Valider"}
                            </Button>
                        </motion.div>
                    )}

                    {step === "redirect" && testRedirectUrl && (
                        <motion.div key="redirect" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-4 text-center">
                            <p className="text-xs text-gray-500">Environnement de test â€” validez le paiement sur la page Flutterwave.</p>
                            <Button
                                className="w-full h-10 text-sm font-bold bg-[#1A6CC8] hover:bg-[#155aa8] text-white rounded-xl"
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
                                <p className="text-xs text-gray-500 mt-1">Validez la transaction sur votre tÃ©lÃ©phone<br />({network === "MTN" ? "MTN Mobile Money" : "Orange Money"})</p>
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
                                <p className="text-base font-black text-[#0D2D5A]">RÃ©servation confirmÃ©e !</p>
                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    Un email de confirmation avec le lien de votre classe virtuelle a Ã©tÃ© envoyÃ© Ã  <b>{parentEmail}</b>.
                                </p>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </motion.div>
    );
}

// â”€â”€â”€ Page principale â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function PublicTeacherProfile() {
    const { id } = useParams<{ id: string }>();
    const [selectedSlot, setSelectedSlot] = useState<TeacherSlot | null>(null);
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
            <div className="min-h-screen flex items-center justify-center bg-[#f4f6fb]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
                    <p className="text-sm text-gray-400">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (isError || !teacher) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center px-6 bg-[#f4f6fb]">
                <p className="text-xl font-bold text-[#0D2D5A]">Enseignant introuvable</p>
                <NavLink to="/professeurs" className="text-[#1A6CC8] font-semibold hover:underline text-sm">
                    â† Retour Ã  l'annuaire
                </NavLink>
            </div>
        );
    }

    const initials = teacher.name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

    return (
        <div className="min-h-screen bg-[#f4f6fb]" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>

            {/* â”€â”€ Hero â”€â”€ */}
            <section className="bg-gradient-to-br from-[#0D2D5A] via-[#0f3870] to-[#1A6CC8] pt-10 pb-20 relative overflow-hidden">
                <div
                    className="absolute inset-0 opacity-[0.05]"
                    style={{
                        backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                    }}
                />
                <div className="w-full px-6 md:px-12 xl:px-20 relative">
                    <NavLink
                        to="/professeurs"
                        className="inline-flex items-center gap-1.5 text-blue-200/80 hover:text-white text-xs font-semibold mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" /> Retour Ã  l'annuaire
                    </NavLink>

                    <div className="flex items-start gap-6 flex-wrap md:flex-nowrap">
                        {/* Avatar */}
                        {teacher.avatarUrl ? (
                            <img
                                src={teacher.avatarUrl}
                                alt={teacher.name}
                                className="w-24 h-24 rounded-2xl object-cover flex-shrink-0 ring-4 ring-white/20 shadow-xl"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center font-black text-2xl text-white flex-shrink-0 ring-4 ring-white/20">
                                {initials}
                            </div>
                        )}

                        {/* Info */}
                        <div className="flex-1 min-w-0 pt-1">
                            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight">{teacher.name}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                                <div className="flex items-center gap-1">
                                    {[1,2,3,4,5].map(i => (
                                        <Star key={i} className={`w-4 h-4 ${i <= Math.floor(teacher.rating) ? "fill-[#F5A623] text-[#F5A623]" : "text-white/20"}`} />
                                    ))}
                                    <span className="text-[#F5A623] text-sm font-bold ml-1">{teacher.rating.toFixed(1)}</span>
                                </div>
                                {(teacher.city || teacher.region || teacher.country) && (
                                    <span className="flex items-center gap-1 text-blue-200 text-xs">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {[teacher.city, teacher.region, teacher.country].filter(Boolean).join(", ")}
                                    </span>
                                )}
                                <span className="flex items-center gap-1 text-blue-200 text-xs">
                                    <Users className="w-3.5 h-3.5" />
                                    {teacher.students} Ã©lÃ¨ve{teacher.students > 1 ? "s" : ""}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-4">
                                {teacher.subjects.slice(0, 6).map((s: string) => (
                                    <span key={s} className="text-[10px] px-2.5 py-1 rounded-full bg-white/15 text-white font-semibold border border-white/20">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Prix card desktop */}
                        <div className="hidden md:flex flex-col items-center bg-white/10 backdrop-blur rounded-2xl px-6 py-5 border border-white/20 flex-shrink-0 text-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-200 mb-1">Tarif</p>
                            <p className="text-2xl font-black text-white">{formatMoney(teacher.rate, teacher.currency)}</p>
                            <p className="text-xs text-blue-200 mt-0.5">/ {teacher.rateUnitMinutes} min</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Contenu principal â”€â”€ */}
            <section className="w-full px-6 md:px-12 xl:px-20 -mt-10 pb-16">
                <div className="grid md:grid-cols-5 gap-6 items-start">

                    {/* Colonne gauche (2/3) */}
                    <div className="md:col-span-3 space-y-5">

                        {/* Card infos */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                                <GraduationCap className="w-3.5 h-3.5 text-[#1A6CC8]" /> Ã€ propos
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="bg-[#f4f6fb] rounded-xl p-4">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">MatiÃ¨res</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {teacher.subjects.map((s: string) => (
                                            <span key={s} className="text-xs px-2.5 py-0.5 rounded-full bg-[#1A6CC8]/10 text-[#1A6CC8] font-semibold border border-[#1A6CC8]/15">
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                {teacher.level && (
                                    <div className="bg-[#f4f6fb] rounded-xl p-4">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Niveaux</p>
                                        <p className="text-sm font-semibold text-[#0D2D5A]">{teacher.level}</p>
                                    </div>
                                )}
                                <div className="bg-[#f4f6fb] rounded-xl p-4 md:hidden">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">Tarif</p>
                                    <p className="text-base font-black text-[#0D2D5A]">
                                        {formatMoney(teacher.rate, teacher.currency)}
                                        <span className="font-normal text-gray-400 text-xs ml-1">/ {teacher.rateUnitMinutes} min</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Card crÃ©neaux */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-[#1A6CC8]" /> CrÃ©neaux disponibles
                                </h2>
                                {teacher.slots.length > 0 && (
                                    <span className="text-[10px] font-bold bg-[#1A6CC8]/10 text-[#1A6CC8] px-2.5 py-1 rounded-full">
                                        {teacher.slots.length} disponible{teacher.slots.length > 1 ? "s" : ""}
                                    </span>
                                )}
                            </div>
                            {teacher.slots.length === 0 ? (
                                <div className="flex flex-col items-center text-center py-10 gap-3">
                                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Calendar className="w-5 h-5 text-gray-300" />
                                    </div>
                                    <p className="text-sm text-gray-400">Aucun crÃ©neau ouvert pour le moment.</p>
                                    <p className="text-xs text-gray-400">Contactez-nous pour Ãªtre mis en relation.</p>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {teacher.slots.map((slot: TeacherSlot) => (
                                        <SlotCard
                                            key={slot.id}
                                            slot={slot}
                                            selected={selectedSlot?.id === slot.id}
                                            onSelect={() => setSelectedSlot(slot)}
                                            onZoom={setLightboxUrl}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Colonne droite (1/3) */}
                    <div className="md:col-span-2">
                        <AnimatePresence mode="wait">
                            {selectedSlot ? (
                                <BookingPanel
                                    key={selectedSlot.id}
                                    teacherName={teacher.name}
                                    slot={selectedSlot}
                                    onCancel={() => setSelectedSlot(null)}
                                />
                            ) : (
                                <motion.div
                                    key="placeholder"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center shadow-sm sticky top-6"
                                >
                                    <div className="w-12 h-12 rounded-full bg-[#1A6CC8]/8 flex items-center justify-center mx-auto mb-3">
                                        <Sparkles className="w-5 h-5 text-[#1A6CC8]/40" />
                                    </div>
                                    <p className="text-sm font-semibold text-gray-500">Choisissez un crÃ©neau</p>
                                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">et rÃ©servez votre sÃ©ance directement en ligne.</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            {/* â”€â”€ Lightbox â”€â”€ */}
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
