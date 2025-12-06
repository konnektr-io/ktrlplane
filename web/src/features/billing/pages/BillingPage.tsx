import { useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UnifiedBillingSetupModal } from "../components/UnifiedBillingSetupModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  CreditCard,
  Download,
  Settings,
  AlertTriangle,
  Package,
} from "lucide-react";
import {
  useBilling,
  useOpenCustomerPortal,
  useCreateSubscription,
  useCancelSubscription,
} from "../hooks/useBillingApi";

export default function BillingPage() {
  const { orgId, projectId } = useParams();
  const location = useLocation();
  const scopeType = orgId ? "organization" : "project";
  const scopeId = orgId || projectId || "";
  const [showSetupModal, setShowSetupModal] = useState(false);
  const {
    data: billingInfo,
    isLoading: loading,
    refetch,
  } = useBilling(scopeType, scopeId);
  const openCustomerPortalMutation = useOpenCustomerPortal(scopeType, scopeId);
  const createSubscriptionMutation = useCreateSubscription(scopeType, scopeId);
  const cancelSubscriptionMutation = useCancelSubscription(scopeType, scopeId);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openCustomerPortal = async () => {
    setUpdating(true);
    try {
      const returnUrl = `${window.location.origin}${location.pathname}`;
      const portalUrl = await openCustomerPortalMutation.mutateAsync(returnUrl);
      window.location.href = portalUrl;
    } catch {
      setError("Failed to open customer portal");
    } finally {
      setUpdating(false);
    }
  };

  const createSubscription = async () => {
    setUpdating(true);
    try {
      await createSubscriptionMutation.mutateAsync();
      await refetch();
    } catch {
      setError("Failed to create subscription");
    } finally {
      setUpdating(false);
    }
  };

  const cancelSubscription = async () => {
    setUpdating(true);
    try {
      await cancelSubscriptionMutation.mutateAsync();
      await refetch();
    } catch {
      setError("Failed to cancel subscription");
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800";
      case "trial":
        return "bg-blue-100 text-blue-800";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "past_due":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading billing information...</span>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="p-8">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Failed to load billing information. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const {
    subscription_details,
    latest_invoice,
    stripe_customer,
    payment_methods,
    subscription_items,
  } = billingInfo;

  const hasStripeCustomer = !!stripe_customer?.id;
  const hasActiveSubscription =
    !!subscription_details?.id && subscription_details.status === "active";

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold">Billing</h1>
        <p className="text-muted-foreground">
          Manage billing and subscription settings for this {scopeType}
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Combined Subscription Card: only show if subscription_details exists */}
      {subscription_details ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              Subscription details are fetched live from Stripe.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Subscription ID:</span>
              <span className="font-mono text-sm">
                {subscription_details.id}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <Badge className={getStatusColor(subscription_details.status)}>
                {subscription_details.status}
              </Badge>
            </div>
            {/* Pending cancellation note */}
            {subscription_details.cancel_at_period_end && (
              <div className="flex items-center mt-2">
                <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
                <span className="text-sm text-destructive">
                  This subscription is pending cancellation and will end at the
                  end of the current billing period. To continue your
                  subscription, open the Payment Management Portal below.
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium">Cancel at Period End:</span>
              <Badge
                variant={
                  subscription_details.cancel_at_period_end
                    ? "destructive"
                    : "default"
                }
              >
                {subscription_details.cancel_at_period_end ? "Yes" : "No"}
              </Badge>
            </div>
            {/* Billing Email: now shown from Stripe customer info, not DB */}
            <div className="flex items-center justify-between">
              <span className="font-medium">Billing Email:</span>
              <span>{stripe_customer?.email || "Not set"}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>
              No active subscription. You can create one below.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Create subscription button if no subscription exists but customer exists */}
      {hasStripeCustomer && !hasActiveSubscription && (
        <div className="flex flex-col gap-2 items-start mt-4">
          <Button
            variant="default"
            onClick={createSubscription}
            disabled={updating}
          >
            Create subscription
          </Button>
          <span className="text-xs text-muted-foreground">
            You can create a subscription now to enable paid resources later.
            <br />
            Free resources remain available without a subscription.
          </span>
        </div>
      )}

      {/* Subscription Items */}
      {hasActiveSubscription &&
        subscription_items &&
        subscription_items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Subscription Items
              </CardTitle>
              <CardDescription>
                Products and services included in your subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subscription_items.map((item) => (
                  <div
                    key={item.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">
                          {item.price?.product?.name || "Product"}
                        </h4>
                        {item.price?.product?.description && (
                          <p className="text-sm text-muted-foreground">
                            {item.price.product.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          Quantity: {item.quantity}
                        </div>
                        {item.price && (
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(
                              item.price.unit_amount,
                              item.price.currency
                            )}
                            {item.price.recurring && (
                              <span>
                                /
                                {item.price.recurring.interval_count > 1
                                  ? `${item.price.recurring.interval_count} `
                                  : ""}
                                {item.price.recurring.interval}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Item ID: {item.id}</span>
                      {item.price && <span>Price ID: {item.price.id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      {/* Unified Billing Setup Modal */}
      <UnifiedBillingSetupModal
        open={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        scopeType={scopeType}
        scopeId={scopeId}
        onComplete={async () => {
          setShowSetupModal(false);
          await refetch();
        }}
      />

      {/* Stripe Integration */}
      {!hasStripeCustomer ? (
        <Card>
          <CardHeader>
            <CardTitle>Setup Billing</CardTitle>
            <CardDescription>
              Connect with Stripe to manage subscriptions and payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setShowSetupModal(true)}>
              Setup Billing Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Payment Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Payment Management
              </CardTitle>
              <CardDescription>
                Manage payment methods, billing details, and view invoices
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={openCustomerPortal}
                disabled={updating}
                className="w-full"
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Open Payment Management Portal
              </Button>
              <p className="text-sm text-muted-foreground">
                The customer portal allows you to update payment methods,
                download invoices, and manage your subscription settings.
              </p>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          {payment_methods && payment_methods.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>
                  Active payment methods on file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {payment_methods.map((pm) => (
                    <div
                      key={pm.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4" />
                        <span className="capitalize">{pm.card?.brand}</span>
                        <span>•••• {pm.card?.last4}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {pm.card?.exp_month}/{pm.card?.exp_year}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Invoice */}
          {latest_invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Last Invoice
                </CardTitle>
                <CardDescription>
                  Last billing period information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount Due:</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(
                      latest_invoice.amount_due,
                      latest_invoice.currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Billing Period:</span>
                  <span>
                    {formatDate(latest_invoice.period_start)} -{" "}
                    {formatDate(latest_invoice.period_end)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(latest_invoice.status)}>
                    {latest_invoice.status}
                  </Badge>
                </div>
                {latest_invoice.hosted_invoice_url && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(latest_invoice.hosted_invoice_url, "_blank")
                    }
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    View Invoice
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Subscription Actions */}
          {hasActiveSubscription && (
            <Card>
              <CardHeader>
                <CardTitle>Subscription Actions</CardTitle>
                <CardDescription>Manage your subscription</CardDescription>
              </CardHeader>
              <CardContent>
                {subscription_details?.cancel_at_period_end ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center">
                      <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
                      <span className="text-sm text-destructive">
                        Your subscription will be cancelled at the end of the
                        current billing period.
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      To continue your subscription, open the Payment Management
                      Portal below.
                    </span>
                    <Button
                      variant="outline"
                      onClick={openCustomerPortal}
                      disabled={updating}
                      className="w-full mt-2"
                    >
                      Open Payment Management Portal
                    </Button>
                  </div>
                ) : (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">Cancel Subscription</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to cancel your subscription?
                          This action will cancel your subscription at the end
                          of the current billing period.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={cancelSubscription}
                          disabled={updating}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {updating && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Cancel Subscription
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
