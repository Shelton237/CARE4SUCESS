import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Receipt, Users2, Search, Loader2, CheckCircle2, Clock } from "lucide-react";
import { fetchAdminTransactions, fetchTeacherPayouts } from "@/api/backoffice";
import { StatCard } from "@/components/dashboard/StatCard";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatMoney } from "@/lib/money";

const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? value
        : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

const STATUS_UI: Record<string, { label: string; bg: string; color: string }> = {
    paid: { label: "Payée", bg: "bg-emerald-50", color: "text-emerald-700" },
    pending: { label: "En attente", bg: "bg-[#F5A623]/10", color: "text-[#F5A623]" },
};

const METHOD_LABELS: Record<string, string> = {
    mobile_money: "Mobile Money",
    manual: "Manuel",
};

export default function AdminTransactions() {
    const [status, setStatus] = useState("all");
    const [method, setMethod] = useState("all");
    const [search, setSearch] = useState("");

    const transactionsQuery = useQuery({
        queryKey: ["admin-transactions", status, method, search],
        queryFn: () => fetchAdminTransactions({ status, method, search: search || undefined }),
    });

    const payoutsQuery = useQuery({
        queryKey: ["teacherPayouts"],
        queryFn: fetchTeacherPayouts,
    });

    const transactions = useMemo(() => transactionsQuery.data ?? [], [transactionsQuery.data]);
    const payouts = useMemo(() => payoutsQuery.data ?? [], [payoutsQuery.data]);

    const { totalPaid, totalPending, paidCount } = useMemo(() => {
        return transactions.reduce(
            (acc, t) => {
                if (t.status === "paid") {
                    acc.totalPaid += t.amount;
                    acc.paidCount += 1;
                } else {
                    acc.totalPending += t.amount;
                }
                return acc;
            },
            { totalPaid: 0, totalPending: 0, paidCount: 0 }
        );
    }, [transactions]);

    return (
        <div className="w-full p-4 md:p-6 space-y-6 animate-in fade-in duration-500 bg-white min-h-screen">
            <div>
                <h1 className="text-2xl font-black text-[#0D2D5A] tracking-tighter flex items-center gap-3">
                    <History className="w-6 h-6 text-[#1A6CC8]" />
                    HISTORIQUE DES TRANSACTIONS
                </h1>
                <p className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">
                    Factures parents, paiements en ligne et versements enseignants
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <StatCard label="Transactions Payées" value={String(paidCount)} icon={CheckCircle2} accentColor="#10b981" description="Confirmées" />
                <StatCard label="Montant Encaissé" value={formatMoney(totalPaid, "XAF")} icon={Receipt} accentColor="#1A6CC8" description="Total réglé" />
                <StatCard label="En Attente" value={formatMoney(totalPending, "XAF")} icon={Clock} accentColor="#F5A623" description="À recouvrer" />
                <StatCard label="Versements Enseignants" value={String(payouts.length)} icon={Users2} accentColor="#0D2D5A" description="Historique de paie" />
            </div>

            <Tabs defaultValue="parents" className="w-full">
                <TabsList>
                    <TabsTrigger value="parents">Factures & Paiements Parents</TabsTrigger>
                    <TabsTrigger value="payouts">Paie Enseignants</TabsTrigger>
                </TabsList>

                <TabsContent value="parents" className="space-y-4 mt-4">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Rechercher un parent, une référence..."
                                className="pl-9 h-9 rounded-lg border-slate-200 text-sm"
                            />
                        </div>
                        <Select value={status} onValueChange={setStatus}>
                            <SelectTrigger className="w-full sm:w-[160px] h-9 rounded-lg text-sm">
                                <SelectValue placeholder="Statut" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les statuts</SelectItem>
                                <SelectItem value="paid">Payées</SelectItem>
                                <SelectItem value="pending">En attente</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={method} onValueChange={setMethod}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9 rounded-lg text-sm">
                                <SelectValue placeholder="Méthode" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toutes les méthodes</SelectItem>
                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                <SelectItem value="manual">Manuel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        {transactionsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="pl-6 font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Référence</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Parent</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Description</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Méthode</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Date</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10 text-center">Statut</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10 text-right pr-6">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                Aucune transaction trouvée
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        transactions.map((t) => {
                                            const statusUi = STATUS_UI[t.status] ?? STATUS_UI.pending;
                                            return (
                                                <TableRow key={t.id} className="hover:bg-slate-50/30 border-slate-50">
                                                    <TableCell className="pl-6 py-3">
                                                        <span className="text-[10px] font-black text-[#1A6CC8] bg-[#1A6CC8]/5 px-1.5 py-0.5 rounded border border-[#1A6CC8]/10">
                                                            #{t.id.slice(0, 8)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-[12px] font-bold text-[#0D2D5A]">{t.parentName}</div>
                                                        {t.parentEmail && <div className="text-[9px] text-slate-400">{t.parentEmail}</div>}
                                                    </TableCell>
                                                    <TableCell className="text-[11px] text-slate-500 max-w-[220px] truncate">{t.description}</TableCell>
                                                    <TableCell>
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                                                            {t.paymentMethod ? (METHOD_LABELS[t.paymentMethod] || t.paymentMethod) : "—"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-[10px] font-bold text-slate-500 uppercase">
                                                        {formatDate(t.paidAt || t.date)}
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge className={`text-[8px] font-black uppercase tracking-widest px-2 h-5 rounded-full border-none ${statusUi.bg} ${statusUi.color}`}>
                                                            {statusUi.label}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 font-black text-[13px] text-[#0D2D5A]">
                                                        {formatMoney(t.amount, "XAF")}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>

                <TabsContent value="payouts" className="space-y-4 mt-4">
                    <div className="border border-slate-100 rounded-xl overflow-hidden">
                        {payoutsQuery.isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-[#1A6CC8]" />
                            </div>
                        ) : (
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="pl-6 font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Enseignant</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Période</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Méthode</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Note</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10">Date</TableHead>
                                        <TableHead className="font-black text-[#0D2D5A] uppercase text-[9px] tracking-widest h-10 text-right pr-6">Montant</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payouts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-10 text-[10px] font-black text-slate-300 uppercase tracking-widest">
                                                Aucun versement enregistré — utilisez « Marquer comme payé » depuis Finance & Paie
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        payouts.map((p) => (
                                            <TableRow key={p.id} className="hover:bg-slate-50/30 border-slate-50">
                                                <TableCell className="pl-6 py-3 font-bold text-[12px] text-[#0D2D5A]">{p.teacherName}</TableCell>
                                                <TableCell className="text-[11px] text-slate-500">{p.periodMonth}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{p.paymentMethod || "—"}</TableCell>
                                                <TableCell className="text-[11px] text-slate-400 max-w-[200px] truncate">{p.note || "—"}</TableCell>
                                                <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{formatDate(p.createdAt)}</TableCell>
                                                <TableCell className="text-right pr-6 font-black text-[13px] text-[#0D2D5A]">
                                                    {formatMoney(p.amount, p.currency)}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
