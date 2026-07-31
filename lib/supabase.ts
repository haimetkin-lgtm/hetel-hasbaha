import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// כשאין env vars (פיתוח מקומי בלי .env.local) — client דמה שלא קורס
const isConfigured = url.startsWith("http");

export const supabase = isConfigured
  ? createClient(url, key)
  : createClient("https://placeholder.supabase.co", "placeholder");

export const supabaseConfigured = isConfigured;

// טיפוסי מסד הנתונים
export interface CommitteeRow {
  id: string;
  name: string;
  decisions_count: number;
  classified: boolean;
  classified_at: string | null;
  price_tier: 1 | 2 | 3; // 1=280, 2=380, 3=480
}

export interface CaseRow {
  id: string;
  created_at: string;
  committee_name: string;
  address: string | null;
  block: string | null;
  plot: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  price_nis: number;
  paid: boolean;
  status: "pending_payment" | "queued_for_classification" | "ready" | "sent";
  cardcom_deal_id: string | null;
}

export const PRICE_TIERS: Record<1 | 2 | 3, number> = {
  1: 280,
  2: 380,
  3: 480,
};

export function tierForDecisionsCount(count: number): 1 | 2 | 3 {
  if (count <= 150) return 1;
  if (count <= 600) return 2;
  return 3;
}
