import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateDNSId, validateDNSId, slugify } from "@/lib/dnsUtils";
import { useCreateProject } from "@/features/projects/hooks/useProjectApi";
import { toast } from "sonner";

interface Project {
  project_id: string;
  name: string;
  description?: string;
}

interface ProjectSelectionStepProps {
  projects: Project[];
  selectedProjectId: string | null;
  onProjectSelect: (projectId: string) => void;
  onProjectCreated: (projectId: string) => void;
}

export function ProjectSelectionStep({
  projects,
  selectedProjectId,
  onProjectSelect,
  onProjectCreated,
}: ProjectSelectionStepProps) {
  const [showCreateForm, setShowCreateForm] = useState(projects.length === 0);
  const { mutateAsync: createProject } = useCreateProject();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    id: "",
    name: "",
    description: "",
  });

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      id:
        prev.id === "" ||
        prev.id === slugify(prev.name) + "-" + prev.id.slice(-4)
          ? generateDNSId(name)
          : prev.id,
    }));
  };

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
        setFormData({ id: "", name: "", description: "" });
        setShowCreateForm(false);
        onProjectCreated(newProject.project_id);
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {projects.length === 0
              ? "Create Your First Project"
              : "Select Project"}
          </CardTitle>
          <CardDescription>
            {projects.length === 0
              ? "Start by creating a project to organize your resources"
              : "Choose an existing project or create a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!showCreateForm && projects.length > 0 ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="project-select">Project *</Label>
                <Select
                  value={selectedProjectId || ""}
                  onValueChange={onProjectSelect}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem
                        key={project.project_id}
                        value={project.project_id}
                      >
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateForm(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New Project
                </Button>
              </div>
            </>
          ) : (
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <Label htmlFor="name">Project Name *</Label>
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
                <Label htmlFor="id">Project ID *</Label>
                <Input
                  id="id"
                  type="text"
                  value={formData.id}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, id: e.target.value }))
                  }
                  placeholder="project-id-4f2a"
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Leave empty to auto-generate.
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
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter project description (optional)"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Project"}
                </Button>
                {projects.length > 0 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setFormData({ id: "", name: "", description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
