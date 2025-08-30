import { useParams } from 'react-router-dom';
import { useResourceStore } from '../store/resourceStore';
import AccessControl from '@/features/access/components/AccessControl';

export default function ResourceAccessPage() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const { currentResource } = useResourceStore();

  if (!resourceId || !currentResource) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Resource not found</p>
      </div>
    );
  }

  return (
    <AccessControl
      context={{
        scopeType: 'resource',
        scopeId: resourceId,
        scopeName: currentResource.name,
      }}
    />
  );
}
