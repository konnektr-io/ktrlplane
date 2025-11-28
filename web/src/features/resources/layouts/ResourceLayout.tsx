import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import ResourceSidebarNav from "../components/sidebars/ResourceSidebarNav";
import { useResource } from "../hooks/useResourceApi";

export default function ResourceLayout() {
  const { projectId, resourceId } = useParams<{
    projectId: string;
    resourceId: string;
  }>();
  // Fetch resource data (for sidebar, context, etc.)
  useResource(projectId!, resourceId!);

  // Optionally, you could pass resource to sidebar or context if needed
  return (
    <AppLayout
      sidebarContent={<ResourceSidebarNav />}
      showProjectSelector={true}
    />
  );
}
