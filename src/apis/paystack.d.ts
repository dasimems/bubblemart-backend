export interface PaystackCustomField {
  display_name: string;
  variable_name: string;
  value: string;
}

export interface PaystackMetadata {
  custom_fields?: PaystackCustomField[];
}

export interface PaystackLogHistory {
  type: string;
  message: string;
  time: number;
}

export interface PaystackLog {
  start_time: number;
  time_spent: number;
  attempts: number;
  errors: number;
  success: boolean;
  mobile: boolean;
  input: unknown[]; // Using unknown instead of any
  history: PaystackLogHistory[];
}

export interface PaystackCustomer {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  metadata: Record<string, unknown> | null; // Replacing any with a generic object
  customer_code: string;
  risk_action: string;
  international_format_phone: string | null;
}

export interface PaystackAuthorization {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name: string | null;
}

export interface PaystackWebhookData {
  id: number;
  domain: string;
  status: string; // e.g., "success", "failed"
  reference: string;
  amount: number; // Amount in kobo (divide by 100 for NGN)
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string; // e.g., "card", "bank"
  currency: string; // e.g., "NGN"
  ip_address: string;
  metadata: PaystackMetadata;
  log: PaystackLog;
  fees: number;
  customer: PaystackCustomer;
  authorization: PaystackAuthorization;
  plan: string | null;
  requested_amount: number;
  transaction_date: string;
}

export interface PaystackWebhookEvent {
  event: string; // e.g., "charge.success", "charge.failed"
  data: PaystackWebhookData;
}

export interface PaystackTransactionData {
  id: number;
  domain: string;
  status: "success" | "failed" | "pending"; // Possible values
  reference: string;
  receipt_number: string | null;
  amount: number;
  message: string | null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string | null;
  log: PaystackLog;
  fees: number;
  fees_split: Record<string, unknown> | null; // Generic object instead of any
  authorization: PaystackAuthorization;
  customer: PaystackCustomer;
  plan: string | null;
  split: Record<string, unknown>; // Replaced any with a generic object
  order_id: string | null;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data: Record<string, unknown> | null; // Replaced any with a generic object
  source: Record<string, unknown> | null;
  fees_breakdown: Record<string, unknown> | null;
  connect: Record<string, unknown> | null;
  transaction_date: string;
  plan_object: Record<string, unknown>;
  subaccount: Record<string, unknown>;
}

export interface PaystackVerificationResponse {
  status: boolean;
  message: string;
  data: PaystackTransactionData;
}
