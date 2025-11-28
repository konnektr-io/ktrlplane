import { useParams } from "react-router-dom";
import AccessControl from "@/features/access/components/AccessControl";
import { useOrganization } from "../hooks/useOrganizationApi";

export default function OrganizationAccessPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const {
    data: currentOrganization,
    isLoading,
    isError,
  } = useOrganization(orgId!);

  if (!orgId || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading organization...</p>
      </div>
    );
  }
  if (!currentOrganization || isError) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <AccessControl
      context={{
        scopeType: "organization",
        scopeId: orgId,
        scopeName: currentOrganization.name,
      }}
    />
  );
}
