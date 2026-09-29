import { FirebaseAnalytics } from "@/components/providers/firebase-analytics";
import { SiteFooter } from "@/modules/marketing/components/site-footer";
import { SiteHeader } from "@/modules/marketing/components/site-header";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-background px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
      <FirebaseAnalytics />
    </div>
  );
}
