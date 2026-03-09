import TeacherApplicationsBoard from "@/components/dashboard/TeacherApplicationsBoard";

export default function AdvisorTeacherApplications() {
    return (
        <TeacherApplicationsBoard
            reviewerRole="advisor"
            title="Candidatures enseignants"
            description="Analysez les nouveaux profils et coordonnez-vous avec l'administration pour finaliser les recrutements."
        />
    );
}
