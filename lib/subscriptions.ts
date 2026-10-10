"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// שרת המנויים. חייב להיות www (ראו הערה ב-lib/supabase.ts).
const API = "https://www.insure.co.il/api";

export type PlanKey = "regular" | "office" | "appraiser" | "org";
export type PlanProducts = "machria" | "rami" | "both";
export type Billing = "full" | "installments";

export interface PlanPrices {
  installmentsMonthlyNis: number;
  installmentsYearNis: number;
  fullYearNis: number;
}

export interface PublicPlan {
  key: PlanKey;
  name: string;
  audience: string;
  availability: "available" | "coming_soon" | "quote";
  seats: number;
  checksPerMonth: number;
  stage2PerMonth: number;
  features: string[];
  prices: Record<PlanProducts, PlanPrices>;
}

export interface MySubscription {
  id: string;
  plan: PlanKey;
  products: PlanProducts;
  seats: number;
  status: string;
  is_owner: boolean;
  checks_per_month: number;
  stage2_per_month: number;
  completions_per_year: number;
  completions_used: number;
  usage_checks: number;
  usage_stage2: number;
  starts_at: string;
  ends_at: string;
  members: string[] | null;
}

export const PLAN_NAMES: Record<PlanKey, string> = {
  regular: "מנוי רגיל",
  office: "מנוי משרדי",
  appraiser: "מנוי לשמאי מכריע",
  org: "מנוי לוועדה או ארגון",
};

export const PRODUCT_NAMES: Record<PlanProducts, string> = {
  machria: "היטל השבחה",
  rami: 'רמ"י',
  both: 'היטל השבחה + רמ"י',
};

// הסשן של המשתמש. loading נשאר true עד שהדפדפן סיים לקרוא את הסשן השמור (וגם לטפל בחזרה מגוגל).
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!alive) return;
      setSession(next);
      setLoading(false);
    });
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { session, loading };
}

export async function fetchPlans(): Promise<PublicPlan[]> {
  const res = await fetch(`${API}/subscriptions/plans`);
  if (!res.ok) throw new Error("plans_failed");
  const body = await res.json();
  return body.plans as PublicPlan[];
}

export async function getMySubscriptions(): Promise<MySubscription[]> {
  const { data, error } = await supabase.rpc("my_subscriptions");
  if (error || !Array.isArray(data)) return [];
  return data as MySubscription[];
}

export async function setMembers(subscriptionId: string, emails: string[]): Promise<boolean> {
  const { data, error } = await supabase.rpc("subscription_set_members", {
    p_subscription_id: subscriptionId,
    p_emails: emails,
  });
  return !error && data === true;
}

async function authedPost(path: string, token: string, payload: unknown) {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

// יוצר דף תשלום למנוי. החבילה והמחיר נקבעים בשרת, כאן רק בוחרים מה לקנות.
export async function startSubscriptionCheckout(
  token: string,
  plan: PlanKey,
  products: PlanProducts,
  billing: Billing
): Promise<string> {
  const r = await authedPost("/subscriptions/checkout", token, { plan, products, billing, origin: "machria" });
  if (!r.ok || !r.body.payment_url) throw new Error(r.body.error || "checkout_failed");
  return r.body.payment_url as string;
}

// פותח בדיקה מקדימה על חשבון המנוי (מנצל בדיקה אחת מהמכסה החודשית).
export async function openSubscriberCheck(
  token: string,
  input: { committee: string; block: string; plot: string; address?: string; planNumbers?: string; name?: string; phone?: string; email?: string }
): Promise<{ caseId: string; remaining: number }> {
  const r = await authedPost("/subscriber/stage1", token, {
    product: "machria",
    committee_name: input.committee,
    block: input.block,
    plot: input.plot,
    address: input.address,
    plan_numbers: input.planNumbers,
    contact_name: input.name,
    contact_phone: input.phone,
    contact_email: input.email,
  });
  if (!r.ok || !r.body.case_id) throw new Error(r.body.error || "open_failed");
  return { caseId: r.body.case_id as string, remaining: r.body.remaining as number };
}

// פותח עיקרי דברים על חשבון המנוי (מנצל אחד מהמכסה החודשית). משם ממשיכים להעלאת המסמכים כמו אחרי תשלום רגיל.
export async function openSubscriberStage2(
  token: string,
  input: { stage1CaseId?: string; committee?: string }
): Promise<{ case2Id: string; remaining: number }> {
  const r = await authedPost("/subscriber/stage2", token, {
    product: "machria",
    stage1_case_id: input.stage1CaseId,
    committee_name: input.committee,
  });
  if (!r.ok || !r.body.case2_id) throw new Error(r.body.error || "open_failed");
  return { case2Id: r.body.case2_id as string, remaining: r.body.remaining as number };
}

export interface LibraryItem {
  kind: "stage1" | "stage2";
  product: "machria" | "rami";
  id: string;
  created_at: string;
  name: string | null;
  block: string | null;
  plot: string | null;
  status: string;
}

// כל מה שהמשתמש פתח דרך מנוי (בעל המנוי רואה את כל מה שנפתח במנוי שלו)
export async function getMyLibrary(): Promise<LibraryItem[]> {
  const { data, error } = await supabase.rpc("my_subscription_library");
  if (error || !Array.isArray(data)) return [];
  return data as LibraryItem[];
}

const SITES = {
  machria: "https://haimetkin-lgtm.github.io/hetel-hasbaha",
  rami: "https://haimetkin-lgtm.github.io/rami",
} as const;

// קישור לפתיחת פריט מהספרייה בדף המתאים באתר שלו
export function libraryHref(item: LibraryItem): string | null {
  const site = SITES[item.product];
  if (item.kind === "stage1") return `${site}/report/?case=${item.id}`;
  if (item.status === "ready" || item.status === "sent") return `${site}/argument/?case2=${item.id}`;
  if (item.status === "pending_upload") return `${site}/upload/?case2=${item.id}`;
  return null;
}

// בקשה להשלמת כיסוי (ועדה או יישוב שחסרים במאגר), נספרת מול המכסה השנתית
export async function requestCoverage(token: string, name: string, note: string): Promise<{ remaining: number }> {
  const r = await authedPost("/subscriber/coverage-request", token, { product: "machria", name, note });
  if (!r.ok) throw new Error(r.body.error || "request_failed");
  return { remaining: r.body.remaining as number };
}

// זוכר לאן לחזור אחרי התחברות (כולל חזרה מגוגל)
const NEXT_KEY = "hh_after_login";
export function rememberNext(path: string) {
  try { sessionStorage.setItem(NEXT_KEY, path); } catch {}
}
export function takeNext(): string | null {
  try {
    const v = sessionStorage.getItem(NEXT_KEY);
    sessionStorage.removeItem(NEXT_KEY);
    return v;
  } catch {
    return null;
  }
}

// מנוי פעיל שמכסה את היטל ההשבחה ועדיין יש בו עיקרי דברים החודש
export function usableStage2ForMachria(subs: MySubscription[]): MySubscription | null {
  return (
    subs.find((s) => (s.products === "machria" || s.products === "both") && s.usage_stage2 < s.stage2_per_month) ?? null
  );
}

// מנוי פעיל שמכסה את היטל ההשבחה ועדיין יש בו בדיקות החודש
export function usableForMachria(subs: MySubscription[]): MySubscription | null {
  return (
    subs.find((s) => (s.products === "machria" || s.products === "both") && s.usage_checks < s.checks_per_month) ?? null
  );
}
