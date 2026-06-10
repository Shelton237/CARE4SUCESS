import React, { useState } from "react";
import { ALL_LEVELS, ALL_SUBJECTS } from "@/lib/education";
import { useNavigate } from "react-router-dom";
import { User, Mail, Lock, Phone, MapPin, UserPlus, BookOpen, GraduationCap, CheckCircle, ArrowRight, Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ROUTE_PATHS } from "@/lib";

export default function Inscription() {
    const navigate = useNavigate();
    const [step, setStep] = useState(0); // Step 0 for role selection
    const [userType, setUserType] = useState<"parent" | "student">("parent");
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        parentName: "",
        parentEmail: "",
        parentPassword: "",
        parentPhone: "",
        parentLocation: "",
        children: [
            { id: Date.now(), name: "", level: ALL_LEVELS.includes("6ème") ? "6ème" : ALL_LEVELS[0], subject: ["Mathématiques"], email: "", password: "" }
        ]
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleChildChange = (id: number, field: string, value: string) => {
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
            
            // Format data for backend
            const payload = {
                parentName: formData.parentName,
                parentEmail: formData.parentEmail,
                parentPassword: formData.parentPassword,
                parentPhone: formData.parentPhone,
                parentLocation: formData.parentLocation || undefined,
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
                setStep(4); // Success step
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

    return (
        <div className="min-h-screen pt-24 pb-12 bg-slate-50">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-[#0D2D5A] mb-2">
                        {step === 0 ? "Bienvenue sur Care4Success" : userType === "parent" ? "Inscription Parent" : "Inscription Élève"}
                    </h1>
                    <p className="text-slate-600">
                        {step === 0 ? "Choisissez votre profil pour continuer" : "Rejoignez notre communauté éducative."}
                    </p>
                </div>

                {/* Progress Bar (visible only after step 0) */}
                {step > 0 && (
                    <div className="flex justify-between mb-8 relative">
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 z-0" />
                        <div
                            className="absolute top-1/2 left-0 h-1 bg-[#1A6CC8] -translate-y-1/2 z-0 transition-all duration-500"
                            style={{ width: `${((step - 1) / 2) * 100}%` }}
                        />
                        {[1, 2, 3].map((s) => (
                            <div
                                key={s}
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= s ? "bg-[#1A6CC8] text-white" : "bg-white text-slate-400 border-2 border-slate-200"
                                    }`}
                            >
                                {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                            </div>
                        ))}
                    </div>
                )}

                <Card className="border-none shadow-xl overflow-hidden">
                    <CardContent className="pt-8">
                        {step === 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                                <div
                                    onClick={() => { setUserType("parent"); setStep(1); }}
                                    className="group p-6 border-2 border-slate-100 rounded-2xl hover:border-[#1A6CC8] hover:bg-blue-50/50 cursor-pointer transition-all text-center space-y-4"
                                >
                                    <div className="w-16 h-16 bg-[#1A6CC8] text-white rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <User className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2D5A]">Je suis un Parent</h3>
                                        <p className="text-sm text-slate-500 mt-2">Je souhaite inscrire mon enfant pour un suivi personnalisé.</p>
                                    </div>
                                </div>

                                <div
                                    onClick={() => { setUserType("student"); setStep(1); }}
                                    className="group p-6 border-2 border-slate-100 rounded-2xl hover:border-[#F5A623] hover:bg-orange-50/50 cursor-pointer transition-all text-center space-y-4"
                                >
                                    <div className="w-16 h-16 bg-[#F5A623] text-white rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                                        <GraduationCap className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#0D2D5A]">Je suis un Élève</h3>
                                        <p className="text-sm text-slate-500 mt-2">Je m'inscris moi-même pour booster mes résultats scolaires.</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 1 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <User className="text-[#1A6CC8]" /> {userType === "parent" ? "Informations Parent" : "Informations Responsable (Parent/Tuteur)"}
                                </h2>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Nom complet</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10" name="parentName" placeholder={userType === "parent" ? "Ex: Jean Dupont" : "Nom du parent ou tuteur"} value={formData.parentName} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email de connexion</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10" type="email" name="parentEmail" placeholder="votre@email.com" value={formData.parentEmail} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Téléphone</label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input className="pl-10" name="parentPhone" placeholder="+237 ..." value={formData.parentPhone} onChange={handleChange} />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Mot de passe</label>
                                            <div className="relative">
                                                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                                <Input className="pl-10" type="password" name="parentPassword" placeholder="••••••••" value={formData.parentPassword} onChange={handleChange} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Ville / Quartier</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                                            <Input className="pl-10" name="parentLocation" placeholder="Ex: Douala Bonamoussadi" value={formData.parentLocation} onChange={handleChange} />
                                        </div>
                                        <p className="text-xs text-slate-400">Permet de vous suggérer les enseignants les plus proches de chez vous.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="ghost" onClick={() => setStep(0)}>Changer de profil</Button>
                                    <Button className="flex-1 bg-[#1A6CC8] hover:bg-[#0D2D5A]" onClick={handleNext}>
                                        {userType === "parent" ? "Continuer vers l'enfant" : "Mes informations scolaires"} <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-6">
                                <h2 className="text-xl font-bold text-[#0D2D5A] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-[#1A6CC8]/10 rounded-lg text-[#1A6CC8]">
                                            <GraduationCap className="w-5 h-5" />
                                        </div>
                                        {userType === "parent" ? "Informations des enfants" : "Informations scolaires"}
                                    </div>
                                    {userType === "parent" && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={addChild}
                                            className="text-xs font-bold border-dashed border-2 border-[#1A6CC8]/50 text-[#1A6CC8] hover:bg-[#1A6CC8]/5"
                                        >
                                            <Plus className="w-4 h-4 mr-1" /> Ajouter un enfant
                                        </Button>
                                    )}
                                </h2>
                                
                                <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {formData.children.map((child, index) => (
                                        <div key={child.id} className="p-5 rounded-2xl border-2 border-slate-100 bg-white shadow-sm hover:border-[#1A6CC8]/30 transition-colors space-y-5 relative">
                                            {userType === "parent" && (
                                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" /> Enfant #{index + 1}
                                                    </span>
                                                    {formData.children.length > 1 && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            onClick={() => removeChild(child.id)}
                                                            className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">{userType === "parent" ? "Nom de l'enfant" : "Mon nom complet"}</label>
                                                    <div className="relative">
                                                        <Input 
                                                            className="h-11 bg-slate-50/50"
                                                            placeholder={userType === "parent" ? "Ex: Marie Dupont" : "Votre nom complet"} 
                                                            value={child.name} 
                                                            onChange={(e) => handleChildChange(child.id, "name", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-xs font-bold text-slate-600">Email (Obligatoire)</label>
                                                    <div className="relative">
                                                        <Input 
                                                            type="email"
                                                            required
                                                            className="h-11 bg-slate-50/50"
                                                            placeholder={userType === "parent" ? "email.enfant@exemple.com" : "votre@email.com"} 
                                                            value={child.email} 
                                                            onChange={(e) => handleChildChange(child.id, "email", e.target.value)} 
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-xs font-bold text-slate-600">Niveau scolaire</label>
                                                <select
                                                    className="flex h-11 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/50 focus:border-[#1A6CC8] transition-all"
                                                    value={child.level}
                                                    onChange={(e) => handleChildChange(child.id, "level", e.target.value)}
                                                >
                                                    {ALL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                                                </select>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold text-slate-600">Matières prioritaires (plusieurs choix possibles)</label>
                                                <div className="flex flex-wrap gap-2">
                                                    {ALL_SUBJECTS.map(sub => {
                                                        const isSelected = Array.isArray(child.subject) && child.subject.includes(sub);
                                                        return (
                                                            <button
                                                                key={sub}
                                                                type="button"
                                                                className={`px-3 py-2 text-[11px] font-bold rounded-lg border transition-all ${isSelected ? 'bg-[#1A6CC8] text-white border-[#1A6CC8] shadow-md shadow-[#1A6CC8]/20' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1A6CC8]/50 hover:bg-blue-50'}`}
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
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-1/2" onClick={handlePrev}>Retour</Button>
                                    <Button className="w-1/2 bg-[#1A6CC8] hover:bg-[#0D2D5A]" onClick={handleNext}>Suivant</Button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 text-center">
                                <div className="p-4 bg-blue-50 rounded-lg text-left text-sm text-blue-800 space-y-2">
                                    <strong>Résumé :</strong><br />
                                    <div className="flex justify-between">
                                        <span>Responsable :</span>
                                        <span className="font-bold">{formData.parentName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Contact :</span>
                                        <span className="font-bold">{formData.parentPhone}</span>
                                    </div>
                                    <div className="pt-2 border-t border-blue-100">
                                        <span className="font-bold">{formData.children.length} Enfant(s) inscrit(s) :</span>
                                        <ul className="mt-2 space-y-1 pl-4 list-disc">
                                            {formData.children.map((c, i) => (
                                                <li key={i}>{c.name} ({c.level}) - {c.subject}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-slate-500">Mode de paiement préféré</label>
                                    <div className="flex justify-center gap-4">
                                        <div className="p-4 border rounded-lg cursor-pointer hover:border-[#1A6CC8] transition-colors bg-white">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/9/93/Orange-logo.svg" alt="Orange" className="w-12 h-12 object-contain" />
                                        </div>
                                        <div className="p-4 border rounded-lg cursor-pointer hover:border-[#1A6CC8] transition-colors bg-white">
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/MTN_Logo.svg/1024px-MTN_Logo.svg.png" alt="MTN" className="w-12 h-12 object-contain" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-400 italic">Un conseiller Care4Success vous contactera pour valider votre dossier.</p>
                                </div>
                                <div className="flex gap-4">
                                    <Button variant="outline" className="w-1/2" onClick={handlePrev} disabled={loading}>Retour</Button>
                                    <Button
                                        className="w-1/2 bg-[#F5A623] hover:bg-[#d48c1f] text-white"
                                        onClick={handleSubmit}
                                        disabled={loading}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                        Confirmer l'inscription
                                    </Button>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="text-center py-8 space-y-6 animate-in fade-in zoom-in duration-500">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                    <CheckCircle className="w-12 h-12" />
                                </div>
                                <h2 className="text-2xl font-bold text-[#0D2D5A]">Félicitations !</h2>
                                <p className="text-slate-600">
                                    Votre compte {userType === "parent" ? "parent" : "élève"} a été créé avec succès. Un conseiller va vous appeler sur le <strong>{formData.parentPhone}</strong> pour finaliser votre accompagnement.
                                </p>
                                <Button className="bg-[#1A6CC8]" onClick={() => navigate("/login")}>
                                    Se connecter maintenant
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
