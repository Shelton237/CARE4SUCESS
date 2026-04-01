import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, CheckCircle, Clock, FileText, CreditCard, Filter, Loader2 } from "lucide-react";
import { fetchParentInvoices, fetchChildrenByParent } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { formatFCFA } from "@/lib/money";
import type { ParentInvoice } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS_UI: Record<ParentInvoice["status"], { label: string; color: string; bg: string }> = {
    paid: { label: "PAYÉE", color: "text-emerald-700", bg: "bg-emerald-50" },
    pending: { label: "EN ATTENTE", color: "text-[#F5A623]", bg: "bg-[#F5A623]/10" },
};

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
};

export default function ParentInvoices() {
    const { user } = useAuth();

    const invoicesQuery = useQuery({
        queryKey: ["parentInvoices", user?.id],
        queryFn: () => fetchParentInvoices(user!.id),
        enabled: Boolean(user?.id),
    });

    const { data: children = [] } = useQuery({
        queryKey: ["parent-children", user?.id],
        queryFn: () => fetchChildrenByParent(user?.id || ""),
        enabled: Boolean(user?.id)
    });

    const invoices = useMemo(() => invoicesQuery.data ?? [], [invoicesQuery.data]);
    
    const { totalPaid, totalPending } = useMemo(() => {
        return invoices.reduce(
            (acc, invoice) => {
                if (invoice.status === "paid") {
                    acc.totalPaid += invoice.amount;
                } else {
                    acc.totalPending += invoice.amount;
                }
                return acc;
            },
            { totalPaid: 0, totalPending: 0 }
        );
    }, [invoices]);

    if (!user) return null;

    if (invoicesQuery.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#0D2D5A]/20" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 w-full bg-white min-h-screen font-sans text-[#0D2D5A]">
            {/* Slim Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight flex items-center gap-3">
                        Comptabilité & Factures
                        <Receipt className="w-5 h-5 text-[#1A6CC8]" />
                    </h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Historique des transactions et règlements</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] font-black uppercase tracking-widest border-slate-200 rounded-none">
                        <Download className="w-3.5 h-3.5 mr-2" /> Rapport Annuel
                    </Button>
                    <Button className="h-8 bg-[#0D2D5A] text-white text-[10px] font-black uppercase tracking-widest rounded-none shadow-none">
                        <CreditCard className="w-3.5 h-3.5 mr-2" /> Moyens de Paiement
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid - Eureka Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total réglé", value: formatFCFA(totalPaid), sub: "DEPUIS L'INSCRIPTION", icon: CheckCircle, color: "text-emerald-600", bg: "bg-slate-50/50" },
                    { label: "Solde en attente", value: formatFCFA(totalPending), sub: totalPending > 0 ? "À RÉGLER" : "COMPTE À JOUR", icon: Clock, color: totalPending > 0 ? "text-[#F5A623]" : "text-slate-300", bg: "bg-slate-50/50" },
                    { label: "Volume Factures", value: invoices.length, sub: "TRANSACTIONS TOTALES", icon: Receipt, color: "text-[#1A6CC8]", bg: "bg-slate-50/50" },
                    { label: "Enfants inscrits", value: children.length, sub: "RATTACHÉS AU COMPTE", icon: graduationCapIcon, color: "text-purple-600", bg: "bg-slate-50/50" }
                ].map((stat, i) => (
                    <div key={i} className={`p-4 border border-slate-100 rounded-none shadow-none flex flex-col ${stat.bg}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</h4>
                        </div>
                        <div className="text-xl font-black text-[#0D2D5A] tracking-tight leading-none mb-2">{stat.value}</div>
                        <div className="text-[9px] font-black uppercase text-slate-300 tracking-widest">{stat.sub}</div>
                    </div>
                ))}
            </div>

            {totalPending > 0 && (
                <div className="flex items-center justify-between gap-4 bg-[#F5A623]/5 border-l-4 border-[#F5A623] p-4 rounded-none">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-none bg-[#F5A623]/10 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-[#F5A623]" />
                        </div>
                        <div>
                            <div className="text-[11px] font-black text-[#0D2D5A] uppercase tracking-wide">Action Requise : Facture en attente</div>
                            <div className="text-[10px] font-bold text-[#F5A623] uppercase">Montant total dû : {formatFCFA(totalPending)}</div>
                        </div>
                    </div>
                    <Button className="h-8 bg-[#F5A623] hover:bg-[#e09612] text-white font-black text-[10px] uppercase tracking-widest rounded-none shadow-none">
                        Régler Maintenant
                    </Button>
                </div>
            )}

            {/* Main Table Section */}
            <div className="border border-slate-100 bg-white shadow-none">
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#1A6CC8]" />
                        Registre des factures parentales
                    </h2>
                    <div className="flex items-center gap-2">
                         <Filter className="w-3 h-3 text-slate-300" />
                         <span className="text-[9px] font-black text-slate-400 uppercase">{invoices.length} Items</span>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 bg-white">
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Référence</th>
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Date émission</th>
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">Détails de la prestation</th>
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Montant</th>
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">État</th>
                                <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {invoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        Aucun historique de facturation détecté
                                    </td>
                                </tr>
                            ) : (
                                invoices.map((inv) => {
                                    const status = STATUS_UI[inv.status];
                                    return (
                                        <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-black text-[#1A6CC8] bg-[#1A6CC8]/5 px-1.5 py-0.5 border border-[#1A6CC8]/10 uppercase">#{inv.id.slice(0, 8)}</span>
                                            </td>
                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">{formatDate(inv.date)}</td>
                                            <td className="px-4 py-3">
                                                <div className="text-[11px] font-black text-[#0D2D5A] uppercase truncate max-w-[250px]">{inv.description}</div>
                                                <div className="text-[9px] font-bold text-slate-300 uppercase mt-0.5">Prestation académique</div>
                                            </td>
                                            <td className="px-4 py-3 text-right text-[11px] font-black text-[#0D2D5A]">{formatFCFA(inv.amount)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 h-4 rounded-none border-none shadow-none ${status.bg} ${status.color}`}>
                                                    {status.label}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    {inv.status === "paid" ? (
                                                        <Button variant="ghost" className="h-7 w-7 p-0 text-slate-400 hover:text-[#1A6CC8] hover:bg-[#1A6CC8]/5 rounded-none">
                                                            <Download className="w-3.5 h-3.5" />
                                                        </Button>
                                                    ) : (
                                                        <Button className="h-6 px-3 bg-[#0D2D5A] text-white text-[9px] font-black uppercase tracking-widest rounded-none shadow-none">
                                                            Payer
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Footer */}
                <div className="px-4 py-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        Affranchissement total réglé :
                    </span>
                    <div className="text-[11px] font-black text-[#0D2D5A] uppercase">
                        {formatFCFA(totalPaid)}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Minimal icons wrapper for the map
const graduationCapIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
);
