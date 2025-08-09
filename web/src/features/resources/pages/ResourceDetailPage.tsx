import { useParams } from 'react-router-dom';

export default function ResourceDetailPage() {
  const { projectId, resourceId } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Resource Details</h1>
        <p className="text-muted-foreground">Project: {projectId}, Resource: {resourceId}</p>
      </div>
      
      <div className="bg-muted p-4 rounded-lg">
        <p>Resource detail page - to be implemented</p>
      </div>
    </div>
  );
}
