import { Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResourceTierCard } from "../ResourceTierCard";
import { validateDNSId } from "@/lib/dnsUtils";
import type { ResourceType } from "../../catalog/resourceTypes";

interface TierSelectionStepProps {
  resourceType: ResourceType | undefined;
  resourceName: string;
  resourceId: string;
  selectedSku: string;
  onNameChange: (name: string) => void;
  onIdChange: (id: string) => void;
  onSkuSelect: (sku: string) => void;
  preselectedSku?: string | null;
}

export function TierSelectionStep({
  resourceType,
  resourceName,
  resourceId,
  selectedSku,
  onNameChange,
  onIdChange,
  onSkuSelect,
  preselectedSku,
}: TierSelectionStepProps) {
  return (
    <div className="space-y-6">
      {/* Resource Information */}
      <Card>
        <CardHeader>
          <CardTitle>Resource Information</CardTitle>
          <CardDescription>
            Choose a unique name and provide basic details for your{" "}
            {resourceType?.name || "resource"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                type="text"
                value={resourceName}
                onChange={(e) => onNameChange(e.target.value)}
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
                value={resourceId}
                onChange={(e) => onIdChange(e.target.value)}
                placeholder="e.g., production-digital-twins-4f2a"
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Leave empty to auto-generate.
              </p>
              {resourceId && validateDNSId(resourceId) && (
                <p className="text-sm text-red-500">
                  {validateDNSId(resourceId)}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Tier</CardTitle>
          <CardDescription>
            Choose the plan that fits your needs
            {preselectedSku && (
              <span className="block mt-2 text-blue-800 dark:text-blue-400">
                Pre-selected: {preselectedSku}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resourceType && resourceType.skus.length > 0 ? (
            <div className="grid gap-6">
              {resourceType.skus.map((tier) => (
                <ResourceTierCard
                  key={tier.sku}
                  tier={tier}
                  resourceTypeId={resourceType.id}
                  selected={selectedSku === tier.sku}
                  onSelect={() => onSkuSelect(tier.sku)}
                />
              ))}
            </div>
          ) : (
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
    </div>
  );
}
