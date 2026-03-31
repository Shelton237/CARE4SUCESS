import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
    TrendingUp, 
    AlertCircle, 
    Star, 
    Loader2,
    History as HistoryIcon,
    ArrowUpRight
} from "lucide-react";
import { fetchStudentProgressData, fetchStudentSessions, submitGradeDispute } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { 
    LineChart, 
    Line, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    ResponsiveContainer
} from "recharts";
import { toast } from "sonner";

export default function StudentProgress() {
    const { user } = useAuth();
    const [disputeModal, setDisputeModal] = useState<{ open: boolean; sessionId?: string; sessionTitle?: string }>({ open: false });
    const [reason, setReason] = useState("");

    const progressQuery = useQuery({
        queryKey: ["studentProgress", user?.id],
        queryFn: () => fetchStudentProgressData(user!.id),
        enabled: Boolean(user?.id),
    });

    const sessionsQuery = useQuery({
        queryKey: ["studentSessions", user?.id],
        queryFn: () => fetchStudentSessions(user!.id),
        enabled: Boolean(user?.id),
    });

    const mutation = useMutation({
        mutationFn: submitGradeDispute,
        onSuccess: () => {
            toast.success("Ta contestation a été enregistrée avec succès.");
            setDisputeModal({ open: false });
            setReason("");
        },
        onError: (err: any) => {
            toast.error("Erreur: " + err.message);
        }
    });

    const chartData = useMemo(() => {
        return progressQuery.data || [
            { month: "Jan", maths: 12, francais: 14, anglais: 15 },
            { month: "Fév", maths: 13.5, francais: 13, anglais: 16 },
            { month: "Mar", maths: 14.5, francais: 15, anglais: 15.5 },
        ];
    }, [progressQuery.data]);

    const pastSessions = useMemo(() => {
        return (sessionsQuery.data || []).filter(s => s.status === "effectué");
    }, [sessionsQuery.data]);

    if (progressQuery.isLoading || sessionsQuery.isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    const handleSubmitDispute = () => {
        if (!reason.trim()) return toast.warning("Veuillez fournir un motif.");
        mutation.mutate({
            studentId: user!.id,
            sessionId: disputeModal.sessionId!,
            reason: reason
        });
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Progression Académique</h1>
                    <p className="text-gray-500 text-sm mt-1">Analyse détaillée de tes résultats par matière.</p>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                    <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Moyenne trimestrielle</div>
                        <div className="text-xl font-bold text-[#0D2D5A]">14.5 / 20</div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Evolution Chart */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-base font-bold text-[#0D2D5A]">Courbe d'apprentissage</h3>
                            <div className="flex items-center gap-4">
                                <LegendItem color="#1A6CC8" label="Maths" />
                                <LegendItem color="#F5A623" label="Anglais" />
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis 
                                        dataKey="month" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                        dy={10}
                                    />
                                    <YAxis 
                                        domain={[0, 20]} 
                                        axisLine={false} 
                                        tickLine={false}
                                        tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }}
                                    />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#0D2D5A', border: 'none', borderRadius: '12px', color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="maths" stroke="#1A6CC8" strokeWidth={3} dot={{ r: 4, fill: '#1A6CC8', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                    <Line type="monotone" dataKey="anglais" stroke="#F5A623" strokeWidth={3} dot={{ r: 4, fill: '#F5A623', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Historical Results */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/30">
                            <h3 className="text-sm font-bold text-[#0D2D5A] flex items-center gap-2">
                                <HistoryIcon className="w-4 h-4 text-[#1A6CC8]" />
                                Historique des évaluations
                            </h3>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-white text-[10px] font-bold text-gray-400 uppercase tracking-widest px-6 py-4">
                                <tr>
                                    <th className="px-6 py-3">Matière / Session</th>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Note</th>
                                    <th className="px-6 py-3 text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {pastSessions.map((session) => (
                                    <tr key={session.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-sm text-[#0D2D5A]">{session.subject}</div>
                                            <div className="text-[10px] text-gray-400 font-medium">{session.teacher}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">{session.date}</td>
                                        <td className="px-6 py-4 font-bold text-[#0D2D5A] text-sm">15/20</td>
                                        <td className="px-6 py-4 text-right pr-6">
                                            <button 
                                                onClick={() => setDisputeModal({ open: true, sessionId: session.id, sessionTitle: session.subject })}
                                                className="text-[10px] font-bold text-orange-500 hover:underline uppercase tracking-widest opacity-0 group-hover:opacity-100"
                                            >
                                                Contester
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#0D2D5A] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10 space-y-6">
                            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                                <Star className="w-6 h-6 text-[#F5A623] fill-current" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold">Résumé global</h3>
                                <p className="text-blue-200 text-xs mt-2 leading-relaxed">Progression positive sur les matières scientifiques.</p>
                            </div>
                            <div className="space-y-4">
                                <ProgressMini label="Participation" value={92} color="bg-green-500" />
                                <ProgressMini label="Assiduité" value={98} color="bg-blue-400" />
                                <ProgressMini label="Devoirs" value={85} color="bg-orange-400" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h4 className="text-sm font-bold text-[#0D2D5A] mb-4">Objectif du mois</h4>
                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-xs font-medium text-gray-600 italic">"Atteindre 16/20 en Français"</p>
                            <div className="mt-4 flex justify-between text-[10px] font-bold text-gray-400 uppercase mb-1">
                                <span>Actuel: 14.5</span>
                                <span>But: 16.0</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1A6CC8] w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            {disputeModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => !mutation.isPending && setDisputeModal({ open: false })} />
                    <div className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-[#0D2D5A]">Contester une note</h3>
                            <AlertCircle className="w-5 h-5 text-orange-500" />
                        </div>
                        <div className="p-6 space-y-6">
                            <p className="text-xs text-gray-500">Session : <span className="font-bold text-[#0D2D5A]">{disputeModal.sessionTitle}</span></p>
                            <div>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Motif de la demande</label>
                                <textarea 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#1A6CC8] min-h-[100px]"
                                    placeholder="Expliquez brièvement votre contestation..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    disabled={mutation.isPending}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button 
                                    onClick={() => setDisputeModal({ open: false })}
                                    className="flex-1 py-2.5 text-xs font-bold text-gray-400 hover:bg-gray-50 rounded-xl transition-all"
                                    disabled={mutation.isPending}
                                >
                                    Annuler
                                </button>
                                <button 
                                    onClick={handleSubmitDispute}
                                    disabled={mutation.isPending}
                                    className="flex-[2] bg-[#0D2D5A] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#153460] transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Envoyer"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function LegendItem({ color, label }: any) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
        </div>
    );
}

function ProgressMini({ label, value, color }: any) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest">{label}</span>
                <span className="text-[10px] font-bold text-white">{value}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
            </div>
        </div>
    );
}
