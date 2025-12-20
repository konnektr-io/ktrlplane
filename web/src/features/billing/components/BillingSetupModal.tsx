import { useState, useEffect, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import {
  useSetupStripeCustomer,
  useCreateSetupIntent,
} from "../hooks/useBillingApi";

interface UnifiedBillingSetupModalProps {
  open: boolean;
  onClose: () => void;
  scopeType: "organization" | "project";
  scopeId: string;
  onComplete?: () => void;
}

type SetupStep = "creating" | "payment" | "done" | "error";

// Stripe publishable key from env
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

export function UnifiedBillingSetupModal({
  open,
  onClose,
  scopeType,
  scopeId,
  onComplete,
}: UnifiedBillingSetupModalProps) {
  const [step, setStep] = useState<SetupStep>("creating");
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const setupStripeCustomer = useSetupStripeCustomer(scopeType, scopeId);
  const createSetupIntent = useCreateSetupIntent(scopeType, scopeId);

  const handleSetup = useCallback(async () => {
    setError(null);
    setStep("creating");

    try {
      // Step 1: Create Stripe customer (uses Auth0 user info from token)
      await setupStripeCustomer.mutateAsync({
        description: `${scopeType} ${scopeId}`,
      });

      // Step 2: Get SetupIntent for payment method
      const secret = await createSetupIntent.mutateAsync();
      setClientSecret(secret);
      setStep("payment");
    } catch (err) {
      console.error("Failed to setup billing:", err);
      setError("Failed to setup billing. Please try again.");
      setStep("error");
    }
  }, [createSetupIntent, scopeId, scopeType, setupStripeCustomer]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("creating");
      setError(null);
      setClientSecret(null);
      // Start the setup process immediately
      handleSetup();
    }
  }, [open, handleSetup]);

  const handlePaymentSuccess = () => {
    setStep("done");
    if (onComplete) {
      onComplete();
    }
  };

  const handleSkipPayment = () => {
    // Allow user to skip payment for now and add later
    setStep("done");
    if (onComplete) {
      onComplete();
    }
  };

  const handleRetry = () => {
    handleSetup();
  };

  const handleCloseModal = () => {
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "creating" && "Setting Up Billing..."}
            {step === "payment" && "Add Payment Method"}
            {step === "done" && "Setup Complete"}
            {step === "error" && "Setup Failed"}
          </DialogTitle>
          <DialogDescription>
            {step === "creating" &&
              "Please wait while we set up your billing account and subscription."}
            {step === "payment" &&
              "Add a payment method to enable paid resources."}
            {step === "done" && "Your billing account is ready to use."}
            {step === "error" &&
              "There was an error setting up your billing account."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Step: Creating */}
          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-center">
                Creating billing account and subscription...
              </p>
              <p className="text-xs text-muted-foreground text-center mt-2">
                This will only take a moment
              </p>
            </div>
          )}

          {/* Step: Payment Method */}
          {step === "payment" &&
            (!stripePromise ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-md max-w-sm">
                  <p className="font-medium">Stripe Configuration Missing</p>
                  <p className="text-sm mt-1">
                    Unable to load payment form. Verification key is missing.
                  </p>
                </div>
                <Button onClick={handleSkipPayment} variant="outline">
                  Skip for Now
                </Button>
              </div>
            ) : clientSecret ? (
              <div className="space-y-4 py-2 px-0 overflow-x-hidden">
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <PaymentForm
                    onSuccess={handlePaymentSuccess}
                    onSkip={handleSkipPayment}
                  />
                </Elements>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">
                  Preparing payment form...
                </p>
              </div>
            ))}

          {/* Step: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                Billing setup complete!
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                You can now create paid resources
              </p>
            </div>
          )}

          {/* Step: Error */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <AlertTriangle className="h-12 w-12 text-red-500 mb-2" />
              <p className="text-red-600 dark:text-red-400 font-medium text-center">
                {error || "Failed to setup billing"}
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Please try again or contact support if the problem persists
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {step === "done" && <Button onClick={handleCloseModal}>Close</Button>}
          {step === "error" && (
            <>
              <Button variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Inline payment form component
function PaymentForm({
  onSuccess,
  onSkip,
}: {
  onSuccess: () => void;
  onSkip: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!stripe || !elements) {
      setError("Stripe.js not loaded");
      setLoading(false);
      return;
    }

    // Use redirect: 'if_required' to avoid redirect when not needed
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message || "Failed to add payment method");
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          disabled={loading}
          className="flex-1"
        >
          Skip for Now
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Processing...
            </>
          ) : (
            "Add Payment Method"
          )}
        </Button>
      </div>
    </form>
  );
}
