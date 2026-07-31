import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const SITE_URL = "https://haimetkin-lgtm.github.io/hetel-hasbaha";

const TITLE = "בדיקת סבירות ראשונית לדרישת היטל השבחה | בודקים לפני שמשלמים";
const DESCRIPTION =
  "קיבלת דרישת היטל השבחה? בדקו תוך דקות מה קבעו שמאים מכריעים בהכרעות דומות באותה ועדה מקומית, לפני שאתם מחליטים אם לשלם או לבדוק. מבית השמאי חיים אטקין, מחבר הספר \"בועת נדל\"ן\".";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s | בדיקת היטל השבחה" },
  description: DESCRIPTION,
  applicationName: "בדיקת היטל השבחה",
  authors: [{ name: "חיים אטקין, שמאי מקרקעין" }],
  creator: "חיים אטקין",
  publisher: "חיים אטקין, שמאות מקרקעין",
  category: "נדל\"ן",
  alternates: { canonical: "/" },
  icons: { icon: "/favicon.svg" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 },
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "בדיקת היטל השבחה",
    locale: "he_IL",
    type: "website",
  },
};

function BrandLogo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 150 150" role="img" aria-label="לוגו">
        <title>לוגו</title>
        <circle cx="75" cy="75" r="60" fill="none" stroke="#1e5a8a" strokeWidth="7" />
        <rect x="53" y="42" width="44" height="58" rx="5" fill="none" stroke="#1e5a8a" strokeWidth="4.5" />
        <circle cx="90" cy="93" r="16" fill="#2e8b57" />
        <path d="M82 93 L88 99 L98 86" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex flex-col leading-tight">
        <span className="text-sm font-bold tracking-tight text-gray-900">בדיקת היטל השבחה</span>
        <span className="text-xs text-amber-600">בודקים לפני שמשלמים</span>
      </div>
    </div>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className="min-h-screen bg-gray-50">
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
            <a href="/hetel-hasbaha/"><BrandLogo /></a>
            <nav className="flex items-center gap-4 text-xs text-gray-500">
              <a href="mailto:haimetkin@gmail.com" className="hover:text-gray-800 transition-colors">צור קשר</a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100 mt-2">
          חיים אטקין, שמאי מקרקעין, אנליסט נדל״ן, מומחה לנדל״ן וחוקר שוק · מייסד ובעלים של <span className="font-medium text-gray-500">בית שמאי</span>, בית הספר לפרקטיקה שמאית
          <br />
          © {new Date().getFullYear()} חיים אטקין · כל הזכויות שמורות · ט.ל.ח
        </footer>
        <Script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js" strategy="afterInteractive" />
        <Script
          id="free_accessibility_plugin_script"
          src="https://accessibility.f-static.com/site/free-accessibility-plugin/accessibility.min.js?lan=he&place=bottom-right&distance=50"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
