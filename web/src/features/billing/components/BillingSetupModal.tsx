import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2 } from "lucide-react";
import {
  useSetupStripeCustomer,
  useCreateSubscription,
  useCreateSetupIntent,
} from "../hooks/useBillingApi";

interface BillingSetupModalProps {
  open: boolean;
  onClose: () => void;
  scopeType: "organization" | "project";
  scopeId: string;
  onBillingSetupComplete?: () => void;
}

type SetupStep = "info" | "creating" | "payment" | "done";

// Stripe publishable key from env
const STRIPE_PUBLISHABLE_KEY =
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null;

export function BillingSetupModal({
  open,
  onClose,
  scopeType,
  scopeId,
  onBillingSetupComplete,
}: BillingSetupModalProps) {
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [step, setStep] = useState<SetupStep>("info");
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const setupStripeCustomer = useSetupStripeCustomer(scopeType, scopeId);
  const createSubscription = useCreateSubscription(scopeType, scopeId);
  const createSetupIntent = useCreateSetupIntent(scopeType, scopeId);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep("info");
      setError(null);
      setClientSecret(null);
    }
  }, [open]);

  const handleCreateCustomer = async () => {
    setError(null);
    setStep("creating");
    try {
      // Create Stripe customer
      await setupStripeCustomer.mutateAsync({
        email: customerEmail,
        name: customerName,
        description: `${scopeType} ${scopeId}`,
      });

      // Create subscription
      await createSubscription.mutateAsync();

      // Get SetupIntent for payment method
      const secret = await createSetupIntent.mutateAsync();
      setClientSecret(secret);
      setStep("payment");
    } catch (err) {
      console.error("Failed to setup billing:", err);
      setError("Failed to setup billing. Please try again.");
      setStep("info");
    }
  };

  const handlePaymentSuccess = () => {
    setStep("done");
    if (onBillingSetupComplete) {
      onBillingSetupComplete();
    }
  };

  const handleSkipPayment = () => {
    // Allow user to skip payment for now and add later
    setStep("done");
    if (onBillingSetupComplete) {
      onBillingSetupComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === "info" && "Setup Billing Account"}
            {step === "creating" && "Setting Up..."}
            {step === "payment" && "Add Payment Method"}
            {step === "done" && "Setup Complete"}
          </DialogTitle>
          <DialogDescription>
            {step === "info" &&
              `Enter your billing information to create a billing account for this ${scopeType}.`}
            {step === "creating" && "Please wait while we set up your account."}
            {step === "payment" &&
              "Add a payment method to enable paid resources."}
            {step === "done" && "Your billing account is ready to use."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-1">
          {/* Step 1: Customer Info */}
          {step === "info" && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="customer-name">Customer Name *</Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer-email">Billing Email *</Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="billing@example.com"
                />
              </div>
              {error && <div className="text-red-500 text-sm">{error}</div>}
            </div>
          )}

          {/* Step 2: Creating */}
          {step === "creating" && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Creating your billing account...</p>
            </div>
          )}

          {/* Step 3: Payment Method */}
          {step === "payment" && (
            !stripePromise ? (
               <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                  <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 p-4 rounded-md max-w-sm">
                    <p className="font-medium">Stripe Configuration Missing</p>
                    <p className="text-sm mt-1">Unable to load payment form. verification key is missing.</p>
                  </div>
                  <Button onClick={handleSkipPayment} variant="outline">Skip for Now</Button>
               </div>
            ) : clientSecret && (
            <div className="space-y-4 py-2">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm
                  onSuccess={handlePaymentSuccess}
                  onSkip={handleSkipPayment}
                />
              </Elements>
            </div>
            )
          )}

          {/* Step 4: Done */}
          {step === "done" && (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-green-600 font-medium">
                Billing setup complete!
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          {step === "info" && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateCustomer}
                disabled={
                  !customerName ||
                  !customerEmail ||
                  setupStripeCustomer.isPending
                }
              >
                Continue
              </Button>
            </>
          )}
          {step === "done" && (
            <Button onClick={onClose}>Close</Button>
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
      <p className="text-xs text-muted-foreground text-center">
        You can add a payment method later from the billing page.
      </p>
    </form>
  );
}

