export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[#14364f] leading-snug mb-3">
          קיבלת דרישת היטל השבחה?
          <br />
          בדקו לפני שאתם משלמים או פונים לשמאי.
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
          המערכת מאתרת עבורכם הכרעות של שמאים מכריעים באותה ועדה מקומית, ומראה מה נקבע בפועל
          במקרים דומים: מה טענה הוועדה, מה טען בעל הנכס, ומה הכריע השמאי המכריע. בדיקה ראשונית
          שחוסכת שעות חיפוש במאגר הממשלתי — בתוצאה מרוכזת ומוסברת.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/hetel-hasbaha/check/"
            className="inline-block bg-[#1e5a8a] hover:bg-[#14364f] text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            בדקו את הוועדה שלכם — החל מ-280 ₪
          </a>
          <a
            href="/hetel-hasbaha/sample-report.html"
            target="_blank"
            className="inline-block border-2 border-[#1e5a8a] text-[#1e5a8a] hover:bg-[#eef4f9] font-bold px-6 py-3 rounded-lg transition-colors"
          >
            צפו בדוגמת דוח
          </a>
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { title: "1. בוחרים ועדה", body: "מזינים את הוועדה המקומית שממנה קיבלתם את הדרישה" },
          { title: "2. מקבלים דוח", body: "המערכת מאתרת הכרעות רלוונטיות ומרכזת אותן בשבילכם" },
          { title: "3. מחליטים", body: "אתם רואים תמונה מלאה, ומחליטים אם שווה לבדוק את השומה לעומק" },
        ].map((s) => (
          <div key={s.title} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
            <div className="font-bold text-[#1e5a8a] mb-1">{s.title}</div>
            <div className="text-sm text-gray-600">{s.body}</div>
          </div>
        ))}
      </section>

      <section className="bg-[#eef4f9] border border-[#b9cfe0] rounded-xl p-5 mb-10">
        <div className="font-bold text-[#14364f] mb-2">מה בעצם מקבלים?</div>
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pr-5">
          <li>הכרעות שמאים מכריעים רלוונטיות מהוועדה שלכם</li>
          <li>לכל הכרעה: מה טענה הוועדה, מה טען בעל הנכס, ומה נקבע בפועל</li>
          <li>הפרדה ברורה בין סכום ההשבחה, היטל ההשבחה והסכום לתשלום בפועל</li>
          <li>קישור למסמך המקורי במאגר הממשלתי, לבקרה שלכם</li>
          <li>אפשרות המשך לבדיקה מקצועית מלאה של השומה שלכם, עם שיחת ייעוץ עם חיים אטקין</li>
        </ul>
      </section>

      <section className="text-center text-sm text-gray-500">
        <p>
          לרשותכם בדרך כלל <strong className="text-[#8a2f22]">45 יום בלבד</strong> ממועד קבלת השומה
          לפעול. אל תמתינו לסוף התקופה.
        </p>
      </section>
    </main>
  );
}
