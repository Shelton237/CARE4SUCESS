import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    User, Mail, Phone, MapPin, Globe, Camera, Shield,
    Bell, CreditCard, Save, Loader2, Calendar, Briefcase,
    BadgeCheck, ShieldCheck, ChevronRight, UserCircle2, ArrowLeft
} from "lucide-react";
import { fetchUserProfile, updateUserProfile, uploadUserAvatar } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TeacherProfile() {
    const { user: authUser } = useAuth();
    const queryClient = useQueryClient();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [activeTab, setActiveTab] = useState("personal");

    const { data: profile, isLoading } = useQuery({
        queryKey: ["userProfile", authUser?.id],
        queryFn: () => fetchUserProfile(authUser!.id),
        enabled: !!authUser?.id,
    });

    const updateMutation = useMutation({
        mutationFn: (payload: any) => updateUserProfile(authUser!.id, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            toast.success("Profil mis à jour ✅");
        }
    });

    const avatarMutation = useMutation({
        mutationFn: (file: File) => uploadUserAvatar(authUser!.id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["userProfile"] });
            toast.success("Avatar mis à jour");
        }
    });

    const [formData, setFormData] = useState<any>({});

    useEffect(() => {
        if (profile) setFormData(profile);
    }, [profile]);

    const handleSave = () => {
        updateMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin text-[#1A6CC8] w-10 h-10" />
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header / Profile Hero - Aligné sur Schedule Style */}
            <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/20 rounded-full -mr-32 -mt-32" />
                
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="relative group">
                        <div className="w-24 h-24 rounded-2xl bg-[#0D2D5A] border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-white text-3xl font-bold">
                            {profile?.avatarUrl ? (
                                <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                profile?.avatar || profile?.name?.charAt(0)
                            )}
                        </div>
                        <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#1A6CC8] text-white rounded-lg flex items-center justify-center shadow-lg hover:scale-110 transition-transform border-2 border-white"
                        >
                            <Camera className="w-3.5 h-3.5" />
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={(e) => e.target.files?.[0] && avatarMutation.mutate(e.target.files[0])} 
                        />
                    </div>

                    <div className="text-center md:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            <h1 className="text-2xl font-bold text-[#0D2D5A]">{profile?.name}</h1>
                            {authUser?.role === 'tutor' && authUser?.secondaryRole === 'teacher' ? (
                                <>
                                    <Badge className="bg-purple-50 text-purple-600 border border-purple-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Tuteur Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                                    <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Enseignant <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                                </>
                            ) : authUser?.role === 'teacher' ? (
                                <Badge className="bg-blue-50 text-blue-600 border border-blue-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Enseignant Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                            ) : (
                                <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-2 py-0 text-[9px] uppercase tracking-wider">Tuteur Vérifié <BadgeCheck className="w-3 h-3 ml-1 inline" /></Badge>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-gray-500 font-medium">
                            <span className="flex items-center gap-1.5">
                                <Briefcase className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                {authUser?.role === 'tutor' && authUser?.secondaryRole === 'teacher'
                                    ? "Tuteur-Enseignant"
                                    : authUser?.role === 'teacher' ? "Enseignant" : "Tuteur Expert"}
                            </span>
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-[#1A6CC8]" /> {profile?.location || "Cameroun"}</span>
                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-[#1A6CC8]" /> {profile?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-12 xl:col-span-3 space-y-2">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-1">
                        {[
                            { id: "personal", label: "Infos Personnelles", icon: UserCircle2 },
                            { id: "banking", label: "Paiement & RIB", icon: CreditCard },
                            { id: "security", label: "Sécurité & Accès", icon: ShieldCheck },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "w-full p-3 rounded-xl flex items-center gap-3 transition-all text-left",
                                    activeTab === tab.id 
                                        ? "bg-blue-50 text-[#1A6CC8] font-bold shadow-sm" 
                                        : "text-gray-400 hover:bg-gray-50 hover:text-gray-600 font-medium"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                <span className="text-sm">{tab.label}</span>
                                {activeTab === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-12 xl:col-span-9">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                            <h2 className="text-base font-bold text-[#0D2D5A]">
                                {activeTab === 'personal'
                                    ? (authUser?.role === 'teacher' ? 'Informations de l\'Enseignant' : 'Informations du Tuteur')
                                    : activeTab === 'banking' ? 'Coordonnées de Reversement' : 'Sécurité du compte'}
                            </h2>
                            <Button 
                                onClick={handleSave} 
                                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] font-bold h-9 px-6 rounded-lg shadow-sm text-xs gap-2"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                Enregistrer
                            </Button>
                        </div>

                        <div className="p-8">
                            {activeTab === 'personal' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Nom complet</label>
                                        <input 
                                            value={formData.name || ""} 
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full h-11 bg-gray-50/50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Email (non modifiable)</label>
                                        <input 
                                            value={formData.email || ""} 
                                            disabled
                                            className="w-full h-11 bg-gray-100/50 rounded-xl px-4 border border-gray-100 font-medium text-gray-400" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Téléphone</label>
                                        <input 
                                            value={formData.phone || ""} 
                                            onChange={e => setFormData({...formData, phone: e.target.value})}
                                            className="w-full h-11 bg-gray-50/50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all" 
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Localisation</label>
                                        <input 
                                            value={formData.location || ""} 
                                            onChange={e => setFormData({...formData, location: e.target.value})}
                                            className="w-full h-11 bg-gray-50/50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all" 
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-1.5">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Biographie / Présentation</label>
                                        <textarea 
                                            value={formData.bio || ""} 
                                            onChange={e => setFormData({...formData, bio: e.target.value})}
                                            rows={4}
                                            className="w-full bg-gray-50/50 rounded-xl p-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all resize-none" 
                                            placeholder="Parlez-nous de votre expérience et de votre approche..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'banking' && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 flex items-start gap-3">
                                        <Info className="w-4 h-4 text-[#1A6CC8] mt-0.5" />
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Vos informations de paiement sont sécurisées. Les reversements sont effectués par virement ou Mobile Money selon vos préférences renseignées.
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Établissement Bancaire / Service</label>
                                            <input 
                                                value={formData.bankName || ""} 
                                                onChange={e => setFormData({...formData, bankName: e.target.value})}
                                                placeholder="Ex: Afriland, Orange Money, etc."
                                                className="w-full h-11 bg-gray-50/50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all" 
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1">Coordonnées (RIB/Numéro)</label>
                                            <input 
                                                value={formData.bankIban || ""} 
                                                onChange={e => setFormData({...formData, bankIban: e.target.value})}
                                                className="w-full h-11 bg-gray-50/50 rounded-xl px-4 border border-gray-200 font-medium text-[#0D2D5A] outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8] transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <p className="text-xs text-gray-500 font-medium">Pour modifier votre mot de passe, merci d'utiliser le module de sécurité global ou de contacter l'administrateur.</p>
                                    <div className="flex items-center gap-3 p-4 border border-gray-100 rounded-xl bg-gray-50/30">
                                        <Shield className="w-5 h-5 text-emerald-500" />
                                        <div className="text-xs">
                                            <p className="font-bold text-[#0D2D5A]">Authentification à deux facteurs</p>
                                            <p className="text-gray-400 mt-0.5">Renforcez la sécurité de votre compte tuteur.</p>
                                        </div>
                                        <Button variant="outline" size="sm" className="ml-auto text-[10px] h-7 border-gray-200">Activer</Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
