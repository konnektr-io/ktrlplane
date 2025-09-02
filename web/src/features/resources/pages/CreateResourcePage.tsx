import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useResourceStore } from '../store/resourceStore';
import { ResourceSettingsForm } from '../components/ResourceSettingsForm';
import { defaultConfigurations } from '@/lib/resourceSchemas';
import { Database, Workflow, ArrowLeft } from 'lucide-react';

const resourceTypes = [
  { 
    value: 'Konnektr.DigitalTwins', 
    label: 'Digital Twins', 
    description: 'Age Graph Database for storing and querying digital twin data with event processing',
    icon: Database
  },
  { 
    value: 'Konnektr.Flows', 
    label: 'Flows', 
    description: 'Process flows and workflows with configurable scaling and environment variables',
    icon: Workflow
  },
];

export default function CreateResourcePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { createResource } = useResourceStore();
  
  const [step, setStep] = useState<'basic' | 'configuration'>('basic');
  const [isCreating, setIsCreating] = useState(false);
  const [basicData, setBasicData] = useState({
    name: '',
    type: '',
  });

  const handleBasicSubmit = () => {
    if (!basicData.name.trim() || !basicData.type) {
      toast.error('Name and type are required');
      return;
    }
    setStep('configuration');
  };

  const handleConfigurationSubmit = async (configuration: any) => {
    if (!projectId) return;

    setIsCreating(true);
    try {
      const newResource = await createResource(projectId, {
        name: basicData.name.trim(),
        type: basicData.type as 'Konnektr.DigitalTwins' | 'Konnektr.Flows',
        settings_json: configuration,
      });

      if (newResource) {
        toast.success('Resource created successfully!');
        navigate(`/projects/${projectId}/resources/${newResource.resource_id}`);
      }
    } catch (error) {
      console.error('Failed to create resource:', error);
      toast.error('Failed to create resource');
    } finally {
      setIsCreating(false);
    }
  };

  const selectedResourceType = resourceTypes.find(rt => rt.value === basicData.type);

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (step === 'configuration') {
                setStep('basic');
              } else {
                navigate(`/projects/${projectId}/resources`);
              }
            }}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {step === 'configuration' ? 'Back to Basic Info' : 'Back to Resources'}
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Create New Resource</h1>
        <p className="text-muted-foreground">
          {step === 'basic' 
            ? 'Choose a resource type and provide basic information'
            : 'Configure your resource settings for deployment'
          }
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step === 'basic' ? 'text-primary' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            step === 'basic' ? 'border-primary bg-primary text-primary-foreground' : 'border-green-600 bg-green-600 text-white'
          }`}>
            1
          </div>
          <span className="ml-2 font-medium">Basic Information</span>
        </div>
        <div className={`flex-1 h-0.5 mx-4 ${step === 'configuration' ? 'bg-primary' : 'bg-muted'}`} />
        <div className={`flex items-center ${step === 'configuration' ? 'text-primary' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            step === 'configuration' ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'
          }`}>
            2
          </div>
          <span className="ml-2 font-medium">Configuration</span>
        </div>
      </div>

      {/* Step Content */}
      {step === 'basic' && (
        <div className="space-y-6">
          {/* Resource Name */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Name</CardTitle>
              <CardDescription>
                Choose a unique name for your resource
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  type="text"
                  value={basicData.name}
                  onChange={(e) => setBasicData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., production-digital-twins"
                  className="w-full"
                />
                <p className="text-sm text-muted-foreground">
                  Use lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Resource Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Type</CardTitle>
              <CardDescription>
                Select the type of resource you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {resourceTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <Card
                      key={type.value}
                      className={`cursor-pointer transition-colors hover:bg-accent ${
                        basicData.type === type.value ? 'ring-2 ring-primary' : ''
                      }`}
                      onClick={() => setBasicData(prev => ({ ...prev, type: type.value }))}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <input
                              type="radio"
                              name="resourceType"
                              value={type.value}
                              checked={basicData.type === type.value}
                              onChange={() => setBasicData(prev => ({ ...prev, type: type.value }))}
                              className="h-4 w-4"
                            />
                          </div>
                          <IconComponent className="h-6 w-6 text-primary mt-1" />
                          <div className="flex-1">
                            <h4 className="font-medium text-lg">{type.label}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {type.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={handleBasicSubmit}
              disabled={!basicData.name.trim() || !basicData.type}
              className="flex-1"
            >
              Continue to Configuration
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate(`/projects/${projectId}/resources`)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {step === 'configuration' && selectedResourceType && (
        <div className="space-y-6">
          {/* Configuration Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <selectedResourceType.icon className="h-5 w-5" />
                Configure {selectedResourceType.label}
              </CardTitle>
              <CardDescription>
                <span className="font-medium">Resource:</span> {basicData.name}
                <br />
                {selectedResourceType.description}
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Configuration Form */}
          <ResourceSettingsForm
            resourceType={basicData.type}
            initialValues={defaultConfigurations[basicData.type as keyof typeof defaultConfigurations]}
            onSubmit={handleConfigurationSubmit}
            disabled={isCreating}
          />

          {/* Cancel Action */}
          <div className="flex justify-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setStep('basic')}
              disabled={isCreating}
            >
              Back to Basic Information
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
