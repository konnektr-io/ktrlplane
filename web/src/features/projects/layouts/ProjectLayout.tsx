import React from "react";
import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ProjectSidebarNav from "../components/sidebars/ProjectSidebarNav";
import { useProject } from "../hooks/useProjectApi";
import { useProjectStore } from "../store/projectStore";

export default function ProjectLayout() {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const setCurrentProject = useProjectStore((s) => s.setCurrentProject);

  // Set currentProject in store when loaded
  React.useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project, setCurrentProject]);

  return (
    <AppLayout
      sidebarContent={<ProjectSidebarNav />}
      showProjectSelector={true}
    />
  );
}
