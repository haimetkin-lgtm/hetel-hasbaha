export default function Home() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <section className="text-center mb-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[#14364f] leading-snug mb-3">
          קיבלת דרישת היטל השבחה?
          <br />
          בדוק לפני שאתה משלם או מזמין בדיקה מקצועית מלאה.
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto leading-relaxed">
          המערכת מאתרת עבורך הכרעות של שמאים מכריעים שעשויות להיות רלוונטיות לפי הוועדה המקומית,
          התכניות והסוגיות שנדונו, ומראה מה נקבע בפועל במקרים דומים: מה טענה הוועדה, מה טען בעל
          הנכס, ומה הכריע השמאי המכריע. בדיקה ראשונית שמרכזת עבורך את ההכרעות הרלוונטיות, במקום
          חיפוש עצמאי בעשרות מסמכים במאגר הממשלתי.
        </p>
        <p className="text-xs text-gray-500 max-w-xl mx-auto mt-3 leading-relaxed">
          חשוב לדעת: הבדיקה הראשונית אינה שומה נגדית ואינה קובעת שהחיוב שגוי. היא מרכזת הכרעות
          וסוגיות שעשויות להצדיק בדיקה מלאה של שומת הוועדה.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/hetel-hasbaha/check/"
            className="inline-block bg-[#1e5a8a] hover:bg-[#14364f] text-white font-bold px-6 py-3 rounded-lg transition-colors"
          >
            בדוק את הוועדה שלך, החל מ-280 ₪
          </a>
          <a
            href="/hetel-hasbaha/sample-report.html"
            target="_blank"
            className="inline-block border-2 border-[#1e5a8a] text-[#1e5a8a] hover:bg-[#eef4f9] font-bold px-6 py-3 rounded-lg transition-colors"
          >
            צפה בדוגמת דוח
          </a>
        </div>
        <p className="text-xs text-gray-400 mt-2">המחיר נקבע לפי היקף ההכרעות בוועדה שלך, ומוצג לפני התשלום</p>
      </section>

      <section className="grid sm:grid-cols-3 gap-4 mb-10">
        {[
          { title: "1. בוחר ועדה", body: "מזין את הוועדה המקומית שממנה קיבלת את הדרישה" },
          { title: "2. מקבל תמונת מצב", body: "דוח ברור שמציג הכרעות רלוונטיות, טענות שהתקבלו או נדחו, ונקודות שכדאי לבדוק" },
          { title: "3. מחליט אם להמשיך", body: "רואה אם יש אינדיקציה שמצדיקה בדיקה מלאה של שומת הוועדה" },
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
          <li>הכרעות שמאים מכריעים רלוונטיות מהוועדה שלך</li>
          <li>לכל הכרעה: מה טענה הוועדה, מה טען בעל הנכס, ומה נקבע בפועל</li>
          <li>הפרדה ברורה בין סכום ההשבחה, היטל ההשבחה והסכום לתשלום בפועל</li>
          <li>קישור למסמך המקורי במאגר הממשלתי, לבקרה שלך</li>
          <li>אפשרות להמשך לבדיקה מקצועית של שומת הוועדה, להכנת מסמך עיקרי דברים ולשיחת ייעוץ אישית עם חיים אטקין</li>
        </ul>
      </section>

      <section className="mb-10">
        <div className="font-bold text-[#14364f] mb-3 text-center">למי השירות מתאים?</div>
        <ul className="text-sm text-gray-700 space-y-1.5 list-disc pr-5 max-w-xl mx-auto">
          <li><strong>בעלי נכסים והציבור הרחב:</strong> האם יש הצדקה לבדוק לפני שממשיכים</li>
          <li><strong>עורכי דין:</strong> איתור מהיר של הכרעות וטענות רלוונטיות</li>
          <li><strong>שמאי מקרקעין:</strong> מחקר וסינון הכרעות לפי ועדה וסוגיה</li>
          <li><strong>יזמים ובעלי מקרקעין:</strong> בדיקת חשיפה להיטל לפני עסקה</li>
        </ul>
        <p className="text-xs text-gray-400 text-center max-w-xl mx-auto mt-3">
          הבדיקה אינה מחליפה שומה, ייעוץ משפטי או בדיקה מקצועית מלאה.
        </p>
      </section>

      <section className="text-center text-sm text-gray-500">
        <p>
          המועדים להשגה על שומת הוועדה קצרים, ובמקרים רבים עומדים על{" "}
          <strong className="text-[#8a2f22]">45 יום בלבד</strong> ממועד קבלת השומה. אל תמתין לסוף
          התקופה.
        </p>
      </section>
    </main>
  );
}
