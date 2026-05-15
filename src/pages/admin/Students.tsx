import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdvisorFamilies, resetUserPassword, updateFamilyDetails } from "@/api/backoffice";
import { CalendarDays, Loader2, RefreshCw, KeyRound, Edit3, Check } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const LEVELS = [
  "SIL", "CP", "CE1", "CE2", "CM1", "CM2",
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère", "Tle",
  "Supérieur"
];

const SUBJECTS = [
  "Mathématiques", "Physique-Chimie", "SVT", "Informatique",
  "Anglais", "Français", "Allemand", "Espagnol",
  "Philosophie", "Histoire-Géo", "Comptabilité"
];

export default function AdminStudents() {
  const queryClient = useQueryClient();
  const [editingFamily, setEditingFamily] = useState<any>(null);
  const [editForm, setEditForm] = useState<{ level: string; subjects: string[] }>({ 
    level: "", 
    subjects: [] 
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["advisorFamilies"],
    queryFn: fetchAdvisorFamilies,
  });

  const families = useMemo(() => data ?? [], [data]);

  const updateMutation = useMutation({
    mutationFn: ({ id, level, subject }: { id: string; level: string; subject: string }) => 
      updateFamilyDetails(id, { level, subject }),
    onSuccess: () => {
      toast.success("Informations mises à jour.");
      queryClient.invalidateQueries({ queryKey: ["advisorFamilies"] });
      setEditingFamily(null);
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour.");
    }
  });

  const handleReset = async (email: string, name: string) => {
    if (!email) {
      toast.error("Cet élève n'a pas d'email configuré.");
      return;
    }
    
    const newPassword = prompt(`Entrez le nouveau mot de passe pour ${name} (laissez vide pour 'eleve123') :`, "eleve123");
    
    if (newPassword === null) return; // Annulé

    try {
      await resetUserPassword(email, newPassword || "eleve123");
      toast.success(`Accès réinitialisé pour ${name}. Un email a été envoyé.`);
    } catch (error) {
      toast.error("Erreur lors de la réinitialisation.");
    }
  };

  const openEdit = (family: any) => {
    setEditingFamily(family);
    // Convert current subject string to array
    const currentSubjects = family.subject ? family.subject.split(", ").filter(Boolean) : [];
    setEditForm({ 
      level: family.level || "", 
      subjects: currentSubjects
    });
  };

  const toggleSubject = (subj: string) => {
    setEditForm(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subj)
        ? prev.subjects.filter(s => s !== subj)
        : [...prev.subjects, subj]
    }));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFamily) return;
    updateMutation.mutate({ 
      id: editingFamily.id, 
      level: editForm.level, 
      subject: editForm.subjects.join(", ") 
    });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A6CC8]" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-8">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between text-sm text-red-700">
          <span>Impossible de charger les familles depuis la base.</span>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0D2D5A]">Élèves & Familles</h1>
          <p className="text-gray-500 text-sm mt-1">{families.length} familles actives recensées</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Famille</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Élève</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Niveau</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Matière</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Enseignant</th>
                <th className="text-left px-6 py-4 font-semibold text-gray-600">Prochain cours</th>
                <th className="text-center px-6 py-4 font-semibold text-gray-600">Statut</th>
                <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {families.map((family, index) => (
                <tr key={family.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${index % 2 !== 0 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-xs font-bold text-green-700">
                        {family.parent?.[0] ?? "?"}
                      </div>
                      <span className="font-semibold text-[#0D2D5A]">{family.parent}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-700">{family.child}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 bg-[#1A6CC8]/10 text-[#1A6CC8] rounded-full text-xs font-bold">{family.level || "—"}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <div className="max-w-[200px] truncate" title={family.subject}>
                      {family.subject || "—"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700 font-medium">{family.teacher || "—"}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                      <CalendarDays className="w-3.5 h-3.5 text-[#F5A623]" />
                      {family.nextRdv || "À planifier"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        family.status === "suivi actif"
                          ? "bg-green-50 text-green-600"
                          : family.status === "matching"
                          ? "bg-blue-50 text-blue-600"
                          : family.status === "bilan planifié"
                          ? "bg-amber-50 text-amber-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {family.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(family)}
                      className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                      title="Modifier les informations (Niveau, Matière)"
                    >
                      <Edit3 className="w-4 h-4" />
                      Modifier
                    </button>
                    <button
                      onClick={() => handleReset(family.childEmail, family.child)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-medium"
                      title="Réinitialiser l'accès élève et renvoyer les identifiants"
                    >
                      <KeyRound className="w-4 h-4" />
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
              {families.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-400">
                    Aucune famille n&apos;est encore suivie.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editingFamily} onOpenChange={(open) => !open && setEditingFamily(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-[#0D2D5A] font-bold text-xl">Mise à jour fiche élève</DialogTitle>
            <DialogDescription>
              Modifiez le niveau scolaire et les matières suivies par cet élève.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-6 py-4">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Niveau scolaire</Label>
                <Select 
                  value={editForm.level} 
                  onValueChange={(val) => setEditForm(prev => ({ ...prev, level: val }))}
                >
                  <SelectTrigger className="rounded-xl border-gray-200">
                    <SelectValue placeholder="Choisir un niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEVELS.map(lvl => (
                      <SelectItem key={lvl} value={lvl}>{lvl}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold uppercase text-gray-500 tracking-wider">Matières suivies</Label>
                <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-2 border border-gray-100 rounded-xl bg-gray-50/50">
                  {SUBJECTS.map(subj => {
                    const active = editForm.subjects.includes(subj);
                    return (
                      <button
                        type="button"
                        key={subj}
                        onClick={() => toggleSubject(subj)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                          active 
                            ? "bg-[#1A6CC8] text-white border-transparent" 
                            : "bg-white text-gray-600 border-gray-200 hover:border-[#1A6CC8]/40"
                        }`}
                      >
                        {active && <Check className="w-3 h-3" />}
                        {subj}
                      </button>
                    );
                  })}
                </div>
                {editForm.subjects.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Sélection :</p>
                    {editForm.subjects.map(s => (
                      <Badge key={s} variant="secondary" className="text-[10px] bg-[#1A6CC8]/10 text-[#1A6CC8] border-none">
                        {s}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="pt-4 border-t border-gray-50">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setEditingFamily(null)}
                className="rounded-xl text-gray-500"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                className="bg-[#1A6CC8] hover:bg-[#0D2D5A] rounded-xl font-bold px-8"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
