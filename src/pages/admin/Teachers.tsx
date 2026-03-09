import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, MapPin, Search, UserPlus, Filter, MoreHorizontal, Eye, Ban } from "lucide-react";

// UI Components
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface Teacher {
    id: string;
    name: string;
    email: string;
    subjects: string[];
    level: string;
    city: string;
    status: string;
    rating: number;
    students: number;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

export default function AdminTeachers() {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

    // Fetch Teachers
    const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
        queryKey: ["teachers"],
        queryFn: async () => {
            const res = await fetch(`${API_BASE_URL}/teachers`);
            if (!res.ok) throw new Error("Erreur de récupération des professeurs");
            return res.json();
        }
    });

    // Form state for new teacher
    const [newTeacher, setNewTeacher] = useState({
        name: "",
        email: "",
        subject: "",
        level: "",
        city: "",
    });

    // Create Teacher Mutation
    const createTeacherMutation = useMutation({
        mutationFn: async (payload: typeof newTeacher) => {
            const res = await fetch(`${API_BASE_URL}/teachers`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error("Erreur d'ajout");
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast.success("Enseignant ajouté", {
                description: `${newTeacher.name} a été ajouté avec succès. Un email d'invitation lui a été envoyé.`
            });
            setIsAddOpen(false);
            setNewTeacher({ name: "", email: "", subject: "", level: "", city: "" });
        },
        onError: () => {
            toast.error("Erreur, impossible d'ajouter ce professeur");
        }
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string, status: string }) => {
            const res = await fetch(`${API_BASE_URL}/teachers/${id}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Erreur de modification");
            return res.json();
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["teachers"] });
            toast.info("Statut modifié", {
                description: `Le compte a été passé en ${variables.status}.`
            });
        },
        onError: () => {
            toast.error("Erreur, impossible de modifier le statut.");
        }
    });

    const handleAddTeacher = (e: React.FormEvent) => {
        e.preventDefault();

        if (!newTeacher.name || !newTeacher.email) {
            toast.error("Veuillez remplir les champs obligatoires.");
            return;
        }

        createTeacherMutation.mutate(newTeacher);
    };

    const handleSuspend = (id: string, currentStatus: string) => {
        const newStatus = currentStatus === "suspendu" ? "actif" : "suspendu";
        updateStatusMutation.mutate({ id, status: newStatus });
    };

    // Filtre de la liste statique
    const filteredTeachers = teachers.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            t.subjects.join(" ").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" ||
            (statusFilter === "actif" && t.status === "actif") ||
            (statusFilter === "inactif" && t.status !== "actif");
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header section with Stats and Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#0D2D5A]">Enseignants</h1>
                    <p className="text-gray-500 text-sm mt-1">{teachers.length} enseignants enregistrés sur la plateforme</p>
                </div>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2 bg-[#1A6CC8] hover:bg-[#0D2D5A] text-white">
                            <UserPlus className="w-4 h-4" />
                            Ajouter un enseignant
                        </Button>
                    </DialogTrigger>
                    {/* Add Teacher Modal */}
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-[#0D2D5A]">Nouvel enseignant</DialogTitle>
                            <DialogDescription>
                                Créez le profil d'un professeur. Il recevra un accès direct par email.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleAddTeacher} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nom complet *</Label>
                                <Input id="name" placeholder="Ex: Jean Dupont" value={newTeacher.name} onChange={(e) => setNewTeacher({ ...newTeacher, name: e.target.value })} required disabled={createTeacherMutation.isPending} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Adresse email *</Label>
                                <Input id="email" type="email" placeholder="jean.dupont@email.com" value={newTeacher.email} onChange={(e) => setNewTeacher({ ...newTeacher, email: e.target.value })} required disabled={createTeacherMutation.isPending} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Matière principale</Label>
                                    <Input id="subject" placeholder="Ex: Mathématiques" value={newTeacher.subject} onChange={(e) => setNewTeacher({ ...newTeacher, subject: e.target.value })} disabled={createTeacherMutation.isPending} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="level">Niveaux</Label>
                                    <Input id="level" placeholder="Ex: Collège, Lycée" value={newTeacher.level} onChange={(e) => setNewTeacher({ ...newTeacher, level: e.target.value })} disabled={createTeacherMutation.isPending} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="city">Ville d'intervention</Label>
                                <Input id="city" placeholder="Ex: Douala" value={newTeacher.city} onChange={(e) => setNewTeacher({ ...newTeacher, city: e.target.value })} disabled={createTeacherMutation.isPending} />
                            </div>

                            <DialogFooter className="mt-6">
                                <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} disabled={createTeacherMutation.isPending}>Annuler</Button>
                                <Button type="submit" className="bg-[#1A6CC8] hover:bg-[#0D2D5A]" disabled={createTeacherMutation.isPending}>Créer le profil</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filters & Search section */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                        placeholder="Rechercher par nom ou matière..."
                        className="pl-9 border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200">
                        <Filter className="w-4 h-4 mr-2" />
                        <SelectValue placeholder="Filtrer par statut" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="actif">Actifs uniquement</SelectItem>
                        <SelectItem value="inactif">Inactifs/Suspendus</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Content Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50/80 border-b border-gray-100">
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Enseignant</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Matières</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Niveaux</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Note</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Élèves</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-600">Ville</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-600">Statut</th>
                                <th className="text-right px-6 py-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                Array.from({ length: 3 }).map((_, i) => (
                                    <tr key={i} className="border-b border-gray-50">
                                        <td className="px-6 py-4"><Skeleton className="h-10 w-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-24" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4 text-center disabled"><Skeleton className="h-4 w-8 mx-auto" /></td>
                                        <td className="px-6 py-4 text-center disabled"><Skeleton className="h-4 w-8 mx-auto" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-4 w-16" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></td>
                                        <td className="px-6 py-4"><Skeleton className="h-8 w-8 ml-auto rounded-md" /></td>
                                    </tr>
                                ))
                            ) : filteredTeachers.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        Aucun enseignant ne correspond à votre recherche.
                                    </td>
                                </tr>
                            ) : filteredTeachers.map((t, i) => (
                                <tr key={t.id} className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#1A6CC8]/10 flex items-center justify-center text-sm font-bold text-[#1A6CC8]">
                                                {t.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-semibold text-[#0D2D5A]">{t.name}</span>
                                                <span className="text-xs text-gray-500">{t.email}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{t.subjects.join(", ")}</td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        <div className="flex flex-wrap gap-1">
                                            {t.level.split(',').map((lvl, idx) => (
                                                <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{lvl.trim()}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-1 bg-yellow-50 px-2 py-1 rounded-full w-fit mx-auto">
                                            <Star className="w-3.5 h-3.5 fill-[#F5A623] text-[#F5A623]" />
                                            <span className="font-bold text-[#0D2D5A]">{t.rating}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className="font-semibold text-[#1A6CC8] bg-[#1A6CC8]/10 px-2.5 py-1 rounded-full">{t.students}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                                            <MapPin className="w-3.5 h-3.5 text-gray-400" />{t.city}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-xs font-bold px-3 py-1 rounded-full inline-block min-w-[80px] text-center ${t.status === "actif" ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-500 border border-red-100"}`}>
                                            {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Ouvrir le menu</span>
                                                    <MoreHorizontal className="h-4 w-4 text-gray-500" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-[160px]">
                                                <DropdownMenuLabel>Actions métier</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer">
                                                    <Eye className="mr-2 h-4 w-4" /> Consulter le profil
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="cursor-pointer focus:text-inherit" onClick={() => handleSuspend(t.id, t.status)}>
                                                    <Ban className={`mr-2 h-4 w-4 ${t.status === "suspendu" ? "text-green-600" : "text-red-600"}`} />
                                                    <span className={t.status === "suspendu" ? "text-green-600" : "text-red-600"}>
                                                        {t.status === "suspendu" ? "Réactiver" : "Suspendre"}
                                                    </span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
