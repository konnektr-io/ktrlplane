import { useParams } from 'react-router-dom';
import { useOrganizationStore } from '../store/organizationStore';
import AccessControl from '@/features/access/components/AccessControl';

export default function OrganizationAccessPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const { currentOrganization } = useOrganizationStore();

  if (!orgId || !currentOrganization) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Organization not found</p>
      </div>
    );
  }

  return (
    <AccessControl
      context={{
        scopeType: 'organization',
        scopeId: orgId,
        scopeName: currentOrganization.name,
      }}
    />
  );
}
