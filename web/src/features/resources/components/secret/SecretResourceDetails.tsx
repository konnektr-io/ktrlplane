import { useState } from "react";
import { ProjectSecretViewer } from "@/features/projects/components/ProjectSecretViewer";
import type { Resource } from "../../types/resource.types";
import { SecretForm, SecretSettings } from "./SecretForm";
import { useProjectSecret, useCreateSecret, useUpdateSecret } from "@/features/projects/hooks/useProjectSecret";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface SecretResourceDetailsProps {
  resource: Resource;
}

export default function SecretResourceDetails({
  resource,
}: SecretResourceDetailsProps) {
  const { data: secretData, isLoading, error, refetch } = useProjectSecret(
    resource.project_id,
    resource.resource_id
  );
  const { mutateAsync: createSecret, isPending: isCreating } = useCreateSecret(
    resource.project_id
  );
  const { mutateAsync: updateSecret, isPending: isUpdating } = useUpdateSecret(
    resource.project_id
  );

  const isSaving = isCreating || isUpdating;

  const [activeTab, setActiveTab] = useState("overview");

  // Handle save (create or update)
  const handleSave = async (values: SecretSettings) => {
    try {
      if (secretData) {
        // Update existing
        await updateSecret({
            name: resource.resource_id,
            type: values.secretType,
            data: values.data,
        });
        toast.success("Secret updated successfully");
      } else {
        // Create new
        await createSecret({
            name: resource.resource_id,
            type: values.secretType,
            data: values.data,
        });
        toast.success("Secret created successfully");
      }
      
      refetch();
      setActiveTab("overview");
    } catch (error) {
      console.error("Failed to save secret:", error);
      toast.error("Failed to save secret");
    }
  };

  // If secret is missing (404), likely created without data. Show form to initialize.
  const isMissing = !isLoading && !secretData && error; 

  if (isLoading) {
    return <div className="flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading secret...</div>;
  }

  // If secret doesn't exist yet, show form to create it
  if (isMissing) {
    return (
        <div className="space-y-4">
            <div className="p-4 border rounded-md bg-yellow-50 text-yellow-800 dark:bg-yellow-900/10 dark:text-yellow-200">
                <h3 className="font-semibold">Secret Not Initialized</h3>
                <p className="text-sm">This resource exists but the underlying secret data has not been created yet.</p>
            </div>
            <SecretForm
                onSubmit={handleSave}
                disabled={isSaving}
            />
             {isSaving && <p className="text-sm text-muted-foreground">Saving...</p>}
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Values</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <ProjectSecretViewer
            projectId={resource.project_id}
            secretName={resource.resource_id}
            title="Secret Values"
            description="Manage and view the values for this secret."
          />
        </TabsContent>
        
        <TabsContent value="edit" className="mt-4">
             {secretData ? (
                 <SecretForm
                    initialValues={{
                        secretType: secretData.type,
                        // data in secretData is base64 encoded? ProjectSecretViewer handles decoding.
                        // We need to decode it for the form if we want to show existing values.
                        // BUT, decoding server-side secrets is sensitive. 
                        // ProjectSecretViewer fetches it. useProjectSecret returns it.
                        // Let's check useProjectSecret return type. It returns SecretData with base64 data.
                        data: Object.entries(secretData.data || {}).reduce((acc, [k, v]) => {
                            try {
                                acc[k] = atob(v);
                            } catch {
                                acc[k] = v; // Fallback
                            }
                            return acc;
                        }, {} as Record<string, string>)
                    }}
                    onSubmit={handleSave}
                    submitMode="manual"
                    disabled={isSaving}
                 />
             ) : (
                 <p>Unable to load secret data for editing.</p>
             )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
