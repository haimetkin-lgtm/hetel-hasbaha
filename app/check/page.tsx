"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase, supabaseConfigured, PRICE_TIERS, tierForDecisionsCount, startCheckout } from "@/lib/supabase";
import { useSession, getMySubscriptions, usableForMachria, openSubscriberCheck, rememberNext, type MySubscription } from "@/lib/subscriptions";

type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "not_found" }
  | { state: "found"; committee: string; count: number; tier: 1 | 2 | 3; classified: boolean };

export default function CheckPage() {
  const router = useRouter();
  const { session } = useSession();
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  useEffect(() => {
    if (!session) { setSubscription(null); return; }
    getMySubscriptions().then((list) => setSubscription(usableForMachria(list)));
  }, [session]);
  const [committeeInput, setCommitteeInput] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [block, setBlock] = useState("");
  const [plot, setPlot] = useState("");
  const [planNumbers, setPlanNumbers] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!committeeInput.trim() || !block.trim() || !plot.trim()) {
      setError("נא להזין ועדה, גוש וחלקה");
      return;
    }
    setLookup({ state: "loading" });
    setError(null);

    if (!supabaseConfigured) {
      setError("המערכת עדיין לא מחוברת למאגר הנתונים. נסו שוב מאוחר יותר.");
      setLookup({ state: "idle" });
      return;
    }

    const { data, error: qError } = await supabase
      .from("machria_committees")
      .select("name, decisions_count, classified")
      .ilike("name", `%${committeeInput.trim()}%`)
      .limit(1)
      .maybeSingle();

    if (qError || !data) {
      setLookup({ state: "not_found" });
      return;
    }

    const tier = tierForDecisionsCount(data.decisions_count);
    setLookup({ state: "found", committee: data.name, count: data.decisions_count, tier, classified: data.classified });
  }

  // בדיקה על חשבון המנוי: מנצלת בדיקה אחת מהמכסה, בלי תשלום
  async function handleSubscriberOpen() {
    if (lookup.state !== "found" || !session) return;
    setSubscribing(true);
    setError(null);
    try {
      const { caseId } = await openSubscriberCheck(session.access_token, {
        committee: lookup.committee,
        block: block.trim(),
        plot: plot.trim(),
        address: address.trim() || undefined,
        planNumbers: planNumbers.trim() || undefined,
        name: contactName.trim() || undefined,
        phone: contactPhone.trim() || undefined,
        email: contactEmail.trim() || undefined,
      });
      router.push(`/report/?case=${caseId}`);
    } catch (e) {
      const code = (e as Error).message;
      setError(
        code === "quota_exceeded"
          ? "המכסה החודשית נוצלה. אפשר לשלם על הבדיקה הזו בנפרד."
          : "לא הצלחנו לפתוח את הבדיקה על חשבון המנוי. נסו שוב, או שלמו על הבדיקה בנפרד."
      );
      setSubscribing(false);
    }
  }

  async function handlePay() {
    if (lookup.state !== "found") return;
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setError("נא להזין טלפון או אימייל לקבלת הדוח");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // המזהה נוצר כאן כדי שלא נצטרך לקרוא את השורה בחזרה (קריאה ישירה לטבלה סגורה לציבור).
      // המחיר האמיתי נקבע בשרת בעת יצירת דף התשלום, הערך כאן נשמר רק לתיעוד.
      const caseId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("machria_cases")
        .insert({
          id: caseId,
          committee_name: lookup.committee,
          address: address || null,
          block: block.trim(),
          plot: plot.trim(),
          plan_numbers: planNumbers.trim() || null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          contact_email: contactEmail || null,
          price_nis: PRICE_TIERS[lookup.tier],
          paid: false,
          status: "pending_payment",
        });

      if (insertError) throw insertError;

      window.location.href = await startCheckout("stage1", caseId);
    } catch {
      setError("אירעה שגיאה. נסו שוב, או צרו קשר בוואטסאפ.");
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#14364f] mb-1">בדיקת סבירות ראשונית לדרישת היטל השבחה</h1>
      <p className="text-sm text-gray-500 mb-6">שלב 1: מזינים את הוועדה המקומית שממנה קיבלתם את הדרישה</p>

      <form onSubmit={handleLookup} className="space-y-2 mb-4">
        <input
          type="text"
          value={committeeInput}
          onChange={(e) => setCommitteeInput(e.target.value)}
          placeholder="ועדה מקומית, למשל: תל אביב-יפו, הרצליה, רעננה..."
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e5a8a]"
        />
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="גוש"
            required
            value={block}
            onChange={(e) => setBlock(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="חלקה"
            required
            value={plot}
            onChange={(e) => setPlot(e.target.value)}
            className="w-1/2 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <input
          type="text"
          placeholder="מספר תוכנית לפיה נדרש ההיטל (אופציונלי, מופיע במכתב הוועדה)"
          value={planNumbers}
          onChange={(e) => setPlanNumbers(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="w-full bg-[#1e5a8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#14364f] cursor-pointer"
        >
          חיפוש
        </button>
      </form>

      {lookup.state === "loading" && <p className="text-sm text-gray-500">מחפש...</p>}
      {lookup.state === "not_found" && (
        <p className="text-sm text-[#8a2f22]">לא מצאנו ועדה בשם הזה. נסו לבדוק את האיות, או צרו קשר בוואטסאפ.</p>
      )}
      {lookup.state !== "found" && error && <p className="text-sm text-[#8a2f22]">{error}</p>}

      {lookup.state === "found" && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="text-sm text-gray-600 mb-1">ועדה מקומית</div>
          <div className="font-bold text-[#14364f] mb-3">{lookup.committee}</div>
          <div className="bg-[#eef4f9] rounded-lg px-3 py-2 text-sm text-[#14364f] mb-4">
            נמצאו <strong>{lookup.count.toLocaleString("he-IL")}</strong> הכרעות שמאים מכריעים במאגר עבור ועדה זו.
          </div>
          <div className="text-2xl font-bold text-[#1e5a8a] mb-4">
            {PRICE_TIERS[lookup.tier].toLocaleString("he-IL")} ₪
          </div>

          <div className="space-y-2 mb-4">
            <input
              type="text"
              placeholder="כתובת הנכס (אופציונלי)"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="שם מלא"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <input
              type="tel"
              placeholder="טלפון"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              dir="ltr"
            />
            <input
              type="email"
              placeholder="אימייל"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              dir="ltr"
            />
          </div>

          {!lookup.classified && (
            <p className="text-xs text-gray-500 mb-3">
              הוועדה הזו טרם סווגה במלואה, הדוח שלכם יופק תוך זמן קצר וישלח אליכם, ולא יוצג באופן מיידי.
            </p>
          )}

          {error && <p className="text-sm text-[#8a2f22] mb-3">{error}</p>}

          {subscription ? (
            <div className="bg-[#eef7f1] border border-[#bfdcc9] rounded-lg p-3 mb-3">
              <div className="text-sm text-[#256f46] mb-2">
                יש לכם מנוי פעיל: נותרו <strong>{subscription.checks_per_month - subscription.usage_checks}</strong> בדיקות החודש.
              </div>
              <button
                onClick={handleSubscriberOpen}
                disabled={subscribing || submitting}
                className="w-full bg-[#2e8b57] text-white font-bold py-3 rounded-lg hover:bg-[#256f46] disabled:opacity-50 cursor-pointer disabled:cursor-default"
              >
                {subscribing ? "פותח את הבדיקה..." : "פתיחת הבדיקה על חשבון המנוי"}
              </button>
            </div>
          ) : !session ? (
            <p className="text-xs text-gray-500 mb-3">
              מנויים?{" "}
              <a
                href="/hetel-hasbaha/login/"
                onClick={() => rememberNext("/check/")}
                className="text-[#1e5a8a] underline"
              >
                התחברו
              </a>{" "}
              כדי לפתוח בדיקות על חשבון המנוי, בלי לשלם בכל פעם.
            </p>
          ) : null}

          <button
            onClick={handlePay}
            disabled={submitting}
            className="w-full bg-[#1e5a8a] text-white font-bold py-3 rounded-lg hover:bg-[#14364f] disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            {submitting ? "מעביר לתשלום..." : `המשך לתשלום · ${PRICE_TIERS[lookup.tier]} ₪`}
          </button>
        </div>
      )}

      <div className="mt-8 text-center">
        <a
          href={`https://wa.me/972523728828?text=${encodeURIComponent("שלום חיים, יש לי שאלה לפני שאני מתחיל בדיקה")}`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-[#25d366] text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          יש שאלה? וואטסאפ לחיים אטקין
        </a>
      </div>
    </main>
  );
}
