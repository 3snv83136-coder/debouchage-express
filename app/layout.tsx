import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { APP_NAME, APP_TAGLINE } from "@/constants";
import { SplashScreen } from "@/components/SplashScreen";

export const metadata: Metadata = {
  title: APP_NAME,
  description: `${APP_NAME} — ${APP_TAGLINE}`,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <SplashScreen />
        <header className="sticky top-0 z-10 bg-brand-gradient text-white shadow-lg shadow-brand/20">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt={APP_NAME}
                width={40}
                height={40}
                priority
                className="h-9 w-9 rounded-lg bg-white/90 object-contain p-0.5 shadow-sm"
              />
              <span className="flex flex-col leading-tight">
                <span className="text-base font-bold tracking-tight">{APP_NAME}</span>
                <span className="text-[11px] text-brand-light/90">{APP_TAGLINE}</span>
              </span>
            </Link>
            <nav className="flex items-center gap-2">
              <Link
                href="/historique"
                className="rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/25"
              >
                Historique
              </Link>
              <Link
                href="/intervention/nouvelle"
                className="rounded-full bg-accent px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-dark"
              >
                + Intervention
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      </body>
    </html>
  );
}
