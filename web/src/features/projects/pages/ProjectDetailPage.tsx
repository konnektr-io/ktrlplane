import { useParams } from 'react-router-dom';

export default function ProjectDetailPage() {
  const { projectId } = useParams();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Project Details</h1>
        <p className="text-muted-foreground">Project ID: {projectId}</p>
      </div>
      
      <div className="bg-muted p-4 rounded-lg">
        <p>Project detail page - to be implemented</p>
      </div>
    </div>
  );
}
