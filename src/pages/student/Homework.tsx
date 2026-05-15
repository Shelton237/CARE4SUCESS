import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
    ClipboardList, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    Loader2,
    FileText,
    Upload,
    ChevronRight,
    Search,
    MessageSquare,
    AlertCircle,
    X,
    Star
} from "lucide-react";
import { fetchStudentHomework, updateHomework, uploadHomeworkFile } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudentHomework() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [search, setSearch] = useState("");
    const [viewingCorrection, setViewingCorrection] = useState<any>(null);
    const [depositingHw, setDepositingHw] = useState<any>(null);

    const { data: homework, isLoading } = useQuery({
        queryKey: ["studentHomework", user?.id],
        queryFn: () => fetchStudentHomework(user!.id),
        enabled: Boolean(user?.id),
    });

    const depositMutation = useMutation({
        mutationFn: ({ id, file }: { id: string, file: File }) => 
            uploadHomeworkFile(id, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["studentHomework", user?.id] });
            toast.success("Devoir déposé avec succès ! Ton professeur sera notifié.");
            setDepositingHw(null);
        },
        onError: () => {
            toast.error("Une erreur est survenue lors du dépôt.");
        }
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !depositingHw) return;

        depositMutation.mutate({ id: depositingHw.id, file });
    };

    const filteredHomework = homework?.filter(hw => 
        hw.title.toLowerCase().includes(search.toLowerCase()) ||
        hw.subject.toLowerCase().includes(search.toLowerCase())
    ) || [];

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mes Devoirs</h1>
                    <p className="text-gray-500 text-sm mt-1">Gère tes travaux à rendre et consulte tes corrections.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Rechercher..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/5 focus:border-[#1A6CC8] transition-all w-64 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main list */}
                <div className="xl:col-span-2 space-y-4">
                    {filteredHomework.length > 0 ? (
                        <div className="grid gap-4">
                            {filteredHomework.map((hw) => (
                                <HomeworkItem 
                                    key={hw.id} 
                                    hw={hw} 
                                    onViewCorrection={() => setViewingCorrection(hw)} 
                                    onDeposit={() => setDepositingHw(hw)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <ClipboardList className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 text-sm font-medium">Aucun devoir à afficher.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-sm font-bold text-[#0D2D5A] mb-6">Récapitulatif</h3>
                        <div className="space-y-2">
                            <SummaryRow label="À faire" count={filteredHomework.filter(h => h.status === 'à faire').length} color="text-orange-500" bg="bg-orange-50" />
                            <SummaryRow label="En attente" count={filteredHomework.filter(h => h.status === 'rendu').length} color="text-[#1A6CC8]" bg="bg-blue-50" />
                            <SummaryRow label="Terminés" count={filteredHomework.filter(h => h.status === 'corrigé').length} color="text-green-600" bg="bg-green-50" />
                        </div>
                    </div>

                    <div className="bg-[#0D2D5A] rounded-2xl p-4 md:p-6 text-white shadow-lg relative overflow-hidden group">
                        <div className="relative z-10">
                            <h3 className="font-bold text-base mb-2">Besoin d'aide ?</h3>
                            <p className="text-xs text-blue-200 leading-relaxed mb-4">
                                Contacte ton professeur référent si tu rencontres des difficultés sur un exercice.
                            </p>
                            <button 
                                onClick={() => navigate("/student/messages")}
                                className="w-full bg-white text-[#0D2D5A] py-2.5 rounded-xl text-[10px] font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 uppercase tracking-widest"
                            >
                                <MessageSquare className="w-4 h-4" />
                                Ouvrir le chat
                            </button>
                        </div>
                        <AlertCircle className="absolute -bottom-4 -right-4 w-20 h-20 text-white/5 -rotate-12" />
                    </div>
                </div>
            </div>

            {/* Correction Modal */}
            {viewingCorrection && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewingCorrection(null)} />
                    <div className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between bg-green-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0D2D5A]">Correction Profesionnelle</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{viewingCorrection.subject}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingCorrection(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 md:p-8 space-y-8">
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-[#0D2D5A]">{viewingCorrection.title}</h4>
                                <p className="text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-100 pl-4">
                                    {viewingCorrection.description}
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 relative overflow-hidden group">
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-4">
                                        <Star className="w-4 h-4 text-orange-400 fill-current" />
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Retour du Professeur</span>
                                    </div>
                                    <div className="text-sm text-[#0D2D5A] font-medium leading-relaxed whitespace-pre-line">
                                        {viewingCorrection.feedback || "Aucun commentaire détaillé disponible pour le moment. Félicitations pour ton travail !"}
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-gray-200/50 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-[#1A6CC8] flex items-center justify-center text-white text-[10px] font-bold">
                                                {viewingCorrection.teacherName?.charAt(0)}
                                            </div>
                                            <span className="text-xs font-bold text-[#0D2D5A]">{viewingCorrection.teacherName}</span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{viewingCorrection.dueDate}</span>
                                    </div>
                                </div>
                                <CheckCircle2 className="absolute -bottom-4 -right-4 w-24 h-24 text-green-500/5 -rotate-12" />
                            </div>

                            <button 
                                onClick={() => setViewingCorrection(null)}
                                className="w-full bg-[#0D2D5A] text-white py-4 rounded-xl text-xs font-bold hover:bg-[#153460] transition-all shadow-lg"
                            >
                                J'ai compris
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deposit Modal */}
            {depositingHw && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setDepositingHw(null)} />
                    <div className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#1A6CC8]">
                                    <Upload className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0D2D5A]">Déposer mon travail</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{depositingHw.subject}</p>
                                </div>
                            </div>
                            <button onClick={() => setDepositingHw(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 md:p-8 space-y-6">
                            <div className="bg-gray-50 rounded-2xl p-4 md:p-8 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-center group hover:border-[#1A6CC8]/50 transition-all cursor-pointer relative">
                                <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                    onChange={handleFileUpload}
                                    disabled={depositMutation.isPending}
                                />
                                {depositMutation.isPending ? (
                                    <Loader2 className="w-10 h-10 text-[#1A6CC8] animate-spin mb-4" />
                                ) : (
                                    <FileText className="w-10 h-10 text-gray-300 group-hover:text-[#1A6CC8] transition-colors mb-4" />
                                )}
                                <p className="text-sm font-bold text-[#0D2D5A] mb-1">
                                    {depositMutation.isPending ? "Téléchargement..." : "Clique ici ou glisse ton fichier"}
                                </p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">PDF, PNG, JPG (Max 10MB)</p>
                            </div>

                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex gap-3">
                                <AlertCircle className="w-5 h-5 text-[#1A6CC8] shrink-0" />
                                <p className="text-xs text-[#1A6CC8] font-medium leading-relaxed">
                                    Une fois déposé, ton professeur pourra corriger ton travail. Tu ne pourras plus modifier le fichier après l'envoi.
                                </p>
                            </div>

                            <button 
                                onClick={() => setDepositingHw(null)}
                                className="w-full py-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryRow({ label, count, color, bg }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer">
            <div className="flex items-center gap-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs", bg, color)}>
                    {count}
                </div>
                <span className="text-xs font-bold text-gray-600 tracking-tight">{label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
    );
}

function HomeworkItem({ hw, onViewCorrection, onDeposit }: { hw: any, onViewCorrection: () => void, onDeposit: () => void }) {
    const statusConfig = {
        'à faire': { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', label: 'À faire' },
        'rendu': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', label: 'Rendu' },
        'corrigé': { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100', label: 'Corrigé' }
    };

    const config = statusConfig[hw.status as keyof typeof statusConfig] || statusConfig['à faire'];

    return (
        <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 hover:border-[#1A6CC8]/20 transition-all group">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className={cn(
                            "text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border tracking-wider",
                            config.bg, config.color, config.border
                        )}>
                            {config.label}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{hw.subject}</span>
                    </div>

                    <div>
                        <h4 className="text-base font-bold text-[#0D2D5A] group-hover:text-[#1A6CC8] transition-colors">{hw.title}</h4>
                        <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-1">{hw.description}</p>
                    </div>

                    <div className="flex items-center gap-6 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-gray-300" />
                            Échéance : {hw.dueDate}
                        </div>
                        <div className="flex items-center gap-1.5 border-l border-gray-100 pl-6">
                            <Clock className="w-3.5 h-3.5 text-gray-300" />
                            Par {hw.teacherName}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    {hw.status === 'à faire' ? (
                        <button 
                            onClick={onDeposit}
                            className="bg-[#1A6CC8] text-white px-5 py-2.5 rounded-xl text-[10px] font-bold hover:bg-[#15549a] transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm active:scale-95 duration-200"
                        >
                            <Upload className="w-3.5 h-3.5" />
                            Déposer
                        </button>
                    ) : hw.status === 'corrigé' ? (
                        <button 
                            onClick={onViewCorrection}
                            className="bg-green-600 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold hover:bg-green-700 transition-all flex items-center gap-2 uppercase tracking-widest shadow-sm"
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Correction
                        </button>
                    ) : (
                        <div className="bg-gray-100 text-gray-400 px-5 py-2.5 rounded-xl text-[10px] font-bold flex items-center gap-2 uppercase tracking-widest">
                            <Clock className="w-3.5 h-3.5" />
                            En attente
                        </div>
                    )}
                    <button className="p-2.5 bg-gray-50 text-gray-400 border border-gray-100 rounded-xl hover:bg-gray-100 hover:text-[#0D2D5A] transition-all">
                        <FileText className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
