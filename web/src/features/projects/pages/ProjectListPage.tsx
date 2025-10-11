import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useProjectStore } from '../store/projectStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateDNSId, validateDNSId, slugify } from '@/lib/dnsUtils';


// Accept optional organizationId prop (for direct usage or from route params)
type ProjectListPageProps = {
  organizationId?: string;
};

export default function ProjectListPage(props: ProjectListPageProps = {}) {
  const { orgId } = useParams<{ orgId?: string }>();
  const organizationId = props.organizationId || orgId;
  const {
    projects: allProjects,
    isLoadingList,
    fetchProjects,
    createProject,
  } = useProjectStore();
  const navigate = useNavigate();

  // Filter projects by organization if organizationId is present
  const projects = organizationId
    ? allProjects.filter((p) => p.org_id === organizationId)
    : allProjects;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });
  const [isCreating, setIsCreating] = useState(false);

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      // Auto-generate ID from name if ID is empty or was auto-generated
      id:
        prev.id === "" ||
        prev.id === slugify(prev.name) + "-" + prev.id.slice(-4)
          ? generateDNSId(name)
          : prev.id,
    }));
  };

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    if (!formData.id.trim()) {
      toast.error("Project ID is required");
      return;
    }

    const idValidationError = validateDNSId(formData.id);
    if (idValidationError) {
      toast.error(idValidationError);
      return;
    }

    setIsCreating(true);
    try {
      const newProject = await createProject({
        id: formData.id.trim(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      if (newProject) {
        toast.success("Project created successfully!");
        setIsDialogOpen(false);
        setFormData({ id: "", name: "", description: "" });
        fetchProjects(); // Refresh the list
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingList) {
    return <div>Loading projects...</div>;
  }



  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">Manage your ktrlplane projects</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Enter project name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="id">ID *</Label>
                <Input
                  id="id"
                  type="text"
                  value={formData.id}
                  onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                  placeholder="project-id-4f2a"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Used for Kubernetes resources and DNS. Auto-generated from name but can be edited.
                </p>
                {formData.id && validateDNSId(formData.id) && (
                  <p className="text-sm text-red-500 mt-1">
                    {validateDNSId(formData.id)}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Project'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No projects found. Create your first project!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.project_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
              <h3 className="font-semibold">{project.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{project.description || 'No description'}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  project.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {project.status}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate(`/projects/${project.project_id}`)}
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
