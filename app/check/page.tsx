"use client";

import { useState } from "react";
import { supabase, supabaseConfigured, PRICE_TIERS, tierForDecisionsCount } from "@/lib/supabase";

const CARDCOM_LINKS: Record<1 | 2 | 3, string | undefined> = {
  1: process.env.NEXT_PUBLIC_CARDCOM_LINK_TIER1,
  2: process.env.NEXT_PUBLIC_CARDCOM_LINK_TIER2,
  3: process.env.NEXT_PUBLIC_CARDCOM_LINK_TIER3,
};

type Lookup =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "not_found" }
  | { state: "found"; committee: string; count: number; tier: 1 | 2 | 3; classified: boolean };

export default function CheckPage() {
  const [committeeInput, setCommitteeInput] = useState("");
  const [lookup, setLookup] = useState<Lookup>({ state: "idle" });
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    if (!committeeInput.trim()) return;
    setLookup({ state: "loading" });
    setError(null);

    if (!supabaseConfigured) {
      setError("המערכת עדיין לא מחוברת למאגר הנתונים. נסו שוב מאוחר יותר.");
      setLookup({ state: "idle" });
      return;
    }

    const { data, error: qError } = await supabase
      .from("committees")
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

  async function handlePay() {
    if (lookup.state !== "found") return;
    if (!contactPhone.trim() && !contactEmail.trim()) {
      setError("נא להזין טלפון או אימייל לקבלת הדוח");
      return;
    }
    const cardcomUrl = CARDCOM_LINKS[lookup.tier];
    if (!cardcomUrl) {
      setError("התשלום המקוון עדיין לא מוגדר לשלב מחיר זה. אנא צרו קשר בוואטסאפ.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from("cases")
        .insert({
          committee_name: lookup.committee,
          address: address || null,
          contact_name: contactName || null,
          contact_phone: contactPhone || null,
          contact_email: contactEmail || null,
          price_nis: PRICE_TIERS[lookup.tier],
          paid: false,
          status: "pending_payment",
        })
        .select("id")
        .single();

      if (insertError || !data) throw insertError ?? new Error("insert failed");

      const siteUrl = "https://haimetkin-lgtm.github.io/hetel-hasbaha";
      const url = new URL(cardcomUrl);
      url.searchParams.set("SuccessRedirectUrl", `${siteUrl}/report/?case=${data.id}`);
      url.searchParams.set("FailedRedirectUrl", `${siteUrl}/check/?payment=failed`);
      window.location.href = url.toString();
    } catch {
      setError("אירעה שגיאה. נסו שוב, או צרו קשר בוואטסאפ.");
      setSubmitting(false);
    }
  }

  return (
    <main className="max-w-lg mx-auto px-4 py-10">
      <h1 className="text-xl font-bold text-[#14364f] mb-1">בדיקת סבירות ראשונית לדרישת היטל השבחה</h1>
      <p className="text-sm text-gray-500 mb-6">שלב 1: מזינים את הוועדה המקומית שממנה קיבלתם את הדרישה</p>

      <form onSubmit={handleLookup} className="flex gap-2 mb-4">
        <input
          type="text"
          value={committeeInput}
          onChange={(e) => setCommitteeInput(e.target.value)}
          placeholder="למשל: תל אביב-יפו, הרצליה, רעננה..."
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e5a8a]"
        />
        <button
          type="submit"
          className="bg-[#1e5a8a] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#14364f]"
        >
          חיפוש
        </button>
      </form>

      {lookup.state === "loading" && <p className="text-sm text-gray-500">מחפש...</p>}
      {lookup.state === "not_found" && (
        <p className="text-sm text-[#8a2f22]">לא מצאנו ועדה בשם הזה. נסו לבדוק את האיות, או צרו קשר בוואטסאפ.</p>
      )}

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
              הוועדה הזו טרם סווגה במלואה — הדוח שלכם יופק תוך זמן קצר וישלח אליכם, ולא יוצג באופן מיידי.
            </p>
          )}

          {error && <p className="text-sm text-[#8a2f22] mb-3">{error}</p>}

          <button
            onClick={handlePay}
            disabled={submitting}
            className="w-full bg-[#1e5a8a] text-white font-bold py-3 rounded-lg hover:bg-[#14364f] disabled:opacity-50"
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
