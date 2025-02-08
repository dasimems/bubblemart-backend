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
  input: any[];
  history: PaystackLogHistory[];
}

export interface PaystackCustomer {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  metadata: Record<string, any>;
  customer_code: string;
  risk_action: string;
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
