import { useCallback, useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loadStripe } from "@stripe/stripe-js";
import { AddPaymentMethodModal } from "../components/AddPaymentMethodModal";
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
  Calendar,
  Package,
} from "lucide-react";
import {
  useBilling,
  useUpdateBillingEmail,
  useSetupStripeCustomer,
  useOpenCustomerPortal,
  useCreateSubscription,
  useCancelSubscription,
  useCreateSetupIntent,
} from "../hooks/useBillingApi";

export default function BillingPage() {
  const { orgId, projectId } = useParams();
  const location = useLocation();
  const scopeType = orgId ? "organization" : "project";
  const scopeId = orgId || projectId || "";
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const {
    data: billingInfo,
    isLoading: loading,
    refetch,
  } = useBilling(scopeType, scopeId);
  const updateBillingEmailMutation = useUpdateBillingEmail(scopeType, scopeId);
  const setupStripeCustomerMutation = useSetupStripeCustomer(
    scopeType,
    scopeId
  );
  // Stripe publishable key from env/config (replace with actual value or import)
  const STRIPE_PUBLISHABLE_KEY =
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "";
  const stripePromise = STRIPE_PUBLISHABLE_KEY
    ? loadStripe(STRIPE_PUBLISHABLE_KEY)
    : null;
  // SetupIntent mutation for payment method modal
  const createSetupIntent = useCreateSetupIntent(scopeType, scopeId);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const openCustomerPortalMutation = useOpenCustomerPortal(scopeType, scopeId);
  const createSubscriptionMutation = useCreateSubscription(scopeType, scopeId);
  const cancelSubscriptionMutation = useCancelSubscription(scopeType, scopeId);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (billingInfo && billingInfo.billing_account) {
      setBillingEmail(billingInfo.billing_account.billing_email || "");
    }
  }, [billingInfo]);

  // Handlers using mutations
  const updateBillingEmail = async () => {
    setUpdating(true);
    try {
      await updateBillingEmailMutation.mutateAsync(billingEmail);
      await refetch();
    } catch (err) {
      setError("Failed to update billing email");
    } finally {
      setUpdating(false);
    }
  };

  const setupStripeCustomer = async () => {
    setUpdating(true);
    try {
      await setupStripeCustomerMutation.mutateAsync({
        email: customerEmail,
        name: customerName,
        description: `${scopeType} ${scopeId}`,
      });
      await refetch();
      setShowSetupDialog(false);
      setCustomerName("");
      setCustomerEmail("");
    } catch (err) {
      setError("Failed to setup billing customer");
    } finally {
      setUpdating(false);
    }
  };

  const openCustomerPortal = async () => {
    setUpdating(true);
    try {
      const returnUrl = `${window.location.origin}${location.pathname}`;
      const portalUrl = await openCustomerPortalMutation.mutateAsync(returnUrl);
      window.location.href = portalUrl;
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
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
    billing_account: account,
    upcoming_invoice,
    payment_methods,
    subscription_items,
    subscription_details,
  } = billingInfo;
  const hasStripeCustomer = !!account.stripe_customer_id;
  const hasActiveSubscription =
    !!account.stripe_subscription_id &&
    account.subscription_status === "active";

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

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Overview
          </CardTitle>
          <CardDescription>
            Current subscription status and plan information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <Badge className={getStatusColor(account.subscription_status)}>
              {account.subscription_status || "No subscription"}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="font-medium">Billing Email:</span>
            <span>{account.billing_email || "Not set"}</span>
          </div>
          {/* Create subscription button if no subscription exists but customer exists */}
          {hasStripeCustomer && !hasActiveSubscription && (
            <div className="pt-2">
              <Button
                onClick={createSubscription}
                disabled={updating}
                className="w-full"
              >
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Subscription with Current Resources
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Details */}
      {hasActiveSubscription && subscription_details && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Subscription Details
            </CardTitle>
            <CardDescription>
              Detailed information about your current subscription
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
            <div className="flex items-center justify-between">
              <span className="font-medium">Current Period:</span>
              <span>
                {formatDate(subscription_details.current_period_start)} -{" "}
                {formatDate(subscription_details.current_period_end)}
              </span>
            </div>
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
          </CardContent>
        </Card>
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

      {/* Billing Email Management */}
      <Card>
        <CardHeader>
          <CardTitle>Billing Email</CardTitle>
          <CardDescription>
            Update the email address for billing notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="billing-email">Email Address</Label>
            <Input
              id="billing-email"
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@example.com"
            />
          </div>
          <Button
            onClick={updateBillingEmail}
            disabled={updating || billingEmail === account.billing_email}
          >
            {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Email
          </Button>
        </CardContent>
      </Card>

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
            <AlertDialog
              open={showSetupDialog}
              onOpenChange={setShowSetupDialog}
            >
              <AlertDialogTrigger asChild>
                <Button>Setup Billing Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Setup Billing Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Create a customer account in Stripe for billing management.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customer-name">Customer Name</Label>
                    <Input
                      id="customer-name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customer-email">Customer Email</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={setupStripeCustomer}
                    disabled={!customerName || !customerEmail || updating}
                  >
                    {updating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Setup Customer
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
              {/* Add Payment Method Button if no payment method is present */}
              {hasStripeCustomer &&
                (!payment_methods || payment_methods.length === 0) &&
                stripePromise && (
                  <Button
                    variant="default"
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full mt-2"
                  >
                    Add Payment Method
                  </Button>
                )}
              {showPaymentModal && stripePromise && (
                <AddPaymentMethodModal
                  stripePromise={stripePromise}
                  createSetupIntent={createSetupIntent}
                  onClose={() => setShowPaymentModal(false)}
                />
              )}
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
          {upcoming_invoice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Upcoming Invoice
                </CardTitle>
                <CardDescription>
                  Next billing period information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Amount Due:</span>
                  <span className="text-2xl font-bold">
                    {formatCurrency(
                      upcoming_invoice.amount_due,
                      upcoming_invoice.currency
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Billing Period:</span>
                  <span>
                    {formatDate(upcoming_invoice.period_start)} -{" "}
                    {formatDate(upcoming_invoice.period_end)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge className={getStatusColor(upcoming_invoice.status)}>
                    {upcoming_invoice.status}
                  </Badge>
                </div>
                {upcoming_invoice.hosted_invoice_url && (
                  <Button
                    variant="outline"
                    onClick={() =>
                      window.open(upcoming_invoice.hosted_invoice_url, "_blank")
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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">Cancel Subscription</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to cancel your subscription? This
                        action will cancel your subscription at the end of the
                        current billing period.
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
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
