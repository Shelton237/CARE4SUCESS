import { useQuery } from "@tanstack/react-query";
import { DIAG_MAX, getDiagLevel, parseCriteria, evidenceLabel, STRENGTH_CRITERIA, WEAKNESS_CRITERIA } from "./diagnosticRubric";
import { Printer, RefreshCw, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    diagnosticQueryKey,
    fetchDiagnostic,
    fetchNotes,
    fetchPlan,
    getRequestId,
    getStudentId,
    isProspectFamily,
    notesQueryKey,
    planQueryKey,
} from "./familyQueries";

const NOT_PROVIDED = "Non renseigné";
const MAX_NOTES = 5;

const formatCriteria = (text: unknown, known: string[]) => {
    const { criteria, comment } = parseCriteria(text, known);
    return [criteria.join(", "), comment].filter(Boolean).join("\n");
};
const PRINT_ROOT_ID = "advisor-bilan-print";

const NOTE_LABELS: Record<string, string> = {
    observation: "Observation",
    recommandation: "Recommandation",
    alerte: "Alerte",
    positif: "Positif",
};

// Étapes d'avancement : mêmes libellés que le stepper de la fiche famille
const STEP_LABELS = ["Compte élève", "Rendez-vous", "Diagnostic", "Plan", "Matching"];

// Valeur d'affichage : vide ou tiret cadratin (valeur de repli du serveur) => libellé neutre
const show = (value: unknown, fallback: string = NOT_PROVIDED): string => {
    if (typeof value !== "string") return fallback;
    const v = value.trim();
    return v === "" || v === String.fromCharCode(0x2014) ? fallback : v;
};

const formatDate = (value: unknown): string => {
    if (!value) return NOT_PROVIDED;
    const d = new Date(value as string);
    return Number.isNaN(d.getTime()) ? NOT_PROVIDED : d.toLocaleDateString("fr-FR");
};

// N'imprime que le bilan : masque l'application (#root), tout le reste du body
// (overlay de la modale) et les boutons, puis place le bilan en haut de page.
const PRINT_CSS = `
@media print {
  #root { display: none !important; }
  body * { visibility: hidden !important; }
  #${PRINT_ROOT_ID}, #${PRINT_ROOT_ID} * { visibility: visible !important; }
  #${PRINT_ROOT_ID} {
    position: absolute !important; left: 0 !important; top: 0 !important;
    width: 100% !important; max-width: none !important; max-height: none !important;
    overflow: visible !important; transform: none !important;
    border: none !important; box-shadow: none !important; padding: 0 !important;
  }
  #${PRINT_ROOT_ID} button { display: none !important; }
}
`;

function SectionTitle({ children }: { children: React.ReactNode }) {
    return <h3 className="text-sm font-bold text-[#0D2D5A] uppercase tracking-wide border-b border-gray-100 pb-1.5">{children}</h3>;
}

function SectionError({ message, onRetry }: { message: string; onRetry: () => void }) {
    return (
        <div role="alert" className="p-3 bg-red-50 rounded-lg border border-red-100 flex items-center justify-between gap-2 text-xs text-red-700 font-semibold">
            <span>{message}</span>
            <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2 py-1 text-[11px] font-bold hover:bg-red-100 transition-colors shrink-0"
            >
                <RefreshCw className="w-3 h-3" /> Réessayer
            </button>
        </div>
    );
}

function Field({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{label}</div>
            <div className="text-sm font-semibold text-[#0D2D5A] mt-0.5">{value}</div>
        </div>
    );
}

interface AdvisorBilanViewProps {
    family: any;
    onClose: () => void;
}

export default function AdvisorBilanView({ family, onClose }: AdvisorBilanViewProps) {
    const { user, token } = useAuth();
    const prospect = isProspectFamily(family);
    const requestId = getRequestId(family);
    const studentId = getStudentId(family);
    const hasToken = !!token;

    // Mêmes clés et mêmes fonctions que Families.tsx : le cache est partagé
    const notesQuery = useQuery<any[]>({
        queryKey: notesQueryKey(studentId),
        queryFn: () => fetchNotes(studentId, token),
        enabled: !prospect && !!studentId && hasToken,
    });
    const diagQuery = useQuery({
        queryKey: diagnosticQueryKey(family),
        queryFn: () => fetchDiagnostic(family, token),
        enabled: !!(prospect ? requestId : studentId) && hasToken,
    });
    const planQuery = useQuery({
        queryKey: planQueryKey(family),
        queryFn: () => fetchPlan(family, token),
        enabled: !!(prospect ? requestId : studentId) && hasToken,
    });

    const diagnostic = diagQuery.data as any;
    const plan = planQuery.data as any;
    const hasDiagnostic = !!diagnostic?.id;
    const hasPlan = !!plan?.id;

    const teacher = prospect ? "Non assigné" : show(family?.teacherName || family?.teacher, "Non assigné");
    const stepDone = [
        !prospect,
        show(family?.nextRdv, "") !== "",
        hasDiagnostic,
        hasPlan,
        !prospect && teacher !== "Non assigné",
    ];
    const stepIdx = stepDone.findIndex((d) => !d);
    const stepLabel = stepIdx === -1
        ? "Parcours complet"
        : `Étape ${stepIdx + 1} sur ${STEP_LABELS.length} : ${STEP_LABELS[stepIdx]}`;

    const notes = [...(notesQuery.data ?? [])]
        .sort((a, b) => new Date(b?.created_at).getTime() - new Date(a?.created_at).getTime())
        .slice(0, MAX_NOTES);

    const parentName = show(family?.parentName || family?.parent, "Parent non renseigné");
    const childName = show(family?.childName || family?.child, "Élève non renseigné");
    const generatedAt = new Date().toLocaleDateString("fr-FR");

    return (
        <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
            <DialogContent id={PRINT_ROOT_ID} className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white">
                <style>{PRINT_CSS}</style>
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-[#0D2D5A]">Bilan Conseil</DialogTitle>
                    <DialogDescription>
                        Synthèse de la famille {parentName} et de l'élève {childName}.
                    </DialogDescription>
                </DialogHeader>

                {/* En-tête du dossier */}
                <section className="space-y-3" aria-label="Informations générales">
                    <SectionTitle>Informations générales</SectionTitle>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Field label="Parent" value={parentName} />
                        <Field label="Élève" value={childName} />
                        <Field label="Niveau" value={show(family?.level)} />
                        <Field label="Matière" value={show(family?.subject)} />
                        <Field label="Tuteur assigné" value={teacher} />
                        <Field label="Date de la demande" value={show(family?.requestDate)} />
                        <Field label="Avancement" value={stepLabel} />
                    </div>
                </section>

                {/* Dernier diagnostic */}
                <section className="space-y-3" aria-label="Dernier diagnostic">
                    <SectionTitle>Dernier diagnostic</SectionTitle>
                    {diagQuery.isError ? (
                        <SectionError message="Impossible de charger le diagnostic." onRetry={() => diagQuery.refetch()} />
                    ) : diagQuery.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0F9B8E]" aria-label="Chargement du diagnostic" />
                    ) : hasDiagnostic ? (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400">Réalisé le {formatDate(diagnostic.created_at)}</p>
                            <div className="space-y-2">
                                {Object.entries(diagnostic.scores || {}).map(([subject, score]) => {
                                    const level = getDiagLevel(score);
                                    const pct = (level.value / DIAG_MAX) * 100;
                                    const source = evidenceLabel(diagnostic.evidence?.[subject]);
                                    return (
                                        <div key={subject}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-[#0D2D5A] w-32 shrink-0">{subject}</span>
                                                <div className="flex-1 h-2 rounded-full bg-gray-100">
                                                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: level.color }} />
                                                </div>
                                                <span className="text-xs font-bold w-44 text-right" style={{ color: level.color }}>{level.value}/{DIAG_MAX} · {level.label}</span>
                                            </div>
                                            {source && <p className="text-[11px] text-gray-400 mt-0.5 pl-[8.75rem]">Source : {source}</p>}
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-bold text-[#0D2D5A] mb-1">Points forts</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{formatCriteria(diagnostic.strengths, STRENGTH_CRITERIA) || NOT_PROVIDED}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#0D2D5A] mb-1">Points à renforcer</p>
                                    <p className="text-sm text-gray-600 whitespace-pre-line">{formatCriteria(diagnostic.weaknesses, WEAKNESS_CRITERIA) || NOT_PROVIDED}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Aucun diagnostic enregistré</p>
                    )}
                </section>

                {/* Plan pédagogique actif */}
                <section className="space-y-3" aria-label="Plan pédagogique">
                    <SectionTitle>Plan pédagogique actif</SectionTitle>
                    {planQuery.isError ? (
                        <SectionError message="Impossible de charger le plan pédagogique." onRetry={() => planQuery.refetch()} />
                    ) : planQuery.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0F9B8E]" aria-label="Chargement du plan" />
                    ) : hasPlan ? (
                        <div className="space-y-2">
                            <p className="text-sm font-bold text-[#0D2D5A]">{plan.title}</p>
                            <p className="text-xs text-gray-400">Début : {formatDate(plan.start_date)}</p>
                            <ul className="space-y-1.5">
                                {(plan.weeks || []).map((w: any, i: number) => (
                                    <li key={i} className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase">Semaine {i + 1}</p>
                                            <p className="text-sm font-semibold text-[#0D2D5A]">{w.objective}</p>
                                            {Array.isArray(w.subjects) && w.subjects.length > 0 && (
                                                <p className="text-xs text-gray-500 mt-0.5">Matières : {w.subjects.join(", ")}</p>
                                            )}
                                        </div>
                                        <span className={`text-xs font-bold shrink-0 ${w.done ? "text-emerald-600" : "text-gray-400"}`}>
                                            {w.done ? "Fait" : "À faire"}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Aucun plan pédagogique actif</p>
                    )}
                </section>

                {/* Notes conseiller */}
                <section className="space-y-3" aria-label="Notes du conseiller">
                    <SectionTitle>Dernières notes du conseiller</SectionTitle>
                    {prospect ? (
                        <p className="text-sm text-gray-400 italic">Notes disponibles après création du compte élève</p>
                    ) : notesQuery.isError ? (
                        <SectionError message="Impossible de charger les notes." onRetry={() => notesQuery.refetch()} />
                    ) : notesQuery.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#0F9B8E]" aria-label="Chargement des notes" />
                    ) : notes.length > 0 ? (
                        <ul className="space-y-1.5">
                            {notes.map((note: any) => (
                                <li key={note.id} className="p-2 bg-gray-50 rounded-lg border border-gray-100">
                                    <p className="text-[11px] font-bold text-gray-400 uppercase">
                                        {NOTE_LABELS[note.note_type] || NOTE_LABELS.observation} · {formatDate(note.created_at)}
                                    </p>
                                    <p className="text-sm text-[#0D2D5A]">{note.content}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-gray-400 italic">Aucune note enregistrée</p>
                    )}
                </section>

                {/* Pied du bilan */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400">
                        Bilan généré le {generatedAt} par {show(user?.name, "Conseiller")}
                    </p>
                    <div className="flex items-center gap-2 print:hidden">
                        <Button variant="outline" onClick={onClose} className="h-9 text-xs font-bold">
                            Fermer
                        </Button>
                        <Button onClick={() => window.print()} className="h-9 text-xs font-bold bg-[#0D2D5A] hover:bg-[#0D2D5A]/90 text-white gap-2">
                            <Printer className="w-3.5 h-3.5" /> Imprimer / Exporter en PDF
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
