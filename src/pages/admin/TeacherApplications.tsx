import TeacherApplicationsBoard from "@/components/dashboard/TeacherApplicationsBoard";

export default function AdminTeacherApplications() {
    return (
        <TeacherApplicationsBoard
            reviewerRole="admin"
            title="Candidatures enseignants"
            description="Validez les profils proposés par les enseignants souhaitant rejoindre Care4Success."
        />
    );
}
