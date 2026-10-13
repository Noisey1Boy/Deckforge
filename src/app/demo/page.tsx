import type { Metadata } from 'next';
import Link from 'next/link';
import { DemoApp } from '@/components/pitch/DemoApp';

export const metadata: Metadata = {
  title: 'Live Demo — Voice Agent Platform | DeckForge AI',
  description:
    'Interactive demo of the voice-agent platform: call Layla, watch the real recorded conversation with a live agent tool trace, then explore the tool playground and dashboard.',
};

export default function DemoPage() {
  return (
    <div className="ps-scope flex min-h-screen flex-col bg-[color:var(--stg-cream)]">
      <header className="flex h-12 shrink-0 items-center gap-3 border-b-2 border-[color:var(--stg-ink)] bg-[color:var(--stg-ink)] px-4 text-[color:var(--stg-cream)] sm:px-6">
        <Link href="/pitch" className="stg-label text-[9px] text-white/60 transition-colors hover:text-white">← BACK TO THE PITCH</Link>
        <span className="stg-label text-[9px] text-[color:var(--ps-link-dark)]">LIVE DEMO · THE VOICE AGENT PLATFORM</span>
        <span className="stg-label ml-auto hidden text-[8px] text-white/40 sm:block">SIMULATED UI · REAL RECORDED VOICE · ILLUSTRATIVE DATA</span>
      </header>
      <main className="flex min-h-0 flex-1 flex-col px-4 py-5 sm:px-8">
        <h1 className="stg-display text-2xl uppercase leading-none text-[color:var(--stg-ink)] sm:text-3xl">
          Talk to <span className="text-[color:var(--stg-yellow-deep)]">Layla.</span>
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[color:var(--stg-ink)]/70">
          The product we’re proposing, as a clickable mock: one agent that answers on phone, WhatsApp, Telegram
          and web — books appointments, sends email, updates sheets — with every tool call visible.
        </p>
        <div className="mt-5 flex min-h-0 flex-1 items-start justify-center">
          <div className="w-full max-w-5xl">
            <DemoApp />
          </div>
        </div>
      </main>
      <footer className="mt-auto border-t-2 border-[color:var(--stg-yellow)] bg-[color:var(--stg-ink)] px-4 py-3 text-center text-[color:var(--stg-cream)] sm:px-6">
        <p className="stg-label text-[8px] text-white/50">
          VOICE AGENT PLATFORM · CONCEPT DEMO · BUILT WITH DECKFORGE AI — <Link href="/create" className="text-[color:var(--ps-link-dark)] hover:underline">MAKE YOUR OWN PITCH</Link>
        </p>
      </footer>
    </div>
  );
}
