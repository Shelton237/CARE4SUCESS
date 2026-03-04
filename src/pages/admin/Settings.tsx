import { useState } from "react";
import { Settings2, MapPin, CreditCard, Bell, Shield, Save } from "lucide-react";

const CENTERS = [
    { id: 1, name: "Care4Success Douala Akwa", city: "Douala", address: "Rue Bonanjo, face Hôtel Ibis", active: true },
    { id: 2, name: "Care4Success Yaoundé Centre", city: "Yaoundé", address: "Av. Ahmadou Ahidjo, Bastos", active: true },
    { id: 3, name: "Care4Success En ligne", city: "Tous", address: "Plateforme digitale", active: true },
];

const SUBJECTS = [
    { label: "Mathématiques", baseRate: 10_000, premiumRate: 15_000 },
    { label: "Physique-Chimie", baseRate: 10_000, premiumRate: 15_000 },
    { label: "Français / Philo", baseRate: 8_000, premiumRate: 12_000 },
    { label: "Anglais", baseRate: 8_000, premiumRate: 12_000 },
    { label: "SVT / Sciences", baseRate: 8_000, premiumRate: 12_000 },
    { label: "Informatique", baseRate: 12_000, premiumRate: 18_000 },
];

export default function AdminSettings() {
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Paramètres de la plateforme</h1>
                    <p className="text-gray-500 text-sm mt-1">Configuration générale, tarifs et centres</p>
                </div>
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all shadow-md ${saved ? "bg-green-500" : "bg-[#1A6CC8] hover:bg-[#0D2D5A]"}`}
                >
                    <Save className="w-4 h-4" />
                    {saved ? "Enregistré ✓" : "Enregistrer"}
                </button>
            </div>

            {/* Tarification */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Tarifs par heure (FCFA)</h2>
                        <p className="text-xs text-gray-400">Grille de tarification selon matière et profil enseignant</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Matière</th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tarif standard (FCFA/h)</th>
                                <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Tarif premium (FCFA/h)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {SUBJECTS.map((s, i) => (
                                <tr key={s.label} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-3 font-medium text-[#0D2D5A]">{s.label}</td>
                                    <td className="px-6 py-3 text-center">
                                        <input
                                            type="number"
                                            defaultValue={s.baseRate}
                                            className="w-28 text-center border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                        <input
                                            type="number"
                                            defaultValue={s.premiumRate}
                                            className="w-28 text-center border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#F5A623]/20 focus:border-[#F5A623]"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Centres */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#F5A623]/10 flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-[#F5A623]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Centres et antennes</h2>
                            <p className="text-xs text-gray-400">{CENTERS.length} centres enregistrés</p>
                        </div>
                    </div>
                    <button className="text-xs font-bold px-3 py-1.5 rounded-lg border border-[#1A6CC8] text-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-colors">
                        + Ajouter un centre
                    </button>
                </div>
                <div className="divide-y divide-gray-50">
                    {CENTERS.map((c) => (
                        <div key={c.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="w-10 h-10 rounded-xl bg-[#0D2D5A]/10 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-5 h-5 text-[#0D2D5A]" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-semibold text-[#0D2D5A] text-sm">{c.name}</div>
                                <div className="text-xs text-gray-400">{c.address} · {c.city}</div>
                            </div>
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${c.active ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                {c.active ? "Actif" : "Inactif"}
                            </span>
                            <button className="text-xs text-[#1A6CC8] hover:underline font-medium ml-2">Modifier</button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Notifications & Sécurité */}
            <div className="grid lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-[#a855f7]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Notifications</h2>
                            <p className="text-xs text-gray-400">Alertes et rappels automatiques</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[
                            { label: "Rappel de cours (SMS, 2h avant)", defaultChecked: true },
                            { label: "Confirmation d'inscription", defaultChecked: true },
                            { label: "Facture générée auto. en fin de mois", defaultChecked: true },
                            { label: "Nouvelle demande de bilan reçue", defaultChecked: true },
                            { label: "Rapport hebdomadaire admin", defaultChecked: false },
                        ].map((n) => (
                            <label key={n.label} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 cursor-pointer group">
                                <span className="text-sm text-gray-700 group-hover:text-[#0D2D5A] transition-colors">{n.label}</span>
                                <input
                                    type="checkbox"
                                    defaultChecked={n.defaultChecked}
                                    className="w-4 h-4 accent-[#1A6CC8] cursor-pointer"
                                />
                            </label>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/10 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-[#22c55e]" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#0D2D5A] text-sm">Sécurité & Accès</h2>
                            <p className="text-xs text-gray-400">Gestion des accès et mots de passe</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Délai d'expiration de session</label>
                            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 text-[#0D2D5A]">
                                <option>30 minutes</option>
                                <option>1 heure</option>
                                <option>4 heures</option>
                                <option>24 heures</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Politique de mot de passe</label>
                            <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/20 text-[#0D2D5A]">
                                <option>Standard (min. 8 caractères)</option>
                                <option>Fort (maj. + chiffre + symbole)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Double authentification (2FA)</label>
                            <div className="flex items-center gap-3 py-2 px-3 bg-gray-50 rounded-lg">
                                <input type="checkbox" id="2fa" className="w-4 h-4 accent-[#1A6CC8]" />
                                <label htmlFor="2fa" className="text-sm text-gray-700 cursor-pointer">Activer pour les comptes admin</label>
                            </div>
                        </div>
                        <div className="pt-2">
                            <div className="flex items-center gap-2 px-3 py-2 bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-lg">
                                <Settings2 className="w-4 h-4 text-[#22c55e]" />
                                <span className="text-xs text-[#22c55e] font-medium">Aucune intrusion détectée — Système OK</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
