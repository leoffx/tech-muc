import { ProjectDetailView } from "./project-detail-view";

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  return <ProjectDetailView projectId={params.projectId} />;
}

