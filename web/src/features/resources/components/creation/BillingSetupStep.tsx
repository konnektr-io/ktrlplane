import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BillingSetupStepProps {
  projectId: string;
  resourceType: string;
  sku: string;
  tierName?: string;
  tierPrice?: string;
  onSetupBilling: () => void;
  isLoading?: boolean;
}

export function BillingSetupStep({
  resourceType,
  sku,
  tierName,
  tierPrice,
  onSetupBilling,
  isLoading,
}: BillingSetupStepProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Billing Setup Required</CardTitle>
          <CardDescription>
            This resource requires a billing account to proceed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Selected Resource
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Type:</span> {resourceType}
            </p>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <span className="font-medium">Tier:</span> {tierName || sku}
            </p>
            {tierPrice && (
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <span className="font-medium">Price:</span> {tierPrice}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              To create paid resources, you need to set up a billing account
              with a valid payment method. This will allow you to:
            </p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
              <li>Create and manage paid resources</li>
              <li>Access premium features and higher limits</li>
              <li>Manage subscriptions and billing from one place</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button
              onClick={onSetupBilling}
              disabled={isLoading}
              size="lg"
              className="w-full"
            >
              {isLoading ? "Setting up..." : "Setup Billing Account"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            You will be able to manage your billing settings and payment methods
            after setup.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
