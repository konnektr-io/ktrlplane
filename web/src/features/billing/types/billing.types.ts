export interface BillingAccount {
  billing_account_id: string;
  scope_type: "organization" | "project";
  scope_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  // Removed subscription_status, subscription_plan, billing_email; use Stripe API only
  created_at: string;
  updated_at: string;
}

export interface StripeInvoice {
  id: string;
  amount_due: number;
  currency: string;
  period_start: number;
  period_end: number;
  status: string;
  hosted_invoice_url?: string;
}

export interface StripePaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
  };
}

export interface StripeSubscriptionItem {
  id: string;
  quantity: number;
  price?: {
    id: string;
    unit_amount: number;
    currency: string;
    recurring?: {
      interval: string;
      interval_count: number;
    };
    product?: {
      id: string;
      name: string;
      description: string;
    };
  };
}

export interface StripeSubscriptionDetails {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
}

export interface BillingInfo {
  billing_account: BillingAccount;
  stripe_customer?: {
    id: string;
    email: string;
    name?: string;
    description?: string;
  };
  stripe_customer_portal?: string;
  latest_invoice?: StripeInvoice;
  payment_methods?: StripePaymentMethod[];
  subscription_items?: StripeSubscriptionItem[];
  subscription_details?: StripeSubscriptionDetails;
}
