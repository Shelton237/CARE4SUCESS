import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { 
    Calendar, 
    Clock, 
    Video, 
    User, 
    Loader2, 
    Search,
    X,
    FileText,
    Download,
    Star
} from "lucide-react";
import { fetchScheduleByRole } from "@/api/backoffice";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { jsPDF } from "jspdf";

export default function StudentSchedule() {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [viewingSummary, setViewingSummary] = useState<any>(null);

    const { data: sessions, isLoading } = useQuery({
        queryKey: ["schedule", "student", user?.id],
        queryFn: () => fetchScheduleByRole("student", user!.id),
        enabled: Boolean(user?.id),
    });

    const filteredSessions = useMemo(() => {
        if (!sessions) return [];
        return sessions.filter(s => 
            s.subject.toLowerCase().includes(search.toLowerCase()) || 
            s.teacher.toLowerCase().includes(search.toLowerCase())
        );
    }, [sessions, search]);

    const handleDownloadPDF = () => {
        if (!viewingSummary) return;

        try {
            const doc = new jsPDF();
            const margin = 20;
            let cursorY = 20;

            // Header
            doc.setFillColor(13, 45, 90); // #0D2D5A
            doc.rect(0, 0, 210, 40, 'F');
            
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("CARE4SUCCESS", margin, 25);
            
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.text("Compte-rendu pédagogique", margin, 33);

            cursorY = 55;

            // Session Info
            doc.setTextColor(13, 45, 90);
            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text(viewingSummary.subject, margin, cursorY);
            cursorY += 10;

            doc.setFontSize(10);
            doc.setTextColor(100, 100, 100);
            doc.text(`Date : ${viewingSummary.date}`, margin, cursorY);
            cursorY += 7;
            doc.text(`Enseignant : ${viewingSummary.teacher}`, margin, cursorY);
            cursorY += 7;
            doc.text(`Durée : 2.0 heures`, margin, cursorY);
            cursorY += 15;

            // Content
            doc.setTextColor(13, 45, 90);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Notes du cours", margin, cursorY);
            cursorY += 8;

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(50, 50, 50);
            
            const notes = viewingSummary.notes || "Aucun compte-rendu disponible.";
            const splitContent = doc.splitTextToSize(notes, 170);
            doc.text(splitContent, margin, cursorY);
            
            cursorY += (splitContent.length * 5) + 20;

            // Footer
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, 280, 190, 280);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text("Document généré par la plateforme CARE4SUCCESS - " + new Date().toLocaleDateString(), margin, 285);

            doc.save(`Resume_${viewingSummary.subject}_${viewingSummary.date.replace(/\//g, '-')}.pdf`);
            toast.success("Le compte-rendu a été téléchargé.");
        } catch (error) {
            console.error("PDF generation failed", error);
            toast.error("Erreur lors de la génération du PDF.");
        }
    };

    if (isLoading) {
        return (
            <div className="p-4 md:p-8 flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Mon Planning</h1>
                    <p className="text-gray-500 text-sm mt-1">Gère tes cours et prépare tes sessions en direct.</p>
                </div>

                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Matière, enseignant..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A6CC8]/5 focus:border-[#1A6CC8] transition-all w-full md:w-64 shadow-sm"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                {/* Agenda View */}
                <div className="xl:col-span-3 space-y-4">
                    {filteredSessions.length > 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                            {filteredSessions.map((session) => (
                                <SessionItem 
                                    key={session.id} 
                                    session={session} 
                                    onViewSummary={() => setViewingSummary(session)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
                            <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                            <p className="text-gray-400 text-sm font-medium">Aucun cours trouvé.</p>
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-[#0D2D5A] rounded-2xl p-4 md:p-6 text-white shadow-lg">
                        <h3 className="font-bold text-base mb-3">Conseil d'étude</h3>
                        <p className="text-xs text-blue-200 leading-relaxed italic">
                            "Relire tes notes 15 minutes avant le cours augmente ta mémorisation de 40%."
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Volume horaire</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-bold text-[#0D2D5A]">Cette semaine</span>
                                <span className="text-xl font-bold text-[#0D2D5A]">8.5h</span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-[#1A6CC8] w-3/4" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Modal */}
            {viewingSummary && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={() => setViewingSummary(null)} />
                    <div className="bg-white rounded-2xl shadow-xl relative z-10 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-4 md:p-6 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-[#1A6CC8]">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#0D2D5A]">Résumé du Cours</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{viewingSummary.subject}</p>
                                </div>
                            </div>
                            <button onClick={() => setViewingSummary(null)} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-4 md:p-8 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>Informations</span>
                                    <span>{viewingSummary.date}</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <div className="text-[9px] text-gray-400 font-bold uppercase mb-1">Enseignant</div>
                                        <div className="text-xs font-bold text-[#0D2D5A]">{viewingSummary.teacher}</div>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-xl">
                                        <div className="text-[9px] text-gray-400 font-bold uppercase mb-1">Durée</div>
                                        <div className="text-xs font-bold text-[#0D2D5A]">2.0 heures</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Star className="w-4 h-4 text-orange-400 fill-current" />
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Compte-rendu pédagogique</span>
                                </div>
                                <div className="bg-gray-50 rounded-2xl p-4 md:p-6 border border-gray-100 text-sm text-[#0D2D5A] leading-relaxed font-medium whitespace-pre-line min-h-[120px]">
                                    {viewingSummary.notes || "Le professeur n'a pas encore rédigé le compte-rendu pour cette session. Revenez d'ici peu pour consulter les points abordés et les conseils d'étude."}
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setViewingSummary(null)}
                                    className="flex-1 bg-[#0D2D5A] text-white py-3.5 rounded-xl text-xs font-bold hover:bg-[#153460] transition-all shadow-lg active:scale-95"
                                >
                                    Fermer
                                </button>
                                <button 
                                    className="px-4 bg-blue-50 text-[#1A6CC8] rounded-xl hover:bg-blue-100 transition-all flex items-center justify-center border border-blue-100"
                                    onClick={handleDownloadPDF}
                                >
                                    <Download className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SessionItem({ session, onViewSummary }: { session: any, onViewSummary: () => void }) {
    const navigate = useNavigate();
    const isPast = session.status === "effectué";
    
    return (
        <div className={cn(
            "p-4 md:p-6 flex flex-col md:flex-row md:items-center gap-6 group transition-all",
            isPast ? "opacity-60 grayscale-[0.5]" : "hover:bg-gray-50/50"
        )}>
            {/* Hour & Date */}
            <div className="flex md:flex-col items-center gap-4 md:w-20 flex-shrink-0">
                <div className="text-center">
                    <div className="text-[10px] font-bold text-[#1A6CC8] uppercase tracking-tighter">{session.day}</div>
                    <div className="text-lg font-bold text-[#0D2D5A]">{session.date.split('/')[0]}</div>
                </div>
                <div className="hidden md:block w-8 h-px bg-gray-100" />
                <div className="text-[10px] font-bold text-gray-400">{session.time.split(' - ')[0]}</div>
            </div>

            {/* Subject Info */}
            <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "text-[9px] font-bold uppercase px-2 py-0.5 rounded-lg border tracking-wider",
                        isPast ? "bg-gray-100 text-gray-500 border-gray-200" : "bg-blue-50 text-[#1A6CC8] border-blue-100"
                    )}>
                        {session.subject}
                    </span>
                    {!isPast && session.status === "planifié" && (
                        <div className="flex items-center gap-1.5 ml-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest">À venir</span>
                        </div>
                    )}
                </div>
                <h4 className="font-bold text-[#0D2D5A] group-hover:text-[#1A6CC8] transition-colors">
                    {session.subject} avec {session.teacher}
                </h4>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                    <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-gray-300" />
                        {session.teacher}
                    </div>
                    <div className="flex items-center gap-1.5 border-l border-gray-100 pl-4">
                        <Video className="w-3 h-3 text-[#1A6CC8]" />
                        <span className="text-[#1A6CC8]">{session.location}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
                {isPast ? (
                    <button 
                        onClick={onViewSummary}
                        className="px-4 py-2 rounded-xl text-[10px] font-bold text-gray-400 hover:text-[#1A6CC8] border border-gray-100 hover:border-[#1A6CC8]/20 uppercase tracking-widest transition-all bg-white"
                    >
                        Résumé
                    </button>
                ) : (
                    (session.virtualLink || session.location?.toLowerCase().includes("ligne")) && (
                        <button 
                            onClick={() => navigate(`/virtual-class/${session.id}`)}
                            className="px-6 py-2.5 rounded-xl bg-[#0D2D5A] text-white text-[10px] font-bold hover:bg-[#153460] transition-all shadow-sm uppercase tracking-widest active:scale-95 duration-200"
                        >
                            Rejoindre
                        </button>
                    )
                )}
            </div>
        </div>
    );
}
