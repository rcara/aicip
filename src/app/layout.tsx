import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Fraunces, Source_Sans_3 } from "next/font/google";

import { AccountMenu } from "@/components/account-menu";
import { TextSizeControl } from "@/components/text-size";
import { getMessages } from "@/lib/i18n";
import { setLocaleAction } from "@/modules/identity/locale";
import { readLocale } from "@/modules/identity/session";

import "./globals.css";

const source = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Soft Skills Academy",
    template: "%s — Soft Skills Academy",
  },
  description:
    "Simulation courte pour s'exercer aux conversations difficiles. Indicateur pédagogique, données privées, coach simulé.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await readLocale();
  const messages = getMessages(locale);

  return (
    <html lang={locale} className={`${source.variable} ${fraunces.variable} h-full`}>
      <body className="min-h-full text-[1.05rem] leading-relaxed antialiased">
        <a className="skip-link" href="#contenu">
          {messages.skip}
        </a>
        <header className="border-b border-line/80 bg-paper-2/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <span aria-hidden className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-paper-2">
                <span className="flex gap-1">
                  <span className="h-3.5 w-1 rounded-full bg-paper-2" />
                  <span className="h-3.5 w-1 rounded-full bg-accent" />
                </span>
              </span>
              <span>
                <span className="block font-serif text-lg leading-none tracking-tight">
                  {messages.meta.title}
                </span>
                <span className="hidden text-sm text-ink-soft sm:block">Pause · Décider · Rejouer</span>
              </span>
            </Link>
            <nav aria-label={messages.nav.scenarios} className="flex items-center gap-4 text-sm">
              <Link className="underline-offset-4 hover:underline" href="/scenarios">
                {messages.nav.scenarios}
              </Link>
              <AccountMenu signIn={messages.nav.signIn} signOut={messages.nav.signOut} />
            </nav>
          </div>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-12">
          {children}
        </main>
        <footer className="border-t border-line">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl">{messages.footer.note}</p>
            <div className="flex flex-wrap items-center gap-4">
              <Link className="underline-offset-4 hover:underline" href="/confidentialite">
                {messages.footer.privacy}
              </Link>
              <TextSizeControl larger={messages.footer.larger} smaller={messages.footer.smaller} />
              <form action={setLocaleAction} className="flex gap-2">
                <button
                  className="rounded-full border border-line px-3 py-1"
                  name="locale"
                  type="submit"
                  value="fr"
                >
                  FR
                </button>
                <button
                  className="rounded-full border border-line px-3 py-1"
                  name="locale"
                  type="submit"
                  value="en"
                >
                  EN
                </button>
              </form>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
