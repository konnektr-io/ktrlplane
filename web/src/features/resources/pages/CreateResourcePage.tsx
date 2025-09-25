import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useResourceStore } from '../store/resourceStore';
import { ResourceSettingsForm } from '../components/ResourceSettingsForm';
import { defaultConfigurations } from '@/lib/resourceSchemas';
import { Database, Workflow, ArrowLeft, Check } from 'lucide-react';
import { generateDNSId, validateDNSId, slugify } from '@/lib/dnsUtils';
import { resourceTypes as catalogResourceTypes } from '@/features/catalog/resourceTypes';

const resourceTypes = [
  {
    value: "Konnektr.Graph",
    label: "Graph",
    description:
      "High-performance graph database and API layer for digital twin data and event processing.",
    icon: Database,
  },
  {
    value: "Konnektr.Flow",
    label: "Flow",
    description:
      "Real-time data and event processing engine for digital twins and automation.",
    icon: Workflow,
  },
  {
    value: "Konnektr.Assembler",
    label: "Assembler",
    description:
      "AI-powered digital twin builder for automated model generation.",
    icon: Database,
  },
  {
    value: "Konnektr.Compass",
    label: "Compass",
    description:
      "Navigation and discovery tool for digital twin analytics and simulation.",
    icon: Database,
  },
];

export default function CreateResourcePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { createResource } = useResourceStore();
  
  // Get the resource type from URL - it should always be provided now
  const preselectedResourceType = searchParams.get('resourceType');
  const isFromCatalog = searchParams.get('from') === 'catalog';
  
  // If no resource type is provided, redirect to catalog
  useEffect(() => {
    if (!preselectedResourceType) {
      navigate('/catalog');
      return;
    }
  }, [preselectedResourceType, navigate]);

  // Start with tier selection if resource type is pre-selected, otherwise basic info
  const [step, setStep] = useState<'tier' | 'configuration'>(
    preselectedResourceType ? 'tier' : 'tier'
  );
  const [isCreating, setIsCreating] = useState(false);
  const [basicData, setBasicData] = useState({
    id: '',
    name: '',
    type: preselectedResourceType || '',
    sku: 'free', // Default to free tier
  });

  // Pre-select resource type and first available SKU from URL parameters
  useEffect(() => {
    if (preselectedResourceType && resourceTypes.find(rt => rt.value === preselectedResourceType)) {
      setBasicData(prev => ({ ...prev, type: preselectedResourceType }));
      
      // Auto-select first available SKU for this resource type
      const catalogType = catalogResourceTypes.find(rt => rt.id === preselectedResourceType);
      if (catalogType && catalogType.skus.length > 0) {
        setBasicData(prev => ({ ...prev, sku: catalogType.skus[0].sku }));
      }
    }
  }, [preselectedResourceType]);

  const handleNameChange = (name: string) => {
    setBasicData(prev => ({ 
      ...prev, 
      name,
      // Auto-generate ID from name if ID is empty or was auto-generated
      id: prev.id === '' || prev.id === slugify(prev.name) + '-' + prev.id.slice(-4) 
          ? generateDNSId(name) 
          : prev.id
    }));
  };

  const handleConfigurationSubmit = async (configuration: any) => {
    if (!projectId) return;

    setIsCreating(true);
    try {
      const newResource = await createResource(projectId, {
        id: basicData.id.trim(),
        name: basicData.name.trim(),
        type: basicData.type as 'Konnektr.DigitalTwins' | 'Konnektr.Flows',
        sku: basicData.sku, // Include SKU in the resource creation
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
  const selectedCatalogType = catalogResourceTypes.find(rt => rt.id === basicData.type);
  
  const getBackButtonText = () => {
    if (step === 'configuration') {
      return 'Back to Tier Selection';
    } else {
      return 'Back to Resources';
    }
  };

  const handleBackClick = () => {
    if (step === 'configuration') {
      setStep('tier');
    } else {
      navigate(`/projects/${projectId}/resources`);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {getBackButtonText()}
          </Button>
        </div>
        <h1 className="text-2xl font-bold">Create New Resource</h1>
        <p className="text-muted-foreground">
          {step === 'tier'
            ? 'Select a tier that fits your needs'
            : 'Configure your resource settings for deployment'
          }
        </p>
        {/* Show helpful message if coming from catalog */}
        {selectedResourceType && (
          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <span className="font-medium">From Catalog:</span> {selectedResourceType.label} pre-selected
            </p>
          </div>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step === 'tier' ? 'text-primary' : 'text-green-600'}`}>
          <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
            step === 'tier' ? 'border-primary bg-primary text-primary-foreground' : 'border-green-600 bg-green-600 text-white'
          }`}>
            {step === 'tier' ? '1' : <Check className="h-4 w-4" />}
          </div>
          <span className="ml-2 font-medium">Select Tier & Basic Info</span>
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
      {step === 'tier' && (
        <div className="space-y-6">
          {/* Resource Information */}
          <Card>
            <CardHeader>
              <CardTitle>Resource Information</CardTitle>
              <CardDescription>
                Choose a unique name and provide basic details for your {preselectedResourceType}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={basicData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g., production-digital-twins"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Display name for your resource
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id">ID *</Label>
                  <Input
                    id="id"
                    type="text"
                    value={basicData.id}
                    onChange={(e) => setBasicData(prev => ({ ...prev, id: e.target.value }))}
                    placeholder="e.g., production-digital-twins-4f2a"
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground">
                    Used for Kubernetes resources and DNS. Auto-generated from name but can be edited.
                  </p>
                  {basicData.id && validateDNSId(basicData.id) && (
                    <p className="text-sm text-red-500">
                      {validateDNSId(basicData.id)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tier Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {selectedResourceType && <selectedResourceType.icon className="h-5 w-5" />}
                Select {preselectedResourceType} Tier
              </CardTitle>
              <CardDescription>
                Choose the tier that best fits your needs. You can upgrade or downgrade at any time.
                {isFromCatalog && (
                  <>
                    <br />
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-50 text-blue-800 text-xs rounded-md">
                      📋 From Catalog: Review pricing and features below
                    </span>
                  </>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tier Options */}
              {selectedCatalogType ? (
                <div className="grid gap-6">
                  {selectedCatalogType.skus.map((tier) => (
                    <Card
                      key={tier.sku}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        basicData.sku === tier.sku 
                          ? 'ring-2 ring-primary shadow-md scale-[1.02]' 
                          : 'hover:bg-accent/50'
                      }`}
                      onClick={() => setBasicData(prev => ({ ...prev, sku: tier.sku }))}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="mt-1">
                            <input
                              type="radio"
                              name="resourceTier"
                              value={tier.sku}
                              checked={basicData.sku === tier.sku}
                              onChange={() => setBasicData(prev => ({ ...prev, sku: tier.sku }))}
                              className="h-4 w-4"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-bold text-xl text-foreground">{tier.name}</h4>
                              <div className="text-right">
                                <span className="text-2xl font-bold text-primary">{tier.price}</span>
                                {tier.price !== '$0/mo' && (
                                  <p className="text-xs text-muted-foreground">per month</p>
                                )}
                              </div>
                            </div>
                            <ul className="space-y-2 mb-4">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-600 flex-shrink-0" />
                                  <span>{feature}</span>
                                </li>
                              ))}
                            </ul>
                            {Object.entries(tier.limits).length > 0 && (
                              <div className="border-t pt-3">
                                <p className="text-sm font-medium mb-2">Resource Limits:</p>
                                <div className="grid grid-cols-2 gap-2">
                                  {Object.entries(tier.limits).map(([key, value]) => (
                                    <div key={key} className="text-xs text-muted-foreground">
                                      <span className="font-medium">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                /* Fallback for resource types without catalog definition */
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">
                    This resource type uses the free tier by default.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Free tier selected</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={() => setStep('configuration')}
              disabled={!basicData.name.trim() || !basicData.id.trim() || (selectedCatalogType && selectedCatalogType.skus.length > 0 && !basicData.sku)}
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
                <span className="font-medium">Tier:</span> {selectedCatalogType?.skus.find(s => s.sku === basicData.sku)?.name || basicData.sku}
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
              onClick={() => setStep('tier')}
              disabled={isCreating}
            >
              Back to Tier Selection
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
