"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, supabaseConfigured, Stage2CaseRow } from "@/lib/supabase";

const ANALYZE_STAGE2_URL = "https://insure.co.il/api/machria/analyze-stage2";

function UploadContent() {
  const params = useSearchParams();
  const case2Id = params.get("case2");
  const [caseRow, setCaseRow] = useState<Stage2CaseRow | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "not_found">("loading");
  const [letterFile, setLetterFile] = useState<File | null>(null);
  const [assessmentFile, setAssessmentFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const markedPaidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!case2Id || !supabaseConfigured) return;
    supabase
      .from("machria_stage2_cases")
      .select("*")
      .eq("id", case2Id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setLoadState("not_found");
          return;
        }
        setCaseRow(data as Stage2CaseRow);
        setLoadState("ok");
      });
  }, [case2Id]);

  // חוזרים מקארדקום עם תשלום מוצלח, מסמנים paid ברגע שהתיק נטען
  useEffect(() => {
    if (!case2Id || !caseRow || caseRow.paid) return;
    if (markedPaidRef.current === case2Id) return;
    markedPaidRef.current = case2Id;
    supabase
      .from("machria_stage2_cases")
      .update({ paid: true, status: "pending_upload" })
      .eq("id", case2Id)
      .then(() => setCaseRow((prev) => (prev ? { ...prev, paid: true, status: "pending_upload" } : prev)));
  }, [case2Id, caseRow]);

  async function handleUpload() {
    if (!case2Id || !letterFile || !assessmentFile) {
      setError("נא לצרף את שני הקבצים");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const letterPath = `${case2Id}/letter-${letterFile.name}`;
      const assessmentPath = `${case2Id}/assessment-${assessmentFile.name}`;

      const [letterUp, assessmentUp] = await Promise.all([
        supabase.storage.from("machria-files").upload(letterPath, letterFile, { upsert: true }),
        supabase.storage.from("machria-files").upload(assessmentPath, assessmentFile, { upsert: true }),
      ]);
      if (letterUp.error) throw letterUp.error;
      if (assessmentUp.error) throw assessmentUp.error;

      const { error: updateError } = await supabase
        .from("machria_stage2_cases")
        .update({
          letter_file_path: letterPath,
          assessment_file_path: assessmentPath,
          status: "uploaded",
        })
        .eq("id", case2Id);
      if (updateError) throw updateError;

      setDone(true);
      fetch(ANALYZE_STAGE2_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ case2_id: case2Id }),
      }).catch(() => {});
    } catch {
      setError("אירעה שגיאה בהעלאה. נסו שוב, או צרו קשר בוואטסאפ.");
    }
    setUploading(false);
  }

  if (!case2Id) return <p className="text-gray-600">לא נמצא מזהה תיק. אם הגעתם מדף תשלום, נסו לרענן.</p>;
  if (loadState === "loading") return <p className="text-gray-500">טוען...</p>;
  if (loadState === "not_found") {
    return (
      <p className="text-[#8a2f22]">
        לא הצלחנו לאתר את התיק. אם ביצעתם תשלום, פנו אלינו בוואטסאפ, התשלום בוודאי התקבל.
      </p>
    );
  }

  if (done || caseRow?.status === "uploaded" || caseRow?.status === "analyzing" || caseRow?.status === "ready" || caseRow?.status === "sent") {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
        <div className="text-4xl mb-3">✓</div>
        <h2 className="text-lg font-bold text-[#14364f] mb-2">המסמכים התקבלו, תודה!</h2>
        <p className="text-gray-600 text-sm">
          המערכת מכינה עבורכם את מסמך עיקרי הדברים. הוא יישלח אליכם{caseRow?.contact_email ? ` לכתובת ${caseRow.contact_email}` : ""} בהמשך.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#14364f] mb-1">העלאת מסמכים</h1>
      <p className="text-sm text-gray-500 mb-6">שני קבצים: מכתב הדרישה מהוועדה, ושומת הוועדה</p>

      <div className="space-y-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">מכתב הדרישה מהוועדה</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setLetterFile(e.target.files?.[0] || null)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">שומת הוועדה</label>
          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={(e) => setAssessmentFile(e.target.files?.[0] || null)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2"
          />
        </div>
      </div>

      {error && <p className="text-sm text-[#8a2f22] mb-3">{error}</p>}

      <button
        onClick={handleUpload}
        disabled={uploading || !letterFile || !assessmentFile}
        className="w-full bg-[#1e5a8a] text-white font-bold py-3 rounded-lg hover:bg-[#14364f] disabled:opacity-50 cursor-pointer disabled:cursor-default"
      >
        {uploading ? "מעלה..." : "שליחת המסמכים"}
      </button>
    </div>
  );
}

export default function UploadPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <Suspense fallback={<p className="text-gray-500">טוען...</p>}>
        <UploadContent />
      </Suspense>
    </main>
  );
}
