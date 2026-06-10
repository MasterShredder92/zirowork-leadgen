export interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: LeadRecord;
  old_record: LeadRecord | null;
}

export interface LeadRecord {
  id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone?: string;
  recipient_phone?: string;
  email?: string;
  instrument?: string;
  age?: number;
  num_students?: number;
  goals?: string;
  personality?: string;
  created_at?: string;
  [key: string]: unknown;
}

export interface TenantConfig {
  director_name: string;
  director_title: string;
  location_name: string;
  registration_link: string;
  monthly_price_standard: number;
  monthly_price_military: number;
  openphone_number_id?: string;
}

export interface ScoringResult {
  priority: 'HIGH_PRIORITY' | 'HOT_LEAD' | 'CONFIDENT_CLOSE' | 'SENSITIVE' | 'STANDARD';
  hook: string;
  why: string;
  message_draft: string;
}
