"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession, getMySubscriptions, usableStage2ForMachria, openSubscriberStage2, rememberNext, type MySubscription } from "@/lib/subscriptions";
import { supabase, supabaseConfigured, CaseRow, STAGE2_PRICE_NIS, getCase, startCheckout } from "@/lib/supabase";
import FeeCalculator from "@/components/FeeCalculator";


function UpgradeContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const [subscription, setSubscription] = useState<MySubscription | null>(null);
  const [subscribing, setSubscribing] = useState(false);
  const caseId = params.get("case");
  const paymentFailed = params.get("payment") === "failed";
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || !supabaseConfigured) return;
    getCase(caseId).then((data) => setCaseRow(data));
  }, [caseId]);

  useEffect(() => {
    if (!session) { setSubscription(null); return; }
    getMySubscriptions().then((list) => setSubscription(usableStage2ForMachria(list)));
  }, [session]);

  // עיקרי דברים על חשבון המנוי: מנצל אחד מהמכסה החודשית, ממשיכים להעלאת המסמכים
  async function handleSubscriberOpen() {
    if (!session) return;
    setSubscribing(true);
    setError(null);
    try {
      let opened;
      try {
        opened = await openSubscriberStage2(session.access_token, { stage1CaseId: caseId || undefined });
      } catch (e) {
        // תיק שלב א' שלא נפתח מהמנוי הזה: ממשיכים בלי להצמיד אותו
        if ((e as Error).message !== "case_not_found") throw e;
        opened = await openSubscriberStage2(session.access_token, { committee: caseRow?.committee_name || undefined });
      }
      router.push(`/upload/?case2=${opened.case2Id}`);
    } catch (e) {
      setError((e as Error).message === "quota_exceeded" ? "המכסה החודשית של עיקרי דברים נוצלה. אפשר לשלם על המסמך הזה בנפרד." : "לא הצלחנו לפתוח על חשבון המנוי. נסו שוב, או שלמו בנפרד.");
      setSubscribing(false);
    }
  }

  async function handlePay() {
    if (!supabaseConfigured) {
      setError("המערכת עדיין לא מחוברת. נסו שוב מאוחר יותר.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // המזהה נוצר כאן כדי שלא נצטרך לקרוא את השורה בחזרה. המחיר האמיתי נקבע בשרת בעת יצירת דף התשלום.
      const stage2Id = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from("machria_stage2_cases")
        .insert({
          id: stage2Id,
          stage1_case_id: caseId || null,
          committee_name: caseRow?.committee_name || "",
          contact_name: caseRow?.contact_name || null,
          contact_phone: caseRow?.contact_phone || null,
          contact_email: caseRow?.contact_email || null,
          price_nis: STAGE2_PRICE_NIS,
          paid: false,
          status: "pending_payment",
        });
      if (insertError) throw insertError;

      window.location.href = await startCheckout("stage2", stage2Id);
    } catch {
      setError("אירעה שגיאה. נסו שוב, או צרו קשר בוואטסאפ.");
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#14364f] mb-3">
        עיקרי דברים ביד, לדיון מול השמאי המכריע
      </h1>
      <p className="text-gray-600 text-sm leading-relaxed mb-4">
        מעלים את מכתב הדרישה מהוועדה ואת שומת הוועדה, והמערכת מכינה עבורכם מסמך עיקרי טיעון
        מבוסס על ההכרעות הרלוונטיות שנמצאו. התשלום כולל גם שיחת ייעוץ מקוונת עם חיים אטקין
        על המסמך, ללא תוספת מחיר.
      </p>
      {caseRow?.committee_name && (
        <div className="bg-[#eef4f9] rounded-lg px-3 py-2 text-sm text-[#14364f] mb-4">
          ועדה: <strong>{caseRow.committee_name}</strong>
        </div>
      )}
      {paymentFailed && (
        <p className="text-sm text-[#8a2f22] mb-4">התשלום לא הושלם. אפשר לנסות שוב.</p>
      )}
      {error && <p className="text-sm text-[#8a2f22] mb-4">{error}</p>}
      {subscription ? (
        <div className="bg-[#eef7f1] border border-[#bfdcc9] rounded-lg p-3 mb-4">
          <div className="text-sm text-[#256f46] mb-2">
            יש לכם מנוי פעיל: נותרו <strong>{subscription.stage2_per_month - subscription.usage_stage2}</strong> מסמכי עיקרי דברים החודש.
          </div>
          <button
            onClick={handleSubscriberOpen}
            disabled={subscribing || submitting}
            className="w-full bg-[#2e8b57] text-white font-bold py-3 rounded-lg hover:bg-[#256f46] disabled:opacity-50 cursor-pointer disabled:cursor-default"
          >
            {subscribing ? "פותח..." : "הפקה על חשבון המנוי"}
          </button>
        </div>
      ) : !session ? (
        <p className="text-xs text-gray-500 mb-4">
          מנויים?{" "}
          <a href="/hetel-hasbaha/login/" onClick={() => rememberNext("/upgrade/" + window.location.search)} className="underline">התחברו</a>{" "}
          כדי להפיק עיקרי דברים על חשבון המנוי, בלי לשלם בכל פעם.
        </p>
      ) : null}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handlePay}
          disabled={submitting}
          className="flex-1 bg-[#1e5a8a] text-white font-bold py-3 rounded-lg hover:bg-[#14364f] disabled:opacity-50 cursor-pointer disabled:cursor-default"
        >
          {submitting ? "מעביר לתשלום..." : `המשך לתשלום · ${STAGE2_PRICE_NIS.toLocaleString("he-IL")} ₪`}
        </button>
        <a
          href="/hetel-hasbaha/sample-argument.html"
          target="_blank"
          className="flex-1 inline-flex items-center justify-center border-2 border-[#1e5a8a] text-[#1e5a8a] hover:bg-[#eef4f9] font-bold py-3 rounded-lg transition-colors text-center"
        >
          צפה בדוגמת מסמך עיקרי דברים
        </a>
      </div>
      <div className="mt-6 text-center">
        <a
          href={`https://wa.me/972523728828?text=${encodeURIComponent("שלום חיים, יש לי שאלה לפני שאני ממשיך לשלב הבא")}`}
          target="_blank"
          className="inline-flex items-center gap-2 bg-[#25d366] text-white text-sm font-medium px-4 py-2 rounded-full"
        >
          יש שאלה? וואטסאפ לחיים אטקין
        </a>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-10 space-y-6">
      <Suspense fallback={<p className="text-gray-500">טוען...</p>}>
        <UpgradeContent />
      </Suspense>
      <FeeCalculator />
    </main>
  );
}
