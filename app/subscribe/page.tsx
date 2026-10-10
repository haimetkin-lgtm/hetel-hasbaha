"use client";

import { useEffect, useState } from "react";
import {
  fetchPlans, startSubscriptionCheckout, useSession, rememberNext,
  type Billing, type PlanKey, type PlanProducts, type PublicPlan,
} from "@/lib/subscriptions";

const BASE = "/hetel-hasbaha";
const WA = "972523728828";
const fmt = (n: number) => n.toLocaleString("he-IL");

const ERRORS: Record<string, string> = {
  already_subscribed: "כבר יש לכם מנוי פעיל מהסוג הזה. ניתן לראות אותו באזור האישי.",
  email_not_confirmed: "כתובת האימייל עדיין לא אומתה. אמתו אותה דרך המייל שנשלח אליכם ונסו שוב.",
  plan_not_available: "החבילה הזו עדיין לא זמינה לרכישה.",
  login_required: "יש להתחבר מחדש.",
};

export default function SubscribePage() {
  const { session, loading } = useSession();
  const [plans, setPlans] = useState<PublicPlan[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [products, setProducts] = useState<PlanProducts>("machria");
  const [billing, setBilling] = useState<Billing>("installments");
  const [busyPlan, setBusyPlan] = useState<PlanKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paymentFailed, setPaymentFailed] = useState(false);

  useEffect(() => {
    fetchPlans().then(setPlans).catch(() => setLoadError(true));
    setPaymentFailed(new URLSearchParams(window.location.search).get("payment") === "failed");
  }, []);

  async function buy(plan: PlanKey) {
    setError(null);
    if (!session) {
      rememberNext("/subscribe/");
      window.location.href = `${BASE}/login/`;
      return;
    }
    setBusyPlan(plan);
    try {
      window.location.href = await startSubscriptionCheckout(session.access_token, plan, products, billing);
    } catch (e) {
      setError(ERRORS[(e as Error).message] ?? "לא הצלחנו לפתוח את דף התשלום. נסו שוב, או צרו קשר בוואטסאפ.");
      setBusyPlan(null);
    }
  }

  const mail = (subject: string) => `mailto:haimetkin@gmail.com?subject=${encodeURIComponent(subject)}`;
  const wa = (text: string) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#14364f] mb-1">מנויים</h1>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        בדיקות מקדימות בכמות, על חשבון המנוי, בלי לשלם על כל בדיקה בנפרד. המנוי שנתי, ללא חידוש אוטומטי.
        אפשר לשלם בתשלום אחד מראש בהנחה, או ב-12 תשלומים.
      </p>

      {paymentFailed && (
        <p className="text-sm text-[#8a2f22] bg-[#fbeeea] rounded-lg px-3 py-2 mb-4">התשלום לא הושלם ולא חויבתם. אפשר לנסות שוב.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-5">
        <div>
          <div className="text-xs text-gray-500 mb-1">מה כולל המנוי</div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm bg-white">
            {([["machria", "היטל השבחה"], ["rami", 'רמ"י'], ["both", "שניהם"]] as [PlanProducts, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setProducts(v)}
                className={`flex-1 py-2 cursor-pointer ${products === v ? "bg-[#1e5a8a] text-white font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {products === "both" && <div className="text-xs text-[#2e6b4a] mt-1">שני האתרים יחד: תוספת של 40% בלבד, לא כפל.</div>}
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">אופן תשלום</div>
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm bg-white">
            {([["installments", "12 תשלומים"], ["full", "תשלום אחד (כ-10% הנחה)"]] as [Billing, string][]).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setBilling(v)}
                className={`flex-1 py-2 cursor-pointer ${billing === v ? "bg-[#1e5a8a] text-white font-medium" : "text-gray-600 hover:bg-gray-50"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loadError && <p className="text-sm text-[#8a2f22]">לא הצלחנו לטעון את החבילות. נסו לרענן, או צרו קשר בוואטסאפ.</p>}
      {!plans && !loadError && <p className="text-sm text-gray-500">טוען חבילות...</p>}
      {error && <p className="text-sm text-[#8a2f22] bg-[#fbeeea] rounded-lg px-3 py-2 mb-3">{error}</p>}
      {session && !loading && (
        <p className="text-xs text-gray-500 mb-3">מחוברים כ-{session.user.email}</p>
      )}

      <div className="space-y-4">
        {plans?.map((p) => {
          const price = p.prices[products];
          return (
            <div key={p.key} className={`bg-white border rounded-xl p-5 shadow-sm ${p.key === "regular" ? "border-[#1e5a8a]" : "border-gray-200"}`}>
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <h2 className="font-bold text-[#14364f]">{p.name}</h2>
                <span className="text-xs text-gray-500">{p.audience}</span>
              </div>

              {p.availability === "available" && (
                <div className="mb-3">
                  <span className="text-2xl font-bold text-[#1e5a8a]">
                    {fmt(billing === "installments" ? price.installmentsMonthlyNis : price.fullYearNis)} ₪
                  </span>{" "}
                  <span className="text-sm text-gray-500">
                    {billing === "installments" ? `לחודש, ב-12 תשלומים (${fmt(price.installmentsYearNis)} ₪ לשנה)` : "לשנה, בתשלום אחד"}
                  </span>
                </div>
              )}
              {p.availability === "coming_soon" && (
                <div className="mb-3 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                  בקרוב. החבילה תיפתח כשיושלם מנוע החיפוש בהחלטות. מחיר צפוי: {fmt(price.installmentsMonthlyNis)} ₪ לחודש.
                </div>
              )}

              <ul className="text-sm text-gray-700 space-y-1 mb-4 list-disc pr-5">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>

              {p.availability === "available" && (
                <button
                  onClick={() => buy(p.key)}
                  disabled={busyPlan !== null}
                  className="w-full bg-[#1e5a8a] text-white font-bold py-2.5 rounded-lg hover:bg-[#14364f] disabled:opacity-50 cursor-pointer disabled:cursor-default"
                >
                  {busyPlan === p.key ? "מעביר לתשלום..." : session ? "לרכישה ולתשלום" : "התחברות או הרשמה ורכישה"}
                </button>
              )}
              {p.availability === "coming_soon" && (
                <a
                  href={mail("רשימת המתנה: מנוי לשמאי מכריע")}
                  className="block text-center border border-[#1e5a8a] text-[#1e5a8a] font-medium py-2.5 rounded-lg hover:bg-[#eef4f9]"
                >
                  הצטרפות לרשימת המתנה
                </a>
              )}
              {p.availability === "quote" && (
                <a
                  href={wa("שלום חיים, אני מעוניין בהצעת מחיר למנוי לוועדה או לארגון")}
                  target="_blank"
                  className="block text-center border border-[#1e5a8a] text-[#1e5a8a] font-medium py-2.5 rounded-lg hover:bg-[#eef4f9]"
                >
                  בקשת הצעת מחיר
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mt-6 leading-relaxed">
        הבדיקות המקדימות נפתחות מיד באזור האישי. חלק מההטבות (התראות במייל, הפקה אוטומטית של עיקרי דברים) מופעלות בהדרגה, ועד אז ניתנות לפי פנייה אל חיים. הבדיקה היא ראשונית, ואינה שומה ואינה ייעוץ משפטי.
      </p>
      <p className="text-sm text-gray-500 mt-4">
        כבר מנויים? <a href={`${BASE}/login/`} className="text-[#1e5a8a] underline">כניסה לאזור האישי</a>
      </p>
    </main>
  );
}
