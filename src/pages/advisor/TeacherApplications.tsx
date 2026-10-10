import TeacherApplicationsBoard from "@/components/dashboard/TeacherApplicationsBoard";

export default function AdvisorTeacherApplications() {
    return (
        <TeacherApplicationsBoard
            reviewerRole="advisor"
            title="Candidatures profs"
            description="Trouvez et gérez les nouveaux profils de professeurs avec lesquels vous souhaitez collaborer."
        />
    );
}
