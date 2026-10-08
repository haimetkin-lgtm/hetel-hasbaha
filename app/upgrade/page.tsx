"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, supabaseConfigured, CaseRow, STAGE2_PRICE_NIS, getCase, startCheckout } from "@/lib/supabase";
import FeeCalculator from "@/components/FeeCalculator";


function UpgradeContent() {
  const params = useSearchParams();
  const caseId = params.get("case");
  const paymentFailed = params.get("payment") === "failed";
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!caseId || !supabaseConfigured) return;
    getCase(caseId).then((data) => setCaseRow(data));
  }, [caseId]);

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
