"use client";

import { useState } from "react";

// תקנות התכנון והבניה (שכרו של שמאי מכריע ושמאי מייעץ), תשס"ט-2009, סעיף 2(ב): מדרגות
// 3%/2%/1%/0.5%, רצפה 2,000 ₪ ותקרה 100,000 ₪ למחלוקת בודדת (לפני מע"מ). סעיף 5(א):
// חלוקה שווה כברירת מחדל בין המבקש למשיב. סעיף 9: מע"מ מתווסף בנפרד (18% נכון לתקנות אלה).
const VAT_RATE = 0.18;
const FLOOR_NIS = 2000;
const CEILING_NIS = 100000;

function calcMachriaFee(disputedAmount: number) {
  const portion1 = Math.min(disputedAmount, 500000);
  const portion2 = Math.max(0, Math.min(disputedAmount, 1000000) - 500000);
  const portion3 = Math.max(0, Math.min(disputedAmount, 2000000) - 1000000);
  const portion4 = Math.max(0, disputedAmount - 2000000);
  const rawFee = portion1 * 0.03 + portion2 * 0.02 + portion3 * 0.01 + portion4 * 0.005;
  const cappedFee = Math.min(Math.max(rawFee, FLOOR_NIS), CEILING_NIS);
  const vat = cappedFee * VAT_RATE;
  const totalWithVat = cappedFee + vat;
  return {
    rawFee,
    cappedFee,
    floorApplied: rawFee < FLOOR_NIS,
    ceilingApplied: rawFee > CEILING_NIS,
    vat,
    totalWithVat,
    perPartyShare: totalWithVat / 2,
  };
}

const fmt = (n: number) => Math.round(n).toLocaleString("he-IL") + " ₪";

export default function FeeCalculator() {
  const [amount, setAmount] = useState("");
  const parsed = Number(amount.replace(/[^\d]/g, ""));
  const valid = amount !== "" && parsed > 0;
  const result = valid ? calcMachriaFee(parsed) : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="font-bold text-[#14364f] mb-1">מחשבון שכר טרחת שמאי מכריע</div>
      <p className="text-sm text-gray-600 mb-3">
        הזינו את סכום היטל ההשבחה השנוי במחלוקת, ותקבלו הערכה של שכר הטרחה שייקבע לשמאי המכריע.
      </p>
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="לדוגמה: 400,000"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#1e5a8a]"
        />
        <span className="self-center text-sm text-gray-500">₪</span>
      </div>
      {result && (
        <div className="bg-[#eef4f9] border border-[#b9cfe0] rounded-lg px-4 py-3 text-sm text-[#14364f] space-y-1">
          <div className="flex justify-between">
            <span>שכר טרחה (לפני מע״מ)</span>
            <strong>{fmt(result.cappedFee)}</strong>
          </div>
          <div className="flex justify-between">
            <span>מע״מ (18%)</span>
            <strong>{fmt(result.vat)}</strong>
          </div>
          <div className="flex justify-between border-t border-[#b9cfe0] pt-1 mt-1">
            <span>סה״כ שכר טרחה כולל מע״מ</span>
            <strong>{fmt(result.totalWithVat)}</strong>
          </div>
          <div className="flex justify-between text-[#1e5a8a] font-bold">
            <span>המחצית שלך (המבקש)</span>
            <strong>{fmt(result.perPartyShare)}</strong>
          </div>
          {result.floorApplied && (
            <div className="text-xs text-gray-500 pt-1">הופעלה רצפת שכר הטרחה של 2,000 ₪.</div>
          )}
          {result.ceilingApplied && (
            <div className="text-xs text-gray-500 pt-1">הופעלה תקרת שכר הטרחה של 100,000 ₪.</div>
          )}
        </div>
      )}
      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
        התוצאה המוצגת היא מחצית משכר טרחת השמאי המכריע כולל מע״מ, לפי חלוקה שווה כברירת מחדל
        בין הצדדים, כשהמחצית השנייה משולמת על ידי הוועדה המקומית (המשיבה). הסכום אינו כולל את
        שכרו של השמאי מטעמך, שם מנעד המחירים משתנה. המחשבון נבנה על בסיס תקנות התכנון והבניה
        (שכרו של שמאי מכריע ושמאי מייעץ), תשס״ט-2009, ומיועד להערכה כללית בלבד.
      </p>
    </div>
  );
}
