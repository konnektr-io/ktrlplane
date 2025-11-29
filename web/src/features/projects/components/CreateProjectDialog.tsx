import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";
import { generateDNSId, validateDNSId, slugify } from "@/lib/dnsUtils";
import { useCreateProject, useProjects } from "../hooks/useProjectApi";

export default function CreateProjectDialog({
  trigger,
  onCreated,
}: {
  trigger?: React.ReactNode;
  onCreated?: (newProjectId: string) => void;
}) {
  const { mutateAsync: createProject } = useCreateProject();
  const { refetch: fetchProjects } = useProjects();
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
        setIsDialogOpen(false);
        setFormData({ id: "", name: "", description: "" });
        await fetchProjects();
        if (onCreated) onCreated(newProject.project_id);
      }
    } catch {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Project
          </Button>
        )}
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
