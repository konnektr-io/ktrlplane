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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { generateDNSId } from "@/lib/dnsUtils";
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
  isLoading?: boolean;
}

export function ProjectSelectionStep({
  projects,
  selectedProjectId,
  onProjectSelect,
  onProjectCreated,
  isLoading = false,
}: ProjectSelectionStepProps) {
  // Only show create form by default if projects are loaded and empty
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { mutateAsync: createProject } = useCreateProject();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
    }));
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Project name is required");
      return;
    }
    setIsCreating(true);
    try {
      const generatedId = generateDNSId(formData.name);
      const newProject = await createProject({
        id: generatedId,
        name: formData.name.trim(),
      });
      if (newProject) {
        toast.success("Project created successfully!");
        setFormData({ name: "" });
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
            {isLoading
              ? "Loading Projects..."
              : projects.length === 0
              ? "Create Your First Project"
              : "Select Project"}
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Please wait while we load your projects"
              : projects.length === 0
              ? "Start by creating a project to organize your resources"
              : "Choose an existing project or create a new one"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !showCreateForm && projects.length > 0 ? (
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
                <p className="text-sm text-muted-foreground mt-1">
                  A unique ID will be auto-generated.
                </p>
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
                      setFormData({ name: "" });
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
