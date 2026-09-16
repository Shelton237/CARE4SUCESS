import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Banknote, TrendingUp, Calendar, DollarSign, Loader2, ChevronRight, Video, X } from "lucide-react";
import { fetchEarningsHistory, fetchTeacherEarnings } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

export default function TeacherEarnings() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const tableRef = useRef<HTMLDivElement>(null);
    const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

    const { data: history = [], isLoading: loadingHistory } = useQuery({
        queryKey: ["earnings-history", user?.id],
        queryFn: () => fetchEarningsHistory(user!.id),
        enabled: !!user?.id,
    });

    const { data: transactions = [], isLoading: loadingTrans } = useQuery({
        queryKey: ["teacher-earnings", user?.id],
        queryFn: () => fetchTeacherEarnings(user!.id),
        enabled: !!user?.id,
    });

    const scrollToTable = () => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

    const filteredTransactions = useMemo(() => {
        if (!selectedMonth) return transactions;
        return transactions.filter((t: any) => t.date?.slice(0, 7) === selectedMonth);
    }, [transactions, selectedMonth]);

    const handleSelectMonth = (month: string) => {
        setSelectedMonth((current) => (current === month ? null : month));
        scrollToTable();
    };

    const handleExport = () => {
        const rows = filteredTransactions as any[];
        const header = ["Date", "Élève", "Matière", "Montant", "Devise", "Statut"];
        const lines = rows.map((t) => [
            new Date(t.date).toLocaleDateString("fr-FR"),
            t.student || "",
            t.subject || "",
            String(t.amount || 0),
            t.currency || currency,
            t.status || "",
        ]);
        const csv = [header, ...lines].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")).join("\n");
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `revenus-${user?.id?.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loadingHistory || loadingTrans) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]/40" />
            </div>
        );
    }

    const totalEarnings = history.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);
    const currency = transactions[0]?.currency || "XAF";
    const maxAmount = Math.max(...history.map((h: any) => h.amount || 0), 1);

    return (
        <div className="w-full p-3 space-y-3 bg-white min-h-screen">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-[#0D2D5A] uppercase tracking-tight">Mes Revenus</h1>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        Historique de vos reversements et transactions.
                    </p>
                </div>
                <button
                    onClick={scrollToTable}
                    className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 bg-white hover:border-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-colors"
                    title="Voir le détail des transactions"
                >
                    <Banknote className="w-3.5 h-3.5 text-[#1A6CC8]" />
                    <span className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-wide">
                        {formatMoney(totalEarnings, currency)}
                    </span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                {/* Graphique analytique */}
                <div className="lg:col-span-2 border border-slate-200 bg-white p-3 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest">Analytique mensuelle</h3>
                        <div className="flex items-center gap-2">
                            {selectedMonth && (
                                <button
                                    onClick={() => setSelectedMonth(null)}
                                    className="flex items-center gap-1 text-[9px] font-black text-[#1A6CC8] uppercase tracking-widest hover:text-[#0D2D5A]"
                                >
                                    <X className="w-3 h-3" /> {selectedMonth}
                                </button>
                            )}
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Temps Réel</span>
                        </div>
                    </div>
                    {history.length === 0 ? (
                        <div className="h-48 flex items-center justify-center">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Aucune donnée pour le moment</p>
                        </div>
                    ) : (
                        <div className="h-48 flex items-end gap-2 justify-between px-2 pb-2">
                            {history.slice(-6).map((item: any, i: number) => {
                                const isSelected = selectedMonth === item.month;
                                const heightPct = Math.max(((item.amount || 0) / maxAmount) * 100, 4);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => handleSelectMonth(item.month)}
                                        className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group"
                                        title={`Voir les séances de ${item.month}`}
                                    >
                                        <div
                                            className={cn(
                                                "w-full transition-colors cursor-pointer relative",
                                                isSelected ? "bg-[#1A6CC8]" : "bg-[#1A6CC8]/10 group-hover:bg-[#1A6CC8]/40"
                                            )}
                                            style={{ height: `${heightPct}%` }}
                                        >
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0D2D5A] text-white text-[9px] px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 font-black uppercase">
                                                {formatMoney(item.amount, currency)}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[9px] font-black uppercase",
                                            isSelected ? "text-[#1A6CC8]" : "text-slate-400"
                                        )}>
                                            {item.month || item.date?.split('-')[1]}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Barème + Total */}
                <div className="border border-slate-200 bg-white p-3 space-y-3">
                    <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest border-b border-slate-100 pb-2">Barème</h3>
                    <div className="space-y-2">
                        {[
                            {
                                label: "Tarif",
                                value: transactions[0]
                                    ? formatMoney(transactions[0].rate, transactions[0].currency)
                                    : "-",
                                sub: transactions[0]?.rateUnitMinutes ? `/ ${transactions[0].rateUnitMinutes} min` : "/ séance",
                                icon: DollarSign,
                                onClick: undefined,
                            },
                            {
                                label: "Sessions validées",
                                value: `${transactions.length}`,
                                sub: "séances",
                                icon: Calendar,
                                onClick: scrollToTable,
                            },
                            { label: "Calcul", value: "Automatique", sub: "Flux API", icon: TrendingUp, onClick: undefined },
                        ].map((item, i) => {
                            const Comp = item.onClick ? "button" : "div";
                            return (
                                <Comp
                                    key={i}
                                    onClick={item.onClick}
                                    className={cn(
                                        "w-full flex items-center justify-between p-2.5 bg-slate-50/50 border border-slate-100 text-left",
                                        item.onClick && "hover:border-[#1A6CC8] hover:bg-[#1A6CC8]/5 transition-colors cursor-pointer"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <item.icon className="w-3.5 h-3.5 text-[#1A6CC8]" />
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.label}</p>
                                            <p className="font-black text-[#0D2D5A] text-[11px]">{item.value}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="text-[9px] font-bold text-slate-400 uppercase">{item.sub}</span>
                                        {item.onClick && <ChevronRight className="w-3 h-3 text-slate-300" />}
                                    </div>
                                </Comp>
                            );
                        })}
                    </div>
                    <button
                        onClick={scrollToTable}
                        className="w-full border border-[#0D2D5A] bg-[#0D2D5A] p-3 text-white text-center hover:bg-[#153460] transition-colors"
                    >
                        <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-1">Total perçu</p>
                        <div className="text-lg font-black tracking-tight">
                            {totalEarnings.toLocaleString()} <span className="text-[10px] opacity-40">{currency}</span>
                        </div>
                        <div className="flex items-center justify-center gap-1 text-[9px] text-[#F5A623] font-black uppercase mt-1">
                            <TrendingUp className="w-3 h-3" /> Flux Actif
                        </div>
                    </button>
                </div>
            </div>

            {/* Tableau des transactions */}
            <div ref={tableRef} className="border border-slate-200 bg-white overflow-hidden scroll-mt-3">
                <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-[#0D2D5A] uppercase tracking-widest flex items-center gap-2">
                        Audit des transactions
                        {selectedMonth && (
                            <span className="text-[9px] font-bold text-[#1A6CC8] normal-case">— filtré sur {selectedMonth}</span>
                        )}
                    </h3>
                    <Button
                        variant="outline"
                        onClick={handleExport}
                        disabled={filteredTransactions.length === 0}
                        className="h-7 rounded-none border-slate-200 text-slate-500 hover:text-[#1A6CC8] hover:border-[#1A6CC8] font-black text-[9px] uppercase tracking-widest shadow-none px-3 disabled:opacity-40"
                    >
                        <DownloadIcon className="w-3 h-3 mr-1.5" /> Exporter
                    </Button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-slate-100">
                                {["Période", "Élève", "Montant", ""].map(h => (
                                    <th key={h} className="px-3 py-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-3 py-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                        {transactions.length === 0 ? "Aucune transaction" : "Aucune transaction pour ce mois"}
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((t: any) => (
                                    <tr
                                        key={t.id}
                                        onClick={() => navigate(`/virtual-class/${t.id}`)}
                                        className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                                        title="Revoir le détail de cette séance"
                                    >
                                        <td className="px-3 py-2">
                                            <div className="text-[10px] font-black text-[#0D2D5A] uppercase">
                                                {new Date(t.date).toLocaleDateString('fr-FR')}
                                            </div>
                                            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">
                                                {t.id.slice(0, 8)}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-[10px] font-black text-[#0D2D5A] uppercase">
                                                {t.student || "Élève"}
                                            </div>
                                            <div className="text-[9px] text-[#1A6CC8] font-black uppercase tracking-widest">
                                                {t.subject || "Session"}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <span className="text-[10px] font-black text-[#0D2D5A]">
                                                {(t.amount || 0).toLocaleString()}
                                            </span>
                                            <span className="text-[9px] text-slate-400 ml-1">{t.currency || currency}</span>
                                        </td>
                                        <td className="px-3 py-2 text-right">
                                            <span className="inline-flex items-center gap-1 text-[9px] font-black text-slate-300 group-hover:text-[#1A6CC8] uppercase tracking-widest transition-colors">
                                                <Video className="w-3 h-3" /> Revoir <ChevronRight className="w-3 h-3" />
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function DownloadIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" x2="12" y1="15" y2="3" />
        </svg>
    );
}
