import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Receipt, Download, CheckCircle, Clock } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { fetchParentInvoices } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { formatFCFA } from "@/data/mock";
import type { ParentInvoice } from "@/integrations/supabase/types";

const STATUS_UI: Record<ParentInvoice["status"], { label: string; chip: string }> = {
    paid: { label: "Payée", chip: "bg-green-50 text-green-600" },
    pending: { label: "En attente", chip: "bg-[#F5A623]/10 text-[#F5A623]" },
};

const formatDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("fr-FR");
};

export default function ParentInvoices() {
    const { user } = useAuth();

    const invoicesQuery = useQuery({
        queryKey: ["parentInvoices", user?.id],
        queryFn: () => fetchParentInvoices(user!.id),
        enabled: Boolean(user?.id),
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

    if (!user) {
        return (
            <div className="p-8 text-sm text-gray-500">
                Connectez-vous pour consulter vos factures.
            </div>
        );
    }

    return (
        <div className="p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-[#0D2D5A]">Factures & Paiements</h1>
                <p className="text-gray-500 text-sm mt-1">Historique complet de vos règlements Care4Success</p>
            </div>

            {invoicesQuery.isError && (
                <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl p-4">
                    Impossible de récupérer les factures pour le moment.
                </div>
            )}

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
                <StatCard label="Total payé" value={formatFCFA(totalPaid)} icon={CheckCircle} accentColor="#22c55e" description="Depuis le début" />
                <StatCard
                    label="En attente"
                    value={formatFCFA(totalPending)}
                    icon={Clock}
                    accentColor="#F5A623"
                    description={totalPending > 0 ? "À régler" : "Aucune dette 🎉"}
                />
                <StatCard label="Nombre de factures" value={invoices.length} icon={Receipt} accentColor="#1A6CC8" description="Historique complet" />
            </div>

            {totalPending > 0 && (
                <div className="flex items-center justify-between gap-4 bg-[#F5A623]/5 border border-[#F5A623]/20 rounded-2xl p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F5A623]/15 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-[#F5A623]" />
                        </div>
                        <div>
                            <div className="font-bold text-[#0D2D5A] text-sm">Vous avez une facture en attente</div>
                            <div className="text-xs text-gray-500">Montant dû : {formatFCFA(totalPending)}</div>
                        </div>
                    </div>
                    <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#F5A623] hover:bg-[#e09612] transition-colors shadow-md whitespace-nowrap">
                        Payer maintenant
                    </button>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="w-8 h-8 rounded-lg bg-[#1A6CC8]/10 flex items-center justify-center">
                        <Receipt className="w-4 h-4 text-[#1A6CC8]" />
                    </div>
                    <div>
                        <h2 className="font-bold text-[#0D2D5A] text-sm">Toutes les factures</h2>
                        <p className="text-xs text-gray-400">{invoices.length} factures · {formatFCFA(totalPaid + totalPending)} cumulés</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {invoicesQuery.isLoading ? (
                        <div className="text-sm text-gray-400 text-center py-10">Chargement…</div>
                    ) : invoices.length === 0 ? (
                        <div className="text-sm text-gray-400 text-center py-10">Aucune facture enregistrée.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Référence</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Description</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Montant</th>
                                    <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Statut</th>
                                    <th className="text-center px-6 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wider">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoices.map((inv, i) => {
                                    const statusUi = STATUS_UI[inv.status];
                                    return (
                                        <tr key={inv.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                            <td className="px-6 py-4 font-mono text-xs text-[#1A6CC8] font-bold uppercase">{inv.id}</td>
                                            <td className="px-6 py-4 text-gray-600 whitespace-nowrap">{formatDate(inv.date)}</td>
                                            <td className="px-6 py-4 text-gray-700 max-w-xs truncate">{inv.description}</td>
                                            <td className="px-6 py-4 text-right font-bold text-[#0D2D5A] whitespace-nowrap">{formatFCFA(inv.amount)}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusUi.chip}`}>{statusUi.label}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {inv.status === "paid" ? (
                                                    <button className="inline-flex items-center gap-1.5 text-xs text-[#1A6CC8] hover:underline font-medium">
                                                        <Download className="w-3.5 h-3.5" />
                                                        PDF
                                                    </button>
                                                ) : (
                                                    <button className="inline-flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-lg bg-[#F5A623] text-white hover:bg-[#e09612] transition-colors">
                                                        Régler
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/30 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        Affichage de {invoices.length} factures
                    </span>
                    <div className="text-sm font-bold text-[#0D2D5A]">
                        Total réglé : <span className="text-[#22c55e]">{formatFCFA(totalPaid)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
