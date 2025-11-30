import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

interface AddPaymentMethodModalProps {
  stripePromise: Promise<Stripe | null>;
  createSetupIntent: { mutateAsync: () => Promise<string> };
  onClose: () => void;
}

export function AddPaymentMethodModal({
  stripePromise,
  createSetupIntent,
  onClose,
}: AddPaymentMethodModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchSetupIntent() {
      try {
        const secret = await createSetupIntent.mutateAsync();
        setClientSecret(secret);
      } catch {
        setError("Failed to create SetupIntent. Please try again.");
      }
    }
    fetchSetupIntent();
  }, [createSetupIntent]);

  if (!clientSecret) {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md text-center">
          <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
          <p className="mb-4">Preparing payment form...</p>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Payment Method</h2>
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePaymentForm onSuccess={() => setSuccess(true)} />
        </Elements>
        {success && (
          <div className="mt-4 text-green-600 font-medium">
            Payment method added successfully!
          </div>
        )}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

function StripePaymentForm({ onSuccess }: { onSuccess: () => void }) {
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
    const result = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
    });
    if (result.error) {
      setError(result.error.message || "Failed to add payment method");
    } else {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <div className="text-red-500 text-sm">{error}</div>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Processing..." : "Add Payment Method"}
      </Button>
    </form>
  );
}
