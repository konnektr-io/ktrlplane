import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { ResourceTierCard } from "./ResourceTierCard";
import { resourceTypes } from "../catalog/resourceTypes";
import type { Resource } from "../types/resource.types";

interface ResourceTierChangeDialogProps {
  resource: Resource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (newSku: string) => Promise<void>;
}

export function ResourceTierChangeDialog({
  resource,
  open,
  onOpenChange,
  onConfirm,
}: ResourceTierChangeDialogProps) {
  const [selectedSku, setSelectedSku] = useState(resource.sku);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resourceType = resourceTypes.find((rt) => rt.id === resource.type);
  const currentTier = resourceType?.skus.find((t) => t.sku === resource.sku);
  const newTier = resourceType?.skus.find((t) => t.sku === selectedSku);
  const hasChanges = selectedSku !== resource.sku;

  const handleConfirm = async () => {
    if (!hasChanges) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(selectedSku);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tier");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!resourceType) {
    return null;
  }

  const isUpgrade =
    currentTier &&
    newTier &&
    currentTier.sku === "free" &&
    newTier.sku !== "free";
  const isDowngrade =
    currentTier &&
    newTier &&
    currentTier.sku !== "free" &&
    newTier.sku === "free";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Resource Tier</DialogTitle>
          <DialogDescription>
            Select a new tier for {resource.name}.{" "}
            {isUpgrade &&
              "Upgrading will provide additional resources and features."}
            {isDowngrade &&
              "Downgrading may limit available resources and features."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Tier Badge */}
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm font-medium">Current Tier</p>
            <p className="text-lg font-bold capitalize">
              {currentTier?.name || resource.sku}
            </p>
          </div>

          {/* Tier Selection */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Select New Tier</p>
            {resourceType.skus.map((tier) => (
              <ResourceTierCard
                key={tier.sku}
                tier={tier}
                resourceTypeId={resourceType.id}
                selected={selectedSku === tier.sku}
                onSelect={() => setSelectedSku(tier.sku)}
              />
            ))}
          </div>

          {/* Free Tier CTA */}
          {resource.sku === "free" && selectedSku !== "free" && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Upgrade to unlock premium features!</strong>
                <br />
                You're currently on the free tier. Upgrading gives you access to
                increased limits, priority support, and advanced features.
              </AlertDescription>
            </Alert>
          )}

          {/* Downgrade Warning */}
          {isDowngrade && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Warning: Resource limits will be reduced</strong>
                <br />
                Make sure your current usage fits within the new tier's limits
                to avoid service disruption.
              </AlertDescription>
            </Alert>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!hasChanges || isSubmitting}
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Updating..." : "Confirm Change"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
