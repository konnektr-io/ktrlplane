import { useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import AccessControlSimplified from '@/features/access/components/AccessControlSimplified';

export default function ProjectAccessPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { currentProject } = useProjectStore();

  if (!projectId || !currentProject) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Project not found</p>
      </div>
    );
  }

  return (
    <AccessControlSimplified
      context={{
        scopeType: 'project',
        scopeId: projectId,
        scopeName: currentProject.name,
      }}
    />
  );
}
