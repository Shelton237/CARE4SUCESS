import React, { useState } from "react";
import { ALL_LEVELS, ALL_SUBJECTS } from "@/lib/education";
import { useNavigate } from "react-router-dom";
import {
    User, Mail, Lock, Phone, UserPlus, GraduationCap,
    CheckCircle, ArrowRight, Loader2, Plus, Trash2, ShieldCheck
} from "lucide-react";
import { GeoSelector } from "@/components/GeoSelector";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ROUTE_PATHS } from "@/lib";

export default function Inscription() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0);
    const [userType, setUserType] = useState<"parent" | "student">("parent");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        parentName: "",
        parentEmail: "",
        parentPassword: "",
        parentPhone: "",
        parentLocation: "",
        parentGeoLocationId: null as number | null,
        children: [
            { id: Date.now(), name: "", level: ALL_LEVELS.includes("6ème") ? "6ème" : ALL_LEVELS[0], subject: ["Mathématiques"], email: "", password: "" }
        ]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChildChange = (id: number, field: string, value: any) => {
        setFormData({
            ...formData,
            children: formData.children.map(child =>
                child.id === id ? { ...child, [field]: value } : child
            )
        });
    };

    const addChild = () => {
        setFormData({
            ...formData,
            children: [
                ...formData.children,
                { id: Date.now(), name: "", level: ALL_LEVELS.includes("6ème") ? "6ème" : ALL_LEVELS[0], subject: ["Mathématiques"], email: "", password: "" }
            ]
        });
    };

    const removeChild = (id: number) => {
        if (formData.children.length > 1) {
            setFormData({
                ...formData,
                children: formData.children.filter(c => c.id !== id)
            });
        }
    };

    const handleNext = () => setStep(step + 1);
    const handlePrev = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.children.some(c => !c.email)) {
            alert("Veuillez renseigner l'adresse email de chaque enfant.");
            return;
        }
        setLoading(true);
        try {
            const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";
            const payload = {
                parentName: formData.parentName,
                parentEmail: formData.parentEmail,
                parentPassword: formData.parentPassword,
                parentPhone: formData.parentPhone,
                parentLocation: formData.parentLocation || undefined,
                parentGeoLocationId: formData.parentGeoLocationId ?? undefined,
                userType,
                children: formData.children.map(c => ({
                    name: c.name,
                    email: c.email,
                    password: c.password,
                    level: c.level,
                    subject: Array.isArray(c.subject) ? c.subject.join(", ") : c.subject
                }))
            };
            const response = await fetch(`${API_BASE_URL}/parents/enroll`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (response.ok) {
                setStep(4);
            } else {
                const err = await response.json();
                alert(err.message || "Une erreur est survenue lors de l'enrôlement.");
            }
        } catch (error) {
            console.error(error);
            alert("Erreur de connexion au serveur.");
        } finally {
            setLoading(false);
        }
    };

    const STEP_LABELS = userType === "parent"
        ? ["Compte", "Enfants", "Validation"]
        : ["Compte", "Scolarité", "Validation"];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Brand bar */}
            <div className="bg-[#0D2D5A] px-5 py-3.5 flex items-center gap-3 flex-shrink-0">
                <div className="w-7 h-7 bg-[#F5A623] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4 text-[#0D2D5A]" />
                </div>
                <span className="text-white font-black text-[11px] tracking-[0.25em] uppercase">Care4Success</span>
                <div className="ml-auto text-[10px] text-blue-300 font-medium">
                    Déjà membre ?{" "}
                    <button onClick={() => navigate("/login")} className="text-[#F5A623] font-bold hover:underline underline-offset-2 cursor-pointer">
                        Se connecter
                    </button>
                </div>
            </div>

            <div className="flex-1 py-8 px-4">
                <div className="max-w-lg mx-auto">
                    {/* Title */}
                    <div className="mb-6">
                        <h1 className="text-[22px] font-black text-[#0D2D5A] leading-tight">
                            {step === 0 ? "Créer un compte" : userType === "parent" ? "Inscription Parent" : "Inscription Élève"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {step === 0
                                ? "Choisissez votre type de compte pour commencer"
                                : "Rejoignez la communauté Care4Success"}
                        </p>
                    </div>

                    {/* Progress stepper */}
                    {step > 0 && step < 4 && (
                        <div className="flex items-start mb-7">
                            {STEP_LABELS.map((label, idx) => {
                                const s = idx + 1;
                                const active = step === s;
                                const done = step > s;
                                return (
                                    <React.Fragment key={s}>
                                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                            <div className={`w-7 h-7 flex items-center justify-center text-xs font-black transition-colors ${done ? "bg-[#1A6CC8] text-white" : active ? "bg-[#0D2D5A] text-white" : "bg-slate-200 text-slate-400"}`}>
                                                {done ? <CheckCircle className="w-3.5 h-3.5" /> : s}
                                            </div>
                                            <span className={`text-[9px] font-black uppercase tracking-wider text-center w-14 leading-tight ${active ? "text-[#0D2D5A]" : done ? "text-[#1A6CC8]" : "text-slate-400"}`}>
                                                {label}
                                            </span>
                                        </div>
                                        {idx < STEP_LABELS.length - 1 && (
                                            <div className={`h-[2px] flex-1 mt-3.5 mx-1 transition-colors ${done ? "bg-[#1A6CC8]" : "bg-slate-200"}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    )}

                    {/* Main card */}
                    <div className="bg-white border-t-[3px] border-[#F5A623] shadow-sm">
                        <div className="p-6">

                            {/* ── STEP 0 : Sélection du rôle ── */}
                            {step === 0 && (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => { setUserType("parent"); setStep(1); }}
                                        className="w-full p-4 border-2 border-slate-100 hover:border-[#1A6CC8] hover:bg-blue-50/30 transition-all text-left group flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-[#0D2D5A] flex items-center justify-center flex-shrink-0 group-hover:bg-[#1A6CC8] transition-colors">
                                            <User className="w-5 h-5 text-[#F5A623]" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-black text-[#0D2D5A] text-sm">Je suis un Parent</p>
                                            <p className="text-xs text-slate-500 mt-0.5">J'inscris mon enfant pour un suivi personnalisé</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1A6CC8] transition-colors flex-shrink-0" />
                                    </button>

                                    <button
                                        onClick={() => { setUserType("student"); setStep(1); }}
                                        className="w-full p-4 border-2 border-slate-100 hover:border-[#F5A623] hover:bg-orange-50/30 transition-all text-left group flex items-center gap-4 cursor-pointer"
                                    >
                                        <div className="w-10 h-10 bg-amber-50 border border-[#F5A623]/30 flex items-center justify-center flex-shrink-0 group-hover:bg-[#F5A623] transition-colors">
                                            <GraduationCap className="w-5 h-5 text-[#F5A623] group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-black text-[#0D2D5A] text-sm">Je suis un Élève</p>
                                            <p className="text-xs text-slate-500 mt-0.5">Je m'inscris pour booster mes résultats scolaires</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#F5A623] transition-colors flex-shrink-0" />
                                    </button>

                                    <div className="flex items-center gap-2 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                                        <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                                        <span>Inscription gratuite — Aucune carte bancaire requise</span>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 1 : Informations du compte ── */}
                            {step === 1 && (
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {userType === "parent" ? "Nom complet (Parent / Tuteur)" : "Votre nom complet"}
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                                name="parentName"
                                                placeholder={userType === "parent" ? "Ex: Jean Dupont" : "Votre nom complet"}
                                                value={formData.parentName}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Adresse email</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                                type="email"
                                                name="parentEmail"
                                                placeholder="votre@email.com"
                                                value={formData.parentEmail}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Téléphone</label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                                name="parentPhone"
                                                placeholder="+237 6XX XXX XXX"
                                                value={formData.parentPhone}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mot de passe</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                                            <Input
                                                className="pl-9 h-11 rounded-none border-slate-200 focus-visible:ring-[#1A6CC8]"
                                                type="password"
                                                name="parentPassword"
                                                placeholder="••••••••"
                                                value={formData.parentPassword}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400">Minimum 8 caractères recommandés</p>
                                    </div>

                                    <div className="border-t border-slate-100 pt-4">
                                        <GeoSelector
                                            label="Ville / Quartier"
                                            onChange={(geoId, path) => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    parentGeoLocationId: geoId,
                                                    parentLocation: path,
                                                }));
                                            }}
                                            hint="Permet de vous suggérer les enseignants les plus proches de chez vous."
                                        />
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-none border-slate-200 text-slate-600 hover:bg-slate-50"
                                            onClick={() => setStep(0)}
                                        >
                                            ← Retour
                                        </Button>
                                        <Button
                                            className="flex-1 bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white rounded-none h-11 font-black text-[10px] tracking-widest uppercase"
                                            onClick={handleNext}
                                        >
                                            {userType === "parent" ? "Mes enfants" : "Ma scolarité"}
                                            <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 2 : Informations enfants / scolaires ── */}
                            {step === 2 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {userType === "parent" ? "Informations des enfants" : "Informations scolaires"}
                                        </p>
                                        {userType === "parent" && (
                                            <button
                                                type="button"
                                                onClick={addChild}
                                                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-[#1A6CC8] hover:text-[#0D2D5A] transition-colors cursor-pointer"
                                            >
                                                <Plus className="w-3.5 h-3.5" /> Ajouter
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3 max-h-[440px] overflow-y-auto">
                                        {formData.children.map((child, index) => (
                                            <div
                                                key={child.id}
                                                className="border-l-4 border-[#1A6CC8] bg-slate-50/70 p-4 space-y-3"
                                            >
                                                {userType === "parent" && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-[#1A6CC8]">
                                                            Enfant #{index + 1}
                                                        </span>
                                                        {formData.children.length > 1 && (
                                                            <button
                                                                onClick={() => removeChild(child.id)}
                                                                className="p-1 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            {userType === "parent" ? "Nom de l'enfant" : "Mon nom"}
                                                        </label>
                                                        <Input
                                                            className="h-10 rounded-none bg-white border-slate-200"
                                                            placeholder={userType === "parent" ? "Marie Dupont" : "Votre nom"}
                                                            value={child.name}
                                                            onChange={(e) => handleChildChange(child.id, "name", e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            Email <span className="text-red-400">*</span>
                                                        </label>
                                                        <Input
                                                            className="h-10 rounded-none bg-white border-slate-200"
                                                            type="email"
                                                            required
                                                            placeholder="email@exemple.com"
                                                            value={child.email}
                                                            onChange={(e) => handleChildChange(child.id, "email", e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Niveau scolaire</label>
                                                    <select
                                                        className="flex h-10 w-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#1A6CC8] focus:border-[#1A6CC8] transition-colors"
                                                        value={child.level}
                                                        onChange={(e) => handleChildChange(child.id, "level", e.target.value)}
                                                    >
                                                        {ALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Matières prioritaires</label>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {ALL_SUBJECTS.map(sub => {
                                                            const isSelected = Array.isArray(child.subject) && child.subject.includes(sub);
                                                            return (
                                                                <button
                                                                    key={sub}
                                                                    type="button"
                                                                    className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border transition-all cursor-pointer ${isSelected
                                                                        ? "bg-[#1A6CC8] text-white border-[#1A6CC8]"
                                                                        : "bg-white text-slate-500 border-slate-200 hover:border-[#1A6CC8] hover:text-[#1A6CC8]"}`}
                                                                    onClick={() => {
                                                                        const currentSubjects = Array.isArray(child.subject) ? child.subject : [];
                                                                        const newSubjects = isSelected
                                                                            ? currentSubjects.filter(s => s !== sub)
                                                                            : [...currentSubjects, sub];
                                                                        handleChildChange(child.id, "subject", newSubjects);
                                                                    }}
                                                                >
                                                                    {sub}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-none border-slate-200"
                                            onClick={handlePrev}
                                        >
                                            ← Retour
                                        </Button>
                                        <Button
                                            className="flex-1 bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white rounded-none h-11 font-black text-[10px] tracking-widest uppercase"
                                            onClick={handleNext}
                                        >
                                            Suivant <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 3 : Confirmation ── */}
                            {step === 3 && (
                                <div className="space-y-5">
                                    <div className="bg-[#0D2D5A]/5 border border-[#0D2D5A]/10 p-4 space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-[#0D2D5A]">Récapitulatif</p>
                                        <div className="space-y-0">
                                            <div className="flex justify-between items-center py-2 border-b border-[#0D2D5A]/10">
                                                <span className="text-xs text-slate-500">Responsable</span>
                                                <span className="text-xs font-bold text-[#0D2D5A]">{formData.parentName}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-[#0D2D5A]/10">
                                                <span className="text-xs text-slate-500">Téléphone</span>
                                                <span className="text-xs font-bold text-[#0D2D5A]">{formData.parentPhone}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-[#0D2D5A]/10">
                                                <span className="text-xs text-slate-500">Email</span>
                                                <span className="text-xs font-bold text-[#0D2D5A] truncate max-w-[180px]">{formData.parentEmail}</span>
                                            </div>
                                            <div className="pt-2">
                                                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                    {formData.children.length} Enfant{formData.children.length > 1 ? "s" : ""} inscrit{formData.children.length > 1 ? "s" : ""}
                                                </span>
                                                <ul className="mt-2 space-y-1">
                                                    {formData.children.map((c, i) => (
                                                        <li key={i} className="text-xs text-slate-600 flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 bg-[#1A6CC8] flex-shrink-0" />
                                                            <span>{c.name || `Enfant ${i + 1}`} — <span className="text-slate-400">{c.level}</span></span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mode de paiement préféré</p>
                                        <div className="flex gap-3">
                                            <div className="flex-1 p-3 border border-slate-200 hover:border-[#F5A623] cursor-pointer transition-colors flex items-center justify-center h-14">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Orange-logo.svg" alt="Orange Money" className="h-7 w-auto object-contain" />
                                            </div>
                                            <div className="flex-1 p-3 border border-slate-200 hover:border-[#F5A623] cursor-pointer transition-colors flex items-center justify-center h-14">
                                                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/MTN_Logo.svg/1024px-MTN_Logo.svg.png" alt="MTN Mobile Money" className="h-7 w-auto object-contain" />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                            Un conseiller Care4Success vous contactera pour finaliser votre dossier d'inscription.
                                        </p>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="rounded-none border-slate-200"
                                            onClick={handlePrev}
                                            disabled={loading}
                                        >
                                            ← Retour
                                        </Button>
                                        <Button
                                            className="flex-1 bg-[#F5A623] hover:bg-[#d48c1f] text-[#0D2D5A] rounded-none h-11 font-black text-[10px] tracking-widest uppercase"
                                            onClick={handleSubmit}
                                            disabled={loading}
                                        >
                                            {loading
                                                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Envoi…</>
                                                : <><UserPlus className="w-4 h-4 mr-2" /> Confirmer l'inscription</>
                                            }
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* ── STEP 4 : Succès ── */}
                            {step === 4 && (
                                <div className="text-center py-6 space-y-5">
                                    <div className="w-14 h-14 bg-[#0D2D5A] flex items-center justify-center mx-auto">
                                        <CheckCircle className="w-7 h-7 text-[#F5A623]" />
                                    </div>
                                    <div className="space-y-2">
                                        <h2 className="text-xl font-black text-[#0D2D5A]">Félicitations !</h2>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                                            Votre compte {userType === "parent" ? "parent" : "élève"} a bien été créé. Un conseiller vous appellera au{" "}
                                            <strong className="text-[#0D2D5A]">{formData.parentPhone}</strong> pour finaliser votre accompagnement.
                                        </p>
                                    </div>
                                    <Button
                                        className="bg-[#0D2D5A] hover:bg-[#1A6CC8] text-white rounded-none font-black text-[10px] tracking-widest uppercase px-8 h-11"
                                        onClick={() => navigate("/login")}
                                    >
                                        Se connecter <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Trust footer */}
                    {step < 4 && (
                        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Vos données sont protégées et ne sont jamais partagées avec des tiers</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
