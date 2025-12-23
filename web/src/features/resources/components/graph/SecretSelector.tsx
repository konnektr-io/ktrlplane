import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Key } from "lucide-react";
import { SecretForm, SecretSettings } from "../secret/SecretForm";
import { useResources, useCreateResource } from "../../hooks/useResourceApi";
import { getSecretType } from "../../types/secretTypes";
import { toast } from "sonner";

interface SecretSelectorProps {
  projectId: string;
  value?: string; // The secret reference in format "secretName/keyName"
  onChange: (secretReference: string) => void;
  label?: string;
  description?: string;
  suggestedSecretType?: string; // Suggest a specific secret type for this field
}

export function SecretSelector({
  projectId,
  value,
  onChange,
  label = "Authentication Secret",
  description = "Select an existing secret or create a new one",
  suggestedSecretType,
}: SecretSelectorProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newSecretName, setNewSecretName] = useState("");
  const [newSecretData, setNewSecretData] = useState<SecretSettings>({
    secretType: suggestedSecretType || "generic",
    data: {},
  });

  // Fetch secrets from the project
  const { data: allResources = [], refetch } = useResources(projectId);
  const createResourceMutation = useCreateResource(projectId);

  const secrets = useMemo(
    () => allResources.filter((r) => r.type === "Konnektr.Secret"),
    [allResources]
  );

  // Parse current value (format: "secretName/keyName")
  const [selectedSecret, selectedKey] = value?.split("/") || [undefined, undefined];

  // Get keys for selected secret
  const currentSecret = secrets.find((s) => s.name === selectedSecret);
  const availableKeys = currentSecret?.settings_json?.data
    ? Object.keys(currentSecret.settings_json.data)
    : [];

  const handleCreateSecret = async () => {
    if (!newSecretName.trim()) {
      toast.error("Secret name is required");
      return;
    }

    try {
      // Generate a unique resource ID from the name
      const resourceId = newSecretName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "");

      await createResourceMutation.mutateAsync({
        id: resourceId,
        name: newSecretName,
        type: "Konnektr.Secret",
        sku: "standard",
        settings_json: newSecretData as Record<string, unknown>,
      });

      toast.success("Secret created successfully");
      refetch();

      // Auto-select the first key from the new secret
      const firstKey = Object.keys(newSecretData.data)[0];
      if (firstKey) {
        onChange(`${newSecretName}/${firstKey}`);
      }

      setShowCreateDialog(false);
      setNewSecretName("");
      setNewSecretData({
        secretType: suggestedSecretType || "generic",
        data: {},
      });
    } catch (error) {
      toast.error("Failed to create secret");
      console.error(error);
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        {/* Secret Selection */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          <Select
            value={selectedSecret}
            onValueChange={(secretName) => {
              // When secret changes, try to auto-select a key
              const secret = secrets.find((s) => s.name === secretName);
              const keys = secret?.settings_json?.data ? Object.keys(secret.settings_json.data) : [];
              const firstKey = keys[0];
              onChange(firstKey ? `${secretName}/${firstKey}` : secretName);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select secret..." />
            </SelectTrigger>
            <SelectContent>
              {secrets.length === 0 && (
                <SelectItem value="" disabled>
                  No secrets available
                </SelectItem>
              )}
              {secrets.map((secret) => {
                const secretTypeDef = getSecretType(secret.settings_json?.secretType || "generic");
                return (
                  <SelectItem key={secret.resource_id} value={secret.name}>
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <div>
                        <div>{secret.name}</div>
                        {secretTypeDef && (
                          <div className="text-xs text-muted-foreground">
                            {secretTypeDef.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Key Selection */}
          <Select
            value={selectedKey}
            onValueChange={(key) => {
              if (selectedSecret) {
                onChange(`${selectedSecret}/${key}`);
              }
            }}
            disabled={!selectedSecret || availableKeys.length === 0}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select key..." />
            </SelectTrigger>
            <SelectContent>
              {availableKeys.map((key) => (
                <SelectItem key={key} value={key}>
                  {key}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowCreateDialog(true)}
          title="Create new secret"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
      {value && (
        <p className="text-xs text-muted-foreground">
          Reference: <code className="bg-muted px-1 py-0.5 rounded">{value}</code>
        </p>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Secret</DialogTitle>
            <DialogDescription>
              Create a new secret to store authentication credentials for this
              sink.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret-name">Secret Name *</Label>
              <Input
                id="secret-name"
                placeholder="e.g., kafka-prod-credentials"
                value={newSecretName}
                onChange={(e) => setNewSecretName(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                This name will be used to reference the secret
              </p>
            </div>

            <SecretForm
              initialValues={newSecretData}
              onChange={setNewSecretData}
              submitMode="manual"
              hideSaveButton
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSecret}
              disabled={!newSecretName.trim() || createResourceMutation.status === "pending"}
            >
              {createResourceMutation.status === "pending" ? "Creating..." : "Create Secret"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
