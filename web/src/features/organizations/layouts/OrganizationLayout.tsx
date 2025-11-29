import { useParams } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import OrganizationSidebarNav from "../components/sidebars/OrganizationSidebarNav";
import { useOrganization } from "../hooks/useOrganizationApi";

export default function OrganizationLayout() {
  const { orgId } = useParams<{ orgId: string }>();
  useOrganization(orgId!);

  return (
    <AppLayout
      sidebarContent={<OrganizationSidebarNav />}
      showProjectSelector={false}
    />
  );
}
