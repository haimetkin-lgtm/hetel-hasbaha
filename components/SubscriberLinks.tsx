"use client";

import { useSession } from "@/lib/subscriptions";

// שני הכפתורים: רכישת מנוי וכניסת מנויים (למי שמחובר: האזור האישי)
export default function SubscriberLinks({ variant }: { variant: "header" | "hero" }) {
  const { session, loading } = useSession();
  const loggedIn = !loading && !!session;
  const enterHref = loggedIn ? "/hetel-hasbaha/account/" : "/hetel-hasbaha/login/";
  const enterLabel = loggedIn ? "האזור האישי" : "כניסת מנויים";

  if (variant === "header") {
    return (
      <>
        <a href={enterHref} className="hover:text-gray-800 transition-colors">{enterLabel}</a>
        <a
          href="/hetel-hasbaha/subscribe/"
          className="bg-[#1e5a8a] text-white px-2.5 py-1.5 rounded-md font-medium hover:bg-[#14364f] transition-colors"
        >
          רכישת מנוי
        </a>
      </>
    );
  }

  return (
    <div className="mt-4 flex flex-col sm:flex-row gap-3 justify-center">
      <a
        href="/hetel-hasbaha/subscribe/"
        className="inline-block bg-[#2e8b57] hover:bg-[#256f46] text-white font-bold px-6 py-3 rounded-lg transition-colors"
      >
        רכישת מנוי
      </a>
      <a
        href={enterHref}
        className="inline-block border-2 border-[#2e8b57] text-[#256f46] hover:bg-[#eef7f1] font-bold px-6 py-3 rounded-lg transition-colors"
      >
        {enterLabel}
      </a>
    </div>
  );
}
