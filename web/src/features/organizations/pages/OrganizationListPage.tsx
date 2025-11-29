import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useOrganizations } from "../hooks/useOrganizationApi";

export default function OrganizationListPage() {
  const navigate = useNavigate();
  const {
    data: organizations = [],
    isLoading,
    isError,
    error,
  } = useOrganizations();

  if (isLoading) {
    return <div>Loading organizations...</div>;
  }
  if (isError) {
    return (
      <div className="text-red-500">
        Error loading organizations: {error?.message || "Unknown error"}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Organizations</h1>
          <p className="text-muted-foreground">Manage your organizations</p>
        </div>
        {/* Optionally add a CreateOrganizationDialog here */}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {organizations.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No organizations found.</p>
          </div>
        ) : (
          organizations.map((org) => (
            <div
              key={org.org_id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <h3 className="font-semibold">{org.name}</h3>
              <div className="mt-3 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/organizations/${org.org_id}`)}
                >
                  View
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
