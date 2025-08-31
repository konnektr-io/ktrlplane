import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResourceStore } from '../store/resourceStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Database, Server, Globe, FileText, Filter } from 'lucide-react';
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
    settings_json: '{}' 
  });
  const [isCreating, setIsCreating] = useState(false);
  const [filter, setFilter] = useState("");

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
  settings_json: JSON.parse(formData.settings_json),
      });

      if (newResource) {
        toast.success('Resource created successfully!');
        setIsDialogOpen(false);
  setFormData({ name: '', type: '', settings_json: '{}' });
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

  // Filtering logic
  const filteredResources = filter
    ? resources.filter(r =>
        (r.name || '').toLowerCase().includes(filter.toLowerCase()) ||
        (r.type || '').toLowerCase().includes(filter.toLowerCase())
      )
    : resources;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Resources ({resources.length})</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter resources..."
                  className="input input-sm border rounded px-2 py-1 text-sm w-48 pl-8"
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                  style={{ minWidth: 0 }}
                />
                <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
          </div>
          <CardDescription>Manage cloud resources in this project</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-24"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No resources found. Create your first resource!
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredResources.map((resource) => {
                    const IconComponent = resourceTypeIcons[resource.type as keyof typeof resourceTypeIcons] || Server;
                    return (
                      <TableRow key={resource.resource_id} className="hover:bg-muted/50 cursor-pointer border-b last:border-b-0" onClick={() => navigate(`/projects/${projectId}/resources/${resource.resource_id}`)}>
                        <TableCell className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-primary" />
                          <span className="font-medium">{resource.name}</span>
                        </TableCell>
                        <TableCell>{resource.type}</TableCell>
                        <TableCell>
                          <Badge variant={resource.status === 'Active' ? 'default' : 'secondary'}>
                            {resource.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{resource.created_at.toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={e => { e.stopPropagation(); navigate(`/projects/${projectId}/resources/${resource.resource_id}`); }}
                          >
                            Configure
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
