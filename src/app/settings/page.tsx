'use client';

import { SiteHeader } from '@/components/app/SiteHeader';
import { SiteFooter } from '@/components/app/SiteFooter';
import { SettingsView } from '@/components/app/settings/SettingsView';

export default function SettingsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <SiteHeader />
      <main className="flex flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
          <p className="stg-label flex items-center gap-2.5 text-[color:var(--stg-ink)]/60">
            <span className="inline-block h-2 w-2 bg-[color:var(--stg-yellow)]" aria-hidden />
            Backstage
          </p>
          <h1 className="stg-display mt-3 text-4xl uppercase leading-[0.95] text-[color:var(--stg-ink)] sm:text-5xl">
            Settings.
          </h1>
          <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-[color:var(--stg-ink)]/70 sm:text-base">
            Account, security and stage preferences. Everything here applies to this browser —
            decks stay wherever you saved them.
          </p>
          <div className="mt-10">
            <SettingsView />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
