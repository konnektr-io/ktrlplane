import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  useSetupStripeCustomer,
  useCreateSubscription,
} from "../hooks/useBillingApi";

interface BillingSetupModalProps {
  open: boolean;
  onClose: () => void;
  scopeType: "organization" | "project";
  scopeId: string;
  onBillingSetupComplete?: () => void;
}

export function BillingSetupModal({
  open,
  onClose,
  scopeType,
  scopeId,
  onBillingSetupComplete,
}: BillingSetupModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [step, setStep] = useState<"info" | "subscribing" | "done">("info");
  const [error, setError] = useState<string | null>(null);
  const setupStripeCustomer = useSetupStripeCustomer(scopeType, scopeId);
  const createSubscription = useCreateSubscription(scopeType, scopeId);

  const handleSetup = async () => {
    setError(null);
    try {
      await setupStripeCustomer.mutateAsync({
        email: customerEmail,
        name: customerName,
        description: `${scopeType} ${scopeId}`,
      });
      setStep("subscribing");
      await createSubscription.mutateAsync();
      setStep("done");
      if (onBillingSetupComplete) onBillingSetupComplete();
    } catch {
      setError("Failed to setup billing. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Setup Billing Account</DialogTitle>
          <DialogDescription>
            Enter your billing information to create a Stripe customer and
            subscription for this {scopeType}.
          </DialogDescription>
        </DialogHeader>
        {step === "info" && (
          <div className="space-y-4">
            <Input
              id="customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name"
              className="w-full"
            />
            <Input
              id="customer-email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Customer Email"
              className="w-full"
            />
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
        )}
        {step === "subscribing" && (
          <div className="p-4 text-center">Creating subscription...</div>
        )}
        {step === "done" && (
          <div className="p-4 text-center text-green-600">
            Billing setup complete!
          </div>
        )}
        <DialogFooter>
          {step === "info" && (
            <Button
              onClick={handleSetup}
              disabled={
                !customerName ||
                !customerEmail ||
                setupStripeCustomer.isPending ||
                createSubscription.isPending
              }
            >
              {setupStripeCustomer.isPending || createSubscription.isPending
                ? "Setting up..."
                : "Setup Billing"}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
