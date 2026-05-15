
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  registerUser,
  fetchUsers,
  updateUserProfile,
  fetchChildrenByParent,
  fetchParentsByStudent,
  fetchTeachersByStudent,
  fetchStudentsLinkedToTeacher,
  linkParentChildRelation,
  unlinkParentChildRelation,
  linkStudentTeacherRelation,
  unlinkStudentTeacherRelation,
  type RegisterUserPayload,
} from "@/api/backoffice";
import type { Role, User } from "@/types/user";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, UserPlus, Edit3 } from "lucide-react";

type CreateLinkKey = "childrenIds" | "parentIds" | "teacherIds" | "studentIds";

type CreateFormState = RegisterUserPayload;

type EditFormState = {
  name: string;
  phone: string;
  avatar: string;
  location: string;
  timezone: string;
  language: string;
  bio: string;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyWhatsapp: boolean;
};

type EditLinkState = {
  children: string[];
  parents: string[];
  teachers: string[];
  students: string[];
};

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Administrateur" },
  { value: "advisor", label: "Conseiller" },
  { value: "parent", label: "Parent" },
  { value: "student", label: "Élève" },
  { value: "teacher", label: "Tuteur" },
];

const TIMEZONES = [
  { value: "Africa/Douala", label: "Africa/Douala" },
  { value: "Europe/Paris", label: "Europe/Paris" },
  { value: "UTC", label: "UTC" },
  { value: "America/Toronto", label: "America/Toronto" },
];

const LANGUAGES = [
  { value: "fr", label: "Français" },
  { value: "en", label: "English" },
];

const createInitialCreateForm = (): CreateFormState => ({
  role: "parent",
  name: "",
  email: "",
  password: "",
  phone: "",
  avatar: "",
  location: "",
  timezone: "Africa/Douala",
  language: "fr",
  bio: "",
  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: false,
  childrenIds: [],
  parentIds: [],
  teacherIds: [],
  studentIds: [],
});

const defaultEditForm: EditFormState = {
  name: "",
  phone: "",
  avatar: "",
  location: "",
  timezone: "Africa/Douala",
  language: "fr",
  bio: "",
  notifyEmail: true,
  notifySms: false,
  notifyWhatsapp: false,
};

const emptyEditLinks: EditLinkState = {
  children: [],
  parents: [],
  teachers: [],
  students: [],
};

type MultiSelectProps = {
  title: string;
  description: string;
  options: User[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  loading?: boolean;
  emptyLabel: string;
};
function MultiSelectChips({ title, description, options, selectedIds, onToggle, loading, emptyLabel }: MultiSelectProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Chargement des {title.toLowerCase()}...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[#0D2D5A]">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {options.length === 0 ? (
        <p className="text-xs text-gray-400 border border-dashed border-gray-200 rounded-xl px-3 py-2">{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((option) => {
            const active = selectedIds.includes(option.id);
            return (
              <button
                type="button"
                key={option.id}
                onClick={() => onToggle(option.id)}
                className={`px-3 py-2 rounded-2xl border text-left transition-all min-w-[160px] ${active ? "border-[#1A6CC8] bg-[#1A6CC8]/10 text-[#0D2D5A]" : "border-gray-200 bg-white text-gray-600 hover:border-[#1A6CC8]/40"}`}
              >
                <p className="text-sm font-semibold truncate">{option.name}</p>
                <p className="text-[11px] text-gray-400 truncate">{option.email}</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const diffIds = (next: string[], prev: string[]) => ({
  added: next.filter((id) => !prev.includes(id)),
  removed: prev.filter((id) => !next.includes(id)),
});
export default function ProfileManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userId } = useParams();
  const [searchParams] = useSearchParams();

  const [createForm, setCreateForm] = useState<CreateFormState>(createInitialCreateForm);
  const [editRole, setEditRole] = useState<Role>((searchParams.get("role") as Role) || "parent");
  const [selectedUserId, setSelectedUserId] = useState<string>(userId || "");
  const [editForm, setEditForm] = useState<EditFormState>(defaultEditForm);
  const [editLinks, setEditLinks] = useState<EditLinkState>(emptyEditLinks);
  const [initialLinks, setInitialLinks] = useState<EditLinkState>(emptyEditLinks);

  const parentsQuery = useQuery({
    queryKey: ["users", "parent"],
    queryFn: () => fetchUsers("parent"),
  });
  const studentsQuery = useQuery({
    queryKey: ["users", "student"],
    queryFn: () => fetchUsers("student"),
  });
  const teachersQuery = useQuery({
    queryKey: ["users", "teacher"],
    queryFn: () => fetchUsers("teacher"),
  });

  const editUsersQuery = useQuery({
    queryKey: ["users", "edit", editRole],
    queryFn: () => fetchUsers(editRole),
  });

  const parentChildrenQuery = useQuery({
    queryKey: ["relationships", "parent-child", selectedUserId],
    queryFn: () => fetchChildrenByParent(selectedUserId),
    enabled: editRole === "parent" && Boolean(selectedUserId),
  });
  const studentParentsQuery = useQuery({
    queryKey: ["relationships", "student-parents", selectedUserId],
    queryFn: () => fetchParentsByStudent(selectedUserId),
    enabled: editRole === "student" && Boolean(selectedUserId),
  });
  const studentTeachersQuery = useQuery({
    queryKey: ["relationships", "student-teachers", selectedUserId],
    queryFn: () => fetchTeachersByStudent(selectedUserId),
    enabled: editRole === "student" && Boolean(selectedUserId),
  });
  const teacherStudentsQuery = useQuery({
    queryKey: ["relationships", "teacher-students", selectedUserId],
    queryFn: () => fetchStudentsLinkedToTeacher(selectedUserId),
    enabled: editRole === "teacher" && Boolean(selectedUserId),
  });

  const roleUsers = useMemo(() => editUsersQuery.data ?? [], [editUsersQuery.data]);
  const selectedUser = useMemo(
    () => roleUsers.find((user) => user.id === selectedUserId),
    [roleUsers, selectedUserId]
  );

  useEffect(() => {
    // Si on a un userId dans l'URL et que c'est le premier chargement ou que le rôle correspond, on ne reset pas tout
    if (userId && selectedUserId === userId) {
      // On garde le userId mais on peut reset le reste si besoin
    } else {
      setSelectedUserId("");
    }
    setEditForm(defaultEditForm);
    setEditLinks(emptyEditLinks);
    setInitialLinks(emptyEditLinks);
  }, [editRole, userId]);

  useEffect(() => {
    if (selectedUserId) return;
    if (userId) {
      setSelectedUserId(userId);
      return;
    }
    const firstUser = roleUsers[0];
    if (firstUser) {
      setSelectedUserId(firstUser.id);
    }
  }, [selectedUserId, roleUsers, userId]);

  useEffect(() => {
    if (!selectedUser) {
      setEditForm(defaultEditForm);
      return;
    }
    setEditForm({
      name: selectedUser.name,
      phone: selectedUser.phone ?? "",
      avatar: (selectedUser.avatar ?? selectedUser.name?.slice(0, 2) ?? "").toUpperCase(),
      location: selectedUser.location ?? "",
      timezone: selectedUser.timezone ?? "Africa/Douala",
      language: selectedUser.language ?? "fr",
      bio: selectedUser.bio ?? "",
      notifyEmail: selectedUser.notifyEmail ?? true,
      notifySms: selectedUser.notifySms ?? false,
      notifyWhatsapp: selectedUser.notifyWhatsapp ?? false,
    });
  }, [selectedUser]);

  useEffect(() => {
    if (editRole === "parent" && parentChildrenQuery.data) {
      const ids = parentChildrenQuery.data.map((child) => child.id);
      setEditLinks((prev) => ({ ...prev, children: ids }));
      setInitialLinks((prev) => ({ ...prev, children: ids }));
    }
  }, [editRole, parentChildrenQuery.data]);

  useEffect(() => {
    if (editRole === "student") {
      if (studentParentsQuery.data) {
        const ids = studentParentsQuery.data.map((parent) => parent.id);
        setEditLinks((prev) => ({ ...prev, parents: ids }));
        setInitialLinks((prev) => ({ ...prev, parents: ids }));
      }
      if (studentTeachersQuery.data) {
        const ids = studentTeachersQuery.data.map((teacher) => teacher.id);
        setEditLinks((prev) => ({ ...prev, teachers: ids }));
        setInitialLinks((prev) => ({ ...prev, teachers: ids }));
      }
    }
  }, [editRole, studentParentsQuery.data, studentTeachersQuery.data]);

  useEffect(() => {
    if (editRole === "teacher" && teacherStudentsQuery.data) {
      const ids = teacherStudentsQuery.data.map((student) => student.id);
      setEditLinks((prev) => ({ ...prev, students: ids }));
      setInitialLinks((prev) => ({ ...prev, students: ids }));
    }
  }, [editRole, teacherStudentsQuery.data]);
  const toggleCreateLink = (key: CreateLinkKey, value: string) => {
    setCreateForm((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((id) => id !== value) : [...prev[key], value],
      };
    });
  };

  const toggleEditLink = (key: keyof EditLinkState, value: string) => {
    setEditLinks((prev) => {
      const exists = prev[key].includes(value);
      return {
        ...prev,
        [key]: exists ? prev[key].filter((id) => id !== value) : [...prev[key], value],
      };
    });
  };

  const invalidateUserCollections = (roles: Role[]) => {
    roles.forEach((role) => {
      queryClient.invalidateQueries({ queryKey: ["users", role] });
      queryClient.invalidateQueries({ queryKey: ["users", "edit", role] });
    });
  };

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterUserPayload) => registerUser(payload),
    onSuccess: (_result, variables) => {
      toast({
        title: "Compte créé",
        description: `${variables.name} peut maintenant se connecter.`,
      });
      setCreateForm(createInitialCreateForm);
      invalidateUserCollections([variables.role]);
      queryClient.invalidateQueries({ queryKey: ["relationships"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible de créer le compte",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const applyRelationshipChanges = async () => {
    if (!selectedUserId) return;
    const tasks: Promise<unknown>[] = [];

    if (editRole === "parent") {
      const { added, removed } = diffIds(editLinks.children, initialLinks.children);
      added.forEach((childId) => tasks.push(linkParentChildRelation(selectedUserId, childId)));
      removed.forEach((childId) => tasks.push(unlinkParentChildRelation(selectedUserId, childId)));
    }
    if (editRole === "student") {
      const parentDiff = diffIds(editLinks.parents, initialLinks.parents);
      parentDiff.added.forEach((parentId) => tasks.push(linkParentChildRelation(parentId, selectedUserId)));
      parentDiff.removed.forEach((parentId) => tasks.push(unlinkParentChildRelation(parentId, selectedUserId)));

      const teacherDiff = diffIds(editLinks.teachers, initialLinks.teachers);
      teacherDiff.added.forEach((teacherId) => tasks.push(linkStudentTeacherRelation(selectedUserId, teacherId)));
      teacherDiff.removed.forEach((teacherId) => tasks.push(unlinkStudentTeacherRelation(selectedUserId, teacherId)));
    }
    if (editRole === "teacher") {
      const { added, removed } = diffIds(editLinks.students, initialLinks.students);
      added.forEach((studentId) => tasks.push(linkStudentTeacherRelation(studentId, selectedUserId)));
      removed.forEach((studentId) => tasks.push(unlinkStudentTeacherRelation(studentId, selectedUserId)));
    }

    if (tasks.length) {
      await Promise.all(tasks);
      setInitialLinks(editLinks);
    }
  };

  const editMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId) throw new Error("Aucun utilisateur sélectionné.");
      const payload = {
        ...editForm,
        name: editForm.name.trim(),
        avatar: editForm.avatar.trim().slice(0, 2).toUpperCase(),
        location: editForm.location.trim(),
      };
      const updatedUser = await updateUserProfile(selectedUserId, payload);
      await applyRelationshipChanges();
      return updatedUser;
    },
    onSuccess: (data) => {
      toast({
        title: "Profil mis à jour",
        description: `${data.name} a été synchronisé avec succès.`,
      });
      invalidateUserCollections([editRole]);
    },
    onError: (error: Error) => {
      toast({
        title: "Impossible de mettre à jour",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateChange = (key: keyof CreateFormState, value: string | boolean) => {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    registerMutation.mutate({
      ...createForm,
      name: createForm.name.trim(),
      email: createForm.email.trim(),
      password: createForm.password.trim(),
      avatar: createForm.avatar?.trim().slice(0, 2).toUpperCase() ?? "",
      phone: createForm.phone?.trim() ?? "",
      location: createForm.location?.trim() ?? "",
      bio: createForm.bio?.trim() ?? "",
    });
  };

  const handleEditSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    editMutation.mutate();
  };

  const hasRelationshipSection = ["parent", "student", "teacher"].includes(editRole);
  const creationRelationshipFields = () => {
    if (createForm.role === "parent") {
      return (
        <MultiSelectChips
          title="Enfants rattachés"
          description="Sélectionnez les élèves suivis par ce parent."
          options={studentsQuery.data ?? []}
          selectedIds={createForm.childrenIds}
          onToggle={(id) => toggleCreateLink("childrenIds", id)}
          loading={studentsQuery.isLoading}
          emptyLabel="Aucun élève enregistré pour l'instant."
        />
      );
    }
    if (createForm.role === "student") {
      return (
        <div className="space-y-4">
          <MultiSelectChips
            title="Parents référents"
            description="Au moins un parent peut être rattaché."
            options={parentsQuery.data ?? []}
            selectedIds={createForm.parentIds}
            onToggle={(id) => toggleCreateLink("parentIds", id)}
            loading={parentsQuery.isLoading}
            emptyLabel="Enregistrez un parent avant de créer un élève."
          />
          <MultiSelectChips
            title="Enseignants assignés"
            description="Optionnel, vous pourrez lier plus tard."
            options={teachersQuery.data ?? []}
            selectedIds={createForm.teacherIds}
            onToggle={(id) => toggleCreateLink("teacherIds", id)}
            loading={teachersQuery.isLoading}
            emptyLabel="Aucun enseignant disponible pour le moment."
          />
        </div>
      );
    }
    if (createForm.role === "teacher") {
      return (
        <MultiSelectChips
          title="Élèves suivis"
          description="Affectations initiales de ce professeur."
          options={studentsQuery.data ?? []}
          selectedIds={createForm.studentIds}
          onToggle={(id) => toggleCreateLink("studentIds", id)}
          loading={studentsQuery.isLoading}
          emptyLabel="Créez d'abord des élèves pour les assigner."
        />
      );
    }
    return null;
  };

  const editRelationshipFields = () => {
    if (!hasRelationshipSection) return null;
    if (editRole === "parent") {
      return (
        <MultiSelectChips
          title="Enfants rattachés"
          description="Contrôlez les élèves liés à ce parent."
          options={studentsQuery.data ?? []}
          selectedIds={editLinks.children}
          onToggle={(id) => toggleEditLink("children", id)}
          loading={studentsQuery.isLoading || parentChildrenQuery.isFetching}
          emptyLabel="Aucun élève associé pour l'instant."
        />
      );
    }
    if (editRole === "student") {
      return (
        <div className="space-y-4">
          <MultiSelectChips
            title="Parents référents"
            description="Au moins un parent peut être rattaché."
            options={parentsQuery.data ?? []}
            selectedIds={editLinks.parents}
            onToggle={(id) => toggleEditLink("parents", id)}
            loading={parentsQuery.isLoading || studentParentsQuery.isFetching}
            emptyLabel="Aucun parent enregistré."
          />
          <MultiSelectChips
            title="Tuteurs"
            description="Sélectionnez les tuteurs rattachés à cet élève"
            emptyLabel="Aucun tuteur disponible"
            options={teachersQuery.data ?? []}
            selectedIds={editLinks.teachers}
            onToggle={(id) => toggleEditLink("teachers", id)}
            loading={teachersQuery.isLoading || studentTeachersQuery.isFetching}
          />
        </div>
      );
    }
    if (editRole === "teacher") {
      return (
        <MultiSelectChips
          title="Apprenants"
          description="Élèves rattachés à ce tuteur"
          emptyLabel="Aucun élève disponible"
          options={studentsQuery.data ?? []}
          selectedIds={editLinks.students}
          onToggle={(id) => toggleEditLink("students", id)}
          loading={studentsQuery.isLoading || teacherStudentsQuery.isFetching}
        />
      );
    }
    return null;
  };
  return (
    <div className="min-h-screen bg-gray-50 pb-16" style={{ fontFamily: "Ubuntu, 'Noto Sans', sans-serif" }}>
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[4px] text-gray-400 font-black">Utilisateurs • Identités</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1A6CC8]/10 text-[#1A6CC8] flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#0D2D5A]">Gestion des comptes et rôles</h1>
              <p className="text-sm text-gray-500">
                Créez de nouveaux accès, mettez à jour les profils et synchronisez les liaisons parents/élèves/professeurs.
              </p>
            </div>
          </div>
        </header>

        <div className="grid gap-6 xl:grid-cols-1 sm:grid-cols-2">
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#22c55e]/10 text-[#22c55e] flex items-center justify-center">
                <UserPlus className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0D2D5A]">Création d'utilisateur</h2>
                <p className="text-sm text-gray-500">Définissez le rôle et rattachez immédiatement les relations clés.</p>
              </div>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Nom complet</label>
                  <Input
                    value={createForm.name}
                    onChange={(event) => handleCreateChange("name", event.target.value)}
                    placeholder="Nom et prénom"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Adresse email</label>
                  <Input
                    type="email"
                    value={createForm.email}
                    onChange={(event) => handleCreateChange("email", event.target.value)}
                    placeholder="utilisateur@care4success.cm"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Mot de passe</label>
                  <Input
                    type="password"
                    value={createForm.password}
                    onChange={(event) => handleCreateChange("password", event.target.value)}
                    placeholder="Minimum 8 caractères"
                    required
                    minLength={8}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Rôle</label>
                  <select
                    value={createForm.role}
                    onChange={(event) => {
                      const role = event.target.value as Role;
                      setCreateForm((prev) => ({
                        ...prev,
                        role,
                        childrenIds: [],
                        parentIds: [],
                        teacherIds: [],
                        studentIds: [],
                      }));
                    }}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Téléphone</label>
                  <Input
                    value={createForm.phone}
                    onChange={(event) => handleCreateChange("phone", event.target.value)}
                    placeholder="+237..."
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Avatar (initiales)</label>
                  <Input
                    value={createForm.avatar ?? ""}
                    onChange={(event) =>
                      handleCreateChange("avatar", event.target.value.slice(0, 2).toUpperCase())
                    }
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Fuseau horaire</label>
                  <select
                    value={createForm.timezone}
                    onChange={(event) => handleCreateChange("timezone", event.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                  >
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone.value} value={timezone.value}>
                        {timezone.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Langue</label>
                  <select
                    value={createForm.language}
                    onChange={(event) => handleCreateChange("language", event.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                  >
                    {LANGUAGES.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Localisation</label>
                <Input
                  value={createForm.location}
                  onChange={(event) => handleCreateChange("location", event.target.value)}
                  placeholder="Ville, Pays"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bio</label>
                <Textarea
                  rows={3}
                  value={createForm.bio}
                  onChange={(event) => handleCreateChange("bio", event.target.value)}
                  placeholder="Présentation brève du profil."
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                  <Switch
                    checked={createForm.notifyEmail}
                    onCheckedChange={(checked) => handleCreateChange("notifyEmail", checked)}
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#0D2D5A]">Emails</p>
                    <p className="text-xs text-gray-500">Alertes et résumés quotidiens</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                  <Switch
                    checked={createForm.notifySms}
                    onCheckedChange={(checked) => handleCreateChange("notifySms", checked)}
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#0D2D5A]">SMS</p>
                    <p className="text-xs text-gray-500">Escalade planning sensible</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                  <Switch
                    checked={createForm.notifyWhatsapp}
                    onCheckedChange={(checked) => handleCreateChange("notifyWhatsapp", checked)}
                  />
                  <div>
                    <p className="font-semibold text-sm text-[#0D2D5A]">WhatsApp</p>
                    <p className="text-xs text-gray-500">Familles premium</p>
                  </div>
                </label>
              </div>

              {creationRelationshipFields()}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="min-w-[180px] bg-[#1A6CC8] hover:bg-[#0D2D5A] font-bold"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Création...
                    </span>
                  ) : (
                    "Créer le compte"
                  )}
                </Button>
              </div>
            </form>
          </section>
          <section className="bg-white border border-gray-100 rounded-3xl shadow-sm p-4 md:p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F5A623]/10 text-[#F5A623] flex items-center justify-center">
                <Edit3 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#0D2D5A]">Edition & liaisons</h2>
                <p className="text-sm text-gray-500">Choisissez le rôle, sélectionnez l'utilisateur puis sauvegardez.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {ROLE_OPTIONS.map((role) => (
                <button
                  key={role.value}
                  type="button"
                  onClick={() => setEditRole(role.value)}
                  className={`px-4 py-2 rounded-2xl text-sm font-semibold transition-all border ${editRole === role.value ? "bg-[#1A6CC8] text-white border-transparent" : "border-gray-200 text-gray-600 hover:border-[#1A6CC8]/40"}`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {roleUsers.length === 0 ? (
              <p className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl px-4 py-6 text-center">
                Aucun profil {ROLE_OPTIONS.find((role) => role.value === editRole)?.label.toLowerCase()} enregistré.
              </p>
            ) : (
              <form onSubmit={handleEditSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Utilisateur</label>
                  <select
                    value={selectedUserId}
                    onChange={(event) => setSelectedUserId(event.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                  >
                    {roleUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} — {user.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Nom complet</label>
                    <Input
                      value={editForm.name}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Initiales</label>
                    <Input
                      value={editForm.avatar}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, avatar: event.target.value.slice(0, 2).toUpperCase() }))
                      }
                      maxLength={2}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Téléphone</label>
                    <Input
                      value={editForm.phone}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, phone: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Fuseau horaire</label>
                    <select
                      value={editForm.timezone}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, timezone: event.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                    >
                      {TIMEZONES.map((timezone) => (
                        <option key={timezone.value} value={timezone.value}>
                          {timezone.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Langue</label>
                    <select
                      value={editForm.language}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, language: event.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#1A6CC8]/20 focus:border-[#1A6CC8]"
                    >
                      {LANGUAGES.map((language) => (
                        <option key={language.value} value={language.value}>
                          {language.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Localisation</label>
                    <Input
                      value={editForm.location}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, location: event.target.value }))}
                      placeholder="Ville, Pays"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bio</label>
                  <Textarea
                    rows={3}
                    value={editForm.bio}
                    onChange={(event) => setEditForm((prev) => ({ ...prev, bio: event.target.value }))}
                  />
                </div>

                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                    <Switch
                      checked={editForm.notifyEmail}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, notifyEmail: checked }))}
                    />
                    <div>
                      <p className="font-semibold text-sm text-[#0D2D5A]">Emails</p>
                      <p className="text-xs text-gray-500">Alertes quotidiennes</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                    <Switch
                      checked={editForm.notifySms}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, notifySms: checked }))}
                    />
                    <div>
                      <p className="font-semibold text-sm text-[#0D2D5A]">SMS</p>
                      <p className="text-xs text-gray-500">Escalade planning</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 rounded-2xl border border-gray-100 px-4 py-3 bg-gray-50/60 flex-1 min-w-[200px]">
                    <Switch
                      checked={editForm.notifyWhatsapp}
                      onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, notifyWhatsapp: checked }))}
                    />
                    <div>
                      <p className="font-semibold text-sm text-[#0D2D5A]">WhatsApp</p>
                      <p className="text-xs text-gray-500">Familles premium</p>
                    </div>
                  </label>
                </div>

                {editRelationshipFields()}

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="outline"
                    className="min-w-[180px] border-[#F5A623] text-[#F5A623] hover:bg-[#F5A623]/10 font-bold"
                    disabled={editMutation.isPending}
                  >
                    {editMutation.isPending ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Synchronisation...
                      </span>
                    ) : (
                      "Sauvegarder"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
