"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, supabaseConfigured, Stage2CaseRow } from "@/lib/supabase";

function ArgumentContent() {
  const params = useSearchParams();
  const case2Id = params.get("case2");
  const [caseRow, setCaseRow] = useState<Stage2CaseRow | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ok" | "not_found">("loading");

  const loadCase = () => {
    if (!case2Id) return;
    supabase
      .from("machria_stage2_cases")
      .select("*")
      .eq("id", case2Id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) setLoadState("not_found");
        else {
          setCaseRow(data as Stage2CaseRow);
          setLoadState("ok");
        }
      });
  };

  useEffect(() => {
    if (!case2Id || !supabaseConfigured) return;
    loadCase();
  }, [case2Id]);

  useEffect(() => {
    if (caseRow?.status !== "analyzing" && caseRow?.status !== "uploaded") return;
    const interval = setInterval(loadCase, 20000);
    return () => clearInterval(interval);
  }, [caseRow?.status]);

  if (!case2Id) return <p className="text-gray-600">לא נמצא מזהה תיק.</p>;
  if (loadState === "loading") return <p className="text-gray-500">טוען...</p>;
  if (loadState === "not_found") {
    return (
      <p className="text-[#8a2f22]">
        לא הצלחנו לאתר את התיק. פנו אלינו בוואטסאפ.
      </p>
    );
  }

  if ((caseRow?.status === "ready" || caseRow?.status === "sent") && caseRow.argument_document) {
    return (
      <iframe
        srcDoc={caseRow.argument_document}
        title="עיקרי דברים"
        className="w-full border-0"
        style={{ height: "85vh", minHeight: 600 }}
      />
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm text-center">
      <div className="text-4xl mb-3">⏳</div>
      <h2 className="text-lg font-bold text-[#14364f] mb-2">המסמך בהכנה</h2>
      <p className="text-gray-600 text-sm">הדף הזה יתעדכן אוטומטית כשהמסמך מוכן.</p>
    </div>
  );
}

export default function ArgumentPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <Suspense fallback={<p className="text-gray-500">טוען...</p>}>
        <ArgumentContent />
      </Suspense>
    </main>
  );
}
