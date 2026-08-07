"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, supabaseConfigured, CaseRow } from "@/lib/supabase";
import FeeCalculator from "@/components/FeeCalculator";

const GENERATE_REPORT_URL = "https://insure.co.il/api/machria/generate-report";

function ReportContent() {
  const params = useSearchParams();
  const caseId = params.get("case");
  const [caseRow, setCaseRow] = useState<CaseRow | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "not_found" | "unconfigured">("loading");

  const loadCase = async () => {
    if (!caseId) return;
    const { data, error } = await supabase.from("machria_cases").select("*").eq("id", caseId).single();
    if (error || !data) setLoadState("not_found");
    else {
      setCaseRow(data as CaseRow);
      setLoadState("ok");
    }
  };

  useEffect(() => {
    if (!caseId) return;
    if (!supabaseConfigured) {
      setLoadState("unconfigured");
      return;
    }
    loadCase();
  }, [caseId]);

  // מפעיל את הפקת הדוח פעם אחת, כשהתיק נטען ועדיין ממתין לתשלום
  const triggeredRef = useRef<string | null>(null);
  useEffect(() => {
    if (!caseId || !caseRow) return;
    if (caseRow.status !== "pending_payment") return;
    if (triggeredRef.current === caseId) return;
    triggeredRef.current = caseId;
    fetch(GENERATE_REPORT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ case_id: caseId }),
    }).finally(loadCase);
  }, [caseId, caseRow]);

  // בזמן שהוועדה עדיין מסווגת, בודקים שוב כל חצי דקה
  useEffect(() => {
    if (caseRow?.status !== "queued_for_classification") return;
    const interval = setInterval(loadCase, 30000);
    return () => clearInterval(interval);
  }, [caseRow?.status]);

  if (!caseId) {
    return <p className="text-gray-600">לא נמצא מזהה תיק. אם הגעתם מדף תשלום, נסו לרענן את הדף.</p>;
  }
  if (loadState === "loading") return <p className="text-gray-500">טוען את פרטי התיק...</p>;
  if (loadState === "unconfigured" || loadState === "not_found") {
    return (
      <p className="text-[#8a2f22]">
        לא הצלחנו לאתר את התיק אוטומטית. אם ביצעתם תשלום, פנו אלינו בוואטסאפ ונאתר אותו ידנית, התשלום בוודאי התקבל.
      </p>
    );
  }

  if ((caseRow?.status === "ready" || caseRow?.status === "sent") && caseRow.report_html) {
    return (
      <iframe
        srcDoc={caseRow.report_html}
        title="הדוח שלך"
        className="w-full border-0"
        style={{ height: "85vh", minHeight: 600 }}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
      <div className="text-4xl mb-3">✓</div>
      <h2 className="text-lg font-bold text-[#14364f] mb-2">התשלום התקבל, תודה!</h2>
      <p className="text-gray-600 text-sm mb-4">
        ועדה: <strong>{caseRow?.committee_name}</strong>
      </p>
      <div className="bg-[#eef4f9] rounded-lg px-4 py-3 text-sm text-[#14364f] mb-4">
        הדוח שלכם בהכנה. הוא יישלח אליכם{caseRow?.contact_email ? ` לכתובת ${caseRow.contact_email}` : ""}
        {caseRow?.contact_phone ? ` ובוואטסאפ` : ""} תוך זמן קצר, בדרך כלל תוך שעה. הדף הזה יתעדכן אוטומטית.
      </div>
      <a
        href={`https://wa.me/972523728828?text=${encodeURIComponent(`שלום, שילמתי עבור בדיקה (מספר תיק ${caseId}) ואשמח לעדכון`)}`}
        target="_blank"
        className="inline-flex items-center gap-2 bg-[#25d366] text-white text-sm font-medium px-4 py-2 rounded-full"
      >
        עדכון בוואטסאפ
      </a>
    </div>
  );
}

export default function ReportPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <FeeCalculator />
      <Suspense fallback={<p className="text-gray-500">טוען...</p>}>
        <ReportContent />
      </Suspense>
    </main>
  );
}
