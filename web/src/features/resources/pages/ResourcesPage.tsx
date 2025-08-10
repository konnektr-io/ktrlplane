import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResourceStore } from '../store/resourceStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Database, Server, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

const resourceTypeIcons = {
  'Database': Database,
  'API': Server,
  'Website': Globe,
  'Service': Server,
  'Storage': FileText,
} as const;

const resourceTypes = [
  { value: 'Konnektr.DigitalTwins', label: 'Digital Twins' },
  { value: 'Konnektr.Flows', label: 'Flows' },
];

export default function ResourcesPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { resources, isLoading, fetchResources, createResource, error } = useResourceStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    type: '', 
    helm_values: '{}' 
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (projectId) {
      fetchResources(projectId);
    }
  }, [projectId, fetchResources]);

  const handleCreateResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.type) {
      toast.error('Name and type are required');
      return;
    }

    if (!projectId) return;

    setIsCreating(true);
    try {
      const newResource = await createResource(projectId, {
        name: formData.name.trim(),
        type: formData.type as 'Konnektr.DigitalTwins' | 'Konnektr.Flows',
        helm_values: JSON.parse(formData.helm_values),
      });

      if (newResource) {
        toast.success('Resource created successfully!');
        setIsDialogOpen(false);
        setFormData({ name: '', type: '', helm_values: '{}' });
        fetchResources(projectId);
      }
    } catch (error) {
      toast.error('Failed to create resource');
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return <div>Loading resources...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Resources</h1>
          <p className="text-muted-foreground">Manage cloud resources in this project</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Resource
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Resource</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateResource} className="space-y-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter resource name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Resource'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {resources.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-muted-foreground">No resources found. Create your first resource!</p>
          </div>
        ) : (
          resources.map((resource) => {
            const IconComponent = resourceTypeIcons[resource.type as keyof typeof resourceTypeIcons] || Server;
            return (
              <Card key={resource.resource_id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{resource.name}</CardTitle>
                  </div>
                  <CardDescription>
                    {resource.type} • Created {resource.created_at.toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant={resource.status === 'Active' ? 'default' : 'secondary'}>
                      {resource.status}
                    </Badge>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/project/${projectId}/resources/${resource.resource_id}`)}
                    >
                      Configure
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
