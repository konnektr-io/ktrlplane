import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ProjectSidebarNav from "../components/sidebars/ProjectSidebarNav";
import { useProject } from "../hooks/useProjectApi";

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  // Fetch project data (for sidebar, context, etc.)
  useProject(projectId!);

  // Optionally, you could pass project to sidebar or context if needed
  return (
    <AppLayout
      sidebarContent={<ProjectSidebarNav />}
      showProjectSelector={true}
    />
  );
}
